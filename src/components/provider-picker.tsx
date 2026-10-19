'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasWebGPU, useOnDeviceStore } from '@/lib/ondevice';
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
  const downloadedModelId = useOnDeviceStore((s) => s.downloadedModelId);
  const modelId = useOnDeviceStore((s) => s.modelId);
  const localSupported = hasWebGPU();
  const localReady = downloadedModelId === modelId;

  const list = useMemo(() => {
    const cloud = PROVIDERS.filter((p) => !p.local);
    if (tab === 'iran') return cloud.filter((p) => p.origin === 'iran');
    if (tab === 'global') return cloud.filter((p) => p.origin === 'global');
    return cloud;
  }, [tab]);

  const handleLocalSelect = () => {
    onSelect('local');
    onOpenChange(false);
    if (!localSupported) {
      toast.error('دستگاهت از اجرای محلی پشتیبانی نمی‌کنه (WebGPU نداره) 😕');
    } else if (!localReady) {
      toast.info(
        'برای شروع، مدل آفلاین رو یک‌بار دانلود کن: تنظیمات ← هوش مصنوعی روی دستگاه 📴',
        { duration: 6000 }
      );
    }
  };

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

        {/* دستیار روی دستگاه — همیشه بالای لیست */}
        <button
          type="button"
          onClick={handleLocalSelect}
          aria-pressed={selectedId === 'local'}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl border border-dashed bg-card p-3.5 text-start transition-colors',
            selectedId === 'local'
              ? 'border-primary ring-2 ring-primary/40'
              : 'hover:border-primary/50'
          )}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-400 to-zinc-600 text-xl"
            aria-hidden
          >
            📴
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-bold">هوش‌یارِ آفلاین</span>
              {!localSupported ? (
                <Badge variant="secondary" className="shrink-0 rounded-full text-[9px]">
                  WebGPU نداری
                </Badge>
              ) : localReady ? (
                <Badge className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 text-[9px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  آماده ✅
                </Badge>
              ) : (
                <Badge className="shrink-0 rounded-full border border-amber-200 bg-amber-100 text-[9px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  نیاز به دانلود
                </Badge>
              )}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
              بدون اینترنت، روی پردازنده‌ی خود گوشیت — گفتگوها فقط روی دستگاه ذخیره می‌شن
            </span>
          </span>
          {selectedId === 'local' && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
          )}
        </button>

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
