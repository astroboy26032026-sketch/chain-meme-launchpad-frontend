// src/types/chat.ts
// Chat-related type definitions

export type ChatMessage = {
  messageId: string;
  walletAddress: string;
  message: string;
  timestamp: string;
};

export type ChatMessagesResponse = {
  tokenAddress: string;
  nextCursor?: string | null;
  messages: ChatMessage[];
};

export type ChatWriteRequest = {
  tokenAddress: string;
  walletAddress: string;
  message: string;
};

export type ChatWriteResponse = {
  messageId: string;
  tokenAddress: string;
  walletAddress: string;
  message: string;
  timestamp: string;
};
