'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PROVIDERS } from '@/lib/providers';
import { cn } from '@/lib/utils';

interface ProviderPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ProviderPicker({
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: ProviderPickerProps) {
  const [tab, setTab] = useState<'all' | 'iran' | 'global'>('all');

  const list = useMemo(() => {
    if (tab === 'iran') return PROVIDERS.filter((p) => p.origin === 'iran');
    if (tab === 'global') return PROVIDERS.filter((p) => p.origin === 'global');
    return PROVIDERS;
  }, [tab]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80dvh] overflow-y-auto nice-scrollbar rounded-t-3xl px-4 pb-8"
      >
        <SheetHeader className="ps-0 pe-0">
          <SheetTitle className="text-start">دستیارت رو انتخاب کن</SheetTitle>
          <SheetDescription className="text-start">
            هر دستیار یه شخصیت متفاوت داره؛ هر وقت خواستی عوضش کن!
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'all' | 'iran' | 'global')}
          className="mt-2"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl text-sm">
              همه
            </TabsTrigger>
            <TabsTrigger value="iran" className="rounded-xl text-sm">
              ایرانی 🇮🇷
            </TabsTrigger>
            <TabsTrigger value="global" className="rounded-xl text-sm">
              بین‌المللی 🌍
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-4 grid grid-cols-2 gap-3 pb-2">
          {list.map((p) => {
            const active = p.id === selectedId;
            return (
              <motion.button
                key={p.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onSelect(p.id);
                  onOpenChange(false);
                }}
                aria-pressed={active}
                className={cn(
                  'relative flex min-h-24 flex-col items-start gap-2 rounded-2xl border bg-card p-3.5 text-start transition-colors',
                  active
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'hover:border-primary/40'
                )}
              >
                <div className="flex w-full items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl',
                      p.gradient
                    )}
                    aria-hidden
                  >
                    {p.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{p.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {p.tagline}
                    </div>
                  </div>
                  {active && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.specialties.slice(0, 2).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
