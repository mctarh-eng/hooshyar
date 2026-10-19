'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConversationDetail, ConversationSummary, ImageRecord } from '@/lib/types';

export const CONVERSATIONS_KEY = 'conversations';
export const IMAGES_KEY = 'images';

export function useConversationList() {
  return useQuery<ConversationSummary[]>({
    queryKey: [CONVERSATIONS_KEY],
    queryFn: async () => {
      const res = await fetch('/api/conversations');
      if (!res.ok) throw new Error('fetch conversations failed');
      const json = await res.json();
      return json.conversations as ConversationSummary[];
    },
    staleTime: 10_000,
  });
}

export function useConversationDetail(id: string | null) {
  return useQuery<ConversationDetail>({
    queryKey: [CONVERSATIONS_KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error('fetch conversation failed');
      return (await res.json()) as ConversationDetail;
    },
    staleTime: 60_000,
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useRenameConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('rename failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}

export function useImageList() {
  return useQuery<ImageRecord[]>({
    queryKey: [IMAGES_KEY],
    queryFn: async () => {
      const res = await fetch('/api/image');
      if (!res.ok) throw new Error('fetch images failed');
      const json = await res.json();
      return json.images as ImageRecord[];
    },
    staleTime: 30_000,
  });
}

export function useDeleteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/image/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete image failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [IMAGES_KEY] });
    },
  });
}

export function useClearConversations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/conversations', { method: 'DELETE' });
      if (!res.ok) throw new Error('clear failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] });
    },
  });
}
