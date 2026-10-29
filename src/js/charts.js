/**
 * Chart Visualization Manager
 * Handles Chart.js instance lifecycles, styling, responsive canvas rendering, and dynamic updates.
 */

import Chart from 'chart.js/auto';

class ChartManager {
  constructor() {
    this.instances = {};
  }

  destroyChart(canvasId) {
    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
      delete this.instances[canvasId];
    }
  }

  /**
   * Render Warehouse Stock Distribution Bar Chart
   */
  renderWarehouseChart(canvasId, warehouseData) {
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const labels = warehouseData.map(w => w.name);
    const stockValues = warehouseData.map(w => w.totalStock);
    const capacityValues = warehouseData.map(w => w.capacity);
    const colors = warehouseData.map(w => w.color);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Current Stock (Units)',
            data: stockValues,
            backgroundColor: colors,
            borderRadius: 6,
            barPercentage: 0.6
          },
          {
            label: 'Total Capacity',
            data: capacityValues,
            backgroundColor: 'rgba(226, 232, 240, 0.6)',
            borderRadius: 6,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } },
          tooltip: {
            callbacks: {
              footer: (items) => {
                const index = items[0].dataIndex;
                const util = warehouseData[index].utilizationPct;
                return `Capacity Utilization: ${util}%`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#F1F5F9' } }
        }
      }
    });
  }

  /**
   * Render Historical Demand & Projected Demand Line Chart
   */
  renderDemandForecastChart(canvasId, forecastData) {
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const historicalLabels = forecastData.historicalLabels;
    const forecastLabels = forecastData.forecastLabels;
    const allLabels = [...historicalLabels, ...forecastLabels];

    // Align series points so forecast line connects continuously with historical data
    const historicalCount = historicalLabels.length;
    const hasHistory = forecastData.historicalValues.length > 0;
    const lastHistorical = hasHistory
      ? forecastData.historicalValues[forecastData.historicalValues.length - 1]
      : null;
    const historicalSeries = Array.from(
      { length: historicalCount },
      (_, index) => forecastData.historicalValues[index] ?? null
    ).concat(new Array(forecastLabels.length).fill(null));
    const forecastPrefix = new Array(Math.max(0, historicalCount - 1)).fill(null);
    const forecastSeries = forecastPrefix
      .concat(hasHistory ? [lastHistorical] : [null])
      .concat(forecastData.forecastValues);
    const upperBoundSeries = forecastPrefix
      .concat(hasHistory ? [lastHistorical] : [null])
      .concat(forecastData.upperBoundValues);
    const lowerBoundSeries = forecastPrefix
      .concat(hasHistory ? [lastHistorical] : [null])
      .concat(forecastData.lowerBoundValues);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          {
            label: 'Historical Demand',
            data: historicalSeries,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#2563EB'
          },
          {
            label: 'Projected Demand Forecast',
            data: forecastSeries,
            borderColor: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.05)',
            borderDash: [6, 6],
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#7C3AED'
          },
          {
            label: 'Forecast Confidence Range',
            data: upperBoundSeries,
            borderColor: 'transparent',
            backgroundColor: 'rgba(124, 58, 237, 0.12)',
            fill: '+1', // Fill down to lower bound
            pointRadius: 0
          },
          {
            label: 'Lower Bound',
            data: lowerBoundSeries,
            borderColor: 'transparent',
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              filter: (item) => item.text !== 'Lower Bound'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#F1F5F9' } }
        }
      }
    });
  }

  /**
   * Render Stock Status Doughnut Chart (In Stock, Low Stock, Critical)
   */
  renderStockStatusChart(canvasId, statusData) {
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['In Stock', 'Low Stock', 'Critical Level'],
        datasets: [{
          data: [statusData.inStock, statusData.lowStock, statusData.critical],
          backgroundColor: ['#059669', '#F59E0B', '#DC2626'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 } } }
        },
        cutout: '70%'
      }
    });
  }

  /**
   * Render Category SKU Distribution & Valuation Chart
   */
  renderSkuCategoryChart(canvasId, categoryData) {
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const labels = categoryData.map(c => c.category);
    const skuCounts = categoryData.map(c => c.skuCount);
    const valuations = categoryData.map(c => c.totalValuation);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'SKU Count',
            data: skuCounts,
            backgroundColor: '#2563EB',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Valuation ($)',
            data: valuations,
            backgroundColor: 'rgba(124, 58, 237, 0.75)',
            borderRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (context.datasetIndex === 1) {
                  return `Valuation: $${Number(context.raw).toLocaleString()}`;
                }
                return `SKUs: ${context.raw}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'Number of SKUs', font: { size: 10 } },
            grid: { color: '#F1F5F9' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            title: { display: true, text: 'Valuation ($)', font: { size: 10 } },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  /**
   * Render Price Tier Distribution Doughnut Chart
   */
  renderSkuPriceTiersChart(canvasId, priceTiers) {
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const labels = priceTiers.map(t => t.label);
    const counts = priceTiers.map(t => t.count);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'],
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const tier = priceTiers[context.dataIndex];
                return `${tier.label}: ${tier.count} SKUs ($${tier.valuation.toLocaleString()})`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }
}

export const chartManager = new ChartManager();
