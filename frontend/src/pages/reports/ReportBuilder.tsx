import React, { useEffect, useState } from 'react';
import { generateReport, getDepartments } from '../../services/api';
import type { Department, UserProfile } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../services/supabaseClient';
import { FileText, Download, Eye, Search } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend
);

export const ReportBuilder: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Filter states
  const [reportType, setReportType] = useState('environmental');
  const [format, setFormat] = useState('pdf');
  const [departmentId, setDepartmentId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [module, setModule] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const challengeId = '';

  // Preview states
  const [previewData, setPreviewData] = useState<Record<string, any>[] | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, userRes] = await Promise.all([
          getDepartments(),
          supabase.from('profiles').select('*')
        ]);
        setDepartments(deptRes.data.data);
        setUsers(userRes.data || []);
      } catch (err) {
        console.error('Error fetching report metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const handleGenerate = async (e: React.FormEvent, isPreview = false) => {
    if (e) e.preventDefault();
    if (isPreview) setLoadingPreview(true);

    try {
      const res = await generateReport({
        report_type: reportType,
        format: isPreview ? 'json' : format,
        department_id: departmentId || null,
        date_from: dateFrom || null,
        date_to: dateTo || null,
        module: module || null,
        employee_id: employeeId || null,
        challenge_id: challengeId || null
      });

      if (isPreview) {
        const text = await (res.data as any).text();
        const parsed = JSON.parse(text);
        setPreviewData(parsed.data || []);
        setPreviewTitle(parsed.title || 'Report Preview');
        setLoadingPreview(false);
      } else {
        // Create download link for generated file blob
        const file = new Blob([res.data], { type: (res.headers['content-type'] as string) || undefined });
        const fileURL = URL.createObjectURL(file);
        const fileLink = document.createElement('a');
        fileLink.href = fileURL;
        
        const fileExtension = format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'csv';
        fileLink.setAttribute('download', `${reportType}_report_${new Date().toISOString().split('T')[0]}.${fileExtension}`);
        document.body.appendChild(fileLink);
        fileLink.click();
        document.body.removeChild(fileLink);
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setLoadingPreview(false);
      alert('Failed to generate report. Make sure backend is running.');
    }
  };

  // Helper to get aggregated chart data
  const getChartData = () => {
    if (!previewData || previewData.length === 0) return [];

    if (reportType === 'environmental') {
      const grouped: Record<string, number> = {};
      previewData.forEach((row) => {
        const dept = row['Department'] || 'Unknown';
        const em = parseFloat(row['Emission (kg CO2e)'] || '0');
        grouped[dept] = (grouped[dept] || 0) + em;
      });
      return Object.keys(grouped).map(key => ({ name: key, value: parseFloat(grouped[key].toFixed(2)) }));
    }

    if (reportType === 'social') {
      const grouped: Record<string, number> = {};
      previewData.forEach((row) => {
        const status = row['Status'] || 'Pending';
        grouped[status] = (grouped[status] || 0) + 1;
      });
      return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
    }

    if (reportType === 'governance') {
      const grouped: Record<string, number> = {};
      previewData.forEach((row) => {
        const sev = row['Severity'] || 'Unknown';
        grouped[sev] = (grouped[sev] || 0) + 1;
      });
      return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
    }

    if (reportType === 'esg_summary') {
      return previewData.map(row => ({
        name: row['Department'] || 'Unknown',
        Environmental: row['Environmental Score'] || 0,
        Social: row['Social Score'] || 0,
        Governance: row['Governance Score'] || 0,
        Total: row['Total Score'] || 0
      }));
    }

    return [];
  };

  const chartData = getChartData();
  const filteredPreviewData = previewData?.filter((row) => 
    Object.values(row).some((val) => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Construct Chart.js datasets
  const getChartJsData = () => {
    const dataList = chartData as any[];
    if (reportType === 'environmental') {
      return {
        labels: dataList.map(d => d.name),
        datasets: [
          {
            label: 'Emissions (kg CO2e)',
            data: dataList.map(d => d.value),
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10B981',
            borderWidth: 1,
          }
        ]
      };
    }

    if (reportType === 'esg_summary') {
      return {
        labels: dataList.map(d => d.name),
        datasets: [
          {
            label: 'Environmental',
            data: dataList.map(d => d.Environmental),
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
          },
          {
            label: 'Social',
            data: dataList.map(d => d.Social),
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
          },
          {
            label: 'Governance',
            data: dataList.map(d => d.Governance),
            backgroundColor: 'rgba(245, 158, 11, 0.75)',
          }
        ]
      };
    }

    // Social or Governance Pie Charts
    return {
      labels: dataList.map(d => d.name),
      datasets: [
        {
          data: dataList.map(d => d.value),
          backgroundColor: COLORS.slice(0, dataList.length),
          borderWidth: 1,
        }
      ]
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          Custom Report Builder
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Combine criteria filters, preview interactive graphs, and generate formatted corporate ESG summaries.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {/* Configuration Panel */}
        <Card title="Report Parameters" subtitle="Configure report context and filters">
          <form onSubmit={(e) => handleGenerate(e)} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
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

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <Button type="submit" style={{ flex: 1 }}>
                <Download size={16} /> Export File
              </Button>
              <Button type="button" onClick={(e) => handleGenerate(e as any, true)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Eye size={16} /> {loadingPreview ? 'Loading...' : 'Preview Report'}
              </Button>
            </div>
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

      {/* Preview Section */}
      {previewData && (
        <Card title={`${previewTitle} - Interactive Preview`} subtitle="Visualize and inspect data records before exporting.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px' }}>
            
            {/* Chart Container */}
            {chartData.length > 0 && (
              <div style={{ height: '300px', width: '100%', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '100%', maxWidth: '600px' }}>
                  {reportType === 'environmental' || reportType === 'esg_summary' ? (
                    <Bar 
                      data={getChartJsData()} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: { color: 'rgba(255,255,255,0.7)' }
                          }
                        },
                        scales: {
                          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.6)' } },
                          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.6)' } }
                        }
                      }} 
                    />
                  ) : (
                    <Doughnut 
                      data={getChartJsData()} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: { color: 'rgba(255,255,255,0.7)' }
                          }
                        }
                      }} 
                    />
                  )}
                </div>
              </div>
            )}

            {/* Table Filter Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Search size={18} color="var(--text-secondary)" />
                <input
                  type="text"
                  placeholder="Search preview records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              {/* Data Table */}
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {filteredPreviewData.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {Object.keys(filteredPreviewData[0]).map((key) => (
                          <th key={key} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#fff' }}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewData.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          {Object.values(row).map((val: any, cellIdx) => (
                            <td key={cellIdx} style={{ padding: '12px 16px' }}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No matching records found in the preview data.
                  </div>
                )}
              </div>
            </div>

          </div>
        </Card>
      )}
    </div>
  );
};
