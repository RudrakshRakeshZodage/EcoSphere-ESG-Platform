import React, { useEffect, useState } from 'react';
import { getTrainingCompletions, createTrainingCompletion, deleteTrainingCompletion } from '../../services/api';
import type { TrainingCompletion, UserProfile } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Plus, Trash2 } from 'lucide-react';

export const TrainingCompletions: React.FC = () => {
  const { isAdmin } = useAuth();
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [completedAt, setCompletedAt] = useState(new Date().toISOString().split('T')[0]);
  const [score, setScore] = useState<number | ''>('');
  const [status, setStatus] = useState<'Completed' | 'In Progress' | 'Failed'>('Completed');

  const fetchCompletions = async () => {
    try {
      const res = await getTrainingCompletions();
      setCompletions(res.data.data);
    } catch (err) {
      console.error('Error fetching training completions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').order('full_name');
      setProfiles(data || []);
      if (data && data.length > 0) {
        setEmployeeId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
    }
  };

  useEffect(() => {
    fetchCompletions();
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrainingCompletion({
        employee_id: employeeId,
        training_name: trainingName,
        completed_at: completedAt,
        score: score === '' ? null : Number(score),
        status
      });
      setIsModalOpen(false);
      setTrainingName('');
      setScore('');
      fetchCompletions();
    } catch (err) {
      console.error('Error creating training completion:', err);
      alert('Failed to save training completion.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this training completion log?')) return;
    try {
      await deleteTrainingCompletion(id);
      fetchCompletions();
    } catch (err) {
      console.error('Error deleting training completion:', err);
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessor: (row: TrainingCompletion) => (
        <span style={{ fontWeight: 600, color: '#fff' }}>
          {row.profiles?.full_name || 'System User'}
        </span>
      ),
      sortKey: 'profiles.full_name' as any
    },
    {
      header: 'Training Course',
      accessor: (row: TrainingCompletion) => <span>{row.training_name}</span>,
      sortKey: 'training_name' as any
    },
    {
      header: 'Completion Date',
      accessor: (row: TrainingCompletion) => <span>{row.completed_at}</span>,
      sortKey: 'completed_at' as any
    },
    {
      header: 'Score',
      accessor: (row: TrainingCompletion) => (
        <span style={{ fontWeight: 700, color: row.score && row.score >= 80 ? 'var(--success)' : 'var(--text-secondary)' }}>
          {row.score !== null ? `${row.score}%` : 'N/A'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row: TrainingCompletion) => <StatusBadge status={row.status} />
    },
    ...(isAdmin ? [{
      header: 'Actions',
      accessor: (row: TrainingCompletion) => (
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
          <Trash2 size={14} />
        </Button>
      )
    }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Training Completions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Monitor and manage employee sustainability, safety, and compliance course certification logs.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Record Certification
          </Button>
        )}
      </div>

      <Card title="Training Logs" subtitle="List of all certified course completions">
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading training logs...</div>
        ) : (
          <DataTable data={completions} columns={columns} />
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Training Completion">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Employee</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Training Course Name</label>
            <input
              type="text"
              value={trainingName}
              onChange={(e) => setTrainingName(e.target.value)}
              placeholder="e.g. ISO 14001 Environmental Standard Overview"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Completion Date</label>
              <input
                type="date"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Certification Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Course Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} required>
              <option value="Completed">Completed / Passed</option>
              <option value="In Progress">In Progress</option>
              <option value="Failed">Failed / Incomplete</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Certification</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
