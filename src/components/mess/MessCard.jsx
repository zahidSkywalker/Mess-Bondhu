import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import MessForm from './MessForm';
import { useMessContext } from '../../context/MessContext';
import { useToastContext } from '../../context/ToastContext';
import { useLanguageContext } from '../../context/LanguageContext';
import { formatDate } from '../../utils/formatters';

const EditIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const SwitchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

export default function MessCard({ mess }) {
  const { activeMessId, switchMess, updateMess, deleteMess } = useMessContext();
  const { success, error: showError } = useToastContext();
  const { t } = useLanguageContext();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isActive = mess.id === activeMessId;

  // ---- Handle edit submit ----
  const handleEditSubmit = async (formData) => {
    setEditing(true);
    const result = await updateMess(mess.id, formData);
    setEditing(false);
    if (result.success) {
      setEditOpen(false);
    }
  };

  // ---- Handle delete confirm ----
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const result = await deleteMess(mess.id);
    setDeleting(false);
    if (result.success) {
      setDeleteOpen(false);
    }
  };

  // ---- Handle switch ----
  const handleSwitch = async () => {
    await switchMess(mess.id);
    success(t('toast.saved'));
  };

  return (
    <>
      <Card
        className={isActive ? 'ring-2 ring-baltic dark:ring-teal' : ''}
        hover={true}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
              flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
              ${isActive ? 'bg-baltic text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}
            `}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                {mess.name}
              </h3>
              {isActive && <Badge variant="info" dot={true}>{t('status.active')}</Badge>}
            </div>

            {mess.address && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {mess.address}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              {mess.managerName && (
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {mess.managerName}
                </span>
              )}
              {mess.managerPhone && (
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {mess.managerPhone}
                </span>
              )}
              <span>
                {formatDate(mess.createdAt.split('T')[0], 'bn')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {!isActive && (
              <button
                onClick={handleSwitch}
                className="p-2 rounded-lg text-teal hover:bg-teal/10 dark:hover:bg-teal/20 transition-colors"
                title={t('mess.switchMess')}
              >
                {SwitchIcon}
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-baltic hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={t('action.edit')}
            >
              {EditIcon}
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t('action.delete')}
            >
              {DeleteIcon}
            </button>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('mess.editMess')}
        size="sm"
        footer={null}
      >
        <MessForm
          initialData={mess}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditOpen(false)}
          loading={editing}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('mess.deleteMess')}
        message={t('mess.confirmDelete')}
        confirmText={t('action.delete')}
        variant="danger"
        loading={deleting}
        icon={
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
        }
      />
    </>
  );
}
