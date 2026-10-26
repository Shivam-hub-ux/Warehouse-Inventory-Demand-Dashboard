import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSkuAnalytics, calculateMedian } from '../src/js/skuAnalytics.js';

describe('SKU Analytics: calculateMedian', () => {
  it('calculates median for odd-length arrays', () => {
    assert.equal(calculateMedian([10, 20, 30]), 20);
    assert.equal(calculateMedian([50, 10, 30]), 30);
  });

  it('calculates median for even-length arrays', () => {
    assert.equal(calculateMedian([10, 20, 30, 40]), 25);
  });

  it('returns 0 for empty array', () => {
    assert.equal(calculateMedian([]), 0);
  });
});

describe('SKU Analytics: calculateSkuAnalytics', () => {
  const sampleProducts = [
    {
      id: 'PRD-01',
      sku: 'SKU-001',
      name: 'Item Alpha',
      category: 'Electronics',
      unitPrice: 100.0,
      minStock: 20,
      reorderPoint: 40,
      maxStock: 200,
      warehouseStock: { 'WH-NORTH': 50, 'WH-SOUTH': 50 },
      historicalDemand: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
    },
    {
      id: 'PRD-02',
      sku: 'SKU-002',
      name: 'Item Beta',
      category: 'Electronics',
      unitPrice: 200.0,
      minStock: 10,
      reorderPoint: 25,
      maxStock: 150,
      warehouseStock: { 'WH-NORTH': 5, 'WH-SOUTH': 5 },
      historicalDemand: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
    },
    {
      id: 'PRD-03',
      sku: 'SKU-003',
      name: 'Item Gamma',
      category: 'Industrial Tools',
      unitPrice: 50.0,
      minStock: 15,
      reorderPoint: 30,
      maxStock: 100,
      warehouseStock: { 'WH-NORTH': 0, 'WH-SOUTH': 0 },
      historicalDemand: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
    }
  ];

  it('calculates correct volume and unique SKU counts', () => {
    const result = calculateSkuAnalytics({}, { products: sampleProducts });
    assert.equal(result.totalProductRecords, 3);
    assert.equal(result.totalUniqueSkus, 3);
    assert.equal(result.totalInventoryUnits, 110); // 100 + 10 + 0
    assert.equal(result.totalValuation, 12000); // (100*100) + (10*200) + (0*50) = 10000 + 2000 = 12000
  });

  it('computes accurate price statistics (min, max, avg, median)', () => {
    const result = calculateSkuAnalytics({}, { products: sampleProducts });
    assert.equal(result.priceStatistics.min, 50.0);
    assert.equal(result.priceStatistics.max, 200.0);
    assert.equal(result.priceStatistics.avg, 116.67); // (100 + 200 + 50) / 3 = 116.666...
    assert.equal(result.priceStatistics.median, 100.0);
  });

  it('computes stock statistics (min, max, avg, median)', () => {
    const result = calculateSkuAnalytics({}, { products: sampleProducts });
    assert.equal(result.stockStatistics.min, 0);
    assert.equal(result.stockStatistics.max, 100);
    assert.equal(result.stockStatistics.median, 10);
    assert.equal(result.stockStatistics.avg, 36.7);
  });

  it('classifies stock health (inStock, lowStock, critical, outOfStock)', () => {
    const result = calculateSkuAnalytics({}, { products: sampleProducts });
    // Item Alpha: 100 stock > reorderPoint(40) -> inStock
    // Item Beta: 10 stock <= minStock(10) -> critical
    // Item Gamma: 0 stock -> outOfStock & critical
    assert.equal(result.healthBreakdown.inStock, 1);
    assert.equal(result.healthBreakdown.lowStock, 0);
    assert.equal(result.healthBreakdown.critical, 2);
    assert.equal(result.healthBreakdown.outOfStock, 1);
  });

  it('computes months of supply coverage accurately and handles zero demand safely', () => {
    const result = calculateSkuAnalytics({}, { products: sampleProducts });
    // Item Alpha: stock 100, monthly demand 50 -> 2.0 months
    const alpha = result.skuInventorySummaries.find(s => s.sku === 'SKU-001');
    assert.equal(alpha.monthsOfSupply, 2.0);

    // Item Beta: stock 10, monthly demand 20 -> 0.5 months (< 1.0 month velocity risk)
    const beta = result.skuInventorySummaries.find(s => s.sku === 'SKU-002');
    assert.equal(beta.monthsOfSupply, 0.5);

    // Check with zero demand product
    const zeroDemandProduct = [{
      id: 'PRD-Z',
      sku: 'SKU-ZERO',
      name: 'Zero Demand Item',
      category: 'Electronics',
      unitPrice: 10.0,
      minStock: 5,
      reorderPoint: 10,
      maxStock: 50,
      warehouseStock: { 'WH-NORTH': 10 },
      historicalDemand: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }];
    const zeroResult = calculateSkuAnalytics({}, { products: zeroDemandProduct });
    assert.equal(zeroResult.skuInventorySummaries[0].monthsOfSupply, null);
  });

  it('computes category distribution and percentage share', () => {
    const result = calculateSkuAnalytics({}, { products: sampleProducts });
    assert.equal(result.categoryDistribution.length, 2);
    const electronics = result.categoryDistribution.find(c => c.category === 'Electronics');
    assert.equal(electronics.skuCount, 2);
    assert.equal(electronics.percentageOfTotalSkus, 66.7);
    assert.equal(electronics.totalValuation, 12000);
  });

  it('segments SKUs into price tiers', () => {
    const result = calculateSkuAnalytics({}, { products: sampleProducts });
    const standard = result.priceTierDistribution.find(t => t.label.includes('Standard'));
    assert.equal(standard.count, 1); // 50.0 is in $50 - $100

    const midTier = result.priceTierDistribution.find(t => t.label.includes('Mid-Tier'));
    assert.equal(midTier.count, 2); // 100.0 and 200.0 are in $100 - $250
  });

  it('handles empty dataset safely without throwing errors or producing NaNs', () => {
    const result = calculateSkuAnalytics({}, { products: [] });
    assert.equal(result.totalProductRecords, 0);
    assert.equal(result.totalUniqueSkus, 0);
    assert.equal(result.totalInventoryUnits, 0);
    assert.equal(result.totalValuation, 0);
    assert.equal(result.priceStatistics.min, null);
    assert.equal(result.priceStatistics.max, null);
    assert.equal(result.priceStatistics.avg, 0);
    assert.equal(result.skuInventorySummaries.length, 0);
  });
});
