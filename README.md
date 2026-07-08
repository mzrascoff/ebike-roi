# E-Bike ROI Calculator

A small Next.js app that answers a simple question: **when does buying an
e-bike pay back in gas savings?**

- Enter your own gas price — no live lookups, just what you're paying.
- State-aware residential electricity defaults (editable).
- Honest input for what share of your driving an e-bike can actually replace.
- Estimates car maintenance, insurance, depreciation, and registration
  (AAA-style average, editable) alongside fuel, net of the e-bike's own
  upkeep.
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
carCostPerMile         = carFuelCostPerMile + carOwnershipCostPerMile
ebikeCostPerMile       = (whPerMile / 1000) * kwhPrice
annualReplaceableMiles = dailyMiles * (replaceablePct/100) * daysPerWeek * 52
grossAnnualSavings     = (carCostPerMile - ebikeCostPerMile) * annualReplaceableMiles
annualSavings          = grossAnnualSavings - ebikeAnnualUpkeep
paybackMonths          = ebikePrice / (annualSavings / 12)
```

`carOwnershipCostPerMile` bundles maintenance, insurance, depreciation, and
registration (default ~$0.50/mi, AAA-style national average), applied only
to the miles an e-bike replaces. `ebikeAnnualUpkeep` (default $150/year)
covers the e-bike's own tires, tune-ups, and optional insurance. Both are
editable under "Show advanced."
