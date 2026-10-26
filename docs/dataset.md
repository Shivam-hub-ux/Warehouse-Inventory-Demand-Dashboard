# 📊 Dataset Preparation & Schema Documentation

This document describes the schema specifications, normalization rules, data integrity validations, and audit reporting mechanisms for the **Warehouse Inventory & Demand Dashboard**.

---

## 1. Data Schemas

### 1.1 Product & SKU Record Schema (`ProductSchema`)

Every product inventory item complies with the following schema:

| Field | Type | Required | Constraints / Validation Rules |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | Unique identifier (e.g., `PRD-101`). Cannot be empty. Must not collide with existing IDs. |
| `sku` | `string` | **Yes** | Strict canonical string identifier (e.g., `00123-A`, `ELE-UHD-55`). Preserves leading zeros. Converted to uppercase, trimmed. Min length: 2 characters. |
| `name` | `string` | **Yes** | Descriptive product name. Cannot be empty. |
| `category` | `string` | **Yes** | Product category name. Normalized to recognized catalog taxonomy. |
| `unitPrice` | `number` | **Yes** | Unit wholesale/retail price. Must be $\ge 0$. Currency strings (e.g. `"$149.50"`) are safely parsed to float. Negative values or non-numbers trigger record rejection. |
| `reorderPoint` | `number` | No | Threshold stock level triggering restocking alerts. Must be non-negative integer. If missing, defaults to $\approx 1.5 \times \text{minStock}$. |
| `minStock` | `number` | **Yes** | Safety stock threshold. Must be a non-negative integer. |
| `maxStock` | `number` | No | Upper storage capacity limit for the SKU. Must be $\ge \text{reorderPoint}$. If missing, calculated from threshold ratios. |
| `warehouseStock` | `Record<string, number>` | **Yes** | Dictionary mapping warehouse IDs to integer quantities ($\ge 0$). Missing warehouses default to `0`. Negative values trigger record rejection. |
| `historicalDemand`| `number[]` | No | 12-month array of non-negative integer demand figures. Missing arrays default to 12 months of zero demand. |

### 1.2 Warehouse Location Schema (`WarehouseSchema`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique warehouse code (e.g., `WH-NORTH`, `WH-SOUTH`). |
| `name` | `string` | Human-readable facility name. |
| `location` | `string` | City and state location. |
| `manager` | `string` | Warehouse facility operations manager. |
| `capacity` | `number` | Total physical unit capacity ($\ge 0$). |
| `color` | `string` | Distinct hex color code for UI visualization. |

### 1.3 Order Record Schema (`OrderSchema`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique purchase/sales order ID (e.g., `ORD-9101`). |
| `customer` | `string` | Client / retailer account name. |
| `items` | `Array<{ productId, productName, qty, sku }>` | Array of ordered line items with verified SKUs and quantities $> 0$. |
| `warehouseId` | `string` | Target fulfillment facility. |
| `priority` | `'Standard' \| 'Express' \| 'Overnight'` | Shipping fulfillment priority level. |
| `status` | `'Order Created' \| 'Picking' \| 'Packing' \| 'Ready'` | Current stage in the 4-phase pick/pack workflow. |
| `timestamp` | `string` | Time elapsed or ISO datetime string. |

---

## 2. Dataset Preparation & Normalization Pipeline

The preparation pipeline is implemented in `src/js/datasetPreparation.js` and provides automated ingestion, sanitation, and validation:

### 2.1 Critical Rule: SKU Identifier Preservation
- **Preservation of Leading Zeros**: SKU codes frequently include leading zeros (e.g. `"00123"`, `"0982-X"`). Accidental conversion into numbers (e.g. `Number(sku)` $\rightarrow 123$) corrupts warehouse barcoding systems.
- **Normalization Function**: `normalizeSku(raw)` enforces strict string coercion (`String(raw).trim().toUpperCase()`) and guarantees leading zeros are intact.

### 2.2 Data Cleaning & Type Coercion
- **Currency & Numeric Parsing**: `parseNumeric(val, default)` cleans strings like `"$ 1,249.99"` into float `1249.99` while flagging non-numeric inputs.
- **Category Normalization**: Compares category strings case-insensitively against catalog taxonomy (`Electronics`, `Apparel & Footwear`, `Home & Kitchen`, `Industrial Tools`, `Automotive Parts`) to prevent casing fragmentation.
- **Boundary Corrections**: Enforces $\text{maxStock} \ge \text{reorderPoint} \ge \text{minStock} \ge 0$.

### 2.3 Duplicate Detection
- Scans entire dataset before admission to identify duplicate SKU occurrences and duplicate IDs.
- Tracks occurrence counts and offending record identifiers in the validation report.

### 2.4 Referential Integrity
- Validates that each product's `warehouseStock` keys reference legitimate warehouse facilities.
- Cross-references line-item orders against the validated SKU catalog.

---

## 3. Validation Audit Report Structure

Every dataset ingestion produces an auditable validation report object:

```typescript
interface ValidationReport {
  totalSourceRecords: number;     // Total raw product records received
  validCount: number;             // Clean records admitted to catalog
  rejectedCount: number;          // Problematic records rejected
  warningCount: number;           // Non-fatal warnings flagged
  duplicateSkuCount: number;      // Number of duplicate SKU identifiers
  rejectedRecords: Array<{        // Itemized list of rejected records with exact error reasons
    index: number;
    id: string;
    sku: string;
    errors: string[];
    raw: unknown;
  }>;
  warnings: Array<{               // Non-fatal advisory notices
    id: string;
    sku: string;
    warnings: string[];
  }>;
  duplicateSkus: Array<{          // Exact duplicates detected
    sku: string;
    count: number;
    ids: string[];
  }>;
  complianceRate: number;         // Percentage (0 - 100%) of compliant records
  generatedAt: string;            // ISO 8601 timestamp
}
```
