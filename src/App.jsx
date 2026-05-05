import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChartView from './components/ChartView';
import DataTable from './components/DataTable';
import { fetchIndicatorData } from './api/worldbank';
import { INDICATORS } from './constants/indicators';

const DEFAULTS = {
  indicator: INDICATORS[0], // GDP Growth Rate
  countries: ['US', 'DE', 'JP'],
  startYear: 2000,
  endYear: 2023,
  chartType: 'line',
};

export default function App() {
  const [indicator, setIndicator] = useState(DEFAULTS.indicator);
  const [selectedCountries, setSelectedCountries] = useState(DEFAULTS.countries);
  const [startYear, setStartYear] = useState(DEFAULTS.startYear);
  const [endYear, setEndYear] = useState(DEFAULTS.endYear);
  const [chartType, setChartType] = useState(DEFAULTS.chartType);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Load default view on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">📈</span>
          <h1 className="header-title">Economic Monitor</h1>
        </div>
        <p className="header-tagline">
          Global economic indicators via World Bank Open Data
        </p>
      </header>

      <div className="app-body">
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
          onFetch={fetchData}
          loading={loading}
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
