
import { describe, it, expect, vi } from 'vitest';
import { dataRepository } from '../src/js/data.js';

import {
  generateAggregateDemandForecast,
  calculateForecastAccuracy
} from '../src/js/forecast.js';

describe('Statistical Forecasting Engine', () => {
  it('generates a 3-month forecast', () => {
    const result = generateAggregateDemandForecast({}, 3);

    expect(result.historicalLabels.length).toBe(12);
    expect(result.historicalValues.length).toBe(12);
    expect(result.forecastLabels.length).toBe(3);
    expect(result.forecastValues.length).toBe(3);
    expect(result.upperBoundValues.length).toBe(3);
    expect(result.lowerBoundValues.length).toBe(3);
  });

  it('generates a 6-month forecast when requested', () => {
    const result = generateAggregateDemandForecast({}, 6);

    expect(result.forecastLabels.length).toBe(6);
    expect(result.forecastValues.length).toBe(6);
  });

  it('handles filters with no matching products', () => {
    const result = generateAggregateDemandForecast(
      { category: 'NON-EXISTENT' },
      3
    );

    expect(result.historicalValues.length).toBe(0);
    expect(result.forecastValues.length).toBe(0);
  });

  it('returns non-negative forecast values', () => {
    const result = generateAggregateDemandForecast();

    result.forecastValues.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });

  it('keeps forecast bounds around predicted values', () => {
    const result = generateAggregateDemandForecast();

    result.forecastValues.forEach((value, index) => {
      expect(result.upperBoundValues[index]).toBeGreaterThanOrEqual(value);
      expect(result.lowerBoundValues[index]).toBeLessThanOrEqual(value);
    });
  });
});

describe('Forecast Accuracy', () => {
  it('returns valid MAE and MAPE metrics', () => {
    const result = calculateForecastAccuracy();

    expect(result).toHaveProperty('mae');
    expect(result).toHaveProperty('mape');
    expect(result).toHaveProperty('evaluatedPeriods');
    expect(result.evaluatedPeriods).toBeGreaterThan(0);
    expect(result.mae).toBeGreaterThanOrEqual(0);
    expect(result.mape).toBeGreaterThanOrEqual(0);
  });

  it('ignores zero-demand periods in MAPE while retaining them in MAE', () => {
    const products = vi.spyOn(dataRepository, 'getProducts').mockReturnValue([
      { historicalDemand: [0, 0, 0, 0] }
    ]);
    const months = vi.spyOn(dataRepository, 'getMonths').mockReturnValue(['Jan', 'Feb', 'Mar', 'Apr']);

    try {
      const result = calculateForecastAccuracy({ category: 'No Demand' });
      expect(result).toEqual({ mae: 0, mape: null, evaluatedPeriods: 1 });
      expect(products).toHaveBeenCalledWith({ category: 'No Demand' });
    } finally {
      products.mockRestore();
      months.mockRestore();
    }
  });

  it('returns unavailable accuracy when there is not enough history or no matching data', () => {
    const getProducts = vi.spyOn(dataRepository, 'getProducts').mockReturnValue([
      { historicalDemand: [1, 2, 3] }
    ]);
    const getMonths = vi.spyOn(dataRepository, 'getMonths').mockReturnValue(['Jan', 'Feb', 'Mar']);

    try {
      expect(calculateForecastAccuracy()).toEqual({ mae: null, mape: null, evaluatedPeriods: 0 });
      getProducts.mockReturnValue([]);
      getMonths.mockReturnValue(['Jan', 'Feb', 'Mar', 'Apr']);
      expect(calculateForecastAccuracy()).toEqual({ mae: null, mape: null, evaluatedPeriods: 0 });
    } finally {
      getProducts.mockRestore();
      getMonths.mockRestore();
    }
  });

  it('accepts invalid horizons safely and keeps forecast metrics finite for all-zero demand', () => {
    const getProducts = vi.spyOn(dataRepository, 'getProducts').mockReturnValue([
      { historicalDemand: new Array(12).fill(0) }
    ]);
    const getMonths = vi.spyOn(dataRepository, 'getMonths').mockReturnValue(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    );

    try {
      const result = generateAggregateDemandForecast({}, Number.NaN);
      expect(result.forecastValues).toHaveLength(3);
      expect(result.forecastValues.every(Number.isFinite)).toBe(true);
      expect(result.metrics.trendPct).toBe(0);
      expect(result.metrics.slope).toBe(0);
    } finally {
      getProducts.mockRestore();
      getMonths.mockRestore();
    }
  });
});
