import React, { useEffect, useState } from 'react';
import { getBadges, getMyBadges, createBadge } from '../../services/api';
import type { Badge } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Award, Plus, Lock, CheckCircle } from 'lucide-react';

export const Badges: React.FC = () => {
  const { isAdmin } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState('xp_threshold');
  const [ruleValue, setRuleValue] = useState(100);

  const fetchBadges = async () => {
    try {
      const [allRes, myRes] = await Promise.all([getBadges(), getMyBadges()]);
      setAllBadges(allRes.data.data);
      setMyBadges(myRes.data.data);
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBadge({
        name,
        description,
        unlock_rule: { type: ruleType, value: Number(ruleValue) }
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      fetchBadges();
    } catch (err) {
      console.error('Error creating badge:', err);
    }
  };

  const earnedBadgeIds = new Set(myBadges.map((mb) => mb.badge_id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Acheivement Badges
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Earn badges automatically as your sustainability activity or XP increases.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Badge
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading badges...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {allBadges.map((b) => {
            const isEarned = earnedBadgeIds.has(b.id);
            return (
              <Card
                key={b.id}
                style={{
                  border: isEarned ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--card-border)',
                  background: isEarned ? 'rgba(16,185,129,0.05)' : 'rgba(30,41,59,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Earned Check */}
                {isEarned && (
                  <div style={{ position: 'absolute', top: '15px', right: '15px', color: 'var(--success)' }}>
                    <CheckCircle size={18} fill="rgba(52,211,153,0.2)" />
                  </div>
                )}
                
                {/* Badge Icon */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: isEarned ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: isEarned ? 'var(--primary-color)' : 'var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isEarned ? 'var(--primary-color)' : 'var(--text-muted)',
                  marginBottom: '15px',
                  boxShadow: isEarned ? '0 0 20px rgba(16,185,129,0.2)' : 'none'
                }}>
                  {isEarned ? <Award size={32} /> : <Lock size={28} />}
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{b.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', minHeight: '36px' }}>
                  {b.description || 'No description provided.'}
                </p>

                {/* Unlock criteria */}
                <div style={{
                  marginTop: '15px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  Requires: {b.unlock_rule?.value} {b.unlock_rule?.type === 'xp_threshold' ? 'XP' : 'Completed Challenges'}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Badge Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Achievement Badge"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Badge</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Badge Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Recycler Pro" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Unlocking requirement detail..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unlock Rule Trigger</label>
            <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
              <option value="xp_threshold">XP Threshold</option>
              <option value="challenge_count">Completed Challenge Count</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Trigger Target Value</label>
            <input type="number" value={ruleValue} onChange={(e) => setRuleValue(Number(e.target.value))} required />
          </div>
        </div>
      </Modal>
    </div>
  );
};
