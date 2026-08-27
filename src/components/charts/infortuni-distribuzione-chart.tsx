 "use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export interface DistribuzionePoint {
  key: string;
  casi: number;
  label: string;
}

const PALETTE = ["#b3261e", "#c74a36", "#4a4a4a", "#7a7a7a", "#a3a3a3", "#5c5855", "#8a6444", "#44546a", "#6a4454", "#446a5c"];

export function InfortuniDistribuzioneChart({ data }: { data: DistribuzionePoint[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie isAnimationActive={false} data={data} dataKey="casi" nameKey="label" cx="50%" cy="50%" outerRadius={110} innerRadius={55} paddingAngle={1}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => Number(v ?? 0).toLocaleString("it-IT")} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
