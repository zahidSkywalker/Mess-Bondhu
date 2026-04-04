import db from '../db';

/**
 * ============================================================
 * INTERNAL HELPERS
 * ============================================================
 */

/** Convert a Date object to "YYYY-MM-DD" string */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Round a number to 2 decimal places safely */
function round2(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

/**
 * Build the month range prefix for Dexie between() queries.
 * "2025-01" → between("2025-01", "2025-01\uffff", true, true)
 * The \uffff trick captures all YYYY-MM-DD strings within that month
 * because they sort lexicographically.
 */
function monthRange(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return { start: prefix, end: prefix + '\uffff' };
}

/**
 * ============================================================
 * DATA FETCHER — Batch all IndexedDB reads for a month
 * ============================================================
 */

/**
 * Fetch all raw data needed for monthly calculations in parallel.
 * Uses date index with between() for efficient range queries,
 * then filters by messId in memory (date index doesn't include messId).
 *
 * Returns { meals, expenses, payments, activeMembers }
 */
async function getMonthData(messId, year, month) {
  const { start, end } = monthRange(year, month);

  const [rawMeals, rawExpenses, rawPayments, allMembers] = await Promise.all([
    db.meals.where('date').between(start, end, true, true).toArray(),
    db.expenses.where('date').between(start, end, true, true).toArray(),
    db.payments.where('date').between(start, end, true, true).toArray(),
    db.members.where('messId').equals(messId).toArray(),
  ]);

  // Scope everything to this mess
  const meals = rawMeals.filter((m) => m.messId === messId);
  const expenses = rawExpenses.filter((e) => e.messId === messId);
  const payments = rawPayments.filter((p) => p.messId === messId);

  // Active members: status === 'active' AND joined on or before last day of month
  const lastDayStr = toDateStr(new Date(year, month, 0));
  const activeMembers = allMembers.filter(
    (m) => m.status === 'active' && m.joiningDate <= lastDayStr
  );

  const activeMemberIds = new Set(activeMembers.map((m) => m.id));

  // Only include meals belonging to active members
  const activeMeals = meals.filter((m) => activeMemberIds.has(m.memberId));

  return { meals: activeMeals, expenses, payments, activeMembers };
}

/**
 * ============================================================
 * ACTIVE MEMBERS QUERY
 * ============================================================
 */

/**
 * Get active members for a specific mess and month.
 * Returns array of member objects.
 */
export async function getActiveMembersForMonth(messId, year, month) {
  const lastDayStr = toDateStr(new Date(year, month, 0));
  return db.members
    .where('messId')
    .equals(messId)
    .filter((m) => m.status === 'active' && m.joiningDate <= lastDayStr)
    .toArray();
}

/**
 * ============================================================
 * MEAL RATE CALCULATION
 * ============================================================
 */

/**
 * Calculate meal rate for a mess in a given month.
 *
 * Meal Rate = Total Bazar Cost / Total Meals
 *
 * This is the core formula used in Bangladeshi mess culture:
 * grocery (bazar) expenses are distributed proportionally
 * based on how many meals each member consumed.
 *
 * Returns { totalBazarCost, totalMeals, mealRate }
 */
export async function calculateMealRate(messId, year, month) {
  const { meals, expenses } = await getMonthData(messId, year, month);

  const totalBazarCost = expenses
    .filter((e) => e.category === 'bazar')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalMeals = meals.reduce((sum, m) => sum + (Number(m.mealCount) || 0), 0);

  const mealRate = totalMeals > 0 ? round2(totalBazarCost / totalMeals) : 0;

  return { totalBazarCost: round2(totalBazarCost), totalMeals, mealRate };
}

/**
 * ============================================================
 * PER-MEMBER DUE CALCULATION
 * ============================================================
 */

/**
 * Calculate detailed dues for every active member in a month.
 *
 * For each member:
 *   mealCost     = memberTotalMeals × mealRate
 *   rent         = member.rentAmount (fixed per member)
 *   sharedExpense = totalNonBazarExpenses / activeMemberCount
 *   serviceCharge = (totalAllExpenses × serviceChargePercent / 100) / activeMemberCount
 *   totalDue     = rent + mealCost + sharedExpense + serviceCharge
 *   balance      = totalPaid - totalDue
 *                  (positive = member has surplus, negative = member owes)
 *
 * Options:
 *   - serviceChargePercent: number (0-100), default 0
 *   - customMealRate: if provided, overrides calculated meal rate
 *   - mealRateMode: 'standard' | 'custom'
 *
 * Returns array of member breakdown objects sorted by name.
 */
export async function calculateMemberDues(messId, year, month, options = {}) {
  const {
    serviceChargePercent = 0,
    customMealRate = 0,
    mealRateMode = 'standard',
  } = options;

  const { meals, expenses, payments, activeMembers } = await getMonthData(
    messId,
    year,
    month
  );

  const memberCount = activeMembers.length;

  // ---- Aggregate expense totals ----
  const totalBazarCost = expenses
    .filter((e) => e.category === 'bazar')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalNonBazarCost = expenses
    .filter((e) => e.category !== 'bazar')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalAllExpenses = round2(totalBazarCost + totalNonBazarCost);

  // ---- Meal rate ----
  const totalMeals = meals.reduce((sum, m) => sum + (Number(m.mealCount) || 0), 0);
  const calculatedMealRate = totalMeals > 0 ? round2(totalBazarCost / totalMeals) : 0;
  const effectiveMealRate =
    mealRateMode === 'custom' && customMealRate > 0
      ? customMealRate
      : calculatedMealRate;

  // ---- Per-member shared costs ----
  const sharedExpensePerMember =
    memberCount > 0 ? round2(totalNonBazarCost / memberCount) : 0;

  const serviceChargeTotal = round2(
    (totalAllExpenses * Number(serviceChargePercent || 0)) / 100
  );
  const serviceChargePerMember =
    memberCount > 0 ? round2(serviceChargeTotal / memberCount) : 0;

  // ---- Per-member meal totals ----
  const memberMealMap = {};
  for (const meal of meals) {
    if (!memberMealMap[meal.memberId]) {
      memberMealMap[meal.memberId] = 0;
    }
    memberMealMap[meal.memberId] += Number(meal.mealCount) || 0;
  }

  // ---- Per-member payment totals ----
  const memberPaymentMap = {};
  for (const payment of payments) {
    if (!memberPaymentMap[payment.memberId]) {
      memberPaymentMap[payment.memberId] = 0;
    }
    memberPaymentMap[payment.memberId] += Number(payment.amount) || 0;
  }

  // ---- Build breakdown for each active member ----
  const breakdown = activeMembers.map((member) => {
    const memberMeals = memberMealMap[member.id] || 0;
    const mealCost = round2(memberMeals * effectiveMealRate);
    const rent = Number(member.rentAmount) || 0;
    const totalDue = round2(rent + mealCost + sharedExpensePerMember + serviceChargePerMember);
    const totalPaid = round2(memberPaymentMap[member.id] || 0);
    const balance = round2(totalPaid - totalDue); // positive = surplus, negative = due

    return {
      memberId: member.id,
      memberName: member.name,
      phone: member.phone || '',
      totalMeals: memberMeals,
      mealRate: effectiveMealRate,
      mealCost,
      rent,
      sharedExpense: sharedExpensePerMember,
      serviceCharge: serviceChargePerMember,
      totalDue,
      totalPaid,
      balance,
    };
  });

  // Sort alphabetically by name
  breakdown.sort((a, b) => a.memberName.localeCompare(b.memberName));

  return breakdown;
}

/**
 * ============================================================
 * SINGLE MEMBER DUE — Quick lookup for payment page
 * ============================================================
 */

/**
 * Calculate due breakdown for a single member.
 * Returns the matching object from calculateMemberDues,
 * or a zeroed object if member is not found/active.
 */
export async function calculateSingleMemberDue(messId, memberId, year, month, options = {}) {
  const allDues = await calculateMemberDues(messId, year, month, options);
  const found = allDues.find((d) => d.memberId === memberId);

  if (found) return found;

  // Return zeroed breakdown for inactive/missing members
  return {
    memberId,
    memberName: '',
    phone: '',
    totalMeals: 0,
    mealRate: 0,
    mealCost: 0,
    rent: 0,
    sharedExpense: 0,
    serviceCharge: 0,
    totalDue: 0,
    totalPaid: 0,
    balance: 0,
  };
}

/**
 * ============================================================
 * MONTHLY SUMMARY — Full dashboard stats
 * ============================================================
 */

/**
 * Calculate the complete monthly summary for the dashboard.
 *
 * Returns {
 *   monthKey, year, month,
 *   activeMemberCount,
 *   totalMeals, mealRate, totalBazarCost,
 *   totalNonBazarCost, totalAllExpenses,
 *   totalRent, totalSharedExpenses, totalServiceCharge,
 *   totalCollected, totalDue, totalBalance,
 *   managerServiceCharge, netSurplus,
 *   memberBreakdown: [...],
 * }
 */
export async function calculateMonthlySummary(messId, year, month, options = {}) {
  const {
    serviceChargePercent = 0,
    customMealRate = 0,
    mealRateMode = 'standard',
  } = options;

  const memberBreakdown = await calculateMemberDues(
    messId,
    year,
    month,
    options
  );

  const activeMemberCount = memberBreakdown.length;

  // ---- Aggregate from breakdown ----
  const totalMeals = memberBreakdown.reduce((s, m) => s + m.totalMeals, 0);
  const mealRate = memberBreakdown.length > 0 ? memberBreakdown[0].mealRate : 0;
  const totalMealCost = memberBreakdown.reduce((s, m) => s + m.mealCost, 0);
  const totalRent = memberBreakdown.reduce((s, m) => s + m.rent, 0);
  const totalSharedExpenses = memberBreakdown.reduce(
    (s, m) => s + m.sharedExpense,
    0
  );
  const totalServiceCharge = memberBreakdown.reduce(
    (s, m) => s + m.serviceCharge,
    0
  );
  const totalDue = memberBreakdown.reduce((s, m) => s + m.totalDue, 0);
  const totalCollected = memberBreakdown.reduce((s, m) => s + m.totalPaid, 0);
  const totalBalance = memberBreakdown.reduce((s, m) => s + m.balance, 0);

  // ---- Expense totals (from breakdown, recomposed for clarity) ----
  const totalBazarCost = round2(totalMealCost); // mealCost = meals × mealRate, and mealRate = bazar/totalMeals
  const totalNonBazarCost = round2(totalSharedExpenses * activeMemberCount);
  const totalAllExpenses = round2(totalBazarCost + totalNonBazarCost);

  // ---- Manager calculations ----
  const managerServiceCharge = round2(
    (totalAllExpenses * Number(serviceChargePercent || 0)) / 100
  );

  // Net surplus = total collected - (total expenses + manager service charge)
  // Positive means extra money in hand, negative means deficit
  const netSurplus = round2(totalCollected - totalAllExpenses - managerServiceCharge);

  return {
    monthKey: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
    activeMemberCount,
    totalMeals,
    mealRate,
    totalBazarCost,
    totalNonBazarCost,
    totalAllExpenses,
    totalRent,
    totalSharedExpenses,
    totalServiceCharge,
    totalDue,
    totalCollected,
    totalBalance,
    managerServiceCharge,
    netSurplus,
    memberBreakdown,
  };
}

/**
 * ============================================================
 * PROFIT / LOSS CALCULATOR
 * ============================================================
 */

/**
 * Calculate manager profit/loss breakdown.
 *
 * In Bangladeshi mess culture, the manager (who handles shopping,
 * cooking coordination, bill payments) may charge a service fee.
 *
 * Logic:
 *   serviceChargeAmount = totalAllExpenses × (serviceChargePercent / 100)
 *   managerEarning = serviceChargeAmount
 *   totalCostToMembers = totalAllExpenses + serviceChargeAmount
 *   netCollection = totalCollected - totalCostToMembers
 *     positive → surplus (members paid more than cost)
 *     negative → deficit (members still owe)
 *
 * Returns {
 *   totalAllExpenses,
 *   serviceChargePercent,
 *   serviceChargeAmount,
 *   managerEarning,
 *   totalCostToMembers,
 *   totalCollected,
 *   netCollection,
 *   status: 'surplus' | 'deficit' | 'balanced',
 * }
 */
export function calculateProfitLoss(summary, serviceChargePercent = 0) {
  const totalAllExpenses = round2(summary.totalAllExpenses || 0);
  const totalCollected = round2(summary.totalCollected || 0);

  const serviceChargeAmount = round2(
    (totalAllExpenses * Number(serviceChargePercent || 0)) / 100
  );

  const totalCostToMembers = round2(totalAllExpenses + serviceChargeAmount);
  const netCollection = round2(totalCollected - totalCostToMembers);

  let status = 'balanced';
  if (netCollection > 0.5) status = 'surplus';
  else if (netCollection < -0.5) status = 'deficit';

  return {
    totalAllExpenses,
    serviceChargePercent,
    serviceChargeAmount,
    managerEarning: serviceChargeAmount,
    totalCostToMembers,
    totalCollected,
    netCollection,
    status,
  };
}

/**
 * ============================================================
 * EXPENSE BREAKDOWN BY CATEGORY
 * ============================================================
 */

/**
 * Get expense totals grouped by category for a month.
 * Returns array of { category, total, count } sorted by total descending.
 */
export async function getExpenseBreakdown(messId, year, month) {
  const { expenses } = await getMonthData(messId, year, month);

  const categoryMap = {};
  for (const exp of expenses) {
    const cat = exp.category || 'others';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, total: 0, count: 0 };
    }
    categoryMap[cat].total += Number(exp.amount) || 0;
    categoryMap[cat].count += 1;
  }

  // Round totals
  const breakdown = Object.values(categoryMap).map((c) => ({
    ...c,
    total: round2(c.total),
  }));

  // Sort by total descending
  breakdown.sort((a, b) => b.total - a.total);

  return breakdown;
}

/**
 * ============================================================
 * DAILY MEAL SUMMARY
 * ============================================================
 */

/**
 * Get day-by-day meal counts for all active members in a month.
 * Returns Map<dateString, Map<memberId, mealCount>>
 * and a flat array of { date, memberId, memberName, mealCount }
 */
export async function getDailyMealSummary(messId, year, month) {
  const { meals, activeMembers } = await getMonthData(messId, year, month);

  // Build member name lookup
  const memberNames = {};
  for (const m of activeMembers) {
    memberNames[m.id] = m.name;
  }

  // Nested map: date → memberId → mealCount
  const dateMap = {};
  const flatList = [];

  for (const meal of meals) {
    const date = meal.date;
    if (!dateMap[date]) dateMap[date] = {};
    if (!dateMap[date][meal.memberId]) dateMap[date][meal.memberId] = 0;
    dateMap[date][meal.memberId] += Number(meal.mealCount) || 0;
  }

  // Also include dates with zero meals for active members
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toDateStr(new Date(year, month - 1, d));
    if (!dateMap[dateStr]) dateMap[dateStr] = {};

    for (const member of activeMembers) {
      const count = dateMap[dateStr][member.id] || 0;
      flatList.push({
        date: dateStr,
        memberId: member.id,
        memberName: memberNames[member.id] || 'Unknown',
        mealCount: count,
      });
    }
  }

  return { dateMap, flatList, activeMembers };
}

/**
 * ============================================================
 * MEMBER LIFETIME SUMMARY (all-time stats for a member)
 * ============================================================
 */

/**
 * Get all-time payment total for a member across all months.
 */
export async function getMemberTotalPaid(messId, memberId) {
  const payments = await db.payments
    .where('messId')
    .equals(messId)
    .filter((p) => p.memberId === memberId)
    .toArray();

  return round2(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
}

/**
 * Get all-time meal total for a member.
 */
export async function getMemberTotalMeals(messId, memberId) {
  const meals = await db.meals
    .where('messId')
    .equals(messId)
    .filter((m) => m.memberId === memberId)
    .toArray();

  return meals.reduce((sum, m) => sum + (Number(m.mealCount) || 0), 0);
}
