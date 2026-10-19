'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker in production builds only.
 * In dev mode HMR chunks change constantly, so caching them would break the dev server.
 */
export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {
          // silent - offline is an enhancement, not a requirement
        });
    };

    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);

  return null;
}
