import { describe, expect, it } from "vitest";
import {
  computeRoi,
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
  carOwnershipCostPerMile: 0.5,
  ebikeAnnualUpkeep: 150,
};

describe("computeRoi", () => {
  it("computes a payback period when gas savings exceed e-bike electricity cost", () => {
    const result = computeRoi(baseInputs);

    const expectedCarFuelCostPerMile = baseInputs.gasPrice / baseInputs.mpg;
    const expectedCarCostPerMile =
      expectedCarFuelCostPerMile + baseInputs.carOwnershipCostPerMile;
    const expectedEbikeCostPerMile = (baseInputs.whPerMile / 1000) * baseInputs.kwhPrice;
    const expectedAnnualMiles =
      baseInputs.dailyMiles * baseInputs.replaceablePct * baseInputs.daysPerWeek * 52;

    expect(result.carFuelCostPerMile).toBeCloseTo(expectedCarFuelCostPerMile);
    expect(result.carCostPerMile).toBeCloseTo(expectedCarCostPerMile);
    expect(result.ebikeCostPerMile).toBeCloseTo(expectedEbikeCostPerMile);
    expect(result.annualReplaceableMiles).toBeCloseTo(expectedAnnualMiles);
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
      carOwnershipCostPerMile: 0,
    });

    expect(result.savingsPerMile).toBeLessThanOrEqual(0);
    expect(result.annualSavings).toBeLessThanOrEqual(0);
    expect(result.paybackMonths).toBeNull();
    expect(result.fiveYearNet).toBeLessThan(0);
  });

  it("subtracts e-bike upkeep from gross fuel-and-ownership savings", () => {
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
    const result = computeRoi({ ...baseInputs, mpg: 0, carOwnershipCostPerMile: 0 });

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

  it("formats amounts at or above 2000 lbs in tons", () => {
    expect(formatCo2Lbs(2000)).toBe("1.0 tons CO₂");
    expect(formatCo2Lbs(5500)).toBe("2.8 tons CO₂");
  });
});
