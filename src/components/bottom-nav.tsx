'use client';

import { motion } from 'framer-motion';
import { History, Home, MessageCircleHeart, Palette } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useUIStore, type AppView } from '@/lib/store';
import { cn } from '@/lib/utils';

interface NavTab {
  view: AppView;
  label: string;
  icon: LucideIcon;
}

const TABS: NavTab[] = [
  { view: 'home', label: 'خانه', icon: Home },
  { view: 'chat', label: 'گفتگو', icon: MessageCircleHeart },
  { view: 'image', label: 'تصویر', icon: Palette },
  { view: 'history', label: 'تاریخچه', icon: History },
];

export function BottomNav() {
  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 backdrop-blur-md"
    >
      <div
        className="mx-auto grid w-full max-w-3xl grid-cols-4 gap-1 px-2 pt-1.5"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {TABS.map((tab) => {
          const active = view === tab.view;
          const Icon = tab.icon;
          return (
            <button
              key={tab.view}
              type="button"
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => setView(tab.view)}
              className={cn(
                'relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] transition-colors',
                active ? 'font-bold text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/15 to-accent"
                />
              )}
              <Icon className="relative z-10 size-5" aria-hidden />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
