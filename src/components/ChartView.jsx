import { useMemo } from 'react';
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
import { COUNTRIES } from '../constants/countries';
import { getChartValue, getRawFromChart, formatValue, getChartUnit, formatAxisTick } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
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

export default function ChartView({
  data,
  indicator,
  selectedCountries,
  startYear,
  endYear,
  chartType,
  loading,
}) {
  const years = useMemo(() => {
    const arr = [];
    for (let y = startYear; y <= endYear; y++) arr.push(y);
    return arr;
  }, [startYear, endYear]);

  const chartData = useMemo(() => {
    if (!data) return null;

    const datasets = selectedCountries.map((code, i) => {
      const country = COUNTRIES.find((c) => c.code === code);
      const countryData = data[code] ?? {};
      const color = PALETTE[i % PALETTE.length];

      return {
        label: country?.name ?? code,
        data: years.map((y) => getChartValue(countryData[y], indicator.format)),
        borderColor: color.border,
        backgroundColor: chartType === 'bar' ? color.border + 'cc' : color.bg,
        fill: chartType === 'area' ? 'origin' : false,
        tension: 0.3,
        pointRadius: years.length > 25 ? 2 : 4,
        pointHoverRadius: 6,
        borderWidth: chartType === 'bar' ? 0 : 2.5,
        spanGaps: false,
      };
    });

    return { labels: years.map(String), datasets };
  }, [data, indicator, selectedCountries, years, chartType]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 },
            color: '#334155',
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(15,23,42,0.92)',
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const chartVal = ctx.parsed.y;
              if (chartVal === null || chartVal === undefined)
                return `  ${ctx.dataset.label}: —`;
              const raw = getRawFromChart(chartVal, indicator.format);
              return `  ${ctx.dataset.label}: ${formatValue(raw, indicator.format)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { font: { size: 11 }, color: '#64748b', maxTicksLimit: 15 },
          border: { color: '#e2e8f0' },
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: {
            font: { size: 11 },
            color: '#64748b',
            callback: (value) => formatAxisTick(value, indicator.format),
          },
          title: {
            display: true,
            text: getChartUnit(indicator.format),
            font: { size: 11 },
            color: '#94a3b8',
            padding: { bottom: 8 },
          },
          border: { color: '#e2e8f0' },
        },
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
    }),
    [indicator],
  );

  if (loading) {
    return (
      <div className="chart-card">
        <div className="chart-state">
          <div className="spinner" />
          <p>Fetching data from World Bank…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="chart-card chart-card--empty">
        <div className="chart-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p>Configure your query and click <strong>Fetch Data</strong></p>
          <span>Select an indicator, countries, and date range</span>
        </div>
      </div>
    );
  }

  const hasAnyData = selectedCountries.some(
    (code) => data[code] && Object.values(data[code]).some((v) => v !== null),
  );

  if (!hasAnyData) {
    return (
      <div className="chart-card chart-card--empty">
        <div className="chart-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>No data available</p>
          <span>The World Bank doesn't have data for the selected combination</span>
        </div>
      </div>
    );
  }

  const ChartComponent = chartType === 'bar' ? Bar : Line;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <h2 className="chart-title">{indicator.label}</h2>
          <p className="chart-subtitle">
            {indicator.description} &middot; {startYear}–{endYear} &middot; Source: World Bank
          </p>
        </div>
      </div>
      <div className="chart-container">
        <ChartComponent data={chartData} options={options} />
      </div>
    </div>
  );
}
