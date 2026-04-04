import { useState, useCallback } from 'react';
import db from '../db';
import { validateExpense } from '../utils/validators';
import { useToastContext } from '../context/ToastContext';
import { useLanguageContext } from '../context/LanguageContext';

export default function useExpenses(messId) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToastContext();
  const { t } = useLanguageContext();

  const getLang = useCallback(() => {
    return t('app.name') === 'মেস বন্ধু প্রো' ? 'bn' : 'en';
  }, [t]);

  // ---- Fetch expenses for a specific month ----
  const fetchExpenses = useCallback(async (year, month) => {
    if (!messId) {
      setExpenses([]);
      return [];
    }
    try {
      setLoading(true);
      const mm = String(month).padStart(2, '0');
      const prefix = `${year}-${mm}`;
      const list = await db.expenses
        .where('date')
        .between(prefix, prefix + '\uffff', true, true)
        .toArray();

      const filtered = list.filter((e) => e.messId === messId);
      filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      setExpenses(filtered);
      return filtered;
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      showError(t('toast.error'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [messId, showError, t]);

  // ---- Add a new expense ----
  const addExpense = useCallback(async (data) => {
    const validation = validateExpense(data);
    if (!validation.valid) {
      showError(getLang() === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const now = new Date().toISOString();
      const expense = {
        messId,
        category: data.category,
        amount: Number(data.amount) || 0,
        description: (data.description || '').trim(),
        date: data.date,
        remark: (data.remark || '').trim(),
        createdAt: now,
      };

      const id = await db.expenses.add(expense);
      expense.id = id;
      setExpenses((prev) => {
        const updated = [expense, ...prev];
        updated.sort((a, b) => b.date.localeCompare(a.date));
        return updated;
      });
      success(t('toast.saved'));
      return { success: true, expense };
    } catch (err) {
      console.error('Failed to add expense:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [messId, success, showError, t, getLang]);

  // ---- Update an expense ----
  const updateExpense = useCallback(async (expenseId, data) => {
    const validation = validateExpense(data);
    if (!validation.valid) {
      showError(getLang() === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const updates = {
        category: data.category,
        amount: Number(data.amount) || 0,
        description: (data.description || '').trim(),
        date: data.date,
        remark: (data.remark || '').trim(),
      };

      await db.expenses.update(expenseId, updates);
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, ...updates } : e))
      );
      success(t('toast.updated'));
      return { success: true };
    } catch (err) {
      console.error('Failed to update expense:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t, getLang]);

  // ---- Delete an expense ----
  const deleteExpense = useCallback(async (expenseId) => {
    try {
      await db.expenses.delete(expenseId);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      success(t('toast.deleted'));
      return { success: true };
    } catch (err) {
      console.error('Failed to delete expense:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t]);

  // ---- Get total expense amount ----
  const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // ---- Get total bazar cost ----
  const totalBazar = expenses
    .filter((e) => e.category === 'bazar')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // ---- Get total non-bazar cost ----
  const totalNonBazar = expenses
    .filter((e) => e.category !== 'bazar')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // ---- Get expense breakdown by category ----
  const getCategoryBreakdown = useCallback(() => {
    const map = {};
    for (const exp of expenses) {
      const cat = exp.category || 'others';
      if (!map[cat]) map[cat] = { category: cat, total: 0, count: 0 };
      map[cat].total += Number(exp.amount) || 0;
      map[cat].count += 1;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [expenses]);

  return {
    expenses,
    loading,
    totalAmount,
    totalBazar,
    totalNonBazar,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getCategoryBreakdown,
  };
}
