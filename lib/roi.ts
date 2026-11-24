export interface Inputs {
  ebikePrice: number; // $
  gasPrice: number; // $/gal
  mpg: number; // car mpg
  kwhPrice: number; // $/kWh
  whPerMile: number; // e-bike efficiency Wh/mi, default 20
  dailyMiles: number; // total daily driving
  replaceablePct: number; // 0–1
  daysPerWeek: number; // 1–7
  carOwnershipCostPerMile: number; // $/mi — maintenance, insurance, depreciation, registration
  ebikeAnnualUpkeep: number; // $/year — maintenance + optional insurance
}

export interface MonthPoint {
  month: number;
  net: number;
}

export interface Result {
  carFuelCostPerMile: number;
  carOwnershipCostPerMile: number;
  carCostPerMile: number;
  ebikeCostPerMile: number;
  savingsPerMile: number;
  annualReplaceableMiles: number;
  grossAnnualSavings: number;
  ebikeAnnualUpkeep: number;
  annualSavings: number;
  paybackMonths: number | null;
  fiveYearNet: number;
  cumulativeByMonth: MonthPoint[];
  carCo2PerMile: number; // lbs CO2/mile
  ebikeCo2PerMile: number; // lbs CO2/mile
  co2SavedPerMile: number; // lbs CO2/mile
  annualCo2SavedLbs: number;
  fiveYearCo2SavedLbs: number;
}

// EPA: burning one gallon of gasoline produces ~19.6 lbs of CO2.
const CO2_LBS_PER_GALLON_GASOLINE = 19.6;
// EPA eGRID national average grid intensity, ~0.85 lbs CO2/kWh. Actual
// intensity varies a lot by state's generation mix; this is a national
// approximation, same spirit as the whPerMile default.
const CO2_LBS_PER_KWH_GRID = 0.85;

export function computeRoi(input: Inputs): Result {
  const {
    ebikePrice,
    gasPrice,
    mpg,
    kwhPrice,
    whPerMile,
    dailyMiles,
    replaceablePct,
    daysPerWeek,
    carOwnershipCostPerMile,
    ebikeAnnualUpkeep,
  } = input;

  const carFuelCostPerMile = mpg > 0 ? gasPrice / mpg : 0;
  const carCostPerMile = carFuelCostPerMile + carOwnershipCostPerMile;
  const ebikeCostPerMile = (whPerMile / 1000) * kwhPrice;
  const savingsPerMile = carCostPerMile - ebikeCostPerMile;
  const annualReplaceableMiles =
    dailyMiles * replaceablePct * daysPerWeek * 52;
  const grossAnnualSavings = savingsPerMile * annualReplaceableMiles;
  const annualSavings = grossAnnualSavings - ebikeAnnualUpkeep;
  const monthlySavings = annualSavings / 12;

  const paybackMonths =
    monthlySavings > 0 ? ebikePrice / monthlySavings : null;

  const cumulativeByMonth: MonthPoint[] = [];
  for (let m = 0; m <= 60; m++) {
    cumulativeByMonth.push({ month: m, net: monthlySavings * m - ebikePrice });
  }
  const fiveYearNet = monthlySavings * 60 - ebikePrice;

  const carCo2PerMile = mpg > 0 ? CO2_LBS_PER_GALLON_GASOLINE / mpg : 0;
  const ebikeCo2PerMile = (whPerMile / 1000) * CO2_LBS_PER_KWH_GRID;
  const co2SavedPerMile = carCo2PerMile - ebikeCo2PerMile;
  const annualCo2SavedLbs = co2SavedPerMile * annualReplaceableMiles;
  const fiveYearCo2SavedLbs = annualCo2SavedLbs * 5;

  return {
    carFuelCostPerMile,
    carOwnershipCostPerMile,
    carCostPerMile,
    ebikeCostPerMile,
    savingsPerMile,
    annualReplaceableMiles,
    grossAnnualSavings,
    ebikeAnnualUpkeep,
    annualSavings,
    paybackMonths,
    fiveYearNet,
    cumulativeByMonth,
    carCo2PerMile,
    ebikeCo2PerMile,
    co2SavedPerMile,
    annualCo2SavedLbs,
    fiveYearCo2SavedLbs,
  };
}

export function formatPayback(months: number | null): string {
  if (months === null || !isFinite(months)) return "Never";
  if (months < 1) return "< 1 month";
  if (months < 24) return `${months.toFixed(1)} months`;
  // Round to whole months before splitting, so 35.6 reads "3 years", not "2y 12mo".
  const totalMonths = Math.round(months);
  const years = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;
  if (remMonths === 0) return `${years} years`;
  return `${years}y ${remMonths}mo`;
}

export function formatUsd(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatCo2Lbs(lbs: number): string {
  const sign = lbs < 0 ? "-" : "";
  const abs = Math.abs(lbs);
  if (abs >= 2000) {
    return `${sign}${(abs / 2000).toLocaleString(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} short tons CO₂`;
  }
  return `${sign}${abs.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })} lbs CO₂`;
}
