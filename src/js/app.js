/**
 * Main Application Entry Point
 * Orchestrates data loading, filter event bindings, UI component rendering, and workflow simulations.
 */

import { renderDashboardKPIs } from '../components/dashboard.js';
import { renderInventoryTable } from '../components/inventory.js';
import { renderDemandSection } from '../components/demand.js';
import { renderForecastSection } from '../components/forecast.js';
import { workflowSimulator } from '../components/workflow.js';

class WarehouseApp {
  constructor() {
    this.activeFilters = {
      warehouse: 'ALL',
      category: 'ALL',
      stockStatus: 'ALL',
      search: ''
    };
    this.forecastMonths = 3;
  }

  init() {
    console.log('📦 LogiTrack Ops Dashboard Initializing...');
    
    // 1. Initialize UI components
    this.bindFilterEvents();
    this.initWorkflow();
    
    // 2. Initial Render of Dashboard Views
    this.renderAll();

    console.log('✅ Dashboard successfully loaded & responsive.');
  }

  getFiltersFromUI() {
    const warehouseSelect = document.getElementById('filter-warehouse');
    const categorySelect = document.getElementById('filter-category');
    const statusSelect = document.getElementById('filter-status');
    const searchInput = document.getElementById('filter-search');

    return {
      warehouse: warehouseSelect ? warehouseSelect.value : 'ALL',
      category: categorySelect ? categorySelect.value : 'ALL',
      stockStatus: statusSelect ? statusSelect.value : 'ALL',
      search: searchInput ? searchInput.value : ''
    };
  }

  bindFilterEvents() {
    const warehouseSelect = document.getElementById('filter-warehouse');
    const categorySelect = document.getElementById('filter-category');
    const statusSelect = document.getElementById('filter-status');
    const searchInput = document.getElementById('filter-search');
    const forecastSelect = document.getElementById('forecast-horizon-select');

    const handleFilterChange = () => {
      this.activeFilters = this.getFiltersFromUI();
      this.renderAll();
    };

    if (warehouseSelect) warehouseSelect.addEventListener('change', handleFilterChange);
    if (categorySelect) categorySelect.addEventListener('change', handleFilterChange);
    if (statusSelect) statusSelect.addEventListener('change', handleFilterChange);
    
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.activeFilters = this.getFiltersFromUI();
        this.renderAll();
      });
    }

    if (forecastSelect) {
      forecastSelect.addEventListener('change', (e) => {
        this.forecastMonths = parseInt(e.target.value, 10) || 3;
        renderForecastSection(this.activeFilters, this.forecastMonths);
      });
    }
  }

  initWorkflow() {
    workflowSimulator.init();
  }

  renderAll() {
    // Render dynamic dashboard components with active filters
    renderDashboardKPIs(this.activeFilters);
    renderDemandSection(this.activeFilters);
    renderForecastSection(this.activeFilters, this.forecastMonths);
    renderInventoryTable(this.activeFilters);
  }
}

// Bootstrap Application on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new WarehouseApp();
  app.init();
});
