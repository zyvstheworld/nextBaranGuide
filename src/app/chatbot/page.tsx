"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type Message = {
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isError?: boolean;
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add initial greeting message
    setMessages([
      {
        sender: 'bot',
        content: 'Hello! Welcome to BaranGuide. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  // Function to scroll chat to bottom when new messages arrive
  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    if (messages.length) {
      scrollToBottom();
    }
  }, [messages]);

  // Send message to API and get response
  const sendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message to the chat
    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        content: userInput,
        timestamp: new Date()
      }
    ]);

    // Clear input and show loading state
    const query = userInput;
    setUserInput('');
    setLoading(true);

    try {
      // Call the API
      const response = await fetch(`/api/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error getting response from server');
      }

      // Add bot response
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          content: data.data.response,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error:', error);

      // Add error message
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          content: 'Sorry, I encountered an error while processing your request. Please try again later.',
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // Format the message content with line breaks for display
  const formatMessage = (content: string) => {
    return content.replace(/\n/g, '<br>');
  };

  // Focus input after loading is complete
  useEffect(() => {
    if (!loading && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [loading]);

  return (
    <div className="chat-container">
      <div className="city-seal-background"></div>
      <header>
        <div className="logo">
            <Image
              src="/baranguide-log.png"
            alt="Olongapo City Seal"
            width={150}
            height={50}
            className="mini-seal"
          />
           <span className="chatbot-title">(Barangay Old Cabalan Chatbot)</span>
        </div>
      </header>

      <div className="messages-container" ref={chatContainerRef}>
        {messages.map((message, i) => (
          <div key={i} className={`message ${message.sender}`}>
            {message.sender === 'bot' ? (
              <div className={`message-content bot-message ${message.isError ? 'error' : ''}`}>
                <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
              </div>
            ) : (
              <div className="message-content user-message">
                {message.content}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="message bot">
            <div className="message-content bot-message loading">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
              </div>
            </div>
          )}
        </div>

      <form onSubmit={handleSubmit} className="input-area">
          <input
            type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message here..."
            disabled={loading}
          ref={inputRef}
        />
        <button type="submit" disabled={loading || !userInput.trim()}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </form>

      <style jsx>{`
        .chat-container {
          width: 100%;
          height: calc(var(--vh, 1vh) * 100);
          min-height: 0;
          display: flex;
          flex-direction: column;
          background-color: white;
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
        }

        .city-seal-background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/olongapo-seal.png');
          background-position: center;
          background-size: contain;
          background-repeat: no-repeat;
          opacity: 0.03;
          pointer-events: none;
          z-index: 0;
        }

        header {
          padding: 1rem;
          border-bottom: 1px solid #eaeaea;
          background-color: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mini-seal {
          margin-right: 8px;
        }
        .chatbot-title {
            font-size: 1.1rem;
            font-weight: 500;
            color: #4361ee;
            letter-spacing: 0.01em;
            margin-left: 6px;
            white-space: nowrap;
  }

        .messages-container {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          background-color: #f8f9fa;
        }

        .message {
          display: flex;
          margin-bottom: 0.5rem;
        }

        .bot {
          justify-content: flex-start;
        }

        .user {
          justify-content: flex-end;
        }

        .message-content {
          padding: 0.8rem 1rem;
          border-radius: 12px;
          max-width: 80%;
          overflow-wrap: break-word;
        }

        .bot-message {
          background-color: #ffffff;
          color: #333;
          border-top-left-radius: 2px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .user-message {
          background-color: #4361ee;
          color: white;
          border-top-right-radius: 2px;
        }

        .error {
          background-color: #fff0f0;
          border-left: 3px solid #ff4d4f;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 60px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background-color: #999;
          border-radius: 50%;
          margin: 0 3px;
          animation: bounce 1.5s infinite ease-in-out;
        }

        .dot:nth-child(1) {
          animation-delay: 0s;
        }

        .dot:nth-child(2) {
          animation-delay: 0.3s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.6s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
        }

        .input-area {
          display: flex;
          padding: 1rem;
          border-top: 1px solid #eaeaea;
          background-color: #ffffff;
        }

        input {
          flex: 1;
          padding: 0.8rem 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 24px;
          outline: none;
          font-size: 1rem;
        }

        input:focus {
          border-color: #4361ee;
        }

        button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: #4361ee;
          color: white;
          border: none;
          margin-left: 0.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        button:hover {
          background-color: #3a56d4;
        }

        button:disabled {
          background-color: #c5c5c5;
          cursor: not-allowed;
        }

        button svg {
          width: 24px;
          height: 24px;
        }

        @media (max-width: 768px) {
          .chat-container {
            max-width: 100vw;
            padding: 0;
          }
          .messages-container {
            padding: 0.5rem 0.2rem;
          }
          .input-area {
            padding: 0.5rem 0.2rem;
          }
          .city-seal-background {
            background-size: 90vw !important;
          }
        }

        @media (max-width: 480px) {
          .messages-container {
            padding: 0.3rem 0.1rem;
          }
          .input-area {
            padding: 0.3rem 0.1rem;
          }
          .city-seal-background {
            background-size: 120vw !important;
          }
        }
      `}</style>
    </div>
  );
} 