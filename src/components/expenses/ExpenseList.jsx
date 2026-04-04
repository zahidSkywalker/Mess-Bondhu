import { useState, useMemo } from 'react';
import ExpenseCard from './ExpenseCard';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';
import { useLanguageContext } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNum } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../utils/constants';

const PlusIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FileTextIcon = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default function ExpenseList({
  expenses = [],
  loading = false,
  totalAmount = 0,
  totalBazar = 0,
  totalNonBazar = 0,
  categoryBreakdown = [],
  onAdd,
}) {
  const { t, isBn } = useLanguageContext();
  const [activeTab, setActiveTab] = useState('all');

  // ---- Build tabs ----
  const tabs = useMemo(() => {
    const list = [{ key: 'all', label: isBn ? 'সব' : 'All' }];
    for (const cat of EXPENSE_CATEGORIES) {
      const label = isBn ? cat.labelBn : cat.labelEn;
      const count = categoryBreakdown.find((b) => b.category === cat.value)?.count || 0;
      if (count > 0) {
        list.push({ key: cat.value, label, count });
      }
    }
    return list;
  }, [categoryBreakdown, isBn]);

  // ---- Filter expenses by tab ----
  const filteredExpenses = useMemo(() => {
    if (activeTab === 'all') return expenses;
    return expenses.filter((e) => e.category === activeTab);
  }, [expenses, activeTab]);

  // ---- Category color helper ----
  const getCatColor = (category) => {
    const colors = {
      bazar: 'text-emerald-600 dark:text-emerald-400',
      gas: 'text-amber-600 dark:text-amber-400',
      electricity: 'text-red-500 dark:text-red-400',
      wifi: 'text-teal-600 dark:text-teal-400',
      water: 'text-blue-500 dark:text-blue-400',
      rent_maintenance: 'text-orange-500 dark:text-orange-400',
      cleaning: 'text-slate-500 dark:text-slate-400',
      others: 'text-slate-400 dark:text-slate-500',
    };
    return colors[category] || colors.others;
  };

  return (
    <div className="space-y-4">
      {/* ---- Summary cards row ---- */}
      <div className="grid grid-cols-3 gap-3">
        <Card hover={false} className="text-center py-3 px-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('dashboard.totalExpense')}</p>
          <p className="text-base font-bold text-slate-800 dark:text-white mt-0.5">{formatCurrency(totalAmount)}</p>
        </Card>
        <Card hover={false} className="text-center py-3 px-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('expenses.bazar')}</p>
          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(totalBazar)}</p>
        </Card>
        <Card hover={false} className="text-center py-3 px-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('dashboard.otherExpense')}</p>
          <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">{formatCurrency(totalNonBazar)}</p>
        </Card>
      </div>

      {/* ---- Category breakdown mini-bar ---- */}
      {categoryBreakdown.length > 0 && activeTab === 'all' && (
        <div className="flex flex-wrap gap-2">
          {categoryBreakdown.map((cat) => {
            const catDef = EXPENSE_CATEGORIES.find((c) => c.value === cat.category);
            const label = catDef ? (isBn ? catDef.labelBn : catDef.labelEn) : cat.category;
            return (
              <button
                key={cat.category}
                onClick={() => setActiveTab(cat.category)}
                className={`
                  flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                  ${activeTab === cat.category
                    ? 'bg-baltic text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }
                `}
              >
                {label}: {formatCurrency(cat.total)}
              </button>
            );
          })}
        </div>
      )}

      {/* ---- Tabs ---- */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ---- Add button ---- */}
      {onAdd && (
        <div className="flex justify-end">
          <Button variant="primary" icon={PlusIcon} onClick={onAdd} size="sm">
            {t('expenses.addExpense')}
          </Button>
        </div>
      )}

      {/* ---- Loading ---- */}
      {loading && <div className="py-8"><LoadingSpinner /></div>}

      {/* ---- Empty state ---- */}
      {!loading && expenses.length === 0 && (
        <EmptyState
          icon={FileTextIcon}
          title={t('expenses.noExpenses')}
          description={t('expenses.noExpensesDesc')}
          action={onAdd ? <Button variant="primary" icon={PlusIcon} onClick={onAdd}>{t('expenses.addExpense')}</Button> : null}
        />
      )}

      {/* ---- No results for filter ---- */}
      {!loading && expenses.length > 0 && filteredExpenses.length === 0 && (
        <EmptyState title={t('label.noResults')} />
      )}

      {/* ---- Expense cards ---- */}
      {!loading && filteredExpenses.length > 0 && (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      )}

      {/* ---- Count ---- */}
      {!loading && filteredExpenses.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-1">
          {isBn
            ? `${toBengaliNum(filteredExpenses.length)}টি খরচ দেখানো হচ্ছে`
            : `Showing ${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
}
