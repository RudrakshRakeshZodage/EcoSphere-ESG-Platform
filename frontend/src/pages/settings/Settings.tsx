import React, { useEffect, useState } from 'react';
import { getSettings, updateSettings, getDepartments, createDepartment, getCategories, createCategory } from '../../services/api';
import { ESGSettings, Department, Category } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export const Settings: React.FC = () => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<ESGSettings | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Department Form state
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');

  // Category Form state
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('CSR Activity');

  // Weights Form state
  const [envWeight, setEnvWeight] = useState(0.40);
  const [socialWeight, setSocialWeight] = useState(0.30);
  const [govWeight, setGovWeight] = useState(0.30);

  const fetchAllSettings = async () => {
    try {
      const [settingsRes, deptRes, catRes] = await Promise.all([
        getSettings(),
        getDepartments(),
        getCategories()
      ]);
      const data = settingsRes.data.data;
      setSettings(data);
      setEnvWeight(data.env_weight);
      setSocialWeight(data.social_weight);
      setGovWeight(data.gov_weight);

      setDepartments(deptRes.data.data);
      setCategories(catRes.data.data);
    } catch (err) {
      console.error('Error fetching settings metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const handleUpdateToggle = async (key: keyof ESGSettings, currentVal: boolean) => {
    if (!isAdmin) return;
    try {
      await updateSettings({ [key]: !currentVal });
      fetchAllSettings();
    } catch (err) {
      console.error('Error toggling setting:', err);
    }
  };

  const handleUpdateWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (Math.abs((Number(envWeight) + Number(socialWeight) + Number(govWeight)) - 1.0) > 0.01) {
      alert('Weights must sum up to exactly 1.0 (100%)');
      return;
    }

    try {
      await updateSettings({
        env_weight: Number(envWeight),
        social_weight: Number(socialWeight),
        gov_weight: Number(govWeight)
      });
      alert('Weights configuration updated successfully!');
      fetchAllSettings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update weights');
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await createDepartment({
        name: deptName,
        code: deptCode,
        head_name: deptHead || null
      });
      setDeptName('');
      setDeptCode('');
      setDeptHead('');
      fetchAllSettings();
    } catch (err) {
      console.error('Error creating department:', err);
    }
  };

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await createCategory({
        name: catName,
        type: catType
      });
      setCatName('');
      fetchAllSettings();
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Settings & Administration
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Configure ESG target scoring criteria weights, operational rules, departments, and category scopes.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '30px'
      }}>
        {/* Toggle Configuration */}
        {settings && (
          <Card title="System Rules Config" subtitle="Manage global operational features">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>Auto Emission Calculation</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automatically process carbon transactions from linked ERP inputs.</p>
                </div>
                <button
                  onClick={() => handleUpdateToggle('auto_emission_enabled', settings.auto_emission_enabled)}
                  disabled={!isAdmin}
                  style={{ background: 'transparent', border: 'none', color: settings.auto_emission_enabled ? 'var(--primary-color)' : 'var(--text-muted)' }}
                >
                  {settings.auto_emission_enabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>Evidence Requirement Toggle</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CSR and Challenge completion claims require validation links.</p>
                </div>
                <button
                  onClick={() => handleUpdateToggle('evidence_required', settings.evidence_required)}
                  disabled={!isAdmin}
                  style={{ background: 'transparent', border: 'none', color: settings.evidence_required ? 'var(--primary-color)' : 'var(--text-muted)' }}
                >
                  {settings.evidence_required ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>Badge Auto-Award Engine</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-assign badges when employees reach XP levels.</p>
                </div>
                <button
                  onClick={() => handleUpdateToggle('badge_auto_award', settings.badge_auto_award)}
                  disabled={!isAdmin}
                  style={{ background: 'transparent', border: 'none', color: settings.badge_auto_award ? 'var(--primary-color)' : 'var(--text-muted)' }}
                >
                  {settings.badge_auto_award ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Weights Scoring Configuration */}
        <Card title="Corporate ESG Weights" subtitle="Adjust criteria contributions to corporate score">
          <form onSubmit={handleUpdateWeights} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Environmental (E) Weight (0.0 - 1.0)</label>
              <input type="number" step="0.05" value={envWeight} onChange={(e) => setEnvWeight(Number(e.target.value))} disabled={!isAdmin} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Social (S) Weight (0.0 - 1.0)</label>
              <input type="number" step="0.05" value={socialWeight} onChange={(e) => setSocialWeight(Number(e.target.value))} disabled={!isAdmin} required />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Governance (G) Weight (0.0 - 1.0)</label>
              <input type="number" step="0.05" value={govWeight} onChange={(e) => setGovWeight(Number(e.target.value))} disabled={!isAdmin} required />
            </div>

            {isAdmin && (
              <Button type="submit" style={{ width: 'fit-content', marginTop: '10px' }}>
                Save Score Weights
              </Button>
            )}
          </form>
        </Card>
      </div>

      {isAdmin && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '30px',
          marginTop: '10px'
        }}>
          {/* Departments Admin */}
          <Card title="Departments Config" subtitle="Create departments and organizational owners">
            <form onSubmit={handleAddDept} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Department Name</label>
                <input type="text" value={deptName} onChange={(e) => setDeptName(e.target.value)} required placeholder="e.g. Sales" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Code</label>
                  <input type="text" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} required placeholder="e.g. SLS" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Head Name</label>
                  <input type="text" value={deptHead} onChange={(e) => setDeptHead(e.target.value)} placeholder="e.g. Alice Smith" />
                </div>
              </div>
              <Button type="submit" style={{ width: 'fit-content' }}>
                <Plus size={16} /> Add Department
              </Button>
            </form>
          </Card>

          {/* Categories Admin */}
          <Card title="ESG Categories Config" subtitle="Add new categories for challenges or CSR campaigns">
            <form onSubmit={handleAddCat} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Category Name</label>
                <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} required placeholder="e.g. Recycling" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type Scope</label>
                <select value={catType} onChange={(e) => setCatType(e.target.value)} required>
                  <option value="CSR Activity">CSR Activity</option>
                  <option value="Challenge">Challenge</option>
                </select>
              </div>
              <Button type="submit" style={{ width: 'fit-content' }}>
                <Plus size={16} /> Add Category
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
