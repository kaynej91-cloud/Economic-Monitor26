import { COUNTRIES } from '../constants/countries';
import { formatValue } from '../utils/format';

export default function DataTable({ data, indicator, selectedCountries, startYear, endYear }) {
  const years = [];
  for (let y = endYear; y >= startYear; y--) years.push(y);

  const cols = selectedCountries.map((code) => ({
    code,
    name: COUNTRIES.find((c) => c.code === code)?.name ?? code,
  }));

  const downloadCSV = () => {
    const header = ['Year', ...cols.map((c) => c.name)].join(',');
    const rows = years.map((year) => {
      const cells = [
        year,
        ...selectedCountries.map((code) => {
          const raw = data[code]?.[year];
          return raw !== null && raw !== undefined ? raw : '';
        }),
      ];
      return cells.join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicator.label.replace(/\s+/g, '_')}_${startYear}-${endYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="table-card">
      <div className="table-card-header">
        <h3 className="table-title">Data Table</h3>
        <button className="download-btn" onClick={downloadCSV} title="Download as CSV">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download CSV
        </button>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Year</th>
              {cols.map(({ code, name }) => (
                <th key={code}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <td className="year-cell">{year}</td>
                {selectedCountries.map((code) => {
                  const raw = data[code]?.[year] ?? null;
                  return (
                    <td key={code} className={raw === null ? 'null-cell' : ''}>
                      {formatValue(raw, indicator.format)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
