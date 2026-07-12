import React, { useEffect, useState } from 'react';
import { getProductProfiles, createProductProfile, deleteProductProfile, updateProductProfile } from '../../services/api';
import type { ProductESGProfile } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Trash, Plus, Edit } from 'lucide-react';

export const ProductProfiles: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<ProductESGProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductESGProfile | null>(null);

  // Form states
  const [productName, setProductName] = useState('');
  const [carbonFootprint, setCarbonFootprint] = useState('');
  const [recyclabilityScore, setRecyclabilityScore] = useState('');
  const [sustainabilityRating, setSustainabilityRating] = useState('A');
  const [notes, setNotes] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await getProductProfiles();
      setProducts(res.data.data);
    } catch (err) {
      console.error('Error fetching product profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductName('');
    setCarbonFootprint('');
    setRecyclabilityScore('');
    setSustainabilityRating('A');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: ProductESGProfile) => {
    setEditingProduct(prod);
    setProductName(prod.product_name);
    setCarbonFootprint(prod.carbon_footprint !== null ? String(prod.carbon_footprint) : '');
    setRecyclabilityScore(prod.recyclability_score !== null ? String(prod.recyclability_score) : '');
    setSustainabilityRating(prod.sustainability_rating || 'A');
    setNotes(prod.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      product_name: productName,
      carbon_footprint: carbonFootprint !== '' ? Number(carbonFootprint) : null,
      recyclability_score: recyclabilityScore !== '' ? Number(recyclabilityScore) : null,
      sustainability_rating: sustainabilityRating || null,
      notes: notes || null
    };

    try {
      if (editingProduct) {
        await updateProductProfile(editingProduct.id, payload);
      } else {
        await createProductProfile(payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product profile:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product profile?')) return;
    try {
      await deleteProductProfile(id);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product profile:', err);
    }
  };

  const columns = [
    {
      header: 'Product Name',
      accessor: (row: ProductESGProfile) => <span style={{ fontWeight: 600, color: '#fff' }}>{row.product_name}</span>,
      sortKey: 'product_name' as any
    },
    {
      header: 'Carbon Footprint',
      accessor: (row: ProductESGProfile) => (
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
          {row.carbon_footprint !== null ? `${row.carbon_footprint} kg CO2e` : '-'}
        </span>
      ),
      sortKey: 'carbon_footprint' as any
    },
    {
      header: 'Recyclability Score',
      accessor: (row: ProductESGProfile) => (
        <span style={{ color: 'var(--success)', fontWeight: 600 }}>
          {row.recyclability_score !== null ? `${row.recyclability_score}%` : '-'}
        </span>
      ),
      sortKey: 'recyclability_score' as any
    },
    {
      header: 'Sustainability Rating',
      accessor: (row: ProductESGProfile) => {
        let bg = 'rgba(16, 185, 129, 0.1)';
        let border = '1px solid rgba(16, 185, 129, 0.2)';
        let color = '#10b981';

        const rating = row.sustainability_rating || '';
        if (rating.startsWith('C') || rating.startsWith('D')) {
          bg = 'rgba(239, 68, 68, 0.1)';
          border = '1px solid rgba(239, 68, 68, 0.2)';
          color = '#ef4444';
        } else if (rating.startsWith('B')) {
          bg = 'rgba(245, 158, 11, 0.1)';
          border = '1px solid rgba(245, 158, 11, 0.2)';
          color = '#f59e0b';
        }

        return (
          <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: bg,
            border: border,
            color: color
          }}>
            {rating || '-'}
          </span>
        );
      },
      sortKey: 'sustainability_rating' as any
    },
    {
      header: 'Notes',
      accessor: (row: ProductESGProfile) => <span>{row.notes || '-'}</span>
    },
    ...(isAdmin ? [{
      header: 'Actions',
      accessor: (row: ProductESGProfile) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(row)}>
            <Edit size={14} />
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
            <Trash size={14} />
          </Button>
        </div>
      )
    }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Product ESG Profiles
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage and monitor carbon footprint, recyclability, and overall sustainability ratings for products.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenAddModal}>
            <Plus size={16} /> Add Profile
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading product profiles...</div>
        ) : (
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Search products..."
            searchFilter={(row, query) => row.product_name.toLowerCase().includes(query.toLowerCase())}
          />
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product ESG Profile" : "Add Product ESG Profile"}
        footerActions={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingProduct ? "Update Profile" : "Save Profile"}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Product Name</label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required placeholder="e.g. Eco-Friendly Laptop" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Carbon Footprint (kg CO2e)</label>
            <input type="number" step="0.1" value={carbonFootprint} onChange={(e) => setCarbonFootprint(e.target.value)} placeholder="e.g. 120.5" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Recyclability Score (%)</label>
            <input type="number" min="0" max="100" value={recyclabilityScore} onChange={(e) => setRecyclabilityScore(e.target.value)} placeholder="e.g. 85" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sustainability Rating</label>
            <select value={sustainabilityRating} onChange={(e) => setSustainabilityRating(e.target.value)}>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="C+">C+</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Materials used, sustainability certificates, etc." rows={3} style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              color: '#fff',
              padding: '10px',
              fontSize: '0.9rem',
              outline: 'none'
            }} />
          </div>
        </div>
      </Modal>
    </div>
  );
};
