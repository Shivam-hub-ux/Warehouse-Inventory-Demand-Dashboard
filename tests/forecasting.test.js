
import { describe, it, expect } from 'vitest';

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
});
