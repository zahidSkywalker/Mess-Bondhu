import { useState, useCallback, useEffect } from 'react';
import db from '../db';
import { DEFAULT_SETTINGS } from '../utils/constants';
import { useToastContext } from '../context/ToastContext';
import { useLanguageContext } from '../context/LanguageContext';

/**
 * Hook for reading/writing arbitrary key-value settings
 * from the IndexedDB settings table.
 *
 * Provides:
 *   - settings object with all loaded values
 *   - getSetting(key) for individual reads
 *   - setSetting(key, value) for individual writes (auto-persists)
 *   - setMultipleSettings(partialObj) for batch writes
 *   - resetToDefaults() to wipe settings back to DEFAULT_SETTINGS
 *   - refreshSettings() to re-read from DB
 */
const useSettings = () => {
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToastContext();
  const { t } = useLanguageContext();

  // ---- Load all settings from DB on mount ----
  const refreshSettings = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await db.settings.toArray();
      const loaded = { ...DEFAULT_SETTINGS };

      for (const row of rows) {
        if (row.key in DEFAULT_SETTINGS) {
          loaded[row.key] = row.value;
        }
      }

      setSettings(loaded);
      return loaded;
    } catch (err) {
      console.error('Failed to load settings:', err);
      return { ...DEFAULT_SETTINGS };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // ---- Get a single setting value ----
  const getSetting = useCallback(
    (key) => {
      return settings[key] ?? DEFAULT_SETTINGS[key];
    },
    [settings]
  );

  // ---- Persist a single setting to DB and update state ----
  const setSetting = useCallback(async (key, value) => {
    try {
      const existing = await db.settings.where('key').equals(key).first();
      if (existing) {
        await db.settings.update(existing.id, { value });
      } else {
        await db.settings.add({ key, value });
      }

      setSettings((prev) => ({ ...prev, [key]: value }));
      return { success: true };
    } catch (err) {
      console.error(`Failed to set setting "${key}":`, err);
      showError(t('toast.error'));
      return { success: false };
    }
  }, [showError, t]);

  // ---- Persist multiple settings at once (single state update) ----
  const setMultipleSettings = useCallback(async (partialObj) => {
    try {
      await db.transaction('rw', db.settings, async () => {
        for (const [key, value] of Object.entries(partialObj)) {
          const existing = await db.settings.where('key').equals(key).first();
          if (existing) {
            await db.settings.update(existing.id, { value });
          } else {
            await db.settings.add({ key, value });
          }
        }
      });

      setSettings((prev) => ({ ...prev, ...partialObj }));
      success(t('toast.saved'));
      return { success: true };
    } catch (err) {
      console.error('Failed to set multiple settings:', err);
      showError(t('toast.error'));
      return { success: false };
    }
  }, [success, showError, t]);

  // ---- Reset all settings to defaults ----
  const resetToDefaults = useCallback(async () => {
    try {
      await db.transaction('rw', db.settings, async () => {
        // Clear all existing rows
        await db.settings.clear();
        // Re-insert defaults
        const entries = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
          key,
          value,
        }));
        await db.settings.bulkAdd(entries);
      });

      setSettings({ ...DEFAULT_SETTINGS });
      success(t('toast.saved'));
      return { success: true };
    } catch (err) {
      console.error('Failed to reset settings:', err);
      showError(t('toast.error'));
      return { success: false };
    }
  }, [success, showError, t]);

  // ---- Convenience getters for commonly used settings ----
  const serviceChargePercent = Number(settings.serviceChargePercent) || 0;
  const mealRateMode = settings.mealRateMode || 'standard';
  const customMealRate = Number(settings.customMealRate) || 0;
  const defaultMealCount = Number(settings.defaultMealCount) || 1;

  return {
    settings,
    loading,
    // Individual access
    getSetting,
    setSetting,
    setMultipleSettings,
    resetToDefaults,
    refreshSettings,
    // Commonly used values (pre-parsed)
    serviceChargePercent,
    mealRateMode,
    customMealRate,
    defaultMealCount,
  };
}
export { useSettings };
export default useSettings;
