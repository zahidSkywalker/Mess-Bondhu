import { forwardRef } from 'react';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  success: 'btn-success',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-3 text-sm rounded-xl',
  lg: 'px-6 py-4 text-base rounded-xl',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    fullWidth = false,
    loading = false,
    disabled = false,
    type = 'button',
    className = '',
    onClick,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        inline-flex items-center justify-center gap-2
        transition-all duration-200
        ${className}
      `}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
      {typeof children === 'string' ? <span>{children}</span> : children}
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
});

export default Button;
