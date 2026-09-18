/**
 * Dashboard Component
 * Renders high-level KPI cards and coordinates top-level dashboard metrics.
 */

import { calculateDashboardKPIs } from '../js/analytics.js';

export function renderDashboardKPIs(filters = {}) {
  const kpiData = calculateDashboardKPIs(filters);
  const container = document.getElementById('kpi-cards-container');
  if (!container) return;

  container.innerHTML = `
    <!-- KPI Card 1: Total Inventory -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">Total Inventory</span>
        <div class="kpi-icon" style="background-color: var(--primary-light); color: var(--primary);">📦</div>
      </div>
      <div class="kpi-value">${kpiData.totalInventoryUnits.toLocaleString()} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">units</span></div>
      <div class="kpi-footer">
        <span class="kpi-trend-positive">Valuation: $${(kpiData.totalValuation / 1000).toFixed(1)}k</span>
      </div>
    </div>

    <!-- KPI Card 2: Total Products -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">Total SKUs</span>
        <div class="kpi-icon" style="background-color: var(--secondary-light); color: var(--secondary);">🏷️</div>
      </div>
      <div class="kpi-value">${kpiData.totalProducts} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">items</span></div>
      <div class="kpi-footer">
        <span style="color: var(--text-muted);">Across 5 product categories</span>
      </div>
    </div>

    <!-- KPI Card 3: Active Warehouses -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">Warehouses</span>
        <div class="kpi-icon" style="background-color: var(--success-light); color: var(--success);">🏢</div>
      </div>
      <div class="kpi-value">${kpiData.activeWarehouseCount} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">locations</span></div>
      <div class="kpi-footer">
        <span class="kpi-trend-positive">● Multi-region operational</span>
      </div>
    </div>

    <!-- KPI Card 4: Low Stock Alert -->
    <div class="kpi-card" style="${kpiData.criticalStockCount > 0 ? 'border-color: rgba(220, 38, 38, 0.4);' : ''}">
      <div class="kpi-header">
        <span class="kpi-title">Low & Critical Stock</span>
        <div class="kpi-icon" style="background-color: var(--danger-light); color: var(--danger);">⚠️</div>
      </div>
      <div class="kpi-value" style="${kpiData.criticalStockCount > 0 ? 'color: var(--danger);' : ''}">
        ${kpiData.lowStockCount + kpiData.criticalStockCount}
      </div>
      <div class="kpi-footer">
        <span class="kpi-trend-danger">${kpiData.criticalStockCount} Critical</span> | 
        <span class="kpi-trend-warning">${kpiData.lowStockCount} Reorder</span>
      </div>
    </div>

    <!-- KPI Card 5: Average Monthly Demand -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">Avg Product Demand</span>
        <div class="kpi-icon" style="background-color: var(--warning-light); color: var(--warning);">📈</div>
      </div>
      <div class="kpi-value">${kpiData.averageDemandPerProduct} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">units/mo</span></div>
      <div class="kpi-footer">
        <span class="kpi-trend-positive">Total Demand: ${kpiData.totalDemandSum.toLocaleString()}</span>
      </div>
    </div>

    <!-- KPI Card 6: Orders Processed -->
    <div class="kpi-card">
      <div class="kpi-header">
        <span class="kpi-title">Active Orders</span>
        <div class="kpi-icon" style="background-color: var(--primary-light); color: var(--primary);">🚚</div>
      </div>
      <div class="kpi-value">${kpiData.ordersProcessedCount} <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted);">fulfilled</span></div>
      <div class="kpi-footer">
        <span class="kpi-trend-positive">Pick/Pack Flow Active</span>
      </div>
    </div>
  `;
}
