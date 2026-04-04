import { useState, useMemo } from 'react';
import MemberCard from './MemberCard';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useLanguageContext } from '../../context/LanguageContext';
import { toBengaliNum } from '../../utils/formatters';

const PlusIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const MembersIcon = (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/**
 * MemberList displays a filterable, searchable list of member cards.
 *
 * Props:
 *   members: array of member objects
 *   loading: boolean
 *   onAdd: callback to open add form
 *   showFinancials: boolean — whether to show meal/paid/due columns
 *   financialData: Map<memberId, { mealCount, paidAmount, dueAmount }>
 */
export default function MemberList({
  members = [],
  loading = false,
  onAdd,
  showFinancials = false,
  financialData = null,
}) {
  const { t, isBn } = useLanguageContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive | left

  // ---- Filter and search ----
  const filteredMembers = useMemo(() => {
    let result = members;

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Search query — match against name and phone
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(query) ||
          (m.phone || '').includes(query)
      );
    }

    return result;
  }, [members, searchQuery, statusFilter]);

  // ---- Counts for filter badges ----
  const counts = useMemo(() => {
    const c = { all: members.length, active: 0, inactive: 0, left: 0 };
    for (const m of members) {
      if (c[m.status] !== undefined) c[m.status]++;
    }
    return c;
  }, [members]);

  return (
    <div className="space-y-4">
      {/* ---- Search & Filter Bar ---- */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {SearchIcon}
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('members.searchMembers')}
            className="input-field pl-10"
          />
        </div>

        {/* Add button */}
        {onAdd && (
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={onAdd}
            className="flex-shrink-0"
          >
            {t('members.addMember')}
          </Button>
        )}
      </div>

      {/* ---- Status filter tabs ---- */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {[
          { key: 'all', label: t('label.allTime').replace('All Time', isBn ? 'সব' : 'All') },
          { key: 'active', label: t('status.active') },
          { key: 'inactive', label: t('status.inactive') },
          { key: 'left', label: t('status.left') },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key)}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${
                statusFilter === filter.key
                  ? 'bg-baltic text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }
            `}
          >
            {filter.label}
            <span className={`ml-1.5 ${statusFilter === filter.key ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
              ({isBn ? toBengaliNum(counts[filter.key]) : counts[filter.key]})
            </span>
          </button>
        ))}
      </div>

      {/* ---- Loading state ---- */}
      {loading && (
        <div className="py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* ---- Empty states ---- */}
      {!loading && members.length === 0 && (
        <EmptyState
          icon={MembersIcon}
          title={t('members.noMembers')}
          description={t('members.noMembersDesc')}
          action={
            onAdd ? (
              <Button variant="primary" icon={PlusIcon} onClick={onAdd}>
                {t('members.addMember')}
              </Button>
            ) : null
          }
        />
      )}

      {!loading && members.length > 0 && filteredMembers.length === 0 && (
        <EmptyState
          title={t('label.noResults')}
          description={isBn ? 'আপনার খোঁজে কোনো সদস্য পাওয়া যায়নি।' : 'No members match your search.'}
        />
      )}

      {/* ---- Member cards ---- */}
      {!loading && filteredMembers.length > 0 && (
        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              mealCount={
                showFinancials && financialData?.[member.id]
                  ? financialData[member.id].mealCount
                  : null
              }
              paidAmount={
                showFinancials && financialData?.[member.id]
                  ? financialData[member.id].paidAmount
                  : null
              }
              dueAmount={
                showFinancials && financialData?.[member.id]
                  ? financialData[member.id].dueAmount
                  : null
              }
            />
          ))}
        </div>
      )}

      {/* ---- Results count ---- */}
      {!loading && members.length > 0 && filteredMembers.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center pt-2">
          {isBn
            ? `${toBengaliNum(filteredMembers.length)} জন সদস্য দেখানো হচ্ছে`
            : `Showing ${filteredMembers.length} member${filteredMembers.length !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  );
}
