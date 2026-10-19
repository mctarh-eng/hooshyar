'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  Palette,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteImage, useImageList } from '@/hooks/use-conversations';
import { IMAGES_KEY } from '@/hooks/use-conversations';
import type { ImageRecord } from '@/lib/types';
import { cn, timeAgo } from '@/lib/utils';

const SIZE_OPTIONS = [
  { value: '1024x1024', label: 'مربع', aspect: 'aspect-square' },
  { value: '864x1152', label: 'عمودی', aspect: 'aspect-[3/4]' },
  { value: '1152x864', label: 'افقی', aspect: 'aspect-[4/3]' },
] as const;

const STYLE_OPTIONS = [
  { value: '', label: 'بدون استایل', emoji: '🎲' },
  { value: 'photorealistic photography, realistic lighting', label: 'واقعی', emoji: '📷' },
  { value: 'cute cartoon illustration style, vibrant colors', label: 'کارتونی', emoji: '🎨' },
  { value: 'watercolor painting, soft brush strokes', label: 'آبرنگ', emoji: '🖌️' },
  { value: '3D render, pixar style, soft studio lighting', label: 'سه‌بعدی', emoji: '🧸' },
  { value: 'minimal flat logo design, vector, clean', label: 'لوگو', emoji: '⭐' },
] as const;

const LOADING_TEXTS = [
  'داره نقاشی می‌کشه… 🖌️',
  'یه کم الهام می‌گیره… 💭',
  'رنگ‌ها رو قاطی می‌کنه… 🌈',
  'قلم‌موی جادویی آماده‌ست… ✨',
];

function aspectClass(size: string): string {
  if (size === '768x1344' || size === '720x1440') return 'aspect-[9/16]';
  if (size === '864x1152') return 'aspect-[3/4]';
  if (size === '1344x768') return 'aspect-[16/9]';
  if (size === '1152x864') return 'aspect-[4/3]';
  if (size === '1440x720') return 'aspect-[2/1]';
  return 'aspect-square';
}

export function ImageStudio() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<string>('1024x1024');
  const [style, setStyle] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [zoomed, setZoomed] = useState<ImageRecord | null>(null);

  const { data: images = [], isLoading } = useImageList();
  const deleteImage = useDeleteImage();
  const qc = useQueryClient();

  const generate = async () => {
    const text = prompt.trim();
    if (!text || generating) return;
    setGenerating(true);

    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      setLoadingText(LOADING_TEXTS[tick % LOADING_TEXTS.length]);
    }, 2500);

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, size, style }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? 'ساخت تصویر ناموفق بود');
      }
      const record = json as ImageRecord;
      qc.setQueryData<ImageRecord[]>([IMAGES_KEY], (prev) =>
        prev ? [record, ...prev] : [record]
      );
      toast.success('تصویرت آماده شد! 🎉');
    } catch (e) {
      toast.error(
        e instanceof Error && e.message.length < 80
          ? e.message
          : 'ساخت تصویر ناموفق بود؛ دوباره تلاش کن'
      );
    } finally {
      clearInterval(timer);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5 pb-2">
      {/* header */}
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-pink-500 text-2xl shadow-md">
          🎨
        </span>
        <div>
          <h1 className="text-lg font-extrabold">استودیو تصویرسازی</h1>
          <p className="text-xs text-muted-foreground">
            چیزی که تو ذهنت رو توصیف کن، ما می‌کشیمش!
          </p>
        </div>
      </div>

      {/* composer card */}
      <div className="rounded-3xl border bg-card p-4 shadow-sm">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='مثلاً: «یه گربه‌ی فضانورد که رو ماه اسکی بازی می‌کنه» 🐱🚀'
          rows={2}
          className="nice-scrollbar max-h-32 min-h-11 resize-none rounded-2xl bg-secondary/50 text-[15px] leading-7"
          aria-label="توضیح تصویر"
        />

        <div className="mt-3 space-y-2.5">
          <div>
            <p className="mb-1.5 text-xs font-bold text-muted-foreground">
              اندازه
            </p>
            <div className="flex gap-2">
              {SIZE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSize(s.value)}
                  aria-pressed={size === s.value}
                  className={cn(
                    'min-h-9 flex-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all',
                    size === s.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'bg-secondary/40 text-muted-foreground hover:border-primary/40'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold text-muted-foreground">
              استایل
            </p>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.value || 'none'}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  aria-pressed={style === s.value}
                  className={cn(
                    'flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all',
                    style === s.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'bg-secondary/40 text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <span aria-hidden>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={generate}
          disabled={!prompt.trim() || generating}
          className="mt-4 h-12 w-full rounded-2xl bg-gradient-to-l from-fuchsia-500 via-rose-500 to-amber-400 text-base font-extrabold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-spin" />
              {loadingText}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              بسازش!
            </span>
          )}
        </Button>
      </div>

      {/* gallery */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold">گالری تصاویر تو</h2>
          {images.length > 0 && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-secondary-foreground">
              {images.length.toLocaleString('fa-IR')} تصویر
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-2xl bg-secondary/60"
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed py-10 text-center">
            <span className="soft-float text-4xl" aria-hidden>
              🖼️
            </span>
            <p className="text-sm font-bold">هنوز تصویری نساختی</p>
            <p className="text-xs text-muted-foreground">
              اولین ایده‌ت رو بنویس و دکمه‌ی «بسازش» رو بزن!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <AnimatePresence initial={false}>
              {images.map((img) => (
                <motion.figure
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setZoomed(img)}
                    className={cn('block w-full', aspectClass(img.size))}
                    aria-label={`بزرگ‌نمایی تصویر: ${img.prompt}`}
                  >
                    <img
                      src={`/api/image/${img.id}`}
                      alt={img.prompt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                  <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 text-[10px] leading-4 text-white line-clamp-2">
                    {img.prompt}
                  </figcaption>
                  <button
                    type="button"
                    onClick={() => {
                      deleteImage.mutate(img.id, {
                        onSuccess: () => toast.success('تصویر حذف شد'),
                        onError: () => toast.error('حذف نشد؛ دوباره تلاش کن'),
                      });
                    }}
                    aria-label="حذف تصویر"
                    className="absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity hover:bg-rose-500 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.figure>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* zoom dialog */}
      <Dialog open={!!zoomed} onOpenChange={(o) => !o && setZoomed(null)}>
        <DialogContent className="max-w-md rounded-3xl p-4">
          <DialogHeader className="sr-only">
            <DialogTitle>تصویر ساخته‌شده</DialogTitle>
            <DialogDescription>{zoomed?.prompt}</DialogDescription>
          </DialogHeader>
          {zoomed && (
            <div className="space-y-3">
              <img
                src={`/api/image/${zoomed.id}`}
                alt={zoomed.prompt}
                className="max-h-[55dvh] w-full rounded-2xl object-contain"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {zoomed.prompt}
              </p>
              <div className="flex gap-2">
                <a
                  href={`/api/image/${zoomed.id}`}
                  download={`hooshyar-${zoomed.id}.png`}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-fuchsia-500 to-rose-500 text-sm font-bold text-white"
                >
                  <Download className="h-4 w-4" />
                  دانلود تصویر
                </a>
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-2xl text-sm"
                  onClick={() => {
                    setPrompt(zoomed.prompt);
                    setZoomed(null);
                    toast.info('توضیح کپی شد؛ یه استایل دیگه امتحان کن!');
                  }}
                >
                  <Send className="h-4 w-4" />
                  با همین ایده بساز
                </Button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground">
                {timeAgo(zoomed.createdAt)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
