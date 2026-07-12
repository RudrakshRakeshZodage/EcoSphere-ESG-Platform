import React, { useEffect, useState } from 'react';
import { getChallenges, createChallenge, updateChallengeStatus, getCategories, joinChallenge, getChallengeParticipations, approveChallengeParticipation } from '../../services/api';
import type { Challenge, Category, ChallengeParticipation } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Plus, Check, X } from 'lucide-react';

export const Challenges: React.FC = () => {
  const { isAdmin } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<ChallengeParticipation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [xpReward, setXpReward] = useState(100);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Medium');
  const [evidenceRequired, setEvidenceRequired] = useState(false);
  const [deadline, setDeadline] = useState('');

  // Join challenge / proof submission
  const [proofUrl, setProofUrl] = useState('');

  const fetchChallenges = async () => {
    try {
      const res = await getChallenges();
      setChallenges(res.data.data);
      if (isAdmin) {
        const partsRes = await getChallengeParticipations();
        setParticipations(partsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const catRes = await getCategories('Challenge');
        setCategories(catRes.data.data);
        if (catRes.data.data.length > 0) setCategoryId(catRes.data.data[0].id);
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchMetadata();
    fetchChallenges();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createChallenge({
        title,
        description,
        category_id: categoryId || null,
        xp_reward: Number(xpReward),
        difficulty,
        evidence_required: evidenceRequired,
        deadline: deadline || null
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchChallenges();
    } catch (err) {
      console.error('Error creating challenge:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateChallengeStatus(id, newStatus);
      fetchChallenges();
    } catch (err) {
      console.error('Error changing challenge status:', err);
    }
  };

  const handleJoinChallenge = (ch: Challenge) => {
    setSelectedChallenge(ch);
    setProofUrl('');
    setIsJoinModalOpen(true);
  };

  const submitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge) return;
    try {
      await joinChallenge({
        challenge_id: selectedChallenge.id,
        proof_url: proofUrl || null
      });
      setIsJoinModalOpen(false);
      setSelectedChallenge(null);
      alert('Joined challenge! Submit your evidence once complete.');
      fetchChallenges();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to join challenge');
    }
  };

  const handleApproveParticipation = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await approveChallengeParticipation(id, status);
      fetchChallenges();
    } catch (err) {
      console.error('Error approving challenge participation:', err);
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: (row: Challenge) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.title}</span>,
      sortKey: 'title' as any
    },
    {
      header: 'Difficulty',
      accessor: (row: Challenge) => (
        <span style={{
          color: row.difficulty === 'Expert' || row.difficulty === 'Hard' ? 'var(--danger)' : row.difficulty === 'Medium' ? 'var(--warning)' : 'var(--success)',
          fontWeight: 700
        }}>
          {row.difficulty}
        </span>
      ),
      sortKey: 'difficulty' as any
    },
    {
      header: 'XP Reward',
      accessor: (row: Challenge) => <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>+{row.xp_reward} XP</span>,
      sortKey: 'xp_reward' as any
    },
    {
      header: 'Deadline',
      accessor: (row: Challenge) => <span>{row.deadline || 'No Deadline'}</span>
    },
    {
      header: 'Status',
      accessor: (row: Challenge) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: (row: Challenge) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'Active' && !isAdmin && (
            <Button size="sm" onClick={() => handleJoinChallenge(row)}>
              Participate
            </Button>
          )}
          {isAdmin && (
            <>
              {row.status === 'Draft' && (
                <Button size="sm" onClick={() => handleStatusChange(row.id, 'Active')}>
                  Activate
                </Button>
              )}
              {row.status === 'Active' && (
                <Button size="sm" variant="secondary" onClick={() => handleStatusChange(row.id, 'Under Review')}>
                  Review
                </Button>
              )}
              {row.status === 'Under Review' && (
                <Button size="sm" onClick={() => handleStatusChange(row.id, 'Completed')}>
                  Complete
                </Button>
              )}
              {row.status !== 'Archived' && (
                <Button size="sm" variant="danger" onClick={() => handleStatusChange(row.id, 'Archived')}>
                  Archive
                </Button>
              )}
            </>
          )}
        </div>
      )
    }
  ];

  const partColumns = [
    {
      header: 'Employee',
      accessor: (row: ChallengeParticipation) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.profiles?.full_name}</span>
    },
    {
      header: 'Challenge',
      accessor: (row: ChallengeParticipation) => <span>{row.challenges?.title}</span>
    },
    {
      header: 'Evidence Link',
      accessor: (row: ChallengeParticipation) => (
        row.proof_url ? (
          <a href={row.proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--info)', textDecoration: 'underline' }}>
            View Evidence
          </a>
        ) : <span>No Proof</span>
      )
    },
    {
      header: 'XP Reward',
      accessor: (row: ChallengeParticipation) => <span>+{row.challenges?.xp_reward} XP</span>
    },
    {
      header: 'Status',
      accessor: (row: ChallengeParticipation) => <StatusBadge status={row.approval_status} />
    },
    {
      header: 'Review Actions',
      accessor: (row: ChallengeParticipation) => (
        row.approval_status === 'Pending' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" onClick={() => handleApproveParticipation(row.id, 'Approved')} style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Check size={12} /> Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleApproveParticipation(row.id, 'Rejected')}>
              <X size={12} /> Reject
            </Button>
          </div>
        ) : <span>Reviewed</span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Sustainability Challenges
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Engage in sustainability campaigns to earn XP, badges, and redeemable points.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Challenge
          </Button>
        )}
      </div>

      <Card title="Available Challenges">
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading challenges...</div>
        ) : (
          <DataTable
            columns={columns}
            data={challenges}
          />
        )}
      </Card>

      {isAdmin && participations.length > 0 && (
        <Card title="Pending Challenge Submissions" subtitle="Verify submissions and reward employee XP">
          <DataTable
            columns={partColumns}
            data={participations}
          />
        </Card>
      )}

      {/* Create Challenge Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Challenge"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Challenge</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Challenge Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Zero-Waste Desk Week" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe challenge tasks..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>XP Reward</label>
            <input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={evidenceRequired}
              onChange={(e) => setEvidenceRequired(e.target.checked)}
              style={{ width: 'auto' }}
            />
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Require Evidence Proof URL</label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Join/Submit Evidence Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Participate in Challenge"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsJoinModalOpen(false)}>Cancel</Button>
            <Button onClick={submitJoin}>Submit Entry</Button>
          </>
        }
      >
        {selectedChallenge && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ color: '#fff' }}>{selectedChallenge.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Earn +{selectedChallenge.xp_reward} XP on completion.
            </p>
            {selectedChallenge.evidence_required && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Proof/Evidence URL <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
