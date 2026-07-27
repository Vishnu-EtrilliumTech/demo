'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { sendCaseChatMessage } from '@/app/organization/services/api';
import styles from './CaseAIChat.module.css';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface CaseAIChatProps {
  caseId: string;
  siteId: string;
  organizationId: string;
}

// Helper function to check if AI features are enabled for this organization
const isAIEnabledForOrganization = (organizationId: string): boolean => {
  const enabledOrgIds = process.env.NEXT_PUBLIC_AI_ENABLED_ORG_IDS || '';
  const enabledIds = enabledOrgIds.split(',').map(id => id.trim());
  return enabledIds.includes(organizationId);
};

export const CaseAIChat: React.FC<CaseAIChatProps> = ({
  caseId,
  siteId,
  organizationId,
}) => {
  // All hooks must be called before any conditional returns
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if AI is enabled for this organization
  const aiEnabled = isAIEnabledForOrganization(organizationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Don't render anything if AI is not enabled for this organization
  if (!aiEnabled) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendCaseChatMessage(
        organizationId,
        siteId,
        caseId,
        userMessage.content
      );

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response.response,
        timestamp: new Date(response.timestamp),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error sending chat message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={styles.chatFab}>
        <button
          className={styles.chatFabButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close Ask Neeti' : 'Open Ask Neeti'}
        >
          {isOpen ? (
            <CloseIcon sx={{ color: 'white', fontSize: 24 }} />
          ) : (
            <AutoAwesomeIcon sx={{ color: 'white', fontSize: 24 }} />
          )}
        </button>
      </div>

      {/* Chat Drawer */}
      {isOpen && (
        <div className={styles.chatDrawer}>
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderTitle}>
              <AutoAwesomeIcon sx={{ fontSize: 20 }} />
              <h3>Ask Neeti</h3>
              <span className={styles.betaChip}>Beta</span>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </button>
          </div>

          {/* Messages Area */}
          <div className={styles.chatMessages}>
            {messages.length === 0 && !isLoading && (
              <div className={styles.emptyState}>
                <ChatIcon sx={{ fontSize: 48 }} />
                <p>Ask me anything about this case!</p>
                <p style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.7 }}>
                  I have full context of the case details, tasks, hearings, documents, and more.
                </p>
                <div className={styles.samplePrompts}>
                  <p className={styles.samplePromptsTitle}>Try asking:</p>
                  <button
                    className={styles.samplePromptButton}
                    onClick={() => setInputValue('What are the immediate action items?')}
                  >
                    What are the immediate action items?
                  </button>
                  <button
                    className={styles.samplePromptButton}
                    onClick={() => setInputValue('Are there any similar cases with their judgements? Give me top 3 similar cases.')}
                  >
                    Find similar cases and judgements
                  </button>
                  <button
                    className={styles.samplePromptButton}
                    onClick={() => setInputValue('What are the key risks and challenges in this case?')}
                  >
                    Key risks and challenges
                  </button>
                  <button
                    className={styles.samplePromptButton}
                    onClick={() => setInputValue('Summarize the case timeline and upcoming deadlines')}
                  >
                    Case timeline and deadlines
                  </button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`${styles.message} ${
                    message.type === 'user' ? styles.userMessage : styles.aiMessage
                  }`}
                >
                  {message.type === 'ai' ? (
                    <div className={styles.markdownContent}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                <div
                  className={`${styles.timestamp} ${
                    message.type === 'user' ? styles.userTimestamp : ''
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={styles.loadingMessage}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.errorMessage}>
                <ErrorOutlineIcon sx={{ fontSize: 18 }} />
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions - Always visible above input */}
          {messages.length > 0 && (
            <div className={styles.quickSuggestions}>
              <button
                className={styles.quickSuggestionChip}
                onClick={() => setInputValue('What are the immediate action items?')}
              >
                Action items
              </button>
              <button
                className={styles.quickSuggestionChip}
                onClick={() => setInputValue('Are there any similar cases with their judgements? Give me top 3 similar cases.')}
              >
                Similar cases
              </button>
              <button
                className={styles.quickSuggestionChip}
                onClick={() => setInputValue('What are the key risks and challenges in this case?')}
              >
                Risks
              </button>
              <button
                className={styles.quickSuggestionChip}
                onClick={() => setInputValue('Summarize the case timeline and upcoming deadlines')}
              >
                Timeline
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className={styles.chatInput}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask about this case..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className={styles.sendButton}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <SendIcon sx={{ color: 'white', fontSize: 18 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
