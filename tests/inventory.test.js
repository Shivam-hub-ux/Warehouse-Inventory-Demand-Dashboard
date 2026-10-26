import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDashboardKPIs,
  calculateWarehouseInventoryDistribution,
  calculateCategoryDistribution,
  calculateStockStatusBreakdown
} from '../src/js/analytics.js';
import { dataRepository } from '../src/js/data.js';

describe('Inventory & Analytics Engine: calculateDashboardKPIs', () => {
  it('computes top-level dashboard metrics for all products', () => {
    const kpis = calculateDashboardKPIs();
    assert.ok(kpis.totalInventoryUnits > 0);
    assert.ok(kpis.totalValuation > 0);
    assert.ok(kpis.totalProducts > 0);
    assert.equal(kpis.activeWarehouseCount, 4);
  });

  it('filters KPI calculations when specific warehouse is selected', () => {
    const globalKpis = calculateDashboardKPIs();
    const northKpis = calculateDashboardKPIs({ warehouse: 'WH-NORTH' });

    assert.equal(northKpis.activeWarehouseCount, 1);
    assert.ok(northKpis.totalInventoryUnits <= globalKpis.totalInventoryUnits);
    assert.ok(northKpis.totalValuation <= globalKpis.totalValuation);
  });
});

describe('Inventory & Analytics Engine: calculateWarehouseInventoryDistribution', () => {
  it('calculates inventory and capacity utilization per warehouse', () => {
    const dist = calculateWarehouseInventoryDistribution();
    assert.equal(dist.length, 4);
    dist.forEach(wh => {
      assert.ok(wh.capacity > 0);
      assert.ok(wh.totalStock >= 0);
      assert.ok(wh.utilizationPct >= 0 && wh.utilizationPct <= 100);
    });
  });
});

describe('Inventory & Analytics Engine: calculateStockStatusBreakdown', () => {
  it('categorizes products into In Stock, Low Stock, and Critical', () => {
    const breakdown = calculateStockStatusBreakdown();
    const sum = breakdown.inStock + breakdown.lowStock + breakdown.critical;
    assert.equal(sum, dataRepository.getProducts().length);
  });
});
