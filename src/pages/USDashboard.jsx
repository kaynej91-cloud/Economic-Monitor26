import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { fetchSeries, getFredApiKey, setFredApiKey, searchCountySeries } from '../api/fred';
import {
  KPI_SERIES,
  US_METRIC_CATEGORIES,
  findMetric,
  applyYoY,
  formatUsValue,
  formatAxisUs,
} from '../constants/usMetrics';
import { US_STATES, countiesForState } from '../constants/usGeography';
import './USDashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
);

const PALETTE = [
  { border: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { border: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { border: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
];

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

function latestValue(obs) {
  const keys = Object.keys(obs).sort();
  for (let i = keys.length - 1; i >= 0; i--) {
    if (obs[keys[i]] != null) return { date: keys[i], value: obs[keys[i]] };
  }
  return null;
}

function KpiCard({ kpi, data, loading }) {
  const metric = findMetric(kpi.id);
  let display = '—';
  let trendEl = null;

  if (!loading && data) {
    const obs = kpi.transform === 'yoy' ? applyYoY(data) : data;
    const latest = latestValue(obs);
    if (latest) {
      display = formatUsValue(latest.value, { ...metric, unit: kpi.unit, decimals: kpi.decimals });

      // MoM trend arrow
      const keys = Object.keys(obs).sort();
      const idx = keys.indexOf(latest.date);
      if (idx > 0) {
        const prev = obs[keys[idx - 1]];
        if (prev != null) {
          const delta = latest.value - prev;
          const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
          trendEl = (
            <span className={`kpi-trend kpi-trend--${dir}`}>
              {dir === 'up' ? '▲' : dir === 'down' ? '▼' : '─'} {Math.abs(delta).toFixed(kpi.decimals)}
              {kpi.unit === '%' ? 'pp' : ''}
            </span>
          );
        }
      }
    }
  }

  return (
    <div className="kpi-card">
      <span className="kpi-label">{kpi.label}</span>
      {loading ? (
        <div className="kpi-skeleton" />
      ) : (
        <>
          <span className="kpi-value">{display}</span>
          {trendEl}
          {data && <span className="kpi-date">{latestValue(kpi.transform === 'yoy' ? applyYoY(data) : data)?.date ?? ''}</span>}
        </>
      )}
    </div>
  );
}

function USTrendChart({ datasets, labels, metric, chartType, showYoY, loading }) {
  const unit = showYoY ? '%' : metric.unit;

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: datasets.length > 1, position: 'bottom',
        labels: { usePointStyle: true, padding: 16, font: { size: 12 }, color: '#334155' } },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(15,23,42,0.92)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (v == null) return `  ${ctx.dataset.label}: —`;
            const formatted = formatUsValue(v, { unit, decimals: metric.decimals });
            return `  ${ctx.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 10 }, color: '#64748b', maxTicksLimit: 18,
          autoSkip: true, maxRotation: 0 },
        border: { color: '#e2e8f0' },
      },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          font: { size: 11 }, color: '#64748b',
          callback: (v) => formatAxisUs(v, unit),
        },
        title: {
          display: true,
          text: showYoY ? 'YoY Change (%)' : (metric.unit === 'index' ? 'Index' : metric.unit),
          font: { size: 11 }, color: '#94a3b8', padding: { bottom: 8 },
        },
        border: { color: '#e2e8f0' },
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  if (loading) {
    return (
      <div className="us-chart-wrap">
        <div className="us-chart-state"><div className="spinner" /><p>Fetching FRED data…</p></div>
      </div>
    );
  }

  const ChartComp = chartType === 'bar' ? Bar : Line;
  return (
    <div className="us-chart-wrap">
      <ChartComp data={chartData} options={options} />
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

function currentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function USDashboard() {
  const [apiKey, setApiKeyState] = useState(getFredApiKey());
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');

  const [activeCategory, setActiveCategory] = useState('rates');
  const [selectedMetricId, setSelectedMetricId] = useState('FEDFUNDS');
  const [startDate, setStartDate] = useState('2015-01');
  const [endDate, setEndDate] = useState(currentYearMonth());
  const [chartType, setChartType] = useState('line');
  const [showYoY, setShowYoY] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [kpiData, setKpiData] = useState({});
  const [kpiLoading, setKpiLoading] = useState(false);

  const [mainObs, setMainObs] = useState(null);
  const [mainLoading, setMainLoading] = useState(false);
  const [mainError, setMainError] = useState(null);

  const [selectedState, setSelectedState] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [countySeriesId, setCountySeriesId] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const metric = findMetric(selectedMetricId);
  const currentCatMetrics = US_METRIC_CATEGORIES.find((c) => c.id === activeCategory)?.metrics ?? [];
  const countiesInState = selectedState ? countiesForState(selectedState) : [];

  // ── API key ────────────────────────────────────────────────────────────
  const saveKey = () => {
    if (!keyInput.trim()) return;
    setFredApiKey(keyInput.trim());
    setApiKeyState(keyInput.trim());
    setKeyInput('');
    setKeyError('');
  };

  // ── Fetch KPI data ─────────────────────────────────────────────────────
  const fetchKpis = useCallback(async () => {
    if (!apiKey) return;
    setKpiLoading(true);
    const results = {};
    await Promise.allSettled(
      KPI_SERIES.map(async (kpi) => {
        try {
          results[kpi.id] = await fetchSeries(kpi.id, '2014-01-01', `${new Date().getFullYear() + 1}-12-31`);
        } catch { /* keep empty */ }
      }),
    );
    setKpiData(results);
    setKpiLoading(false);
  }, [apiKey]);

  // ── Fetch main chart data ───────────────────────────────────────────────
  const fetchMain = useCallback(async () => {
    if (!apiKey) return;
    setMainLoading(true);
    setMainError(null);
    try {
      const obs = await fetchSeries(selectedMetricId, `${startDate}-01`, `${endDate}-01`);
      setMainObs(obs);
    } catch (err) {
      if (err.message === 'FRED_NO_KEY' || err.message === 'FRED_BAD_KEY') {
        setMainError('Invalid or missing FRED API key.');
      } else {
        setMainError(err.message);
      }
    } finally {
      setMainLoading(false);
    }
  }, [apiKey, selectedMetricId, startDate, endDate]);

  // ── Fetch geographic data ───────────────────────────────────────────────
  const fetchGeo = useCallback(async () => {
    if (!apiKey || !selectedState) return;
    setGeoLoading(true);
    setGeoError(null);
    try {
      const stateInfo = US_STATES.find((s) => s.code === selectedState);
      const [national, stateObs] = await Promise.all([
        fetchSeries('UNRATE', `${startDate}-01`, `${endDate}-01`),
        fetchSeries(stateInfo.fredSeries, `${startDate}-01`, `${endDate}-01`),
      ]);
      const result = { national, state: stateObs, county: null };

      if (selectedCounty && countySeriesId) {
        result.county = await fetchSeries(countySeriesId, `${startDate}-01`, `${endDate}-01`);
      }
      setGeoData(result);
    } catch (err) {
      setGeoError(err.message);
    } finally {
      setGeoLoading(false);
    }
  }, [apiKey, selectedState, selectedCounty, countySeriesId, startDate, endDate]);

  // ── Search for county series when county selected ──────────────────────
  useEffect(() => {
    if (!selectedCounty || !selectedState) {
      setCountySeriesId(null);
      return;
    }
    const stateInfo = US_STATES.find((s) => s.code === selectedState);
    const countyInfo = countiesForState(selectedState).find((c) => c.fips === selectedCounty);
    if (!stateInfo || !countyInfo) return;

    searchCountySeries(countyInfo.name, stateInfo.name).then((series) => {
      if (series?.id) setCountySeriesId(series.id);
      else setCountySeriesId(null);
    });
  }, [selectedCounty, selectedState]);

  // ── Auto-fetch effects ──────────────────────────────────────────────────
  const isFirstKpi = useRef(true);
  useEffect(() => {
    if (!apiKey) return;
    if (isFirstKpi.current) { isFirstKpi.current = false; fetchKpis(); return; }
    fetchKpis();
  }, [fetchKpis]);

  const isFirstMain = useRef(true);
  useEffect(() => {
    if (!apiKey) return;
    if (isFirstMain.current) { isFirstMain.current = false; fetchMain(); return; }
    const t = setTimeout(fetchMain, 600);
    return () => clearTimeout(t);
  }, [fetchMain]);

  useEffect(() => {
    if (selectedState) fetchGeo();
    else setGeoData(null);
  }, [fetchGeo, selectedState]);

  // Reset county when state changes
  const handleStateChange = (code) => {
    setSelectedState(code);
    setSelectedCounty('');
    setCountySeriesId(null);
    setGeoData(null);
  };

  // ── Build main chart data ───────────────────────────────────────────────
  const months = monthRange(startDate, endDate);
  const labels = months.map(fmtLabel);

  let displayObs = mainObs ?? {};
  if (showYoY && mainObs) displayObs = applyYoY(mainObs);
  const mainDataset = mainObs
    ? [{
        label: metric.label,
        data: months.map((m) => displayObs[m] ?? null),
        borderColor: PALETTE[0].border,
        backgroundColor: chartType === 'bar' ? PALETTE[0].border + 'cc' : PALETTE[0].bg,
        fill: chartType === 'area' ? 'origin' : false,
        tension: 0.3,
        pointRadius: months.length > 60 ? 1 : 3,
        pointHoverRadius: 5,
        borderWidth: chartType === 'bar' ? 0 : 2,
        spanGaps: false,
      }]
    : [];

  // ── Build geo chart data ────────────────────────────────────────────────
  const stateInfo = US_STATES.find((s) => s.code === selectedState);
  const countyInfo = countiesForState(selectedState).find((c) => c.fips === selectedCounty);
  const geoDatasets = [];
  if (geoData) {
    geoDatasets.push({
      label: 'National',
      data: months.map((m) => geoData.national?.[m] ?? null),
      borderColor: PALETTE[0].border, backgroundColor: PALETTE[0].bg,
      fill: false, tension: 0.3, pointRadius: months.length > 60 ? 1 : 3,
      pointHoverRadius: 5, borderWidth: 2, spanGaps: false,
    });
    if (geoData.state) geoDatasets.push({
      label: stateInfo?.name ?? selectedState,
      data: months.map((m) => geoData.state?.[m] ?? null),
      borderColor: PALETTE[1].border, backgroundColor: PALETTE[1].bg,
      fill: false, tension: 0.3, pointRadius: months.length > 60 ? 1 : 3,
      pointHoverRadius: 5, borderWidth: 2, spanGaps: false,
    });
    if (geoData.county) geoDatasets.push({
      label: countyInfo?.name ?? 'County',
      data: months.map((m) => geoData.county?.[m] ?? null),
      borderColor: PALETTE[2].border, backgroundColor: PALETTE[2].bg,
      fill: false, tension: 0.3, pointRadius: months.length > 60 ? 1 : 3,
      pointHoverRadius: 5, borderWidth: 2, spanGaps: false,
    });
  }

  const unrateMetric = findMetric('UNRATE');

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            <span /><span /><span />
          </button>
          <div className="header-brand">
            <span className="header-icon">🇺🇸</span>
            <h1 className="header-title">US Dashboard</h1>
          </div>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Global</Link>
          <Link to="/us" className="nav-link nav-link--active">US</Link>
        </nav>
      </header>

      <div className="app-body us-body">
        {/* ── Sidebar overlay ─────────────────────────────────── */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        {/* ── Controls sidebar ────────────────────────────────── */}
        <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>

          {/* Metric category tabs */}
          <div className="sidebar-section">
            <label className="form-label">Category</label>
            <div className="us-cat-tabs">
              {US_METRIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`us-cat-tab${activeCategory === cat.id ? ' active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedMetricId(cat.metrics[0].id);
                    setShowYoY(false);
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Metric selector */}
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">Metric</label>
              <select
                className="form-input"
                value={selectedMetricId}
                onChange={(e) => { setSelectedMetricId(e.target.value); setShowYoY(false); }}
              >
                {currentCatMetrics.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              <p className="form-hint">{metric.description}</p>
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
                    min="2000-01"
                    max={endDate}
                    value={startDate}
                    onChange={(e) => e.target.value && setStartDate(e.target.value)}
                  />
                </div>
                <div className="date-field">
                  <span className="date-field-label">To</span>
                  <input
                    type="month"
                    className="form-input"
                    min={startDate}
                    max={currentYearMonth()}
                    value={endDate}
                    onChange={(e) => e.target.value && setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Chart type */}
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">Chart Type</label>
              <div className="chart-type-toggle">
                {['line', 'bar', 'area'].map((type) => (
                  <button
                    key={type}
                    className={`chart-type-btn${chartType === type ? ' active' : ''}`}
                    onClick={() => setChartType(type)}
                  >
                    {type === 'line' && '〜 '}
                    {type === 'bar' && '▌ '}
                    {type === 'area' && '◿ '}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group options-group">
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={showYoY}
                  onChange={(e) => setShowYoY(e.target.checked)}
                />
                <div className="toggle-text">
                  <span>Year-over-Year change</span>
                  <span className="toggle-hint">Show % change vs. same month prior year</span>
                </div>
              </label>
            </div>
          </div>

          {/* API key */}
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">FRED API Key</label>
              {apiKey ? (
                <div className="key-set-row">
                  <span className="key-set-badge">Key saved</span>
                  <button className="key-clear-btn" onClick={() => { setFredApiKey(''); setApiKeyState(''); }}>Change</button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paste your free FRED API key"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                  />
                  <button className="fetch-btn" style={{ marginTop: 8 }} onClick={saveKey} disabled={!keyInput.trim()}>
                    Save Key
                  </button>
                  {keyError && <p className="form-hint" style={{ color: '#ef4444' }}>{keyError}</p>}
                  <p className="form-hint">
                    Free at <strong>fred.stlouisfed.org/docs/api/api_key.html</strong>
                  </p>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────── */}
        <main className="main-content us-main">

          {/* API Key Banner */}
          {!apiKey && (
            <div className="us-key-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div>
                <strong>FRED API key required</strong>
                <p>Enter your free key in the sidebar to load data. Get one at fred.stlouisfed.org/docs/api/api_key.html</p>
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="kpi-grid">
            {KPI_SERIES.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} data={kpiData[kpi.id]} loading={kpiLoading && !kpiData[kpi.id]} />
            ))}
          </div>

          {/* Main Chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title-row">
                <div>
                  <h2 className="chart-title">
                    {metric.label}
                    {showYoY && <span className="chart-badge" style={{ marginLeft: 8 }}>YoY Change</span>}
                  </h2>
                  <p className="chart-subtitle">
                    {metric.description} · {startDate} to {endDate} · Source: FRED
                  </p>
                </div>
              </div>
              {mainError && (
                <div className="missing-data-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ color: '#dc2626' }}>{mainError}</span>
                </div>
              )}
            </div>
            <USTrendChart
              datasets={mainDataset}
              labels={labels}
              metric={metric}
              chartType={chartType}
              showYoY={showYoY}
              loading={mainLoading}
            />
          </div>

          {/* Geographic Drill-Down */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title-row">
                <div>
                  <h2 className="chart-title">Geographic Drill-Down</h2>
                  <p className="chart-subtitle">
                    Monthly unemployment rate · National → State → County · Source: FRED / BLS LAUS
                  </p>
                </div>
              </div>
            </div>

            <div className="geo-controls">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">State</label>
                <select
                  className="form-input"
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  <option value="">— Select state —</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>

              {selectedState && countiesInState.length > 0 && (
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">County</label>
                  <select
                    className="form-input"
                    value={selectedCounty}
                    onChange={(e) => setSelectedCounty(e.target.value)}
                  >
                    <option value="">— State only —</option>
                    {countiesInState.map((c) => (
                      <option key={c.fips} value={c.fips}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!selectedState ? (
              <div className="us-chart-wrap chart-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <p>Select a state to see unemployment vs. national average</p>
              </div>
            ) : geoError ? (
              <div className="us-chart-wrap chart-state">
                <p style={{ color: '#dc2626' }}>{geoError}</p>
              </div>
            ) : (
              <>
                {selectedCounty && !countySeriesId && !geoLoading && (
                  <div className="missing-data-notice">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>County-level data not found in FRED for this county. Showing state vs. national.</span>
                  </div>
                )}
                <USTrendChart
                  datasets={geoDatasets}
                  labels={labels}
                  metric={unrateMetric}
                  chartType="line"
                  showYoY={false}
                  loading={geoLoading}
                />
              </>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
