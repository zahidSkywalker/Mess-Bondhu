import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguageContext } from '../../context/LanguageContext';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
}) {
  const { t } = useLanguageContext();
  const contentRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-[95vw]',
  };

  /* ------------------------------------------------------------------
   * FIX 1: Two-phase mount prevents visual artifacts.
   *   Phase 1 (shouldRender):  Modal DOM exists but is invisible.
   *   Phase 2 (isVisible):     CSS transition kicks in → smooth enter.
   *   On close: reverse the phases → smooth exit → then remove DOM.
   *   Using requestAnimationFrame guarantees the browser has painted
   *   the invisible state BEFORE we trigger the visible transition,
   *   eliminating the "ghost flash" on mount.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ------------------------------------------------------------------
   * FIX 2: Escape key listener — only active when modal is open.
   * ------------------------------------------------------------------ */
  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  /* ------------------------------------------------------------------
   * FIX 3: Body scroll lock — applied only when modal is open.
   *   We store the original overflow value and restore it on unmount
   *   so nested modals don't clobber each other's scroll state.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  /* ------------------------------------------------------------------
   * FIX 4: Focus trap — focus first interactive element after enter
   *   animation completes. The 250ms delay matches our exit timeout
   *   plus a small buffer so the element is fully visible.
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isOpen || !isVisible) return;
    const timer = setTimeout(() => {
      if (!contentRef.current) return;
      const focusable = contentRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, [isOpen, isVisible]);

  /* ------------------------------------------------------------------
   * FIX 5: Don't render anything when fully closed.
   *   This prevents any DOM leakage when modal is not in use.
   * ------------------------------------------------------------------ */
  if (!shouldRender) return null;

  /* ------------------------------------------------------------------
   * FIX 6: React Portal — render at document.body level.
   *   WHY: The modal was previously rendered inside the component tree
   *   (inside Layout → main → page component). Any ancestor with
   *   overflow:hidden, transform, filter, or perspective creates a new
   *   stacking context that TRAPS the modal's z-index, causing the
   *   backdrop to bleed through or the modal to appear behind other
   *   elements. Portaling to body breaks out of ALL stacking contexts
   *   and ensures z-index works as expected against body-level
   *   siblings (Sidebar overlay, Toast, MobileNav, etc.).
   *
   *   Nested modals (e.g. Modal → ConfirmDialog → Modal) all portal
   *   to body as siblings. Later DOM order = higher paint order, so
   *   the innermost modal naturally stacks on top at the same z-index.
   * ------------------------------------------------------------------ */
  const portalRoot = typeof document !== 'undefined' ? document.body : null;
  if (!portalRoot) return null;

  const modalElement = (
    <div
      className={`
        fixed inset-0 z-[60] flex items-end sm:items-center justify-center
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-150 ease-out
        pointer-events-none
      `}
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* ----------------------------------------------------------------
       * FIX 7: Backdrop uses FIXED positioning (not absolute).
       *   WHY: The parent overlay is fixed, but if any ancestor above
       *   body had a transform (which none should, but defensive coding),
       *   absolute inset-0 would be relative to that ancestor, not the
       *   viewport. Fixed inset-0 ALWAYS covers the full viewport.
       *   The -z-10 places it behind the modal-content within this
       *   container, while the container's z-[60] ensures the entire
       *   group sits above Sidebar (z-40), Header (z-20), MobileNav
       *   (z-30), and LoadingOverlay (z-40).
       *
       *   FIX 8: backdrop-blur is on the backdrop div, not the overlay.
       *   WHY: Placing blur on the overlay container would blur the
       *   modal-content too (since it's a child). By putting blur
       *   only on the backdrop, the modal content stays crisp.
       * ---------------------------------------------------------------- */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm -z-10"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* ----------------------------------------------------------------
       * FIX 9: Transition-based animation instead of @keyframes.
       *   WHY: @keyframes only play on element creation (enter), never
       *   on removal (exit). CSS transitions work in BOTH directions
       *   when a class toggles, giving us smooth enter AND exit.
       *
       *   FIX 10: will-change hints for GPU acceleration.
       *   WHY: Without this, the browser may paint every frame of the
       *   transform/opacity transition on the CPU, causing jank on
       *   low-end mobile devices (especially Android WebView in PWA).
       *   will-change promotes the element to its own compositor layer.
       *
       *   FIX 11: transform-origin set explicitly.
       *   WHY: On mobile (items-end layout), the default origin is
       *   "center center" which looks odd for a bottom-sheet style
       *   enter. Setting "bottom center" makes the scale-up originate
       *   from the bottom edge, matching the slide-up motion.
       * ---------------------------------------------------------------- */}
      <div
        ref={contentRef}
        className={`
          relative bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl
          rounded-t-2xl shadow-modal max-h-[85vh] overflow-y-auto
          ${sizeClasses[size] || sizeClasses.md}
          ${isVisible
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-8 opacity-0 scale-[0.97]'
          }
          transition-[transform,opacity] duration-200 ease-out
          will-change-[transform,opacity]
          ${className}
        `}
        style={{ transformOrigin: 'bottom center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white pr-4">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label={t('action.close')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 dark:border-slate-700 safe-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalElement, portalRoot);
}
