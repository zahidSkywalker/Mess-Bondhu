import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    labelBn,
    error,
    helpText,
    prefix,
    suffix,
    type = 'text',
    className = '',
    containerClassName = '',
    inputClassName = '',
    required = false,
    ...rest
  },
  ref
) {
  const displayLabel = label || labelBn || '';
  const displayError = typeof error === 'string' ? error : error?.messageBn || error?.messageEn || '';

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {/* Label */}
      {displayLabel && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {displayLabel}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input wrapper with optional prefix/suffix */}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none">
            {suffix}
          </span>
        )}

        {type === 'textarea' ? (
          <textarea
            ref={ref}
            rows={rest.rows || 3}
            required={required}
            className={`
              input-field resize-none
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-8' : ''}
              ${displayError ? 'border-red-400 dark:border-red-500 focus:ring-red-500/50 focus:border-red-400' : ''}
              ${inputClassName}
            `}
            {...rest}
          />
        ) : (
          <input
            ref={ref}
            type={type}
            required={required}
            className={`
              input-field
              ${prefix ? 'pl-8' : ''}
              ${suffix ? 'pr-8' : ''}
              ${displayError ? 'border-red-400 dark:border-red-500 focus:ring-red-500/50 focus:border-red-400' : ''}
              ${inputClassName}
            `}
            {...rest}
          />
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-xs text-red-500 dark:text-red-400">{displayError}</p>
      )}

      {/* Help text */}
      {!displayError && helpText && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{helpText}</p>
      )}
    </div>
  );
});

export default Input;
