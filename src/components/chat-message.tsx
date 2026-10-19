'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Check, Copy, TriangleAlert, Volume2, VolumeX } from 'lucide-react';
import { cn, faTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ChatMessageVM {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  providerId?: string;
  createdAt?: string;
  status?: 'ok' | 'sending' | 'queued' | 'error';
}

interface ChatMessageProps {
  message: ChatMessageVM;
  providerEmoji: string;
  providerGradient: string;
  providerName: string;
  isSpeaking: boolean;
  /** TTS needs the server — hide it for on-device messages when unavailable */
  canSpeak?: boolean;
  onSpeak: (text: string, id: string) => void;
  onRetry?: () => void;
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1.5" aria-label="در حال نوشتن">
      <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
      <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
      <span className="typing-dot h-2 w-2 rounded-full bg-primary" />
    </span>
  );
}

export function ChatMessage({
  message,
  providerEmoji,
  providerGradient,
  providerName,
  isSpeaking,
  canSpeak = true,
  onSpeak,
  onRetry,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[85%] space-y-1">
          <div className="rounded-3xl rounded-ee-md bg-gradient-to-br from-primary to-rose-400 px-4 py-2.5 text-[15px] leading-7 text-white shadow-sm">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <div className="flex items-center justify-end gap-2 pe-1">
            {message.status === 'queued' && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                ⏳ منتظر اتصال
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {faTime(message.createdAt ?? new Date().toISOString())}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  const showTyping = message.status === 'sending' && !message.content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start gap-2"
    >
      <span
        className={cn(
          'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-base shadow-sm',
          providerGradient
        )}
        aria-hidden
      >
        {providerEmoji}
      </span>
      <div className="min-w-0 max-w-[85%] space-y-1">
        <div className="rounded-3xl rounded-es-md border bg-card px-4 py-2.5 shadow-sm">
          <div className="mb-0.5 text-[10px] font-bold text-muted-foreground">
            {providerName}
          </div>
          {showTyping ? (
            <TypingDots />
          ) : (
            <div className="md-answer text-[15px] text-card-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {message.status === 'error' && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <TriangleAlert className="h-3.5 w-3.5" />
              <span>پاسخ کامل نشد؛ اتصالت رو چک کن.</span>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={onRetry}
                >
                  تلاش دوباره
                </Button>
              )}
            </div>
          )}
        </div>
        {!showTyping && (
          <div className="flex items-center gap-1 ps-1">
            <button
              type="button"
              onClick={copyText}
              aria-label="کپی پاسخ"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            {canSpeak && (
              <button
                type="button"
                onClick={() => onSpeak(message.content, message.id)}
                aria-label={isSpeaking ? 'توقف خواندن' : 'خواندن با صدا'}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-secondary',
                  isSpeaking ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isSpeaking ? (
                  <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <span className="text-[10px] text-muted-foreground">
              {faTime(message.createdAt ?? new Date().toISOString())}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
