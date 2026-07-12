import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { queryChatbot } from '../../services/api';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

// Inbuilt Browser Web Speech API definitions
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
}

export const EsgChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hello! I am EcoBot, your real-time ESG Advisor. Ask me anything about our product profiles, employee scores, compliance issues, or carbon accounting!',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Text-To-Speech (TTS) response
  const speakText = (text: string) => {
    if (!isSoundOn || !window.speechSynthesis) return;
    
    // Cancel any current speaking
    window.speechSynthesis.cancel();
    
    // Clean markdown characters from speaking text for natural voice
    const cleanText = text.replace(/[*#`•👤📦🌱⚠️✅]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
  };

  // Speech-To-Text (STT) listeners
  useEffect(() => {
    if (!recognition) return;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Try Google Chrome.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setInput('');
      recognition.start();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await queryChatbot(userMsg);
      const answer = res.data?.answer || "Sorry, I encountered an issue querying the database.";
      setMessages((prev) => [...prev, { sender: 'bot', text: answer, timestamp: new Date() }]);
      
      // Read bot response aloud
      speakText(answer);
    } catch (err: any) {
      console.error('Error sending query to chatbot API:', err);
      const failMsg = "I couldn't contact the ESG database router. Please make sure the backend API is running.";
      setMessages((prev) => [...prev, { sender: 'bot', text: failMsg, timestamp: new Date() }]);
      speakText(failMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)',
          transition: 'transform 0.3s ease',
          zIndex: 1000,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '30px',
            width: '380px',
            height: '500px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>EcoBot</h3>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Real-Time Voice Advisor</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Voice Sound Toggle Button */}
              <button
                onClick={() => {
                  const newState = !isSoundOn;
                  setIsSoundOn(newState);
                  if (!newState && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                }}
                title={isSoundOn ? "Turn Voice Responses Off" : "Turn Voice Responses On"}
                style={{ background: 'none', border: 'none', color: isSoundOn ? '#34d399' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.sender === 'user' ? '#10b981' : 'rgba(255, 255, 255, 0.03)',
                  border: m.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  fontSize: '0.85rem',
                }}
              >
                EcoBot is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '15px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.8)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            {/* STT Speech Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Listening... Click to stop" : "Speak to Chatbot"}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isListening ? '#ef4444' : 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.3s ease',
                animation: isListening ? 'pulse 1.5s infinite' : 'none'
              }}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              placeholder={isListening ? "Listening... Speak now" : "Ask laptop carbon or Nidhi's XP..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isListening}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#fff',
                padding: '8px 12px',
                outline: 'none',
                fontSize: '0.85rem',
              }}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || loading || isListening}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !input.trim() || loading || isListening ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
