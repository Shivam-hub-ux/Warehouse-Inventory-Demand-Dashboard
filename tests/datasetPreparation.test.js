import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSku,
  parseNumeric,
  validateAndTransformProduct,
  prepareDataset
} from '../src/js/datasetPreparation.js';
import {
  SAMPLE_RAW_DATASET_VALID,
  SAMPLE_RAW_DATASET_WITH_ANOMALIES
} from '../src/data/fixtures.js';

describe('Dataset Preparation: normalizeSku', () => {
  it('preserves leading zeros and prevents numeric coercion', () => {
    assert.equal(normalizeSku('00123'), '00123');
    assert.equal(normalizeSku('00045-A'), '00045-A');
    assert.equal(normalizeSku('099'), '099');
  });

  it('converts numbers to string representation without losing value', () => {
    assert.equal(normalizeSku(101), '101');
  });

  it('trims whitespace and converts to uppercase', () => {
    assert.equal(normalizeSku('  ele-uhd-55  '), 'ELE-UHD-55');
  });

  it('handles null and undefined safely by returning empty string', () => {
    assert.equal(normalizeSku(null), '');
    assert.equal(normalizeSku(undefined), '');
  });
});

describe('Dataset Preparation: parseNumeric', () => {
  it('parses valid numbers directly', () => {
    assert.equal(parseNumeric(49.99), 49.99);
    assert.equal(parseNumeric(0), 0);
  });

  it('parses formatted currency strings with symbols and commas', () => {
    assert.equal(parseNumeric('$149.50'), 149.50);
    assert.equal(parseNumeric('  $ 1,250.00 '), 1250.00);
  });

  it('returns default value for invalid or missing inputs', () => {
    assert.equal(parseNumeric('invalid-number', null), null);
    assert.equal(parseNumeric(null, 0), 0);
    assert.equal(parseNumeric(undefined, 10), 10);
  });
});

describe('Dataset Preparation: validateAndTransformProduct', () => {
  it('accepts and sanitizes a valid product with leading zero SKU', () => {
    const raw = {
      id: 'PRD-999',
      sku: '00789-X',
      name: 'Precision Micrometer',
      category: 'industrial tools',
      unitPrice: '$89.95',
      minStock: 10,
      reorderPoint: 20,
      maxStock: 100,
      warehouseStock: { 'WH-NORTH': 30, 'WH-SOUTH': 25 },
      historicalDemand: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    };

    const result = validateAndTransformProduct(raw);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.sanitized.sku, '00789-X');
    assert.equal(result.sanitized.category, 'Industrial Tools');
    assert.equal(result.sanitized.unitPrice, 89.95);
    assert.equal(result.sanitized.warehouseStock['WH-NORTH'], 30);
  });

  it('rejects product with missing required fields', () => {
    const raw = {
      id: '',
      sku: '',
      name: '',
      category: '',
      unitPrice: -5
    };

    const result = validateAndTransformProduct(raw);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('Missing required field: id')));
    assert.ok(result.errors.some(e => e.includes('Missing required field: sku')));
    assert.ok(result.errors.some(e => e.includes('Missing required field: name')));
    assert.ok(result.errors.some(e => e.includes('Missing required field: category')));
    assert.ok(result.errors.some(e => e.includes('unitPrice cannot be negative')));
  });

  it('detects duplicate SKUs when context contains seenSkus', () => {
    const seenSkus = new Set(['ELE-UHD-55']);
    const raw = {
      id: 'PRD-102',
      sku: 'ele-uhd-55',
      name: 'Duplicate Display',
      category: 'Electronics',
      unitPrice: 499.99
    };

    const result = validateAndTransformProduct(raw, { seenSkus });
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('Duplicate SKU identifier detected')));
  });
});

describe('Dataset Preparation: prepareDataset pipeline', () => {
  it('processes valid dataset and generates 100% compliance report', () => {
    const result = prepareDataset(SAMPLE_RAW_DATASET_VALID);
    assert.equal(result.success, true);
    assert.equal(result.data.products.length, 2);
    assert.equal(result.data.warehouses.length, 2);
    assert.equal(result.report.totalSourceRecords, 2);
    assert.equal(result.report.validCount, 2);
    assert.equal(result.report.rejectedCount, 0);
    assert.equal(result.report.complianceRate, 100);
    // Verify leading zeros preserved
    assert.equal(result.data.products[0].sku, '00123-A');
    assert.equal(result.data.products[1].sku, '00980-B');
  });

  it('filters anomalies, identifies duplicate SKUs, and generates audit report', () => {
    const result = prepareDataset(SAMPLE_RAW_DATASET_WITH_ANOMALIES);
    assert.equal(result.success, false);
    assert.equal(result.report.totalSourceRecords, 6);
    assert.equal(result.report.validCount, 2); // PRD-VALID and PRD-DUP-1
    assert.equal(result.report.rejectedCount, 4); // PRD-DUP-2, PRD-MISSING-SKU, PRD-NEGATIVE-STOCK, PRD-INVALID-PRICE
    assert.equal(result.report.duplicateSkuCount, 1);
    assert.equal(result.report.duplicateSkus[0].sku, 'DUP-SKU-99');
    assert.equal(result.report.duplicateSkus[0].count, 2);
    assert.equal(result.report.complianceRate, 33);
  });
});
