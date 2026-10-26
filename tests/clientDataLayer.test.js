import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DataRepository } from '../src/js/data.js';
import { SAMPLE_RAW_DATASET_VALID } from '../src/data/fixtures.js';

describe('Client-Side Data Layer: DataRepository', () => {
  let repo;

  beforeEach(() => {
    repo = new DataRepository();
  });

  it('initializes with bundled data and reports success status', () => {
    const state = repo.getState();
    assert.equal(state.status, 'success');
    assert.equal(state.error, null);
    assert.ok(repo.getProducts().length > 0);
    assert.ok(repo.getWarehouses().length > 0);
    assert.ok(state.validationReport !== null);
    assert.equal(state.validationReport.rejectedCount, 0);
  });

  it('supports async loadDataset with loading and success transitions', async () => {
    const states = [];
    repo.subscribe((state) => {
      states.push(state.status);
    });

    const finalState = await repo.loadDataset(SAMPLE_RAW_DATASET_VALID);
    assert.equal(finalState.status, 'success');
    assert.ok(states.includes('loading'));
    assert.ok(states.includes('success'));
    assert.equal(repo.getProducts().length, 2);
  });

  it('sets status to empty when dataset contains zero products', async () => {
    await repo.loadDataset({ products: [], warehouses: [], orders: [] });
    assert.equal(repo.getState().status, 'empty');
    assert.equal(repo.getProducts().length, 0);
  });

  it('filters products by warehouse location', () => {
    const all = repo.getProducts();
    const northProducts = repo.getProducts({ warehouse: 'WH-NORTH' });
    assert.ok(northProducts.length > 0);
    northProducts.forEach(p => {
      assert.notEqual(p.warehouseStock['WH-NORTH'], undefined);
    });
  });

  it('filters products by category and stockStatus', () => {
    const electronics = repo.getProducts({ category: 'Electronics' });
    assert.ok(electronics.length > 0);
    electronics.forEach(p => assert.equal(p.category, 'Electronics'));

    const critical = repo.getProducts({ stockStatus: 'CRITICAL' });
    critical.forEach(p => {
      const totalStock = Object.values(p.warehouseStock).reduce((s, v) => s + v, 0);
      assert.ok(totalStock <= p.minStock);
    });
  });

  it('filters products by search query across SKU, name, and category', () => {
    const searchSku = repo.getProducts({ search: 'ELE-UHD-55' });
    assert.equal(searchSku.length, 1);
    assert.equal(searchSku[0].sku, 'ELE-UHD-55');

    const searchName = repo.getProducts({ search: 'Headphones' });
    assert.ok(searchName.length >= 1);
  });

  it('sorts products by SKU, unitPrice, stock, and valuation', () => {
    const sortedByPriceDesc = repo.getProducts({ sortBy: 'price', sortOrder: 'desc' });
    for (let i = 0; i < sortedByPriceDesc.length - 1; i++) {
      assert.ok(sortedByPriceDesc[i].unitPrice >= sortedByPriceDesc[i + 1].unitPrice);
    }

    const sortedBySkuAsc = repo.getProducts({ sortBy: 'sku', sortOrder: 'asc' });
    for (let i = 0; i < sortedBySkuAsc.length - 1; i++) {
      assert.ok(sortedBySkuAsc[i].sku.localeCompare(sortedBySkuAsc[i + 1].sku) <= 0);
    }
  });

  it('supports pagination with metadata', () => {
    const paged = repo.getProductsPaged({}, { page: 1, pageSize: 5 });
    assert.equal(paged.page, 1);
    assert.equal(paged.pageSize, 5);
    assert.equal(paged.items.length, 5);
    assert.ok(paged.totalPages >= 2);
    assert.equal(paged.hasNext, true);
    assert.equal(paged.hasPrev, false);

    const page2 = repo.getProductsPaged({}, { page: 2, pageSize: 5 });
    assert.equal(page2.page, 2);
    assert.equal(page2.items.length, 5);
    assert.equal(page2.hasPrev, true);
  });

  it('supports SKU-specific accessors (getProductBySku, checkSkuExists, getUniqueSkus)', () => {
    const skus = repo.getUniqueSkus();
    assert.ok(skus.length > 0);
    assert.ok(skus.includes('ELE-UHD-55'));

    assert.equal(repo.checkSkuExists('ele-uhd-55'), true);
    assert.equal(repo.checkSkuExists('NON-EXISTENT-SKU'), false);

    const product = repo.getProductBySku('ele-uhd-55');
    assert.ok(product !== undefined);
    assert.equal(product.sku, 'ELE-UHD-55');
  });

  it('mutates product stock optimistically and notifies subscribers', () => {
    let notified = false;
    repo.subscribe(() => {
      notified = true;
    });

    const initialProduct = repo.getProductBySku('ELE-UHD-55');
    const initialQty = initialProduct.warehouseStock['WH-NORTH'];

    const updated = repo.mutateProductStock('ELE-UHD-55', 'WH-NORTH', 10);
    assert.equal(updated.warehouseStock['WH-NORTH'], initialQty + 10);
    assert.equal(notified, true);
  });
});
