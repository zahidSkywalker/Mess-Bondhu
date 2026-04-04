/** Expense categories used throughout the app */
export const EXPENSE_CATEGORIES = [
  { value: 'bazar', labelEn: 'Bazar (Grocery)', labelBn: 'বাজার' },
  { value: 'gas', labelEn: 'Gas', labelBn: 'গ্যাস' },
  { value: 'electricity', labelEn: 'Electricity', labelBn: 'বিদ্যুৎ' },
  { value: 'wifi', labelEn: 'WiFi / Internet', labelBn: 'ওয়াইফাই' },
  { value: 'water', labelEn: 'Water', labelBn: 'পানি' },
  { value: 'rent_maintenance', labelEn: 'Rent Maintenance', labelBn: 'রিপেয়ারিং' },
  { value: 'cleaning', labelEn: 'Cleaning', labelBn: 'পরিষ্কার' },
  { value: 'others', labelEn: 'Others', labelBn: 'অন্যান্য' },
];

/** Member status values */
export const MEMBER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LEFT: 'left',
};

export const MEMBER_STATUS_OPTIONS = [
  { value: MEMBER_STATUS.ACTIVE, labelEn: 'Active', labelBn: 'সক্রিয়' },
  { value: MEMBER_STATUS.INACTIVE, labelEn: 'Inactive', labelBn: 'নিষ্ক্রিয়' },
  { value: MEMBER_STATUS.LEFT, labelEn: 'Left', labelBn: 'চলে গেছে' },
];

/** Default currency */
export const CURRENCY = {
  code: 'BDT',
  symbol: '৳',
  nameEn: 'Bangladeshi Taka',
  nameBn: 'টাকা',
};

/** Default meal rate calculation mode */
export const MEAL_RATE_MODE = {
  STANDARD: 'standard',
  CUSTOM: 'custom',
};

/** Months in order — index 0 = January */
export const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTHS_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

/** Short month labels */
export const SHORT_MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const SHORT_MONTHS_BN = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন',
  'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে',
];

/** Days of the week */
export const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
export const DAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_SHORT_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
export const DAYS_FULL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_FULL_BN = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

/** Navigation items — used for sidebar and mobile nav */
export const NAV_ITEMS = [
  { path: '/', iconKey: 'dashboard', labelKey: 'nav.dashboard' },
  { path: '/members', iconKey: 'members', labelKey: 'nav.members' },
  { path: '/meals', iconKey: 'meals', labelKey: 'nav.meals' },
  { path: '/expenses', iconKey: 'expenses', labelKey: 'nav.expenses' },
  { path: '/payments', iconKey: 'payments', labelKey: 'nav.payments' },
  { path: '/notices', iconKey: 'notices', labelKey: 'nav.notices' },
  { path: '/reports', iconKey: 'reports', labelKey: 'nav.reports' },
  { path: '/settings', iconKey: 'settings', labelKey: 'nav.settings' },
];

/** Default settings values */
export const DEFAULT_SETTINGS = {
  language: 'bn',
  theme: 'light',
  serviceChargePercent: 0,
  mealRateMode: 'standard',
  customMealRate: 0,
  activeMessId: null,
  defaultMealCount: 1,
};
