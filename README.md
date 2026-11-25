# E-Bike ROI Calculator

A small Next.js app that answers a simple question: **when does buying an
e-bike pay back in gas savings?**

- Enter your own gas price — no live lookups, just what you're paying.
- State-aware residential electricity defaults (editable).
- Honest input for what share of your driving an e-bike can actually replace.
- Counts only the car costs that actually fall when you drive less: fuel,
  maintenance/repairs/tires, and mileage-driven depreciation (AAA 2026
  averages, editable), net of the e-bike's own upkeep.
- Optional "I'll get rid of a car" switch (off by default) that adds the
  car's fixed annual costs: insurance, registration, financing, and fixed
  depreciation.
- CO₂ avoided, based on EPA emissions factors.
- 5-year cumulative-savings chart with a payback marker.

## Setup

```bash
cd ebike-roi
npm install
npm run dev
```

Open <http://localhost:3000>.

## Development

```bash
npm run lint   # ESLint
npm run test   # vitest
npm run build  # production build
```

## Deploy to Vercel

```bash
npx vercel        # link the project, deploy a preview
npx vercel --prod
```

## Project layout

```
app/
  page.tsx                 calculator UI (client component)
  layout.tsx               root layout + metadata
components/
  RoiChart.tsx             recharts cumulative-savings chart
lib/
  roi.ts                   pure ROI math (+ roi.test.ts)
  states.ts                state list, $/kWh defaults
```

## The math

```
carFuelCostPerMile     = gasPrice / mpg
carCostPerMile         = carFuelCostPerMile + carVariableCostPerMile
ebikeCostPerMile       = (whPerMile / 1000) * kwhPrice
annualReplaceableMiles = dailyMiles * (replaceablePct/100) * daysPerWeek * 52
perMileAnnualSavings   = (carCostPerMile - ebikeCostPerMile) * annualReplaceableMiles
carFixedAnnualSavings  = ditchCar ? carFixedAnnualCost : 0
grossAnnualSavings     = perMileAnnualSavings + carFixedAnnualSavings
annualSavings          = grossAnnualSavings - ebikeAnnualUpkeep
paybackMonths          = ebikePrice / (annualSavings / 12)
```

Most of what a car costs is fixed: insurance, registration, financing, and
much of depreciation are the same whether you drive 5,000 or 15,000 miles a
year. So per replaced mile, the calculator counts only costs that vary with
mileage. Defaults come from the weighted average in AAA's
[Your Driving Costs 2026](https://newsroom.aaa.com/wp-content/uploads/2026/09/8-YDC-Brochure_2026-1.pdf)
([fact sheet](https://newsroom.aaa.com/wp-content/uploads/2026/09/AAA_YDC-Fact-Sheet_2026.pdf)),
which assumes a new car kept 5 years / 75,000 miles:

| Variable, per mile (`carVariableCostPerMile`, default $0.20/mi) | |
| --- | --- |
| Maintenance, repair & tires | 11.73¢ |
| Mileage-driven depreciation: $419/yr less at 10k vs. 15k mi/yr, ÷ 5,000 mi | 8.38¢ |

| Fixed, per year (`carFixedAnnualCost`, default $7,250/yr) | |
| --- | --- |
| Full-coverage insurance | $2,098 |
| License, registration & taxes | $802 |
| Finance charges | $1,184 |
| Fixed depreciation: $4,422 at 15k mi/yr − 15,000 × 8.38¢ | $3,165 |

Fuel is computed separately from your gas price and MPG. The fixed costs
count only when `ditchCar` ("I'll get rid of a car") is checked. It is off
by default. Lower the fixed cost for an older or paid-off car, which has
little financing and slower depreciation. `ebikeAnnualUpkeep` (default
$150/year) covers the e-bike's own tires, tune-ups, and optional insurance.
The per-mile cost and the upkeep are editable under "Show advanced."
