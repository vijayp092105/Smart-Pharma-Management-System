// src/components/ui/Assistant.tsx
import { Link } from 'react-router-dom';
import { Home, LayoutDashboard, Package, Upload, Bot, Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import api from '../services/api';

const SYSTEM_PROMPT = "You are SmartPharma Assistant — helpful, concise, and friendly.";

// Safe extractor for assistant text from server response
function extractAssistantText(resp: any): string {
  // Try common shapes: res.data.data.response, res.data.data.content, res.data.response, res.data.message
  if (!resp) return 'No response';
  const d = resp.data ?? resp;
  const payload = d.data ?? d;
  const possible =
    payload?.response ??
    payload?.content ??
    payload?.reply ??
    payload?.assistantMessage ??
    payload?.assistant?.content ??
    d?.message ??
    (typeof payload === 'string' ? payload : null);

  if (typeof possible === 'string') return possible;
  // If it's an object with text fields
  if (possible?.text) return possible.text;
  // Fallback: JSON stringify small object
  try {
    return JSON.stringify(possible).slice(0, 1000);
  } catch {
    return 'No readable assistant response';
  }
}

export default function Assistant() {
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user' | 'system'; content: string; ts?: string }[]>([
    { role: 'assistant', content: "Hello! 🙂 I'm your SmartPharma Assistant. I can help with inventory, expiry, sales trends and forecasts. Ask me anything!", ts: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // ensure we have a session id persisted
  const getSessionId = () => {
    let sid = localStorage.getItem('sp_session_id');
    if (!sid) {
      sid = `web-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem('sp_session_id', sid);
    }
    return sid;
  };

  useEffect(() => {
    // auto-scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const appendMessage = (role: 'assistant' | 'user' | 'system', content: string) => {
    setMessages(prev => [...prev, { role, content, ts: new Date().toISOString() }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setError(null);
    appendMessage('user', text);
    setInput('');
    setIsTyping(true);

    try {
      const session_id = getSessionId();
      // send to backend
      const resp = await api.post('/chat', { message: text, session_id });

      // extract assistant text robustly
      const assistantText = extractAssistantText(resp);
      appendMessage('assistant', assistantText);

      // optionally: dispatch an event so other parts (dashboard/inventory) can react
      window.dispatchEvent(new CustomEvent('chatMessageSent', { detail: { session_id, user: text, assistant: assistantText } }));

    } catch (err: any) {
      console.error('Chat API error:', err);
      const msg = err?.response?.data?.error || err?.message || 'Failed to reach assistant';
      setError(msg);
      appendMessage('assistant', `⚠️ Error: ${msg}`);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Background icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-[#00B8A9] opacity-5"
            style={{
              left: `${(i % 10) * 10 + 5}%`,
              top: `${Math.floor(i / 10) * 12 + 2}%`,
              fontSize: '28px'
            }}
          >
            {i % 4 === 0 ? '💊' : i % 4 === 1 ? '⚕️' : i % 4 === 2 ? '🏥' : '⚕'}
          </div>
        ))}
      </div>

      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-20 bg-gray-800/90 backdrop-blur-md shadow-2xl z-20 flex flex-col items-center py-8 gap-6 border-r border-gray-700/50">
        <Link to="/" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Home">
          <Home className="w-7 h-7" />
        </Link>

        <Link to="/dashboard" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Dashboard">
          <LayoutDashboard className="w-7 h-7" />
        </Link>

        <Link to="/inventory" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Inventory">
          <Package className="w-7 h-7" />
        </Link>

        <Link to="/upload-csv" className="p-3 rounded-xl hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-all" title="Upload CSV">
          <Upload className="w-7 h-7" />
        </Link>

        <Link to="/assistant" className="p-3 rounded-xl bg-[#00B8A9]/20 text-[#00B8A9]" title="Assistant">
          <Bot className="w-7 h-7" />
        </Link>
      </div>

      {/* Main content */}
      <div className="ml-20 relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gray-800/90 backdrop-blur-md shadow-2xl px-8 py-6 flex justify-between items-center border-b border-gray-700/50">
          <div>
            <h1
              className="text-4xl text-gray-100"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: '600',
                letterSpacing: '0.03em'
              }}
            >
              Smart Pharma Assistant
            </h1>
          </div>

          <div className="text-sm text-gray-300">
            Session: <span className="font-mono text-xs text-gray-200">{getSessionId()}</span>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="max-w-5xl w-full h-full bg-gray-800/60 backdrop-blur-sm rounded-3xl shadow-2xl flex flex-col border border-gray-700/50">
            <div ref={scrollRef => (scrollRef && (scrollRef as HTMLDivElement).scrollTop)} className="flex-1 overflow-y-auto p-8 space-y-6" ref={scrollRef as any}>
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] p-4 rounded-2xl shadow-md ${
                      message.role === 'user'
                        ? 'bg-[#008C52] text-white rounded-br-none'
                        : 'bg-gradient-to-r from-gray-700/80 to-gray-700/60 text-gray-100 rounded-bl-none border border-gray-600/50'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-5 h-5 text-[#00B8A9]" />
                        <span className="text-sm text-gray-400">Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-line">{message.content}</p>
                    <div className="text-xs text-gray-400 mt-2 text-right">{message.ts ? new Date(message.ts).toLocaleTimeString() : ''}</div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[50%] p-3 rounded-2xl bg-gradient-to-r from-gray-700/80 to-gray-700/60 text-gray-100 rounded-bl-none border border-gray-600/50 animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-700/50 p-6 bg-gray-800/40">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-6 py-3 border border-gray-600/50 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00B8A9] bg-gray-700/50 text-gray-200 placeholder-gray-500"
                />
                <button
                  onClick={handleSend}
                  className="bg-[#00B8A9] text-white px-6 py-3 rounded-full hover:bg-[#009688] transition-colors flex items-center gap-2 shadow-lg disabled:opacity-70"
                  disabled={!input.trim() || isTyping}
                  title={isTyping ? 'Assistant is typing...' : 'Send message'}
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden md:inline">Send</span>
                </button>
              </div>

              {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-gray-400 text-sm">
          Made by Straw Hat Crew (PEC)
        </div>
      </div>
    </div>
  );
}
