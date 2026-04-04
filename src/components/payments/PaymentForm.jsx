import { useState, useEffect, useCallback, useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { validatePayment } from '../../utils/validators';
import { useLanguageContext } from '../../context/LanguageContext';
import { useToastContext } from '../../context/ToastContext';
import { getToday, formatCurrency } from '../../utils/formatters';

const initialState = {
  memberId: '',
  amount: '',
  date: '',
  remark: '',
};

export default function PaymentForm({
  messId,
  activeMembers = [],
  memberDue = null, // { totalDue, totalPaid, balance } for selected member
  onSubmit,
  onCancel,
  loading = false,
}) {
  const { t, isBn } = useLanguageContext();
  const { error: showError } = useToastContext();
  const [form, setForm] = useState({ ...initialState, date: getToday() });
  const [errors, setErrors] = useState({});

  const memberOptions = useMemo(() => {
    return activeMembers.map((m) => ({
      value: m.id,
      label: m.name,
    }));
  }, [activeMembers]);

  // Reset form when memberDue changes (e.g., different member selected externally)
  useEffect(() => {
    setForm({ ...initialState, date: getToday() });
    setErrors({});
  }, []);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const validation = validatePayment(form);
      if (!validation.valid) {
        const message = isBn ? validation.messageBn : validation.messageEn;

        const fieldMap = {
          memberId: [isBn ? 'সদস্য' : 'Member', 'member'],
          amount: [isBn ? 'পরিমাণ' : 'Amount', 'amount'],
          date: [isBn ? 'তারিখ' : 'Date', 'date'],
        };

        let matched = false;
        for (const [field, keywords] of Object.entries(fieldMap)) {
          if (keywords.some((kw) => message.toLowerCase().includes(kw.toLowerCase()))) {
            setErrors({ [field]: message });
            matched = true;
            break;
          }
        }
        if (!matched) showError(message);
        return;
      }

      onSubmit({
        ...form,
        amount: Number(form.amount) || 0,
      });
    },
    [form, isBn, showError, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Due info card (shown when a member is selected and due data exists) */}
      {memberDue && form.memberId && (
        <Card hover={false} className="bg-slate-50 dark:bg-slate-700/30">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('payments.dueBefore')}</p>
              <p className={`font-bold ${memberDue.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {formatCurrency(Math.abs(memberDue.balance))}
                {memberDue.balance < 0 && <span className="text-xs font-normal ml-1">{isBn ? 'বাকি' : 'due'}</span>}
                {memberDue.balance > 0 && <span className="text-xs font-normal ml-1">{isBn ? 'অগ্রিম' : 'advance'}</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 dark:text-slate-500">{t('members.totalMembers').replace('Total Members', isBn ? 'মোট দায়' : 'Total Due')}</p>
              <p className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(memberDue.totalDue)}</p>
            </div>
          </div>
        </Card>
      )}

      <Select
        label={t('payments.selectMember')}
        options={memberOptions}
        value={form.memberId}
        onChange={(e) => handleChange('memberId', e.target.value)}
        placeholder={t('payments.selectMember')}
        error={errors.memberId}
        required={true}
      />

      <Input
        label={t('label.amount')}
        placeholder={t('payments.amountPlaceholder')}
        value={form.amount}
        onChange={(e) => handleChange('amount', e.target.value)}
        error={errors.amount}
        type="number"
        min="1"
        step="1"
        prefix={isBn ? '৳' : '৳'}
        required={true}
        autoFocus={true}
      />

      <Input
        label={t('label.date')}
        value={form.date}
        onChange={(e) => handleChange('date', e.target.value)}
        error={errors.date}
        type="date"
        required={true}
        max={getToday()}
      />

      <Input
        label={t('label.remark')}
        placeholder={t('payments.remarkPlaceholder')}
        value={form.remark}
        onChange={(e) => handleChange('remark', e.target.value)}
        error={errors.remark}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {t('action.cancel')}
          </Button>
        )}
        <Button type="submit" variant="success" loading={loading}>
          {t('payments.addPayment')}
        </Button>
      </div>
    </form>
  );
}
