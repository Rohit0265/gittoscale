import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { MeetingChatMessage } from '../types';

interface MeetingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: MeetingChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserId?: string;
}

export const MeetingChatPanel: React.FC<MeetingChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUserId,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <aside className="w-72 sm:w-80 h-full border-l border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#080808] flex flex-col z-30 shrink-0 select-none transition-colors">
      {/* Header */}
      <div className="h-12 border-b border-slate-200 dark:border-neutral-800 px-4 flex items-center justify-between">
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

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
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
        onSubmit={handleSend}
        className="p-3 border-t border-slate-200 dark:border-neutral-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-xs text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all cursor-pointer"
          title="Send"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};
