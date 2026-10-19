'use client';

export interface QueuedMessage {
  id: string;
  conversationId: string | null;
  providerId: string;
  content: string;
  createdAt: string;
}

const KEY = 'hooshyar-offline-queue';

export function getQueue(): QueuedMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQueue(queue: QueuedMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    // storage full / unavailable - ignore
  }
}

export function enqueueMessage(
  item: Omit<QueuedMessage, 'id' | 'createdAt'>
): QueuedMessage {
  const full: QueuedMessage = {
    ...item,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const queue = getQueue();
  queue.push(full);
  saveQueue(queue);
  return full;
}

export function dequeueMessage(id: string) {
  saveQueue(getQueue().filter((q) => q.id !== id));
}

export function queueCount(): number {
  return getQueue().length;
}
