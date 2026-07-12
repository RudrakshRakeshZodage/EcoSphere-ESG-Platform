import React, { useEffect, useState } from 'react';
import { getCSRActivities, createCSRActivity, deleteCSRActivity, getCategories, getDepartments, createParticipation, getSettings } from '../../services/api';
import { CSRActivity, Category, Department } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Plus } from 'lucide-react';

export const CsrActivities: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [activities, setActivities] = useState<CSRActivity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParticipateModalOpen, setIsParticipateModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CSRActivity | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [pointsReward, setPointsReward] = useState(100);

  // Participate Proof state
  const [proofUrl, setProofUrl] = useState('');
  const [evidenceRequired, setEvidenceRequired] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await getCSRActivities();
      setActivities(res.data.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, deptRes, settingsRes] = await Promise.all([
          getCategories('CSR Activity'),
          getDepartments(),
          getSettings()
        ]);
        setCategories(catRes.data.data);
        setDepartments(deptRes.data.data);
        setEvidenceRequired(settingsRes.data.data.evidence_required);
        if (catRes.data.data.length > 0) setCategoryId(catRes.data.data[0].id);
        if (deptRes.data.data.length > 0) setDepartmentId(deptRes.data.data[0].id);
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchMetadata();
    fetchActivities();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCSRActivity({
        title,
        description,
        category_id: categoryId || null,
        department_id: departmentId || null,
        date,
        max_participants: Number(maxParticipants),
        points_reward: Number(pointsReward)
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchActivities();
    } catch (err) {
      console.error('Error creating CSR activity:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await deleteCSRActivity(id);
      fetchActivities();
    } catch (err) {
      console.error('Error deleting CSR activity:', err);
    }
  };

  const handleRegisterParticipation = (act: CSRActivity) => {
    setSelectedActivity(act);
    setProofUrl('');
    setIsParticipateModalOpen(true);
  };

  const submitParticipation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    try {
      await createParticipation({
        activity_id: selectedActivity.id,
        proof_url: proofUrl || null,
        completion_date: new Date().toISOString().split('T')[0]
      });
      setIsParticipateModalOpen(false);
      setSelectedActivity(null);
      alert('Participation request submitted for approval!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit participation');
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: (row: CSRActivity) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.title}</span>,
      sortKey: 'title' as any
    },
    {
      header: 'Category',
      accessor: (row: CSRActivity) => <span>{row.categories?.name || '-'}</span>
    },
    {
      header: 'Organizer',
      accessor: (row: CSRActivity) => <span>{row.departments?.name || 'All'}</span>
    },
    {
      header: 'Date',
      accessor: (row: CSRActivity) => <span>{row.date || '-'}</span>,
      sortKey: 'date' as any
    },
    {
      header: 'Points Reward',
      accessor: (row: CSRActivity) => (
        <span style={{ color: 'var(--info)', fontWeight: 600 }}>
          +{row.points_reward} Points
        </span>
      ),
      sortKey: 'points_reward' as any
    },
    {
      header: 'Status',
      accessor: (row: CSRActivity) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: (row: CSRActivity) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'Active' && !isAdmin && (
            <Button size="sm" onClick={() => handleRegisterParticipation(row)}>
              Join & Submit Proof
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
              Delete
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            CSR Activities
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Register and coordinate Corporate Social Responsibility initiatives and campaigns.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Activity
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading activities...</div>
        ) : (
          <DataTable
            columns={columns}
            data={activities}
            searchPlaceholder="Search CSR activities..."
            searchFilter={(row, query) => row.title.toLowerCase().includes(query.toLowerCase())}
          />
        )}
      </Card>

      {/* Create Activity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create CSR Activity"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Activity</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Activity Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Tree Plantation Camp" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="CSR details..." />
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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Organizer Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Points Reward</label>
            <input type="number" value={pointsReward} onChange={(e) => setPointsReward(Number(e.target.value))} required />
          </div>
        </div>
      </Modal>

      {/* Participate Modal */}
      <Modal
        isOpen={isParticipateModalOpen}
        onClose={() => setIsParticipateModalOpen(false)}
        title="Submit Participation Proof"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsParticipateModalOpen(false)}>Cancel</Button>
            <Button onClick={submitParticipation}>Submit Proof</Button>
          </>
        }
      >
        {selectedActivity && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ color: '#fff' }}>{selectedActivity.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Submit proof file link/URL to earn +{selectedActivity.points_reward} points.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Proof URL/Link {evidenceRequired && <span style={{ color: 'var(--danger)' }}>*</span>}
              </label>
              <input
                type="text"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                required={evidenceRequired}
              />
              {evidenceRequired && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                  Organization requires proof validation.
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
