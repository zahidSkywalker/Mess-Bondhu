import { useState, useCallback } from 'react';
import db from '../db';
import { validatePayment } from '../utils/validators';
import { useToastContext } from '../context/ToastContext';
import { useLanguageContext } from '../context/LanguageContext';

const usePayments = (messId) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToastContext();
  const { t } = useLanguageContext();

  const getLang = useCallback(() => {
    return t('app.name') === 'মেস বন্ধু প্রো' ? 'bn' : 'en';
  }, [t]);

  // ---- Fetch payments for a specific month ----
  const fetchPayments = useCallback(async (year, month) => {
    if (!messId) {
      setPayments([]);
      return [];
    }
    try {
      setLoading(true);
      const mm = String(month).padStart(2, '0');
      const prefix = `${year}-${mm}`;
      const list = await db.payments
        .where('date')
        .between(prefix, prefix + '\uffff', true, true)
        .toArray();

      const filtered = list.filter((p) => p.messId === messId);
      filtered.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      setPayments(filtered);
      return filtered;
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      showError(t('toast.error'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [messId, showError, t]);

  // ---- Fetch payments for a specific member (current month or all) ----
  const fetchPaymentsByMember = useCallback(async (memberId, year = null, month = null) => {
    if (!messId || !memberId) return [];
    try {
      let list;
      if (year && month) {
        const mm = String(month).padStart(2, '0');
        const prefix = `${year}-${mm}`;
        const raw = await db.payments
          .where('date')
          .between(prefix, prefix + '\uffff', true, true)
          .toArray();
        list = raw.filter((p) => p.messId === messId && p.memberId === memberId);
      } else {
        list = await db.payments
          .where('messId')
          .equals(messId)
          .filter((p) => p.memberId === memberId)
          .toArray();
      }
      list.sort((a, b) => b.date.localeCompare(a.date));
      return list;
    } catch (err) {
      console.error('Failed to fetch payments by member:', err);
      return [];
    }
  }, [messId]);

  // ---- Add a new payment ----
  const addPayment = useCallback(async (data) => {
    const validation = validatePayment(data);
    if (!validation.valid) {
      showError(getLang() === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const now = new Date().toISOString();
      const payment = {
        messId,
        memberId: data.memberId,
        amount: Number(data.amount) || 0,
        date: data.date,
        remark: (data.remark || '').trim(),
        createdAt: now,
      };

      const id = await db.payments.add(payment);
      payment.id = id;
      setPayments((prev) => {
        const updated = [payment, ...prev];
        updated.sort((a, b) => b.date.localeCompare(a.date));
        return updated;
      });
      success(t('toast.saved'));
      return { success: true, payment };
    } catch (err) {
      console.error('Failed to add payment:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [messId, success, showError, t, getLang]);

  // ---- Update a payment ----
  const updatePayment = useCallback(async (paymentId, data) => {
    const validation = validatePayment(data);
    if (!validation.valid) {
      showError(getLang() === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const updates = {
        memberId: data.memberId,
        amount: Number(data.amount) || 0,
        date: data.date,
        remark: (data.remark || '').trim(),
      };

      await db.payments.update(paymentId, updates);
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, ...updates } : p))
      );
      success(t('toast.updated'));
      return { success: true };
    } catch (err) {
      console.error('Failed to update payment:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t, getLang]);

  // ---- Delete a payment ----
  const deletePayment = useCallback(async (paymentId) => {
    try {
      await db.payments.delete(paymentId);
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      success(t('toast.deleted'));
      return { success: true };
    } catch (err) {
      console.error('Failed to delete payment:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t]);

  // ---- Get total collected amount ----
  const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // ---- Get payment total for a specific member from loaded payments ----
  const getMemberPaidTotal = useCallback((memberId) => {
    return payments
      .filter((p) => p.memberId === memberId)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  // ---- Get payments grouped by member ----
  const getPaymentsByMember = useCallback(() => {
    const map = {};
    for (const payment of payments) {
      if (!map[payment.memberId]) map[payment.memberId] = { total: 0, count: 0, payments: [] };
      map[payment.memberId].total += Number(payment.amount) || 0;
      map[payment.memberId].count += 1;
      map[payment.memberId].payments.push(payment);
    }
    return map;
  }, [payments]);

  return {
    payments,
    loading,
    totalCollected,
    fetchPayments,
    fetchPaymentsByMember,
    addPayment,
    updatePayment,
    deletePayment,
    getMemberPaidTotal,
    getPaymentsByMember,
  };
}
export { usePayments };
export default usePayments;
