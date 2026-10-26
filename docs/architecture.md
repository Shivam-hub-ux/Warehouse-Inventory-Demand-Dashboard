# 🏛️ Client-Side Data Layer & SKU Analytics Architecture

This document details the system design, reactive state lifecycle, query interfaces, and statistical SKU analytics formulas powering the **Warehouse Inventory & Demand Dashboard**.

---

## 1. System Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Data Sources                         │
│  [ Bundled Dataset / External API / Local Storage ]    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      Dataset Preparation & Validation Pipeline         │
│           (src/js/datasetPreparation.js)               │
│  - Strict Schema Validation                            │
│  - String SKU Normalization (Preserving Leading Zeros) │
│  - Duplicate Detection & Audit Reporting               │
└───────────────────────────┬────────────────────────────┘
                            │ Clean Data + Audit Report
                            ▼
┌────────────────────────────────────────────────────────┐
│           Client-Side Data Repository Layer            │
│                  (src/js/data.js)                      │
│  - State Machine: idle | loading | success | empty | error
│  - Reactive Event Subscriptions (`subscribe`, `notify`)│
│  - Multi-Criteria Filtering (Warehouse, Cat, Search)   │
│  - Flexible Sorting (SKU, Price, Stock, Valuation)     │
│  - Pagination Support (`getProductsPaged`)             │
│  - SKU Accessors (`getProductBySku`, `checkSkuExists`) │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│    Forecasting Engine       │ │    SKU Analytics Engine     │
│    (src/js/forecast.js)     │ │   (src/js/skuAnalytics.js)  │
│ - Least Squares Regression  │ │ - Price Statistics (Med/Avg)│
│ - 3-Month WMA Recency       │ │ - Stock Velocity & Run-out  │
│ - Dynamic Confidence Bounds │ │ - Price Tiers & Distribution│
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
               └──────────────┬────────────────┘
                              ▼
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   - index.html (Responsive SaaS Layout & Tokens)       │
│   - src/components/skuAnalytics.js (Ledger & Cards)   │
│   - src/components/dashboard.js (KPI Summary Cards)    │
│   - src/components/inventory.js (Inventory Table)      │
│   - src/js/charts.js (Chart.js Visualization Wrappers) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Client-Side Data Layer (`DataRepository`)

The `DataRepository` class manages runtime state, asynchronous data loading, caching, and reactive updates without relying on heavyweight third-party frameworks.

### 2.1 State Model
```typescript
type DataStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface RepositoryState {
  status: DataStatus;
  error: string | null;
  lastUpdated: string | null;
  validationReport: ValidationReport | null;
}
```

- **`loading`**: Emitted when asynchronous data ingestion begins. UI renders loading indicators.
- **`success`**: Emitted when dataset preparation passes and verified records are available.
- **`empty`**: Emitted when the data source contains 0 valid product records.
- **`error`**: Emitted when dataset ingestion or parsing encounters fatal errors.

### 2.2 Subscriptions
Components register reactive listeners via:
```javascript
const unsubscribe = dataRepository.subscribe((state, repo) => {
  // Re-render UI components on state transitions or inventory mutations
});
```

### 2.3 Query & Accessor API
- **`getProducts(filters)`**: Query products filtered by `warehouse`, `category`, `stockStatus`, `search`, and price boundaries, with optional sorting by `sku`, `price`, `stock`, `valuation`, or `demand`.
- **`getProductsPaged(filters, { page, pageSize })`**: Returns paginated subset with `totalItems`, `totalPages`, `hasNext`, and `hasPrev`.
- **`getProductBySku(sku)`**: Case-insensitive canonical SKU lookup.
- **`checkSkuExists(sku)`**: Fast boolean catalog membership check.
- **`getUniqueSkus()`**: Returns unique list of registered SKUs.
- **`mutateProductStock(skuOrId, warehouseId, deltaQty)`**: Optimistic local mutation and subscriber notification.

---

## 3. SKU Analytics Engine (`skuAnalytics.js`)

Computes business intelligence directly from verified operational data:

### 3.1 Price Statistics
- **Minimum Price**: $\min(P)$
- **Maximum Price**: $\max(P)$
- **Average Price**: $\frac{1}{N} \sum_{i=1}^N P_i$
- **Median Price**: Middle value of sorted prices, or average of middle two.

### 3.2 Inventory Quantity & Valuation
- **Total Stock per SKU**: Sum across all fulfillment centers or selected warehouse:
  $$\text{Stock}_i = \sum_{w \in W} \text{warehouseStock}_{i, w}$$
- **SKU Valuation**: $\text{Valuation}_i = \text{Stock}_i \times \text{unitPrice}_i$
- **Stock-to-Capacity Ratio**: $\min\left(100\%, \frac{\text{Stock}_i}{\text{maxStock}_i} \times 100\right)$

### 3.3 Inventory Velocity & Run-out Risk (Months of Supply)
Measures how many months the current on-hand inventory will last based on the most recent monthly demand velocity:
$$\text{Months of Supply} = \begin{cases} \frac{\text{Stock}_i}{D_{i, \text{latest}}}, & \text{if } D_{i, \text{latest}} > 0 \\ \text{null (Unavailable)}, & \text{if } D_{i, \text{latest}} = 0 \end{cases}$$

- **Critical Velocity Risk**: Flagged when $\text{Months of Supply} < 1.0$ month.
- **Safe Handling**: Does **not** fabricate demand; explicitly returns `null` when historical demand is zero.

### 3.4 Price Tier Categorization
Classifies SKUs into standard catalog tiers:
1. **Budget**: $< \$50$
2. **Standard**: $\$50 - \$99.99$
3. **Mid-Tier**: $\$100 - \$249.99$
4. **Premium**: $\$250+$
