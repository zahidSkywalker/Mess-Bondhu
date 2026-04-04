import { useMess } from '../hooks/useMess';
import NoticeBoard from '../components/notices/NoticeBoard';
import { useLanguageContext } from '../context/LanguageContext';

export default function Notices() {
  const { activeMessId } = useMess();
  const { t } = useLanguageContext();

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">{t('notices.title')}</h1>
        <p className="page-subtitle">{t('notices.subtitle')}</p>
      </div>

      {/* Notice board handles its own CRUD, loading, empty states */}
      {activeMessId ? (
        <div className="fade-in">
          <NoticeBoard messId={activeMessId} />
        </div>
      ) : (
        <div className="text-center py-12 text-sm text-slate-400 dark:text-slate-500">
          {t('mess.noMess')}
        </div>
      )}
    </div>
  );
}
