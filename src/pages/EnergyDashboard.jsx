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

// ── World Map ───────────────────────────────────────────────────────────

function EnergyMap({ latestData, view, selectedSources, tooltipText }) {
  const [tooltip, setTooltip] = useState(null);

  const colorScale = useMemo(() => {
    const values = Object.values(latestData).filter(v => v != null && v > 0);
    if (!values.length) return () => '#e2e8f0';
    const max = Math.max(...values);
    return scaleSequential([0, max], interpolateBlues);
  }, [latestData]);

  return (
    <div className="energy-map-container" style={{ position: 'relative' }}>
      <ComposableMap projectionConfig={{ scale: 140 }} style={{ width: '100%', height: '100%' }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const isoCode = ISO_NUM_TO_CODE[geo.id];
              const value = isoCode ? latestData[isoCode] : null;
              const fill = value != null && value > 0 ? colorScale(value) : '#e2e8f0';
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#fff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', opacity: 0.8, cursor: isoCode ? 'pointer' : 'default' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseMove={e => {
                    if (!isoCode) return;
                    const name = CODE_TO_NAME[isoCode] ?? isoCode;
                    const fmt = view === 'oil'
                      ? (value != null ? formatKbd(value) : 'No data')
                      : (value != null ? formatTWh(value) : 'No data');
                    setTooltip({ x: e.clientX + 12, y: e.clientY - 28, text: `${name}: ${fmt}` });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div className="map-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}

      <div className="map-legend">
        <span className="map-legend-label">Low</span>
        <div className="map-legend-gradient" />
        <span className="map-legend-label">High</span>
      </div>
    </div>
  );
}

// ── Electricity chart ──────────────────────────────────────────────────────

function ElecChart({ wbData, selectedCountries, selectedSources, bySource, focusCountry, years, chartType }) {
  const labels = years.map(String);

  let datasets;
  if (bySource) {
    const country = focusCountry ?? selectedCountries[0];
    datasets = ELEC_SOURCES
      .filter(s => selectedSources.includes(s.id))
      .map(src => ({
        label: src.label,
        data: years.map(y => {
          const twh = computeSourceTWh(wbData, country, y);
          return twh?.[src.id] ?? null;
        }),
        borderColor: ELEC_PALETTE[src.id] ?? '#94a3b8',
        backgroundColor: (ELEC_PALETTE[src.id] ?? '#94a3b8') + '22',
        fill: false, tension: 0.3,
        pointRadius: 3, pointHoverRadius: 5, borderWidth: 2,
      }));
  } else {
    datasets = selectedCountries.map((code, i) => {
      const name = CODE_TO_NAME[code] ?? code;
      const color = COUNTRY_COLORS[i % COUNTRY_COLORS.length];
      return {
        label: name,
        data: years.map(y => {
          const twh = computeSourceTWh(wbData, code, y);
          if (!twh) return null;
          return selectedSources.reduce((sum, src) => sum + (twh[src] ?? 0), 0);
        }),
        borderColor: color,
        backgroundColor: color + '22',
        fill: false, tension: 0.3,
        pointRadius: 3, pointHoverRadius: 5, borderWidth: 2,
      };
    });
  }

  if (!datasets.some(d => d.data.some(v => v != null))) return (
    <div className="chart-state" style={{ height: 380 }}>
      <p>No electricity data available for selection</p>
    </div>
  );

  const options = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 14, font: { size: 12 }, color: '#334155' } },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(15,23,42,0.93)',
        callbacks: { label: ctx => ctx.parsed.y != null ? `  ${ctx.dataset.label}: ${formatTWh(ctx.parsed.y)}` : null },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#64748b' }, border: { color: '#e2e8f0' } },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: v => formatTWh(v) },
        title: { display: true, text: 'Electricity Generation (TWh)', font: { size: 11 }, color: '#94a3b8' },
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

// ── Oil chart ───────────────────────────────────────────────────────────────

function OilChart({ oilData, selectedCountries, years }) {
  const labels = years.map(String);
  const datasets = selectedCountries.map((code, i) => {
    const name = CODE_TO_NAME[code] ?? code;
    const color = COUNTRY_COLORS[i % COUNTRY_COLORS.length];
    return {
      label: name,
      data: years.map(y => oilData[code]?.[y] ?? null),
      borderColor: color,
      backgroundColor: color + '22',
      fill: false, tension: 0.3,
      pointRadius: 3, pointHoverRadius: 5, borderWidth: 2,
    };
  });

  if (!datasets.some(d => d.data.some(v => v != null))) return (
    <div className="chart-state" style={{ height: 380 }}>
      <p>No crude oil data available — enter an EIA API key below</p>
    </div>
  );

  const options = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 200 },
    plugins: {
      legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 14, font: { size: 12 }, color: '#334155' } },
      tooltip: {
        mode: 'index', intersect: false,
        backgroundColor: 'rgba(15,23,42,0.93)',
        callbacks: { label: ctx => ctx.parsed.y != null ? `  ${ctx.dataset.label}: ${formatKbd(ctx.parsed.y)}` : null },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#64748b' }, border: { color: '#e2e8f0' } },
      y: {
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, color: '#64748b', callback: v => formatKbd(v) },
        title: { display: true, text: 'Crude Oil Production (kb/d)', font: { size: 11 }, color: '#94a3b8' },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState('electricity'); // 'electricity' | 'oil'
  const [selectedCountries, setSelectedCountries] = useState(DEFAULT_SELECTED);
  const [selectedSources, setSelectedSources] = useState(ELEC_SOURCES.map(s => s.id));
  const [bySource, setBySource] = useState(false);
  const [focusCountry, setFocusCountry] = useState('US');
  const [startYear, setStartYear] = useState(START_YEAR);
  const [endYear, setEndYear] = useState(END_YEAR);

  const [wbData, setWbData] = useState({});
  const [wbLoading, setWbLoading] = useState(false);
  const [wbError, setWbError] = useState(null);

  const [oilData, setOilData] = useState({});
  const [oilLoading, setOilLoading] = useState(false);
  const [oilError, setOilError] = useState(null);

  const [eiaKey, setEiaKeyState] = useState(getEiaApiKey());
  const [eiaKeyInput, setEiaKeyInput] = useState('');

  const years = useMemo(() => {
    const arr = [];
    for (let y = startYear; y <= endYear; y++) arr.push(y);
    return arr;
  }, [startYear, endYear]);

  // Latest year with any data — for the choropleth
  const latestYear = useMemo(() => {
    for (let y = endYear; y >= startYear; y--) {
      const hasData = ENERGY_COUNTRIES.some(c => {
        if (view === 'oil') return oilData[c.code]?.[y] != null;
        const twh = computeSourceTWh(wbData, c.code, y);
        return twh && selectedSources.some(s => (twh[s] ?? 0) > 0);
      });
      if (hasData) return y;
    }
    return endYear;
  }, [wbData, oilData, view, selectedSources, startYear, endYear]);

  const latestMapData = useMemo(() => {
    return Object.fromEntries(ENERGY_COUNTRIES.map(c => {
      if (view === 'oil') {
        return [c.code, oilData[c.code]?.[latestYear] ?? null];
      }
      const twh = computeSourceTWh(wbData, c.code, latestYear);
      const val = twh ? selectedSources.reduce((s, src) => s + (twh[src] ?? 0), 0) : null;
      return [c.code, val];
    }));
  }, [wbData, oilData, view, selectedSources, latestYear]);

  // ── Fetch World Bank electricity data ────────────────────────────────────────

  const fetchWb = useCallback(async () => {
    setWbLoading(true); setWbError(null);
    try {
      const codes = ALL_CODES.join(';');
      const results = await Promise.all(
        Object.entries(WB_INDICATORS).map(([key, indId]) =>
          fetchIndicatorData(indId, ALL_CODES, startYear, endYear)
            .then(data => [key, data])
        )
      );
      const raw = Object.fromEntries(results);
      setWbData(raw);
    } catch (e) {
      setWbError(e.message);
    } finally {
      setWbLoading(false);
    }
  }, [startYear, endYear]);

  useEffect(() => { fetchWb(); }, [fetchWb]);

  // ── Fetch EIA crude oil data ──────────────────────────────────────────────

  const fetchOil = useCallback(async () => {
    if (!eiaKey) return;
    setOilLoading(true); setOilError(null);
    try {
      const data = await fetchEiaCrudeOil(ALL_CODES, startYear, endYear);
      setOilData(data);
    } catch (e) {
      setOilError(e.message);
    } finally {
      setOilLoading(false);
    }
  }, [eiaKey, startYear, endYear]);

  useEffect(() => { if (eiaKey) fetchOil(); }, [fetchOil, eiaKey]);

  const saveEiaKey = () => {
    if (!eiaKeyInput.trim()) return;
    setEiaApiKey(eiaKeyInput.trim());
    setEiaKeyState(eiaKeyInput.trim());
    setEiaKeyInput('');
  };

  const toggleCountry = (code) => {
    setSelectedCountries(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(c => c !== code) : prev
        : prev.length < 6 ? [...prev, code] : prev
    );
  };

  const toggleSource = (id) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(s => s !== id) : prev
        : [...prev, id]
    );
  };

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
          <Link to="/inflation" className="nav-link">Inflation</Link>
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

          {/* View */}
          <div className="sidebar-section">
            <label className="form-label">View</label>
            <div className="us-cat-tabs">
              <button className={`us-cat-tab${view === 'electricity' ? ' active' : ''}`}
                onClick={() => setView('electricity')}>⚡ Electricity Generation</button>
              <button className={`us-cat-tab${view === 'oil' ? ' active' : ''}`}
                onClick={() => setView('oil')}>🛢 Crude Oil Production</button>
            </div>
          </div>

          {view === 'electricity' && (
            <>
              <div className="sidebar-divider" />
              <div className="sidebar-section">
                <label className="form-label">Sources</label>
                <div className="metric-list">
                  {ELEC_SOURCES.map(src => (
                    <label key={src.id} className="metric-item">
                      <input type="checkbox" checked={selectedSources.includes(src.id)}
                        onChange={() => toggleSource(src.id)} />
                      <span className="metric-dot" style={{ background: src.color }} />
                      <span className="metric-name">{src.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sidebar-divider" />
              <div className="sidebar-section">
                <label className="form-label">Chart mode</label>
                <div className="us-cat-tabs">
                  <button className={`us-cat-tab${!bySource ? ' active' : ''}`}
                    onClick={() => setBySource(false)}>By country (sources summed)</button>
                  <button className={`us-cat-tab${bySource ? ' active' : ''}`}
                    onClick={() => setBySource(true)}>By source (one country)</button>
                </div>
                {bySource && (
                  <select className="form-select" style={{ marginTop: 8 }}
                    value={focusCountry} onChange={e => setFocusCountry(e.target.value)}>
                    {ENERGY_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                )}
              </div>
            </>
          )}

          <div className="sidebar-divider" />

          {/* Country selector */}
          <div className="sidebar-section">
            <label className="form-label">
              Countries
              <span className="badge">{selectedCountries.length}/6</span>
            </label>
            <div className="metric-list">
              {ENERGY_COUNTRIES.map(c => {
                const checked = selectedCountries.includes(c.code);
                const disabled = !checked && selectedCountries.length >= 6;
                return (
                  <label key={c.code} className={`metric-item${disabled ? ' disabled' : ''}`}>
                    <input type="checkbox" checked={checked} disabled={disabled}
                      onChange={() => toggleCountry(c.code)} />
                    <span className="metric-name">{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="sidebar-divider" />

          {/* Year range */}
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
                      <p className="form-hint">Free at eia.gov/opendata/</p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="main-content">

          {/* Map */}
          <div className="chart-card" style={{ marginBottom: 20 }}>
            <div className="chart-card-header">
              <div>
                <h2 className="chart-title">
                  {view === 'electricity' ? 'Electricity Generation by Country' : 'Crude Oil Production by Country'}
                  <span className="chart-badge" style={{ marginLeft: 8 }}>Latest: {latestYear}</span>
                </h2>
                <p className="chart-subtitle">
                  {view === 'electricity'
                    ? `Sum of selected sources · TWh = terawatt-hours (1 TWh = 1 billion kWh) · Source: World Bank`
                    : `kb/d = thousand barrels per day · Source: EIA`}
                </p>
              </div>
            </div>
            {wbLoading && view === 'electricity' ? (
              <div className="chart-state" style={{ height: 340 }}>
                <div className="spinner" /><p>Loading World Bank data…</p>
              </div>
            ) : wbError ? (
              <div className="chart-state" style={{ height: 340 }}>
                <p style={{ color: '#ef4444' }}>Error: {wbError}</p>
              </div>
            ) : (
              <EnergyMap latestData={latestMapData} view={view} />
            )}
          </div>

          {/* Chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <h2 className="chart-title">
                  {view === 'electricity' ? 'Electricity Generation Over Time' : 'Crude Oil Production Over Time'}
                </h2>
                <p className="chart-subtitle">{startYear} – {endYear} · {view === 'electricity' ? 'Source: World Bank' : 'Source: EIA'}</p>
              </div>
              {oilError && view === 'oil' && (
                <div className="missing-data-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                  <span style={{ color: '#dc2626' }}>{oilError}</span>
                </div>
              )}
            </div>

            {view === 'electricity' ? (
              wbLoading ? (
                <div className="chart-state" style={{ height: 380 }}>
                  <div className="spinner" /><p>Loading…</p>
                </div>
              ) : (
                <ElecChart
                  wbData={wbData}
                  selectedCountries={selectedCountries}
                  selectedSources={selectedSources}
                  bySource={bySource}
                  focusCountry={focusCountry}
                  years={years}
                  chartType="line"
                />
              )
            ) : (
              oilLoading ? (
                <div className="chart-state" style={{ height: 380 }}>
                  <div className="spinner" /><p>Loading EIA data…</p>
                </div>
              ) : (
                <OilChart
                  oilData={oilData}
                  selectedCountries={selectedCountries}
                  years={years}
                />
              )
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
