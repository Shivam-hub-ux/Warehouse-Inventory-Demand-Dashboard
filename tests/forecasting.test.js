import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateAggregateDemandForecast } from '../src/js/forecast.js';

describe('Statistical Forecasting Engine: generateAggregateDemandForecast', () => {
  it('generates 3-month forecast with linear and WMA projection', () => {
    const forecast = generateAggregateDemandForecast({}, 3);
    assert.equal(forecast.historicalLabels.length, 12);
    assert.equal(forecast.historicalValues.length, 12);
    assert.equal(forecast.forecastLabels.length, 3);
    assert.equal(forecast.forecastValues.length, 3);
    assert.equal(forecast.upperBoundValues.length, 3);
    assert.equal(forecast.lowerBoundValues.length, 3);

    for (let i = 0; i < 3; i++) {
      assert.ok(forecast.upperBoundValues[i] >= forecast.forecastValues[i]);
      assert.ok(forecast.lowerBoundValues[i] <= forecast.forecastValues[i]);
    }
  });

  it('generates 6-month forecast when requested', () => {
    const forecast = generateAggregateDemandForecast({}, 6);
    assert.equal(forecast.forecastLabels.length, 6);
    assert.equal(forecast.forecastValues.length, 6);
  });

  it('handles empty filters gracefully', () => {
    const forecast = generateAggregateDemandForecast({ category: 'NON-EXISTENT' }, 3);
    assert.equal(forecast.historicalValues.length, 0);
    assert.equal(forecast.forecastValues.length, 0);
  });
});
