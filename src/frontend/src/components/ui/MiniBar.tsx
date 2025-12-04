import React from "react";

type MiniBarProps = {
  values: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

export default function MiniBar({
  values,
  labels = [],
  width = 320,
  height = 120,
  color = "#34d399",
  className,
}: MiniBarProps) {
  const max = Math.max(1, ...values);
  const n = values.length || 1;
  const gap = 6;
  const barW = Math.max(4, (width - (n + 1) * gap) / n);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      {values.map((v, i) => {
        const h = (v / max) * (height - 20);
        const x = gap + i * (barW + gap);
        const y = height - h;
        const label = labels[i] || String(i + 1);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill={color} rx={3} ry={3}>
              <title>{`${label}: ${v}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
