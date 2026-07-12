import React, { useEffect, useState } from 'react';
import { generateReport, getDepartments, getChallenges } from '../../services/api';
import { Department, Challenge, UserProfile } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../services/supabaseClient';
import { FileText, Download } from 'lucide-react';

export const ReportBuilder: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [reportType, setReportType] = useState('environmental');
  const [format, setFormat] = useState('pdf');
  const [departmentId, setDepartmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [module, setModule] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [challengeId, setChallengeId] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, chRes, userRes] = await Promise.all([
          getDepartments(),
          getChallenges(),
          supabase.from('profiles').select('*')
        ]);
        setDepartments(deptRes.data.data);
        setChallenges(chRes.data.data);
        setUsers(userRes.data || []);
      } catch (err) {
        console.error('Error fetching report metadata:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await generateReport({
        report_type: reportType,
        format,
        department_id: departmentId || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        module: module || null,
        employee_id: employeeId || null,
        challenge_id: challengeId || null
      });

      // Create download link for generated file blob
      const file = new Blob([res.data], { type: res.headers['content-type'] });
      const fileURL = URL.createObjectURL(file);
      const fileLink = document.createElement('a');
      fileLink.href = fileURL;
      
      const fileExtension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
      fileLink.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.${fileExtension}`);
      document.body.appendChild(fileLink);
      fileLink.click();
      document.body.removeChild(fileLink);
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report. Make sure backend is running.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Custom Report Builder
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Combine criteria filters and generate formatted corporate ESG summaries or detailed transactions logs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* Configuration Panel */}
        <Card title="Report Parameters" subtitle="Configure report context and filters">
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} required>
                <option value="environmental">Environmental (Emissions & Goals)</option>
                <option value="social">Social (CSR & Volunteer Participations)</option>
                <option value="governance">Governance (Audits & Policies)</option>
                <option value="esg_summary">ESG Corporate Score Summary</option>
                <option value="custom">Custom Criteria Mix</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Export Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} required>
                <option value="pdf">Acrobat PDF Document (.pdf)</option>
                <option value="excel">Microsoft Excel Spreadsheet (.xlsx)</option>
                <option value="csv">Comma-Separated Values (.csv)</option>
              </select>
            </div>

            <h4 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', fontSize: '0.9rem', marginTop: '10px' }}>
              Active Filters (Optional)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Department Scope</label>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>From Date</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>To Date</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            {reportType === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Module</label>
                <select value={module} onChange={(e) => setModule(e.target.value)}>
                  <option value="">All Modules</option>
                  <option value="environmental">Environmental</option>
                  <option value="social">Social</option>
                  <option value="governance">Governance</option>
                </select>
              </div>
            )}

            {reportType === 'social' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Volunteer Employee</label>
                <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  <option value="">All Volunteers</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
            )}

            <Button type="submit" style={{ marginTop: '10px' }}>
              <Download size={16} /> Generate & Download
            </Button>
          </form>
        </Card>

        {/* Informative Side Panel */}
        <Card title="ESG Reports Guide" subtitle="Reference for reporting frameworks">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ color: 'var(--success)' }}><FileText size={24} /></div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Environmental Reports</h4>
                <p>Combines logged greenhouse gas transactions, grid utility units and departmental carbon footprint benchmarks.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ color: 'var(--info)' }}><FileText size={24} /></div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Social Reports</h4>
                <p>Logs CSR campaign attendance rates, staff compositions and aggregate voluntarism logs.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ color: 'var(--warning)' }}><FileText size={24} /></div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>Governance Reports</h4>
                <p>Monitors raised compliance issues, audit logs and policy acknowledgement status for validation.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
