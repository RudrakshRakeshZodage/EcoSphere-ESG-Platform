import React, { useEffect, useState } from 'react';
import { getRewards, createReward, redeemReward } from '../../services/api';
import type { Reward } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Gift, Plus } from 'lucide-react';

export const Rewards: React.FC = () => {
  const { profile, refreshProfile, isAdmin } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState(100);
  const [stock, setStock] = useState(10);

  const fetchRewards = async () => {
    try {
      const res = await getRewards();
      setRewards(res.data.data);
    } catch (err) {
      console.error('Error fetching rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReward({
        name,
        description,
        points_required: Number(pointsRequired),
        stock: Number(stock)
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      fetchRewards();
    } catch (err) {
      console.error('Error creating reward:', err);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!profile) return;
    if (profile.points < reward.points_required) {
      alert('You do not have enough points to redeem this reward.');
      return;
    }
    if (reward.stock <= 0) {
      alert('This reward is currently out of stock.');
      return;
    }

    if (!window.confirm(`Redeem '${reward.name}' for ${reward.points_required} points?`)) return;

    try {
      await redeemReward(reward.id);
      alert('Reward redeemed successfully!');
      refreshProfile();
      fetchRewards();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Redemption failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Rewards Catalog
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Redeem your accumulated points for corporate perks, sustainable merchandise or charity pledges.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Reward
          </Button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading catalog...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {rewards.map((r) => (
            <Card
              key={r.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}>
                  <Gift size={20} />
                </div>
                <span style={{ fontSize: '0.75rem', color: r.stock > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {r.stock > 0 ? `${r.stock} in stock` : 'Out of Stock'}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{r.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', minHeight: '36px' }}>
                  {r.description || 'No description provided.'}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid rgba(255,255,255,0.04)'
              }}>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{r.points_required} Points</span>
                {!isAdmin && (
                  <Button
                    size="sm"
                    disabled={r.stock <= 0 || (profile ? profile.points < r.points_required : true)}
                    onClick={() => handleRedeem(r)}
                  >
                    Redeem
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Reward Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Reward Option"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Reward</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Reward Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Branded Hoodie" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Perk details..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Points Required</label>
            <input type="number" value={pointsRequired} onChange={(e) => setPointsRequired(Number(e.target.value))} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Initial Catalog Stock</label>
            <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} required />
          </div>
        </div>
      </Modal>
    </div>
  );
};
