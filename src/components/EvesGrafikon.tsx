import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const data = [
  { honap: "Jan", bevetel: 120000, kiadas: 63000, egyenleg: 57000 },
  { honap: "Feb", bevetel: 90000, kiadas: 97000, egyenleg: -7000 },
  { honap: "Már", bevetel: 150000, kiadas: 55000, egyenleg: 95000 },
];

function formatFt(value: number): string {
  return `${value.toLocaleString("hu-HU")} Ft`;
}

export default function EvesGrafikon() {
  return (
    <div
      style={{
        width: "100%",
        height: 500,
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Éves grafikon</h2>

      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="honap" />
          <YAxis tickFormatter={(value) => formatFt(Number(value))} />
          <Tooltip
            formatter={(value: number) => formatFt(value)}
          />
          <Legend />
          <Bar dataKey="bevetel" name="Bevétel" />
          <Bar dataKey="kiadas" name="Kiadás" />
          <Line
            type="monotone"
            dataKey="egyenleg"
            name="Egyenleg"
            stroke="#333"
            strokeWidth={3}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}