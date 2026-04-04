import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to capture and handle the browser's PWA install prompt.
 *
 * The `beforeinstallprompt` event fires when the browser determines
 * the app is installable. We capture the event and expose it via
 * `isInstallable` and `promptInstall()`.
 *
 * Also tracks `isInstalled` by listening for the `appinstalled` event.
 */
export default function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPromptRef = useRef(null);

  // ---- Listen for the beforeinstallprompt event ----
  useEffect(() => {
    // Check if already installed (iOS doesn't fire appinstalled reliably)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    const handler = (e) => {
      // Prevent the default mini-infobar on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPromptRef.current = e;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // ---- Listen for successful installation ----
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  // ---- Trigger the install prompt manually ----
  const promptInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) {
      console.warn('Install prompt not available');
      return { success: false, reason: 'not_available' };
    }

    try {
      // Show the native install dialog
      prompt.prompt();

      // Wait for the user to respond
      const outcome = await prompt.userChoice;

      // Clean up — the prompt can only be used once
      deferredPromptRef.current = null;

      if (outcome.outcome === 'accepted') {
        setIsInstallable(false);
        return { success: true, outcome: 'accepted' };
      } else {
        return { success: false, outcome: 'dismissed' };
      }
    } catch (err) {
      console.error('Install prompt failed:', err);
      deferredPromptRef.current = null;
      return { success: false, outcome: 'error', error: err };
    }
  }, []);

  // ---- Dismiss the install prompt without installing ----
  const dismissInstall = useCallback(() => {
    deferredPromptRef.current = null;
    setIsInstallable(false);
  }, []);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissInstall,
  };
}
export { useInstallPrompt };
export default useInstallPrompt;
