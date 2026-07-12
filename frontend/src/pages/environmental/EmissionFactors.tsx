import React, { useEffect, useState } from 'react';
import { getEmissionFactors, createEmissionFactor, deleteEmissionFactor } from '../../services/api';
import { EmissionFactor } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Trash, Plus } from 'lucide-react';

export const EmissionFactors: React.FC = () => {
  const { isAdmin } = useAuth();
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [sourceType, setSourceType] = useState('');
  const [description, setDescription] = useState('');
  const [factorValue, setFactorValue] = useState(0);
  const [unit, setUnit] = useState('kWh');
  const [region, setRegion] = useState('Global');

  const fetchFactors = async () => {
    try {
      const res = await getEmissionFactors();
      setFactors(res.data.data);
    } catch (err) {
      console.error('Error fetching emission factors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmissionFactor({
        source_type: sourceType,
        description,
        factor_value: Number(factorValue),
        unit,
        region
      });
      setIsModalOpen(false);
      // Reset form
      setSourceType('');
      setDescription('');
      setFactorValue(0);
      setUnit('kWh');
      setRegion('Global');
      fetchFactors();
    } catch (err) {
      console.error('Error creating emission factor:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this emission factor?')) return;
    try {
      await deleteEmissionFactor(id);
      fetchFactors();
    } catch (err) {
      console.error('Error deleting emission factor:', err);
    }
  };

  const columns = [
    {
      header: 'Source Type',
      accessor: (row: EmissionFactor) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.source_type}</span>,
      sortKey: 'source_type' as any
    },
    {
      header: 'Description',
      accessor: (row: EmissionFactor) => <span>{row.description || '-'}</span>
    },
    {
      header: 'Factor Value',
      accessor: (row: EmissionFactor) => <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{row.factor_value}</span>,
      sortKey: 'factor_value' as any
    },
    {
      header: 'Unit',
      accessor: (row: EmissionFactor) => <span>CO2e per {row.unit}</span>
    },
    {
      header: 'Region',
      accessor: (row: EmissionFactor) => <span>{row.region || 'Global'}</span>
    },
    ...(isAdmin ? [{
      header: 'Actions',
      accessor: (row: EmissionFactor) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
          <Trash size={14} />
        </Button>
      )
    }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Emission Factors
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Configure values used to compute greenhouse gas emissions from operational data.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Factor
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading factors...</div>
        ) : (
          <DataTable
            columns={columns}
            data={factors}
            searchPlaceholder="Search source types..."
            searchFilter={(row, query) => row.source_type.toLowerCase().includes(query.toLowerCase())}
          />
        )}
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Emission Factor"
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Factor</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Source Type</label>
            <input type="text" value={sourceType} onChange={(e) => setSourceType(e.target.value)} required placeholder="e.g. Electricity, Natural Gas" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Factor Value (kg CO2e)</label>
            <input type="number" step="0.0001" value={factorValue} onChange={(e) => setFactorValue(Number(e.target.value))} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unit</label>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="e.g. kWh, liter, km" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Region</label>
            <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. India, Global" />
          </div>
        </div>
      </Modal>
    </div>
  );
};
