"use client";

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatClientProps {
  bookId: string;
  title: string;
}

export default function ChatClient({ bookId, title }: ChatClientProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: {
        'x-book-id': bookId
      }
    }),
    messages: [
      {
        id: 'welcome-msg',
        role: 'assistant',
        parts: [{ type: 'text', text: `Hello! I'm ready to discuss "${title}" with you. What would you like to know?` }],
      }
    ] as UIMessage[]
  });

  const [input, setInput] = useState('');
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full pl-4">
      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-4 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${m.role === 'user'
                ? 'bg-[#E2D8C3] border-[#D4C3A3] text-[#6B4423]'
                : 'bg-[#6B4423] border-[#4A2F1D] text-[#FFFCF5]'
              }`}>
              {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Message Bubble */}
            <div className={`p-4 rounded-sm shadow-sm relative ${m.role === 'user'
                ? 'bg-[#E2D8C3]/40 border border-[#D4C3A3] text-[#2C1810]'
                : 'bg-white border border-[#E2D8C3] text-[#4A3024]'
              }`}>
              {/* Paper texture effect for assistant */}
              {m.role === 'assistant' && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                </div>
              )}
              <div className="prose prose-sm prose-stone max-w-none font-serif leading-relaxed whitespace-pre-wrap">
                {m.parts && m.parts.length > 0 ? (
                  m.parts.map((part, i) => {
                    if (part.type === 'text') {
                      return <ReactMarkdown key={i}>{part.text}</ReactMarkdown>;
                    }
                    return null;
                  })
                ) : (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-[85%] mr-auto items-center text-[#8C7A6B]">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6B4423] border border-[#4A2F1D] text-[#FFFCF5] flex items-center justify-center shadow-sm">
              <Bot size={20} />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-white border border-[#E2D8C3] rounded-sm shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#6B4423]" />
              <span className="font-serif italic text-sm">Flipping through pages...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#FFFCF5] border-t border-[#E2D8C3]">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-3 max-w-4xl mx-auto relative"
        >
          <div className="flex-1 relative">
            <textarea
              className="w-full resize-none bg-white border-2 border-[#D4C3A3] rounded-sm p-4 pr-12 focus:outline-none focus:border-[#6B4423] focus:ring-1 focus:ring-[#6B4423] font-sans text-[#2C1810] shadow-inner transition-colors min-h-[60px] max-h-[150px]"
              placeholder="Ask a question about the book..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  // Trigger form submission
                  const form = e.currentTarget.form;
                  if (form) form.requestSubmit();
                }
              }}
              rows={1}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-[60px] h-[60px] bg-[#6B4423] hover:bg-[#4A2F1D] disabled:bg-[#D4C3A3] disabled:cursor-not-allowed text-[#FFFCF5] rounded-sm flex items-center justify-center shadow-md transition-all active:translate-y-0.5"
          >
            <Send size={24} className={input.trim() && !isLoading ? "ml-1" : ""} />
          </button>
        </form>
        <div className="text-center mt-2">
          <span className="text-xs text-[#8C7A6B] font-serif italic">Press Enter to send, Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
