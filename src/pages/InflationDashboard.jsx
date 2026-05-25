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
  CPI_CATEGORIES, CPI_GROUPS, KPI_CATEGORIES, DEFAULT_SELECTED, DISPLAY_MODES,
  applyMoM, applyYoY, applyCumulative, latestValue, seriesId,
} from '../constants/inflationMetrics';
import './InflationDashboard.css';

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

function toYM(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function futureYM(months) {
  const d = new Date(); d.setMonth(d.getMonth() + months); return toYM(d);
}
function pastYM(months) {
  const d = new Date(); d.setMonth(d.getMonth() - months); return toYM(d);
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

function findCat(id) { return CPI_CATEGORIES.find(c => c.id === id); }

// ── KPI card ───────────────────────────────────────────────────────────────

function KpiCard({ catId, adjustment, kpiObs, loading }) {
  const cat = findCat(catId);
  const sid = seriesId(cat, adjustment);
  const raw = kpiObs[sid];
  const label = KPI_CATEGORIES.find(k => k.id === catId)?.label ?? cat.label;

  if (loading && !raw) return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <div className="kpi-skeleton" />
      <span className="kpi-date">YoY %</span>
    </div>
  );

  const yoyObs = raw ? applyYoY(raw) : null;
  const latest = yoyObs ? latestValue(yoyObs) : null;

  let trendEl = null;
  if (latest && yoyObs) {
    const keys = Object.keys(yoyObs).sort();
    const idx = keys.indexOf(latest.date);
    if (idx > 0) {
      const prev = yoyObs[keys[idx - 1]];
      if (prev != null) {
        const delta = latest.value - prev;
        const dir = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
        trendEl = (
          <span className={`kpi-trend kpi-trend--${dir}`}>
            {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '—'}
          </span>
        );
      }
    }
  }

  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <div className="kpi-value-row">
        <span className="kpi-value">{latest ? `${latest.value.toFixed(1)}%` : '—'}</span>
        {trendEl}
      </div>
      {latest
        ? <span className="kpi-date">{latest.date} · YoY</span>
        : <span className="kpi-date">YoY %</span>}
    </div>
  );
}

// ── Inflation chart ────────────────────────────────────────────────────────────

function InflationChart({ allObs, selected, adjustment, displayMode, refDate, months, chartType }) {
  const datasets = selected.map((catId, i) => {
    const cat = findCat(catId);
    if (!cat) return null;
    const sid = seriesId(cat, adjustment);
    const raw = allObs[sid];
    if (!raw) return null;

    let obs;
    if (displayMode === 'mom')        obs = applyMoM(raw);
    else if (displayMode === 'yoy')   obs = applyYoY(raw);
    else if (displayMode === 'cumulative') obs = applyCumulative(raw, refDate);
    else                              obs = raw;

    const color = PALETTE[i % PALETTE.length];
    return {
      label: cat.label,
      data: months.map(m => obs[m] ?? null),
      borderColor: color.border,
      backgroundColor: chartType === 'bar' ? color.border + 'bb' : color.bg,
      fill: chartType === 'area' ? 'origin' : false,
      tension: 0.3,
      pointRadius: months.length > 80 ? 0 : months.length > 40 ? 2 : 3,
      pointHoverRadius: 5,
      borderWidth: chartType === 'bar' ? 0 : 2,
      spanGaps: false,
    };
  }).filter(Boolean);

  if (!datasets.length) return (
    <div className="chart-state">
      <p>Select at least one category to display</p>
    </div>
  );

  const isPercent = displayMode !== 'level';
  const yAxisLabel =
    displayMode === 'yoy'        ? 'YoY Change (%)' :
    displayMode === 'mom'        ? 'MoM Change (%)' :
    displayMode === 'cumulative' ? `Cumulative Change from ${refDate} (%)` :
                                   'CPI Index (1982–84 = 100)';

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
            const fmt = isPercent
              ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
              : v.toFixed(1);
            return `  ${ctx.dataset.label}: ${fmt}`;
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
          callback: v => isPercent ? `${v.toFixed(1)}%` : v.toFixed(0),
        },
        title: {
          display: true, text: yAxisLabel,
          font: { size: 11 }, color: '#94a3b8',
        },
        border: { color: '#e2e8f0' },
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  const ChartComp = chartType === 'bar' ? Bar : Line;
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <ChartComp data={{ labels: months.map(fmtLabel), datasets }} options={options} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function InflationDashboard() {
  const [apiKey, setApiKeyState] = useState(getFredApiKey());
  const [keyInput, setKeyInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [displayMode, setDisplayMode] = useState('yoy');
  const [adjustment, setAdjustment] = useState('sa');
  const [refDate, setRefDate] = useState('2020-01');
  const [selected, setSelected] = useState(DEFAULT_SELECTED);
  const [chartType, setChartType] = useState('line');
  const [startDate, setStartDate] = useState('2000-01');
  const [endDate, setEndDate] = useState(futureYM(3));

  const [allObs, setAllObs] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [kpiObs, setKpiObs] = useState({});

  // ── Fetch helpers ──────────────────────────────────────────────────────

  const fetchOne = useCallback(async (sid) => {
    if (!apiKey) return;
    if (allObs[sid]) return;
    setLoading(prev => ({ ...prev, [sid]: true }));
    setErrors(prev => { const n = { ...prev }; delete n[sid]; return n; });
    try {
      const data = await fetchSeries(sid, `${startDate}-01`, `${futureYM(6)}-01`);
      setAllObs(prev => ({ ...prev, [sid]: data }));
    } catch (err) {
      const msg = err.message === 'FRED_BAD_KEY' ? 'Invalid API key'
        : err.message === 'FRED_NO_KEY' ? 'API key required'
        : err.message;
      setErrors(prev => ({ ...prev, [sid]: msg }));
    } finally {
      setLoading(prev => { const n = { ...prev }; delete n[sid]; return n; });
    }
  }, [apiKey, allObs, startDate]);

  // Fetch KPI series (last 26 months, enough for YoY)
  useEffect(() => {
    if (!apiKey) return;
    KPI_CATEGORIES.forEach(k => {
      const cat = findCat(k.id);
      const sid = seriesId(cat, adjustment);
      fetchSeries(sid, `${pastYM(26)}-01`, `${futureYM(6)}-01`)
        .then(data => setKpiObs(prev => ({ ...prev, [sid]: data })))
        .catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, adjustment]);

  // Fetch selected series when selection or adjustment changes
  useEffect(() => {
    selected.forEach(catId => {
      const cat = findCat(catId);
      if (!cat) return;
      const sid = seriesId(cat, adjustment);
      if (!allObs[sid] && !loading[sid]) fetchOne(sid);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.join(','), adjustment, apiKey]);

  // Clear cache when start date changes
  const prevStart = useRef(startDate);
  useEffect(() => {
    if (prevStart.current !== startDate) {
      setAllObs({});
      setKpiObs({});
      prevStart.current = startDate;
    }
  }, [startDate]);

  // ── Category toggle ──────────────────────────────────────────────────────

  const toggleCategory = (catId) => {
    setSelected(prev => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== catId);
      }
      if (prev.length >= 8) return prev;
      const cat = findCat(catId);
      const sid = seriesId(cat, adjustment);
      if (!allObs[sid]) fetchOne(sid);
      return [...prev, catId];
    });
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
  const selectedObs = selected
    .map(id => { const cat = findCat(id); return cat ? allObs[seriesId(cat, adjustment)] : null; })
    .filter(Boolean);
  const months = trimTrailingEmpty(allMonths, ...selectedObs);

  const anyLoading = selected.some(id => {
    const cat = findCat(id);
    return cat && loading[seriesId(cat, adjustment)];
  });
  const primaryError = selected
    .map(id => { const cat = findCat(id); return cat ? errors[seriesId(cat, adjustment)] : null; })
    .find(Boolean);

  const modeBadge = DISPLAY_MODES.find(m => m.id === displayMode)?.label ?? '';

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle menu" aria-expanded={sidebarOpen}>
            <span /><span /><span />
          </button>
          <div className="header-brand">
            <span className="header-icon">📊</span>
            <h1 className="header-title">US Inflation (CPI)</h1>
          </div>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Global</Link>
          <Link to="/us" className="nav-link">US Jobs</Link>
          <Link to="/energy" className="nav-link">Energy</Link>
          <Link to="/inflation" className="nav-link nav-link--active">Inflation</Link>
          <Link to="/wages" className="nav-link">Wages</Link>
        </nav>
      </header>

      <div className="app-body">
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close">✕</button>

          {/* Display mode */}
          <div className="sidebar-section">
            <label className="form-label">Display Mode</label>
            <div className="us-cat-tabs">
              {DISPLAY_MODES.map(m => (
                <button key={m.id}
                  className={`us-cat-tab infl-mode-tab${displayMode === m.id ? ' active' : ''}`}
                  onClick={() => setDisplayMode(m.id)}>
                  <span className="tab-mode-label">{m.label}</span>
                  <span className="tab-hint">{m.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reference date — cumulative mode only */}
          {displayMode === 'cumulative' && (
            <>
              <div className="sidebar-divider" />
              <div className="sidebar-section">
                <div className="form-group">
                  <label className="form-label">Reference Date</label>
                  <input type="month" className="form-input"
                    min={startDate} max={endDate} value={refDate}
                    onChange={e => e.target.value && setRefDate(e.target.value)} />
                  <p className="form-hint">Cumulative % is measured from this month (= 0%)</p>
                </div>
              </div>
            </>
          )}

          <div className="sidebar-divider" />

          {/* SA / NSA toggle */}
          <div className="sidebar-section">
            <label className="form-label">Seasonal Adjustment</label>
            <div className="sa-toggle-row">
              <button className={`sa-btn${adjustment === 'sa' ? ' active' : ''}`}
                onClick={() => setAdjustment('sa')}>SA</button>
              <button className={`sa-btn${adjustment === 'nsa' ? ' active' : ''}`}
                onClick={() => setAdjustment('nsa')}>NSA</button>
            </div>
            <p className="form-hint">
              {adjustment === 'sa'
                ? 'Seasonally adjusted — removes recurring seasonal patterns'
                : 'Not seasonally adjusted — raw reported values'}
            </p>
          </div>

          <div className="sidebar-divider" />

          {/* Categories */}
          <div className="sidebar-section">
            <label className="form-label">
              Categories
              <span className="badge">{selected.length}/8</span>
            </label>
            <div className="metric-list">
              {CPI_GROUPS.map(group => {
                const cats = CPI_CATEGORIES.filter(c => c.group === group.id);
                return (
                  <div key={group.id} className="cat-group">
                    <div className="cat-group-label">{group.label}</div>
                    {cats.map(cat => {
                      const checked = selected.includes(cat.id);
                      const disabled = !checked && selected.length >= 8;
                      const sid = seriesId(cat, adjustment);
                      return (
                        <label key={cat.id} className={`metric-item${disabled ? ' disabled' : ''}`}>
                          <input type="checkbox" checked={checked} disabled={disabled}
                            onChange={() => toggleCategory(cat.id)} />
                          <span className="metric-name">{cat.label}</span>
                          {loading[sid] && <span className="metric-spinner" />}
                        </label>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Chart type */}
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">Chart Type</label>
              <div className="chart-type-toggle">
                {['line', 'bar', 'area'].map(type => (
                  <button key={type}
                    className={`chart-type-btn${chartType === type ? ' active' : ''}`}
                    onClick={() => setChartType(type)}>
                    {type === 'line' && '〜 '}{type === 'bar' && '▌ '}{type === 'area' && '▿ '}
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
                    min="1947-01" max={endDate} value={startDate}
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
            {KPI_CATEGORIES.map(k => (
              <KpiCard key={k.id}
                catId={k.id}
                adjustment={adjustment}
                kpiObs={kpiObs}
                loading={!kpiObs[seriesId(findCat(k.id), adjustment)] && !!apiKey} />
            ))}
          </div>

          {/* Chart card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title-row">
                <div>
                  <h2 className="chart-title">
                    Consumer Price Index (CPI)
                    <span className="chart-badge" style={{ marginLeft: 8 }}>{modeBadge}</span>
                    <span className="chart-badge" style={{
                      marginLeft: 4,
                      background: adjustment === 'sa' ? '#f0fdf4' : '#fef3c7',
                      color: adjustment === 'sa' ? '#15803d' : '#92400e',
                      borderColor: adjustment === 'sa' ? '#bbf7d0' : '#fcd34d',
                    }}>
                      {adjustment.toUpperCase()}
                    </span>
                  </h2>
                  <p className="chart-subtitle">
                    {startDate} – {endDate} · Source: BLS / FRED
                    {displayMode === 'cumulative' && ` · Reference: ${refDate}`}
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

            {anyLoading && !selectedObs.length ? (
              <div className="chart-state">
                <div className="spinner" />
                <p>Fetching FRED data…</p>
              </div>
            ) : (
              <div className="chart-container">
                <InflationChart
                  allObs={allObs}
                  selected={selected}
                  adjustment={adjustment}
                  displayMode={displayMode}
                  refDate={refDate}
                  months={months}
                  chartType={chartType}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
