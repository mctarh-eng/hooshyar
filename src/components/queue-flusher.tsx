'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useIsConnected } from '@/hooks/use-online';
import { CONVERSATIONS_KEY } from '@/hooks/use-conversations';
import { dequeueMessage, getQueue } from '@/lib/offline-queue';
import { useUIStore } from '@/lib/store';

/**
 * Global offline-message queue flusher.
 * Lives at page level so it reacts to connection changes no matter which view
 * is active, and catches up on app load if messages were queued while away.
 */
export function QueueFlusher() {
  const connected = useIsConnected();
  const prevRef = useRef<boolean | null>(null);
  const flushingRef = useRef(false);
  const qc = useQueryClient();

  useEffect(() => {
    const wasConnected = prevRef.current;
    prevRef.current = connected;

    if (flushingRef.current) return;
    if (!connected) return;

    const queue = getQueue();
    if (queue.length === 0) return;
    // skip only when there was no transition AND this isn't the initial pass
    if (wasConnected !== null && wasConnected === connected) return;

    flushingRef.current = true;
    void (async () => {
      let sent = 0;
      let touchedActive = false;
      for (const item of queue) {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: item.conversationId,
              content: item.content,
              providerId: item.providerId,
            }),
          });
          if (!res.ok) throw new Error('flush failed');
          // drain the SSE stream to completion so the server finishes saving
          const reader = res.body?.getReader();
          if (reader) {
            while (true) {
              const { done } = await reader.read();
              if (done) break;
            }
          }
          dequeueMessage(item.id);
          sent += 1;
          if (
            item.conversationId &&
            item.conversationId === useUIStore.getState().activeConversationId
          ) {
            touchedActive = true;
          }
        } catch {
          break;
        }
      }
      flushingRef.current = false;
      if (sent > 0) {
        qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
        toast.success(
          `${sent.toLocaleString('fa-IR')} پیام آفلاین با موفقیت ارسال شد ✅`
        );
        if (touchedActive) {
          useUIStore.getState().bumpRefreshTick();
        }
      }
    })();
  }, [connected, qc]);

  return null;
}
