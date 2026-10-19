'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff, X } from 'lucide-react';

import { useIsConnected } from '@/hooks/use-online';

export function OfflineBanner() {
  const connected = useIsConnected();
  const [dismissed, setDismissed] = useState(false);

  const visible = !connected && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="mx-auto w-full max-w-3xl px-4 pt-2">
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-l from-amber-400 to-orange-400 px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-950">
                <WifiOff className="size-4 shrink-0" aria-hidden />
                <span>
                  آفلاین هستی! پیام‌هات ذخیره می‌شن و به‌محض اتصال ارسال می‌شن
                </span>
              </div>
              <button
                type="button"
                aria-label="بستن"
                onClick={() => setDismissed(true)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-amber-950 transition-colors hover:bg-black/10"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
