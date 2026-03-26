// src/utils/api/chat.ts
// Chatroom API endpoints

import type {
  ChatMessagesResponse,
  ChatWriteRequest,
  ChatWriteResponse,
} from '@/interface/types';
import { getViaProxy, postViaProxy, getAuthHeaders } from './core';

export async function getChatMessages(
  tokenAddress: string,
  opts?: { limit?: number; cursor?: string | null }
): Promise<ChatMessagesResponse> {
  const addr = (tokenAddress || '').trim();
  if (!addr) throw new Error('Missing tokenAddress');

  const limitRaw = opts?.limit ?? 30;
  const limit = Math.min(Math.max(Number(limitRaw) || 30, 1), 100);

  const headers = getAuthHeaders();
  const { data } = await getViaProxy<ChatMessagesResponse>(
    '/chat/messages',
    { tokenAddress: addr, limit, cursor: opts?.cursor ?? undefined },
    headers
  );

  return {
    tokenAddress: data?.tokenAddress ?? addr,
    nextCursor: data?.nextCursor ?? null,
    messages: data?.messages ?? [],
  };
}

export async function addChatMessage(payload: ChatWriteRequest): Promise<ChatWriteResponse> {
  const tokenAddress = String(payload?.tokenAddress ?? '').trim();
  const walletAddress = String(payload?.walletAddress ?? '').trim();
  const message = String(payload?.message ?? '').trim();

  if (!tokenAddress) throw new Error('tokenAddress is required');
  if (!walletAddress) throw new Error('walletAddress is required');
  if (!message) throw new Error('message is required');

  const headers = getAuthHeaders();
  if (!headers?.Authorization) throw new Error('Unauthorized (Bearer token required)');

  const { data } = await postViaProxy<ChatWriteResponse>(
    '/chat/write',
    { tokenAddress, walletAddress, message },
    headers
  );
  return data;
}
