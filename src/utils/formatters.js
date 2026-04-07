import { CURRENCY, MONTHS_EN, MONTHS_BN, SHORT_MONTHS_EN, SHORT_MONTHS_BN } from './constants';
import { EXPENSE_CATEGORIES } from './constants';

/**
 * Format a number as Bangladeshi Taka currency string.
 * Uses Intl.NumberFormat with 'en-IN' locale which handles
 * the Indian/Bangladeshi numbering system (e.g., 1,00,000).
 * Automatically converts to Bengali digits when language is Bangla.
 */
export function formatCurrency(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    const zero = showSymbol ? `${CURRENCY.symbol}0` : '0';
    const useBengali = document.documentElement.lang === 'bn';
    return useBengali ? toBengaliNum(zero) : zero;
  }

  const num = Number(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));

  const useBengali = document.documentElement.lang === 'bn';
  const displayNum = useBengali ? toBengaliNum(formatted) : formatted;

  const prefix = num < 0 ? '-' : '';
  return showSymbol ? `${prefix}${CURRENCY.symbol}${displayNum}` : `${prefix}${displayNum}`;
}

/**
 * Format amount without symbol — useful for table cells
 * that already have a header showing currency.
 */
export function formatAmount(amount) {
  return formatCurrency(amount, false);
}

/**
 * Format a date string (YYYY-MM-DD) to a display format.
 */
export function formatDate(dateStr, lang = 'bn') {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  const months = lang === 'bn' ? MONTHS_BN : MONTHS_EN;
  const dayStr = lang === 'bn' ? toBengaliNum(day) : String(day);
  const yearStr = lang === 'bn' ? toBengaliNum(year) : String(year);

  return `${dayStr} ${months[monthIndex]}, ${yearStr}`;
}

/**
 * Format date in short form: "15 জানু, ২০২৫"
 */
export function formatDateShort(dateStr, lang = 'bn') {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  const months = lang === 'bn' ? SHORT_MONTHS_BN : SHORT_MONTHS_EN;
  const dayStr = lang === 'bn' ? toBengaliNum(day) : String(day);
  const yearStr = lang === 'bn' ? toBengaliNum(year) : String(year);

  return `${dayStr} ${months[monthIndex]}, ${yearStr}`;
}

/**
 * Get "YYYY-MM" string from a Date object.
 */
export function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Parse a "YYYY-MM" key into { year, month } numbers.
 */
export function parseMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return { year, month };
}

/**
 * Get display label for a month key: "জানুয়ারি ২০২৫"
 */
export function formatMonthKey(monthKey, lang = 'bn') {
  const { year, month } = parseMonthKey(monthKey);
  const months = lang === 'bn' ? MONTHS_BN : MONTHS_EN;
  const yearStr = lang === 'bn' ? toBengaliNum(year) : String(year);
  return `${months[month - 1]} ${yearStr}`;
}

/**
 * Get today's date as "YYYY-MM-DD".
 */
export function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Get number of days in a given month.
 * month is 1-based (1 = January).
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Get all dates in a month as "YYYY-MM-DD" strings.
 */
export function getDatesInMonth(year, month) {
  const days = getDaysInMonth(year, month);
  const dates = [];
  for (let d = 1; d <= days; d++) {
    const dd = String(d).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    dates.push(`${year}-${mm}-${dd}`);
  }
  return dates;
}

/**
 * Convert English digits to Bengali digits.
 */
export function toBengaliNum(num) {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
}

/**
 * Get a relative time label: "2 দিন আগে", "আজ", etc.
 */
export function timeAgo(dateStr, lang = 'bn') {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (lang === 'bn') {
    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${toBengaliNum(diffMins)} মিনিট আগে`;
    if (diffHours < 24) return `${toBengaliNum(diffHours)} ঘন্টা আগে`;
    if (diffDays < 7) return `${toBengaliNum(diffDays)} দিন আগে`;
    return formatDate(dateStr, 'bn');
  }

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr, 'en');
}

/**
 * Get category display label by value and language.
 */
export function getCategoryLabel(categoryValue, lang = 'bn') {
  const cat = EXPENSE_CATEGORIES.find((c) => c.value === categoryValue);
  if (!cat) return categoryValue;
  return lang === 'bn' ? cat.labelBn : cat.labelEn;
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate a simple unique ID for non-auto-increment uses.
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
