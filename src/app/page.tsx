'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { OfflineBanner } from '@/components/offline-banner';
import { QueueFlusher } from '@/components/queue-flusher';
import { HomeView } from '@/components/home-view';
import { ChatView } from '@/components/chat-view';
import { ImageStudio } from '@/components/image-studio';
import { HistoryView } from '@/components/history-view';
import { SettingsView } from '@/components/settings-view';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function Page() {
  const view = useUIStore((s) => s.view);
  const fontScale = useUIStore((s) => s.fontScale);
  const isChat = view === 'chat';

  // apply font scale globally (covers app reloads too)
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    el.classList.add(`font-scale-${fontScale}`);
  }, [fontScale]);

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-orange-50/80 via-rose-50/60 to-amber-50/70 dark:from-stone-950 dark:via-stone-950 dark:to-stone-900">
      <QueueFlusher />
      <AppHeader />
      {!isChat && <OfflineBanner />}
      <main
        className={cn(
          'mx-auto flex w-full max-w-3xl flex-1 flex-col min-h-0',
          isChat ? 'overflow-hidden' : 'px-3 pb-24 pt-3'
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn('flex flex-1 flex-col', isChat && 'min-h-0')}
          >
            {view === 'home' && <HomeView />}
            {view === 'chat' && <ChatView />}
            {view === 'image' && <ImageStudio />}
            {view === 'history' && <HistoryView />}
            {view === 'settings' && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </main>
      {!isChat && <BottomNav />}
    </div>
  );
}
