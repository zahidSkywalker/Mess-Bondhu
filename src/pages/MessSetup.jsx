import { useState, useCallback } from 'react';
import MessForm from '../components/mess/MessForm';
import MessCard from '../components/mess/MessCard';
import { useMessContext } from '../context/MessContext';
import { useLanguageContext } from '../context/LanguageContext';
import Card from '../components/ui/Card';

export default function MessSetup() {
  const { messList, createMess, deleteMess } = useMessContext();
  const { t, isBn } = useLanguageContext();

  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const hasExisting = messList.length > 0;

  // ---- Handle create mess ----
  const handleCreate = useCallback(async (data) => {
    setCreating(true);
    const result = await createMess(data);
    setCreating(false);
    if (result.success) {
      setShowForm(false);
    }
  }, [createMess]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Brand header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-baltic mx-auto flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">MB</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {t('app.name')}
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {t('app.tagline')}
          </p>
        </div>

        {/* No mess — show create form directly */}
        {!hasExisting && !showForm && (
          <Card hover={false}>
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {t('mess.noMess')}
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {t('mess.noMessDesc')}
              </p>
            </div>

            {/* Embedded form */}
            <MessForm
              onSubmit={handleCreate}
              loading={creating}
            />
          </Card>
        )}

        {/* Form mode (if toggled) */}
        {showForm && (
          <Card hover={false}>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
              {t('mess.createMess')}
            </h2>
            <MessForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              loading={creating}
            />
          </Card>
        )}

        {/* Has existing messes — show list with option to create more */}
        {hasExisting && !showForm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {t('mess.selectMess')}
              </h2>
              <button
                onClick={() => setShowForm(true)}
                className="text-sm font-medium text-baltic dark:text-teal hover:underline"
              >
                + {t('mess.createMess')}
              </button>
            </div>

            <div className="space-y-2">
              {messList.map((mess) => (
                <MessCard key={mess.id} mess={mess} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
