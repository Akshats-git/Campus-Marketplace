import { create } from 'zustand';
import { Chat, Message } from '../types';

interface ChatState {
  chats: Chat[];
  activeMessages: Message[];
  activeChatId: string | null;
  totalUnread: number;
  setChats: (chats: Chat[]) => void;
  setMessages: (messages: Message[]) => void;
  setActiveChatId: (id: string | null) => void;
  setTotalUnread: (count: number) => void;
  appendMessage: (msg: Message) => void;
}

export const useChatStore = create<ChatState>(set => ({
  chats: [],
  activeMessages: [],
  activeChatId: null,
  totalUnread: 0,
  setChats: chats => set({ chats }),
  setMessages: messages => set({ activeMessages: messages }),
  setActiveChatId: id => set({ activeChatId: id }),
  setTotalUnread: count => set({ totalUnread: count }),
  appendMessage: msg => set(s => ({ activeMessages: [...s.activeMessages, msg] })),
}));
