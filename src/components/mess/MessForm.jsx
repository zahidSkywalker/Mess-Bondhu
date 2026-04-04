import { useState, useEffect, useCallback } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { validateMessProfile } from '../../utils/validators';
import { useLanguageContext } from '../../context/LanguageContext';
import { useToastContext } from '../../context/ToastContext';

const initialState = {
  name: '',
  address: '',
  managerName: '',
  managerPhone: '',
};

export default function MessForm({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const { t } = useLanguageContext();
  const { error: showError } = useToastContext();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});

  // Populate form when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        address: initialData.address || '',
        managerName: initialData.managerName || '',
        managerPhone: initialData.managerPhone || '',
      });
    } else {
      setForm(initialState);
    }
    setErrors({});
  }, [initialData]);

  const getLang = useCallback(() => {
    return t('app.name') === 'মেস বন্ধু প্রো' ? 'bn' : 'en';
  }, [t]);

  // ---- Handle input change ----
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  // ---- Validate and submit ----
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const validation = validateMessProfile(form);
      if (!validation.valid) {
        const lang = getLang();
        const message = lang === 'bn' ? validation.messageBn : validation.messageEn;
        // Try to map error to specific field
        if (message.includes(t('mess.messName')) || message.includes('Name')) {
          setErrors({ name: message });
        } else if (message.includes(t('mess.messAddress')) || message.includes('Address')) {
          setErrors({ address: message });
        } else {
          showError(message);
        }
        return;
      }

      onSubmit(form);
    },
    [form, getLang, t, showError, onSubmit]
  );

  const isEditing = Boolean(initialData);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mess Name */}
      <Input
        label={t('mess.messName')}
        placeholder={t('mess.messNamePlaceholder')}
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={errors.name}
        required={true}
        autoFocus={true}
      />

      {/* Address */}
      <Input
        label={t('mess.messAddress')}
        placeholder={t('mess.messAddressPlaceholder')}
        value={form.address}
        onChange={(e) => handleChange('address', e.target.value)}
        error={errors.address}
        required={true}
      />

      {/* Manager Name */}
      <Input
        label={t('mess.managerName')}
        placeholder={t('mess.managerNamePlaceholder')}
        value={form.managerName}
        onChange={(e) => handleChange('managerName', e.target.value)}
        error={errors.managerName}
      />

      {/* Manager Phone */}
      <Input
        label={t('mess.managerPhone')}
        placeholder="01XXXXXXXXX"
        value={form.managerPhone}
        onChange={(e) => handleChange('managerPhone', e.target.value)}
        error={errors.managerPhone}
        type="tel"
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {t('action.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {isEditing ? t('action.update') : t('mess.createMess')}
        </Button>
      </div>
    </form>
  );
}
