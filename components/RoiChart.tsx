"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { MonthPoint } from "@/lib/roi";

interface Props {
  data: MonthPoint[];
  paybackMonths: number | null;
}

export default function RoiChart({ data, paybackMonths }: Props) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={288}
        initialDimension={{ width: 520, height: 288 }}
      >
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3dccf" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#6b6358" }}
            stroke="#e3dccf"
            label={{
              value: "Months from purchase",
              position: "insideBottom",
              offset: -2,
              fontSize: 12,
              fill: "#6b6358",
            }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6b6358" }}
            stroke="#e3dccf"
            tickFormatter={(v: number) =>
              v >= 1000 || v <= -1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
            }
            label={{
              value: "Net $",
              angle: -90,
              position: "insideLeft",
              fontSize: 12,
              fill: "#6b6358",
            }}
          />
          <Tooltip
            formatter={(v) => [`$${Number(v).toFixed(0)}`, "Net"]}
            labelFormatter={(m) => `Month ${m}`}
            contentStyle={{
              backgroundColor: "#faf7f2",
              border: "1px solid #e3dccf",
              borderRadius: 6,
              fontSize: 12,
              color: "#1a1814",
            }}
          />
          <ReferenceLine y={0} stroke="#a8a096" strokeDasharray="4 2" />
          {paybackMonths !== null && paybackMonths <= 60 && (
            <ReferenceLine
              x={Math.round(paybackMonths)}
              stroke="#7a2e2e"
              strokeDasharray="4 2"
              label={{ value: "Payback", position: "top", fill: "#7a2e2e", fontSize: 12 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="net"
            stroke="#1a1814"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
