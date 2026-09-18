# 📦 Warehouse Inventory & Demand Dashboard

An enterprise-grade, browser-based warehouse operations dashboard visualizing stock levels across multi-location datasets, featuring an interactive pick/pack fulfillment workflow simulator and a client-side statistical forecasting engine computing demand trends in real time.

---

## 🌟 Objectives & Key Highlights

- **Multi-Location Inventory Monitoring**: Track real-time stock balances across 4 regional fulfillment centers (Chicago, Dallas, New York, Los Angeles).
- **Client-Side Statistical Demand Forecasting**: In-browser demand projections generated via Least Squares Linear Regression blended with 3-Month Weighted Moving Average (WMA) recency smoothing.
- **Animated Pick/Pack Workflow**: Interactive 4-stage fulfillment pipeline simulation (`Order Created` ➔ `Picking` ➔ `Packing` ➔ `Ready`).
- **Zero Third-Party Backend Dependencies**: 100% offline-ready client-side execution with bundled sample datasets.
- **Modern Responsive SaaS Design System**: Built with clean CSS tokens, responsive flex/grid layouts, interactive Chart.js visualizations, and fast search filtering.

---

## 🚀 Features Overview

| Feature | Description |
| :--- | :--- |
| **Dynamic KPI Dashboard** | Computes total inventory units, valuation ($), active SKUs, warehouse count, low/critical stock counts, and average monthly demand. |
| **Interactive Filters** | Filter data reactively by Warehouse Location, Product Category, Stock Level Status (In Stock, Low, Critical), or real-time text query. |
| **Multi-Location Analytics** | Visualizes stock distribution vs total capacity utilization across regional warehouses. |
| **Demand Trends & Forecast** | Displays 12-month historical demand trends against 3-month and 6-month projected demand curves with confidence bands. |
| **Order Fulfillment Pipeline** | Live step-by-step animated pick/pack execution with telemetry event logs and status badge updates. |
| **Master Inventory Ledger** | Searchable table with visual capacity progress bars, reorder alerts, category badges, and unit valuations. |

---

## 🏗️ System Architecture

The application is structured as a modular Vanilla JavaScript (ES Modules) frontend bundled with Vite and Chart.js.

```
warehouse-inventory-demand-dashboard/
│
├── index.html                  # Main application layout and component containers
├── README.md                   # Technical documentation
├── package.json                # Project dependencies and Vite build scripts
├── .gitignore                  # Source control ignore configuration
│
├── src/
│   ├── css/
│   │   └── style.css          # Design system, CSS variables, and layout rules
│   │
│   ├── js/
│   │   ├── app.js             # Main application orchestrator & event coordinator
│   │   ├── data.js            # Repository data service & filtering layer
│   │   ├── analytics.js       # Dynamic KPI calculation & aggregation engine
│   │   ├── forecast.js        # Statistical demand forecasting algorithm
│   │   └── charts.js          # Chart.js visualization wrappers
│   │
│   └── components/
│       ├── dashboard.js       # KPI card rendering component
│       ├── inventory.js       # Inventory table & stock status component
│       ├── demand.js          # Demand charts & analytics component
│       ├── forecast.js        # Forecasting controls & metrics component
│       └── workflow.js        # Animated pick/pack workflow simulator
│
├── data/
│   └── warehouse-data.js      # Bundled multi-location sample dataset
│
└── assets/
    └── README.md              # Visual assets directory info
```

---

## 🔮 Data & Forecasting Workflow

### 1. Data Processing Flow
```
[ Bundled Dataset ] ──➔ [ Data Repository Service ] ──➔ [ Analytics Engine ]
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            ▼                                   ▼
                                     [ KPI Metrics ]                 [ Stock Distribution ]
```

### 2. Statistical Forecasting Algorithm
The forecasting engine computes future demand projections entirely in client memory without external ML API calls:
- **Linear Trend Slope ($m$)**: Calculated via Least Squares Linear Regression ($y = m \cdot x + b$) across historical monthly data points.
- **Weighted Moving Average (WMA)**: Applies exponential weights ($w_1=0.2, w_2=0.3, w_3=0.5$) to the 3 most recent months to capture recent demand momentum.
- **Blended Projection**:
  $$\text{Forecast}(t) = 0.65 \times \text{LinearTrend}(t) + 0.35 \times (\text{WMA} + m \cdot \Delta t)$$
- **Confidence Interval**: Computes a dynamic $\pm 8\%$ error boundary for visual risk assessment.

---

## 🚚 Animated Pick/Pack Workflow

```
[ Order Created ] ──➔ [ Picking ] ──➔ [ Packing ] ──➔ [ Ready for Dispatch ]
     (Step 1)            (Step 2)          (Step 3)            (Step 4)
```

1. **Order Created**: Triggered when a new customer purchase order enters the warehouse queue.
2. **Picking**: Warehouse operators retrieve SKUs from bin locations in the assigned warehouse.
3. **Packing**: Quality verification, protective packaging, and shipping label attachment.
4. **Ready**: Final staging for courier dispatch and inventory deduction.

Clicking **"Start/Simulate Flow"** executes a live animated step-by-step progress pipeline with time-stamped terminal logs.

---

## 🎨 UI Design System & Color Palette

The interface follows modern SaaS design standards using clean typography (Inter), rounded card surfaces, subtle shadows, and a dedicated color system:

- **Primary Accent**: `#2563EB` (Royal Blue)
- **Secondary Accent**: `#7C3AED` (Deep Violet)
- **Success / In Stock**: `#059669` (Emerald Green)
- **Warning / Low Stock**: `#F59E0B` (Amber)
- **Danger / Critical**: `#DC2626` (Crimson Red)
- **Background**: `#F8FAFC` (Slate Tint)
- **Dark Text**: `#0F172A` (Navy Slate)
- **Muted Text**: `#64748B` (Cool Gray)

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Execution

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

3. **Build Production Bundle**:
   ```bash
   npm run build
   ```

4. **Preview Production Build**:
   ```bash
   npm run preview
   ```

---

## 📈 Future Enhancements

- 🔔 Automated Reorder Purchase Order (PO) PDF generation.
- 🗺️ Interactive GIS Map visualization for warehouse locations.
- 📱 Barcode & QR Code scanner simulation for mobile picking devices.
- 💾 LocalStorage persistence for user custom inventory edits.

---

## 📄 License

MIT License - free for educational, portfolio, and commercial demonstration use.
