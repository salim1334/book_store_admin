'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Download } from 'lucide-react';

export function ServiceWorkerRegistration() {
  const [offline, setOffline] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.error('SW registration failed:', err));
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result?.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {installPrompt && (
        <div className="bg-primary text-primary-foreground px-4 py-2 text-sm shadow-md flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Add Book Store Admin to your home screen for an app-like experience.
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setInstallPrompt(null)}
              className="text-xs underline opacity-90"
            >
              Dismiss
            </button>
            <button
              onClick={handleInstall}
              className="bg-white text-primary text-xs font-semibold px-3 py-1.5 rounded"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {offline && (
        <div
          className="fixed bottom-0 inset-x-0 z-50 bg-amber-50 border-t border-amber-200 px-4 py-2 text-center text-sm text-amber-800 flex items-center justify-center gap-2"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <WifiOff className="h-4 w-4" />
          You are offline. Some features may be unavailable.
        </div>
      )}
    </>
  );
}
