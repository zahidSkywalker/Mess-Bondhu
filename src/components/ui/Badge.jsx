const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
};

export default function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
}) {
  return (
    <span className={`${variants[variant] || variants.neutral} ${className}`}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
            variant === 'success'
              ? 'bg-emerald-500'
              : variant === 'danger'
              ? 'bg-red-500'
              : variant === 'warning'
              ? 'bg-amber-500'
              : variant === 'info'
              ? 'bg-teal-500'
              : 'bg-slate-400'
          }`}
        />
      )}
      {children}
    </span>
  );
}
