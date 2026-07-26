import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hello! I am your Smart Pharma Assistant. Ask me about inventory, sales, or specific medicines.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const res = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg })
            });
            const data = await res.json();

            setTimeout(() => {
                setMessages(prev => [...prev, { type: 'bot', text: data.answer, action: data.action }]);
                setIsTyping(false);
            }, 600); // Fake "thinking" delay for realism
        } catch (err) {
            setMessages(prev => [...prev, { type: 'bot', text: "I'm having trouble connecting to the database right now." }]);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <>
            {/* WHATSAPP SUPPORT BUTTON */}
            <a
                href="https://wa.me/14155238886?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-float-btn"
                style={{ textDecoration: 'none' }}
            >
                {/* Official WhatsApp Logo SVG */}
                <svg viewBox="0 0 24 24" width="30" height="30" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                {/* <span className="btn-label">WhatsApp Support</span> */}
            </a>

            {/* FLOATING BUTTON (HOVER TO OPEN) */}
            <button
                className={`chatbot-float-btn ${isOpen ? 'hidden' : ''}`}
                onMouseEnter={() => setIsOpen(true)}
                onClick={() => setIsOpen(true)}
            >
                <div className="btn-glow"></div>
                <Sparkles size={24} color="#fff" />
                <span className="btn-label">AI Assistant</span>
            </button>

            {/* CHAT WINDOW */}
            {isOpen && (
                <div className="chatbot-window glass-card">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-branding">
                            <div className="bot-avatar">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3>Pharma AI</h3>
                                <span className="status-dot">Online</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="close-btn">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message-row ${msg.type}`}>
                                {msg.type === 'bot' && <div className="msg-avatar"><Bot size={14} /></div>}
                                <div className={`message-bubble ${msg.type}`}>
                                    {msg.text.split('\n').map((line, l) => (
                                        <div key={l}>{line}</div>
                                    ))}
                                    {msg.action && (
                                        <div className="msg-action-box">
                                            <small>SUGGESTED ACTION:</small>
                                            {msg.action}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="message-row bot">
                                <div className="msg-avatar"><Bot size={14} /></div>
                                <div className="message-bubble bot typing">
                                    <span>.</span><span>.</span><span>.</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="chat-input-area">
                        <input
                            type="text"
                            placeholder="Ask about sales, stock, expiry..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button onClick={handleSend} disabled={!input.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
