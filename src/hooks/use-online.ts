'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/store';

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}

/** real connectivity AND user has not enabled the offline simulator */
export function useIsConnected(): boolean {
  const online = useOnline();
  const simulatedOffline = useUIStore((s) => s.simulatedOffline);
  return online && !simulatedOffline;
}
