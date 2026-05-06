import { useState } from 'react';
import { INDICATORS } from '../constants/indicators';
import { COUNTRIES } from '../constants/countries';

const MAX_COUNTRIES = 8;

export default function Sidebar({
  indicator,
  onIndicatorChange,
  selectedCountries,
  onCountriesChange,
  startYear,
  onStartYearChange,
  endYear,
  onEndYearChange,
  chartType,
  onChartTypeChange,
  onFetch,
  loading,
  isOpen,
  onClose,
}) {
  const [search, setSearch] = useState('');

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleCountry = (code) => {
    if (selectedCountries.includes(code)) {
      onCountriesChange(selectedCountries.filter((c) => c !== code));
    } else if (selectedCountries.length < MAX_COUNTRIES) {
      onCountriesChange([...selectedCountries, code]);
    }
  };

  const handleStartYear = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val < endYear) onStartYearChange(val);
  };

  const handleEndYear = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > startYear) onEndYearChange(val);
  };

  return (
    <aside className={`sidebar${isOpen ? ' is-open' : ''}`}>
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
      <div className="sidebar-section">
        <div className="form-group">
          <label className="form-label">Indicator</label>
          <select
            className="form-select"
            value={indicator.id}
            onChange={(e) =>
              onIndicatorChange(INDICATORS.find((i) => i.id === e.target.value))
            }
          >
            {INDICATORS.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.label}
              </option>
            ))}
          </select>
          <p className="form-hint">{indicator.description}</p>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="form-group">
          <label className="form-label">
            Countries
            <span className="badge">
              {selectedCountries.length}/{MAX_COUNTRIES}
            </span>
          </label>
          <input
            type="text"
            className="country-search"
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="country-list">
            {filteredCountries.map((country) => {
              const checked = selectedCountries.includes(country.code);
              const disabled = !checked && selectedCountries.length >= MAX_COUNTRIES;
              return (
                <label
                  key={country.code}
                  className={`country-item ${disabled ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleCountry(country.code)}
                  />
                  <span className="country-name">{country.name}</span>
                  <span className="country-code">{country.code}</span>
                </label>
              );
            })}
            {filteredCountries.length === 0 && (
              <p className="no-results">No countries match "{search}"</p>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="form-group">
          <label className="form-label">Date Range</label>
          <div className="date-range">
            <div className="date-field">
              <span className="date-field-label">From</span>
              <input
                type="number"
                className="form-input"
                min={1960}
                max={endYear - 1}
                value={startYear}
                onChange={handleStartYear}
              />
            </div>
            <div className="date-field">
              <span className="date-field-label">To</span>
              <input
                type="number"
                className="form-input"
                min={startYear + 1}
                max={2024}
                value={endYear}
                onChange={handleEndYear}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div className="form-group">
          <label className="form-label">Chart Type</label>
          <div className="chart-type-toggle">
            {['line', 'bar', 'area'].map((type) => (
              <button
                key={type}
                className={`chart-type-btn ${chartType === type ? 'active' : ''}`}
                onClick={() => onChartTypeChange(type)}
              >
                {type === 'line' && '〜 '}
                {type === 'bar' && '▌ '}
                {type === 'area' && '◿ '}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          className="fetch-btn"
          onClick={() => { onFetch(); onClose(); }}
          disabled={loading || selectedCountries.length === 0}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Loading…
            </>
          ) : (
            'Fetch Data'
          )}
        </button>
        {selectedCountries.length === 0 && (
          <p className="fetch-hint">Select at least one country</p>
        )}
      </div>
    </aside>
  );
}
