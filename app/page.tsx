"use client";

import { useMemo, useState } from "react";
import { STATES, getState } from "@/lib/states";
import {
  computeRoi,
  DEFAULT_CAR_FIXED_ANNUAL_COST,
  DEFAULT_CAR_VARIABLE_COST_PER_MILE,
  formatCo2Lbs,
  formatPayback,
  formatUsd,
} from "@/lib/roi";
import RoiChart from "@/components/RoiChart";

export default function Page() {
  const [stateCode, setStateCode] = useState<string>("CA");
  const [gasPrice, setGasPrice] = useState<number>(4.5);

  const [mpg, setMpg] = useState<number>(28);
  const [ebikePrice, setEbikePrice] = useState<number>(2000);
  // null = follow the state's default; a number once the user hand-edits it,
  // so switching states later doesn't clobber their edit.
  const [kwhPriceOverride, setKwhPriceOverride] = useState<number | null>(null);
  const stateName = getState(stateCode)?.name ?? "your state";
  const stateKwhPrice = getState(stateCode)?.kwhPrice ?? 0.16;
  const kwhPrice = kwhPriceOverride ?? stateKwhPrice;
  const [dailyMiles, setDailyMiles] = useState<number>(15);
  const [replaceablePct, setReplaceablePct] = useState<number>(70); // percent
  const [daysPerWeek, setDaysPerWeek] = useState<number>(7);
  const [whPerMile, setWhPerMile] = useState<number>(20);
  const [carVariableCostPerMile, setCarVariableCostPerMile] = useState<number>(
    DEFAULT_CAR_VARIABLE_COST_PER_MILE,
  );
  const [ditchCar, setDitchCar] = useState<boolean>(false);
  const [carFixedAnnualCost, setCarFixedAnnualCost] = useState<number>(
    DEFAULT_CAR_FIXED_ANNUAL_COST,
  );
  const [ebikeAnnualUpkeep, setEbikeAnnualUpkeep] = useState<number>(150);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const result = useMemo(
    () =>
      computeRoi({
        ebikePrice,
        gasPrice,
        mpg,
        kwhPrice,
        whPerMile,
        dailyMiles,
        replaceablePct: replaceablePct / 100,
        daysPerWeek,
        carVariableCostPerMile,
        ditchCar,
        carFixedAnnualCost,
        ebikeAnnualUpkeep,
      }),
    [
      ebikePrice,
      gasPrice,
      mpg,
      kwhPrice,
      whPerMile,
      dailyMiles,
      replaceablePct,
      daysPerWeek,
      carVariableCostPerMile,
      ditchCar,
      carFixedAnnualCost,
      ebikeAnnualUpkeep,
    ],
  );

  const paysBack = result.annualSavings > 0;

  return (
    <main className="min-h-screen bg-paper text-ink p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 sm:mb-10">
          <p className="eyebrow mb-4">Transportation economics</p>
          <h1 className="font-display text-3xl font-light leading-tight tracking-tight text-ink sm:text-5xl">
            E-Bike ROI Calculator
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-muted">
            How long until an e-bike pays for itself in saved gas, wear and
            tear, and mileage-driven depreciation? Pick your state, tune the
            inputs, and watch the payback line.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INPUTS */}
          <section className="bg-white rounded-xl shadow-sm border border-line p-6 space-y-5">
            <h2 className="font-display text-lg font-medium tracking-tight text-ink">
              Inputs
            </h2>

            <Field id="state" label="State">
              <select
                id="state"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="gas-price"
              label="Gas price"
              suffix="$/gal"
              caption="What you're currently paying per gallon."
            >
              <NumInput id="gas-price" value={gasPrice} step={0.01} min={0} max={20} onChange={setGasPrice} />
            </Field>

            <Field id="mpg" label="Car fuel economy" suffix="MPG">
              <NumInput id="mpg" value={mpg} step={1} min={1} max={150} onChange={setMpg} />
            </Field>

            <Field id="ebike-price" label="E-bike price" suffix="$">
              <NumInput id="ebike-price" value={ebikePrice} step={50} min={0} max={20000} onChange={setEbikePrice} />
            </Field>

            <Field
              id="kwh-price"
              label="Electricity price"
              suffix="$/kWh"
              caption={
                kwhPriceOverride === null ? (
                  `Pre-filled with the residential average for ${stateName}.`
                ) : (
                  <>
                    Your rate. The residential average for {stateName} is $
                    {stateKwhPrice.toFixed(3)}/kWh.{" "}
                    <button
                      type="button"
                      onClick={() => setKwhPriceOverride(null)}
                      className="text-accent underline hover:text-accent-soft"
                    >
                      Reset to state average
                    </button>
                  </>
                )
              }
            >
              <NumInput
                id="kwh-price"
                value={kwhPrice}
                step={0.01}
                min={0}
                max={2}
                onChange={setKwhPriceOverride}
              />
            </Field>

            <Field id="daily-miles" label="Daily miles driven" suffix="mi/day">
              <NumInput id="daily-miles" value={dailyMiles} step={1} min={0} max={200} onChange={setDailyMiles} />
            </Field>

            <Field
              id="replaceable-pct"
              label={`Replaceable by e-bike: ${replaceablePct}%`}
              caption="What share of your driving an e-bike could realistically take over. 100% = mostly short commutes/errands. 30% = lots of highway or family hauling."
            >
              <input
                id="replaceable-pct"
                type="range"
                min={0}
                max={100}
                value={replaceablePct}
                onChange={(e) => setReplaceablePct(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            </Field>

            <Field id="days-per-week" label="Days per week">
              <div className="inline-flex rounded-md border border-line overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={daysPerWeek === d}
                    onClick={() => setDaysPerWeek(d)}
                    className={`px-3 py-2 font-sans text-sm sm:px-4 ${
                      daysPerWeek === d
                        ? "bg-accent text-white"
                        : "bg-white text-ink/80 hover:bg-paper-deep"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>

            <div>
              <label
                htmlFor="ditch-car"
                className="flex items-start gap-3 font-sans text-sm font-medium text-ink"
              >
                <input
                  id="ditch-car"
                  type="checkbox"
                  checked={ditchCar}
                  onChange={(e) => setDitchCar(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                I&apos;ll get rid of a car
              </label>
              <p className="mt-1 pl-7 font-sans text-xs text-faint">
                Insurance, registration, financing, and most depreciation
                don&apos;t shrink when you drive less. They only count as
                savings if a car leaves the household.
              </p>
            </div>

            {ditchCar && (
              <Field
                id="car-fixed-cost"
                label="Fixed cost of that car"
                suffix="$/year"
                caption="AAA 2026 average for a new car: insurance, registration and taxes, financing, and the depreciation that happens regardless of miles. Lower it for an older, paid-off car."
              >
                <NumInput
                  id="car-fixed-cost"
                  value={carFixedAnnualCost}
                  step={100}
                  min={0}
                  max={50000}
                  onChange={setCarFixedAnnualCost}
                />
              </Field>
            )}

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-sm font-sans text-accent hover:text-accent-soft"
            >
              {showAdvanced ? "Hide" : "Show"} advanced
            </button>
            {showAdvanced && (
              <>
                <Field
                  id="wh-per-mile"
                  label="E-bike efficiency"
                  suffix="Wh/mi"
                  caption="A typical e-bike uses ~15–25 Wh per mile."
                >
                  <NumInput id="wh-per-mile" value={whPerMile} step={1} min={1} max={100} onChange={setWhPerMile} />
                </Field>

                <Field
                  id="car-variable-cost"
                  label="Car per-mile cost, beyond fuel"
                  suffix="$/mi"
                  caption="Only costs that scale with miles: maintenance, repairs, and tires (AAA 2026: 11.7¢) plus mileage-driven depreciation (8.4¢). Applied to the miles an e-bike replaces."
                >
                  <NumInput
                    id="car-variable-cost"
                    value={carVariableCostPerMile}
                    step={0.01}
                    min={0}
                    max={5}
                    onChange={setCarVariableCostPerMile}
                  />
                </Field>

                <Field
                  id="ebike-upkeep"
                  label="E-bike upkeep"
                  suffix="$/year"
                  caption="Tires, brake pads, tune-ups, and optional theft/liability insurance."
                >
                  <NumInput
                    id="ebike-upkeep"
                    value={ebikeAnnualUpkeep}
                    step={10}
                    min={0}
                    max={5000}
                    onChange={setEbikeAnnualUpkeep}
                  />
                </Field>
              </>
            )}
          </section>

          {/* RESULTS */}
          <section className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Payback period"
                value={paysBack ? formatPayback(result.paybackMonths) : "Never"}
                tone={paysBack ? "good" : "bad"}
              />
              <StatCard
                label="Annual net savings"
                value={formatUsd(result.annualSavings)}
                tone={paysBack ? "good" : "bad"}
              />
              <StatCard
                label="5-year net"
                value={formatUsd(result.fiveYearNet)}
                tone={result.fiveYearNet >= 0 ? "good" : "bad"}
              />
              <StatCard
                label="Annual CO₂ avoided"
                value={formatCo2Lbs(result.annualCo2SavedLbs)}
                tone={result.annualCo2SavedLbs >= 0 ? "good" : "bad"}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-line p-6">
              <h2 className="font-display text-lg font-medium tracking-tight text-ink mb-2">
                Cumulative net savings, first 5 years
              </h2>
              {paysBack ? (
                <p className="text-sm text-muted mb-3">
                  Crossing the dashed line at $0 is when the e-bike has paid
                  for itself in fuel, wear-and-tear, and depreciation
                  savings{ditchCar ? ", plus the fixed costs of the car you give up," : ","}{" "}
                  net of its own upkeep.
                </p>
              ) : (
                <p className="text-sm text-accent mb-3">
                  At these inputs, an e-bike doesn&apos;t pay back — driving
                  costs avoided don&apos;t exceed the e-bike&apos;s
                  electricity and upkeep costs. Try raising daily miles or
                  the replaceable percentage.
                </p>
              )}
              <RoiChart
                data={result.cumulativeByMonth}
                paybackMonths={result.paybackMonths}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-line p-6 text-sm text-ink/80 space-y-1">
              <h3 className="font-display text-base font-medium tracking-tight text-ink mb-2">
                Behind the numbers
              </h3>
              <Row
                label="Car fuel cost per mile"
                value={`$${result.carFuelCostPerMile.toFixed(3)}`}
              />
              <Row
                label="Car wear + depreciation / mi"
                value={`$${result.carVariableCostPerMile.toFixed(3)}`}
              />
              <Row
                label="Car variable cost / mi (total)"
                value={`$${result.carCostPerMile.toFixed(3)}`}
              />
              <Row
                label="E-bike electricity cost per mile"
                value={`$${result.ebikeCostPerMile.toFixed(3)}`}
              />
              <Row
                label="Savings per replaceable mile"
                value={`$${result.savingsPerMile.toFixed(3)}`}
              />
              <Row
                label="Replaceable miles / year"
                value={`${result.annualReplaceableMiles.toLocaleString(undefined, { maximumFractionDigits: 0 })} mi`}
              />
              <Row
                label="Fixed car costs saved / yr"
                value={formatUsd(result.carFixedAnnualSavings)}
              />
              <Row
                label="E-bike upkeep per year"
                value={formatUsd(result.ebikeAnnualUpkeep)}
              />
              <Row
                label="Car CO₂ per mile"
                value={`${result.carCo2PerMile.toFixed(2)} lbs`}
              />
              <Row
                label="E-bike CO₂ per mile"
                value={`${result.ebikeCo2PerMile.toFixed(2)} lbs`}
              />
              <Row
                label="5-year CO₂ avoided"
                value={formatCo2Lbs(result.fiveYearCo2SavedLbs)}
              />
            </div>
          </section>
        </div>

        <footer className="font-sans text-xs text-faint mt-8">
          Gas price is what you enter above. Electricity prices are recent
          residential averages from EIA — your actual rate may be higher or
          lower; edit the field to match your bill. Beyond fuel, only car
          costs that actually rise with mileage are counted per replaced
          mile: maintenance, repairs, and tires plus the mileage-driven part
          of depreciation, about $0.20/mi from{" "}
          <a
            href="https://newsroom.aaa.com/wp-content/uploads/2026/09/8-YDC-Brochure_2026-1.pdf"
            className="underline hover:text-accent"
          >
            AAA&apos;s 2026 Your Driving Costs
          </a>
          . Insurance, registration, financing, and the rest of depreciation
          are fixed, so they count only if you check &ldquo;I&apos;ll get rid
          of a car&rdquo; (default $7,250/year, AAA&apos;s new-car average).
          E-bike upkeep assumes routine maintenance and optional insurance.
          Edit these to match your situation. CO₂ avoided uses EPA&apos;s
          gallon-of-gasoline factor for the car and a national-average grid
          intensity for e-bike charging; your local grid mix may be cleaner
          or dirtier.
        </footer>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  suffix,
  caption,
  children,
}: {
  id: string;
  label: string;
  suffix?: string;
  caption?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label htmlFor={id} className="font-sans text-sm font-medium text-ink">
          {label}
        </label>
        {suffix && <span className="font-sans text-xs text-faint">{suffix}</span>}
      </div>
      {children}
      {caption && <p className="mt-1 font-sans text-xs text-faint">{caption}</p>}
    </div>
  );
}

// Parses a number field's text; null for empty or not-a-number input.
function parseNum(text: string): number | null {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

// Keeps the raw text as a draft so the field can be cleared or hold a
// partial entry ("", "-", "1e") while typing. Only finite, in-range values
// reach the math; on blur the field is clamped to min/max, or restored to
// the last valid value if it was left empty or invalid.
function NumInput({
  id,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const [shownValue, setShownValue] = useState(value);
  // The value changed from outside (e.g. a new state's electricity price):
  // show it, unless the draft already says the same number.
  if (value !== shownValue) {
    setShownValue(value);
    if (parseNum(draft) !== value) setDraft(String(value));
  }

  const clamp = (n: number) =>
    Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      value={draft}
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseNum(e.target.value);
        if (n !== null && n === clamp(n)) onChange(n);
      }}
      onBlur={() => {
        const n = parseNum(draft);
        const next = n === null ? value : clamp(n);
        setDraft(String(next));
        if (next !== value) onChange(next);
      }}
      className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "bad";
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-line p-5">
      <div className="font-sans text-xs uppercase tracking-wide text-faint">{label}</div>
      <div
        className={`mt-1 font-display text-2xl font-medium tracking-tight ${
          tone === "good" ? "text-ink" : "text-accent"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="font-sans text-muted">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}
