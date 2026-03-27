// src/components/TokenDetails/Chats.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { getChatMessages, addChatMessage } from '@/utils/api.index';
import { toastError } from '@/utils/customToast';
import { formatTimestamp, getRandomAvatarImage, shortenAddress } from '@/utils/chatUtils';
import { motion, AnimatePresence } from 'framer-motion';
import type { TokenWithTransactions, ChatMessage as BeChatMessage } from '@/interface/types';
import { Reply, X, Send, MessageSquare } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { COMMON, CHAT } from '@/constants/ui-text';

type UiChatMessage = {
  messageId: string;
  walletAddress: string;
  message: string;
  timestamp: string;
};

interface ChatsProps {
  tokenAddress: string;
  tokenInfo: TokenWithTransactions;
}

const PAGE_LIMIT = 30;

const stripHtml = (str: string) => str.replace(/<[^>]*>/g, '');

const toUiMessage = (m: BeChatMessage): UiChatMessage => ({
  messageId: m.messageId,
  walletAddress: m.walletAddress,
  message: stripHtml(m.message),
  timestamp: m.timestamp,
});

const Chats: React.FC<ChatsProps> = ({ tokenAddress, tokenInfo }) => {
  const { publicKey, connected } = useWallet();
  const { loading, authenticated } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const walletAddress = useMemo(() => publicKey?.toBase58() || '', [publicKey]);

  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<UiChatMessage | null>(null);
  const [sending, setSending] = useState(false);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const userAvatars = useMemo(() => {
    const avatars: Record<string, string> = {};
    messages.forEach((msg) => {
      if (!avatars[msg.walletAddress]) avatars[msg.walletAddress] = getRandomAvatarImage();
    });
    return avatars;
  }, [messages]);

  const fetchMessages = useCallback(
    async (isLoadMore = false) => {
      if (!tokenAddress) return;
      try {
        if (isLoadMore) setLoadingMore(true);

        const res = await getChatMessages(tokenAddress, {
          limit: PAGE_LIMIT,
          cursor: isLoadMore ? cursor ?? undefined : undefined,
        });

        const ui = (res?.messages ?? []).map(toUiMessage);
        setMessages((prev) => (isLoadMore ? [...prev, ...ui] : ui));
        setCursor(res?.nextCursor ?? null);
        setHasMore(Boolean(res?.nextCursor));
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        if (!isLoadMore) toastError(error?.message || 'Failed to load chat');
        setHasMore(false);
      } finally {
        if (isLoadMore) setLoadingMore(false);
      }
    },
    [tokenAddress, cursor],
  );

  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setHasMore(true);
    setReplyingTo(null);
    setNewMessage('');
    fetchMessages(false);

    const interval = setInterval(() => {
      if (!document.hidden) fetchMessages(false);
    }, 30_000);
    return () => clearInterval(interval);
  }, [tokenAddress, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || sending) return;

    if (!connected || !walletAddress) {
      toastError('Connect Solana wallet to chat');
      return;
    }
    if (!authenticated) {
      toastError('Please authenticate to chat');
      return;
    }

    const raw = newMessage.trim();
    if (!raw) return;

    const finalMessage = replyingTo
      ? `↪ Reply to ${shortenAddress(replyingTo.walletAddress)}: "${replyingTo.message.slice(0, 120)}"\n${raw}`
      : raw;

    setSending(true);
    try {
      const posted = await addChatMessage({
        tokenAddress,
        walletAddress,
        message: finalMessage,
      });

      setMessages((prev) => [toUiMessage(posted as any), ...prev]);
      setNewMessage('');
      setReplyingTo(null);
      fetchMessages(false);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toastError(error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const isDev = useCallback(
    (wa: string) => {
      const c = String((tokenInfo as any)?.creatorAddress || '').toLowerCase();
      return c && String(wa || '').toLowerCase() === c;
    },
    [tokenInfo],
  );

  /* ── Auth gate ── */
  if (!connected || !walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <MessageSquare size={32} className="text-gray-600" />
        <p className="text-sm text-gray-500">Connect your Solana wallet to chat</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <MessageSquare size={32} className="text-gray-600" />
        <p className="text-sm text-gray-500">Please authenticate to chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] sm:h-[480px]">

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 px-1 py-2">
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            const isOwn = message.walletAddress === walletAddress;
            return (
              <motion.div
                key={message.messageId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`rounded-xl p-2.5 sm:p-3 border border-[var(--card-border)] ${
                  isOwn ? 'bg-[var(--primary)]/5' : 'bg-[var(--card2)]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Image
                    src={userAvatars[message.walletAddress] || getRandomAvatarImage()}
                    alt="Avatar"
                    width={24}
                    height={24}
                    className="rounded-full flex-shrink-0 hidden sm:block"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-gray-300 font-mono truncate">
                          {shortenAddress(message.walletAddress)}
                        </span>
                        {isDev(message.walletAddress) && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                            DEV
                          </span>
                        )}
                        {isOwn && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--accent)]/10 text-[var(--accent)]">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-200 mt-1 whitespace-pre-wrap break-words leading-relaxed">
                      {message.message}
                    </p>

                    <button
                      onClick={() => setReplyingTo(message)}
                      className="mt-1.5 text-[10px] text-gray-500 hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
                    >
                      <Reply size={10} />
                      Reply
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <MessageSquare size={24} className="text-gray-600" />
            <p className="text-xs text-gray-500">No messages yet — start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Load more */}
      {hasMore && messages.length > 0 && (
        <div className="px-1 py-2">
          <button
            type="button"
            onClick={() => fetchMessages(true)}
            disabled={loadingMore}
            className="w-full py-2 rounded-lg text-xs text-gray-400 border border-[var(--card-border)] bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors disabled:opacity-50"
          >
            {loadingMore ? COMMON.LOADING : COMMON.LOAD_MORE}
          </button>
        </div>
      )}

      {/* ── Reply indicator ── */}
      {replyingTo && (
        <div className="mx-1 mb-1 flex items-center justify-between bg-[var(--card2)] px-3 py-2 rounded-lg border border-[var(--card-border)]">
          <span className="text-xs text-gray-400 truncate">
            Replying to{' '}
            <span className="text-[var(--primary)] font-medium">
              {shortenAddress(replyingTo.walletAddress)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-gray-500 hover:text-white transition-colors ml-2 flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Input ── */}
      <form onSubmit={handleSendMessage} className="flex gap-2 px-1 pt-2 pb-1">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={CHAT.PLACEHOLDER}
          className="flex-1 bg-[var(--card2)] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] border border-[var(--card-border)] placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || loading || sending}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff' }}
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
};

export default Chats;
