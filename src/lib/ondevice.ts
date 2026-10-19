'use client';

/**
 * هوش‌یارِ آفلاین — on-device AI engine
 *
 * Runs a small LLM (Qwen3.5 family) fully on the phone's GPU via
 * WebGPU inside the WebView (WebLLM). Weights are downloaded once and
 * cached by the browser/WebView, afterwards everything works offline.
 *
 * Local conversations are stored ONLY on the device (localStorage) —
 * nothing is sent to any server. That's a privacy feature. 📴
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/* ────────────────────────── capability ────────────────────────── */

export function hasWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/* ────────────────────────── model catalog ─────────────────────── */

export interface LocalModelOption {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  sizeFa: string;
}

export const LOCAL_MODELS: LocalModelOption[] = [
  {
    id: 'Qwen3.5-0.8B-q4f16_1-MLC',
    label: 'مینی',
    emoji: '🐣',
    desc: 'سبک و سریع — مناسب همه‌ی گوشی‌ها',
    sizeFa: 'حدود ۶۰۰ مگابایت',
  },
  {
    id: 'Qwen3.5-2B-q4f16_1-MLC',
    label: 'قوی‌تر',
    emoji: '💪',
    desc: 'پاسخ‌های باکیفیت‌تر — گوشی میان‌رده به بالا',
    sizeFa: 'حدود ۱٫۳ گیگابایت',
  },
];

export const DEFAULT_LOCAL_MODEL_ID = LOCAL_MODELS[0].id;

export function getLocalModelOption(id: string): LocalModelOption {
  return LOCAL_MODELS.find((m) => m.id === id) ?? LOCAL_MODELS[0];
}

/* ────────────────────────── engine (runtime) ──────────────────── */

type ProgressFn = (progress: number, text: string) => void;

interface EngineLike {
  chat: {
    completions: {
      create: (req: Record<string, unknown>) => Promise<AsyncIterable<{
        choices?: { delta?: { content?: string } }[];
      }>>;
    };
  };
  interruptGenerate: () => Promise<void>;
}

let enginePromise: Promise<EngineLike> | null = null;
let loadedModelId: string | null = null;

export function isEngineLoaded(modelId: string): boolean {
  return enginePromise !== null && loadedModelId === modelId;
}

async function createEngine(
  modelId: string,
  onProgress?: ProgressFn
): Promise<EngineLike> {
  const webllm = await import('@mlc-ai/web-llm');
  const engine = await webllm.CreateMLCEngine(modelId, {
    initProgressCallback: (r: { progress?: number; text?: string }) => {
      onProgress?.(
        typeof r.progress === 'number' ? r.progress : 0,
        r.text ?? ''
      );
    },
  });
  return engine as unknown as EngineLike;
}

/** Loads (and downloads-on-first-use) the on-device model. */
export async function loadEngine(
  modelId: string,
  onProgress?: ProgressFn
): Promise<EngineLike> {
  if (enginePromise && loadedModelId === modelId) return enginePromise;

  // switching models → best-effort release of the old engine
  if (enginePromise && loadedModelId !== modelId) {
    const old = enginePromise;
    enginePromise = null;
    void old
      .then((e) =>
        (e as unknown as { unload?: () => Promise<void> }).unload?.().catch(
          () => {}
        )
      )
      .catch(() => {});
  }

  const p = createEngine(modelId, onProgress);
  enginePromise = p;
  loadedModelId = modelId;
  try {
    return await p;
  } catch (e) {
    enginePromise = null;
    loadedModelId = null;
    throw e;
  }
}

/* ────────────────────────── streaming chat ────────────────────── */

export interface LocalTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const LOCAL_SYSTEM_PROMPT = [
  'تو «هوش‌یارِ آفلاین» هستی؛ یک دستیار هوش مصنوعی کوچک که مستقیم روی گوشی کاربر اجرا می‌شوی.',
  'همیشه به زبان فارسی روان و خودمونی جواب بده.',
  'پاسخ‌هات کوتاه، مفید و بدون اضافه‌گویی باشد و اگر چیزی را نمی‌دانی صادقانه بگو.',
  'تو به اینترنت دسترسی نداری و اطلاعات لحظه‌ای نداری.',
  '/no_think',
].join(' ');

/** Hides <think>…</think> blocks that reasoning models may emit. */
const THINK_OPEN = '<think>';
const THINK_CLOSE = '</think>';

/** longest suffix of buf that is a proper prefix of tag */
function partialSuffixLen(buf: string, tag: string): number {
  const max = Math.min(tag.length - 1, buf.length);
  for (let l = max; l > 0; l--) {
    if (buf.endsWith(tag.slice(0, l))) return l;
  }
  return 0;
}

function makeThinkFilter(): (chunk: string) => string {
  let hiding = false;
  let pending = '';
  return (chunk: string) => {
    let buf = pending + chunk;
    pending = '';
    let out = '';
    while (buf.length > 0) {
      if (hiding) {
        const end = buf.indexOf(THINK_CLOSE);
        if (end === -1) {
          const keep = partialSuffixLen(buf, THINK_CLOSE);
          pending = keep > 0 ? buf.slice(buf.length - keep) : '';
          return out;
        }
        buf = buf.slice(end + THINK_CLOSE.length);
        hiding = false;
      } else {
        const start = buf.indexOf(THINK_OPEN);
        if (start === -1) {
          const keep = partialSuffixLen(buf, THINK_OPEN);
          out += keep > 0 ? buf.slice(0, buf.length - keep) : buf;
          pending = keep > 0 ? buf.slice(buf.length - keep) : '';
          return out;
        }
        out += buf.slice(0, start);
        buf = buf.slice(start + THINK_OPEN.length);
        hiding = true;
      }
    }
    return out;
  };
}

export async function streamLocalChat(opts: {
  modelId: string;
  system: string;
  history: LocalTurn[];
  userText: string;
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const engine = await loadEngine(opts.modelId);
  if (opts.signal?.aborted) return '';

  const filter = makeThinkFilter();
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: opts.system },
    ...opts.history.slice(-8).map((t) => ({ role: t.role, content: t.content })),
    { role: 'user', content: opts.userText },
  ];

  const chunks = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    top_p: 0.9,
  });

  let full = '';
  try {
    for await (const chunk of chunks) {
      if (opts.signal?.aborted) {
        await engine.interruptGenerate().catch(() => {});
        break;
      }
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        const visible = filter(delta);
        if (visible) {
          full += visible;
          opts.onDelta(visible);
        }
      }
    }
  } finally {
    // stream closed
  }
  return full;
}

/* ─────────────────── local chat store (localStorage) ──────────── */

export interface LocalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface LocalChatMeta {
  id: string;
  title: string;
  modelId: string;
  updatedAt: string;
  lastMessage: string;
}

const CHATS_KEY = 'hooshyar-local-chats';
const chatKey = (id: string) => `hooshyar-local-chat-${id}`;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / unavailable
  }
}

export function listLocalChats(): LocalChatMeta[] {
  return readJSON<LocalChatMeta[]>(CHATS_KEY, []);
}

export function getLocalChatMessages(id: string): LocalChatMessage[] {
  return readJSON<LocalChatMessage[]>(chatKey(id), []);
}

export function createLocalChat(modelId: string): LocalChatMeta {
  const meta: LocalChatMeta = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'گفتگوی آفلاین',
    modelId,
    updatedAt: new Date().toISOString(),
    lastMessage: '',
  };
  writeJSON(CHATS_KEY, [meta, ...listLocalChats()]);
  return meta;
}

export function appendLocalMessage(
  id: string,
  msg: LocalChatMessage,
  opts?: { title?: string }
) {
  const msgs = getLocalChatMessages(id);
  msgs.push(msg);
  writeJSON(chatKey(id), msgs);

  const chats = listLocalChats();
  const idx = chats.findIndex((c) => c.id === id);
  if (idx >= 0) {
    chats[idx] = {
      ...chats[idx],
      updatedAt: msg.createdAt,
      lastMessage: msg.content.slice(0, 120),
      ...(opts?.title ? { title: opts.title } : {}),
    };
    writeJSON(CHATS_KEY, chats);
  }
}

export function renameLocalChat(id: string, title: string) {
  const chats = listLocalChats();
  const idx = chats.findIndex((c) => c.id === id);
  if (idx >= 0) {
    chats[idx] = { ...chats[idx], title };
    writeJSON(CHATS_KEY, chats);
  }
}

export function deleteLocalChat(id: string) {
  if (typeof window !== 'undefined') window.localStorage.removeItem(chatKey(id));
  writeJSON(
    CHATS_KEY,
    listLocalChats().filter((c) => c.id !== id)
  );
}

export function clearLocalChats() {
  if (typeof window === 'undefined') return;
  for (const c of listLocalChats()) window.localStorage.removeItem(chatKey(c.id));
  window.localStorage.removeItem(CHATS_KEY);
}

/* ────────────────────── on-device UI store ────────────────────── */

export type DownloadState = 'undownloaded' | 'downloading' | 'cached' | 'error';

interface OnDeviceState {
  modelId: string;
  /** model id whose weights are fully cached on this device (persisted) */
  downloadedModelId: string | null;
  /** runtime state (not persisted; rehydrated as 'cached' when applicable) */
  downloadState: DownloadState;
  progress: number;
  progressText: string;
  errorText: string | null;
  setModelId: (id: string) => void;
  prepare: () => Promise<boolean>;
  resetDownload: () => void;
  removeModel: () => Promise<void>;
}

export const useOnDeviceStore = create<OnDeviceState>()(
  persist(
    (set, get) => ({
      modelId: DEFAULT_LOCAL_MODEL_ID,
      downloadedModelId: null,
      downloadState: 'undownloaded',
      progress: 0,
      progressText: '',
      errorText: null,

      setModelId: (id) => {
        if (get().downloadState === 'downloading') return;
        set({
          modelId: id,
          downloadState: 'undownloaded',
          errorText: null,
          progress: 0,
          progressText: '',
        });
      },

      /** Download weights (first time) and load the engine. */
      prepare: async () => {
        const s = get();
        if (!hasWebGPU() || s.downloadState === 'downloading') return false;
        set({
          downloadState: 'downloading',
          progress: 0,
          progressText: 'شروع دانلود…',
          errorText: null,
        });
        try {
          await loadEngine(s.modelId, (p, text) =>
            set({ progress: p, progressText: text })
          );
          set({
            downloadState: 'cached',
            downloadedModelId: s.modelId,
            progress: 1,
          });
          return true;
        } catch (e) {
          set({
            downloadState: 'error',
            errorText: e instanceof Error ? e.message : 'خطای ناشناخته',
          });
          return false;
        }
      },

      resetDownload: () =>
        set({
          downloadState: 'undownloaded',
          downloadedModelId: null,
          progress: 0,
          progressText: '',
        }),

      /** Best-effort removal of cached model weights (keeps local chats). */
      removeModel: async () => {
        try {
          if (typeof caches !== 'undefined') {
            await Promise.all(
              ['webllm/config', 'webllm/model', 'webllm/wasm'].map((n) =>
                caches.delete(n)
              )
            );
          }
        } catch {
          // ignore
        }
        enginePromise = null;
        loadedModelId = null;
        set({
          downloadState: 'undownloaded',
          downloadedModelId: null,
          progress: 0,
          progressText: '',
        });
      },
    }),
    {
      name: 'hooshyar-ondevice',
      partialize: (s) => ({
        modelId: s.modelId,
        downloadedModelId: s.downloadedModelId,
      }),
    }
  )
);

/** Persisted state → effective status shown in UI. */
export function effectiveDownloadState(): DownloadState {
  const s = useOnDeviceStore.getState();
  if (s.downloadState === 'downloading' || s.downloadState === 'error')
    return s.downloadState;
  return s.downloadedModelId === s.modelId ? 'cached' : 'undownloaded';
}
