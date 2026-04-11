import { useMemo } from 'react';
import StatsCard from './StatsCard';
import { useLanguageContext } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNum, formatMonthKey } from '../../utils/formatters';

/* Inline SVG icons for dashboard stat cards */
const TotalExpenseIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const TotalMealsIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

const CollectedIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DueIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const MembersIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MealRateIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/**
 * MonthlyOverview — Grid of stat cards for the dashboard.
 * Each card is flippable to show a detailed breakdown on tap.
 *
 * Props:
 *   summary: object from calculateMonthlySummary
 *   monthKey: string "YYYY-MM"
 *   mealRateMode: string 'standard' | 'custom'
 *   customMealRate: number
 */
export default function MonthlyOverview({ summary, monthKey, mealRateMode = 'standard', customMealRate = 0 }) {
  const { t, isBn } = useLanguageContext();

  if (!summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-16" />
          </div>
        ))}
      </div>
    );
  }

  const monthLabel = formatMonthKey(monthKey, isBn ? 'bn' : 'en');
  const isCustomMode = mealRateMode === 'custom' && customMealRate > 0;

  // ---- Build back-face content for each card ----

  const byMeals = useMemo(() =>
    [...summary.memberBreakdown].sort((a, b) => b.totalMeals - a.totalMeals).slice(0, 5),
    [summary.memberBreakdown]
  );
  const byPaid = useMemo(() =>
    [...summary.memberBreakdown].sort((a, b) => b.totalPaid - a.totalPaid).slice(0, 5),
    [summary.memberBreakdown]
  );
  const byDue = useMemo(() =>
    [...summary.memberBreakdown].filter((m) => m.balance < -0.5).sort((a, b) => a.balance - b.balance).slice(0, 5),
    [summary.memberBreakdown]
  );

  const expenseBack = (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {isBn ? 'বিবরণ' : 'Breakdown'}
      </p>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{t('expenses.bazar')}</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(summary.totalBazarCost)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{t('dashboard.otherExpense')}</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(summary.totalNonBazarCost)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">{t('members.rentPerMonth')}</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(summary.totalRent)}</span>
      </div>
      <div className="border-t border-slate-200 dark:border-slate-600 pt-1.5 flex justify-between text-xs font-bold">
        <span className="text-slate-700 dark:text-slate-200">{t('dashboard.totalExpense')}</span>
        <span className="text-slate-800 dark:text-white">{formatCurrency(summary.totalAllExpenses)}</span>
      </div>
    </div>
  );

  const mealsBack = (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {isBn ? 'সদস্যভিত্তিক' : 'By Member'}
      </p>
      {byMeals.length === 0 ? (
        <p className="text-xs text-slate-400">{t('members.noMembers')}</p>
      ) : (
        byMeals.map((m) => (
          <div key={m.memberId} className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[65%]">{m.memberName}</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{isBn ? toBengaliNum(m.totalMeals) : m.totalMeals}</span>
          </div>
        ))
      )}
      <div className="border-t border-slate-200 dark:border-slate-600 pt-1 flex justify-between text-xs font-bold">
        <span className="text-slate-700 dark:text-slate-200">{t('pdf.grandTotal')}</span>
        <span className="text-slate-800 dark:text-white">{isBn ? toBengaliNum(summary.totalMeals) : summary.totalMeals}</span>
      </div>
    </div>
  );

  const collectedBack = (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {isBn ? 'সদস্যভিত্তিক' : 'By Member'}
      </p>
      {byPaid.length === 0 ? (
        <p className="text-xs text-slate-400">{t('payments.noPayments')}</p>
      ) : (
        byPaid.map((m) => (
          <div key={m.memberId} className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[65%]">{m.memberName}</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(m.totalPaid)}</span>
          </div>
        ))
      )}
      <div className="border-t border-slate-200 dark:border-slate-600 pt-1 flex justify-between text-xs font-bold">
        <span className="text-slate-700 dark:text-slate-200">{t('pdf.grandTotal')}</span>
        <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.totalCollected)}</span>
      </div>
    </div>
  );

  const dueBack = (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {isBn ? 'বাকিদারদের তালিকা' : 'Due Members'}
      </p>
      {byDue.length === 0 ? (
        <p className="text-xs text-emerald-500">{t('dashboard.allClear')}</p>
      ) : (
        byDue.map((m) => (
          <div key={m.memberId} className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[65%]">{m.memberName}</span>
            <span className="font-medium text-red-500 dark:text-red-400">{formatCurrency(Math.abs(m.balance))}</span>
          </div>
        ))
      )}
    </div>
  );

  const membersBack = (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {isBn ? 'সক্রিয় সদস্য' : 'Active Members'}
      </p>
      {summary.memberBreakdown.length === 0 ? (
        <p className="text-xs text-slate-400">{t('members.noMembers')}</p>
      ) : (
        summary.memberBreakdown.map((m) => (
          <div key={m.memberId} className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[65%]">{m.memberName}</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {isBn ? toBengaliNum(m.totalMeals) : m.totalMeals} {isBn ? 'খাবার' : 'meals'}
            </span>
          </div>
        ))
      )}
    </div>
  );

  const mealRateBack = (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {isBn ? 'হিসাব' : 'Calculation'}
      </p>
      {isCustomMode ? (
        <>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t('settings.mealRateMode')}</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">{t('settings.customRate')}</span>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 px-2.5 py-2.5 mt-1">
            <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center font-medium">
              {isBn ? 'ফিক্সড রেট' : 'Fixed Rate'}
            </p>
            <p className="text-lg font-bold text-center text-amber-700 dark:text-amber-300 mt-0.5">
              ৳{customMealRate}
            </p>
            <p className="text-[10px] text-amber-500 dark:text-amber-500 text-center mt-0.5">
              {isBn ? 'প্রতি খাবারের জন্য' : 'per meal'}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t('expenses.bazar')}</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(summary.totalBazarCost)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">{t('dashboard.totalMeals')}</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{isBn ? toBengaliNum(summary.totalMeals) : summary.totalMeals}</span>
          </div>
          <div className="rounded-lg bg-slate-100 dark:bg-slate-700/50 px-2.5 py-2 mt-1">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
              {formatCurrency(summary.totalBazarCost)} ÷ {isBn ? toBengaliNum(summary.totalMeals) : summary.totalMeals}
            </p>
            <p className="text-sm font-bold text-center text-slate-800 dark:text-white mt-0.5">
              = ৳{summary.mealRate}
            </p>
          </div>
        </>
      )}
    </div>
  );

  const cards = [
    {
      label: t('dashboard.totalExpense'),
      value: formatCurrency(summary.totalAllExpenses),
      icon: TotalExpenseIcon,
      color: 'baltic',
      subtitle: `${isBn ? 'বাজার' : 'Bazar'}: ${formatCurrency(summary.totalBazarCost)}`,
      backContent: expenseBack,
    },
    {
      label: t('dashboard.totalMeals'),
      value: isBn ? toBengaliNum(summary.totalMeals) : String(summary.totalMeals),
      icon: TotalMealsIcon,
      color: 'teal',
      subtitle: `${t('dashboard.mealRate')}: ৳${summary.mealRate}`,
      backContent: mealsBack,
    },
    {
      label: t('dashboard.totalCollected'),
      value: formatCurrency(summary.totalCollected),
      icon: CollectedIcon,
      color: 'emerald',
      subtitle: summary.totalCollected >= summary.totalAllExpenses
        ? (isBn ? 'পর্যাপ্ত' : 'Sufficient')
        : (isBn ? 'অপর্যাপ্ত' : 'Insufficient'),
      backContent: collectedBack,
    },
    {
      label: t('dashboard.totalDue'),
      value: formatCurrency(Math.abs(summary.totalBalance)),
      icon: DueIcon,
      color: summary.totalBalance < -0.5 ? 'red' : 'slate',
      subtitle: summary.totalBalance < -0.5
        ? (isBn ? 'বাকি আছে' : 'Outstanding')
        : (isBn ? 'কোনো বাকি নেই' : 'All clear'),
      backContent: dueBack,
    },
    {
      label: t('dashboard.activeMembers'),
      value: isBn ? toBengaliNum(summary.activeMemberCount) : String(summary.activeMemberCount),
      icon: MembersIcon,
      color: 'slate',
      subtitle: `${isBn ? 'মোট ভাড়া' : 'Total rent'}: ${formatCurrency(summary.totalRent)}`,
      backContent: membersBack,
    },
    {
      label: t('dashboard.mealRate'),
      value: `৳${summary.mealRate}`,
      icon: MealRateIcon,
      color: 'amber',
      subtitle: isCustomMode
        ? (isBn ? 'ফিক্সড রেট' : 'Fixed Rate')
        : t('meals.bazarDividedByMeals'),
      backContent: mealRateBack,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => (
          <StatsCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
            subtitle={card.subtitle}
            flippable={true}
            backContent={card.backContent}
          />
        ))}
      </div>
    </div>
  );
}
