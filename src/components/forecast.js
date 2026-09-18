/**
 * Demand Forecasting Component
 * Computes statistical projections, renders line charts, and displays algorithm transparency notices.
 */

import { generateAggregateDemandForecast } from '../js/forecast.js';
import { chartManager } from '../js/charts.js';

export function renderForecastSection(filters = {}, forecastMonths = 3) {
  const forecastData = generateAggregateDemandForecast(filters, forecastMonths);

  // 1. Render Line Chart
  chartManager.renderDemandForecastChart('chart-demand-forecast', forecastData);

  // 2. Render Statistical Indicators Panel
  const metricsContainer = document.getElementById('forecast-metrics-summary');
  if (metricsContainer) {
    const trendColor = forecastData.metrics.trendPct >= 0 ? 'var(--success)' : 'var(--danger)';
    const trendIcon = forecastData.metrics.trendPct >= 0 ? '📈 +' : '📉 ';

    metricsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem;">
        <div style="background: var(--bg-main); padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Forecasted Trend</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: ${trendColor};">
            ${trendIcon}${forecastData.metrics.trendPct}%
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Next ${forecastMonths} months slope: ${forecastData.metrics.slope}</div>
        </div>

        <div style="background: var(--bg-main); padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Avg Monthly Demand</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-dark);">
            ${forecastData.metrics.avgMonthlyDemand.toLocaleString()} <span style="font-size: 0.8rem; font-weight: 500;">units</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Based on 12-mo historical baseline</div>
        </div>

        <div style="background: var(--bg-main); padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Model Accuracy</div>
          <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">
            ${forecastData.metrics.confidenceLevel}
          </div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">In-browser computed error margin</div>
        </div>
      </div>
    `;
  }
}
