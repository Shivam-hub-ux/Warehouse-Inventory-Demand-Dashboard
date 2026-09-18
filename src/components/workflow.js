/**
 * Animated Pick/Pack Workflow Component
 * Simulates warehouse order fulfillment lifecycle across 4 distinct operational stages.
 */

import { dataRepository } from '../js/data.js';

class WorkflowSimulator {
  constructor() {
    this.currentStepIndex = 0;
    this.isSimulating = false;
    this.simulationTimer = null;
    this.activeOrder = null;
    this.steps = [
      { id: 'created', label: 'Order Created', icon: '📝', pct: 0 },
      { id: 'picking', label: 'Picking', icon: '🚜', pct: 33 },
      { id: 'packing', label: 'Packing', icon: '📦', pct: 66 },
      { id: 'ready', label: 'Ready', icon: '🚚', pct: 100 }
    ];
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    const container = document.getElementById('workflow-container');
    if (!container) return;

    const orders = dataRepository.getOrders();
    this.activeOrder = orders[0] || {
      id: 'ORD-9901',
      customer: 'Global Logistics Hub',
      priority: 'Express',
      items: [{ productName: '55" Ultra HD Smart Display', qty: 2 }]
    };

    container.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">
            <span>🚚 Animated Pick/Pack Fulfillment Pipeline</span>
          </div>
          <div class="card-subtitle">Real-time visual order processing through warehouse fulfillment nodes</div>
        </div>
        <div>
          <button id="btn-start-simulation" class="btn-primary">
            <span>▶ Start/Simulate Flow</span>
          </button>
        </div>
      </div>

      <!-- Order Summary Strip -->
      <div style="background-color: var(--bg-main); padding: 0.85rem 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
        <div>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Active Simulation Order</span>
          <div style="font-weight: 700; color: var(--text-dark);" id="wf-order-id">${this.activeOrder.id} - ${this.activeOrder.customer}</div>
        </div>
        <div>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Items in Shipment</span>
          <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-dark);" id="wf-order-items">
            ${this.activeOrder.items.map(i => `${i.productName} (${i.qty}x)`).join(', ')}
          </div>
        </div>
        <div>
          <span class="badge badge-success" id="wf-order-priority">${this.activeOrder.priority} Priority</span>
        </div>
      </div>

      <!-- Pipeline Visualization -->
      <div class="workflow-pipeline">
        <div class="workflow-progress-line" id="wf-progress-bar" style="width: 0%;"></div>
        
        ${this.steps.map((step, idx) => `
          <div class="workflow-step ${idx === 0 ? 'active' : ''}" id="wf-step-${idx}">
            <div class="step-node">${step.icon}</div>
            <div class="step-label">${step.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Execution Log & Telemetry -->
      <div style="margin-top: 1rem; background-color: #0F172A; color: #38BDF8; font-family: monospace; font-size: 0.8rem; padding: 1rem; border-radius: var(--radius-md); max-height: 120px; overflow-y: auto; border: 1px solid #1E293B;" id="wf-log-box">
        <div>[System Log Initialized] Ready for fulfillment simulation playback...</div>
      </div>
    `;
  }

  bindEvents() {
    const btn = document.getElementById('btn-start-simulation');
    if (btn) {
      btn.addEventListener('click', () => this.startSimulation());
    }
  }

  startSimulation() {
    if (this.isSimulating) return;

    this.isSimulating = true;
    this.currentStepIndex = 0;
    
    const btn = document.getElementById('btn-start-simulation');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ Simulating Flow...</span>`;
    }

    this.logEvent(`[${new Date().toLocaleTimeString()}] 🚀 Order simulation triggered for ${this.activeOrder.id}`);
    this.updateStepUI();

    this.simulationTimer = setInterval(() => {
      this.currentStepIndex++;

      if (this.currentStepIndex >= this.steps.length) {
        clearInterval(this.simulationTimer);
        this.isSimulating = false;
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<span>▶ Re-run Simulation</span>`;
        }
        this.logEvent(`[${new Date().toLocaleTimeString()}] ✅ Order ${this.activeOrder.id} is READY FOR SHIPMENT! Pipeline complete.`);
        dataRepository.updateOrderStatus(this.activeOrder.id, 'Ready');
        return;
      }

      const currentStep = this.steps[this.currentStepIndex];
      this.logEvent(`[${new Date().toLocaleTimeString()}] 🔄 Stage advanced: ${currentStep.label} (${currentStep.pct}% complete)`);
      this.updateStepUI();
    }, 1800);
  }

  updateStepUI() {
    const progressBar = document.getElementById('wf-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${this.steps[this.currentStepIndex].pct}%`;
    }

    this.steps.forEach((_, idx) => {
      const el = document.getElementById(`wf-step-${idx}`);
      if (el) {
        el.classList.remove('active', 'completed');
        if (idx < this.currentStepIndex) {
          el.classList.add('completed');
        } else if (idx === this.currentStepIndex) {
          el.classList.add('active');
        }
      }
    });
  }

  logEvent(msg) {
    const logBox = document.getElementById('wf-log-box');
    if (logBox) {
      const div = document.createElement('div');
      div.style.marginBottom = '4px';
      div.textContent = msg;
      logBox.appendChild(div);
      logBox.scrollTop = logBox.scrollHeight;
    }
  }
}

export const workflowSimulator = new WorkflowSimulator();
