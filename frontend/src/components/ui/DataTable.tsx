import React, { useState } from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortKey?: keyof T;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder,
  searchFilter
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchQuery || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, searchQuery));
  }, [data, searchQuery, searchFilter]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const order = sortDirection === 'asc' ? 1 : -1;
      return valA < valB ? -1 * order : 1 * order;
    });
  }, [filteredData, sortKey, sortDirection]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {searchPlaceholder && searchFilter && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
      )}
      
      <div className="custom-table-container glass-panel" style={{ border: 'none', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.25)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.sortKey)}
                  style={{
                    cursor: col.sortKey ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {col.header}
                    {col.sortKey && sortKey === col.sortKey && (
                      <span style={{ fontSize: '0.65rem' }}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                  No data found
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>{col.accessor(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
