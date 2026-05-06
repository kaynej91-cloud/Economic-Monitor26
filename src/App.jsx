import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ChartView from './components/ChartView';
import DataTable from './components/DataTable';
import { fetchIndicatorData } from './api/worldbank';
import { INDICATORS } from './constants/indicators';
import { COUNTRIES } from './constants/countries';

const DEFAULTS = {
  indicator: INDICATORS[0],
  countries: ['US', 'DE', 'JP'],
  startYear: 2000,
  endYear: 2023,
  chartType: 'line',
};

// Parse URL once on module load so useState initialisers only run once
const INIT = (() => {
  const p = new URLSearchParams(window.location.search);
  const indId = p.get('i');
  const c = p.get('c');
  const s = parseInt(p.get('s'), 10);
  const e = parseInt(p.get('e'), 10);
  const t = p.get('t');
  return {
    indicator: INDICATORS.find((i) => i.id === indId) ?? DEFAULTS.indicator,
    countries: c
      ? c.split(',').filter((code) => COUNTRIES.some((co) => co.code === code))
      : DEFAULTS.countries,
    startYear: isNaN(s) ? DEFAULTS.startYear : Math.max(1960, Math.min(2023, s)),
    endYear: isNaN(e) ? DEFAULTS.endYear : Math.max(1961, Math.min(2024, e)),
    chartType: ['line', 'bar', 'area'].includes(t) ? t : DEFAULTS.chartType,
    normalize: p.get('n') === '1',
    logScale: p.get('l') === '1',
  };
})();

export default function App() {
  const [indicator, setIndicator] = useState(INIT.indicator);
  const [selectedCountries, setSelectedCountries] = useState(INIT.countries);
  const [startYear, setStartYear] = useState(INIT.startYear);
  const [endYear, setEndYear] = useState(INIT.endYear);
  const [chartType, setChartType] = useState(INIT.chartType);
  const [normalize, setNormalize] = useState(INIT.normalize);
  const [logScale, setLogScale] = useState(INIT.logScale);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (selectedCountries.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIndicatorData(
        indicator.id,
        selectedCountries,
        startYear,
        endYear,
      );
      setData(result);
    } catch (err) {
      setError(err.message ?? 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [indicator, selectedCountries, startYear, endYear]);

  // Immediate fetch on mount; debounced auto-fetch on subsequent changes
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      fetchData();
      return;
    }
    if (selectedCountries.length === 0) return;
    const t = setTimeout(fetchData, 700);
    return () => clearTimeout(t);
  }, [fetchData]);

  // Keep URL in sync (only non-default values to stay clean)
  useEffect(() => {
    const p = new URLSearchParams();
    if (indicator.id !== DEFAULTS.indicator.id) p.set('i', indicator.id);
    if (selectedCountries.join(',') !== DEFAULTS.countries.join(','))
      p.set('c', selectedCountries.join(','));
    if (startYear !== DEFAULTS.startYear) p.set('s', String(startYear));
    if (endYear !== DEFAULTS.endYear) p.set('e', String(endYear));
    if (chartType !== DEFAULTS.chartType) p.set('t', chartType);
    if (normalize) p.set('n', '1');
    if (logScale) p.set('l', '1');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }, [indicator.id, selectedCountries, startYear, endYear, chartType, normalize, logScale]);

  // Data-coverage percentage per country (used for badges in sidebar)
  const coverageMap = useMemo(() => {
    if (!data) return {};
    const total = endYear - startYear + 1;
    return Object.fromEntries(
      Object.entries(data).map(([code, years]) => {
        const nonNull = Object.values(years).filter((v) => v !== null).length;
        return [code, Math.round((nonNull / total) * 100)];
      }),
    );
  }, [data, startYear, endYear]);

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
            <span className="header-icon">📈</span>
            <h1 className="header-title">Economic Monitor</h1>
          </div>
        </div>
        <p className="header-tagline">
          Global economic indicators · World Bank Open Data
        </p>
      </header>

      <div className="app-body">
        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          indicator={indicator}
          onIndicatorChange={setIndicator}
          selectedCountries={selectedCountries}
          onCountriesChange={setSelectedCountries}
          startYear={startYear}
          onStartYearChange={setStartYear}
          endYear={endYear}
          onEndYearChange={setEndYear}
          chartType={chartType}
          onChartTypeChange={setChartType}
          normalize={normalize}
          onNormalizeChange={setNormalize}
          logScale={logScale}
          onLogScaleChange={setLogScale}
          coverageMap={coverageMap}
          onFetch={fetchData}
          loading={loading}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="main-content">
          {error && (
            <div className="error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <ChartView
            data={data}
            indicator={indicator}
            selectedCountries={selectedCountries}
            startYear={startYear}
            endYear={endYear}
            chartType={chartType}
            normalize={normalize}
            logScale={logScale}
            loading={loading}
          />

          {data && !loading && (
            <DataTable
              data={data}
              indicator={indicator}
              selectedCountries={selectedCountries}
              startYear={startYear}
              endYear={endYear}
            />
          )}
        </main>
      </div>
    </div>
  );
}
