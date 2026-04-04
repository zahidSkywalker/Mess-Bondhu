import { useMemo } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { useLanguageContext } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNum } from '../../utils/formatters';

const CheckCircleIcon = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

/**
 * DueList — Shows members sorted by due amount.
 *
 * Props:
 *   memberBreakdown: array from calculateMemberDues
 *   maxItems: number — max members to show (default 10)
 */
export default function DueList({ memberBreakdown = [], maxItems = 10 }) {
  const { t, isBn } = useLanguageContext();

  // Sort: members with due (negative balance) first, then by absolute balance
  const sortedMembers = useMemo(() => {
    return [...memberBreakdown]
      .sort((a, b) => {
        // Dues first (negative balance), then surplus (positive), then zero
        if (a.balance < 0 && b.balance >= 0) return -1;
        if (a.balance >= 0 && b.balance < 0) return 1;
        // Within same group, sort by absolute balance descending
        return Math.abs(a.balance) - Math.abs(b.balance);
      })
      .slice(0, maxItems);
  }, [memberBreakdown, maxItems]);

  // Count members with actual dues
  const dueCount = memberBreakdown.filter((m) => m.balance < -0.5).length;
  const totalDue = memberBreakdown
    .filter((m) => m.balance < 0)
    .reduce((sum, m) => sum + Math.abs(m.balance), 0);

  // All clear state
  if (dueCount === 0) {
    return (
      <EmptyState
        icon={CheckCircleIcon}
        title={t('dashboard.noDues')}
        description={t('dashboard.allClear')}
      />
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {isBn ? `${toBengaliNum(dueCount)} জনের বাকি` : `${dueCount} member${dueCount !== 1 ? 's' : ''} with due`}
        </p>
        <p className="text-xs font-bold text-red-500 dark:text-red-400">
          {formatCurrency(totalDue)}
        </p>
      </div>

      {/* Member rows */}
      {sortedMembers.map((member) => {
        const isDue = member.balance < -0.5;
        const isSurplus = member.balance > 0.5;

        return (
          <div
            key={member.memberId}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/30"
          >
            {/* Avatar initial */}
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
              ${isDue ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald/10 text-emerald-600 dark:text-emerald-400'}
            `}>
              {member.memberName.charAt(0).toUpperCase()}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                {member.memberName}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {isBn ? 'খাবার' : 'Meals'}: {isBn ? toBengaliNum(member.totalMeals) : member.totalMeals}
                {' · '}
                {formatCurrency(member.totalPaid)} {isBn ? 'পরিশোধ' : 'paid'}
              </p>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-bold ${isDue ? 'text-red-500 dark:text-red-400' : isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {formatCurrency(Math.abs(member.balance))}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {isDue
                  ? (isBn ? 'বাকি' : 'due')
                  : isSurplus
                  ? (isBn ? 'অগ্রিম' : 'advance')
                  : (isBn ? 'শূন্য' : 'clear')
                }
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
