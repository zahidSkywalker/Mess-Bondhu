import { useState, useMemo } from 'react';
import PaymentCard from './PaymentCard';
import Button from '../ui/Button';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useLanguageContext } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNum } from '../../utils/formatters';

const PlusIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CreditCardIcon = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

export default function PaymentList({
  payments = [],
  members = [], // full member list for name lookup
  loading = false,
  totalCollected = 0,
  onAdd,
}) {
  const { t, isBn } = useLanguageContext();

  // ---- Build member name map ----
  const memberNameMap = useMemo(() => {
    const map = {};
    for (const m of members) {
      map[m.id] = m.name;
    }
    return map;
  }, [members]);

  // ---- Group payments by member ----
  const groupedPayments = useMemo(() => {
    const groups = {};
    for (const payment of payments) {
      const mId = payment.memberId;
      if (!groups[mId]) {
        groups[mId] = {
          memberId: mId,
          memberName: memberNameMap[mId] || (isBn ? 'অজানা' : 'Unknown'),
          payments: [],
          total: 0,
        };
      }
      groups[mId].payments.push(payment);
      groups[mId].total += Number(payment.amount) || 0;
    }
    // Sort by total descending
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [payments, memberNameMap, isBn]);

  return (
    <div className="space-y-4">
      {/* ---- Total collected card ---- */}
      <Card hover={false} className="bg-gradient-to-r from-emerald/5 to-teal/5 dark:from-emerald/10 dark:to-teal/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">
              {t('payments.totalCollected')}
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalCollected)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-600 dark:text-emerald-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </Card>

      {/* ---- Add button ---- */}
      {onAdd && (
        <div className="flex justify-end">
          <Button variant="success" icon={PlusIcon} onClick={onAdd} size="sm">
            {t('payments.addPayment')}
          </Button>
        </div>
      )}

      {/* ---- Loading ---- */}
      {loading && <div className="py-8"><LoadingSpinner /></div>}

      {/* ---- Empty state ---- */}
      {!loading && payments.length === 0 && (
        <EmptyState
          icon={CreditCardIcon}
          title={t('payments.noPayments')}
          description={t('payments.noPaymentsDesc')}
          action={onAdd ? <Button variant="success" icon={PlusIcon} onClick={onAdd}>{t('payments.addPayment')}</Button> : null}
        />
      )}

      {/* ---- Grouped payment list ---- */}
      {!loading && groupedPayments.length > 0 && (
        <div className="space-y-5">
          {groupedPayments.map((group) => (
            <div key={group.memberId}>
              {/* Group header with member name and total */}
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {group.memberName}
                </h3>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(group.total)}
                </span>
              </div>

              {/* Payment cards for this member */}
              <div className="space-y-2 ml-2 border-l-2 border-emerald/20 dark:border-emerald/10 pl-4">
                {group.payments.map((payment) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    memberName={group.memberName}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Count ---- */}
      {!loading && payments.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-1">
          {isBn
            ? `${toBengaliNum(payments.length)}টি পেমেন্ট • ${toBengaliNum(groupedPayments.length)} জন সদস্য`
            : `${payments.length} payment${payments.length !== 1 ? 's' : ''} from ${groupedPayments.length} member${groupedPayments.length !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
}
