import { describe, expect, it } from "vitest";
import {
  computeRoi,
  DEFAULT_CAR_FIXED_ANNUAL_COST,
  DEFAULT_CAR_VARIABLE_COST_PER_MILE,
  formatCo2Lbs,
  formatPayback,
  formatUsd,
  type Inputs,
} from "./roi";

const baseInputs: Inputs = {
  ebikePrice: 2000,
  gasPrice: 4.5,
  mpg: 28,
  kwhPrice: 0.16,
  whPerMile: 20,
  dailyMiles: 15,
  replaceablePct: 0.7,
  daysPerWeek: 7,
  carVariableCostPerMile: DEFAULT_CAR_VARIABLE_COST_PER_MILE,
  ditchCar: false,
  carFixedAnnualCost: DEFAULT_CAR_FIXED_ANNUAL_COST,
  ebikeAnnualUpkeep: 150,
};

describe("computeRoi", () => {
  it("computes a payback period when gas savings exceed e-bike electricity cost", () => {
    const result = computeRoi(baseInputs);

    const expectedCarFuelCostPerMile = baseInputs.gasPrice / baseInputs.mpg;
    const expectedCarCostPerMile =
      expectedCarFuelCostPerMile + baseInputs.carVariableCostPerMile;
    const expectedEbikeCostPerMile = (baseInputs.whPerMile / 1000) * baseInputs.kwhPrice;
    const expectedAnnualMiles =
      baseInputs.dailyMiles * baseInputs.replaceablePct * baseInputs.daysPerWeek * 52;

    expect(result.carFuelCostPerMile).toBeCloseTo(expectedCarFuelCostPerMile);
    expect(result.carCostPerMile).toBeCloseTo(expectedCarCostPerMile);
    expect(result.ebikeCostPerMile).toBeCloseTo(expectedEbikeCostPerMile);
    expect(result.annualReplaceableMiles).toBeCloseTo(expectedAnnualMiles);
    expect(result.carFixedAnnualSavings).toBe(0);
    expect(result.grossAnnualSavings).toBeCloseTo(
      result.savingsPerMile * expectedAnnualMiles,
    );
    expect(result.annualSavings).toBeCloseTo(
      result.grossAnnualSavings - baseInputs.ebikeAnnualUpkeep,
    );
    expect(result.annualSavings).toBeGreaterThan(0);
    expect(result.paybackMonths).not.toBeNull();
    expect(result.paybackMonths).toBeCloseTo(
      baseInputs.ebikePrice / (result.annualSavings / 12),
    );

    // 60 months plus the starting point.
    expect(result.cumulativeByMonth).toHaveLength(61);
    expect(result.cumulativeByMonth[0]).toEqual({ month: 0, net: -baseInputs.ebikePrice });
    expect(result.fiveYearNet).toBeCloseTo(
      result.cumulativeByMonth[60].net,
    );
  });

  it("never pays back when e-bike electricity cost meets or exceeds gas savings", () => {
    const result = computeRoi({
      ...baseInputs,
      gasPrice: 0.01,
      kwhPrice: 5,
      carVariableCostPerMile: 0,
    });

    expect(result.savingsPerMile).toBeLessThanOrEqual(0);
    expect(result.annualSavings).toBeLessThanOrEqual(0);
    expect(result.paybackMonths).toBeNull();
    expect(result.fiveYearNet).toBeLessThan(0);
  });

  it("pins the default figures to the documented AAA 2026 derivation", () => {
    // 11.73¢ maintenance/repair/tires + $419 / 5,000 mi of depreciation.
    expect(DEFAULT_CAR_VARIABLE_COST_PER_MILE).toBeCloseTo(0.1173 + 419 / 5000, 2);
    // Insurance + registration/taxes + finance + depreciation net of its
    // mileage-driven part at 15k mi/yr.
    expect(DEFAULT_CAR_FIXED_ANNUAL_COST).toBeCloseTo(
      2098 + 802 + 1184 + (4422 - 15000 * (419 / 5000)),
      -1,
    );
  });

  it("only counts fixed ownership costs when the household gets rid of a car", () => {
    const keep = computeRoi(baseInputs);
    const ditch = computeRoi({ ...baseInputs, ditchCar: true });

    expect(keep.carFixedAnnualSavings).toBe(0);
    expect(ditch.carFixedAnnualSavings).toBe(baseInputs.carFixedAnnualCost);
    expect(ditch.perMileAnnualSavings).toBeCloseTo(keep.perMileAnnualSavings);
    expect(ditch.grossAnnualSavings).toBeCloseTo(
      keep.grossAnnualSavings + baseInputs.carFixedAnnualCost,
    );
    expect(ditch.annualSavings).toBeCloseTo(
      keep.annualSavings + baseInputs.carFixedAnnualCost,
    );
    expect(ditch.paybackMonths!).toBeLessThan(keep.paybackMonths!);

    // Editing the fixed cost has no effect unless the car goes away.
    const keepEdited = computeRoi({ ...baseInputs, carFixedAnnualCost: 99999 });
    expect(keepEdited.annualSavings).toBeCloseTo(keep.annualSavings);
  });

  it("reproduces the default scenario's headline numbers", () => {
    // 15 mi/day × 70% × 7 days × 52 weeks = 3,822 mi/yr at California's $0.305/kWh.
    const result = computeRoi({ ...baseInputs, kwhPrice: 0.305 });
    const savingsPerMile = 4.5 / 28 + 0.2 - 0.02 * 0.305;
    const annual = savingsPerMile * 3822 - 150;

    expect(result.annualSavings).toBeCloseTo(annual);
    expect(result.paybackMonths).toBeCloseTo(2000 / (annual / 12));
    expect(result.fiveYearNet).toBeCloseTo(annual * 5 - 2000);
  });

  it("subtracts e-bike upkeep from gross driving-cost savings", () => {
    const withUpkeep = computeRoi(baseInputs);
    const withoutUpkeep = computeRoi({ ...baseInputs, ebikeAnnualUpkeep: 0 });

    expect(withUpkeep.grossAnnualSavings).toBeCloseTo(
      withoutUpkeep.grossAnnualSavings,
    );
    expect(withUpkeep.annualSavings).toBeCloseTo(
      withoutUpkeep.annualSavings - baseInputs.ebikeAnnualUpkeep,
    );
  });

  it("guards against division by zero when mpg is 0", () => {
    const result = computeRoi({ ...baseInputs, mpg: 0, carVariableCostPerMile: 0 });

    expect(result.carFuelCostPerMile).toBe(0);
    expect(result.carCostPerMile).toBe(0);
    expect(result.savingsPerMile).toBeLessThan(0);
    expect(result.paybackMonths).toBeNull();
    expect(result.carCo2PerMile).toBe(0);
  });

  it("computes CO2 avoided from replacing car miles with e-bike miles", () => {
    const result = computeRoi(baseInputs);

    expect(result.carCo2PerMile).toBeGreaterThan(0);
    expect(result.ebikeCo2PerMile).toBeGreaterThan(0);
    expect(result.co2SavedPerMile).toBeCloseTo(
      result.carCo2PerMile - result.ebikeCo2PerMile,
    );
    expect(result.annualCo2SavedLbs).toBeCloseTo(
      result.co2SavedPerMile * result.annualReplaceableMiles,
    );
    expect(result.fiveYearCo2SavedLbs).toBeCloseTo(
      result.annualCo2SavedLbs * 5,
    );
    expect(result.annualCo2SavedLbs).toBeGreaterThan(0);
  });
});

describe("formatPayback", () => {
  it("formats null and non-finite values as Never", () => {
    expect(formatPayback(null)).toBe("Never");
    expect(formatPayback(Infinity)).toBe("Never");
  });

  it("formats sub-month paybacks", () => {
    expect(formatPayback(0.5)).toBe("< 1 month");
  });

  it("formats month-scale paybacks with one decimal", () => {
    expect(formatPayback(13)).toBe("13.0 months");
  });

  it("formats multi-year paybacks", () => {
    expect(formatPayback(30)).toBe("2y 6mo");
    expect(formatPayback(24)).toBe("2 years");
  });

  it("rounds to whole months before splitting into years", () => {
    expect(formatPayback(35.6)).toBe("3 years");
    expect(formatPayback(47.5)).toBe("4 years");
    expect(formatPayback(35.4)).toBe("2y 11mo");
  });
});

describe("formatUsd", () => {
  it("formats positive and negative whole-dollar amounts", () => {
    expect(formatUsd(1500)).toBe("$1,500");
    expect(formatUsd(-1500)).toBe("-$1,500");
    expect(formatUsd(0)).toBe("$0");
  });
});

describe("formatCo2Lbs", () => {
  it("formats sub-ton amounts in pounds", () => {
    expect(formatCo2Lbs(500)).toBe("500 lbs CO₂");
    expect(formatCo2Lbs(-500)).toBe("-500 lbs CO₂");
    expect(formatCo2Lbs(0)).toBe("0 lbs CO₂");
  });

  it("formats amounts at or above 2000 lbs in short tons", () => {
    expect(formatCo2Lbs(2000)).toBe("1.0 short tons CO₂");
    expect(formatCo2Lbs(5500)).toBe("2.8 short tons CO₂");
  });
});
