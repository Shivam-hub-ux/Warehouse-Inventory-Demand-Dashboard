
/**
 * Demand Forecasting Component
 * Displays demand projections and forecast accuracy metrics.
 */

import {
  generateAggregateDemandForecast,
  calculateForecastAccuracy
} from '../js/forecast.js';

import { chartManager } from '../js/charts.js';

export function renderForecastSection(filters = {}, forecastMonths = 3) {
  const forecastData = generateAggregateDemandForecast(
    filters,
    forecastMonths
  );

  const accuracy = calculateForecastAccuracy(filters);

  // Render demand forecast chart
  chartManager.renderDemandForecastChart(
    'chart-demand-forecast',
    forecastData
  );

  // Render forecast metrics
  const metricsContainer = document.getElementById(
    'forecast-metrics-summary'
  );

  if (metricsContainer) {
    const trendColor =
      forecastData.metrics.trendPct >= 0
        ? 'var(--success)'
        : 'var(--danger)';

    const trendIcon =
      forecastData.metrics.trendPct >= 0 ? '📈 +' : '📉 ';

    metricsContainer.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem;">

        <div style="background:var(--bg-main);padding:0.85rem 1rem;border-radius:8px;border:1px solid var(--border-color);">
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Forecasted Trend</div>
          <div style="font-size:1.25rem;font-weight:700;color:${trendColor};">
            ${trendIcon}${forecastData.metrics.trendPct}%
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);">
            Next ${forecastMonths} months
          </div>
        </div>

        <div style="background:var(--bg-main);padding:0.85rem 1rem;border-radius:8px;border:1px solid var(--border-color);">
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Avg Monthly Demand</div>
          <div style="font-size:1.25rem;font-weight:700;color:var(--text-dark);">
            ${forecastData.metrics.avgMonthlyDemand.toLocaleString()} units
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);">
            Historical demand baseline
          </div>
        </div>

        <div style="background:var(--bg-main);padding:0.85rem 1rem;border-radius:8px;border:1px solid var(--border-color);">
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Mean Absolute Error (MAE)</div>
          <div style="font-size:1.25rem;font-weight:700;color:var(--primary);">
            ${accuracy.mae ?? 'N/A'}
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);">
            Average error in units
          </div>
        </div>

        <div style="background:var(--bg-main);padding:0.85rem 1rem;border-radius:8px;border:1px solid var(--border-color);">
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Mean Absolute Percentage Error (MAPE)</div>
          <div style="font-size:1.25rem;font-weight:700;color:var(--primary);">
            ${accuracy.mape == null ? 'N/A' : accuracy.mape + '%'}
          </div>
          <div style="font-size:0.7rem;color:var(--text-muted);">
            Tested on ${accuracy.evaluatedPeriods} historical periods
          </div>
        </div>

      </div>
    `;
  }
}
