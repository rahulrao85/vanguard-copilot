import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChat } from '../hooks/useChat';
import LoadingSpinner from './LoadingSpinner';

export default function AIChat() {
  const { t } = useTranslation();
  const { messages, isStreaming, sendMessage, clearHistory } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    sendMessage(text);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating bubble */}
      <button
        id="ai-chat-bubble"
        onClick={() => setIsOpen((p) => !p)}
        aria-label={isOpen ? 'Close stadium assistant' : 'Open stadium assistant'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 900,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--color-accent-primary)',
          border: 'none',
          color: '#fff',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(59,130,246,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {isOpen ? '✕' : '🤖'}
        {!isOpen && messages.length > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 14, height: 14, borderRadius: '50%',
            background: '#22c55e', border: '2px solid #0f172a',
            fontSize: '0.55rem', fontWeight: 800, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-hidden="true">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          id="ai-chat-panel"
          role="dialog"
          aria-label={t('ai.chat')}
          aria-modal="false"
          style={{
            position: 'fixed',
            bottom: '5.5rem',
            right: '1.5rem',
            zIndex: 900,
            width: 360,
            maxWidth: 'calc(100vw - 2rem)',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
              🤖 {t('ai.chat')}
            </span>
            <button
              onClick={clearHistory}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}
              aria-label="Clear chat history"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {messages.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem 0' }}>
                Ask me about crowd levels, gate status, or fan support.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                }} aria-hidden="true">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: '78%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.06)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.content || (isStreaming && msg.role === 'assistant' ? (
                    <LoadingSpinner size="sm" label="Generating response..." />
                  ) : '...')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: '0.5rem',
          }}>
            <input
              ref={inputRef}
              id="ai-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t('ai.chatPlaceholder')}
              disabled={isStreaming}
              aria-label={t('ai.ask')}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              id="ai-chat-send"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              aria-label={t('common.send')}
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-accent-primary)',
                color: '#fff',
                cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !isStreaming ? 1 : 0.5,
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'opacity 0.2s',
              }}
            >
              {isStreaming ? '...' : '↑'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
