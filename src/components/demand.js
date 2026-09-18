/**
 * Demand Analytics Component
 * Coordinates historical demand trends, location aggregations, and category charts.
 */

import { calculateAggregatedHistoricalDemand, calculateWarehouseInventoryDistribution, calculateStockStatusBreakdown } from '../js/analytics.js';
import { chartManager } from '../js/charts.js';

export function renderDemandSection(filters = {}) {
  // 1. Render Warehouse Stock Distribution Bar Chart
  const warehouseDist = calculateWarehouseInventoryDistribution();
  chartManager.renderWarehouseChart('chart-warehouse-dist', warehouseDist);

  // 2. Render Stock Status Breakdown Doughnut Chart
  const stockStatusData = calculateStockStatusBreakdown(filters);
  chartManager.renderStockStatusChart('chart-stock-status', stockStatusData);
}
