/**
 * Bundled Warehouse Operations Dataset
 * 
 * Includes multi-location warehouse data, product inventory, 12-month historical demand,
 * category classifications, and active fulfillment orders.
 */

export const WAREHOUSES = [
  { id: 'WH-NORTH', name: 'North Warehouse', location: 'Chicago, IL', manager: 'Sarah Jenkins', capacity: 15000, color: '#2563EB' },
  { id: 'WH-SOUTH', name: 'South Warehouse', location: 'Dallas, TX', manager: 'Marcus Vance', capacity: 18000, color: '#7C3AED' },
  { id: 'WH-EAST', name: 'East Warehouse', location: 'New York, NY', manager: 'Elena Rostova', capacity: 12000, color: '#059669' },
  { id: 'WH-WEST', name: 'West Warehouse', location: 'Los Angeles, CA', manager: 'David Chen', capacity: 20000, color: '#F59E0B' }
];

export const CATEGORIES = [
  'Electronics',
  'Apparel & Footwear',
  'Home & Kitchen',
  'Industrial Tools',
  'Automotive Parts'
];

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const PRODUCTS = [
  {
    id: 'PRD-101',
    sku: 'ELE-UHD-55',
    name: '55" Ultra HD Smart Display',
    category: 'Electronics',
    unitPrice: 499.99,
    reorderPoint: 40,
    minStock: 25,
    maxStock: 200,
    warehouseStock: {
      'WH-NORTH': 65,
      'WH-SOUTH': 42,
      'WH-EAST': 18, // Low stock
      'WH-WEST': 85
    },
    historicalDemand: [82, 85, 90, 95, 110, 115, 120, 125, 130, 140, 155, 170]
  },
  {
    id: 'PRD-102',
    sku: 'ELE-WNC-HP',
    name: 'Wireless Noise-Canceling Headphones',
    category: 'Electronics',
    unitPrice: 179.50,
    reorderPoint: 60,
    minStock: 30,
    maxStock: 350,
    warehouseStock: {
      'WH-NORTH': 120,
      'WH-SOUTH': 95,
      'WH-EAST': 40,
      'WH-WEST': 110
    },
    historicalDemand: [140, 145, 150, 160, 175, 180, 190, 210, 215, 230, 260, 290]
  },
  {
    id: 'PRD-103',
    sku: 'IND-PWR-DRL',
    name: 'Industrial Power Drill 20V Kit',
    category: 'Industrial Tools',
    unitPrice: 129.99,
    reorderPoint: 35,
    minStock: 20,
    maxStock: 180,
    warehouseStock: {
      'WH-NORTH': 45,
      'WH-SOUTH': 8, // Critical stock
      'WH-EAST': 52,
      'WH-WEST': 60
    },
    historicalDemand: [60, 62, 65, 70, 72, 75, 80, 85, 88, 92, 98, 105]
  },
  {
    id: 'PRD-104',
    sku: 'HOM-ERG-CHR',
    name: 'Ergonomic Mesh Executive Chair',
    category: 'Home & Kitchen',
    unitPrice: 249.00,
    reorderPoint: 25,
    minStock: 15,
    maxStock: 120,
    warehouseStock: {
      'WH-NORTH': 30,
      'WH-SOUTH': 28,
      'WH-EAST': 35,
      'WH-WEST': 12 // Low stock
    },
    historicalDemand: [35, 38, 40, 42, 45, 48, 50, 52, 55, 60, 65, 70]
  },
  {
    id: 'PRD-105',
    sku: 'APP-WPF-JKT',
    name: 'All-Weather Waterproof Jacket',
    category: 'Apparel & Footwear',
    unitPrice: 89.95,
    reorderPoint: 80,
    minStock: 40,
    maxStock: 400,
    warehouseStock: {
      'WH-NORTH': 140,
      'WH-SOUTH': 180,
      'WH-EAST': 90,
      'WH-WEST': 210
    },
    historicalDemand: [110, 105, 95, 80, 70, 60, 65, 90, 130, 170, 210, 240]
  },
  {
    id: 'PRD-106',
    sku: 'AUT-CER-PAD',
    name: 'Ceramic Performance Brake Pads Set',
    category: 'Automotive Parts',
    unitPrice: 64.50,
    reorderPoint: 50,
    minStock: 25,
    maxStock: 250,
    warehouseStock: {
      'WH-NORTH': 78,
      'WH-SOUTH': 62,
      'WH-EAST': 15, // Critical stock
      'WH-WEST': 84
    },
    historicalDemand: [90, 92, 95, 94, 98, 102, 105, 108, 110, 115, 118, 122]
  },
  {
    id: 'PRD-107',
    sku: 'ELE-USBC-HUB',
    name: 'Multi-Port 10-in-1 USB-C Hub',
    category: 'Electronics',
    unitPrice: 45.00,
    reorderPoint: 100,
    minStock: 50,
    maxStock: 500,
    warehouseStock: {
      'WH-NORTH': 240,
      'WH-SOUTH': 190,
      'WH-EAST': 160,
      'WH-WEST': 310
    },
    historicalDemand: [210, 220, 230, 245, 260, 270, 280, 295, 310, 330, 360, 400]
  },
  {
    id: 'PRD-108',
    sku: 'HOM-CMP-ESP',
    name: 'Compact Barista Espresso Machine',
    category: 'Home & Kitchen',
    unitPrice: 199.99,
    reorderPoint: 30,
    minStock: 15,
    maxStock: 150,
    warehouseStock: {
      'WH-NORTH': 42,
      'WH-SOUTH': 35,
      'WH-EAST': 28,
      'WH-WEST': 48
    },
    historicalDemand: [40, 42, 45, 48, 52, 55, 58, 62, 68, 75, 90, 110]
  },
  {
    id: 'PRD-109',
    sku: 'IND-STL-SHLF',
    name: 'Heavy-Duty 5-Tier Steel Shelving',
    category: 'Industrial Tools',
    unitPrice: 159.00,
    reorderPoint: 20,
    minStock: 10,
    maxStock: 100,
    warehouseStock: {
      'WH-NORTH': 18,
      'WH-SOUTH': 24,
      'WH-EAST': 6, // Critical stock
      'WH-WEST': 30
    },
    historicalDemand: [25, 26, 28, 30, 32, 33, 35, 36, 38, 40, 42, 45]
  },
  {
    id: 'PRD-110',
    sku: 'APP-RUN-SHOE',
    name: 'Pro Performance Cushion Running Shoes',
    category: 'Apparel & Footwear',
    unitPrice: 119.99,
    reorderPoint: 70,
    minStock: 35,
    maxStock: 300,
    warehouseStock: {
      'WH-NORTH': 95,
      'WH-SOUTH': 110,
      'WH-EAST': 85,
      'WH-WEST': 130
    },
    historicalDemand: [120, 125, 135, 145, 160, 175, 180, 170, 165, 160, 170, 185]
  },
  {
    id: 'PRD-111',
    sku: 'AUT-ALL-MAT',
    name: 'Heavy Rubber All-Weather Floor Mats',
    category: 'Automotive Parts',
    unitPrice: 49.99,
    reorderPoint: 45,
    minStock: 20,
    maxStock: 200,
    warehouseStock: {
      'WH-NORTH': 68,
      'WH-SOUTH': 54,
      'WH-EAST': 42,
      'WH-WEST': 75
    },
    historicalDemand: [70, 72, 75, 78, 80, 82, 85, 90, 95, 100, 115, 125]
  },
  {
    id: 'PRD-112',
    sku: 'HOM-SMT-LAMP',
    name: 'Smart Ambient LED Desk Lamp',
    category: 'Home & Kitchen',
    unitPrice: 39.95,
    reorderPoint: 50,
    minStock: 25,
    maxStock: 250,
    warehouseStock: {
      'WH-NORTH': 85,
      'WH-SOUTH': 72,
      'WH-EAST': 64,
      'WH-WEST': 90
    },
    historicalDemand: [80, 82, 85, 88, 92, 95, 98, 105, 110, 120, 135, 150]
  }
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-9101',
    customer: 'Apex Logistics Inc',
    items: [
      { productId: 'PRD-102', productName: 'Wireless Noise-Canceling Headphones', qty: 5 },
      { productId: 'PRD-107', productName: 'Multi-Port 10-in-1 USB-C Hub', qty: 10 }
    ],
    warehouseId: 'WH-NORTH',
    priority: 'Express',
    status: 'Order Created',
    timestamp: '10 mins ago'
  },
  {
    id: 'ORD-9102',
    customer: 'Vanguard Retail Co',
    items: [
      { productId: 'PRD-103', productName: 'Industrial Power Drill 20V Kit', qty: 3 },
      { productId: 'PRD-109', productName: 'Heavy-Duty 5-Tier Steel Shelving', qty: 2 }
    ],
    warehouseId: 'WH-SOUTH',
    priority: 'Standard',
    status: 'Picking',
    timestamp: '25 mins ago'
  },
  {
    id: 'ORD-9103',
    customer: 'Summit Gear Outfitter',
    items: [
      { productId: 'PRD-105', productName: 'All-Weather Waterproof Jacket', qty: 12 },
      { productId: 'PRD-110', productName: 'Pro Performance Cushion Running Shoes', qty: 8 }
    ],
    warehouseId: 'WH-WEST',
    priority: 'Overnight',
    status: 'Packing',
    timestamp: '40 mins ago'
  },
  {
    id: 'ORD-9104',
    customer: 'Metropolitan Fleet Supply',
    items: [
      { productId: 'PRD-106', productName: 'Ceramic Performance Brake Pads Set', qty: 6 },
      { productId: 'PRD-111', productName: 'Heavy Rubber All-Weather Floor Mats', qty: 4 }
    ],
    warehouseId: 'WH-EAST',
    priority: 'Standard',
    status: 'Ready',
    timestamp: '1 hour ago'
  }
];
