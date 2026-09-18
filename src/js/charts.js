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
    const historicalSeries = [...forecastData.historicalValues];
    for (let i = 0; i < forecastLabels.length; i++) {
      historicalSeries.push(null);
    }

    const forecastSeries = new Array(historicalLabels.length - 1).fill(null);
    // Connect to the last historical point
    forecastSeries.push(forecastData.historicalValues[forecastData.historicalValues.length - 1]);
    forecastSeries.push(...forecastData.forecastValues);

    const upperBoundSeries = new Array(historicalLabels.length - 1).fill(null);
    upperBoundSeries.push(forecastData.historicalValues[forecastData.historicalValues.length - 1]);
    upperBoundSeries.push(...forecastData.upperBoundValues);

    const lowerBoundSeries = new Array(historicalLabels.length - 1).fill(null);
    lowerBoundSeries.push(forecastData.historicalValues[forecastData.historicalValues.length - 1]);
    lowerBoundSeries.push(...forecastData.lowerBoundValues);

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
}

export const chartManager = new ChartManager();
