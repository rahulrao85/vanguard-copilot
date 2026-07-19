import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AIChat from '../src/components/AIChat';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const mockSendMessage = vi.fn();
const mockClearHistory = vi.fn();
let mockUseChat = {
  messages: [] as any[],
  isStreaming: false,
  sendMessage: mockSendMessage,
  clearHistory: mockClearHistory,
};

vi.mock('../src/hooks/useChat', () => ({
  useChat: () => mockUseChat,
}));

describe('AIChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChat.messages = [];
    mockUseChat.isStreaming = false;
  });

  it('renders the floating chat assistant bubble', () => {
    render(<AIChat />);
    const bubble = screen.getByRole('button', { name: /Open stadium assistant/i });
    expect(bubble).toBeInTheDocument();
  });

  it('toggles chat panel visibility when bubble is clicked', () => {
    render(<AIChat />);
    const bubble = screen.getByRole('button', { name: /Open stadium assistant/i });
    
    // Open chat
    fireEvent.click(bubble);
    expect(screen.getByRole('dialog', { name: /ai\.chat/i })).toBeInTheDocument();
    
    // Close chat
    fireEvent.click(screen.getByRole('button', { name: /Close stadium assistant/i }));
    expect(screen.queryByRole('dialog', { name: /ai\.chat/i })).not.toBeInTheDocument();
  });

  it('shows welcome placeholder when there are no messages', () => {
    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /Open stadium assistant/i }));
    expect(screen.getByText(/Ask me about crowd levels/i)).toBeInTheDocument();
  });

  it('renders chat messages list correctly', () => {
    mockUseChat.messages = [
      { id: '1', role: 'user', content: 'Hello AI' },
      { id: '2', role: 'assistant', content: 'Hello volunteer!' },
    ];
    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /Open stadium assistant/i }));
    
    expect(screen.getByText('Hello AI')).toBeInTheDocument();
    expect(screen.getByText('Hello volunteer!')).toBeInTheDocument();
  });

  it('handles message typing and submission', () => {
    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /Open stadium assistant/i }));
    
    const input = screen.getByPlaceholderText('ai.chatPlaceholder');
    const sendButton = screen.getByRole('button', { name: 'common.send' });
    
    fireEvent.change(input, { target: { value: 'How is Gate A?' } });
    fireEvent.click(sendButton);
    
    expect(mockSendMessage).toHaveBeenCalledWith('How is Gate A?');
  });

  it('submits on Enter key press', () => {
    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /Open stadium assistant/i }));
    
    const input = screen.getByPlaceholderText('ai.chatPlaceholder');
    fireEvent.change(input, { target: { value: 'Hello via Enter' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    expect(mockSendMessage).toHaveBeenCalledWith('Hello via Enter');
  });

  it('disables input and send button during streaming', () => {
    mockUseChat.isStreaming = true;
    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /Open stadium assistant/i }));
    
    const input = screen.getByPlaceholderText('ai.chatPlaceholder');
    const sendButton = screen.getByRole('button', { name: 'common.send' });
    
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('triggers clearHistory on Clear button click', () => {
    render(<AIChat />);
    fireEvent.click(screen.getByRole('button', { name: /Open stadium assistant/i }));
    
    const clearButton = screen.getByRole('button', { name: /Clear chat history/i });
    fireEvent.click(clearButton);
    
    expect(mockClearHistory).toHaveBeenCalled();
  });
});
