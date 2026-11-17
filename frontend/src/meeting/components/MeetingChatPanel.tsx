import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, WifiOff } from 'lucide-react';
import { MeetingChatMessage, YjsSyncStatus } from '../types';

interface MeetingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: MeetingChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserId?: string;
  syncStatus?: YjsSyncStatus;
}

const AVATAR_COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#2563EB', '#DB2777', '#0891B2'];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export const MeetingChatPanel: React.FC<MeetingChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
  syncStatus = 'synced',
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const isDisconnected = syncStatus === 'disconnected' || syncStatus === 'error';

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden select-none transition-colors">
      {/* Header */}
      <div className="h-12 border-b border-slate-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-neutral-200">
            Meeting Chat ({messages.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Disconnected banner */}
      {isDisconnected && (
        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>You're disconnected. Messages will send once the connection is restored.</span>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-neutral-500">
            No messages yet. Say hello to your collaborators!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-1">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-[10px] text-slate-500 dark:text-neutral-400">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const avatarColor = hashColor(msg.senderId || msg.senderName);

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1 max-w-full">
                  {!isMe && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {(msg.senderName || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-neutral-400">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-neutral-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`px-3 py-2 rounded-xl text-xs max-w-[85%] break-words ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 dark:border-neutral-800 flex items-end gap-2"
      >
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={Math.min(4, Math.max(1, inputText.split('\n').length))}
          placeholder="Send a message… (Enter to send, Shift+Enter for new line)"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[36px] max-h-28"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all cursor-pointer shrink-0"
          title="Send"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
