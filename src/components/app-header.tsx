'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Moon, Settings, Sun, WifiOff } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsConnected } from '@/hooks/use-online';
import { useUIStore } from '@/lib/store';

const emptySubscribe = () => () => {};

/** بعد از hydration شدن true می‌شه (بدون setState داخل effect) */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function AppHeader() {
  const setView = useUIStore((s) => s.setView);
  const connected = useIsConnected();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-2 px-4">
        {/* لوگو و نام برنامه (سمت شروع در RTL) */}
        <div className="flex min-w-0 items-center gap-2.5">
          {/* plain img: 36px decorative logo, no optimizer needed; ?v=N busts icon cache on updates */}
          <img
            src="/icons/icon-192.png?v=2"
            alt="آیکون هوش‌یار"
            width={36}
            height={36}
            className="rounded-xl shadow-sm"
            loading="eager"
          />
          <div className="min-w-0 leading-tight">
            <p className="text-lg font-extrabold">هوش‌یار</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              همه هوش مصنوعی‌ها در یک جا
            </p>
          </div>
        </div>

        {/* وضعیت اتصال + تنظیمات + تم (سمت پایان در RTL) */}
        <div className="flex shrink-0 items-center gap-1.5">
          {connected ? (
            <Badge className="rounded-full border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              آنلاین
            </Badge>
          ) : (
            <Badge className="gap-1 rounded-full border border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
              <WifiOff className="size-3" />
              آفلاین
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-xl"
            aria-label="تنظیمات"
            onClick={() => setView('settings')}
          >
            <Settings className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-xl"
            aria-label={
              mounted && resolvedTheme === 'dark'
                ? 'تغییر به تم روشن'
                : 'تغییر به تم تاریک'
            }
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {mounted && resolvedTheme === 'dark' ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
