import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { getProductProfiles, getLeaderboard, getComplianceIssues } from '../../services/api';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
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
  
  // Loaded database data for real-time answers
  const [products, setProducts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load database context in real-time when chat is opened
  useEffect(() => {
    if (isOpen) {
      const loadContext = async () => {
        try {
          const [prodRes, leadRes, issueRes] = await Promise.all([
            getProductProfiles().catch(() => ({ data: { data: [] } })),
            getLeaderboard().catch(() => ({ data: { data: [] } })),
            getComplianceIssues().catch(() => ({ data: { data: [] } }))
          ]);
          setProducts(prodRes.data?.data || []);
          setLeaderboard(leadRes.data?.data || []);
          setIssues(issueRes.data?.data || []);
        } catch (err) {
          console.error('Error loading chatbot context:', err);
        }
      };
      loadContext();
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    // AI thinking timeout simulation
    setTimeout(() => {
      let botResponse = '';
      const query = userMsg.toLowerCase();

      // 1. Query Products
      if (query.includes('product') || query.includes('laptop') || query.includes('phone') || query.includes('case') || query.includes('shirt') || query.includes('meter')) {
        if (products.length > 0) {
          const items = products.map(p => 
            `• *${p.product_name}*: Carbon footprint of **${p.carbon_footprint} kg CO2e**, Recyclability: **${p.recyclability_score}%** (Rating: ${p.sustainability_rating || 'N/A'})`
          ).join('\n');
          botResponse = `Here are the product profiles currently logged in our database:\n\n${items}`;
        } else {
          botResponse = "No products found in the database. You can add them under Environmental -> Product ESG Profiles.";
        }
      } 
      // 2. Query Users / Leaderboard
      else if (query.includes('user') || query.includes('employee') || query.includes('score') || query.includes('xp') || query.includes('leaderboard') || query.includes('points') || query.includes('nidhi') || query.includes('rudraksh')) {
        if (leaderboard.length > 0) {
          const rankList = leaderboard.slice(0, 5).map((l, idx) => 
            `#${idx + 1} **${l.full_name}** - **${l.xp} XP** (${l.points} pts)`
          ).join('\n');
          botResponse = `Here is our current Top Employee Leaderboard rankings:\n\n${rankList}`;
        } else {
          botResponse = "No employee scores found in the database yet.";
        }
      }
      // 3. Query Compliance / Governance
      else if (query.includes('compliance') || query.includes('issue') || query.includes('audit') || query.includes('severity')) {
        if (issues.length > 0) {
          const openIssues = issues.filter(i => i.status !== 'Resolved');
          if (openIssues.length > 0) {
            const list = openIssues.map(i => 
              `• **[${i.severity}]** ${i.description} (Owner: ${i.owner?.full_name || 'Unassigned'}, Due: ${i.due_date})`
            ).join('\n');
            botResponse = `We have **${openIssues.length} open compliance issues**:\n\n${list}`;
          } else {
            botResponse = "Excellent! All compliance issues are currently resolved in our system.";
          }
        } else {
          botResponse = "No compliance issues found in the database.";
        }
      }
      // 4. Query general ESG tips
      else if (query.includes('improve') || query.includes('sustainability') || query.includes('help') || query.includes('esg')) {
        botResponse = "To improve EcoSphere's ESG scores, consider these actions:\n\n" +
          "1. 🔌 **Environmental**: Add solar panels and energy meters to reduce fleet/utility carbon emissions.\n" +
          "2. 🤝 **Social**: Create new CSR activities and invite employees to participate to gain XP.\n" +
          "3. 📜 **Governance**: Update core ESG policies and assign due dates to clear out compliance issues.";
      }
      // 5. Default
      else {
        botResponse = "I'm EcoBot, your ESG virtual assistant. You can ask me about carbon footprints of our products, employee XP levels, or ways to improve our corporate ESG standing!";
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botResponse, timestamp: new Date() }]);
      setLoading(false);
    }, 800);
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
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Real-Time ESG Advisor</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
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
            }}
          >
            <input
              type="text"
              placeholder="Ask me about laptop carbon or Nidhi's XP..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
              disabled={!input.trim() || loading}
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
                opacity: !input.trim() || loading ? 0.5 : 1,
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
