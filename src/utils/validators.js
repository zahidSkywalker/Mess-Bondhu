/**
 * Validation rules for Mess Bondhu Pro.
 * Each validator returns { valid: boolean, message: string }.
 * Messages are provided in both languages so the caller
 * can pick based on current locale.
 */

/** Required field — works for strings, numbers, arrays */
export function required(value, fieldLabelEn, fieldLabelBn) {
  if (value === null || value === undefined) {
    return { valid: false, messageEn: `${fieldLabelEn} is required.`, messageBn: `${fieldLabelBn} আবশ্যক।` };
  }
  if (typeof value === 'string' && value.trim() === '') {
    return { valid: false, messageEn: `${fieldLabelEn} is required.`, messageBn: `${fieldLabelBn} আবশ্যক।` };
  }
  if (Array.isArray(value) && value.length === 0) {
    return { valid: false, messageEn: `${fieldLabelEn} is required.`, messageBn: `${fieldLabelBn} আবশ্যক।` };
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/** Minimum length for strings */
export function minLength(value, min, fieldLabelEn, fieldLabelBn) {
  if (!value || typeof value !== 'string') return { valid: true, messageEn: '', messageBn: '' };
  if (value.trim().length < min) {
    return {
      valid: false,
      messageEn: `${fieldLabelEn} must be at least ${min} characters.`,
      messageBn: `${fieldLabelBn} কমপক্ষে ${min} অক্ষর হতে হবে।`,
    };
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/** Maximum length for strings */
export function maxLength(value, max, fieldLabelEn, fieldLabelBn) {
  if (!value || typeof value !== 'string') return { valid: true, messageEn: '', messageBn: '' };
  if (value.trim().length > max) {
    return {
      valid: false,
      messageEn: `${fieldLabelEn} must not exceed ${max} characters.`,
      messageBn: `${fieldLabelBn} ${max} অক্ষরের বেশি হতে পারে না।`,
    };
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/** Positive number (greater than 0) */
export function positiveNumber(value, fieldLabelEn, fieldLabelBn) {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    return {
      valid: false,
      messageEn: `${fieldLabelEn} must be a positive number.`,
      messageBn: `${fieldLabelBn} একটি সঠিক সংখ্যা হতে হবে।`,
    };
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/** Non-negative number (0 or greater) */
export function nonNegativeNumber(value, fieldLabelEn, fieldLabelBn) {
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    return {
      valid: false,
      messageEn: `${fieldLabelEn} cannot be negative.`,
      messageBn: `${fieldLabelBn} ঋণাত্মক হতে পারে না।`,
    };
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/** Valid date string (YYYY-MM-DD) */
export function validDate(value, fieldLabelEn, fieldLabelBn) {
  if (!value || typeof value !== 'string') {
    return { valid: false, messageEn: `${fieldLabelEn} is required.`, messageBn: `${fieldLabelBn} আবশ্যক।` };
  }
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) {
    return {
      valid: false,
      messageEn: `${fieldLabelEn} must be in YYYY-MM-DD format.`,
      messageBn: `${fieldLabelBn} এর ফরম্যাট সঠিক নয়।`,
    };
  }
  const date = new Date(value + 'T00:00:00');
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      messageEn: `${fieldLabelEn} is not a valid date.`,
      messageBn: `${fieldLabelBn} একটি সঠিক তারিখ নয়।`,
    };
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/** Date not in the future */
export function notFutureDate(value, fieldLabelEn, fieldLabelBn) {
  const dateCheck = validDate(value, fieldLabelEn, fieldLabelBn);
  if (!dateCheck.valid) return dateCheck;

  const input = new Date(value + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (input > today) {
    return {
      valid: false,
      messageEn: `${fieldLabelEn} cannot be in the future.`,
      messageBn: `${fieldLabelBn} ভবিষ্যতের তারিখ হতে পারে না।`,
    };
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/** Percentage between 0 and 100 */
export function validPercentage(value, fieldLabelEn, fieldLabelBn) {
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 100) {
    return {
      valid: false,
      messageEn: `${fieldLabelEn} must be between 0 and 100.`,
      messageBn: `${fieldLabelBn} ০ থেকে ১০০ এর মধ্যে হতে হবে।`,
    };
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/**
 * Run multiple validators in sequence.
 * Returns the first failure, or { valid: true } if all pass.
 */
export function validate(validators) {
  for (const result of validators) {
    if (!result.valid) return result;
  }
  return { valid: true, messageEn: '', messageBn: '' };
}

/**
 * Validate mess profile form data.
 */
export function validateMessProfile(data) {
  return validate([
    required(data.name, 'Mess Name', 'মেসের নাম'),
    minLength(data.name, 2, 'Mess Name', 'মেসের নাম'),
    maxLength(data.name, 100, 'Mess Name', 'মেসের নাম'),
    required(data.address, 'Address', 'ঠিকানা'),
  ]);
}

/**
 * Validate member form data.
 */
export function validateMember(data) {
  return validate([
    required(data.name, 'Member Name', 'সদস্যের নাম'),
    minLength(data.name, 2, 'Member Name', 'সদস্যের নাম'),
    maxLength(data.name, 100, 'Member Name', 'সদস্যের নাম'),
    required(data.phone, 'Phone Number', 'ফোন নম্বর'),
    nonNegativeNumber(data.rentAmount, 'Rent Amount', 'ভাড়ার পরিমাণ'),
    validDate(data.joiningDate, 'Joining Date', 'যোগদানের তারিখ'),
  ]);
}

/**
 * Validate meal entry data.
 */
export function validateMealEntry(data) {
  return validate([
    required(data.memberId, 'Member', 'সদস্য'),
    validDate(data.date, 'Date', 'তারিখ'),
    nonNegativeNumber(data.mealCount, 'Meal Count', 'খাবারের পরিমাণ'),
  ]);
}

/**
 * Validate expense form data.
 */
export function validateExpense(data) {
  return validate([
    required(data.category, 'Category', 'খাত'),
    positiveNumber(data.amount, 'Amount', 'পরিমাণ'),
    required(data.description, 'Description', 'বিবরণ'),
    validDate(data.date, 'Date', 'তারিখ'),
  ]);
}

/**
 * Validate payment form data.
 */
export function validatePayment(data) {
  return validate([
    required(data.memberId, 'Member', 'সদস্য'),
    positiveNumber(data.amount, 'Amount', 'পরিমাণ'),
    validDate(data.date, 'Date', 'তারিখ'),
  ]);
}

/**
 * Validate notice form data.
 */
export function validateNotice(data) {
  return validate([
    required(data.title, 'Title', 'শিরোনাম'),
    minLength(data.title, 3, 'Title', 'শিরোনাম'),
    maxLength(data.title, 200, 'Title', 'শিরোনাম'),
    required(data.content, 'Content', 'বিষয়বস্তু'),
    minLength(data.content, 5, 'Content', 'বিষয়বস্তু'),
  ]);
}
