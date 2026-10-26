/**
 * Main Application Entry Point
 * Orchestrates data loading, filter event bindings, UI component rendering, and workflow simulations.
 */

import { dataRepository } from './data.js';
import { renderDashboardKPIs } from '../components/dashboard.js';
import { renderInventoryTable } from '../components/inventory.js';
import { renderDemandSection } from '../components/demand.js';
import { renderForecastSection } from '../components/forecast.js';
import { renderSkuAnalytics } from '../components/skuAnalytics.js';
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
    
    // 1. Initialize UI components & event listeners
    this.bindFilterEvents();
    this.bindNavLinks();
    this.initWorkflow();
    this.bindDataRepository();

    // 2. Initial Render of Dashboard Views
    this.renderAll();

    console.log('✅ Dashboard successfully loaded & responsive.');
  }

  bindDataRepository() {
    // Listen to reactive data layer state changes
    dataRepository.subscribe((state) => {
      const banner = document.getElementById('data-layer-status');
      if (!banner) return;

      if (state.status === 'loading') {
        banner.style.display = 'block';
        banner.className = 'forecast-callout';
        banner.innerHTML = `
          <div class="forecast-callout-icon">⏳</div>
          <div><strong>Loading Dataset:</strong> Ingesting and validating warehouse catalog...</div>
        `;
      } else if (state.status === 'error') {
        banner.style.display = 'block';
        banner.className = 'forecast-callout';
        banner.style.borderColor = 'var(--danger)';
        banner.style.backgroundColor = 'var(--danger-light)';
        banner.innerHTML = `
          <div class="forecast-callout-icon">❌</div>
          <div><strong>Data Layer Error:</strong> ${state.error || 'Failed to process dataset'}</div>
        `;
      } else if (state.status === 'empty') {
        banner.style.display = 'block';
        banner.className = 'forecast-callout';
        banner.style.borderColor = 'var(--warning)';
        banner.style.backgroundColor = 'var(--warning-light)';
        banner.innerHTML = `
          <div class="forecast-callout-icon">ℹ️</div>
          <div><strong>Dataset Empty:</strong> No valid product records currently loaded.</div>
        `;
      } else {
        banner.style.display = 'none';
      }
    });
  }

  bindNavLinks() {
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        navLinks.forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });
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
    renderSkuAnalytics(this.activeFilters);
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
