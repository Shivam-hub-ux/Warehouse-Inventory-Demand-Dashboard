
import { describe, it, expect, vi } from 'vitest';

import {
  calculateDashboardKPIs,
  calculateWarehouseInventoryDistribution,
  calculateCategoryDistribution,
  calculateStockStatusBreakdown,
  calculateAggregatedHistoricalDemand
} from '../src/js/analytics.js';

import { dataRepository } from '../src/js/data.js';

describe('Inventory Analytics', () => {
  it('calculates dashboard KPIs', () => {
    const result = calculateDashboardKPIs();

    expect(result.totalInventoryUnits).toBeGreaterThan(0);
    expect(result.totalValuation).toBeGreaterThan(0);
    expect(result.totalProducts).toBeGreaterThan(0);
    expect(result.activeWarehouseCount).toBe(4);
  });

  it('filters KPI calculations by warehouse', () => {
    const globalKpis = calculateDashboardKPIs();
    const northKpis = calculateDashboardKPIs({
      warehouse: 'WH-NORTH'
    });

    expect(northKpis.activeWarehouseCount).toBe(1);
    expect(northKpis.totalInventoryUnits)
      .toBeLessThanOrEqual(globalKpis.totalInventoryUnits);
    expect(northKpis.totalValuation)
      .toBeLessThanOrEqual(globalKpis.totalValuation);
  });

  it('calculates inventory and capacity utilization per warehouse', () => {
    const result = calculateWarehouseInventoryDistribution();

    expect(result.length).toBe(4);

    result.forEach(warehouse => {
      expect(warehouse.capacity).toBeGreaterThan(0);
      expect(warehouse.totalStock).toBeGreaterThanOrEqual(0);
      expect(warehouse.utilizationPct).toBeGreaterThanOrEqual(0);
      expect(warehouse.utilizationPct).toBeLessThanOrEqual(100);
    });
  });

  it('scopes warehouse distribution to a selected warehouse and passes filters to the repository', () => {
    const getProducts = vi.spyOn(dataRepository, 'getProducts');
    const filters = { warehouse: 'WH-NORTH', category: 'Electronics', search: 'sensor' };

    try {
      const result = calculateWarehouseInventoryDistribution(filters);

      expect(getProducts).toHaveBeenCalledWith(filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('WH-NORTH');
      expect(result[0].capacity).toBeGreaterThan(0);
    } finally {
      getProducts.mockRestore();
    }
  });

  it('returns no warehouse bars for an unknown warehouse filter', () => {
    expect(calculateWarehouseInventoryDistribution({ warehouse: 'UNKNOWN' })).toEqual([]);
  });

  it('calculates category distribution', () => {
    const result = calculateCategoryDistribution();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach(category => {
      expect(category.count).toBeGreaterThan(0);
      expect(category.stock).toBeGreaterThanOrEqual(0);
    });
  });

  it('categorizes stock status correctly', () => {
    const breakdown = calculateStockStatusBreakdown();
    const sum = breakdown.inStock + breakdown.lowStock + breakdown.critical;

    expect(sum).toBe(dataRepository.getProducts().length);
  });

  it('returns historical demand labels and values', () => {
    const result = calculateAggregatedHistoricalDemand();

    expect(result.labels.length).toBeGreaterThan(0);
    expect(result.values.length).toBe(result.labels.length);

    result.values.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });
});
