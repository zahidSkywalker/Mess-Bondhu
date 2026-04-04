import { useState, useCallback } from 'react';
import { exportDatabase, importDatabase } from '../db';
import { useToastContext } from '../context/ToastContext';
import { useLanguageContext } from '../context/LanguageContext';
import { useMessContext } from '../context/MessContext';

/**
 * Hook for backup (export) and restore (import) operations.
 *
 * exportBackup() — downloads a JSON file named with date and mess name
 * restoreBackup(file, overwrite) — reads a JSON file and imports data
 *
 * After successful restore, automatically refreshes the mess list
 * so the UI reflects the new data immediately.
 */
export default function useBackup() {
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { success, error: showError, warning } = useToastContext();
  const { t } = useLanguageContext();
  const { refreshMessList } = useMessContext();

  // ---- Export: download complete DB as JSON ----
  const exportBackup = useCallback(async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const data = await exportDatabase();
      const jsonStr = JSON.stringify(data, null, 2);

      // Generate filename with date and mess info
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `mess-bondhu-backup-${dateStr}_${timeStr}.json`;

      // Create and trigger download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success(t('toast.backupSuccess'));
      return { success: true, filename };
    } catch (err) {
      console.error('Backup export failed:', err);
      showError(t('toast.error'));
      return { success: false, error: err };
    } finally {
      setExporting(false);
    }
  }, [exporting, success, showError, t]);

  // ---- Restore: import from a JSON file ----
  const restoreBackup = useCallback(async (file, overwrite = false) => {
    if (restoring) return { success: false };

    if (!file) {
      showError(t('settings.invalidFile'));
      return { success: false };
    }

    // Validate file type
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      showError(t('settings.invalidFile'));
      return { success: false };
    }

    // Validate file size (max 50MB — safety limit)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showError(t('settings.fileTooLarge'));
      return { success: false };
    }

    try {
      setRestoring(true);

      // Read file content
      const text = await file.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        showError(t('settings.invalidFile'));
        return { success: false, error: parseErr };
      }

      // Perform the import
      const result = await importDatabase(data, overwrite);

      if (result.success) {
        success(t('toast.restoreSuccess'));

        // Refresh mess list so UI picks up any new/deleted mess profiles
        await refreshMessList();

        // Reload the page after a short delay so all contexts re-initialize
        setTimeout(() => {
          window.location.reload();
        }, 1200);

        return result;
      } else {
        showError(result.message || t('settings.restoreError'));
        return result;
      }
    } catch (err) {
      console.error('Backup restore failed:', err);
      showError(t('settings.restoreError'));
      return { success: false, error: err };
    } finally {
      setRestoring(false);
    }
  }, [restoring, success, showError, t, refreshMessList]);

  // ---- Validate a file without actually importing ----
  const validateBackupFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith('.json')) {
      return { valid: false, reason: t('settings.invalidFile') };
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data?._meta?.appName || data._meta.appName !== 'MessBondhuPro') {
        return { valid: false, reason: t('settings.invalidFile') };
      }

      const count =
        (data.messProfiles?.length || 0) +
        (data.members?.length || 0) +
        (data.meals?.length || 0) +
        (data.expenses?.length || 0) +
        (data.payments?.length || 0) +
        (data.notices?.length || 0);

      return {
        valid: true,
        exportedAt: data._meta.exportedAt,
        messCount: data.messProfiles?.length || 0,
        totalRecords: count,
      };
    } catch {
      return { valid: false, reason: t('settings.invalidFile') };
    }
  }, [t]);

  return {
    exporting,
    restoring,
    exportBackup,
    restoreBackup,
    validateBackupFile,
  };
}
export { useBackup };
export default useBackup;
