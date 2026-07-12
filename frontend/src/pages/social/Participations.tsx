import React, { useEffect, useState } from 'react';
import { getParticipations, approveParticipation } from '../../services/api';
import { EmployeeParticipation } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Check, X } from 'lucide-react';

export const Participations: React.FC = () => {
  const { isAdmin } = useAuth();
  const [participations, setParticipations] = useState<EmployeeParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParticipations = async () => {
    try {
      const res = await getParticipations();
      setParticipations(res.data.data);
    } catch (err) {
      console.error('Error fetching participations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipations();
  }, []);

  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await approveParticipation(id, status);
      fetchParticipations();
    } catch (err) {
      console.error('Error updating participation approval:', err);
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessor: (row: EmployeeParticipation) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.profiles?.full_name}</span>
    },
    {
      header: 'CSR Activity',
      accessor: (row: EmployeeParticipation) => <span>{row.csr_activities?.title}</span>
    },
    {
      header: 'Evidence / Proof',
      accessor: (row: EmployeeParticipation) => (
        row.proof_url ? (
          <a href={row.proof_url} target="_blank" rel="noreferrer" style={{ color: 'var(--info)', textDecoration: 'underline' }}>
            View Proof Link
          </a>
        ) : <span>No Proof</span>
      )
    },
    {
      header: 'Approval Status',
      accessor: (row: EmployeeParticipation) => <StatusBadge status={row.approval_status} />
    },
    {
      header: 'Points Earned',
      accessor: (row: EmployeeParticipation) => <span>{row.points_earned} Points</span>
    },
    ...(isAdmin ? [{
      header: 'Review Actions',
      accessor: (row: EmployeeParticipation) => (
        row.approval_status === 'Pending' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" onClick={() => handleApproval(row.id, 'Approved')} style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Check size={14} /> Approve
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleApproval(row.id, 'Rejected')}>
              <X size={14} /> Reject
            </Button>
          </div>
        ) : <span>Reviewed</span>
      )
    }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Employee Participations
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Verify evidence and approve points and badges for CSR volunteers.
        </p>
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading participations...</div>
        ) : (
          <DataTable
            columns={columns}
            data={participations}
          />
        )}
      </Card>
    </div>
  );
};
