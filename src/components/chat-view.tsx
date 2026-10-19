'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Plus,
  Send,
  Square,
  UsersRound,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, type ChatMessageVM } from '@/components/chat-message';
import { ProviderPicker } from '@/components/provider-picker';
import { useIsConnected } from '@/hooks/use-online';
import { enqueueMessage } from '@/lib/offline-queue';
import { getProvider } from '@/lib/providers';
import { useUIStore } from '@/lib/store';
import type { ConversationDetail } from '@/lib/types';
import { cn } from '@/lib/utils';

const CHAT_SUGGESTIONS = [
  { emoji: '✍️', text: 'یه متن انگیزشی کوتاه برای امروز بگو' },
  { emoji: '🍳', text: 'یه شام ساده و خوشمزه پیشنهاد بده' },
  { emoji: '🧠', text: 'Difference between AI و ML رو ساده توضیح بده' },
  { emoji: '🎉', text: 'برای تولد دوستم یه پیام خاص بنویس' },
];

const WELCOME_LINES = [
  'چه خبرا؟ از کجا شروع کنیم؟ 😄',
  'هر سوالی داری بپرس، همینجا هستم!',
  'امروز چی تو ذهنته؟',
];

export function ChatView() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const refreshTick = useUIStore((s) => s.refreshTick);
  const providerId = useUIStore((s) => s.providerId);
  const setProviderId = useUIStore((s) => s.setProviderId);
  const openConversation = useUIStore((s) => s.openConversation);
  const setView = useUIStore((s) => s.setView);
  const startNewChat = useUIStore((s) => s.startNewChat);
  const draftMessage = useUIStore((s) => s.draftMessage);
  const clearDraft = useUIStore((s) => s.clearDraft);

  const connected = useIsConnected();
  const provider = getProvider(providerId);

  const [messages, setMessages] = useState<ChatMessageVM[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [welcomeLine] = useState(
    () => WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)]
  );

  const streamingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUserTextRef = useRef<string>('');

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // ---- load conversation history ----
  useEffect(() => {
    if (streamingRef.current) return;
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/conversations/${activeConversationId}`
        );
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as ConversationDetail;
        if (cancelled) return;
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            providerId: m.providerId ?? undefined,
            createdAt: m.createdAt,
            status: 'ok' as const,
          }))
        );
        if (data.providerId && data.providerId !== providerId) {
          setProviderId(data.providerId);
        }
        requestAnimationFrame(() => scrollToBottom(false));
      } catch {
        // offline or error: keep whatever we have
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId, refreshTick]);

  // ---- autoscroll on new content ----
  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom(streaming);
  }, [messages, streaming, scrollToBottom]);

  // ---- TTS ----
  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeakingId(null);
  }, []);

  const handleSpeak = useCallback(
    async (text: string, id: string) => {
      if (speakingId === id) {
        stopSpeaking();
        return;
      }
      stopSpeaking();
      try {
        setSpeakingId(id);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error('tts failed');
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;
        audio.onended = () => {
          setSpeakingId(null);
          audioRef.current = null;
        };
        await audio.play();
      } catch {
        setSpeakingId(null);
        toast.error('پخش صدا ممکن نشد');
      }
    },
    [speakingId, stopSpeaking]
  );

  useEffect(() => stopSpeaking, [stopSpeaking]);

  // ---- send message (streaming) ----
  const sendMessage = useCallback(
    async (rawText: string, opts?: { fromQueue?: boolean }) => {
      const text = rawText.trim();
      if (!text || streamingRef.current) return;

      lastUserTextRef.current = text;
      const providerIdNow = useUIStore.getState().providerId;
      const convIdNow = useUIStore.getState().activeConversationId;
      const userTempId = `u_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;

      // offline -> queue it
      const isConnectedNow =
        navigator.onLine && !useUIStore.getState().simulatedOffline;
      if (!isConnectedNow && !opts?.fromQueue) {
        enqueueMessage({
          conversationId: convIdNow,
          providerId: providerIdNow,
          content: text,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: userTempId,
            role: 'user',
            content: text,
            createdAt: new Date().toISOString(),
            status: 'queued',
          },
        ]);
        toast.info('آفلاینی! پیامت ذخیره شد و بعد از اتصال ارسال می‌شه 📮');
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: userTempId,
          role: 'user',
          content: text,
          createdAt: new Date().toISOString(),
          status: 'ok',
        },
      ]);
      const assistantTempId = `a_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantTempId,
          role: 'assistant',
          content: '',
          providerId: providerIdNow,
          createdAt: new Date().toISOString(),
          status: 'sending',
        },
      ]);

      streamingRef.current = true;
      setStreaming(true);
      stickToBottomRef.current = true;
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convIdNow,
            content: text,
            providerId: providerIdNow,
          }),
          signal: ac.signal,
        });

        if (!res.ok || !res.body) {
          const errJson = await res.json().catch(() => null);
          throw new Error(
            (errJson as { error?: string } | null)?.error ?? 'request failed'
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const handleEvent = (payload: string) => {
          if (!payload || payload === '[DONE]') return;
          let json: {
            meta?: { conversationId: string };
            delta?: string;
            error?: string;
            done?: boolean;
            conversationId?: string;
            title?: string | null;
          };
          try {
            json = JSON.parse(payload);
          } catch {
            return;
          }
          if (json.meta?.conversationId) {
            if (useUIStore.getState().activeConversationId !== json.meta.conversationId) {
              useUIStore.setState({
                activeConversationId: json.meta.conversationId,
                view: 'chat',
              });
            }
            return;
          }
          if (json.error) throw new Error(json.error);
          if (json.delta) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantTempId
                  ? { ...m, content: m.content + json.delta }
                  : m
              )
            );
            return;
          }
          if (json.done) {
            if (
              json.conversationId &&
              useUIStore.getState().activeConversationId !== json.conversationId
            ) {
              useUIStore.setState({ activeConversationId: json.conversationId });
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;
            handleEvent(line.slice(5).trim());
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTempId ? { ...m, status: 'ok' } : m
          )
        );
      } catch (e) {
        const aborted =
          ac.signal.aborted ||
          (e instanceof DOMException && e.name === 'AbortError');
        if (aborted) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantTempId ? { ...m, status: 'ok' } : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantTempId ? { ...m, status: 'error' } : m
            )
          );
          toast.error(
            e instanceof Error && e.message && e.message.length < 60
              ? e.message
              : 'ارتباط برقرار نشد؛ دوباره تلاش کن'
          );
        }
      } finally {
        streamingRef.current = false;
        setStreaming(false);
        abortRef.current = null;
      }
    },
    []
  );

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  // ---- draft from home suggestions ----
  useEffect(() => {
    if (draftMessage) {
      const text = draftMessage;
      clearDraft();
      void sendMessageRef.current(text);
    }
  }, [draftMessage, clearDraft]);

  // NOTE: offline queue flushing is handled globally by <QueueFlusher/>.

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleSend = () => {
    const text = input;
    if (!text.trim()) return;
    setInput('');
    void sendMessage(text);
  };

  const retryLast = () => {
    setMessages((prev) => {
      const withoutError = prev.filter((m) => m.status !== 'error');
      return withoutError;
    });
    void sendMessage(lastUserTextRef.current);
  };

  const empty = messages.length === 0 && !streaming;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* chat sub-header */}
      <div className="flex items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="بازگشت به خانه"
          onClick={() => setView('home')}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex min-h-11 flex-1 items-center gap-2.5 rounded-2xl border bg-card px-3 py-1.5 text-start transition-colors hover:border-primary/40"
          aria-label="تغییر دستیار هوش مصنوعی"
        >
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg',
              provider.gradient
            )}
            aria-hidden
          >
            {provider.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">
              {provider.name}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {provider.tagline}
            </span>
          </span>
          <UsersRound className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="گفتگوی جدید"
          onClick={() => {
            if (streamingRef.current) return;
            startNewChat();
          }}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {!connected && (
        <div className="flex items-center justify-center gap-2 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <WifiOff className="h-3.5 w-3.5" />
          آفلاینی — پیام‌هات ذخیره می‌شن و بعد از اتصال می‌رن
        </div>
      )}

      {/* messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="nice-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4"
      >
        {empty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 pt-6 text-center"
          >
            <span
              className={cn(
                'soft-float flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br text-4xl shadow-lg',
                provider.gradient
              )}
              aria-hidden
            >
              {provider.emoji}
            </span>
            <div>
              <p className="text-lg font-extrabold">{provider.name} اینجاست!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {welcomeLine}
              </p>
            </div>
            <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
              {CHAT_SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => void sendMessage(s.text)}
                  className="flex min-h-11 items-center gap-2 rounded-2xl border bg-card p-3 text-start text-sm transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="text-lg" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="line-clamp-2 flex-1">{s.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((m, idx) => (
          <ChatMessage
            key={m.id}
            message={m}
            providerEmoji={provider.emoji}
            providerGradient={provider.gradient}
            providerName={provider.name}
            isSpeaking={speakingId === m.id}
            onSpeak={handleSpeak}
            onRetry={
              m.status === 'error' && idx === messages.length - 1
                ? retryLast
                : undefined
            }
          />
        ))}
      </div>

      {/* composer */}
      <div className="shrink-0 border-t bg-background/90 px-3 py-2.5 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`پیامت رو بنویس… (${
              getProvider(useUIStore.getState().providerId).name
            })`}
            rows={1}
            dir="auto"
            className="nice-scrollbar max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-card py-2.5 text-[15px] leading-6"
            aria-label="متن پیام"
          />
          {streaming ? (
            <Button
              type="button"
              size="icon"
              onClick={handleStop}
              aria-label="توقف پاسخ"
              className="h-11 w-11 shrink-0 rounded-2xl bg-rose-500 hover:bg-rose-600"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="ارسال پیام"
              className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-rose-400 text-white shadow-md transition-transform active:scale-95 disabled:opacity-40"
            >
              <Send className="h-5 w-5 -scale-x-100" />
            </Button>
          )}
        </div>
      </div>

      <ProviderPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedId={providerId}
        onSelect={(id) => {
          setProviderId(id);
          toast.success(`دستیار عوض شد: ${getProvider(id).name} ${getProvider(id).emoji}`);
        }}
      />
    </div>
  );
}
