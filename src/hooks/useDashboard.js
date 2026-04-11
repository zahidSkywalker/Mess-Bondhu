import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateMonthlySummary, calculateProfitLoss } from '../utils/calculations';
import { getMonthKey } from '../utils/formatters';
import { useToastContext } from '../context/ToastContext';

const useDashboard = (messId) => {
  const [summary, setSummary] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(false);

  // Current viewed month — default to this month
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-based

  // Cache to avoid recomputing the same month repeatedly
  const cacheRef = useRef({});
  const computingRef = useRef(false);

  // Store settings for exposing to components
  const [mealRateMode, setMealRateMode] = useState('standard');
  const [customMealRate, setCustomMealRate] = useState(0);

  // ---- Load settings for service charge and meal rate mode ----
  const loadSettings = useCallback(async () => {
    try {
      const settings = {};
      const keys = ['serviceChargePercent', 'mealRateMode', 'customMealRate'];
      for (const key of keys) {
        const row = await (await import('../db')).default.settings.where('key').equals(key).first();
        settings[key] = row?.value ?? (key === 'serviceChargePercent' || key === 'customMealRate' ? 0 : 'standard');
      }
      return settings;
    } catch {
      return {
        serviceChargePercent: 0,
        mealRateMode: 'standard',
        customMealRate: 0,
      };
    }
  }, []);

  // ---- Compute or retrieve from cache ----
  const computeSummary = useCallback(async () => {
    if (!messId) {
      setSummary(null);
      setProfitLoss(null);
      return;
    }

    const monthKey = getMonthKey(currentDate);

    // Return cached result if available
    if (cacheRef.current[monthKey] && cacheRef.current[monthKey].messId === messId) {
      setSummary(cacheRef.current[monthKey].data);
      setProfitLoss(cacheRef.current[monthKey].pl);
      return;
    }

    // Prevent concurrent computations
    if (computingRef.current) return;
    computingRef.current = true;

    try {
      setLoading(true);
      const settings = await loadSettings();
      setMealRateMode(settings.mealRateMode || 'standard');
      setCustomMealRate(Number(settings.customMealRate) || 0);
      const data = await calculateMonthlySummary(messId, year, month, settings);
      const pl = calculateProfitLoss(data, settings.serviceChargePercent);

      // Cache it
      cacheRef.current[monthKey] = { messId, data, pl };
      setSummary(data);
      setProfitLoss(pl);
    } catch (err) {
      console.error('Failed to compute summary:', err);
      setSummary(null);
      setProfitLoss(null);
    } finally {
      setLoading(false);
      computingRef.current = false;
    }
  }, [messId, year, month, currentDate, loadSettings]);

  // ---- Compute on mount and when month/mess changes ----
  useEffect(() => {
    computeSummary();
  }, [computeSummary]);

  // ---- Navigate to previous month ----
  const goToPrevMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return d;
    });
  }, []);

  // ---- Navigate to next month ----
  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const d = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return d;
    });
  }, []);

  // ---- Go to current month ----
  const goToCurrentMonth = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // ---- Go to a specific month ----
  const goToMonth = useCallback((y, m) => {
    setCurrentDate(new Date(y, m - 1, 1));
  }, []);

  // ---- Invalidate cache (call after data mutations) ----
  const invalidateCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  // ---- Force refresh current month ----
  const refresh = useCallback(() => {
    invalidateCache();
    computeSummary();
  }, [invalidateCache, computeSummary]);

  // ---- Check if currently viewing this month ----
  const isCurrentMonth =
    year === new Date().getFullYear() &&
    month === new Date().getMonth() + 1;

  return {
    summary,
    profitLoss,
    loading,
    year,
    month,
    isCurrentMonth,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
    goToMonth,
    refresh,
    invalidateCache,
    mealRateMode,
    customMealRate,
  };
}
export { useDashboard };
export default useDashboard;
