/**
 * Dataset Fixtures for Testing & Validation
 * Includes clean baseline data and edge-case synthetic data (leading zero SKUs, malformed fields, duplicates).
 */

export const SAMPLE_RAW_DATASET_VALID = {
  warehouses: [
    { id: 'WH-NORTH', name: 'North Warehouse', location: 'Chicago, IL', manager: 'Sarah Jenkins', capacity: 15000, color: '#2563EB' },
    { id: 'WH-SOUTH', name: 'South Warehouse', location: 'Dallas, TX', manager: 'Marcus Vance', capacity: 18000, color: '#7C3AED' }
  ],
  products: [
    {
      id: 'PRD-001',
      sku: '00123-A', // Leading zero SKU test case
      name: 'Precision Calibrator Tool',
      category: 'Industrial Tools',
      unitPrice: '$149.50', // Currency string test case
      reorderPoint: 20,
      minStock: 10,
      maxStock: 100,
      warehouseStock: { 'WH-NORTH': 35, 'WH-SOUTH': 25 },
      historicalDemand: [15, 18, 20, 22, 25, 28, 30, 32, 35, 40, 42, 45]
    },
    {
      id: 'PRD-002',
      sku: '00980-B', // Another leading zero SKU
      name: 'Thermal Imaging Sensor',
      category: 'Electronics',
      unitPrice: 299.99,
      reorderPoint: 15,
      minStock: 8,
      maxStock: 80,
      warehouseStock: { 'WH-NORTH': 12, 'WH-SOUTH': 18 },
      historicalDemand: [10, 12, 14, 15, 18, 20, 22, 24, 25, 28, 30, 32]
    }
  ],
  orders: [
    {
      id: 'ORD-001',
      customer: 'Test Logistics',
      items: [{ productId: 'PRD-001', qty: 2 }],
      warehouseId: 'WH-NORTH',
      priority: 'Standard',
      status: 'Order Created',
      timestamp: 'Just now'
    }
  ]
};

export const SAMPLE_RAW_DATASET_WITH_ANOMALIES = {
  warehouses: [
    { id: 'WH-NORTH', name: 'North Warehouse', capacity: 15000 }
  ],
  products: [
    {
      id: 'PRD-VALID',
      sku: '00445-Z',
      name: 'Valid Product With Leading Zero',
      category: 'Electronics',
      unitPrice: 50.0,
      minStock: 10,
      warehouseStock: { 'WH-NORTH': 20 }
    },
    {
      id: 'PRD-DUP-1',
      sku: 'DUP-SKU-99',
      name: 'Duplicate SKU Initial Record',
      category: 'Automotive Parts',
      unitPrice: 80.0,
      minStock: 5,
      warehouseStock: { 'WH-NORTH': 15 }
    },
    {
      id: 'PRD-DUP-2',
      sku: 'dup-sku-99', // Case insensitive duplicate SKU
      name: 'Duplicate SKU Secondary Record',
      category: 'Automotive Parts',
      unitPrice: 85.0,
      minStock: 5,
      warehouseStock: { 'WH-NORTH': 10 }
    },
    {
      id: 'PRD-MISSING-SKU',
      sku: '', // Missing SKU
      name: 'Product with Missing SKU',
      category: 'Electronics',
      unitPrice: 25.0,
      minStock: 5,
      warehouseStock: { 'WH-NORTH': 5 }
    },
    {
      id: 'PRD-NEGATIVE-STOCK',
      sku: 'NEG-STK-01',
      name: 'Product with Negative Stock',
      category: 'Industrial Tools',
      unitPrice: 100.0,
      minStock: 5,
      warehouseStock: { 'WH-NORTH': -10 }
    },
    {
      id: 'PRD-INVALID-PRICE',
      sku: 'INV-PRC-01',
      name: 'Product with Bad Price',
      category: 'Home & Kitchen',
      unitPrice: 'not-a-number',
      minStock: 5,
      warehouseStock: { 'WH-NORTH': 10 }
    }
  ]
};
