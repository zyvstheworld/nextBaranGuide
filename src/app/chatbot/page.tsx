"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatbotPage() {
  // state for messages array
  const [messages, setMessages] = useState<Message[]>([]);
  // state for current input value
  const [input, setInput] = useState("");
  // state for loading indicator
  const [loading, setLoading] = useState(false);
  // ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // ref for input field focus
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "48px";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  // handle sending a message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.data?.response || "I'm sorry, I couldn't process that request. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment or visit your local Barangay office for immediate assistance.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/landing" className="flex items-center gap-3">
              <Image
                src="/baranguide-log.png"
                alt="BaranGuide Logo"
                width={150}
                height={50}
                className="h-10 w-auto"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              <Link href="/landing" className="px-3 py-2 text-gray-700 text-sm tracking-tight font-medium hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/landing#services" className="px-3 py-2 text-gray-700 text-sm tracking-tight font-medium hover:text-gray-900 transition-colors">
                Services
              </Link>
              <Link href="/landing#faqs" className="px-3 py-2 text-gray-700 text-sm tracking-tight font-medium hover:text-gray-900 transition-colors">
                FAQs
              </Link>
              <Link href="/landing#contacts" className="px-3 py-2 text-gray-700 text-sm tracking-tight font-medium hover:text-gray-900 transition-colors">
                Contacts
              </Link>
              <Link href="/landing#officials" className="px-3 py-2 text-gray-700 text-sm tracking-tight font-medium hover:text-gray-900 transition-colors">
                Barangay Officials
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* main chat container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 pb-32">
        {/* welcome heading with input below - only show when no messages */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
                {getGreeting()}, How can I help you today?
              </h1>
              <p className="text-gray-600 text-xs tracking-tight">
                I'm BaranGuide, your AI assistant for barangay services and information.
              </p>
            </div>
            
            {/* input area - below welcome text */}
            <div className="w-full max-w-2xl mx-auto flex items-center justify-center">
              <div className="w-full relative bg-gray-100 rounded-full">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your questions here..." disabled={loading} rows={1} className="w-full px-4 py-4 pr-12 rounded-full border border-gray-200 text-xs text-gray-600 tracking-tight outline-none focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed resize-none overflow-y-auto placeholder:text-gray-400 scrollbar-hide" />
                <button onClick={handleSend} disabled={!input.trim() || loading} className="absolute right-2 bottom-3 p-2 bg-gray-900 rounded-full hover:bg-gray-900/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Send message">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" viewBox="0 0 256 256"><path d="M231.87,114l-168-95.89A16,16,0,0,0,40.92,37.34L71.55,128,40.92,218.67A16,16,0,0,0,56,240a16.15,16.15,0,0,0,7.93-2.1l167.92-96.05a16,16,0,0,0,.05-27.89ZM56,224a.56.56,0,0,0,0-.12L85.74,136H144a8,8,0,0,0,0-16H85.74L56.06,32.16A.46.46,0,0,0,56,32l168,95.83Z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* chat messages area */}
        {(messages.length > 0 || loading) && (
          <div className="flex-1 overflow-y-auto space-y-6 px-2 pt-8 scrollbar-hide">
            {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`} >
              <div className={`flex gap-3 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* message bubble */}
                <div
                  className={`rounded-3xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm leading-relaxed tracking-tight whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* input area - fixed at bottom (only show when messages exist) */}
      {messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white z-40">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-end gap-3">
            <div className="w-full relative rounded-full">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your questions here..." disabled={loading} rows={1} className="w-full px-4 py-4 pr-12 rounded-full border border-gray-200 text-xs text-gray-600 tracking-tight outline-none focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed resize-none overflow-y-auto placeholder:text-gray-400 scrollbar-hide" />
                <button onClick={handleSend} disabled={!input.trim() || loading} className="absolute right-2 bottom-3 p-2 bg-gray-900 rounded-full hover:bg-gray-900/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Send message">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#ffffff" viewBox="0 0 256 256"><path d="M231.87,114l-168-95.89A16,16,0,0,0,40.92,37.34L71.55,128,40.92,218.67A16,16,0,0,0,56,240a16.15,16.15,0,0,0,7.93-2.1l167.92-96.05a16,16,0,0,0,.05-27.89ZM56,224a.56.56,0,0,0,0-.12L85.74,136H144a8,8,0,0,0,0-16H85.74L56.06,32.16A.46.46,0,0,0,56,32l168,95.83Z"></path></svg>
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center tracking-tight">
              BaranGuide may make mistakes. Please verify the information before acting on it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

