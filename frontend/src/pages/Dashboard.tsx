import React, { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';
import type { DashboardData } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { 
  Building, Leaf, Users, Shield, Trophy, Activity, AlertTriangle
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getDashboard();
        setData(res.data.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading Dashboard...</div>;
  }

  if (!data) {
    return <div style={{ color: 'var(--text-danger)' }}>Error loading dashboard data.</div>;
  }

  // Emission Trend Chart Data
  const trendLabels = Object.keys(data.emission_trend).sort();
  const trendValues = trendLabels.map((lbl) => data.emission_trend[lbl]);

  const chartData = {
    labels: trendLabels.map(l => {
      const [year, month] = l.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [
      {
        label: 'Emissions (kg CO2e)',
        data: trendValues,
        fill: true,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#10b981'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      }
    }
  };

  // Columns for Department Rankings Table
  const rankingColumns = [
    {
      header: 'Department',
      accessor: (row: any) => (
        <span style={{ fontWeight: 600, color: '#fff' }}>
          {row.departments?.name} ({row.departments?.code})
        </span>
      ),
      sortKey: 'department_id' as any
    },
    {
      header: 'Environmental Score',
      accessor: (row: any) => <span>{row.environmental_score} / 100</span>,
      sortKey: 'environmental_score' as any
    },
    {
      header: 'Social Score',
      accessor: (row: any) => <span>{row.social_score} / 100</span>,
      sortKey: 'social_score' as any
    },
    {
      header: 'Governance Score',
      accessor: (row: any) => <span>{row.governance_score} / 100</span>,
      sortKey: 'governance_score' as any
    },
    {
      header: 'Overall ESG Score',
      accessor: (row: any) => (
        <span style={{
          fontWeight: 700,
          color: 'var(--primary-color)',
          background: 'var(--primary-glow)',
          padding: '4px 10px',
          borderRadius: '12px'
        }}>
          {row.total_score}
        </span>
      ),
      sortKey: 'total_score' as any
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header section */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Executive ESG Dashboard
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Real-time ESG scoring, carbon transactions, governance tracking and gamification leaderboard.
        </p>
      </div>

      {/* Main Score & Weights Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* Overall Score Card */}
        <Card style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(30, 41, 59, 0.45) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '30px 20px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Overall Corporate ESG Score
            </span>
            <span style={{
              fontSize: '4rem',
              fontWeight: 900,
              color: 'var(--primary-color)',
              letterSpacing: '-2px',
              textShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
            }}>
              {data.overall_score}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Weighted average score across all departments
            </span>
          </div>
        </Card>

        {/* ESG Weights Summary */}
        <Card title="Module Weights Configuration" subtitle="Configured organization scoring criteria">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Environmental (E)</span>
                <span>{data.weights.environmental * 100}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${data.weights.environmental * 100}%`, background: 'var(--success)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--info)', fontWeight: 600 }}>Social (S)</span>
                <span>{data.weights.social * 100}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${data.weights.social * 100}%`, background: 'var(--info)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Governance (G)</span>
                <span>{data.weights.social * 100}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${data.weights.social * 100}%`, background: 'var(--warning)' }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <StatCard title="Total Carbon footprint" value={`${data.total_emissions.toLocaleString()} kg`} icon={Leaf} color="var(--success)" />
        <StatCard title="Active CSR Activities" value={data.active_csr_activities} icon={Users} color="var(--info)" />
        <StatCard title="Active Challenges" value={data.active_challenges} icon={Trophy} color="var(--warning)" />
        <StatCard title="Open Compliance Issues" value={data.open_compliance_issues} icon={Shield} color="var(--danger)" />
      </div>

      {/* Trend & Leaderboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
        gap: '20px'
      }}>
        {/* Line Chart */}
        <Card title="Carbon Emissions Trend" subtitle="Monthly total greenhouse gas emissions (kg CO2e)">
          <div style={{ height: '300px', marginTop: '10px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>

        {/* Goals Progress */}
        <Card title="Active Sustainability Targets" subtitle="Department and organizational goals">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            {data.goals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active goals found.</p>
            ) : (
              data.goals.map((g) => {
                const percentage = Math.min(100, Math.round((g.current_value / g.target_value) * 100));
                return (
                  <div key={g.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{g.title}</span>
                      <span>{g.current_value} / {g.target_value} {g.unit} ({percentage}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                      }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Department Rankings Table */}
      <div>
        <Card title="Department Rankings" subtitle="Departmental individual scores across E, S, G criteria">
          <DataTable
            columns={rankingColumns}
            data={data.department_rankings}
          />
        </Card>
      </div>
    </div>
  );
};
