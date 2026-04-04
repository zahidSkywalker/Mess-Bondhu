import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { useMessContext } from '../../context/MessContext';
import { useLanguageContext } from '../../context/LanguageContext';
import { formatDate } from '../../utils/formatters';

const PlusIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CheckIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MessIcon = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export default function MessSelector({
  isOpen,
  onClose,
  onSelect,
  showCreateButton = true,
  onCreateNew,
}) {
  const { messList, activeMessId, switchMess } = useMessContext();
  const { t } = useLanguageContext();

  const handleSelect = async (messId) => {
    await switchMess(messId);
    if (onSelect) onSelect(messId);
    onClose();
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('mess.selectMess')}
      size="md"
      showCloseButton={true}
      footer={null}
    >
      <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {messList.length === 0 ? (
          <EmptyState
            icon={MessIcon}
            title={t('mess.noMess')}
            description={t('mess.noMessDesc')}
            action={
              showCreateButton ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={PlusIcon}
                  onClick={handleCreateNew}
                >
                  {t('mess.createMess')}
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            {messList.map((mess) => {
              const isActive = mess.id === activeMessId;

              return (
                <button
                  key={mess.id}
                  onClick={() => handleSelect(mess.id)}
                  className={`
                    w-full text-left rounded-xl p-4 transition-all duration-200 border-2
                    ${
                      isActive
                        ? 'border-baltic bg-baltic/5 dark:bg-baltic/10'
                        : 'border-transparent bg-slate-50 dark:bg-slate-700/30 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Mess icon */}
                    <div
                      className={`
                        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                        ${isActive ? 'bg-baltic text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}
                      `}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                          {mess.name}
                        </h3>
                        {isActive && (
                          <span className="flex-shrink-0 text-baltic">
                            {CheckIcon}
                          </span>
                        )}
                      </div>
                      {mess.address && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {mess.address}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {mess.managerName && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {mess.managerName}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-300 dark:text-slate-600">
                          {formatDate(mess.createdAt.split('T')[0], 'bn')}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Create new button at bottom */}
            {showCreateButton && (
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-baltic hover:text-baltic dark:hover:border-teal dark:hover:text-teal transition-colors"
              >
                {PlusIcon}
                <span className="text-sm font-medium">{t('mess.createMess')}</span>
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
