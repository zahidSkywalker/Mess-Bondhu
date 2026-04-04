export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizes[size] || sizes.md}
          border-teal/30 border-t-baltic rounded-full animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

/**
 * Full-page loading overlay for initial data loading.
 */
LoadingSpinner.Page = function PageSpinner({ message }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" />
      {message && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      )}
    </div>
  );
};

/**
 * Inline skeleton loader for card content areas.
 */
LoadingSpinner.Skeleton = function Skeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
};
