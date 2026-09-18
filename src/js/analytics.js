/**
 * Analytics Engine Module
 * Dynamically computes KPIs, stock health metrics, aggregations, and warehouse statistics.
 */

import { dataRepository } from './data.js';

export function calculateDashboardKPIs(filters = {}) {
  const products = dataRepository.getProducts(filters);
  const warehouses = dataRepository.getWarehouses();
  const orders = dataRepository.getOrders();

  let totalInventoryUnits = 0;
  let totalValuation = 0;
  let lowStockCount = 0;
  let criticalStockCount = 0;
  let totalDemandSum = 0;

  products.forEach(p => {
    // Total stock considering location filter if selected
    const productStock = filters.warehouse && filters.warehouse !== 'ALL'
      ? (p.warehouseStock[filters.warehouse] || 0)
      : Object.values(p.warehouseStock).reduce((sum, qty) => sum + qty, 0);

    totalInventoryUnits += productStock;
    totalValuation += (productStock * p.unitPrice);

    if (productStock <= p.minStock) {
      criticalStockCount++;
    } else if (productStock <= p.reorderPoint) {
      lowStockCount++;
    }

    // Average demand calculation for last month or yearly average
    const latestDemand = p.historicalDemand[p.historicalDemand.length - 1] || 0;
    totalDemandSum += latestDemand;
  });

  const totalProducts = products.length;
  const activeWarehouseCount = filters.warehouse && filters.warehouse !== 'ALL' ? 1 : warehouses.length;
  const averageDemandPerProduct = totalProducts > 0 ? Math.round(totalDemandSum / totalProducts) : 0;
  const ordersProcessedCount = orders.filter(o => o.status === 'Ready' || o.status === 'Packing').length;

  return {
    totalInventoryUnits,
    totalValuation,
    totalProducts,
    activeWarehouseCount,
    lowStockCount,
    criticalStockCount,
    averageDemandPerProduct,
    totalDemandSum,
    ordersProcessedCount
  };
}

export function calculateWarehouseInventoryDistribution() {
  const warehouses = dataRepository.getWarehouses();
  const products = dataRepository.getProducts();

  const distribution = warehouses.map(wh => {
    let totalStock = 0;
    let totalValuation = 0;
    let itemTypesCount = 0;

    products.forEach(p => {
      const qty = p.warehouseStock[wh.id] || 0;
      if (qty > 0) {
        totalStock += qty;
        totalValuation += (qty * p.unitPrice);
        itemTypesCount++;
      }
    });

    const utilizationPct = Math.min(100, Math.round((totalStock / wh.capacity) * 100));

    return {
      id: wh.id,
      name: wh.name,
      location: wh.location,
      color: wh.color,
      totalStock,
      totalValuation,
      itemTypesCount,
      capacity: wh.capacity,
      utilizationPct
    };
  });

  return distribution;
}

export function calculateCategoryDistribution(filters = {}) {
  const products = dataRepository.getProducts(filters);
  const categoryMap = {};

  products.forEach(p => {
    const totalStock = filters.warehouse && filters.warehouse !== 'ALL'
      ? (p.warehouseStock[filters.warehouse] || 0)
      : Object.values(p.warehouseStock).reduce((sum, qty) => sum + qty, 0);

    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { count: 0, stock: 0, valuation: 0 };
    }
    categoryMap[p.category].count += 1;
    categoryMap[p.category].stock += totalStock;
    categoryMap[p.category].valuation += (totalStock * p.unitPrice);
  });

  return Object.keys(categoryMap).map(cat => ({
    category: cat,
    count: categoryMap[cat].count,
    stock: categoryMap[cat].stock,
    valuation: categoryMap[cat].valuation
  }));
}

export function calculateStockStatusBreakdown(filters = {}) {
  const products = dataRepository.getProducts(filters);

  let inStock = 0;
  let lowStock = 0;
  let critical = 0;

  products.forEach(p => {
    const totalStock = filters.warehouse && filters.warehouse !== 'ALL'
      ? (p.warehouseStock[filters.warehouse] || 0)
      : Object.values(p.warehouseStock).reduce((sum, qty) => sum + qty, 0);

    if (totalStock <= p.minStock) {
      critical++;
    } else if (totalStock <= p.reorderPoint) {
      lowStock++;
    } else {
      inStock++;
    }
  });

  return { inStock, lowStock, critical };
}

export function calculateAggregatedHistoricalDemand(filters = {}) {
  const products = dataRepository.getProducts(filters);
  const months = dataRepository.getMonths();

  // Aggregate monthly demand totals across filtered products
  const monthlyTotals = new Array(months.length).fill(0);

  products.forEach(p => {
    p.historicalDemand.forEach((val, idx) => {
      if (idx < monthlyTotals.length) {
        monthlyTotals[idx] += val;
      }
    });
  });

  return {
    labels: months,
    values: monthlyTotals
  };
}
