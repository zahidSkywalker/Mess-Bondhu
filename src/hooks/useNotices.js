import { useState, useCallback } from 'react';
import db from '../db';
import { validateNotice } from '../utils/validators';
import { useToastContext } from '../context/ToastContext';
import { useLanguageContext } from '../context/LanguageContext';

export default function useNotices(messId) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToastContext();
  const { t } = useLanguageContext();

  const getLang = useCallback(() => {
    return t('app.name') === 'মেস বন্ধু প্রো' ? 'bn' : 'en';
  }, [t]);

  // ---- Fetch all notices for the mess, pinned first ----
  const fetchNotices = useCallback(async () => {
    if (!messId) {
      setNotices([]);
      return [];
    }
    try {
      setLoading(true);
      const list = await db.notices
        .where('messId')
        .equals(messId)
        .toArray();

      // Sort: pinned first (by updatedAt desc), then unpinned (by createdAt desc)
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isPinned && b.isPinned) return (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt);
        return b.createdAt.localeCompare(a.createdAt);
      });

      setNotices(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch notices:', err);
      showError(t('toast.error'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [messId, showError, t]);

  // ---- Add a new notice ----
  const addNotice = useCallback(async (data) => {
    const validation = validateNotice(data);
    if (!validation.valid) {
      showError(getLang() === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const now = new Date().toISOString();
      const notice = {
        messId,
        title: data.title.trim(),
        content: (data.content || '').trim(),
        isPinned: Boolean(data.isPinned),
        createdAt: now,
        updatedAt: now,
      };

      const id = await db.notices.add(notice);
      notice.id = id;

      setNotices((prev) => {
        const updated = [notice, ...prev];
        // Re-sort with pinned first
        updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.createdAt.localeCompare(a.createdAt);
        });
        return updated;
      });

      success(t('toast.saved'));
      return { success: true, notice };
    } catch (err) {
      console.error('Failed to add notice:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [messId, success, showError, t, getLang]);

  // ---- Update a notice ----
  const updateNotice = useCallback(async (noticeId, data) => {
    const validation = validateNotice(data);
    if (!validation.valid) {
      showError(getLang() === 'bn' ? validation.messageBn : validation.messageEn);
      return { success: false, error: validation };
    }

    try {
      const updates = {
        title: data.title.trim(),
        content: (data.content || '').trim(),
        isPinned: Boolean(data.isPinned),
        updatedAt: new Date().toISOString(),
      };

      await db.notices.update(noticeId, updates);
      setNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, ...updates } : n))
      );
      success(t('toast.updated'));
      return { success: true };
    } catch (err) {
      console.error('Failed to update notice:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t, getLang]);

  // ---- Delete a notice ----
  const deleteNotice = useCallback(async (noticeId) => {
    try {
      await db.notices.delete(noticeId);
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      success(t('toast.deleted'));
      return { success: true };
    } catch (err) {
      console.error('Failed to delete notice:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [success, showError, t]);

  // ---- Toggle pin status ----
  const togglePin = useCallback(async (noticeId) => {
    try {
      const notice = await db.notices.get(noticeId);
      if (!notice) return { success: false };

      const newPinned = !notice.isPinned;
      await db.notices.update(noticeId, {
        isPinned: newPinned,
        updatedAt: new Date().toISOString(),
      });

      setNotices((prev) => {
        const updated = prev.map((n) =>
          n.id === noticeId ? { ...n, isPinned: newPinned, updatedAt: new Date().toISOString() } : n
        );
        // Re-sort: pinned items float to top
        updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          if (a.isPinned && b.isPinned) return b.updatedAt.localeCompare(a.updatedAt);
          return b.createdAt.localeCompare(a.createdAt);
        });
        return updated;
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    }
  }, [showError, t]);

  // ---- Get pinned notices only ----
  const pinnedNotices = notices.filter((n) => n.isPinned);

  return {
    notices,
    pinnedNotices,
    loading,
    fetchNotices,
    addNotice,
    updateNotice,
    deleteNotice,
    togglePin,
  };
}
