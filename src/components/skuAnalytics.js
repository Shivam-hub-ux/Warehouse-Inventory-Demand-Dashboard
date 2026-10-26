/**
 * SKU Analytics Component
 * Renders dedicated SKU intelligence cards, price distributions, supply coverage,
 * data health audit indicators, and an interactive SKU ledger.
 */

import { calculateSkuAnalytics } from '../js/skuAnalytics.js';
import { chartManager } from '../js/charts.js';

let currentSortField = 'valuation';
let currentSortOrder = 'desc';
let skuSearchQuery = '';

export function renderSkuAnalytics(filters = {}) {
  const container = document.getElementById('sku-analytics-container');
  if (!container) return;

  const analytics = calculateSkuAnalytics(filters);

  // 1. Render Summary Cards & View Structure
  container.innerHTML = `
    <!-- Top Summary Metric Cards -->
    <div class="kpi-grid">
      <!-- Unique SKUs & Catalog Volume -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Catalog SKUs</span>
          <div class="kpi-icon" style="background-color: var(--primary-light); color: var(--primary);">🏷️</div>
        </div>
        <div class="kpi-value">${analytics.totalUniqueSkus} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">unique</span></div>
        <div class="kpi-footer">
          <span class="kpi-trend-positive">Total Records: ${analytics.totalProductRecords}</span>
          ${analytics.duplicateSkuCount > 0 
            ? `<span class="badge badge-danger" style="margin-left: 0.5rem;">${analytics.duplicateSkuCount} Duplicates</span>` 
            : `<span class="badge badge-success" style="margin-left: 0.5rem;">0 Duplicates</span>`}
        </div>
      </div>

      <!-- Price Statistics -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Price Range & Avg</span>
          <div class="kpi-icon" style="background-color: var(--secondary-light); color: var(--secondary);">💲</div>
        </div>
        <div class="kpi-value">$${analytics.priceStatistics.avg.toFixed(2)} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">avg</span></div>
        <div class="kpi-footer">
          <span style="color: var(--text-muted);">
            Min: $${analytics.priceStatistics.min !== null ? analytics.priceStatistics.min.toFixed(2) : '0'} | 
            Med: $${analytics.priceStatistics.median.toFixed(2)} | 
            Max: $${analytics.priceStatistics.max !== null ? analytics.priceStatistics.max.toFixed(2) : '0'}
          </span>
        </div>
      </div>

      <!-- Stock Unit Metrics -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Avg Stock Per SKU</span>
          <div class="kpi-icon" style="background-color: var(--warning-light); color: var(--warning);">📊</div>
        </div>
        <div class="kpi-value">${analytics.stockStatistics.avg} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">units/SKU</span></div>
        <div class="kpi-footer">
          <span style="color: var(--text-muted);">
            Min: ${analytics.stockStatistics.min} | Med: ${analytics.stockStatistics.median} | Max: ${analytics.stockStatistics.max}
          </span>
        </div>
      </div>

      <!-- Stockout & Velocity Risk -->
      <div class="kpi-card" style="${analytics.stockoutRisks.length > 0 ? 'border-color: rgba(220, 38, 38, 0.4);' : ''}">
        <div class="kpi-header">
          <span class="kpi-title">Stockout & Velocity Risks</span>
          <div class="kpi-icon" style="background-color: var(--danger-light); color: var(--danger);">🚨</div>
        </div>
        <div class="kpi-value" style="${analytics.stockoutRisks.length > 0 ? 'color: var(--danger);' : ''}">
          ${analytics.stockoutRisks.length} <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-muted);">SKUs</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-trend-danger">${analytics.healthBreakdown.critical} Critical</span> | 
          <span class="kpi-trend-warning">${analytics.healthAudit.lowCoverageCount} &lt; 1 Mo. Supply</span>
        </div>
      </div>
    </div>

    <!-- Data Quality & Validation Audit Banner -->
    <div class="forecast-callout" style="margin-top: 1.25rem;">
      <div class="forecast-callout-icon">🛡️</div>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong>Dataset Validation & SKU Integrity Audit:</strong>
            <span> Schema Compliance: <strong>${analytics.healthAudit.cleanRate}%</strong></span> |
            <span> Valid SKUs: <strong>${analytics.totalUniqueSkus}</strong></span> |
            <span> Rejected Records: <strong>${analytics.healthAudit.rejectedRecordsCount}</strong></span> |
            <span> Warnings: <strong>${analytics.healthAudit.warningsCount}</strong></span>
          </div>
          <span class="badge ${analytics.healthAudit.rejectedRecordsCount === 0 ? 'badge-success' : 'badge-warning'}">
            ${analytics.healthAudit.rejectedRecordsCount === 0 ? 'Dataset Verified Clean' : 'Anomalies Filtered'}
          </span>
        </div>
      </div>
    </div>

    <!-- Charts Grid: Category SKU Distribution + Price Tiers -->
    <div class="dashboard-grid-3" style="margin-top: 1.25rem;">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">📦 Category SKU Distribution & Valuation</div>
            <div class="card-subtitle">Unique product count and aggregate inventory valuation per category</div>
          </div>
        </div>
        <div style="height: 280px; position: relative;">
          <canvas id="chart-sku-category"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">💰 Price Tier Distribution</div>
            <div class="card-subtitle">Catalog volume segmented by SKU unit price points</div>
          </div>
        </div>
        <div style="height: 280px; position: relative;">
          <canvas id="chart-sku-price-tiers"></canvas>
        </div>
      </div>
    </div>

    <!-- Interactive SKU Analytics Table Card -->
    <div class="card" style="margin-top: 1.25rem;">
      <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
        <div>
          <div class="card-title">📋 Comprehensive SKU Performance Ledger</div>
          <div class="card-subtitle">SKU-level stock, unit prices, demand velocity, and months of supply coverage</div>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <input 
            type="text" 
            id="sku-table-search" 
            class="input-search" 
            placeholder="Filter SKUs..." 
            value="${skuSearchQuery}"
            style="width: 220px; padding: 0.4rem 0.75rem; font-size: 0.85rem;" 
          />
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th style="cursor: pointer;" id="th-sort-sku">SKU Code ⇕</th>
              <th style="cursor: pointer;" id="th-sort-name">Product Name ⇕</th>
              <th>Category</th>
              <th style="cursor: pointer;" id="th-sort-price">Unit Price ⇕</th>
              <th style="cursor: pointer;" id="th-sort-stock">Stock Level ⇕</th>
              <th style="cursor: pointer;" id="th-sort-val">Total Valuation ⇕</th>
              <th>Monthly Demand</th>
              <th style="cursor: pointer;" id="th-sort-supply">Supply Coverage (Mo) ⇕</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="sku-analytics-tbody">
            <!-- Dynamically populated -->
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Charts
  if (analytics.categoryDistribution.length > 0) {
    chartManager.renderSkuCategoryChart('chart-sku-category', analytics.categoryDistribution);
  }
  if (analytics.priceTierDistribution.length > 0) {
    chartManager.renderSkuPriceTiersChart('chart-sku-price-tiers', analytics.priceTierDistribution);
  }

  // Render SKU Table Rows & Bind Sort/Search Handlers
  renderSkuTableRows(analytics.skuInventorySummaries);
  bindSkuTableEvents(analytics.skuInventorySummaries);
}

function renderSkuTableRows(summaries) {
  const tbody = document.getElementById('sku-analytics-tbody');
  if (!tbody) return;

  // Filter by local search query
  let filtered = [...summaries];
  if (skuSearchQuery.trim() !== '') {
    const q = skuSearchQuery.toLowerCase().trim();
    filtered = filtered.filter(s => 
      s.sku.toLowerCase().includes(q) || 
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }

  // Sort
  const order = currentSortOrder === 'desc' ? -1 : 1;
  filtered.sort((a, b) => {
    switch (currentSortField) {
      case 'sku':
        return a.sku.localeCompare(b.sku) * order;
      case 'name':
        return a.name.localeCompare(b.name) * order;
      case 'price':
        return (a.unitPrice - b.unitPrice) * order;
      case 'stock':
        return (a.totalStock - b.totalStock) * order;
      case 'valuation':
        return (a.valuation - b.valuation) * order;
      case 'supply': {
        const valA = a.monthsOfSupply !== null ? a.monthsOfSupply : -1;
        const valB = b.monthsOfSupply !== null ? b.monthsOfSupply : -1;
        return (valA - valB) * order;
      }
      default:
        return 0;
    }
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          🔍 No SKUs match the search term "${skuSearchQuery}".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    let badgeClass = 'badge-success';
    let statusText = 'In Stock';
    let barColor = 'var(--success)';

    if (item.status === 'OUT_OF_STOCK') {
      badgeClass = 'badge-danger';
      statusText = 'Out of Stock (0)';
      barColor = 'var(--danger)';
    } else if (item.status === 'CRITICAL') {
      badgeClass = 'badge-danger';
      statusText = `Critical (${item.totalStock})`;
      barColor = 'var(--danger)';
    } else if (item.status === 'LOW') {
      badgeClass = 'badge-warning';
      statusText = `Low Stock (${item.totalStock})`;
      barColor = 'var(--warning)';
    }

    const supplyCoverageHtml = item.monthsOfSupply !== null
      ? `<span style="font-weight: 600; color: ${item.monthsOfSupply < 1.0 ? 'var(--danger)' : 'var(--text-dark)'};">
           ${item.monthsOfSupply} mo
         </span>`
      : `<span style="color: var(--text-muted); font-size: 0.8rem;">N/A (0 demand)</span>`;

    return `
      <tr>
        <td>
          <span style="font-family: monospace; font-size: 0.85rem; font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 0.2rem 0.5rem; border-radius: 4px;">
            ${item.sku}
          </span>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-dark);">${item.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">ID: ${item.id}</div>
        </td>
        <td>
          <span style="font-size: 0.8rem; padding: 0.2rem 0.5rem; background: var(--bg-alt); border-radius: 4px; font-weight: 500;">
            ${item.category}
          </span>
        </td>
        <td style="font-weight: 600;">$${item.unitPrice.toFixed(2)}</td>
        <td style="min-width: 130px;">
          <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 0.85rem;">
            <span>${item.totalStock} units</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">${item.stockRatioPct}%</span>
          </div>
          <div class="progress-bar-bg" style="height: 5px; margin-top: 4px;">
            <div class="progress-bar-fill" style="width: ${item.stockRatioPct}%; background-color: ${barColor}; height: 5px;"></div>
          </div>
        </td>
        <td style="font-weight: 700; color: var(--text-dark);">$${item.valuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td>
          <div style="font-weight: 600;">${item.latestMonthlyDemand} <span style="font-size: 0.75rem; color: var(--text-muted);">/mo</span></div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${item.annualDemand} /yr</div>
        </td>
        <td>${supplyCoverageHtml}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
      </tr>
    `;
  }).join('');
}

function bindSkuTableEvents(summaries) {
  const searchInput = document.getElementById('sku-table-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      skuSearchQuery = e.target.value;
      renderSkuTableRows(summaries);
    });
  }

  const bindSortHeader = (elementId, field) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener('click', () => {
      if (currentSortField === field) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortField = field;
        currentSortOrder = 'desc';
      }
      renderSkuTableRows(summaries);
    });
  };

  bindSortHeader('th-sort-sku', 'sku');
  bindSortHeader('th-sort-name', 'name');
  bindSortHeader('th-sort-price', 'price');
  bindSortHeader('th-sort-stock', 'stock');
  bindSortHeader('th-sort-val', 'valuation');
  bindSortHeader('th-sort-supply', 'supply');
}
