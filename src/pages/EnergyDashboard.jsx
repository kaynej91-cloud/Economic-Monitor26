import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleSequential } from 'd3-scale';
import { interpolateBlues } from 'd3-scale-chromatic';
import { fetchIndicatorData } from '../api/worldbank';
import { getEiaApiKey, setEiaApiKey, fetchEiaCrudeOil } from '../api/eia';
import {
  WB_INDICATORS, ELEC_SOURCES, ENERGY_COUNTRIES,
  ISO_NUM_TO_CODE, CODE_TO_NAME,
  computeSourceTWh, formatTWh, formatKbd,
} from '../constants/energyMetrics';
import './EnergyDashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
);

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const ALL_CODES = ENERGY_COUNTRIES.map(c => c.code);
const DEFAULT_SELECTED = ['US', 'CN', 'DE', 'FR', 'IN'];
const START_YEAR = 2000;
const END_YEAR = 2022;

const ELEC_PALETTE = {
  nuclear: '#3b82f6',
  hydro:   '#22c55e',
  renew:   '#f59e0b',
  fossil:  '#ef4444',
};
const COUNTRY_COLORS = ['#3b82f6','#ef4444','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#f97316','#ec4899'];

// ── World Map ──────────────────────────────────────────────────────────────

function EnergyMap({ latestData, view, selectedSources, tooltipText }) {
  const [tooltip, setTooltip] = useState(null);

  const colorScale = useMemo(() => {
    const values = Object.values(latestData).filter(v => v != null && v > 0);
    if (!values.length) return () => '#e2e8f0';
    const max = Math.max(...values);
    return scaleSequential([0, max], interpolateBlues);
  }, [latestData]);

  return (
    <div className="energy-map-wrap">
      <div className="energy-map-header">
        <span className="energy-map-title">
          {view === 'oil' ? 'Crude Oil Production' : 'Electricity Generation'} by Country
          <span className="energy-map-year"> — Latest available year</span>
        </span>
        <span className="energy-map-unit">{view === 'oil' ? 'kb/d' : 'TWh'}</span>
      </div>
      <div className="energy-map-container">
        <ComposableMap
          projectionConfig={{ scale: 147, center: [0, 10] }}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const code = ISO_NUM_TO_CODE[geo.id];
                const value = code ? latestData[code] : null;
                const fill = value != null && value > 0
                  ? colorScale(value)
                  : code ? '#cbd5e1' : '#f1f5f9';
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#fff"
                    strokeWidth={0.4}
                    style={{ default: { outline: 'none' }, hover: { outline: 'none', opacity: 0.8 } }}
                    onMouseEnter={(evt) => {
                      if (!code) return;
                      const fmt = view === 'oil' ? formatKbd(value) : formatTWh(value);
                      setTooltip({ name: CODE_TO_NAME[code] ?? code, value: fmt, x: evt.clientX, y: evt.clientY });
                    }}
                    onMouseMove={(evt) => {
                      if (!code) return;
                      setTooltip(t => t ? { ...t, x: evt.clientX, y: evt.clientY } : t);
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        {tooltip && (
          <div className="map-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}>
            <strong>{tooltip.name}</strong>
            <span>{tooltip.value}</span>
          </div>
        )}
      </div>
      <div className="energy-map-legend">
        <span>Low</span>
        <div className="map-legend-gradient" />
        <span>High</span>
      </div>
    </div>
  );
}

// ── Time-series chart ────────────────────────────────────────────────────────────

function EnergyChart({ view, years, chartData }) {
  const labels = years.map(String);

  const datasets = useMemo(() => {
    if (view === 'oil') {
      return chartData.map((s, i) => ({
        label: s.label,
        data: years.map(y => s.data[y] ?? null),
        borderColor: COUNTRY_COLORS[i % COUNTRY_COLORS.length],
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: years.length > 15 ? 0 : 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        spanGaps: false,
      }));
    }
    // Electricity: one line per (country × source)
    const ds = [];
    chartData.forEach((s, ci) => {
      Object.entries(s.sources).forEach(([srcId, vals]) => {
        const src = ELEC_SOURCES.find(e => e.id === srcId);
        if (!src) return;
        const baseColor = ELEC_PALETTE[srcId];
        ds.push({
          label: chartData.length > 1 ? `${s.label} – ${src.label}` : src.label,
          data: years.map(y => vals[y] ?? null),
          borderColor: baseColor,
          backgroundColor: 'transparent',
          tension: 0.3,
          pointRadius: years.length > 15 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          borderDash: ci > 0 ? [4, 3] : undefined,
          spanGaps: false,
        });
      });
    });
    return ds;
  }, [view, chartData, years]);

  if (!datasets.length || datasets.every(d => d.data.every(v => v == null))) {
    return (
      <div className="chart-state" style={{ height: 380 }}>
        <p>No data available for the selected options.</p>
      </div>
    );
  }

  const yLabel = view === 'oil' ? 'Production (kb/d)' : 'Generation (TWh)';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 14, font: { size: 11 }, color: '#334155' } },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(15,23,42,0.93)',
        titleFont: { size: 12, weight: '600' }, bodyFont: { size: 11 }, padding: 10,
        callbacks: {
          label: ctx => {
            const v = ctx.parsed.y;
            if (v == null) return `  ${ctx.dataset.label}: —`;
            const fmt = view === 'oil' ? formatKbd(v) : formatTWh(v);
            return `  ${ctx.dataset.label}: ${fmt}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 }, color: '#64748b', maxTicksLimit: 12 }, border: { color: '#e2e8f0' } },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: {
          font: { size: 11 }, color: '#64748b',
          callback: v => view === 'oil' ? formatKbd(v) : formatTWh(v),
        },
        title: { display: true, text: yLabel, font: { size: 11 }, color: '#94a3b8' },
        border: { color: '#e2e8f0' },
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  return (
    <div style={{ height: 380, position: 'relative' }}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function EnergyDashboard() {
  const [view, setView] = useState('electricity'); // 'electricity' | 'oil'
  const [selectedSources, setSelectedSources] = useState(['nuclear', 'hydro', 'renew', 'fossil']);
  const [selectedCountries, setSelectedCountries] = useState(DEFAULT_SELECTED);
  const [startYear, setStartYear] = useState(START_YEAR);
  const [endYear, setEndYear] = useState(END_YEAR);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // World Bank electricity data
  const [wbRaw, setWbRaw] = useState({ total: {}, pop: {}, nuclear: {}, hydro: {}, fossil: {} });
  const [wbLoading, setWbLoading] = useState(false);
  const [wbError, setWbError] = useState(null);

  // EIA crude oil data
  const [eiaKey, setEiaKeyState] = useState(getEiaApiKey());
  const [eiaKeyInput, setEiaKeyInput] = useState('');
  const [oilData, setOilData] = useState({});
  const [oilLoading, setOilLoading] = useState(false);
  const [oilError, setOilError] = useState(null);

  // ── Fetch World Bank data ───────────────────────────────────────────────────

  const fetchWb = useCallback(async () => {
    setWbLoading(true);
    setWbError(null);
    try {
      const [total, pop, nuclear, hydro, fossil] = await Promise.all([
        fetchIndicatorData(WB_INDICATORS.total,   ALL_CODES, startYear, endYear),
        fetchIndicatorData(WB_INDICATORS.pop,     ALL_CODES, startYear, endYear),
        fetchIndicatorData(WB_INDICATORS.nuclear, ALL_CODES, startYear, endYear),
        fetchIndicatorData(WB_INDICATORS.hydro,   ALL_CODES, startYear, endYear),
        fetchIndicatorData(WB_INDICATORS.fossil,  ALL_CODES, startYear, endYear),
      ]);
      setWbRaw({ total, pop, nuclear, hydro, fossil });
    } catch (err) {
      setWbError(err.message);
    } finally {
      setWbLoading(false);
    }
  }, [startYear, endYear]);

  const prevRange = useRef({ startYear, endYear });
  useEffect(() => {
    if (prevRange.current.startYear !== startYear || prevRange.current.endYear !== endYear) {
      setWbRaw({ total: {}, pop: {}, nuclear: {}, hydro: {}, fossil: {} });
      setOilData({});
      prevRange.current = { startYear, endYear };
    }
    fetchWb();
  }, [startYear, endYear, fetchWb]);

  // ── Fetch EIA crude oil ────────────────────────────────────────────────────

  useEffect(() => {
    if (!eiaKey || view !== 'oil') return;
    setOilLoading(true);
    setOilError(null);
    fetchEiaCrudeOil(ALL_CODES, startYear, endYear)
      .then(data => setOilData(data))
      .catch(err => setOilError(
        err.message === 'EIA_BAD_KEY' ? 'Invalid EIA API key' : err.message
      ))
      .finally(() => setOilLoading(false));
  }, [eiaKey, view, startYear, endYear]);

  const saveEiaKey = () => {
    if (!eiaKeyInput.trim()) return;
    setEiaApiKey(eiaKeyInput.trim());
    setEiaKeyState(eiaKeyInput.trim());
    setEiaKeyInput('');
    setOilData({});
  };

  // ── Derived data for chart ───────────────────────────────────────────────────

  const years = useMemo(() => {
    const arr = [];
    for (let y = startYear; y <= endYear; y++) arr.push(y);
    return arr;
  }, [startYear, endYear]);

  const chartData = useMemo(() => {
    if (view === 'oil') {
      return selectedCountries.map(code => ({
        label: CODE_TO_NAME[code] ?? code,
        data: oilData[code] ?? {},
      }));
    }
    return selectedCountries.map(code => {
      const sources = {};
      selectedSources.forEach(srcId => { sources[srcId] = {}; });
      years.forEach(year => {
        const tw = computeSourceTWh(wbRaw, code, year);
        if (!tw) return;
        selectedSources.forEach(srcId => {
          if (tw[srcId] != null) sources[srcId][year] = tw[srcId];
        });
      });
      return { label: CODE_TO_NAME[code] ?? code, sources };
    });
  }, [view, selectedCountries, selectedSources, years, wbRaw, oilData]);

  // Latest year data for map
  const latestMapData = useMemo(() => {
    const result = {};
    ENERGY_COUNTRIES.forEach(({ code }) => {
      if (view === 'oil') {
        const obs = oilData[code];
        if (obs) {
          const latest = Math.max(...Object.keys(obs).map(Number));
          result[code] = obs[latest];
        }
      } else {
        for (let y = endYear; y >= startYear; y--) {
          const tw = computeSourceTWh(wbRaw, code, y);
          if (tw) {
            result[code] = selectedSources.reduce((sum, srcId) => sum + (tw[srcId] ?? 0), 0);
            break;
          }
        }
      }
    });
    return result;
  }, [view, wbRaw, oilData, selectedSources, startYear, endYear]);

  const toggleSource = (id) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(s => s !== id) : prev
        : [...prev, id]
    );
  };

  const toggleCountry = (code) => {
    setSelectedCountries(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(c => c !== code) : prev
        : prev.length >= 6 ? prev : [...prev, code]
    );
  };

  const isLoading = view === 'oil' ? oilLoading : wbLoading;
  const error = view === 'oil' ? oilError : wbError;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)}
            aria-label="Toggle menu" aria-expanded={sidebarOpen}>
            <span /><span /><span />
          </button>
          <div className="header-brand">
            <span className="header-icon">⚡</span>
            <h1 className="header-title">Global Energy</h1>
          </div>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Global</Link>
          <Link to="/us" className="nav-link">US Jobs</Link>
          <Link to="/energy" className="nav-link nav-link--active">Energy</Link>
        </nav>
      </header>

      <div className="app-body">
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close">✕</button>

          {/* View */}
          <div className="sidebar-section">
            <label className="form-label">View</label>
            <div className="us-cat-tabs">
              <button className={`us-cat-tab${view === 'electricity' ? ' active' : ''}`}
                onClick={() => { setView('electricity'); setSidebarOpen(false); }}>
                ⚡ Electricity
              </button>
              <button className={`us-cat-tab${view === 'oil' ? ' active' : ''}`}
                onClick={() => { setView('oil'); setSidebarOpen(false); }}>
                🛢 Crude Oil
              </button>
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Sources (electricity only) */}
          {view === 'electricity' && (
            <>
              <div className="sidebar-section">
                <label className="form-label">Energy Sources</label>
                <div className="metric-list">
                  {ELEC_SOURCES.map(src => (
                    <label key={src.id} className="metric-item">
                      <input type="checkbox"
                        checked={selectedSources.includes(src.id)}
                        onChange={() => toggleSource(src.id)} />
                      <span className="metric-dot" style={{ background: src.color }} />
                      <span className="metric-name">{src.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="sidebar-divider" />
            </>
          )}

          {/* Countries */}
          <div className="sidebar-section">
            <label className="form-label">
              Countries
              <span className="badge">{selectedCountries.length}/6</span>
            </label>
            <div className="metric-list">
              {ENERGY_COUNTRIES.map(({ code, name }) => {
                const checked = selectedCountries.includes(code);
                const disabled = !checked && selectedCountries.length >= 6;
                return (
                  <label key={code} className={`metric-item${disabled ? ' disabled' : ''}`}>
                    <input type="checkbox" checked={checked} disabled={disabled}
                      onChange={() => toggleCountry(code)} />
                    <span className="metric-name">{name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Date range */}
          <div className="sidebar-section">
            <div className="form-group">
              <label className="form-label">Year Range</label>
              <div className="date-range">
                <div className="date-field">
                  <span className="date-field-label">From</span>
                  <input type="number" className="form-input" min="1990" max={endYear}
                    value={startYear} onChange={e => setStartYear(Number(e.target.value))} />
                </div>
                <div className="date-field">
                  <span className="date-field-label">To</span>
                  <input type="number" className="form-input" min={startYear} max="2023"
                    value={endYear} onChange={e => setEndYear(Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          {/* EIA key (crude oil only) */}
          {view === 'oil' && (
            <>
              <div className="sidebar-divider" />
              <div className="sidebar-section">
                <div className="form-group">
                  <label className="form-label">EIA API Key</label>
                  {eiaKey ? (
                    <div className="key-set-row">
                      <span className="key-set-badge">Key saved</span>
                      <button className="key-clear-btn"
                        onClick={() => { setEiaApiKey(''); setEiaKeyState(''); setOilData({}); }}>
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input type="text" className="form-input"
                        placeholder="Paste your free EIA API key"
                        value={eiaKeyInput}
                        onChange={e => setEiaKeyInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEiaKey()} />
                      <button className="fetch-btn" style={{ marginTop: 8 }}
                        onClick={saveEiaKey} disabled={!eiaKeyInput.trim()}>
                        Save Key
                      </button>
                      <p className="form-hint">Free at eia.gov/opendata</p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </aside>

        <main className="main-content">
          {/* Source banner for Oil view without key */}
          {view === 'oil' && !eiaKey && (
            <div className="us-key-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <div>
                <strong>EIA API key required for crude oil data</strong>
                <p>Enter your free key in the sidebar. Register at eia.gov/opendata</p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Chart card */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title-row">
                <div>
                  <h2 className="chart-title">
                    {view === 'oil' ? 'Crude Oil Production' : 'Electricity Generation'}
                    <span className="energy-unit-info" title={
                      view === 'oil'
                        ? 'kb/d = thousand barrels per day. 1 Mbd = 1,000 kb/d.'
                        : 'TWh = terawatt-hours (1 TWh = 1 billion kWh). PWh = 1,000 TWh. Solar/Wind/Geo are grouped as World Bank reports them combined.'
                    }> ⓘ</span>
                  </h2>
                  <p className="chart-subtitle">
                    {selectedCountries.map(c => CODE_TO_NAME[c]).join(', ')} · {startYear}–{endYear} · Source: {view === 'oil' ? 'EIA' : 'World Bank'}
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="chart-state" style={{ height: 380 }}>
                <div className="spinner" />
                <p>Fetching data…</p>
              </div>
            ) : (
              <div className="chart-container" style={{ height: 380 }}>
                <EnergyChart view={view} years={years} chartData={chartData} />
              </div>
            )}
          </div>

          {/* Choropleth map */}
          <EnergyMap
            latestData={latestMapData}
            view={view}
            selectedSources={selectedSources}
          />
        </main>
      </div>
    </div>
  );
}
