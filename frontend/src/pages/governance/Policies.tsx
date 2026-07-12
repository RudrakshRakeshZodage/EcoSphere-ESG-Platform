import React, { useEffect, useState } from 'react';
import { getPolicies, createPolicy, deletePolicy, acknowledgePolicy, getAcknowledgements } from '../../services/api';
import { ESGPolicy } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash, Check, Eye } from 'lucide-react';

export const Policies: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [policies, setPolicies] = useState<ESGPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAckModalOpen, setIsAckModalOpen] = useState(false);
  const [acks, setAcks] = useState<any[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Governance');
  const [version, setVersion] = useState('1.0');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentUrl, setDocumentUrl] = useState('');

  const fetchPolicies = async () => {
    try {
      const res = await getPolicies();
      setPolicies(res.data.data);
    } catch (err) {
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPolicy({
        title,
        description,
        category,
        version,
        effective_date: effectiveDate,
        document_url: documentUrl || null
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      fetchPolicies();
    } catch (err) {
      console.error('Error creating policy:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await deletePolicy(id);
      fetchPolicies();
    } catch (err) {
      console.error('Error deleting policy:', err);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgePolicy(id);
      alert('Policy acknowledged successfully!');
    } catch (err) {
      console.error('Error acknowledging policy:', err);
      alert('You have already acknowledged this policy');
    }
  };

  const viewAcknowledgements = async (policyId: string) => {
    try {
      const res = await getAcknowledgements(policyId);
      setAcks(res.data.data);
      setIsAckModalOpen(true);
    } catch (err) {
      console.error('Error fetching policy acknowledgements:', err);
    }
  };

  const columns = [
    {
      header: 'Title',
      accessor: (row: ESGPolicy) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.title}</span>,
      sortKey: 'title' as any
    },
    {
      header: 'Category',
      accessor: (row: ESGPolicy) => <span>{row.category}</span>
    },
    {
      header: 'Version',
      accessor: (row: ESGPolicy) => <span>v{row.version}</span>
    },
    {
      header: 'Effective Date',
      accessor: (row: ESGPolicy) => <span>{row.effective_date}</span>
    },
    {
      header: 'Status',
      accessor: (row: ESGPolicy) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: (row: ESGPolicy) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isAdmin && (
            <Button size="sm" onClick={() => handleAcknowledge(row.id)}>
              <Check size={14} /> Acknowledge
            </Button>
          )}
          {isAdmin && (
            <>
              <Button size="sm" variant="secondary" onClick={() => viewAcknowledgements(row.id)}>
                <Eye size={14} /> View Acks
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
                <Trash size={14} />
              </Button>
            </>
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
            Corporate Governance Policies
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage ethical, code of conduct, anti-corruption, and data protection policies.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Policy
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading policies...</div>
        ) : (
          <DataTable
            columns={columns}
            data={policies}
            searchPlaceholder="Search policies..."
            searchFilter={(row, query) => row.title.toLowerCase().includes(query.toLowerCase())}
          />
        )}
      </Card>

      {/* Create Policy Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create ESG Policy"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Policy</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Policy Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Anti-Bribery Policy" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide short synopsis of policy..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="Environmental">Environmental</option>
              <option value="Social">Social</option>
              <option value="Governance">Governance</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Version</label>
            <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Effective Date</label>
            <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Document Link / URL</label>
            <input type="text" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </Modal>

      {/* View Acknowledgements Modal */}
      <Modal
        isOpen={isAckModalOpen}
        onClose={() => setIsAckModalOpen(false)}
        title="Employee Acknowledgements"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {acks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No acknowledgements logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {acks.map((ack) => (
                <div key={ack.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{ack.profiles?.full_name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(ack.acknowledged_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
