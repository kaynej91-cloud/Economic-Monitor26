import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { fetchSeries, getFredApiKey, setFredApiKey } from '../api/fred';
import {
  KPI_SERIES, VIEWS,
  applyYoY, applyMoM,
  formatKpiValue, formatAxisValue, formatTooltipValue, latestValue,
} from '../constants/jobsMetrics';
import './JobsDashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
);

const PALETTE = [
  { border: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { border: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { border: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { border: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { border: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  { border: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { border: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
];

// ── Date helpers ──────────────────────────────────────────────────────────

function toYM(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function futureYM(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return toYM(d);
}
function pastYM(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return toYM(d);
}
function monthRange(start, end) {
  const months = [];
  let [y, mo] = start.split('-').map(Number);
  const [ey, emo] = end.split('-').map(Number);
  while (y < ey || (y === ey && mo <= emo)) {
    months.push(`${y}-${String(mo).padStart(2, '0')}`);
    mo++; if (mo > 12) { mo = 1; y++; }
  }
  return months;
}
function fmtLabel(m) {
  const [y, mo] = m.split('-').map(Number);
  const abbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${abbr[mo - 1]} '${String(y).slice(2)}`;
}
function trimTrailingEmpty(months, ...obsMaps) {
  const filled = obsMaps.filter(Boolean);
  if (!filled.length) return months;
  const last = months.reduceRight((found, m) =>
    found ?? (filled.some(o => o[m] != null) ? m : null), null);
  if (!last) return months;
  return months.slice(0, months.indexOf(last) + 1);
}

// ── KPI card ──────────────────────────────────────────────────────────────

function KpiCard({ kpi, obs, loading }) {
  if (loading && !obs) return (
    <div className="kpi-card">
      <span className="kpi-label">{kpi.label}</span>
      <div className="kpi-skeleton" />
    </div>
  );

  const transformed = !obs ? null
    : kpi.transform === 'yoy' ? applyYoY(obs)
    : kpi.transform === 'mom' ? applyMoM(obs)
    : obs;
  const latest = transformed ? latestValue(transformed) : null;
  const display = latest ? formatKpiValue(latest.value, kpi) : '—';

  let trendEl = null;
  if (latest && transformed) {
    const keys = Object.keys(transformed).sort();
    const idx = keys.indexOf(latest.date);
    if (idx > 0) {
      const prev = transformed[keys[idx - 1]];
      if (prev != null) {
        const delta = latest.value - prev;
        const dir = delta > 0.005 ? 'up' : delta < -0.005 ? 'down' : 'flat';
        trendEl = (
          <span className={`kpi-trend kpi-trend--${dir}`}>
            {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '─'}
          </span>
        );
      }
    }
  }

  return (
    <div className="kpi-card">
      <span className="kpi-label">{kpi.label}</span>
      <div className="kpi-value-row">
        <span className="kpi-value">{display}</span>
        {trendEl}
      </div>
      {latest && <span className="kpi-date">{latest.date}</span>}
    </div>
  );
}

// ── Main chart ────────────────────────────────────────────────────────────

function JobsChart({ allObs, selected, view, months, chartType, showYoY, showMoM }) {
  const labels = months.map(fmtLabel);

  const datasets = selected.map((id, i) => {
    const metric = view.metrics.find(m => m.id === id);
    if (!metric || !allObs[id]) return null;
    const raw = allObs[id];
    const obs = showYoY ? applyYoY(raw) : showMoM ? applyMoM(raw) : raw;
    const color = PALETTE[i % PALETTE.length];
    return {
      label: metric.label,
      data: months.map(m => obs[m] ?? null),
      borderColor: color.border,
      backgroundColor: chartType === 'bar' ? color.border + 'bb'
        : chartType === 'area' ? color.bg : color.bg,
      fill: chartType === 'area' ? 'origin' : false,
      tension: 0.3,
      pointRadius: months.length > 80 ? 0 : months.length > 40 ? 2 : 3,
      pointHoverRadius: 5,
      borderWidth: chartType === 'bar' ? 0 : 2,
      spanGaps: false,
    };
  }).filter(Boolean);

  if (!datasets.length) return (
    <div className="chart-state" style={{ height: 440 }}>
      <p>Select at least one metric to display</p>
    </div>
  );

  const firstMetric = view.metrics.find(m => m.id === selected[0]);
  const unit = firstMetric?.unit ?? '';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: 'bottom',
        labels: { usePointStyle: true, padding: 16, font: { size: 12 }, color: '#334155' },
      },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(15,23,42,0.93)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 }, padding: 12,
        callbacks: {
          label: ctx => {
            const v = ctx.parsed.y;
            if (v == null) return `  ${ctx.dataset.label}: —`;
            const metric = view.metrics.find(m => m.label === ctx.dataset.label);
            return `  ${ctx.dataset.label}: ${formatTooltipValue(v, metric, showYoY, showMoM)}`;
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
          font: { size: 11 }, color: '#64748b',
          callback: v => formatAxisValue(v, unit, showYoY || showMoM),
        },
        title: {
          display: true,
          text: showYoY ? 'YoY Change (%)'
            : showMoM ? 'MoM Change (thousands)'
            : unit === '$' ? 'Avg Hourly Earnings ($/hr)'
            : unit === '%' ? '(%)'
            : 'Employees (thousands)',
          font: { size: 11 }, color: '#94a3b8',
        },
        border: { color: '#e2e8f0' },
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  const ChartComp = chartType === 'bar' ? Bar : Line;
  return (
    <div style={{ height: 440, position: 'relative' }}>
      <ChartComp data={{ labels, datasets }} options={options} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function JobsDashboard() {
  const [apiKey, setApiKeyState] = useState(getFredApiKey());
  const [keyInput, setKeyInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeViewId, setActiveViewId] = useState('unemployment');
  const [selected, setSelected] = useState({
    unemployment: ['UNRATE', 'U6RATE'],
    payrolls:     ['PAYEMS', 'USFIRE', 'USCONS', 'MANEMP'],
    wages:        ['CES0500000003', 'CES5500000003'],
    jolts:        ['JTSJOL', 'JTSHIL', 'JTSQUL', 'JTSLDL'],
    claims:       ['IC4WSA', 'CCSA'],
  });
  const [showYoY, setShowYoY] = useState(false);
  const [showMoM, setShowMoM] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [startDate, setStartDate] = useState('2008-01');
  const [endDate, setEndDate] = useState(futureYM(3));

  // data cache: { [seriesId]: { [YYYY-MM]: value } }
  const [allObs, setAllObs] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [kpiObs, setKpiObs] = useState({});

  const activeView = VIEWS.find(v => v.id === activeViewId);
  const activeSelected = selected[activeViewId] ?? [];

  // ── Fetch helpers ────────────────────────────────────────────────────────

  const fetchOne = useCallback(async (seriesId) => {
    if (!apiKey) return;
    if (allObs[seriesId]) return; // already loaded
    setLoading(prev => ({ ...prev, [seriesId]: true }));
    setErrors(prev => { const n = { ...prev }; delete n[seriesId]; return n; });
    try {
      const data = await fetchSeries(seriesId, `${startDate}-01`, `${futureYM(6)}-01`);
      setAllObs(prev => ({ ...prev, [seriesId]: data }));
    } catch (err) {
      const msg = err.message === 'FRED_BAD_KEY' ? 'Invalid API key'
        : err.message === 'FRED_NO_KEY' ? 'API key required'
        : err.message;
      setErrors(prev => ({ ...prev, [seriesId]: msg }));
    } finally {
      setLoading(prev => { const n = { ...prev }; delete n[seriesId]; return n; });
    }
  }, [apiKey, allObs, startDate]);

  // Fetch KPI series on mount / key change — only last 26 months (enough for YoY + MoM)
  useEffect(() => {
    if (!apiKey) return;
    KPI_SERIES.forEach(k => {
      fetchSeries(k.id, `${pastYM(26)}-01`, `${futureYM(6)}-01`)
        .then(data => setKpiObs(prev => ({ ...prev, [k.id]: data })))
        .catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Fetch series needed for the active view when selection changes
  const prevRef = useRef([]);
  useEffect(() => {
    activeSelected.forEach(id => {
      if (!allObs[id] && !loading[id]) fetchOne(id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSelected.join(','), apiKey]);

  // When date range changes, clear cache so data re-fetches
  const prevDates = useRef({ startDate, endDate });
  useEffect(() => {
    if (prevDates.current.startDate !== startDate) {
      setAllObs({});
      setKpiObs({});
      prevDates.current = { startDate, endDate };
    }
  }, [startDate, endDate]);

  // ── View / metric toggle ─────────────────────────────────────────────────

  const switchView = (id) => {
    setActiveViewId(id);
    setShowYoY(false);
    setShowMoM(false);
    const view = VIEWS.find(v => v.id === id);
    view.metrics.forEach(m => {
      if ((selected[id] ?? view.defaultSelected).includes(m.id) && !allObs[m.id]) {
        fetchOne(m.id);
      }
    });
  };

  const toggleMetric = (id) => {
    const cur = selected[activeViewId] ?? [];
    const next = cur.includes(id)
      ? cur.filter(s => s !== id)
      : cur.length >= 8 ? cur : [...cur, id];
    if (next.length === 0) return;
    setSelected(prev => ({ ...prev, [activeViewId]: next }));
    if (!allObs[id]) fetchOne(id);
  };

  const saveKey = () => {
    if (!keyInput.trim()) return;
    setFredApiKey(keyInput.trim());
    setApiKeyState(keyInput.trim());
    setKeyInput('');
    setAllObs({});
    setKpiObs({});
  };

  // ── Build chart months ───────────────────────────────────────────────────

  const allMonths = monthRange(startDate, endDate);
  const obsForActive = activeSelected.map(id => allObs[id]).filter(Boolean);
  const months = trimTrailingEmpty(allMonths, ...obsForActive);

  // Primary error (from selected series)
  const primaryError = activeSelected.map(id => errors[id]).find(Boolean);
  const anyLoading = activeSelected.some(id => loading[id]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          ><span /><span /><span /></button>
          <div className="header-brand">
            <span className="header-icon">💼</span>
            <h1 className="header-title">US Labor Market</h1>
          </div>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Global</Link>
          <Link to="/us" className="nav-link nav-link--active">US Jobs</Link>
        </nav>
      </header>

      <div className="app-body">
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close">✕</button>

          {/* View tabs */}
          <div className="sidebar-section">
            <label className="form-label">View</label>
            <div className="us-cat-tabs">
              {VIEWS.map(v => (
                <button
                  key={v.id}
                  className={`us-cat-tab${activeViewId === v.id ? ' active' : ''}`}
                  onClick={() => { switchView(v.id); setSidebarOpen(false); }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Metric selector */}
          <div className="sidebar-section">
            <label className="form-label">
              Metrics
              <span className="badge">{activeSelected.length}/8</span>
            </label>
            <div className="metric-list">
              {activeView.metrics.map(m => {
                const checked = activeSelected.includes(m.id);
                const disabled = !checked && activeSelected.length >= 8;
                return (
                  <label key={m.id} className={`metric-item${disabled ? ' disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleMetric(m.id)}
                    />
                    <span className="metric-name">{m.label}</span>
                    {loading[m.id] && <span className="metric-spinner" />}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Transforms */}
          {(activeView.yoyToggle || activeView.momToggle) && (
            <>
              <div className="sidebar-section">
                <div className="form-group options-group">
                  <label className="form-label">Display</label>
                  {activeView.yoyToggle && (
                    <label className="toggle-row">
                      <input type="checkbox" checked={showYoY}
                        onChange={e => { setShowYoY(e.target.checked); setShowMoM(false); }} />
                      <div className="toggle-text">
                        <span>Year-over-Year change</span>
                        <span className="toggle-hint">% change vs. same month prior year</span>
                      </div>
                    </label>
                  )}
                  {activeView.momToggle && (
                    <label className="toggle-row">
                      <input type="checkbox" checked={showMoM}
                        onChange={e => { setShowMoM(e.target.checked); setShowYoY(false); }} />
                      <div className="toggle-text">
                        <span>Month-over-month change</span>
                        <span className="toggle-hint">Net jobs added / lost each month</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              <div className="sidebar-divider" />
            </>
          )}

          {/* Chart type */}
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">Chart Type</label>
              <div className="chart-type-toggle">
                {['line', 'bar', 'area'].map(type => (
                  <button key={type}
                    className={`chart-type-btn${chartType === type ? ' active' : ''}`}
                    onClick={() => setChartType(type)}
                  >
                    {type === 'line' && '〜 '}{type === 'bar' && '▌ '}{type === 'area' && '◿ '}
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
                  <input type="month" className="form-input"
                    min="2000-01" max={endDate} value={startDate}
                    onChange={e => e.target.value && setStartDate(e.target.value)} />
                </div>
                <div className="date-field">
                  <span className="date-field-label">To</span>
                  <input type="month" className="form-input"
                    min={startDate} max={futureYM(18)} value={endDate}
                    onChange={e => e.target.value && setEndDate(e.target.value)} />
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
                  <button className="key-clear-btn"
                    onClick={() => { setFredApiKey(''); setApiKeyState(''); setAllObs({}); setKpiObs({}); }}>
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input type="text" className="form-input"
                    placeholder="Paste your free FRED API key"
                    value={keyInput}
                    onChange={e => setKeyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveKey()} />
                  <button className="fetch-btn" style={{ marginTop: 8 }}
                    onClick={saveKey} disabled={!keyInput.trim()}>
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div>
                <strong>FRED API key required</strong>
                <p>Enter your free key in the sidebar to load data.</p>
              </div>
            </div>
          )}

          {/* KPI grid */}
          <div className="kpi-grid">
            {KPI_SERIES.map(kpi => (
              <KpiCard key={kpi.id} kpi={kpi} obs={kpiObs[kpi.id]} loading={!kpiObs[kpi.id] && !!apiKey} />
            ))}
          </div>

          {/* Main chart card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title-row">
                <div>
                  <h2 className="chart-title">
                    {activeView.label}
                    {showYoY && <span className="chart-badge" style={{ marginLeft: 8 }}>YoY %</span>}
                    {showMoM && <span className="chart-badge" style={{ marginLeft: 8 }}>MoM Change</span>}
                  </h2>
                  <p className="chart-subtitle">
                    {startDate} – {endDate} · Source: FRED / BLS
                  </p>
                </div>
              </div>

              {primaryError && (
                <div className="missing-data-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ color: '#dc2626' }}>{primaryError}</span>
                </div>
              )}
            </div>

            {anyLoading && !obsForActive.length ? (
              <div className="chart-state" style={{ height: 440 }}>
                <div className="spinner" />
                <p>Fetching FRED data…</p>
              </div>
            ) : (
              <div className="chart-container" style={{ height: 440 }}>
                <JobsChart
                  allObs={allObs}
                  selected={activeSelected}
                  view={activeView}
                  months={months}
                  chartType={chartType}
                  showYoY={showYoY}
                  showMoM={showMoM}
                />
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
