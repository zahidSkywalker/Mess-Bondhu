import { useToastContext } from '../../context/ToastContext';

export default function Toast({ toast }) {
  const { removeToast } = useToastContext();

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg
        text-white text-sm min-w-[280px] max-w-[400px]
        ${toast.style.bg}
        fade-in
      `}
      role="alert"
    >
      {/* Icon */}
      <span className="flex-shrink-0 text-base font-bold mt-0.5">
        {toast.style.icon}
      </span>

      {/* Message */}
      <p className="flex-1 leading-snug">{toast.message}</p>

      {/* Dismiss button */}
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
