import React, { useEffect, useState } from 'react';
import { getAudits, createAudit, getDepartments } from '../../services/api';
import type { Audit, Department } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Plus } from 'lucide-react';

export const Audits: React.FC = () => {
  const { isAdmin } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [auditor, setAuditor] = useState('');
  const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
  const [findings, setFindings] = useState('');
  const [status, setStatus] = useState<'Planned' | 'In Progress' | 'Completed'>('Planned');

  const fetchAudits = async () => {
    try {
      const res = await getAudits();
      setAudits(res.data.data);
    } catch (err) {
      console.error('Error fetching audits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res.data.data);
        if (res.data.data.length > 0) setDepartmentId(res.data.data[0].id);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepts();
    fetchAudits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAudit({
        title,
        department_id: departmentId || null,
        auditor,
        audit_date: auditDate,
        findings,
        status
      });
      setIsModalOpen(false);
      setTitle('');
      setFindings('');
      fetchAudits();
    } catch (err) {
      console.error('Error creating audit:', err);
    }
  };

  const columns = [
    {
      header: 'Audit Title',
      accessor: (row: Audit) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.title}</span>,
      sortKey: 'title' as any
    },
    {
      header: 'Department',
      accessor: (row: Audit) => <span>{row.departments?.name || 'All'}</span>
    },
    {
      header: 'Auditor',
      accessor: (row: Audit) => <span>{row.auditor || '-'}</span>
    },
    {
      header: 'Audit Date',
      accessor: (row: Audit) => <span>{row.audit_date || '-'}</span>,
      sortKey: 'audit_date' as any
    },
    {
      header: 'Status',
      accessor: (row: Audit) => <StatusBadge status={row.status} />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Governance Audits
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Coordinate planned, running, or concluded ESG assessments.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Schedule Audit
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading audits...</div>
        ) : (
          <DataTable
            columns={columns}
            data={audits}
            searchPlaceholder="Search audits..."
            searchFilter={(row, query) => row.title.toLowerCase().includes(query.toLowerCase())}
          />
        )}
      </Card>

      {/* Create Audit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Audit"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Audit</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Audit Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. FY26 Q1 Environmental Compliance Review" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Scope (Department)</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Company Wide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Auditor Name / Body</label>
            <input type="text" value={auditor} onChange={(e) => setAuditor(e.target.value)} required placeholder="e.g. Bureau Veritas, Internal ESG Committee" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Audit Date</label>
            <input type="date" value={auditDate} onChange={(e) => setAuditDate(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Findings / Notes</label>
            <textarea value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Audit findings..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
