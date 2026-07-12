import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI, voiceChatWithAI, textToSpeech } from '../../services/api';
import { MessageSquare, Mic, MicOff, Send, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatProps {
  onToggle: (isOpen: boolean) => void;
}

const AIChat: React.FC<AIChatProps> = ({ onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [outputMode, setOutputMode] = useState<'text' | 'voice'>('text');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (onToggle) onToggle(!isOpen);
  };

  const addMessage = (text: string, sender: 'user' | 'ai') => {
    const newMessage: Message = {
      id: Math.random().toString(36).substring(7),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSendText = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue('');
    addMessage(userText, 'user');
    setIsLoading(true);

    try {
      const { data } = await chatWithAI(userText);
      const aiResponse = data.data.response;
      addMessage(aiResponse, 'ai');

      if (voiceEnabled && outputMode === 'voice') {
        const response = await textToSpeech(aiResponse);
        const url = URL.createObjectURL(response.data);
        const audio = new Audio(url);
        audio.play();
      }
    } catch (error) {
      console.error('Error sending text:', error);
      addMessage('Error: Could not send message.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        await sendVoiceRecording(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const sendVoiceRecording = async (audioBlob: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp3');

    try {
      const { data } = await voiceChatWithAI(formData);
      const transcription = data.data.transcription;
      const aiResponse = data.data.response;

      if (transcription) {
        addMessage(transcription, 'user');
      }
      addMessage(aiResponse, 'ai');

      if (voiceEnabled && outputMode === 'voice') {
        // Note: The voice-chat endpoint currently doesn't return audio in the response body,
        // but it returns info about availability. 
        // For now, we'll use text-to-speech to provide the voice response if requested.
        const response = await textToSpeech(aiResponse);
        const url = URL.createObjectURL(response.data);
        const audio = new Audio(url);
        audio.play();
      }
    } catch (error) {
      console.error('Error sending voice:', error);
      addMessage('Error: Could not process voice recording.', 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="glass-panel w-[400px] h-[500px] mb-4 flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-[var(--card-border)] bg-[rgba(15,23,42,0.6)] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">EcoSphere AI Assistant</h3>
            </div>
            <button onClick={toggleChat} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-10">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>How can I help you with EcoSphere today?</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-[rgba(30,41,59,0.8)] text-gray-100 border border-[var(--card-border)] rounded-tl-none'
                  }`}
                >
                  {msg.text}
                  <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-[rgba(30,41,59,0.8)] p-3 rounded-2xl rounded-tl-none border border-[var(--card-border)]">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls & Input */}
          <div className="p-4 border-t border-[var(--card-border)] bg-[rgba(15,23,42,0.6)] space-y-3">
            {/* Preferences */}
            <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOutputMode(outputMode === 'text' ? 'voice' : 'text')}
                  className={`flex items-center gap-1 ${outputMode === 'voice' ? 'text-emerald-400' : ''}`}
                >
                  {outputMode === 'voice' ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  {outputMode.toUpperCase()}
                </button>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`flex items-center gap-1 ${voiceEnabled ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  {voiceEnabled ? 'VOICE ON' : 'VOICE OFF'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-full transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                  placeholder={isRecording ? "Listening..." : "Type your message..."}
                  disabled={isRecording || isLoading}
                  className="pr-10"
                />
                <button
                  onClick={handleSendText}
                  disabled={!inputValue.trim() || isLoading || isRecording}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-emerald-500 disabled:text-gray-600"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 group"
      >
        {isOpen ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <MessageSquare className="w-7 h-7 group-hover:scale-110 transition-transform" />
        )}
      </button>
    </div>
  );
};

export default AIChat;
