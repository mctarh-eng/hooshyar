'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PROVIDER_ID } from '@/lib/providers';

export type AppView = 'home' | 'chat' | 'image' | 'history' | 'settings';
export type FontScale = 'sm' | 'md' | 'lg';

interface UIState {
  view: AppView;
  activeConversationId: string | null;
  providerId: string;
  draftMessage: string | null;
  simulatedOffline: boolean;
  fontScale: FontScale;
  refreshTick: number;
  setView: (view: AppView) => void;
  openConversation: (id: string | null) => void;
  startNewChat: () => void;
  askSuggestion: (text: string) => void;
  setProviderId: (id: string) => void;
  clearDraft: () => void;
  setSimulatedOffline: (v: boolean) => void;
  setFontScale: (s: FontScale) => void;
  bumpRefreshTick: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      view: 'home',
      activeConversationId: null,
      providerId: DEFAULT_PROVIDER_ID,
      draftMessage: null,
      simulatedOffline: false,
      fontScale: 'md',
      refreshTick: 0,
      setView: (view) => set({ view }),
      openConversation: (id) =>
        set({ activeConversationId: id, view: 'chat', draftMessage: null }),
      startNewChat: () =>
        set({ activeConversationId: null, view: 'chat', draftMessage: null }),
      askSuggestion: (text) =>
        set({ activeConversationId: null, view: 'chat', draftMessage: text }),
      setProviderId: (providerId) => set({ providerId }),
      clearDraft: () => set({ draftMessage: null }),
      setSimulatedOffline: (simulatedOffline) => set({ simulatedOffline }),
      setFontScale: (fontScale) => set({ fontScale }),
      bumpRefreshTick: () =>
        set((s) => ({ refreshTick: s.refreshTick + 1 })),
    }),
    {
      name: 'hooshyar-ui',
      partialize: (s) => ({
        providerId: s.providerId,
        simulatedOffline: s.simulatedOffline,
        fontScale: s.fontScale,
      }),
    }
  )
);
