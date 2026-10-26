/**
 * SKU Analytics Engine
 * 
 * Computes deep SKU-level metrics, inventory concentrations, price distributions,
 * stock-to-demand coverage ratios (months of supply), risk audits, and category summaries.
 */

import { dataRepository } from './data.js';

/**
 * Calculate median value of a numerical array
 * @param {number[]} arr
 * @returns {number}
 */
export function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Compute exhaustive SKU-level analytics based on current repository data or filtered products
 *
 * @param {Object} [filters={}] - Optional filters (warehouse, category, search, etc.)
 * @param {Object} [options={}]
 * @param {Array<Object>} [options.products] - Custom products array (defaults to repository products)
 * @param {Object} [options.validationReport] - Validation report (defaults to repository validation report)
 * @returns {Object} Comprehensive SKU Analytics Object
 */
export function calculateSkuAnalytics(filters = {}, options = {}) {
  const products = options.products || dataRepository.getProducts(filters);
  const validationReport = options.validationReport || dataRepository.getValidationReport();
  const warehouses = dataRepository.getWarehouses();

  // 1. Basic Volume & Identification Metrics
  const totalProductRecords = products.length;
  const uniqueSkusSet = new Set(products.map(p => p.sku));
  const totalUniqueSkus = uniqueSkusSet.size;

  if (totalProductRecords === 0) {
    return {
      totalProductRecords: 0,
      totalUniqueSkus: 0,
      duplicateSkuCount: validationReport ? validationReport.duplicateSkuCount : 0,
      totalInventoryUnits: 0,
      totalValuation: 0,
      priceStatistics: { min: null, max: null, avg: 0, median: 0, currency: 'USD' },
      stockStatistics: { min: 0, max: 0, avg: 0, median: 0 },
      healthBreakdown: { inStock: 0, lowStock: 0, critical: 0, outOfStock: 0 },
      categoryDistribution: [],
      priceTierDistribution: [],
      skuInventorySummaries: [],
      topValuedSkus: [],
      stockoutRisks: [],
      healthAudit: {
        cleanRate: validationReport ? validationReport.complianceRate : 100,
        rejectedRecordsCount: validationReport ? validationReport.rejectedCount : 0,
        warningsCount: validationReport ? validationReport.warningCount : 0,
        zeroStockCount: 0,
        lowCoverageCount: 0
      }
    };
  }

  // 2. Compute per-SKU inventory summaries
  let totalInventoryUnits = 0;
  let totalValuation = 0;
  const prices = [];
  const stocks = [];

  let inStockCount = 0;
  let lowStockCount = 0;
  let criticalStockCount = 0;
  let outOfStockCount = 0;
  let lowCoverageCount = 0;

  const skuInventorySummaries = products.map(product => {
    // Single warehouse filter check
    const isSingleWarehouse = filters.warehouse && filters.warehouse !== 'ALL';
    const totalStock = isSingleWarehouse
      ? (product.warehouseStock[filters.warehouse] || 0)
      : Object.values(product.warehouseStock || {}).reduce((sum, qty) => sum + qty, 0);

    const valuation = Number((totalStock * product.unitPrice).toFixed(2));
    totalInventoryUnits += totalStock;
    totalValuation += valuation;

    prices.push(product.unitPrice);
    stocks.push(totalStock);

    // Determine status
    let status = 'IN_STOCK';
    if (totalStock === 0) {
      status = 'OUT_OF_STOCK';
      outOfStockCount++;
      criticalStockCount++;
    } else if (totalStock <= product.minStock) {
      status = 'CRITICAL';
      criticalStockCount++;
    } else if (totalStock <= product.reorderPoint) {
      status = 'LOW';
      lowStockCount++;
    } else {
      inStockCount++;
    }

    // Historical demand analysis
    const demandArr = Array.isArray(product.historicalDemand) ? product.historicalDemand : [];
    const latestMonthlyDemand = demandArr.length > 0 ? demandArr[demandArr.length - 1] : 0;
    const annualDemand = demandArr.reduce((sum, val) => sum + val, 0);
    const avgMonthlyDemand = demandArr.length > 0 ? Math.round(annualDemand / demandArr.length) : 0;

    // Months of supply: stock / latest monthly demand (or null if demand is 0)
    let monthsOfSupply = null;
    if (latestMonthlyDemand > 0) {
      monthsOfSupply = Number((totalStock / latestMonthlyDemand).toFixed(1));
      if (monthsOfSupply < 1.0) {
        lowCoverageCount++;
      }
    }

    const stockRatioPct = product.maxStock > 0 
      ? Math.min(100, Math.round((totalStock / product.maxStock) * 100))
      : 0;

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      unitPrice: product.unitPrice,
      totalStock,
      valuation,
      minStock: product.minStock,
      reorderPoint: product.reorderPoint,
      maxStock: product.maxStock,
      status,
      stockRatioPct,
      latestMonthlyDemand,
      annualDemand,
      avgMonthlyDemand,
      monthsOfSupply,
      warehouseStock: product.warehouseStock
    };
  });

  // 3. Price Statistics
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const sumPrice = prices.reduce((s, p) => s + p, 0);
  const avgPrice = Number((sumPrice / prices.length).toFixed(2));
  const medianPrice = Number(calculateMedian(prices).toFixed(2));

  // 4. Stock Statistics
  const minStock = Math.min(...stocks);
  const maxStock = Math.max(...stocks);
  const sumStock = stocks.reduce((s, q) => s + q, 0);
  const avgStock = Number((sumStock / stocks.length).toFixed(1));
  const medianStock = calculateMedian(stocks);

  // 5. Category-wise SKU Distribution
  const categoryMap = {};
  skuInventorySummaries.forEach(item => {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = {
        category: item.category,
        skuCount: 0,
        totalStock: 0,
        totalValuation: 0,
        priceSum: 0
      };
    }
    const catObj = categoryMap[item.category];
    catObj.skuCount += 1;
    catObj.totalStock += item.totalStock;
    catObj.totalValuation += item.valuation;
    catObj.priceSum += item.unitPrice;
  });

  const categoryDistribution = Object.values(categoryMap).map(cat => ({
    category: cat.category,
    skuCount: cat.skuCount,
    percentageOfTotalSkus: Number(((cat.skuCount / totalUniqueSkus) * 100).toFixed(1)),
    totalStock: cat.totalStock,
    totalValuation: Number(cat.totalValuation.toFixed(2)),
    avgPrice: Number((cat.priceSum / cat.skuCount).toFixed(2)),
    avgStockPerSku: Number((cat.totalStock / cat.skuCount).toFixed(1))
  })).sort((a, b) => b.skuCount - a.skuCount);

  // 6. Price Tier Distribution
  const priceTiers = [
    { label: '< $50 (Budget)', min: 0, max: 49.99, count: 0, valuation: 0 },
    { label: '$50 - $100 (Standard)', min: 50.0, max: 99.99, count: 0, valuation: 0 },
    { label: '$100 - $250 (Mid-Tier)', min: 100.0, max: 249.99, count: 0, valuation: 0 },
    { label: '$250+ (Premium)', min: 250.0, max: Infinity, count: 0, valuation: 0 }
  ];

  skuInventorySummaries.forEach(item => {
    const tier = priceTiers.find(t => item.unitPrice >= t.min && item.unitPrice <= t.max);
    if (tier) {
      tier.count += 1;
      tier.valuation += item.valuation;
    }
  });

  // 7. Top Valued SKUs
  const topValuedSkus = [...skuInventorySummaries]
    .sort((a, b) => b.valuation - a.valuation)
    .slice(0, 5);

  // 8. Stockout Risks (Critical stock or supply coverage < 1 month)
  const stockoutRisks = [...skuInventorySummaries]
    .filter(item => item.status === 'CRITICAL' || item.status === 'OUT_OF_STOCK' || (item.monthsOfSupply !== null && item.monthsOfSupply < 1.0))
    .sort((a, b) => {
      if (a.monthsOfSupply !== null && b.monthsOfSupply !== null) {
        return a.monthsOfSupply - b.monthsOfSupply;
      }
      return a.totalStock - b.totalStock;
    });

  // 9. Health & Integrity Audit
  const healthAudit = {
    cleanRate: validationReport ? validationReport.complianceRate : 100,
    rejectedRecordsCount: validationReport ? validationReport.rejectedCount : 0,
    warningsCount: validationReport ? validationReport.warningCount : 0,
    zeroStockCount: outOfStockCount,
    lowCoverageCount,
    duplicateSkus: validationReport ? validationReport.duplicateSkus : []
  };

  return {
    totalProductRecords,
    totalUniqueSkus,
    duplicateSkuCount: validationReport ? validationReport.duplicateSkuCount : 0,
    totalInventoryUnits,
    totalValuation: Number(totalValuation.toFixed(2)),
    priceStatistics: {
      min: minPrice,
      max: maxPrice,
      avg: avgPrice,
      median: medianPrice,
      currency: 'USD'
    },
    stockStatistics: {
      min: minStock,
      max: maxStock,
      avg: avgStock,
      median: medianStock
    },
    healthBreakdown: {
      inStock: inStockCount,
      lowStock: lowStockCount,
      critical: criticalStockCount,
      outOfStock: outOfStockCount
    },
    categoryDistribution,
    priceTierDistribution: priceTiers.map(t => ({
      label: t.label,
      count: t.count,
      valuation: Number(t.valuation.toFixed(2)),
      percentage: Number(((t.count / totalUniqueSkus) * 100).toFixed(1))
    })),
    skuInventorySummaries,
    topValuedSkus,
    stockoutRisks,
    healthAudit
  };
}
