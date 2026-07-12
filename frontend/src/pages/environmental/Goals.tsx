import React, { useEffect, useState } from 'react';
import { getEnvironmentalGoals, createEnvironmentalGoal, updateEnvironmentalGoal, getDepartments } from '../../services/api';
import { EnvironmentalGoal, Department } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { Plus } from 'lucide-react';

export const Goals: React.FC = () => {
  const { isAdmin } = useAuth();
  const [goals, setGoals] = useState<EnvironmentalGoal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<EnvironmentalGoal | null>(null);

  // Form states
  const [departmentId, setDepartmentId] = useState('');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState(0);
  const [unit, setUnit] = useState('percent');
  const [deadline, setDeadline] = useState('');
  const [currentValue, setCurrentValue] = useState(0);

  const fetchGoals = async () => {
    try {
      const res = await getEnvironmentalGoals();
      setGoals(res.data.data);
    } catch (err) {
      console.error('Error fetching goals:', err);
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
    fetchGoals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEnvironmentalGoal({
        department_id: departmentId || null,
        title,
        target_value: Number(targetValue),
        unit,
        deadline: deadline || null
      });
      setIsModalOpen(false);
      setTitle('');
      setTargetValue(0);
      setDeadline('');
      fetchGoals();
    } catch (err) {
      console.error('Error creating goal:', err);
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      await updateEnvironmentalGoal(selectedGoal.id, {
        current_value: Number(currentValue)
      });
      setIsProgressModalOpen(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const openProgressModal = (goal: EnvironmentalGoal) => {
    setSelectedGoal(goal);
    setCurrentValue(goal.current_value);
    setIsProgressModalOpen(true);
  };

  const columns = [
    {
      header: 'Goal Title',
      accessor: (row: EnvironmentalGoal) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.title}</span>,
      sortKey: 'title' as any
    },
    {
      header: 'Department',
      accessor: (row: EnvironmentalGoal) => <span>{row.departments?.name || 'Company Wide'}</span>
    },
    {
      header: 'Deadline',
      accessor: (row: EnvironmentalGoal) => <span>{row.deadline || 'No Deadline'}</span>,
      sortKey: 'deadline' as any
    },
    {
      header: 'Progress',
      accessor: (row: EnvironmentalGoal) => {
        const pct = Math.min(100, Math.round((row.current_value / row.target_value) * 100));
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {row.current_value} / {row.target_value} {row.unit} ({pct}%)
            </span>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--success)' }}></div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: (row: EnvironmentalGoal) => <StatusBadge status={row.status} />
    },
    ...(isAdmin ? [{
      header: 'Actions',
      accessor: (row: EnvironmentalGoal) => (
        <Button variant="secondary" size="sm" onClick={() => openProgressModal(row)}>
          Update Progress
        </Button>
      )
    }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Sustainability Goals
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Track progress of carbon reduction targets, waste minimization, and conservation initiatives.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Goal
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading goals...</div>
        ) : (
          <DataTable
            columns={columns}
            data={goals}
            searchPlaceholder="Search goals..."
            searchFilter={(row, query) => row.title.toLowerCase().includes(query.toLowerCase())}
          />
        )}
      </Card>

      {/* Create Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Sustainability Goal"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create Goal</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Goal Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. 20% Electricity reduction" />
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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Value</label>
            <input type="number" value={targetValue} onChange={(e) => setTargetValue(Number(e.target.value))} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit</label>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="e.g. percent, kWh, kg" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Update Progress Modal */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        title="Update Goal Progress"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsProgressModalOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProgress}>Save Progress</Button>
          </>
        }
      >
        {selectedGoal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ color: '#fff' }}>{selectedGoal.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Current value is {selectedGoal.current_value} {selectedGoal.unit}. Target is {selectedGoal.target_value} {selectedGoal.unit}.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>New Value</label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                max={selectedGoal.target_value}
                required
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
