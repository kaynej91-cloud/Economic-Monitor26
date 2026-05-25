import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { fetchSeries, getFredApiKey, setFredApiKey } from '../api/fred';
import './WageDashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
);

// ── Series definitions ────────────────────────────────────────────────────

const SERIES = [
  { id: 'CES0500000003', label: 'Wage Growth',  desc: 'Avg Hourly Earnings, All Private (SA)', color: '#3b82f6' },
  { id: 'CPILFENS',      label: 'Core CPI',      desc: 'CPI Less Food & Energy (NSA)',          color: '#ef4444' },
  { id: 'CUSR0000SACL1E',label: 'Goods CPI',     desc: 'Commodities Less Food & Energy (SA)',   color: '#f59e0b' },
  { id: 'CUSR0000SASLE', label: 'Services CPI',  desc: 'Services Less Energy Services (SA)',    color: '#22c55e' },
  { id: 'SP500',          label: 'S&P 500',       desc: 'S&P 500 Monthly Avg',                  color: '#8b5cf6' },
];

// ── Date helpers ──────────────────────────────────────────────────────────

function toYM(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function futureYM(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return toYM(d);
}
function monthRange(start, end) {
  const months = [];
  let [y, mo] = start.split('-').map(Number);
  const [ey, emo] = end.split('-').map(Number);
  while (y < ey || (y === ey && mo <= emo)) {
    months.push(`${y}-${String(mo).padStart(2, '0')}`);
    mo++;
    if (mo > 12) { mo = 1; y++; }
  }
  return months;
}
function fmtLabel(m) {
  const [y, mo] = m.split('-').map(Number);
  const abbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${abbr[mo - 1]} '${String(y).slice(2)}`;
}
function trimTrailing(months, ...obsMaps) {
  const filled = obsMaps.filter(Boolean);
  if (!filled.length) return months;
  const last = months.reduceRight((found, m) =>
    found ?? (filled.some(o => o[m] != null) ? m : null), null);
  if (!last) return months;
  return months.slice(0, months.indexOf(last) + 1);
}

// ── Transforms ───────────────────────────────────────────────────────────

function applyYoY(obs) {
  const result = {};
  Object.keys(obs).sort().forEach(k => {
    const [y, m] = k.split('-').map(Number);
    const prev = `${y - 1}-${String(m).padStart(2, '0')}`;
    if (obs[prev] != null && obs[k] != null)
      result[k] = ((obs[k] / obs[prev]) - 1) * 100;
  });
  return result;
}
function applyMoM(obs) {
  const result = {};
  const keys = Object.keys(obs).sort();
  keys.forEach((k, i) => {
    if (i === 0) return;
    const prev = keys[i - 1];
    if (obs[prev] != null && obs[k] != null)
      result[k] = ((obs[k] / obs[prev]) - 1) * 100;
  });
  return result;
}

// ── Main component ────────────────────────────────────────────────────────

export default function WageDashboard() {
  const [apiKey, setApiKeyState] = useState(getFredApiKey());
  const [keyInput, setKeyInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [mode, setMode] = useState('yoy');           // 'yoy' | 'mom'
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar' | 'area'
  const [startDate, setStartDate] = useState('2005-01');
  const [endDate, setEndDate] = useState(futureYM(3));
  const [visible, setVisible] = useState(() => new Set(SERIES.map(s => s.id)));

  const [allObs, setAllObs] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  // ── Fetch ───────────────────────────────────────────────────────────────

  const doFetch = useCallback(async (sid, start) => {
    if (!apiKey) return;
    setLoading(prev => ({ ...prev, [sid]: true }));
    setErrors(prev => { const n = { ...prev }; delete n[sid]; return n; });
    try {
      const data = await fetchSeries(sid, `${start}-01`, `${futureYM(6)}-01`);
      setAllObs(prev => ({ ...prev, [sid]: data }));
    } catch (err) {
      const msg = err.message === 'FRED_BAD_KEY' ? 'Invalid API key'
        : err.message === 'FRED_NO_KEY' ? 'API key required'
        : err.message;
      setErrors(prev => ({ ...prev, [sid]: msg }));
    } finally {
      setLoading(prev => { const n = { ...prev }; delete n[sid]; return n; });
    }
  }, [apiKey]);

  // Fetch all on mount / apiKey change
  useEffect(() => {
    if (!apiKey) return;
    setAllObs({});
    setErrors({});
    SERIES.forEach(s => doFetch(s.id, startDate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Re-fetch all when startDate changes
  const prevStart = useRef(startDate);
  useEffect(() => {
    if (!apiKey || prevStart.current === startDate) return;
    prevStart.current = startDate;
    setAllObs({});
    setErrors({});
    SERIES.forEach(s => doFetch(s.id, startDate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, apiKey]);

  // ── API key helpers ──────────────────────────────────────────────────────

  const saveKey = () => {
    if (!keyInput.trim()) return;
    setFredApiKey(keyInput.trim());
    setApiKeyState(keyInput.trim());
    setKeyInput('');
    setAllObs({});
    setErrors({});
  };

  // ── Build chart data ─────────────────────────────────────────────────────

  const allMonths = monthRange(startDate, endDate);
  const visibleObs = SERIES
    .filter(s => visible.has(s.id))
    .map(s => allObs[s.id])
    .filter(Boolean);
  const months = trimTrailing(allMonths, ...visibleObs);

  const anyLoading = SERIES.some(s => loading[s.id]);
  const hasAnyData = SERIES.some(s => allObs[s.id]);

  const primaryError = SERIES.map(s => errors[s.id]).find(Boolean);

  const datasets = SERIES
    .filter(s => visible.has(s.id) && allObs[s.id])
    .map(s => {
      const raw = allObs[s.id];
      const obs = mode === 'yoy' ? applyYoY(raw) : applyMoM(raw);
      const bgAlpha = chartType === 'bar' ? 'bb' : '1f';
      return {
        label: s.label,
        data: months.map(m => obs[m] ?? null),
        borderColor: s.color,
        backgroundColor: s.color + bgAlpha,
        fill: chartType === 'area' ? 'origin' : false,
        tension: 0.3,
        pointRadius: months.length > 80 ? 0 : months.length > 40 ? 2 : 3,
        pointHoverRadius: 5,
        borderWidth: chartType === 'bar' ? 0 : 2,
        spanGaps: false,
      };
    });

  const yAxisLabel = mode === 'yoy' ? 'YoY Change (%)' : 'MoM Change (%)';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15,23,42,0.93)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        callbacks: {
          label: ctx => {
            const v = ctx.parsed.y;
            if (v == null) return `  ${ctx.dataset.label}: —`;
            return `  ${ctx.dataset.label}: ${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 10 }, color: '#64748b', maxTicksLimit: 16, maxRotation: 0 },
        border: { color: '#e2e8f0' },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          font: { size: 11 },
          color: '#64748b',
          callback: v => `${v.toFixed(1)}%`,
        },
        title: {
          display: true,
          text: yAxisLabel,
          font: { size: 11 },
          color: '#94a3b8',
        },
        border: { color: '#e2e8f0' },
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  const ChartComp = chartType === 'bar' ? Bar : Line;

  const toggleVisible = (id) => {
    setVisible(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // keep at least one
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const modeBadge = mode === 'yoy' ? 'YoY %' : 'MoM %';

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            <span /><span /><span />
          </button>
          <div className="header-brand">
            <span className="header-icon">💰</span>
            <h1 className="header-title">Wage Growth vs Inflation</h1>
          </div>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Global</Link>
          <Link to="/us" className="nav-link">US Jobs</Link>
          <Link to="/energy" className="nav-link">Energy</Link>
          <Link to="/inflation" className="nav-link">Inflation</Link>
          <Link to="/wages" className="nav-link nav-link--active">Wages</Link>
        </nav>
      </header>

      <div className="app-body">
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close">✕</button>

          {/* Mode toggle */}
          <div className="sidebar-section">
            <label className="form-label">Mode</label>
            <div className="wg-mode-row">
              <button
                className={`sa-btn${mode === 'yoy' ? ' active' : ''}`}
                onClick={() => setMode('yoy')}
              >
                YoY %
              </button>
              <button
                className={`sa-btn${mode === 'mom' ? ' active' : ''}`}
                onClick={() => setMode('mom')}
              >
                MoM %
              </button>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Series toggles */}
          <div className="sidebar-section">
            <label className="form-label">Series</label>
            <div className="wg-series-list">
              {SERIES.map(s => (
                <div
                  key={s.id}
                  className="wg-series-item"
                  onClick={() => toggleVisible(s.id)}
                  role="checkbox"
                  aria-checked={visible.has(s.id)}
                  tabIndex={0}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleVisible(s.id)}
                >
                  <div className="wg-color-dot" style={{ background: s.color }} />
                  <div className="wg-series-info">
                    <div className="wg-series-name">{s.label}</div>
                    <div className="wg-series-desc">{s.desc}</div>
                  </div>
                  {loading[s.id] && <span className="metric-spinner" />}
                  <input
                    type="checkbox"
                    checked={visible.has(s.id)}
                    onChange={() => toggleVisible(s.id)}
                    onClick={e => e.stopPropagation()}
                    style={{ accentColor: s.color, width: 14, height: 14, flexShrink: 0 }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Chart type */}
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">Chart Type</label>
              <div className="chart-type-toggle">
                {['line', 'bar', 'area'].map(type => (
                  <button
                    key={type}
                    className={`chart-type-btn${chartType === type ? ' active' : ''}`}
                    onClick={() => setChartType(type)}
                  >
                    {type === 'line' && '〜 '}
                    {type === 'bar' && '▌ '}
                    {type === 'area' && '▿ '}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Date range */}
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <div className="date-range">
                <div className="date-field">
                  <span className="date-field-label">From</span>
                  <input
                    type="month"
                    className="form-input"
                    min="1990-01"
                    max={endDate}
                    value={startDate}
                    onChange={e => e.target.value && setStartDate(e.target.value)}
                  />
                </div>
                <div className="date-field">
                  <span className="date-field-label">To</span>
                  <input
                    type="month"
                    className="form-input"
                    min={startDate}
                    max={futureYM(18)}
                    value={endDate}
                    onChange={e => e.target.value && setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* API key */}
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">FRED API Key</label>
              {apiKey ? (
                <div className="key-set-row">
                  <span className="key-set-badge">Key saved</span>
                  <button
                    className="key-clear-btn"
                    onClick={() => {
                      setFredApiKey('');
                      setApiKeyState('');
                      setAllObs({});
                      setErrors({});
                    }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paste your free FRED API key"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveKey()}
                  />
                  <button
                    className="fetch-btn"
                    style={{ marginTop: 8 }}
                    onClick={saveKey}
                    disabled={!keyInput.trim()}
                  >
                    Save Key
                  </button>
                  <p className="form-hint">Free at fred.stlouisfed.org/docs/api/api_key.html</p>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="main-content">
          {!apiKey && (
            <div className="us-key-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <strong>FRED API key required</strong>
                <p>Enter your free key in the sidebar to load data.</p>
              </div>
            </div>
          )}

          {/* Chart card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title-row">
                <div>
                  <h2 className="chart-title">
                    Wage Growth vs Inflation
                    <span className="chart-badge" style={{ marginLeft: 8 }}>{modeBadge}</span>
                  </h2>
                  <p className="chart-subtitle">
                    {startDate} – {endDate} · Source: BLS / FRED / S&P
                  </p>
                </div>
                <div className="wg-mode-inline">
                  <button
                    className={`sa-btn${mode === 'yoy' ? ' active' : ''}`}
                    style={{ padding: '5px 12px', flex: 'none' }}
                    onClick={() => setMode('yoy')}
                  >
                    YoY %
                  </button>
                  <button
                    className={`sa-btn${mode === 'mom' ? ' active' : ''}`}
                    style={{ padding: '5px 12px', flex: 'none' }}
                    onClick={() => setMode('mom')}
                  >
                    MoM %
                  </button>
                </div>
              </div>

              {/* Inline legend */}
              <div className="wg-legend">
                {SERIES.map(s => (
                  <button
                    key={s.id}
                    className={`wg-legend-item${visible.has(s.id) ? '' : ' wg-legend-item--off'}`}
                    onClick={() => toggleVisible(s.id)}
                    title={s.desc}
                  >
                    <span className="wg-legend-dot" style={{ background: s.color }} />
                    {s.label}
                  </button>
                ))}
              </div>

              {primaryError && (
                <div className="missing-data-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span style={{ color: '#dc2626' }}>{primaryError}</span>
                </div>
              )}
            </div>

            {/* Chart body */}
            {anyLoading && !hasAnyData ? (
              <div className="wg-empty-state">
                <div className="spinner" />
                <p>Fetching FRED data…</p>
              </div>
            ) : datasets.length === 0 && apiKey ? (
              <div className="wg-empty-state">
                <p>No data available yet. Try adjusting the date range or selecting different series.</p>
              </div>
            ) : (
              <div className="wg-chart-body">
                <div style={{ height: '100%', position: 'relative' }}>
                  <ChartComp
                    data={{ labels: months.map(fmtLabel), datasets }}
                    options={chartOptions}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
