import { useMessContext } from '../../context/MessContext';
import { useThemeContext } from '../../context/ThemeContext';
import { useLanguageContext } from '../../context/LanguageContext';
import useInstallPrompt from '../../hooks/useInstallPrompt';

/* Small inline icons for the header bar */
const SunIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const GlobeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const MenuIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const DownloadIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function Header({ onMenuClick }) {
  const { activeMess } = useMessContext();
  const { isDark, toggleTheme } = useThemeContext();
  const { language, toggleLanguage, isBn } = useLanguageContext();
  const { isInstallable, promptInstall } = useInstallPrompt();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Hamburger (mobile) + Mess Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden transition-colors"
            aria-label="Open menu"
          >
            {MenuIcon}
          </button>

          <div className="min-w-0">
            {activeMess ? (
              <>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                  {activeMess.name}
                </h2>
                {activeMess.address && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden sm:block">
                    {activeMess.address}
                  </p>
                )}
              </>
            ) : (
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">
                {isBn ? 'মেস বন্ধু প্রো' : 'Mess Bondhu Pro'}
              </h2>
            )}
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-1">
          {/* Install button (only when available) */}
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              aria-label="Install app"
              title="Install App"
            >
              {DownloadIcon}
            </button>
          )}

          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle language"
            title={isBn ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
          >
            <span className="flex items-center gap-1">
              {GlobeIcon}
              <span className="text-xs font-medium hidden sm:inline">
                {isBn ? 'EN' : 'বাং'}
              </span>
            </span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle theme"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? SunIcon : MoonIcon}
          </button>
        </div>
      </div>
    </header>
  );
}
