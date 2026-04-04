import { useEffect, useCallback } from 'react';
import { useMess } from '../hooks/useMess';
import { useDashboard } from '../hooks/useDashboard';
import { useLanguageContext } from '../context/LanguageContext';
import MonthlyOverview from '../components/dashboard/MonthlyOverview';
import DueList from '../components/dashboard/DueList';
import ProfitLossCalculator from '../components/dashboard/ProfitLossCalculator';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatMonthKey, toBengaliNum } from '../utils/formatters';
import { Link } from 'react-router-dom';

const ChevronLeft = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRight = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CalIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export default function Dashboard() {
  const { activeMess, activeMessId } = useMess();
  const { t, isBn } = useLanguageContext();

  const {
    summary,
    profitLoss,
    loading,
    year,
    month,
    isCurrentMonth,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useDashboard(activeMessId);

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthLabel = formatMonthKey(monthKey, isBn ? 'bn' : 'en');

  return (
    <div className="page-container">
      {/* Page header with month navigation */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('dashboard.title')}</h1>
            <p className="page-subtitle">{t('dashboard.subtitle')}</p>
          </div>

          {/* Month navigator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                onClick={goToPrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-baltic hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Previous month"
              >
                {ChevronLeft}
              </button>

              <button
                onClick={goToCurrentMonth}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-w-[140px] justify-center ${
                  isCurrentMonth
                    ? 'text-baltic dark:text-teal'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {CalIcon}
                {monthLabel}
              </button>

              <button
                onClick={goToNextMonth}
                className={`p-1.5 rounded-lg transition-colors ${
                  isCurrentMonth
                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    : 'text-slate-500 hover:text-baltic hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                disabled={isCurrentMonth}
                aria-label="Next month"
              >
                {ChevronRight}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && !summary && (
        <div className="py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Dashboard content */}
      {summary && (
        <div className="space-y-6 fade-in">
          {/* Stats cards grid */}
          <MonthlyOverview summary={summary} monthKey={monthKey} />

          {/* Two column layout on desktop: Due list + P&L */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Due list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">{t('dashboard.dueList')}</h2>
                <Link
                  to="/reports"
                  className="text-xs text-baltic dark:text-teal hover:underline font-medium"
                >
                  {t('dashboard.viewReport')}
                </Link>
              </div>
              <DueList memberBreakdown={summary.memberBreakdown} maxItems={8} />
            </div>

            {/* Profit/Loss calculator */}
            <div>
              <h2 className="section-title">{t('dashboard.profitLoss')}</h2>
              <ProfitLossCalculator
                profitLoss={profitLoss}
                serviceChargePercent={summary.memberBreakdown.length > 0
                  ? (profitLoss?.serviceChargePercent || 0)
                  : 0
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
