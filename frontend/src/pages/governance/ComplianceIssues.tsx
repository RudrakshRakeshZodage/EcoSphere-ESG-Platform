import React, { useEffect, useState } from 'react';
import { getComplianceIssues, createComplianceIssue, updateComplianceIssue, getAudits, getDepartments } from '../../services/api';
import { ComplianceIssue, Audit, UserProfile } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { Plus, AlertTriangle } from 'lucide-react';

export const ComplianceIssues: React.FC = () => {
  const { profile, isAdmin } = useAuth();
  const [issues, setIssues] = useState<ComplianceIssue[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [auditId, setAuditId] = useState('');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [description, setDescription] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchIssues = async () => {
    try {
      const res = await getComplianceIssues();
      setIssues(res.data.data);
    } catch (err) {
      console.error('Error fetching compliance issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [auditRes, userRes] = await Promise.all([
          getAudits(),
          supabase.from('profiles').select('*')
        ]);
        setAudits(auditRes.data.data);
        setUsers(userRes.data || []);
        if (auditRes.data.data.length > 0) setAuditId(auditRes.data.data[0].id);
        if (userRes.data && userRes.data.length > 0) setOwnerId(userRes.data[0].id);
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchMetadata();
    fetchIssues();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createComplianceIssue({
        audit_id: auditId || null,
        severity,
        description,
        owner_id: ownerId,
        due_date: dueDate
      });
      setIsModalOpen(false);
      setDescription('');
      fetchIssues();
    } catch (err) {
      console.error('Error raising compliance issue:', err);
    }
  };

  const handleResolve = async (id: string) => {
    const notes = window.prompt('Provide resolution notes:');
    if (notes === null) return;
    try {
      await updateComplianceIssue(id, {
        status: 'Resolved',
        resolution_notes: notes
      });
      fetchIssues();
    } catch (err) {
      console.error('Error resolving compliance issue:', err);
    }
  };

  const columns = [
    {
      header: 'Severity',
      accessor: (row: ComplianceIssue) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
          color: row.severity === 'Critical' || row.severity === 'High' ? 'var(--danger)' : row.severity === 'Medium' ? 'var(--warning)' : 'var(--success)'
        }}>
          {(row.severity === 'Critical' || row.severity === 'High') && <AlertTriangle size={14} />}
          {row.severity}
        </span>
      ),
      sortKey: 'severity' as any
    },
    {
      header: 'Description',
      accessor: (row: ComplianceIssue) => <span>{row.description}</span>
    },
    {
      header: 'Owner',
      accessor: (row: ComplianceIssue) => <span>{row.profiles?.full_name || 'Unassigned'}</span>
    },
    {
      header: 'Due Date',
      accessor: (row: ComplianceIssue) => (
        <span style={{ color: row.status === 'Overdue' ? 'var(--danger)' : 'var(--text-secondary)' }}>
          {row.due_date}
        </span>
      ),
      sortKey: 'due_date' as any
    },
    {
      header: 'Status',
      accessor: (row: ComplianceIssue) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: (row: ComplianceIssue) => (
        row.status !== 'Resolved' && (isAdmin || row.owner_id === profile?.id) ? (
          <Button size="sm" onClick={() => handleResolve(row.id)}>
            Mark Resolved
          </Button>
        ) : <span>No actions</span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Compliance Issues
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Track compliance issues raised from audits. Open issues passing due date are flagged as Overdue automatically.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Raise Issue
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading issues...</div>
        ) : (
          <DataTable
            columns={columns}
            data={issues}
          />
        )}
      </Card>

      {/* Raise Issue Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Raise Compliance Issue"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Raise Issue</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Audit Reference</label>
            <select value={auditId} onChange={(e) => setAuditId(e.target.value)}>
              <option value="">No Audit Reference</option>
              {audits.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as any)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Issue Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe the compliance issue..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Owner (Assignee)</label>
            <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
        </div>
      </Modal>
    </div>
  );
};
