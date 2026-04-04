import { useMemo } from 'react';
import { useLanguageContext } from '../../context/LanguageContext';
import { toBengaliNum, getDaysInMonth } from '../../utils/formatters';
import { DAYS_BN } from '../../utils/constants';

/**
 * MealCalendar — Month grid view showing daily meal totals.
 *
 * Props:
 *   year: number
 *   month: number (1-based)
 *   mealsByDate: object — { "YYYY-MM-DD": { memberId: mealCount } }
 *   onDateClick: callback(dateStr) — when a date cell is clicked
 *   highlightDate: string — optional date to highlight (YYYY-MM-DD)
 */
export default function MealCalendar({
  year,
  month,
  mealsByDate = {},
  onDateClick,
  highlightDate = null,
}) {
  const { t, isBn } = useLanguageContext();

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const days = isBn ? DAYS_BN : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const cells = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ type: 'empty' });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      const dayOfWeek = (firstDayOfWeek + d - 1) % 7;

      const dateMeals = mealsByDate[dateStr] || {};
      let totalMeals = 0;
      for (const count of Object.values(dateMeals)) {
        totalMeals += count;
      }

      const today = new Date();
      const isToday =
        d === today.getDate() &&
        month === today.getMonth() + 1 &&
        year === today.getFullYear();

      const isHighlighted = dateStr === highlightDate;

      cells.push({
        type: 'day',
        dayNum: d,
        dateStr,
        dayOfWeek,
        isFriday: dayOfWeek === 5,
        totalMeals,
        isToday,
        isHighlighted,
      });
    }

    const remaining = cells.length % 7;
    if (remaining > 0) {
      for (let i = 0; i < 7 - remaining; i++) {
        cells.push({ type: 'empty' });
      }
    }

    return { cells, days };
  }, [year, month, mealsByDate, isBn, highlightDate]);

  const monthTotal = useMemo(() => {
    let total = 0;
    for (const dayData of Object.values(mealsByDate)) {
      for (const count of Object.values(dayData)) {
        total += count;
      }
    }
    return total;
  }, [mealsByDate]);

  const daysWithMeals = useMemo(() => {
    return Object.keys(mealsByDate).filter((date) => {
      const meals = mealsByDate[date];
      return Object.values(meals).some((c) => c > 0);
    }).length;
  }, [mealsByDate]);

  const { cells, days: dayNames } = calendarDays;

  const getCellColor = (totalMeals) => {
    if (totalMeals === 0) return '';
    if (totalMeals <= 3) return 'bg-teal/10 text-teal-700 dark:text-teal-400';
    if (totalMeals <= 6) return 'bg-teal/20 text-teal-800 dark:text-teal-300';
    return 'bg-teal/30 text-teal-900 dark:text-teal-200';
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {isBn ? 'মোট খাবার' : 'Total meals'}:{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {isBn ? toBengaliNum(monthTotal) : monthTotal}
          </span>
        </span>
        <span>
          {isBn ? 'দিন' : 'Days'}:{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {isBn ? toBengaliNum(daysWithMeals) : daysWithMeals}
          </span>
        </span>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((name, idx) => (
          <div
            key={idx}
            className={`
              text-center text-xs font-semibold py-2
              ${idx === 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}
            `}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.type === 'empty') {
            return <div key={idx} className="aspect-square" />;
          }

          const dayCell = cell;

          return (
            <button
              key={idx}
              onClick={() => onDateClick && onDateClick(dayCell.dateStr)}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5
                transition-all duration-150
                ${dayCell.isToday ? 'ring-2 ring-baltic dark:ring-teal' : ''}
                ${dayCell.isHighlighted ? 'ring-2 ring-emerald dark:ring-light-green' : ''}
                ${dayCell.isFriday ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}
                ${dayCell.totalMeals > 0 ? getCellColor(dayCell.totalMeals) : 'text-slate-300 dark:text-slate-600'}
                ${onDateClick ? 'hover:scale-105 cursor-pointer' : ''}
                ${dayCell.totalMeals === 0 && !dayCell.isToday ? 'opacity-40' : ''}
              `}
              disabled={!onDateClick}
            >
              <span
                className={`
                  text-sm font-semibold leading-none
                  ${dayCell.isToday ? 'text-baltic dark:text-teal' : ''}
                  ${dayCell.isFriday && !dayCell.isToday ? 'text-amber-600 dark:text-amber-400' : ''}
                `}
              >
                {isBn ? toBengaliNum(dayCell.dayNum) : dayCell.dayNum}
              </span>

              {dayCell.totalMeals > 0 && (
                <span className="text-[10px] font-bold leading-none">
                  {isBn ? toBengaliNum(dayCell.totalMeals) : dayCell.totalMeals}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-teal/10 border border-teal/20" />
          {isBn ? 'কম খাবার' : 'Low meals'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-teal/20 border border-teal/30" />
          {isBn ? 'মাঝারি' : 'Medium'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-teal/30 border border-teal/40" />
          {isBn ? 'বেশি খাবার' : 'High meals'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" />
          {isBn ? 'শুক্রবার' : 'Friday'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded ring-2 ring-baltic dark:ring-teal" />
          {isBn ? 'আজ' : 'Today'}
        </span>
      </div>
    </div>
  );
}
