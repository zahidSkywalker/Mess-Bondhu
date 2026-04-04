import { useMemo } from 'react';
import { useLanguageContext } from '../../context/LanguageContext';
import { toBengaliNum, getDaysInMonth } from '../../utils/formatters';
import { DAYS_BN } from '../../utils/constants';

/**
 * MealTable — Day × Member grid showing meal counts for a month.
 *
 * Props:
 *   year: number
 *   month: number (1-based)
 *   activeMembers: array of member objects
 *   mealsByDate: object — { "YYYY-MM-DD": { memberId: mealCount } }
 *   mealRate: number — current meal rate for display
 */
export default function MealTable({
  year,
  month,
  activeMembers = [],
  mealsByDate = {},
  mealRate = 0,
}) {
  const { t, isBn } = useLanguageContext();

  const tableData = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const days = isBn ? DAYS_BN : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rows = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;

      const dayOfWeek = new Date(year, month - 1, d).getDay();
      const dayName = days[dayOfWeek];
      const isFriday = dayOfWeek === 5;

      const dateMeals = mealsByDate[dateStr] || {};

      let dayTotal = 0;
      const memberMeals = activeMembers.map((member) => {
        const count = dateMeals[member.id] || 0;
        dayTotal += count;
        return count;
      });

      rows.push({
        date: dateStr,
        dayNum: d,
        dayName,
        isFriday,
        memberMeals,
        total: dayTotal,
      });
    }

    return rows;
  }, [year, month, activeMembers, mealsByDate, isBn]);

  const grandTotal = useMemo(() => {
    return tableData.reduce((sum, row) => sum + row.total, 0);
  }, [tableData]);

  const memberTotals = useMemo(() => {
    return activeMembers.map((_, idx) => {
      return tableData.reduce((sum, row) => sum + (row.memberMeals[idx] || 0), 0);
    });
  }, [tableData, activeMembers]);

  if (activeMembers.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">
        {t('members.noMembers')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Meal rate info */}
      {mealRate > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('meals.mealRate')}: <span className="font-semibold text-slate-600 dark:text-slate-300">{`৳${mealRate}`}</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('meals.bazarDividedByMeals')}
          </p>
        </div>
      )}

      {/* Table wrapper — horizontal scroll for many members */}
      <div className="overflow-x-auto custom-scrollbar -mx-5 px-5">
        <table className="data-table min-w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="w-20 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 min-w-[80px]">
                {t('label.date')}
              </th>

              {activeMembers.map((member) => (
                <th key={member.id} className="min-w-[60px] text-center">
                  <span className="block truncate max-w-[80px] mx-auto" title={member.name}>
                    {member.name.length > 8 ? member.name.slice(0, 7) + '…' : member.name}
                  </span>
                </th>
              ))}

              <th className="w-16 text-center sticky right-0 bg-slate-50 dark:bg-slate-800/50 z-10 min-w-[60px]">
                {t('label.total')}
              </th>
            </tr>
          </thead>

          <tbody>
            {tableData.map((row) => (
              <tr
                key={row.date}
                className={`
                  ${row.isFriday ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}
                  hover:bg-slate-50 dark:hover:bg-slate-800/30
                `}
              >
                <td className="sticky left-0 bg-white dark:bg-slate-800 z-10 whitespace-nowrap">
                  <span className={`text-xs font-medium ${row.isFriday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {row.dayName}
                  </span>
                  <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {isBn ? toBengaliNum(row.dayNum) : row.dayNum}
                  </span>
                </td>

                {row.memberMeals.map((count, idx) => (
                  <td key={idx} className="text-center">
                    <span
                      className={`
                        inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-semibold
                        ${count > 0
                          ? 'bg-teal/10 text-teal-700 dark:text-teal-400'
                          : 'text-slate-300 dark:text-slate-600'
                        }
                      `}
                    >
                      {count > 0 ? (isBn ? toBengaliNum(count) : count) : '-'}
                    </span>
                  </td>
                ))}

                <td className="text-center sticky right-0 bg-white dark:bg-slate-800 z-10">
                  <span
                    className={`
                      inline-flex items-center justify-center w-9 h-7 rounded-lg text-xs font-bold
                      ${row.total > 0
                        ? 'bg-baltic/10 text-baltic dark:text-teal-400'
                        : 'text-slate-300 dark:text-slate-600'
                      }
                    `}
                  >
                    {row.total > 0 ? (isBn ? toBengaliNum(row.total) : row.total) : '-'}
                  </span>
                </td>
              </tr>
            ))}

            {/* Grand total row */}
            <tr className="border-t-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 font-semibold">
              <td className="sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                  {t('pdf.grandTotal')}
                </span>
              </td>

              {memberTotals.map((total, idx) => (
                <td key={idx} className="text-center">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {total > 0 ? (isBn ? toBengaliNum(total) : total) : '-'}
                  </span>
                </td>
              ))}

              <td className="text-center sticky right-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg text-sm font-bold bg-baltic text-white">
                  {isBn ? toBengaliNum(grandTotal) : grandTotal}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Friday highlight legend */}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
        <span className="inline-block w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/20 mr-1 align-middle" />
        {isBn ? 'শুক্রবার' : 'Friday'}
      </p>
    </div>
  );
}
