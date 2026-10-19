'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useClearConversations } from '@/hooks/use-conversations';
import { useIsConnected, useOnline } from '@/hooks/use-online';
import {
  clearLocalChats,
  getLocalModelOption,
  hasWebGPU,
  LOCAL_MODELS,
  useOnDeviceStore,
} from '@/lib/ondevice';
import { useUIStore, type FontScale } from '@/lib/store';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const THEME_OPTIONS = [
  { value: 'light', label: 'روشن', emoji: '☀️' },
  { value: 'dark', label: 'تاریخی', emoji: '🌙' },
  { value: 'system', label: 'سیستم', emoji: '💻' },
] as const;

type ThemeValue = (typeof THEME_OPTIONS)[number]['value'];

const FONT_OPTIONS: { value: FontScale; label: string }[] = [
  { value: 'sm', label: 'کوچک' },
  { value: 'md', label: 'متوسط' },
  { value: 'lg', label: 'بزرگ' },
];

const emptySubscribe = () => () => {};

/** بعد از hydration شدن true می‌شه (بدون setState داخل effect) */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function SettingsCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <h2 className="font-bold">{title}</h2>
      {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ConnectionBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <Badge className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
        آنلاین
      </Badge>
    );
  }
  return (
    <Badge className="shrink-0 rounded-full border border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
      آفلاین
    </Badge>
  );
}

export function SettingsView() {
  const setView = useUIStore((s) => s.setView);
  const fontScale = useUIStore((s) => s.fontScale);
  const setFontScale = useUIStore((s) => s.setFontScale);
  const simulatedOffline = useUIStore((s) => s.simulatedOffline);
  const setSimulatedOffline = useUIStore((s) => s.setSimulatedOffline);

  const { theme, setTheme } = useTheme();
  const realOnline = useOnline();
  const connected = useIsConnected();
  const clearMutation = useClearConversations();

  const mounted = useMounted();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  // هوش مصنوعی روی دستگاه
  const odModelId = useOnDeviceStore((s) => s.modelId);
  const odSetModelId = useOnDeviceStore((s) => s.setModelId);
  const odDownloadedModelId = useOnDeviceStore((s) => s.downloadedModelId);
  const odDownloadState = useOnDeviceStore((s) => s.downloadState);
  const odProgress = useOnDeviceStore((s) => s.progress);
  const odProgressText = useOnDeviceStore((s) => s.progressText);
  const odErrorText = useOnDeviceStore((s) => s.errorText);
  const odPrepare = useOnDeviceStore((s) => s.prepare);
  const odRemoveModel = useOnDeviceStore((s) => s.removeModel);
  const odSupported = mounted && hasWebGPU();
  const odState =
    odDownloadState === 'downloading' || odDownloadState === 'error'
      ? odDownloadState
      : odDownloadedModelId === odModelId
        ? ('cached' as const)
        : ('undownloaded' as const);

  // اعمال اندازه‌ی قلم روی ریشه‌ی سند
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-sm', 'font-scale-md', 'font-scale-lg');
    root.classList.add(`font-scale-${fontScale}`);
  }, [fontScale]);

  // گرفتن رویداد نصب PWA
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const currentTheme: ThemeValue = mounted && theme ? (theme as ThemeValue) : 'system';

  const handleSimulate = (v: boolean) => {
    setSimulatedOffline(v);
    if (v) {
      toast.info('حالت آفلاین آزمایشی روشن شد 🛜 تا خاموشش کنی، برنامه آفلاین رفتار می‌کنه');
    } else {
      toast.success('دوباره آنلاین شدی! 🎉');
    }
  };

  const handleInstall = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') {
        toast.success('هوش‌یار نصب شد! 🎉');
      }
      setInstallEvent(null);
    } catch {
      toast.error('نصب انجام نشد! بعداً دوباره امتحان کن');
    }
  };

  const handleClearAll = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => {
        clearLocalChats();
        toast.success('همه گفتگوها پاک شدن 🧹');
      },
      onError: () => toast.error('پاک کردن نشد! دوباره امتحان کن'),
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-4 pt-4">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-xl"
          aria-label="بازگشت به خانه"
          onClick={() => setView('home')}
        >
          <ArrowRight className="size-5" aria-hidden />
        </Button>
        <h1 className="text-xl font-extrabold">تنظیمات</h1>
      </div>

      {/* ظاهر */}
      <SettingsCard title="ظاهر 🎨" desc="تم و اندازه‌ی قلم برنامه رو به سلیقه‌ی خودت تنظیم کن">
        <div>
          <p className="mb-2 text-sm font-medium">تم برنامه</p>
          <div className="flex w-fit gap-1 rounded-xl bg-secondary p-1">
            {THEME_OPTIONS.map((opt) => {
              const active = currentTheme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={`تم ${opt.label}`}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'relative flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="theme-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-lg bg-background shadow-sm"
                    />
                  )}
                  <span className="relative z-10" aria-hidden>
                    {opt.emoji}
                  </span>
                  <span className="relative z-10">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">اندازه‌ی قلم</p>
          <div className="flex w-fit gap-1 rounded-xl bg-secondary p-1">
            {FONT_OPTIONS.map((opt) => {
              const active = fontScale === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={`قلم ${opt.label}`}
                  onClick={() => setFontScale(opt.value)}
                  className={cn(
                    'relative flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="font-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-lg bg-background shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SettingsCard>

      {/* اتصال */}
      <SettingsCard title="اتصال 🌐" desc="وضعیت اینترنت و حالت آزمایشی آفلاین">
        <div className="flex min-h-11 items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">اتصال واقعی دستگاه</p>
            <p className="text-xs text-muted-foreground">
              {realOnline
                ? 'اینترنت دستگاه وصله و همه‌چیز اوکیه'
                : 'اینترنت دستگاه قطعه'}
            </p>
          </div>
          <ConnectionBadge connected={realOnline} />
        </div>

        <Separator />

        <div className="flex min-h-11 items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">وضعیت برنامه</p>
            <p className="text-xs text-muted-foreground">
              {connected
                ? 'وصل به اینترنته و آماده‌ی گفتگوئه ✅'
                : 'آفلاینی و پیام‌ها تا وصل شدن، صف می‌شن'}
            </p>
          </div>
          <ConnectionBadge connected={connected} />
        </div>

        <Separator />

        <div className="flex min-h-11 items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">
              شبیه‌سازی قطع اینترنت (برای تست آفلاین)
            </p>
            <p className="text-xs text-muted-foreground">
              وقتی روشنش کنی، برنامه طوری رفتار می‌کنه که انگار اینترنت قطعه
            </p>
          </div>
          <Switch
            checked={simulatedOffline}
            onCheckedChange={handleSimulate}
            aria-label="شبیه‌سازی قطع اینترنت"
          />
        </div>
      </SettingsCard>

      {/* هوش مصنوعی روی دستگاه */}
      <SettingsCard
        title="هوش مصنوعی روی دستگاه 📴"
        desc="بدون اینترنت چت کن — مدل روی پردازنده‌ی خود گوشی اجرا می‌شه"
      >
        {!mounted ? null : !odSupported ? (
          <p className="text-sm leading-7 text-muted-foreground">
            متأسفانه مرورگر یا WebView این دستگاه از WebGPU پشتیبانی نمی‌کنه.
            برای اجرای محلی، Android System WebView رو به‌روز نگه دار (نسخه‌ی ۱۲۱ به بالا).
          </p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-medium">مدل</p>
              <div className="grid grid-cols-2 gap-2">
                {LOCAL_MODELS.map((m) => {
                  const active = odModelId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => odSetModelId(m.id)}
                      className={cn(
                        'rounded-2xl border bg-card p-3 text-start transition-colors',
                        active
                          ? 'border-primary ring-2 ring-primary/40'
                          : 'hover:border-primary/40'
                      )}
                    >
                      <p className="text-sm font-bold">
                        {m.emoji} {m.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
                        {m.desc}
                      </p>
                      <p className="mt-1 text-[11px] font-medium">{m.sizeFa}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {odState === 'downloading' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    در حال دانلود و آماده‌سازی…
                  </span>
                  <span>{Math.round(odProgress * 100).toLocaleString('fa-IR')}٪</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuenow={Math.round(odProgress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-rose-400 transition-all"
                    style={{ width: `${Math.max(2, Math.round(odProgress * 100))}%` }}
                  />
                </div>
                <p dir="ltr" className="truncate text-[10px] text-muted-foreground">
                  {odProgressText}
                </p>
                <p className="text-[11px] leading-5 text-muted-foreground">
                  این صفحه رو نبند تا دانلود کامل شه 🙏
                </p>
              </div>
            ) : odState === 'cached' ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">مدل آماده است ✅</p>
                  <p className="text-xs text-muted-foreground">
                    از این به بعد بدون اینترنت هم کار می‌کنه
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-9 shrink-0 rounded-xl px-3">
                      حذف مدل
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>مدل آفلاین حذف بشه؟</AlertDialogTitle>
                      <AlertDialogDescription>
                        مدل دانلودشده پاک می‌شه و برای استفاده‌ی دوباره باید یک‌بار دیگه دانلودش کنی. گفتگوها پاک نمی‌شن.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>نه، بیخیال</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => void odRemoveModel()}
                      >
                        آره، حذف کن
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : odState === 'error' ? (
              <div className="space-y-3">
                <p className="text-xs leading-6 text-rose-600 dark:text-rose-400">
                  دانلود کامل نشد: {odErrorText ?? 'خطای ناشناخته'}
                </p>
                <Button onClick={() => void odPrepare()} className="h-11 rounded-2xl px-5 font-bold">
                  <Download className="size-4" aria-hidden />
                  تلاش دوباره
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button onClick={() => void odPrepare()} className="h-11 rounded-2xl px-5 font-bold">
                  <Download className="size-4" aria-hidden />
                  دانلود مدل ({getLocalModelOption(odModelId).sizeFa})
                </Button>
                <p className="text-xs leading-6 text-muted-foreground">
                  دانلود فقط یک‌بار و با اینترنت انجام می‌شه؛ بعدش همه‌چیز کاملاً آفلاین کار می‌کنه.
                  گفتگوهای آفلاین فقط روی خود دستگاه ذخیره می‌شن و جایی نمی‌رن.
                </p>
              </div>
            )}
          </>
        )}
      </SettingsCard>

      {/* نصب برنامه */}
      <SettingsCard title="نصب برنامه 📲" desc="هوش‌یار رو روی گوشی یا دسکتاپت نصب کن">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleInstall}
            disabled={!installEvent}
            className="h-11 rounded-2xl px-5 font-bold"
          >
            <Download className="size-4" aria-hidden />
            افزودن به صفحه اصلی
          </Button>
          {!installEvent && (
            <p className="text-xs text-muted-foreground">
              از منوی مرورگر گزینه Add to Home Screen رو انتخاب کن
            </p>
          )}
        </div>
      </SettingsCard>

      {/* داده‌ها */}
      <SettingsCard title="داده‌ها 💾" desc="حافظه‌ی گفتگوها و تصاویر">
        <div className="flex min-h-11 items-center justify-between gap-4 rounded-2xl bg-secondary/60 p-4">
          <p className="text-sm">همه گفتگوها روی همین دستگاه ذخیره می‌شن</p>
          <Badge variant="secondary" className="shrink-0 rounded-full">
            محلی و خصوصی
          </Badge>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="h-11 rounded-2xl px-5 font-bold">
              <Trash2 className="size-4" aria-hidden />
              پاک کردن همه گفتگوها
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>همه گفتگوها پاک بشن؟</AlertDialogTitle>
              <AlertDialogDescription>
                همه گفتگوها برای همیشه پاک می‌شن و دیگه نمی‌شه برگردوندشون. مطمئنی؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>نه، بیخیال</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={handleClearAll}
              >
                آره، پاک کن
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsCard>

      {/* درباره */}
      <SettingsCard title="درباره هوش‌یار ✨">
        <div className="flex items-start gap-4">
          <Image
            src="/icons/icon-192.png"
            alt="آیکون هوش‌یار"
            width={56}
            height={56}
            className="rounded-2xl shadow-sm"
          />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold">هوش‌یار</p>
              <Badge variant="secondary" className="rounded-full">
                نسخه ۱٫۱٫۰
              </Badge>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              هوش‌یار یک پلتفرم یکپارچه برای دسترسی ساده به هوش مصنوعی‌های ایرانی و
              بین‌المللی است. آماده انتشار در کافه‌بازار و مایکت.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full border border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                آماده بازار
              </Badge>
              <Badge className="rounded-full border border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                آماده مایکت
              </Badge>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
