import { useState, useCallback } from 'react';
import { useMess } from '../hooks/useMess';
import useInstallPrompt from '../hooks/useInstallPrompt';
import { useLanguageContext } from '../context/LanguageContext';
import ThemeToggle from '../components/settings/ThemeToggle';
import LanguageToggle from '../components/settings/LanguageToggle';
import BackupRestore from '../components/settings/BackupRestore';
import ExportPDF from '../components/settings/ExportPDF';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
// Validators used inline — no import needed

const DownloadIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const TrashIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default function Settings() {
  const { activeMess, activeMessId, deleteMess } = useMess();
  const { t, isBn } = useLanguageContext();
  const { isInstallable, promptInstall } = useInstallPrompt();

  const [serviceCharge, setServiceCharge] = useState('0');
  const [customRate, setCustomRate] = useState('0');
  const [scError, setScError] = useState('');
  const [crError, setCrError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ---- We need useSettings for reading/writing ----
  // Import dynamically to avoid circular dependency
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const db = (await import('../db')).default;
      const rows = await db.settings.toArray();
      const map = {};
      for (const row of rows) map[row.key] = row.value;
      setServiceCharge(String(map.serviceChargePercent || 0));
      setCustomRate(String(map.customMealRate || 0));
      setSettingsLoaded(true);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  // Load on mount
  useState(() => {
    loadSettings();
  });

  const saveSetting = useCallback(async (key, value) => {
    try {
      const db = (await import('../db')).default;
      const existing = await db.settings.where('key').equals(key).first();
      if (existing) {
        await db.settings.update(existing.id, { value });
      } else {
        await db.settings.add({ key, value });
      }
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
    }
  }, []);

  // ---- Handle service charge save ----
    const handleSaveSC = useCallback(() => {
    const value = Number(serviceCharge);
    if (isNaN(value) || value < 0 || value > 100) {
      setScError(isBn ? '০ থেকে ১০০ এর মধ্যে হতে হবে।' : 'Must be between 0 and 100.');
      return;
    }
    setScError('');
    saveSetting('serviceChargePercent', value);
  }, [serviceCharge, isBn, saveSetting]);

  // ---- Handle custom rate save ----
    const handleSaveCR = useCallback(() => {
    const value = Number(customRate);
    if (isNaN(value) || value < 0 || value > 100) {
      setCrError(isBn ? '০ থেকে ১০০ এর মধ্যে হতে হবে।' : 'Must be between 0 and 100.');
      return;
    }
    setCrError('');
    saveSetting('customMealRate', value);
  }, [customRate, saveSetting]);

  // ---- Handle delete mess ----
  const handleDeleteConfirm = useCallback(async () => {
    if (!activeMess || deleteConfirmText !== activeMess.name) return;
    setDeleting(true);
    await deleteMess(activeMess.id);
    setDeleting(false);
    setDeleteConfirmOpen(false);
    setDeleteConfirmText('');
  }, [activeMess, deleteConfirmText, deleteMess]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* ---- Install App ---- */}
        {isInstallable && (
          <Card hover={false} className="bg-gradient-to-r from-baltic/5 to-teal/5 dark:from-baltic/10 dark:to-teal/10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-baltic/10 flex items-center justify-center flex-shrink-0 text-baltic dark:text-baltic-300">
                {DownloadIcon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('settings.installApp')}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {t('settings.installDesc')}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={DownloadIcon}
                  onClick={promptInstall}
                  className="mt-3"
                >
                  {t('settings.installButton')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ---- Appearance ---- */}
        <div className="space-y-3">
          <h2 className="section-title">{t('settings.appearance')}</h2>
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* ---- Mess Settings ---- */}
        <div className="space-y-3">
          <h2 className="section-title">{t('settings.messSettings')}</h2>

          {/* Service Charge */}
          <Card hover={false}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('settings.serviceCharge')}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {t('settings.serviceChargeDesc')}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    value={serviceCharge}
                    onChange={(e) => { setServiceCharge(e.target.value); setScError(''); }}
                    error={scError}
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    suffix="%"
                    containerClassName="flex-1 mb-0"
                    inputClassName="max-w-[120px]"
                  />
                  <Button variant="primary" size="sm" onClick={handleSaveSC}>
                    {t('action.save')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Custom Meal Rate */}
          <Card hover={false}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t('settings.customRateValue')}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {t('settings.customRatePlaceholder')}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Input
                    value={customRate}
                    onChange={(e) => { setCustomRate(e.target.value); setCrError(''); }}
                    error={crError}
                    type="number"
                    min="0"
                    step="0.5"
                    prefix="৳"
                    containerClassName="flex-1 mb-0"
                    inputClassName="max-w-[150px]"
                  />
                  <Button variant="primary" size="sm" onClick={handleSaveCR}>
                    {t('action.save')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ---- PDF Export ---- */}
        <div className="space-y-3">
          <h2 className="section-title">{t('reports.exportPDF')}</h2>
          <ExportPDF messId={activeMessId} activeMess={activeMess} />
        </div>

        {/* ---- Data Management ---- */}
        <div className="space-y-3">
          <h2 className="section-title">{t('settings.dataManagement')}</h2>
          <BackupRestore />
        </div>

        {/* ---- About ---- */}
        <div className="space-y-3">
          <h2 className="section-title">{t('settings.about')}</h2>
          <Card hover={false}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('settings.version')}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">1.0.0</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                {t('settings.appInfo')}
              </p>
            </div>
          </Card>
        </div>

        {/* ---- Danger Zone ---- */}
        {activeMess && (
          <div className="space-y-3">
            <h2 className="section-title text-red-500 dark:text-red-400">{t('settings.dangerZone')}</h2>
            <Card hover={false} className="border border-red-200 dark:border-red-900/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 text-red-500">
                  {TrashIcon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {t('settings.deleteMess')}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {t('settings.deleteMessDesc')}
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={TrashIcon}
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="mt-3"
                  >
                    {t('settings.deleteMessButton')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteConfirmText(''); }}
        onConfirm={handleDeleteConfirm}
        title={t('settings.deleteMess')}
        message={
          <div className="space-y-3">
            <p>{t('settings.deleteMessConfirm')}</p>
            <Input
              placeholder={t('settings.typeToConfirm')}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              error={
                deleteConfirmText && deleteConfirmText !== activeMess?.name
                  ? (isBn ? 'মেসের নাম সঠিকভাবে লিখুন' : 'Type the exact mess name')
                  : ''
              }
            />
          </div>
        }
        confirmText={t('settings.deleteMessButton')}
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
