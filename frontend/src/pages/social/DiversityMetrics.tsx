import React, { useEffect, useState } from 'react';
import { getDiversityMetrics } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { Users, ShieldAlert, Activity } from 'lucide-react';

export const DiversityMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await getDiversityMetrics();
        setMetrics(res.data.data);
      } catch (err) {
        console.error('Error fetching diversity metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading Diversity Metrics...</div>;
  }

  const columns = [
    {
      header: 'Department',
      accessor: (row: any) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.name}</span>
    },
    {
      header: 'Head Name',
      accessor: (row: any) => <span>{row.head_name || 'Not Assigned'}</span>
    },
    {
      header: 'Employee Count',
      accessor: (row: any) => <span>{row.employee_count} Employees</span>,
      sortKey: 'employee_count'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Social Diversity & Composition Metrics
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Track organizational compose indexes, headcount distribution and CSR participation.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <StatCard title="Total Employees" value={metrics?.total_employees || 0} icon={Users} color="var(--info)" />
        <StatCard title="Approved CSR Participations" value={metrics?.total_participations || 0} icon={Activity} color="var(--success)" />
      </div>

      <Card title="Departmental Demographics" subtitle="Staff distribution and department heads">
        <DataTable
          columns={columns}
          data={metrics?.departments || []}
        />
      </Card>
    </div>
  );
};
