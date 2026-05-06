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
  normalize,
  onNormalizeChange,
  logScale,
  onLogScaleChange,
  coverageMap,
  onFetch,
  loading,
  isOpen,
  onClose,
}) {
  const [countrySearch, setCountrySearch] = useState('');
  const [indSearch, setIndSearch] = useState('');
  const [indOpen, setIndOpen] = useState(false);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const filteredIndicators = INDICATORS.filter(
    (i) =>
      indSearch === '' ||
      i.label.toLowerCase().includes(indSearch.toLowerCase()),
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

      {/* ── Indicator (searchable) ──────────────────────────────── */}
      <div className="sidebar-section">
        <div className="form-group">
          <label className="form-label">Indicator</label>
          <div
            className="ind-picker"
            tabIndex={0}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIndOpen(false);
                setIndSearch('');
              }
            }}
          >
            <div className={`ind-input-wrap${indOpen ? ' open' : ''}`}>
              <input
                type="text"
                className="form-input"
                value={indOpen ? indSearch : indicator.label}
                onChange={(e) => setIndSearch(e.target.value)}
                onFocus={() => { setIndSearch(''); setIndOpen(true); }}
                placeholder="Search indicators…"
                readOnly={!indOpen}
              />
              <span className="ind-chevron" aria-hidden="true">▾</span>
            </div>
            {indOpen && (
              <div className="ind-dropdown" role="listbox">
                {filteredIndicators.map((ind) => (
                  <div
                    key={ind.id}
                    role="option"
                    aria-selected={ind.id === indicator.id}
                    className={`ind-option${ind.id === indicator.id ? ' active' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onIndicatorChange(ind);
                      setIndSearch('');
                      setIndOpen(false);
                    }}
                  >
                    {ind.label}
                  </div>
                ))}
                {filteredIndicators.length === 0 && (
                  <div className="ind-option ind-option--empty">No results</div>
                )}
              </div>
            )}
          </div>
          <p className="form-hint">{indicator.description}</p>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* ── Countries ──────────────────────────────────────────── */}
      <div className="sidebar-section">
        <div className="form-group">
          <label className="form-label">
            Countries
            <span className="badge">{selectedCountries.length}/{MAX_COUNTRIES}</span>
          </label>
          <input
            type="text"
            className="country-search"
            placeholder="Search countries…"
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
          />
          <div className="country-list">
            {filteredCountries.map((country) => {
              const checked = selectedCountries.includes(country.code);
              const disabled = !checked && selectedCountries.length >= MAX_COUNTRIES;
              const coverage = coverageMap[country.code];
              return (
                <label
                  key={country.code}
                  className={`country-item${disabled ? ' disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleCountry(country.code)}
                  />
                  <span className="country-name">{country.name}</span>
                  {coverage !== undefined ? (
                    <span className={`coverage-tag${coverage < 50 ? ' coverage-tag--low' : ''}`}>
                      {coverage}%
                    </span>
                  ) : (
                    <span className="country-code">{country.code}</span>
                  )}
                </label>
              );
            })}
            {filteredCountries.length === 0 && (
              <p className="no-results">No countries match "{countrySearch}"</p>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* ── Date range ─────────────────────────────────────────── */}
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

      {/* ── Chart type + options ───────────────────────────────── */}
      <div className="sidebar-section">
        <div className="form-group">
          <label className="form-label">Chart Type</label>
          <div className="chart-type-toggle">
            {['line', 'bar', 'area'].map((type) => (
              <button
                key={type}
                className={`chart-type-btn${chartType === type ? ' active' : ''}`}
                onClick={() => onChartTypeChange(type)}
              >
                {type === 'line' && '〜 '}
                {type === 'bar'  && '▌ '}
                {type === 'area' && '◿ '}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group options-group">
          <label className="form-label">Options</label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={normalize}
              onChange={(e) => onNormalizeChange(e.target.checked)}
            />
            <div className="toggle-text">
              <span>Index to start year = 100</span>
              <span className="toggle-hint">Compare relative change across countries</span>
            </div>
          </label>
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={logScale}
              onChange={(e) => onLogScaleChange(e.target.checked)}
            />
            <div className="toggle-text">
              <span>Logarithmic scale</span>
              <span className="toggle-hint">Useful for data spanning orders of magnitude</span>
            </div>
          </label>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="sidebar-footer">
        <button
          className="fetch-btn"
          onClick={() => { onFetch(); onClose(); }}
          disabled={loading || selectedCountries.length === 0}
        >
          {loading ? (
            <><span className="btn-spinner" />Loading…</>
          ) : (
            '↺ Refresh Data'
          )}
        </button>
        {selectedCountries.length === 0 && (
          <p className="fetch-hint">Select at least one country</p>
        )}
        <p className="auto-fetch-hint">Data refreshes automatically when you change settings</p>
      </div>
    </aside>
  );
}
