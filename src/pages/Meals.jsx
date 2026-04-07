import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMess } from '../hooks/useMess';
import useMeals from '../hooks/useMeals';
import useMembers from '../hooks/useMembers';
import useSettings from '../hooks/useSettings';
import MealEntry from '../components/meals/MealEntry';
import MealTable from '../components/meals/MealTable';
import MealCalendar from '../components/meals/MealCalendar';
import Modal from '../components/ui/Modal';
import Tabs from '../components/ui/Tabs';
import Card from '../components/ui/Card';
import { useLanguageContext } from '../context/LanguageContext';
import { formatCurrency, toBengaliNum, formatMonthKey, getMonthKey } from '../utils/formatters';

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

export default function Meals() {
  const { activeMessId } = useMess();
  const { t, isBn } = useLanguageContext();
  const { defaultMealCount } = useSettings();

  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const {
    meals,
    loading: mealsLoading,
    totalMealCount,
    fetchMeals,
    getMealsByDateMap,
  } = useMeals(activeMessId);

  const {
    members: allMembers,
    getActiveMembers,
  } = useMembers(activeMessId);

  const [activeMembers, setActiveMembers] = useState([]);

  useEffect(() => {
    if (activeMessId) {
      getActiveMembers().then(setActiveMembers);
    }
  }, [activeMessId, getActiveMembers]);

  useEffect(() => {
    if (activeMessId) {
      fetchMeals(year, month);
    }
  }, [activeMessId, year, month, fetchMeals]);

  const refreshMeals = useCallback(() => {
    fetchMeals(year, month);
  }, [year, month, fetchMeals]);

  const goToPrevMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const isCurrentMonth =
    year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  const monthKey = getMonthKey(currentDate);
  const monthLabel = formatMonthKey(monthKey, isBn ? 'bn' : 'en');

  const [viewMode, setViewMode] = useState('table');
  const [addOpen, setAddOpen] = useState(false);

  const mealsByDate = useMemo(() => getMealsByDateMap(), [meals, getMealsByDateMap]);

  const totalBazar = meals.reduce((sum, m) => {
    return sum;
  }, 0);
  const mealRate = totalMealCount > 0 ? '—' : '—';

  const viewTabs = [
    { key: 'table', label: t('meals.table') },
    { key: 'calendar', label: t('meals.calendar') },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="page-title">{t('meals.title')}</h1>
            <p className="page-subtitle">{t('meals.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
              <button onClick={goToPrevMonth} className="p-1.5 rounded-lg text-slate-500 hover:text-baltic hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                {ChevronLeft}
              </button>
              <button
                onClick={goToCurrentMonth}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-w-[140px] justify-center ${
                  isCurrentMonth ? 'text-baltic dark:text-teal' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {CalIcon}
                {monthLabel}
              </button>
              <button
                onClick={goToNextMonth}
                className={`p-1.5 rounded-lg transition-colors ${isCurrentMonth ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-baltic hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                disabled={isCurrentMonth}
              >
                {ChevronRight}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card hover={false} className="text-center py-3">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('meals.totalMealsToday')}</p>
          <p className="text-xl font-bold text-baltic dark:text-teal mt-0.5">
            {isBn ? toBengaliNum(totalMealCount) : totalMealCount}
          </p>
        </Card>
        <Card hover={false} className="text-center py-3">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">{t('dashboard.activeMembers')}</p>
          <p className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
            {isBn ? toBengaliNum(activeMembers.length) : activeMembers.length}
          </p>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Tabs
          tabs={viewTabs}
          activeTab={viewMode}
          onTabChange={setViewMode}
          contentClassName=""
        />
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="btn-primary px-4 py-2 text-xs"
          aria-label={t('meals.addMeal')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('meals.addMeal')}
        </button>
      </div>

      <div className="fade-in" key={viewMode}>

      <div className="fade-in" key={viewMode}>
        {viewMode === 'table' ? (
          <MealTable
            year={year}
            month={month}
            activeMembers={activeMembers}
            mealsByDate={mealsByDate}
          />
        ) : (
          <MealCalendar
            year={year}
            month={month}
            mealsByDate={mealsByDate}
            onDateClick={(dateStr) => {
              setAddOpen(true);
            }}
          />
        )}
      </div>



      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('meals.addMeal')}
        size="md"
        footer={null}
      >
        <MealEntry
          messId={activeMessId}
          activeMembers={activeMembers}
          defaultMealCount={defaultMealCount}
          onSubmit={refreshMeals}
          onCancel={() => setAddOpen(false)}
          mode="both"
        />
      </Modal>
    </div>
  );
}
