'use client';

import { useState, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Palette, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PROVIDERS, type AIProvider } from '@/lib/providers';
import { useUIStore } from '@/lib/store';
import { cn, faDate, greetingByHour } from '@/lib/utils';

type ProviderTab = 'all' | 'iran' | 'global';

interface Capability {
  emoji: string;
  title: string;
  desc: string;
  view: 'chat' | 'image' | null;
  soon?: boolean;
}

const CAPABILITIES: Capability[] = [
  { emoji: '💬', title: 'گفتگوی هوشمند', desc: 'با ۱۰ دستیار هوشمند', view: 'chat' },
  { emoji: '🎨', title: 'تصویرسازی', desc: 'از متن به تصویر', view: 'image' },
  { emoji: '🔊', title: 'گفتار صوتی', desc: 'جواب‌ها رو بشنو', view: 'chat' },
  { emoji: '🔍', title: 'به‌زودی: جستجوی وب', desc: 'جستجو در وب فارسی', view: null, soon: true },
];

const SUGGESTIONS: { emoji: string; text: string }[] = [
  { emoji: '📝', text: 'یه شعر کوتاه درباره‌ی بارون بگو' },
  { emoji: '🧳', text: 'چک‌لیست سفر ۳ روزه به شمال ایران' },
  { emoji: '🍳', text: 'با تخم‌مرغ چی می‌شه درست کرد؟' },
  { emoji: '💼', text: 'برای مصاحبه کاری رو تمرین بذار' },
  { emoji: '🎁', text: 'اسم برای استارتاپم پیشنهاد بده' },
  { emoji: '📚', text: 'ریاضی کلاس ششم رو برام ساده کن' },
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

function ProviderCard({
  provider,
  onSelect,
}: {
  provider: AIProvider;
  onSelect: (p: AIProvider) => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(provider)}
      className="rounded-2xl border bg-card p-4 text-start shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-sm',
            provider.gradient
          )}
          aria-hidden
        >
          {provider.emoji}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold">{provider.name}</p>
          <p dir="ltr" className="inline-block text-xs text-muted-foreground">
            {provider.latinName}
          </p>
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 min-h-8 text-xs leading-5 text-muted-foreground">
        {provider.tagline}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {provider.specialties.slice(0, 2).map((s) => (
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
}

export function HomeView() {
  const setView = useUIStore((s) => s.setView);
  const startNewChat = useUIStore((s) => s.startNewChat);
  const askSuggestion = useUIStore((s) => s.askSuggestion);
  const setProviderId = useUIStore((s) => s.setProviderId);

  // مقادیر وابسته به زمان فقط بعد از hydration محاسبه می‌شن تا hydration mismatch نشه
  const mounted = useMounted();
  const greeting = mounted
    ? greetingByHour()
    : { text: 'سلام', emoji: '👋' };
  const today = mounted ? faDate(new Date()) : '';
  const [providerTab, setProviderTab] = useState<ProviderTab>('all');

  const handleProvider = (p: AIProvider) => {
    setProviderId(p.id);
    startNewChat();
    toast.success(`با «${p.name}» شروع کردی!`);
  };

  const filteredProviders =
    providerTab === 'all'
      ? PROVIDERS.filter((p) => !p.local) // دستیار آفلاین از پیکر جدا انتخاب می‌شه
      : PROVIDERS.filter((p) => p.origin === providerTab);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pb-4 pt-4">
      {/* بخش ۱: هیرو */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="gradient-hero relative overflow-hidden rounded-3xl p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute -top-14 -start-14 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -end-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <span className="soft-float inline-block text-5xl" aria-hidden>
              {greeting.emoji}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">
              {greeting.text}!
            </h1>
            {today && (
              <p className="mt-1 text-sm text-white/85">{today}</p>
            )}
            <p className="mt-2 max-w-md text-sm leading-7 text-white/90">
              هر هوش مصنوعی که بخوای، اینجا یه جا — ایرانی و خارجی، فقط با یه لمس!
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={startNewChat}
                className="h-11 rounded-2xl border border-white/30 bg-white/20 px-5 font-bold text-white backdrop-blur hover:bg-white/30 hover:text-white"
              >
                <Sparkles className="size-4" aria-hidden />
                شروع گفتگو
              </Button>
              <Button
                onClick={() => setView('image')}
                className="h-11 rounded-2xl border border-white/30 bg-white/20 px-5 font-bold text-white backdrop-blur hover:bg-white/30 hover:text-white"
              >
                <Palette className="size-4" aria-hidden />
                ساخت تصویر
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* بخش ۲: قابلیت‌ها */}
      <section>
        <h2 className="mb-3 text-base font-extrabold">
          چیکار می‌تونیم برات بکنیم؟ 🚀
        </h2>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {CAPABILITIES.map((cap) => (
            <button
              key={cap.title}
              type="button"
              disabled={!cap.view}
              onClick={() => cap.view && setView(cap.view)}
              className={cn(
                'relative min-w-[140px] snap-start rounded-2xl border bg-card p-4 text-start shadow-sm transition-colors',
                cap.view && 'hover:border-primary/40',
                !cap.view && 'opacity-60'
              )}
            >
              {cap.soon && (
                <Badge className="absolute end-3 top-3 rounded-full border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  به‌زودی
                </Badge>
              )}
              <span className="text-3xl" aria-hidden>
                {cap.emoji}
              </span>
              <p className="mt-2 text-sm font-bold">{cap.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{cap.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* بخش ۳: انتخاب دستیار */}
      <section>
        <h2 className="mb-3 text-base font-extrabold">
          دستیارها رو انتخاب کن 🤝
        </h2>
        <Tabs
          value={providerTab}
          onValueChange={(v) => setProviderTab(v as ProviderTab)}
        >
          <TabsList className="h-11 w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-secondary p-1 no-scrollbar sm:w-fit">
            <TabsTrigger
              value="all"
              className="min-h-9 rounded-xl px-4 text-sm data-[state=active]:shadow-sm"
            >
              همه
            </TabsTrigger>
            <TabsTrigger
              value="iran"
              className="min-h-9 rounded-xl px-4 text-sm data-[state=active]:shadow-sm"
            >
              ایرانی 🇮🇷
            </TabsTrigger>
            <TabsTrigger
              value="global"
              className="min-h-9 rounded-xl px-4 text-sm data-[state=active]:shadow-sm"
            >
              بین‌المللی 🌍
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <motion.div
          key={providerTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {filteredProviders.map((p) => (
            <ProviderCard key={p.id} provider={p} onSelect={handleProvider} />
          ))}
        </motion.div>
      </section>

      {/* بخش ۴: پیشنهادها */}
      <section>
        <h2 className="mb-3 text-base font-extrabold">
          پیشنهاد برای شروع ✨
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              type="button"
              onClick={() => askSuggestion(s.text)}
              className="flex items-center gap-3 rounded-xl border bg-card p-3.5 text-start text-sm shadow-sm transition-colors hover:border-primary/40"
            >
              <span className="text-xl" aria-hidden>
                {s.emoji}
              </span>
              <span className="leading-6">{s.text}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="py-6 text-center text-xs text-muted-foreground">
        ساخته شده با ❤️ برای کاربران فارسی‌زبان
      </p>
    </div>
  );
}
