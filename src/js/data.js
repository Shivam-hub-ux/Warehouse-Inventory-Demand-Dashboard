/**
 * Data Service & Repository Layer
 * Manages raw data imports, filtering queries, and runtime state mutation for orders & inventory.
 */

import { WAREHOUSES, CATEGORIES, MONTHS, PRODUCTS, INITIAL_ORDERS } from '../../data/warehouse-data.js';

class DataRepository {
  constructor() {
    this.warehouses = [...WAREHOUSES];
    this.categories = [...CATEGORIES];
    this.months = [...MONTHS];
    this.products = JSON.parse(JSON.stringify(PRODUCTS));
    this.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  }

  getWarehouses() {
    return this.warehouses;
  }

  getCategories() {
    return this.categories;
  }

  getMonths() {
    return this.months;
  }

  /**
   * Get filtered products list based on active dashboard filter criteria
   */
  getProducts(filters = {}) {
    let result = [...this.products];

    if (filters.warehouse && filters.warehouse !== 'ALL') {
      result = result.filter(p => p.warehouseStock[filters.warehouse] !== undefined);
    }

    if (filters.category && filters.category !== 'ALL') {
      result = result.filter(p => p.category === filters.category);
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.sku.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    }

    if (filters.stockStatus && filters.stockStatus !== 'ALL') {
      result = result.filter(p => {
        const totalStock = filters.warehouse && filters.warehouse !== 'ALL'
          ? (p.warehouseStock[filters.warehouse] || 0)
          : Object.values(p.warehouseStock).reduce((sum, v) => sum + v, 0);

        if (filters.stockStatus === 'CRITICAL') return totalStock <= p.minStock;
        if (filters.stockStatus === 'LOW') return totalStock > p.minStock && totalStock <= p.reorderPoint;
        if (filters.stockStatus === 'IN_STOCK') return totalStock > p.reorderPoint;
        return true;
      });
    }

    return result;
  }

  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  getOrders() {
    return this.orders;
  }

  addOrder(order) {
    this.orders.unshift(order);
    return order;
  }

  updateOrderStatus(orderId, newStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
    }
    return order;
  }
}

export const dataRepository = new DataRepository();
