import { useState, useCallback } from 'react';
import db from '../db';
import { validateMember } from '../utils/validators';
import { useToastContext } from '../context/ToastContext';
import { useLanguageContext } from '../context/LanguageContext';

const useMembers = (messId) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToastContext();
  const { t } = useLanguageContext();

  // ---- Fetch all members for the current mess ----
  const fetchMembers = useCallback(async () => {
    if (!messId) {
      setMembers([]);
      return [];
    }
    try {
      setLoading(true);
      const list = await db.members
        .where('messId')
        .equals(messId)
        .toArray();
      // Sort: active first, then inactive, then left — alphabetical within each group
      const statusOrder = { active: 0, inactive: 1, left: 2 };
      list.sort((a, b) => {
        const sa = statusOrder[a.status] ?? 3;
        const sb = statusOrder[b.status] ?? 3;
        if (sa !== sb) return sa - sb;
        return (a.name || '').localeCompare(b.name || '');
      });
      setMembers(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch members:', err);
      showError(t('toast.error'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [messId, showError, t]);

  // ---- Get a single member by id ----
  const getMember = useCallback(async (memberId) => {
    try {
      return await db.members.get(memberId);
    } catch (err) {
      console.error('Failed to get member:', err);
      return null;
    }
  }, []);

  // ---- Get only active members (for meal entry, etc.) ----
  const getActiveMembers = useCallback(async () => {
    if (!messId) return [];
    try {
      return await db.members
        .where('messId')
        .equals(messId)
        .filter((m) => m.status === 'active')
        .toArray();
    } catch (err) {
      console.error('Failed to fetch active members:', err);
      return [];
    }
  }, [messId]);

  // ---- Add a new member ----
  const addMember = useCallback(async (data) => {
    const validation = validateMember(data);
    if (!validation.valid) {
      showError(t(validation.messageBn ? 'validation.required' : 'validation.required'));
      // Return the specific error message
      const lang = t('app.name') === 'মেস বন্ধু প্রো' ? 'bn' : 'en';
      showError(lang === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const now = new Date().toISOString();
      const member = {
        messId,
        name: data.name.trim(),
        phone: (data.phone || '').trim(),
        address: (data.address || '').trim(),
        rentAmount: Number(data.rentAmount) || 0,
        joiningDate: data.joiningDate,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      const id = await db.members.add(member);
      member.id = id;
      setMembers((prev) => [...prev, member]);
      success(t('toast.saved'));
      return { success: true, member };
    } catch (err) {
      console.error('Failed to add member:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [messId, success, showError, t]);

  // ---- Update an existing member ----
  const updateMember = useCallback(async (memberId, data) => {
    const validation = validateMember(data);
    if (!validation.valid) {
      const lang = t('app.name') === 'মেস বন্ধু প্রো' ? 'bn' : 'en';
      showError(lang === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const updates = {
        name: data.name.trim(),
        phone: (data.phone || '').trim(),
        address: (data.address || '').trim(),
        rentAmount: Number(data.rentAmount) || 0,
        joiningDate: data.joiningDate,
        status: data.status || 'active',
        updatedAt: new Date().toISOString(),
      };

      await db.members.update(memberId, updates);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, ...updates } : m))
      );
      success(t('toast.updated'));
      return { success: true };
    } catch (err) {
      console.error('Failed to update member:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t]);

  // ---- Soft delete: set status to 'left' ----
  const removeMember = useCallback(async (memberId) => {
    try {
      await db.members.update(memberId, {
        status: 'left',
        updatedAt: new Date().toISOString(),
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: 'left' } : m))
      );
      success(t('toast.updated'));
      return { success: true };
    } catch (err) {
      console.error('Failed to remove member:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t]);

  // ---- Hard delete: permanently remove from DB ----
  const hardDeleteMember = useCallback(async (memberId) => {
    try {
      await db.transaction('rw', [db.members, db.meals, db.payments], async () => {
        await db.meals.where('memberId').equals(memberId).delete();
        await db.payments.where('memberId').equals(memberId).delete();
        await db.members.delete(memberId);
      });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      success(t('toast.deleted'));
      return { success: true };
    } catch (err) {
      console.error('Failed to hard delete member:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t]);

  // ---- Get active member count ----
  const activeCount = members.filter((m) => m.status === 'active').length;

  return {
    members,
    loading,
    activeCount,
    fetchMembers,
    getMember,
    getActiveMembers,
    addMember,
    updateMember,
    removeMember,
    hardDeleteMember,
  };
}
export { useMembers };
export default useMembers;
