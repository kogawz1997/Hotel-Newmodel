'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message { role: 'user' | 'assistant'; content: string; }

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'สวัสดีครับ! มีอะไรให้ช่วยได้บ้าง? 😊' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'ขออภัย ไม่สามารถตอบได้ในขณะนี้' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(v => !v)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-gray-100 dark:border-border bg-white dark:bg-background shadow-2xl flex flex-col overflow-hidden" style={{ height: '420px' }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
            <p className="text-sm font-semibold">AI Concierge</p>
            <div className="ml-auto flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /><span className="text-xs opacity-80">ออนไลน์</span></div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm', m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm')}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-border">
            <input
              className="flex-1 text-sm bg-muted rounded-full px-3 py-1.5 outline-none"
              placeholder="พิมพ์ข้อความ..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              disabled={loading}
            />
            <button onClick={send} disabled={loading || !input.trim()} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
