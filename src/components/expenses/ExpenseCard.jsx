import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import ExpenseForm from './ExpenseForm';
import { useExpenses } from '../../hooks/useExpenses';
import { useLanguageContext } from '../../context/LanguageContext';
import { formatCurrency, formatDateShort, timeAgo } from '../../utils/formatters';

const EditIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const categoryVariantMap = {
  bazar: 'success',
  gas: 'warning',
  electricity: 'danger',
  wifi: 'info',
  water: 'info',
  rent_maintenance: 'warning',
  cleaning: 'neutral',
  others: 'neutral',
};

export default function ExpenseCard({ expense }) {
  const { updateExpense, deleteExpense } = useExpenses(expense.messId);
  const { t, isBn } = useLanguageContext();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getCategoryLabel = () => {
    const key = `expenses.${expense.category}`;
    const translated = t(key);
    // If translation key doesn't exist, t() returns the key itself
    return translated === key ? (expense.category || 'Others') : translated;
  };

  const handleEditSubmit = async (formData) => {
    setEditing(true);
    const result = await updateExpense(expense.id, formData);
    setEditing(false);
    if (result.success) setEditOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const result = await deleteExpense(expense.id);
    setDeleting(false);
    if (result.success) setDeleteOpen(false);
  };

  // Category icon (simple colored dot with initial letter)
  const getCategoryIcon = () => {
    const variant = categoryVariantMap[expense.category] || 'neutral';
    const initial = getCategoryLabel().charAt(0);
    return (
      <div className={`
        w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0
        ${variant === 'success' ? 'bg-emerald/10 text-emerald-600 dark:text-emerald-400' : ''}
        ${variant === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : ''}
        ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : ''}
        ${variant === 'info' ? 'bg-teal/10 text-teal-600 dark:text-teal-400' : ''}
        ${variant === 'neutral' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : ''}
      `}>
        {initial}
      </div>
    );
  };

  return (
    <>
      <Card hover={true}>
        <div className="flex items-start gap-3">
          {getCategoryIcon()}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                {expense.description || getCategoryLabel()}
              </h3>
              <Badge variant={categoryVariantMap[expense.category] || 'neutral'}>
                {getCategoryLabel()}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span>{formatDateShort(expense.date, isBn ? 'bn' : 'en')}</span>
              {expense.remark && (
                <span className="truncate max-w-[150px]" title={expense.remark}>
                  {expense.remark}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              {formatCurrency(expense.amount)}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setEditOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-baltic hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={t('action.edit')}
              >
                {EditIcon}
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title={t('action.delete')}
              >
                {DeleteIcon}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title={t('expenses.editExpense')} size="sm" footer={null}>
        <ExpenseForm initialData={expense} onSubmit={handleEditSubmit} onCancel={() => setEditOpen(false)} loading={editing} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('expenses.deleteExpense')}
        message={t('expenses.confirmDelete')}
        confirmText={t('action.delete')}
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
