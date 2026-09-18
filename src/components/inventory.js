/**
 * Inventory Table & Stock Overview Component
 * Displays searchable product list, warehouse distribution, stock level indicators, and stock health badges.
 */

import { dataRepository } from '../js/data.js';

export function renderInventoryTable(filters = {}) {
  const products = dataRepository.getProducts(filters);
  const warehouses = dataRepository.getWarehouses();
  const tableBody = document.getElementById('inventory-table-body');
  const itemCountBadge = document.getElementById('inventory-item-count');

  if (!tableBody) return;

  if (itemCountBadge) {
    itemCountBadge.textContent = `${products.length} Products Found`;
  }

  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          🔍 No inventory items match your current filter parameters.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = products.map(product => {
    // Determine stock based on selected warehouse filter or total across all warehouses
    const isSingleWarehouse = filters.warehouse && filters.warehouse !== 'ALL';
    const totalStock = isSingleWarehouse
      ? (product.warehouseStock[filters.warehouse] || 0)
      : Object.values(product.warehouseStock).reduce((sum, qty) => sum + qty, 0);

    // Calculate Stock Status & Badge Style
    let badgeHtml = '';
    let barColor = 'var(--success)';
    
    if (totalStock <= product.minStock) {
      badgeHtml = `<span class="badge badge-danger">Critical (${totalStock})</span>`;
      barColor = 'var(--danger)';
    } else if (totalStock <= product.reorderPoint) {
      badgeHtml = `<span class="badge badge-warning">Low Stock (${totalStock})</span>`;
      barColor = 'var(--warning)';
    } else {
      badgeHtml = `<span class="badge badge-success">In Stock (${totalStock})</span>`;
    }

    // Stock ratio against max capacity threshold
    const pct = Math.min(100, Math.round((totalStock / product.maxStock) * 100));

    // Warehouse stock breakdown text
    const warehouseBreakdownStr = isSingleWarehouse
      ? (warehouses.find(w => w.id === filters.warehouse)?.name || filters.warehouse)
      : Object.entries(product.warehouseStock)
          .map(([whId, qty]) => `${whId.replace('WH-', '')}: ${qty}`)
          .join(' | ');

    const latestDemand = product.historicalDemand[product.historicalDemand.length - 1] || 0;

    return `
      <tr>
        <td>
          <div style="font-weight: 600; color: var(--text-dark);">${product.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">SKU: ${product.sku}</div>
        </td>
        <td>
          <span style="font-size: 0.8rem; padding: 0.2rem 0.5rem; background: var(--bg-alt); border-radius: 4px; font-weight: 500;">
            ${product.category}
          </span>
        </td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-dark); font-weight: 500;">
            ${warehouseBreakdownStr}
          </div>
        </td>
        <td style="min-width: 140px;">
          <div style="font-weight: 700; color: var(--text-dark); display: flex; justify-content: space-between;">
            <span>${totalStock} units</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${pct}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${barColor};"></div>
          </div>
        </td>
        <td>
          <div style="font-weight: 600;">${latestDemand} <span style="font-size: 0.75rem; color: var(--text-muted);">units/mo</span></div>
        </td>
        <td>${badgeHtml}</td>
        <td style="font-weight: 600; color: var(--text-dark);">$${(totalStock * product.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');
}
