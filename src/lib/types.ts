export interface ConversationSummary {
  id: string;
  title: string;
  providerId: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string | null;
  messageCount: number;
}

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  providerId?: string | null;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  providerId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageData[];
}

export interface ImageRecord {
  id: string;
  prompt: string;
  size: string;
  style: string;
  createdAt: string;
}
