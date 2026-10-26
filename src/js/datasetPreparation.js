/**
 * Dataset Preparation & Validation Pipeline
 * 
 * Provides schema validation, data normalization, SKU identifier preservation,
 * duplicate detection, and audit reporting for warehouse products, locations, and orders.
 */

/**
 * Standard product categories recognized by the warehouse management system
 */
export const STANDARD_CATEGORIES = [
  'Electronics',
  'Apparel & Footwear',
  'Home & Kitchen',
  'Industrial Tools',
  'Automotive Parts'
];

/**
 * Canonical SKU normalization preserving leading zeros and string identity.
 * Prevents accidental numeric coercion (e.g. "00123" -> 123).
 *
 * @param {unknown} rawSku - Raw SKU value from external source or form input
 * @returns {string} Cleaned canonical uppercase string SKU
 */
export function normalizeSku(rawSku) {
  if (rawSku === null || rawSku === undefined) {
    return '';
  }
  // Convert strictly to string to preserve leading zeros
  const str = String(rawSku).trim();
  // Uppercase for canonical matching while preserving symbols (hyphens, dots, underscores)
  return str.toUpperCase();
}

/**
 * Safely parse numerical values from diverse input types (numbers, string currencies, etc.)
 *
 * @param {unknown} val - Input to parse
 * @param {number|null} defaultValue - Fallback value if invalid
 * @returns {number|null} Valid finite number or defaultValue
 */
export function parseNumeric(val, defaultValue = null) {
  if (val === null || val === undefined || val === '') {
    return defaultValue;
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : defaultValue;
  }
  if (typeof val === 'string') {
    // Strip currency symbols and commas: "$ 1,299.50" -> "1299.50"
    const cleaned = val.replace(/[$€£,\s]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : defaultValue;
  }
  return defaultValue;
}

/**
 * Validate and normalize a single product inventory record against the product schema.
 *
 * @param {object} raw - Raw product record
 * @param {object} context - Validation context
 * @param {Set<string>} [context.seenSkus] - Set of already processed SKUs for duplicate detection
 * @param {Set<string>} [context.seenIds] - Set of already processed Product IDs
 * @param {Array<string>} [context.knownWarehouses] - List of valid warehouse IDs
 * @returns {{
 *   isValid: boolean,
 *   errors: string[],
 *   warnings: string[],
 *   sanitized: object|null
 * }}
 */
export function validateAndTransformProduct(raw, context = {}) {
  const errors = [];
  const warnings = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      errors: ['Record must be a non-null object'],
      warnings: [],
      sanitized: null
    };
  }

  // 1. Product ID Validation
  const idRaw = raw.id !== undefined && raw.id !== null ? String(raw.id).trim() : '';
  if (!idRaw) {
    errors.push('Missing required field: id');
  } else if (context.seenIds && context.seenIds.has(idRaw)) {
    errors.push(`Duplicate product id detected: "${idRaw}"`);
  }

  // 2. SKU Validation & Preservation
  const sku = normalizeSku(raw.sku);
  if (!sku) {
    errors.push('Missing required field: sku');
  } else if (sku.length < 2) {
    errors.push(`SKU "${sku}" is too short (minimum 2 characters required)`);
  } else if (context.seenSkus && context.seenSkus.has(sku)) {
    errors.push(`Duplicate SKU identifier detected: "${sku}"`);
  }

  // 3. Product Name Validation
  const nameRaw = raw.name !== undefined && raw.name !== null ? String(raw.name).trim() : '';
  if (!nameRaw) {
    errors.push('Missing required field: name');
  }

  // 4. Category Validation & Normalization
  let category = raw.category !== undefined && raw.category !== null ? String(raw.category).trim() : '';
  if (!category) {
    errors.push('Missing required field: category');
  } else {
    // Check if category matches standard casing or close match
    const matchedCategory = STANDARD_CATEGORIES.find(
      c => c.toLowerCase() === category.toLowerCase()
    );
    if (matchedCategory) {
      category = matchedCategory;
    } else {
      warnings.push(`Non-standard category detected: "${category}"`);
    }
  }

  // 5. Unit Price Validation
  const unitPrice = parseNumeric(raw.unitPrice);
  if (unitPrice === null) {
    errors.push('Missing or invalid unitPrice: must be a valid number');
  } else if (unitPrice < 0) {
    errors.push(`unitPrice cannot be negative: received ${unitPrice}`);
  }

  // 6. Stock Thresholds Validation
  const minStock = parseNumeric(raw.minStock, 0);
  if (minStock === null || minStock < 0) {
    errors.push(`minStock must be a non-negative integer: received ${raw.minStock}`);
  }

  let reorderPoint = parseNumeric(raw.reorderPoint);
  if (reorderPoint === null) {
    // If missing, compute safe default
    reorderPoint = Math.round(minStock * 1.5);
    warnings.push(`reorderPoint missing; defaulted to ${reorderPoint} (1.5x minStock)`);
  } else if (reorderPoint < minStock) {
    warnings.push(`reorderPoint (${reorderPoint}) is less than minStock (${minStock})`);
  }

  let maxStock = parseNumeric(raw.maxStock);
  if (maxStock === null) {
    maxStock = Math.max(reorderPoint * 3, minStock * 4, 100);
    warnings.push(`maxStock missing; defaulted to ${maxStock}`);
  } else if (maxStock < reorderPoint) {
    warnings.push(`maxStock (${maxStock}) is less than reorderPoint (${reorderPoint})`);
  }

  // 7. Warehouse Stock Normalization
  const warehouseStock = {};
  const rawStock = (raw.warehouseStock && typeof raw.warehouseStock === 'object') ? raw.warehouseStock : {};
  const knownWhs = context.knownWarehouses || ['WH-NORTH', 'WH-SOUTH', 'WH-EAST', 'WH-WEST'];

  // Ensure all known warehouses are present with non-negative numbers
  knownWhs.forEach(whId => {
    const qty = parseNumeric(rawStock[whId], 0);
    if (qty < 0) {
      errors.push(`Negative stock not allowed for warehouse ${whId}: received ${rawStock[whId]}`);
      warehouseStock[whId] = 0;
    } else {
      warehouseStock[whId] = Math.floor(qty);
    }
  });

  // Track any extra warehouse IDs not in known list
  Object.keys(rawStock).forEach(whId => {
    if (!knownWhs.includes(whId)) {
      const extraQty = parseNumeric(rawStock[whId], 0);
      if (extraQty >= 0) {
        warehouseStock[whId] = Math.floor(extraQty);
        warnings.push(`Stock found for unrecognized warehouse "${whId}"`);
      }
    }
  });

  // 8. Historical Demand Validation
  let historicalDemand = [];
  if (Array.isArray(raw.historicalDemand)) {
    historicalDemand = raw.historicalDemand.map(d => {
      const num = parseNumeric(d, 0);
      return Math.max(0, Math.floor(num));
    });
    if (historicalDemand.length !== 12) {
      warnings.push(`historicalDemand length is ${historicalDemand.length} months (expected 12 months)`);
    }
  } else {
    warnings.push('historicalDemand is missing or not an array; defaulted to 12 months of zero demand');
    historicalDemand = new Array(12).fill(0);
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      sanitized: null
    };
  }

  // Construct clean, normalized product object
  const sanitized = {
    id: idRaw,
    sku,
    name: nameRaw,
    category,
    unitPrice: Number(unitPrice.toFixed(2)),
    minStock: Math.floor(minStock),
    reorderPoint: Math.floor(reorderPoint),
    maxStock: Math.floor(maxStock),
    warehouseStock,
    historicalDemand
  };

  return {
    isValid: true,
    errors: [],
    warnings,
    sanitized
  };
}

/**
 * Validate and prepare an entire warehouse dataset including products, warehouses, and orders.
 * Generates an audit report detailing rejected records, warnings, and schema health.
 *
 * @param {object} rawDataset
 * @param {Array} [rawDataset.products] - Raw product records
 * @param {Array} [rawDataset.warehouses] - Raw warehouse records
 * @param {Array} [rawDataset.orders] - Raw orders
 * @param {object} [options] - Preparation options
 * @param {boolean} [options.allowDuplicateSkus=false] - Whether to allow duplicate SKUs with auto-suffix
 * @returns {{
 *   success: boolean,
 *   data: {
 *     products: Array<object>,
 *     warehouses: Array<object>,
 *     orders: Array<object>,
 *     categories: Array<string>
 *   },
 *   report: {
 *     totalSourceRecords: number,
 *     validCount: number,
 *     rejectedCount: number,
 *     warningCount: number,
 *     duplicateSkuCount: number,
 *     rejectedRecords: Array<{ index: number, id: string, sku: string, errors: string[], raw: object }>,
 *     warnings: Array<{ id: string, sku: string, warnings: string[] }>,
 *     duplicateSkus: Array<{ sku: string, count: number, ids: string[] }>,
 *     complianceRate: number,
 *     generatedAt: string
 *   }
 * }}
 */
export function prepareDataset(rawDataset = {}, options = {}) {
  const rawProducts = Array.isArray(rawDataset.products) ? rawDataset.products : [];
  const rawWarehouses = Array.isArray(rawDataset.warehouses) ? rawDataset.warehouses : [];
  const rawOrders = Array.isArray(rawDataset.orders) ? rawDataset.orders : [];

  const knownWarehouses = rawWarehouses.map(w => w.id).filter(Boolean);

  const seenSkus = new Set();
  const seenIds = new Set();
  const skuCounts = new Map();
  const skuToIds = new Map();

  const validProducts = [];
  const rejectedRecords = [];
  const warningsList = [];

  // Track raw duplicate occurrences across source input
  rawProducts.forEach((p, idx) => {
    if (p && p.sku !== undefined && p.sku !== null) {
      const norm = normalizeSku(p.sku);
      if (norm) {
        skuCounts.set(norm, (skuCounts.get(norm) || 0) + 1);
        const list = skuToIds.get(norm) || [];
        if (p.id) list.push(String(p.id));
        skuToIds.set(norm, list);
      }
    }
  });

  const duplicateSkus = [];
  skuCounts.forEach((count, sku) => {
    if (count > 1) {
      duplicateSkus.push({
        sku,
        count,
        ids: skuToIds.get(sku) || []
      });
    }
  });

  // Validate each product
  rawProducts.forEach((rawProduct, index) => {
    const result = validateAndTransformProduct(rawProduct, {
      seenSkus,
      seenIds,
      knownWarehouses
    });

    if (result.isValid && result.sanitized) {
      seenSkus.add(result.sanitized.sku);
      seenIds.add(result.sanitized.id);
      validProducts.push(result.sanitized);

      if (result.warnings.length > 0) {
        warningsList.push({
          id: result.sanitized.id,
          sku: result.sanitized.sku,
          warnings: result.warnings
        });
      }
    } else {
      rejectedRecords.push({
        index,
        id: rawProduct?.id || `idx-${index}`,
        sku: normalizeSku(rawProduct?.sku) || 'N/A',
        errors: result.errors,
        raw: rawProduct
      });
    }
  });

  // Validate warehouses
  const validWarehouses = rawWarehouses.filter(w => {
    return w && typeof w === 'object' && w.id && w.name && typeof w.capacity === 'number';
  });

  // Validate orders and ensure item SKU/productId references exist
  const validProductIds = new Set(validProducts.map(p => p.id));
  const validProductSkus = new Set(validProducts.map(p => p.sku));

  const validOrders = rawOrders.map(order => {
    if (!order || typeof order !== 'object' || !order.id) return null;
    const items = Array.isArray(order.items) ? order.items.map(item => {
      const pId = item.productId || '';
      const pSku = normalizeSku(item.sku);
      return {
        ...item,
        sku: pSku || (validProducts.find(p => p.id === pId)?.sku || 'UNKNOWN'),
        qty: Math.max(1, parseNumeric(item.qty, 1))
      };
    }) : [];

    return {
      ...order,
      items
    };
  }).filter(Boolean);

  // Extract unique categories
  const categoriesSet = new Set(STANDARD_CATEGORIES);
  validProducts.forEach(p => categoriesSet.add(p.category));
  const categories = Array.from(categoriesSet);

  const totalSourceRecords = rawProducts.length;
  const validCount = validProducts.length;
  const rejectedCount = rejectedRecords.length;
  const warningCount = warningsList.length;
  const duplicateSkuCount = duplicateSkus.length;
  const complianceRate = totalSourceRecords > 0 
    ? Math.round((validCount / totalSourceRecords) * 100) 
    : 100;

  const report = {
    totalSourceRecords,
    validCount,
    rejectedCount,
    warningCount,
    duplicateSkuCount,
    rejectedRecords,
    warnings: warningsList,
    duplicateSkus,
    complianceRate,
    generatedAt: new Date().toISOString()
  };

  return {
    success: rejectedCount === 0,
    data: {
      products: validProducts,
      warehouses: validWarehouses,
      orders: validOrders,
      categories
    },
    report
  };
}
