import { useState, useCallback } from 'react';
import db from '../db';
import { validateMealEntry } from '../utils/validators';
import { useToastContext } from '../context/ToastContext';
import { useLanguageContext } from '../context/LanguageContext';

const useMeals = (messId) => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToastContext();
  const { t } = useLanguageContext();

  const getLang = useCallback(() => {
    return t('app.name') === 'মেস বন্ধু' ? 'bn' : 'en';
  }, [t]);

  const fetchMeals = useCallback(async (year, month) => {
    if (!messId) {
      setMeals([]);
      return [];
    }
    try {
      setLoading(true);
      const mm = String(month).padStart(2, '0');
      const prefix = `${year}-${mm}`;
      const list = await db.meals
        .where('date')
        .between(prefix, prefix + '\uffff', true, true)
        .toArray();

      const filtered = list.filter((m) => m.messId === messId);
      filtered.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
      setMeals(filtered);
      return filtered;
    } catch (err) {
      console.error('Failed to fetch meals:', err);
      showError(t('toast.error'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [messId, showError, t]);

  const fetchMealsByDate = useCallback(async (dateStr) => {
    if (!messId || !dateStr) return [];
    try {
      const list = await db.meals
        .where('date')
        .equals(dateStr)
        .toArray();
      return list.filter((m) => m.messId === messId);
    } catch (err) {
      console.error('Failed to fetch meals by date:', err);
      return [];
    }
  }, [messId]);

  const addMeal = useCallback(async (data) => {
    const validation = validateMealEntry(data);
    if (!validation.valid) {
      showError(getLang() === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const now = new Date().toISOString();
      const meal = {
        messId,
        memberId: data.memberId,
        date: data.date,
        mealCount: Number(data.mealCount) || 0,
        createdAt: now,
      };

      const id = await db.meals.add(meal);
      meal.id = id;
      setMeals((prev) => {
        const updated = [...prev, meal];
        updated.sort((a, b) => a.date.localeCompare(b.date));
        return updated;
      });
      success(t('toast.saved'));
      return { success: true, meal };
    } catch (err) {
      console.error('Failed to add meal:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [messId, success, showError, t, getLang]);

  const updateMeal = useCallback(async (mealId, data) => {
    const validation = validateMealEntry({ ...data, memberId: data.memberId });
    if (!validation.valid) {
      showError(getLang() === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const updates = {
        memberId: data.memberId,
        date: data.date,
        mealCount: Number(data.mealCount) || 0,
      };

      await db.meals.update(mealId, updates);
      setMeals((prev) =>
        prev.map((m) => (m.id === mealId ? { ...m, ...updates } : m))
      );
      success(t('toast.updated'));
      return { success: true };
    } catch (err) {
      console.error('Failed to update meal:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t, getLang]);

  const deleteMeal = useCallback(async (mealId) => {
    try {
      await db.meals.delete(mealId);
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
      success(t('toast.deleted'));
      return { success: true };
    } catch (err) {
      console.error('Failed to delete meal:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t]);

  const bulkAddMeals = useCallback(async (dateStr, activeMemberIds, mealCount = 1) => {
    if (!messId || !dateStr || !activeMemberIds.length) {
      return { success: false, added: 0 };
    }

    try {
      const now = new Date().toISOString();
      const newMeals = activeMemberIds.map((memberId) => ({
        messId,
        memberId,
        date: dateStr,
        mealCount: Number(mealCount) || 1,
        createdAt: now,
      }));

      const ids = await db.meals.bulkAdd(newMeals, { allKeys: true });
      const mealsWithIds = newMeals.map((m, i) => ({ ...m, id: ids[i] }));

      setMeals((prev) => {
        const updated = [...prev, ...mealsWithIds];
        updated.sort((a, b) => a.date.localeCompare(b.date));
        return updated;
      });

      success(t('toast.saved'));
      return { success: true, added: mealsWithIds.length };
    } catch (err) {
      console.error('Failed to bulk add meals:', err);
      showError(t('toast.error'));
      return { success: false, added: 0, error: err };
    }
  }, [messId, success, showError, t]);

  const getDayTotal = useCallback((dateStr) => {
    return meals
      .filter((m) => m.date === dateStr)
      .reduce((sum, m) => sum + (Number(m.mealCount) || 0), 0);
  }, [meals]);

  const getMemberMealTotal = useCallback((memberId) => {
    return meals
      .filter((m) => m.memberId === memberId)
      .reduce((sum, m) => sum + (Number(m.mealCount) || 0), 0);
  }, [meals]);

  const getMealsByDateMap = useCallback(() => {
    const map = {};
    for (const meal of meals) {
      if (!map[meal.date]) map[meal.date] = {};
      map[meal.date][meal.memberId] = Number(meal.mealCount) || 0;
    }
    return map;
  }, [meals]);

  const totalMealCount = meals.reduce((sum, m) => sum + (Number(m.mealCount) || 0), 0);

  const quickSetMealCount = useCallback(async (memberId, dateStr, count) => {
    if (!messId || !dateStr) return { success: false };

    try {
      if (count === 0) {
        await db.meals
          .where({ messId, memberId, date: dateStr })
          .delete();
      } else {
        const existing = await db.meals
          .where({ messId, memberId, date: dateStr })
          .first();

        if (existing) {
          await db.meals.update(existing.id, { mealCount: count });
        } else {
          await db.meals.add({
            messId,
            memberId,
            date: dateStr,
            mealCount: count,
            createdAt: new Date().toISOString(),
          });
        }
      }

      const mm = String(new Date(dateStr + 'T00:00:00').getMonth() + 1);
      const yyyy = new Date(dateStr + 'T00:00:00').getFullYear();
      await fetchMeals(yyyy, mm);

      return { success: true };
    } catch (err) {
      console.error('quickSetMealCount failed:', err);
      showError(t('toast.error'));
      return { success: false };
    }
  }, [messId, fetchMeals, showError, t]);

  return {
    meals,
    loading,
    totalMealCount,
    fetchMeals,
    fetchMealsByDate,
    addMeal,
    updateMeal,
    deleteMeal,
    bulkAddMeals,
    getDayTotal,
    getMemberMealTotal,
    getMealsByDateMap,
    quickSetMealCount,
  };
}
export { useMeals };
export default useMeals;
