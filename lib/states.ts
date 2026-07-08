// State data: name and average residential electricity rate ($/kWh) from
// EIA (approx. 2024 averages). Used only to pre-fill a sensible electricity
// price default — gas price is entered manually.

export interface StateInfo {
  code: string;
  name: string;
  kwhPrice: number; // $/kWh, residential avg
}

export const STATES: StateInfo[] = [
  { code: "AL", name: "Alabama", kwhPrice: 0.145 },
  { code: "AK", name: "Alaska", kwhPrice: 0.245 },
  { code: "AZ", name: "Arizona", kwhPrice: 0.145 },
  { code: "AR", name: "Arkansas", kwhPrice: 0.12 },
  { code: "CA", name: "California", kwhPrice: 0.305 },
  { code: "CO", name: "Colorado", kwhPrice: 0.14 },
  { code: "CT", name: "Connecticut", kwhPrice: 0.285 },
  { code: "DE", name: "Delaware", kwhPrice: 0.14 },
  { code: "DC", name: "District of Columbia", kwhPrice: 0.16 },
  { code: "FL", name: "Florida", kwhPrice: 0.145 },
  { code: "GA", name: "Georgia", kwhPrice: 0.135 },
  { code: "HI", name: "Hawaii", kwhPrice: 0.415 },
  { code: "ID", name: "Idaho", kwhPrice: 0.11 },
  { code: "IL", name: "Illinois", kwhPrice: 0.16 },
  { code: "IN", name: "Indiana", kwhPrice: 0.145 },
  { code: "IA", name: "Iowa", kwhPrice: 0.135 },
  { code: "KS", name: "Kansas", kwhPrice: 0.135 },
  { code: "KY", name: "Kentucky", kwhPrice: 0.125 },
  { code: "LA", name: "Louisiana", kwhPrice: 0.12 },
  { code: "ME", name: "Maine", kwhPrice: 0.26 },
  { code: "MD", name: "Maryland", kwhPrice: 0.165 },
  { code: "MA", name: "Massachusetts", kwhPrice: 0.285 },
  { code: "MI", name: "Michigan", kwhPrice: 0.185 },
  { code: "MN", name: "Minnesota", kwhPrice: 0.145 },
  { code: "MS", name: "Mississippi", kwhPrice: 0.135 },
  { code: "MO", name: "Missouri", kwhPrice: 0.12 },
  { code: "MT", name: "Montana", kwhPrice: 0.12 },
  { code: "NE", name: "Nebraska", kwhPrice: 0.115 },
  { code: "NV", name: "Nevada", kwhPrice: 0.165 },
  { code: "NH", name: "New Hampshire", kwhPrice: 0.24 },
  { code: "NJ", name: "New Jersey", kwhPrice: 0.18 },
  { code: "NM", name: "New Mexico", kwhPrice: 0.145 },
  { code: "NY", name: "New York", kwhPrice: 0.225 },
  { code: "NC", name: "North Carolina", kwhPrice: 0.13 },
  { code: "ND", name: "North Dakota", kwhPrice: 0.11 },
  { code: "OH", name: "Ohio", kwhPrice: 0.155 },
  { code: "OK", name: "Oklahoma", kwhPrice: 0.12 },
  { code: "OR", name: "Oregon", kwhPrice: 0.125 },
  { code: "PA", name: "Pennsylvania", kwhPrice: 0.18 },
  { code: "RI", name: "Rhode Island", kwhPrice: 0.26 },
  { code: "SC", name: "South Carolina", kwhPrice: 0.14 },
  { code: "SD", name: "South Dakota", kwhPrice: 0.12 },
  { code: "TN", name: "Tennessee", kwhPrice: 0.125 },
  { code: "TX", name: "Texas", kwhPrice: 0.145 },
  { code: "UT", name: "Utah", kwhPrice: 0.11 },
  { code: "VT", name: "Vermont", kwhPrice: 0.22 },
  { code: "VA", name: "Virginia", kwhPrice: 0.14 },
  { code: "WA", name: "Washington", kwhPrice: 0.115 },
  { code: "WV", name: "West Virginia", kwhPrice: 0.145 },
  { code: "WI", name: "Wisconsin", kwhPrice: 0.16 },
  { code: "WY", name: "Wyoming", kwhPrice: 0.115 },
].sort((a, b) => a.name.localeCompare(b.name));

export function getState(code: string): StateInfo | undefined {
  return STATES.find((s) => s.code === code);
}
