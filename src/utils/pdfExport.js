import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateMonthlySummary, getExpenseBreakdown, getDailyMealSummary } from './calculations';
import db from '../db';
import { formatCurrency, formatMonthKey, getDaysInMonth, toBengaliNum, DAYS_SHORT_BN, DAYS_SHORT_EN, MONTHS_BN, MONTHS_EN } from './formatters';
import { EXPENSE_CATEGORIES } from './constants';

/**
 * Generate a formatted PDF monthly report.
 *
 * @param {number} messId
 * @param {number} year
 * @param {number} month (1-based)
 * @param {object} messProfile — active mess object
 * @param {string} lang — 'bn' | 'en'
 */
export async function generatePDF(messId, year, month, messProfile, lang = 'bn') {
  // ---- Load settings for service charge ----
  let serviceChargePercent = 0;
  let mealRateMode = 'standard';
  let customMealRate = 0;
  try {
    const settings = {};
    const keys = ['serviceChargePercent', 'mealRateMode', 'customMealRate'];
    for (const key of keys) {
      const row = await db.settings.where('key').equals(key).first();
      settings[key] = row?.value ?? (key === 'serviceChargePercent' || key === 'customMealRate' ? 0 : 'standard');
    }
    serviceChargePercent = Number(settings.serviceChargePercent) || 0;
    mealRateMode = settings.mealRateMode || 'standard';
    customMealRate = Number(settings.customMealRate) || 0;
  } catch (err) {
    console.error('Failed to load settings for PDF:', err);
  }

  // ---- Calculate all data ----
  const summary = await calculateMonthlySummary(messId, year, month, {
    serviceChargePercent,
    mealRateMode,
    customMealRate,
  });

  const expenseBreakdown = await getExpenseBreakdown(messId, year, month);
  const { activeMembers } = await getDailyMealSummary(messId, year, month);

  // ---- Language helpers ----
  const isBn = lang === 'bn';
  const num = (n) => isBn ? toBengaliNum(n) : String(n);
  const months = isBn ? MONTHS_BN : MONTHS_EN;
  const days = isBn ? DAYS_SHORT_BN : DAYS_SHORT_EN;
  const monthLabel = `${months[month - 1]} ${num(year)}`;

  const labels = {
    title: isBn ? 'মাসিক মেস রিপোর্ট' : 'Monthly Mess Report',
    period: isBn ? 'সময়কাল' : 'Period',
    messName: isBn ? 'মেসের নাম' : 'Mess Name',
    messAddress: isBn ? 'ঠিকানা' : 'Address',
    manager: isBn ? 'ম্যানেজার' : 'Manager',
    preparedOn: isBn ? 'প্রস্তুতির তারিখ' : 'Prepared on',
    summary: isBn ? 'সারসংক্ষেপ' : 'Summary',
    totalExpense: isBn ? 'মোট খরচ' : 'Total Expense',
    bazarCost: isBn ? 'বাজার খরচ' : 'Bazar Cost',
    otherExpense: isBn ? 'অন্যান্য খরচ' : 'Other Expenses',
    totalRent: isBn ? 'মোট ভাড়া' : 'Total Rent',
    totalMeals: isBn ? 'মোট খাবার' : 'Total Meals',
    mealRate: isBn ? 'খাবারের রেট' : 'Meal Rate',
    totalCollected: isBn ? 'মোট আদায়' : 'Total Collected',
    totalDue: isBn ? 'মোট বাকি' : 'Total Due',
    activeMembers: isBn ? 'সক্রিয় সদস্য' : 'Active Members',
    memberDetails: isBn ? 'সদস্যের বিবরণ' : 'Member Details',
    sl: isBn ? 'ক্রম' : 'SL',
    name: isBn ? 'নাম' : 'Name',
    meals: isBn ? 'খাবার' : 'Meals',
    mealCost: isBn ? 'খাবারের খরচ' : 'Meal Cost',
    rent: isBn ? 'ভাড়া' : 'Rent',
    sharedExpense: isBn ? 'ভাগের খরচ' : 'Shared Exp.',
    serviceCharge: isBn ? 'সার্ভিস চার্জ' : 'S. Charge',
    totalDueCol: isBn ? 'মোট বাকি' : 'Total Due',
    paid: isBn ? 'পরিশোধ' : 'Paid',
    balance: isBn ? 'ব্যালেন্স' : 'Balance',
    grandTotal: isBn ? 'সর্বমোট' : 'Grand Total',
    expenseDetails: isBn ? 'খরচের বিবরণ' : 'Expense Details',
    category: isBn ? 'খাত' : 'Category',
    amount: isBn ? 'পরিমাণ' : 'Amount',
    count: isBn ? 'সংখ্যা' : 'Count',
    mealDetails: isBn ? 'খাবারের বিবরণ' : 'Meal Details',
    date: isBn ? 'তারিখ' : 'Date',
    day: isBn ? 'দিন' : 'Day',
    managerSignature: isBn ? 'ম্যানেজারের স্বাক্ষর' : 'Manager Signature',
    page: isBn ? 'পৃষ্ঠা' : 'Page',
  };

  // ---- Create PDF ----
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // ---- Helper: check page break ----
  const checkPageBreak = (neededHeight = 30) => {
    if (yPos + neededHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // ---- Helper: add footer with page number ----
  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `${labels.page} ${num(i)} / ${num(pageCount)}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        'Mess Bondhu Pro',
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  };

  // ========== HEADER ==========
  doc.setFontSize(16);
  doc.setTextColor(34, 87, 122); // baltic-blue
  doc.text(labels.title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  // Period
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(`${labels.period}: ${monthLabel}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Mess info
  doc.setFontSize(9);
  doc.setTextColor(60);
  if (messProfile) {
    doc.text(`${labels.messName}: ${messProfile.name || '-'}`, margin, yPos);
    yPos += 5;
    if (messProfile.address) {
      doc.text(`${labels.messAddress}: ${messProfile.address}`, margin, yPos);
      yPos += 5;
    }
    if (messProfile.managerName) {
      doc.text(`${labels.manager}: ${messProfile.managerName}`, margin, yPos);
      yPos += 5;
    }
  }
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  doc.text(`${labels.preparedOn}: ${todayStr}`, margin, yPos);
  yPos += 8;

  // Divider line
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // ========== SUMMARY TABLE ==========
  doc.setFontSize(12);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.summary, margin, yPos);
  yPos += 6;

  autoTable(doc, {
  startY: yPos,
    margin: { left: margin, right: margin },
    body: [
      [labels.totalExpense, formatCurrency(summary.totalAllExpenses)],
      [labels.bazarCost, formatCurrency(summary.totalBazarCost)],
      [labels.otherExpense, formatCurrency(summary.totalNonBazarCost)],
      [labels.totalRent, formatCurrency(summary.totalRent)],
      [labels.totalMeals, num(summary.totalMeals)],
      [labels.mealRate, `৳${summary.mealRate}`],
      [labels.totalCollected, formatCurrency(summary.totalCollected)],
      [labels.totalDue, formatCurrency(Math.abs(summary.totalBalance))],
      [labels.activeMembers, num(summary.activeMemberCount)],
    ],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: contentWidth * 0.5 },
      1: { halign: 'right', cellWidth: contentWidth * 0.5 },
    },
  });

  yPos = doc.lastAutoTable.finalY + 8;
  checkPageBreak(40);

  // ========== MEMBER DETAILS TABLE ==========
  doc.setFontSize(12);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.memberDetails, margin, yPos);
  yPos += 6;

  const memberHeaders = [
    labels.sl, labels.name, labels.meals, labels.mealCost,
    labels.rent, labels.sharedExpense, labels.serviceCharge,
    labels.totalDueCol, labels.paid, labels.balance,
  ];

  const memberRows = summary.memberBreakdown.map((m, idx) => [
    num(idx + 1),
    m.memberName,
    num(m.totalMeals),
    formatCurrency(m.mealCost),
    formatCurrency(m.rent),
    formatCurrency(m.sharedExpense),
    formatCurrency(m.serviceCharge),
    formatCurrency(m.totalDue),
    formatCurrency(m.totalPaid),
    formatCurrency(m.balance),
  ]);

  // Grand total row
  memberRows.push([
    '',
    labels.grandTotal,
    num(summary.totalMeals),
    formatCurrency(summary.memberBreakdown.reduce((s, m) => s + m.mealCost, 0)),
    formatCurrency(summary.totalRent),
    formatCurrency(summary.totalSharedExpenses),
    formatCurrency(summary.totalServiceCharge),
    formatCurrency(summary.totalDue),
    formatCurrency(summary.totalCollected),
    formatCurrency(summary.totalBalance),
  ]);

  autoTable(doc, {
  startY: yPos,
    margin: { left: margin, right: margin },
    head: [memberHeaders],
    body: memberRows,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 87, 122],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' },
      9: { cellWidth: 22, halign: 'right' },
    },
    // Style the last row (grand total) differently
    didParseCell: (data) => {
      if (data.row.index === memberRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 248, 255]; // light blue bg
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 8;
  checkPageBreak(40);

  // ========== EXPENSE BREAKDOWN TABLE ==========
  doc.setFontSize(12);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.expenseDetails, margin, yPos);
  yPos += 6;

  const expHeaders = [labels.sl, labels.category, labels.amount, labels.count];
  const expRows = expenseBreakdown.map((e, idx) => {
    const catDef = EXPENSE_CATEGORIES.find((c) => c.value === e.category);
    const catLabel = catDef ? (isBn ? catDef.labelBn : catDef.labelEn) : e.category;
    return [num(idx + 1), catLabel, formatCurrency(e.total), num(e.count)];
  });

  // Total row
  expRows.push([
    '',
    labels.grandTotal,
    formatCurrency(expenseBreakdown.reduce((s, e) => s + e.total, 0)),
    num(expenseBreakdown.reduce((s, e) => s + e.count, 0)),
  ]);

  autoTable(doc, {
  startY: yPos,
    margin: { left: margin, right: margin },
    head: [expHeaders],
    body: expRows,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 87, 122],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: contentWidth * 0.45 },
      2: { cellWidth: contentWidth * 0.3, halign: 'right' },
      3: { cellWidth: contentWidth * 0.15, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.row.index === expRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 248, 255];
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 8;
  checkPageBreak(30);

  // ========== MEAL DETAILS TABLE ==========
  doc.setFontSize(12);
  doc.setTextColor(34, 87, 122);
  doc.text(labels.mealDetails, margin, yPos);
  yPos += 6;

  const daysInMonth = getDaysInMonth(year, month);
  const mealHeaders = [labels.sl, labels.date, labels.day, ...activeMembers.map((m) => m.name), labels.totalDueCol];
  const mealRows = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();

    const row = [
      num(d),
      dateStr,
      days[dayOfWeek],
    ];

    let dayTotal = 0;
    for (const member of activeMembers) {
      const count = summary.memberBreakdown
        .find((mb) => mb.memberId === member.id)?.totalMeals || 0;

      // For per-day count, we need the daily data — use 0 as fallback since we only have monthly totals in summary
      // We'll show the monthly total divided by days as an approximation, or better, read from daily data
      const dailyMeals = await getDailyMealSummary(messId, year, month);
      const dayCount = dailyMeals.dateMap[dateStr]?.[member.id] || 0;
      row.push(num(dayCount));
      dayTotal += dayCount;
    }

    row.push(num(dayTotal));
    mealRows.push(row);
  }

  // Build column styles dynamically
  const mealColumnStyles = {
    0: { cellWidth: 10, halign: 'center' },
    1: { cellWidth: 22 },
    2: { cellWidth: 12, halign: 'center' },
  };
  const memberCount = activeMembers.length;
  const remainingWidth = contentWidth - 44; // subtract sl + date + day widths
  const memberColWidth = Math.max(12, (remainingWidth - 20) / (memberCount + 1));
  for (let i = 0; i < memberCount; i++) {
    mealColumnStyles[3 + i] = { cellWidth: memberColWidth, halign: 'center' };
  }
  mealColumnStyles[3 + memberCount] = { cellWidth: memberColWidth, halign: 'center', fontStyle: 'bold' };

  autoTable(doc, {
  startY: yPos,
    margin: { left: margin, right: margin },
    head: [mealHeaders],
    body: mealRows,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 87, 122],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [50, 50, 50],
    },
    columnStyles: mealColumnStyles,
    didParseCell: (data) => {
      // Highlight Friday rows
      if (data.section === 'body') {
        const dateStr = data.row.raw[1];
        if (dateStr) {
          const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
          if (dayOfWeek === 5) {
            data.cell.styles.fillColor = [255, 251, 235]; // light amber
          }
        }
      }
    },
  });

  yPos = doc.lastAutoTable.finalY + 12;

  // ========== SIGNATURE LINE ==========
  checkPageBreak(20);
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
  yPos += 4;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(labels.managerSignature, pageWidth - margin - 60, yPos);

  // ---- Add footers to all pages ----
  addFooter();

  // ---- Save the PDF ----
  const filename = `mess-report-${year}-${String(month).padStart(2, '0')}.pdf`;
  doc.save(filename);
}
