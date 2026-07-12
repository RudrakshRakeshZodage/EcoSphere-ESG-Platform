import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Trophy, Zap } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await getLeaderboard();
        setBoard(res.data.data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, []);

  const columns = [
    {
      header: 'Rank',
      accessor: (_row: any, idx?: number) => {
        const rank = (idx ?? 0) + 1;
        return (
          <span style={{
            fontWeight: 800,
            color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#b45309' : 'var(--text-secondary)',
            fontSize: rank <= 3 ? '1.1rem' : '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {rank <= 3 && <Trophy size={16} />}
            #{rank}
          </span>
        );
      }
    },
    {
      header: 'Employee Name',
      accessor: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'var(--primary-color)',
            fontSize: '0.85rem'
          }}>
            {row.full_name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: '#fff' }}>{row.full_name}</span>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: (row: any) => <span>{row.departments?.name || '-'}</span>
    },
    {
      header: 'XP Score',
      accessor: (row: any) => (
        <span style={{
          color: '#fbbf24',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Zap size={14} fill="#fbbf24" />
          {row.xp} XP
        </span>
      ),
      sortKey: 'xp'
    },
    {
      header: 'Redeemable Points',
      accessor: (row: any) => <span style={{ color: 'var(--info)', fontWeight: 600 }}>{row.points} pts</span>,
      sortKey: 'points'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          EcoSphere Leaderboard
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Compare XP points across all employees and departments to see who leads the sustainability charge.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {board.slice(0, 3).map((player, idx) => (
          <Card
            key={player.id}
            style={{
              background: idx === 0 ? 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(30,41,59,0.3) 100%)' : 'rgba(30,41,59,0.3)',
              borderColor: idx === 0 ? 'rgba(251,191,36,0.2)' : 'var(--card-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '15px',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#b45309'
            }}>
              #{idx + 1}
            </div>

            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: 'var(--primary-color)',
              marginBottom: '10px'
            }}>
              {player.full_name?.charAt(0).toUpperCase()}
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{player.full_name}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{player.departments?.name || '-'}</span>

            <div style={{
              display: 'flex',
              gap: '15px',
              marginTop: '15px',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>{player.xp} XP</span>
              <span style={{ color: 'var(--info)', fontWeight: 600 }}>{player.points} pts</span>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Corporate Standings">
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading leaderboard standings...</div>
        ) : (
          <DataTable
            columns={columns}
            data={board}
          />
        )}
      </Card>
    </div>
  );
};
