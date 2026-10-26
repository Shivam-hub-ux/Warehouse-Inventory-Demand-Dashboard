/**
 * Client-Side Data Repository & State Layer
 * 
 * Provides unified, asynchronous data access, dataset validation integration,
 * reactive state subscriptions, filtering, sorting, pagination, and SKU lookups.
 */

import { WAREHOUSES, CATEGORIES, MONTHS, PRODUCTS, INITIAL_ORDERS } from '../../data/warehouse-data.js';
import { prepareDataset, normalizeSku } from './datasetPreparation.js';

/**
 * @typedef {'idle' | 'loading' | 'success' | 'empty' | 'error'} DataStatus
 *
 * @typedef {Object} RepositoryState
 * @property {DataStatus} status
 * @property {string|null} error
 * @property {string|null} lastUpdated
 * @property {Object|null} validationReport
 */

export class DataRepository {
  constructor() {
    this.status = 'idle';
    this.error = null;
    this.lastUpdated = null;
    this.validationReport = null;

    this.warehouses = [];
    this.categories = [];
    this.months = [...MONTHS];
    this.products = [];
    this.orders = [];

    this.subscribers = new Set();

    // Initialize with bundled data through dataset preparation pipeline
    this.initializeFromBundledData();
  }

  /**
   * Synchronously ingest bundled dataset through the validation pipeline on boot
   */
  initializeFromBundledData() {
    try {
      const result = prepareDataset({
        products: PRODUCTS,
        warehouses: WAREHOUSES,
        orders: INITIAL_ORDERS
      });

      this.products = result.data.products;
      this.warehouses = result.data.warehouses;
      this.categories = result.data.categories;
      this.orders = result.data.orders;
      this.validationReport = result.report;
      this.lastUpdated = new Date().toISOString();
      this.status = this.products.length === 0 ? 'empty' : 'success';
      this.error = null;
    } catch (err) {
      this.status = 'error';
      this.error = err instanceof Error ? err.message : String(err);
      console.error('Failed to initialize DataRepository from bundled dataset:', err);
    }
  }

  /**
   * Subscribe to state and data changes
   * @param {Function} listener - Callback invoked with (state, repository)
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  /**
   * Notify all subscribers of state or data change
   */
  notify() {
    const state = this.getState();
    this.subscribers.forEach(listener => {
      try {
        listener(state, this);
      } catch (err) {
        console.error('Error in DataRepository subscriber callback:', err);
      }
    });
  }

  /**
   * Get current state snapshot
   * @returns {RepositoryState}
   */
  getState() {
    return {
      status: this.status,
      error: this.error,
      lastUpdated: this.lastUpdated,
      validationReport: this.validationReport
    };
  }

  /**
   * Asynchronously load dataset from external or provided raw sources.
   * Supports loading, success, empty, and error states.
   *
   * @param {Object} [source]
   * @param {Array} [source.products]
   * @param {Array} [source.warehouses]
   * @param {Array} [source.orders]
   * @returns {Promise<RepositoryState>}
   */
  async loadDataset(source = null) {
    this.status = 'loading';
    this.error = null;
    this.notify();

    try {
      // Simulate microtask async boundary for realistic client-side data layer
      await new Promise(resolve => setTimeout(resolve, 10));

      const raw = source || {
        products: PRODUCTS,
        warehouses: WAREHOUSES,
        orders: INITIAL_ORDERS
      };

      const result = prepareDataset(raw);

      this.products = result.data.products;
      this.warehouses = result.data.warehouses;
      this.categories = result.data.categories;
      this.orders = result.data.orders;
      this.validationReport = result.report;
      this.lastUpdated = new Date().toISOString();
      this.status = this.products.length === 0 ? 'empty' : 'success';
      this.error = null;

      this.notify();
      return this.getState();
    } catch (err) {
      this.status = 'error';
      this.error = err instanceof Error ? err.message : String(err);
      this.notify();
      throw err;
    }
  }

  /**
   * Get warehouses list
   * @returns {Array<Object>}
   */
  getWarehouses() {
    return [...this.warehouses];
  }

  /**
   * Get categories list
   * @returns {Array<string>}
   */
  getCategories() {
    return [...this.categories];
  }

  /**
   * Get months labels
   * @returns {Array<string>}
   */
  getMonths() {
    return [...this.months];
  }

  /**
   * Get data preparation and validation report
   * @returns {Object|null}
   */
  getValidationReport() {
    return this.validationReport;
  }

  /**
   * Get unique SKUs currently stored
   * @returns {Array<string>}
   */
  getUniqueSkus() {
    return Array.from(new Set(this.products.map(p => p.sku)));
  }

  /**
   * Check if an SKU exists in the dataset
   * @param {string} rawSku
   * @returns {boolean}
   */
  checkSkuExists(rawSku) {
    const sku = normalizeSku(rawSku);
    return this.products.some(p => p.sku === sku);
  }

  /**
   * Find product by canonical SKU
   * @param {string} rawSku
   * @returns {Object|undefined}
   */
  getProductBySku(rawSku) {
    const sku = normalizeSku(rawSku);
    return this.products.find(p => p.sku === sku);
  }

  /**
   * Find product by ID
   * @param {string} id
   * @returns {Object|undefined}
   */
  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  /**
   * Query products with filtering and sorting
   *
   * @param {Object} [filters={}]
   * @param {string} [filters.warehouse]
   * @param {string} [filters.category]
   * @param {string} [filters.stockStatus]
   * @param {string} [filters.search]
   * @param {number} [filters.minPrice]
   * @param {number} [filters.maxPrice]
   * @param {string} [filters.sortBy] - 'sku' | 'name' | 'category' | 'stock' | 'valuation' | 'price' | 'demand'
   * @param {'asc' | 'desc'} [filters.sortOrder='asc']
   * @returns {Array<Object>}
   */
  getProducts(filters = {}) {
    let result = [...this.products];

    // Filter by Warehouse
    if (filters.warehouse && filters.warehouse !== 'ALL') {
      result = result.filter(p => p.warehouseStock && p.warehouseStock[filters.warehouse] !== undefined);
    }

    // Filter by Category
    if (filters.category && filters.category !== 'ALL') {
      result = result.filter(p => p.category === filters.category);
    }

    // Filter by Search Query
    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.sku.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.id && p.id.toLowerCase().includes(term))
      );
    }

    // Filter by Stock Status
    if (filters.stockStatus && filters.stockStatus !== 'ALL') {
      result = result.filter(p => {
        const totalStock = filters.warehouse && filters.warehouse !== 'ALL'
          ? (p.warehouseStock[filters.warehouse] || 0)
          : Object.values(p.warehouseStock || {}).reduce((sum, v) => sum + v, 0);

        if (filters.stockStatus === 'CRITICAL') return totalStock <= p.minStock;
        if (filters.stockStatus === 'LOW') return totalStock > p.minStock && totalStock <= p.reorderPoint;
        if (filters.stockStatus === 'IN_STOCK') return totalStock > p.reorderPoint;
        return true;
      });
    }

    // Filter by Price Boundaries
    if (typeof filters.minPrice === 'number') {
      result = result.filter(p => p.unitPrice >= filters.minPrice);
    }
    if (typeof filters.maxPrice === 'number') {
      result = result.filter(p => p.unitPrice <= filters.maxPrice);
    }

    // Sorting
    if (filters.sortBy) {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const stockA = filters.warehouse && filters.warehouse !== 'ALL'
          ? (a.warehouseStock[filters.warehouse] || 0)
          : Object.values(a.warehouseStock || {}).reduce((s, v) => s + v, 0);

        const stockB = filters.warehouse && filters.warehouse !== 'ALL'
          ? (b.warehouseStock[filters.warehouse] || 0)
          : Object.values(b.warehouseStock || {}).reduce((s, v) => s + v, 0);

        switch (filters.sortBy) {
          case 'sku':
            return a.sku.localeCompare(b.sku) * order;
          case 'name':
            return a.name.localeCompare(b.name) * order;
          case 'category':
            return a.category.localeCompare(b.category) * order;
          case 'price':
            return (a.unitPrice - b.unitPrice) * order;
          case 'stock':
            return (stockA - stockB) * order;
          case 'valuation':
            return ((stockA * a.unitPrice) - (stockB * b.unitPrice)) * order;
          case 'demand': {
            const demA = a.historicalDemand[a.historicalDemand.length - 1] || 0;
            const demB = b.historicalDemand[b.historicalDemand.length - 1] || 0;
            return (demA - demB) * order;
          }
          default:
            return 0;
        }
      });
    }

    return result;
  }

  /**
   * Get products with pagination metadata
   *
   * @param {Object} [filters={}]
   * @param {Object} [pagination={}]
   * @param {number} [pagination.page=1]
   * @param {number} [pagination.pageSize=10]
   * @returns {{
   *   items: Array<Object>,
   *   page: number,
   *   pageSize: number,
   *   totalItems: number,
   *   totalPages: number,
   *   hasNext: boolean,
   *   hasPrev: boolean
   * }}
   */
  getProductsPaged(filters = {}, { page = 1, pageSize = 10 } = {}) {
    const all = this.getProducts(filters);
    const totalItems = all.length;
    const safePageSize = Math.max(1, pageSize);
    const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);

    const startIndex = (safePage - 1) * safePageSize;
    const items = all.slice(startIndex, startIndex + safePageSize);

    return {
      items,
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1
    };
  }

  /**
   * Orders list
   * @returns {Array<Object>}
   */
  getOrders() {
    return [...this.orders];
  }

  /**
   * Add new order
   * @param {Object} order
   * @returns {Object}
   */
  addOrder(order) {
    this.orders.unshift(order);
    this.notify();
    return order;
  }

  /**
   * Update status of an existing order
   * @param {string} orderId
   * @param {string} newStatus
   * @returns {Object|null}
   */
  updateOrderStatus(orderId, newStatus) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      this.notify();
    }
    return order;
  }

  /**
   * Mutate stock level of an SKU at a specific warehouse
   * @param {string} skuOrId
   * @param {string} warehouseId
   * @param {number} deltaQty
   * @returns {Object|null}
   */
  mutateProductStock(skuOrId, warehouseId, deltaQty) {
    const product = this.getProductBySku(skuOrId) || this.getProductById(skuOrId);
    if (!product || !product.warehouseStock) return null;

    const current = product.warehouseStock[warehouseId] || 0;
    const newQty = Math.max(0, current + deltaQty);
    product.warehouseStock[warehouseId] = newQty;
    this.notify();
    return product;
  }
}

export const dataRepository = new DataRepository();
