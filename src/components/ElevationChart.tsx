import React, { useMemo } from 'react';
import type { GpxPoint, Segment } from '../types';
import { useT } from '../i18n/useT';
import { useHoveredSegment } from '../contexts/HoveredSegment';

interface Props {
  points: GpxPoint[];
  segments: Segment[];
}

const SEGMENT_COLORS: Record<string, string> = {
  uphill:   '#ef4444',
  downhill: '#22c55e',
  flat:     '#64748b',
};

const ElevationChart: React.FC<Props> = ({ points, segments }) => {
  const t = useT();
  const { hoveredId, setHoveredId } = useHoveredSegment();

  const width         = 900;
  const height        = 235;
  const paddingLeft   = 55;
  const paddingRight  = 15;
  const paddingTop    = 35;
  const paddingBottom = 35;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const { minElev, maxElev, totalDist } = useMemo(() => {
    if (points.length === 0) return { minElev: 0, maxElev: 100, totalDist: 1 };
    let min = Infinity, max = -Infinity;
    for (const p of points) {
      if (p.elevation < min) min = p.elevation;
      if (p.elevation > max) max = p.elevation;
    }
    const pad = (max - min) * 0.1 || 10;
    return { minElev: min - pad, maxElev: max + pad, totalDist: points[points.length - 1].distance || 1 };
  }, [points]);

  const toX = (dist: number) => paddingLeft + (dist / totalDist) * chartW;
  const toY = (elev: number) => paddingTop + chartH - ((elev - minElev) / (maxElev - minElev)) * chartH;

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    const line = points.map((p) => `${toX(p.distance)},${toY(p.elevation)}`).join(' L ');
    const bottom = paddingTop + chartH;
    return `M ${toX(0)},${bottom} L ${line} L ${toX(totalDist)},${bottom} Z`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, minElev, maxElev, totalDist]);

  const kmTicks = useMemo(() => {
    const ticks = [];
    const totalKm = Math.floor(totalDist / 1000);
    for (let km = 0; km <= totalKm; km++) ticks.push({ x: toX(km * 1000), km });
    return ticks;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDist]);

  const yTicks = useMemo(() => {
    const range = maxElev - minElev;
    const step = Math.ceil(range / 5 / 10) * 10 || 10;
    const ticks = [];
    const startVal = Math.ceil(minElev / step) * step;
    for (let v = startVal; v <= maxElev; v += step) ticks.push({ y: toY(v), v: Math.round(v) });
    return ticks;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minElev, maxElev]);

  const legend = [
    { type: 'uphill',   label: t.chartUphill },
    { type: 'downhill', label: t.chartDownhill },
    { type: 'flat',     label: t.chartFlat },
  ];

  if (points.length === 0) {
    return <div className="chart-empty-text">{t.chartEmpty}</div>;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="elevation-svg"
      onMouseLeave={() => setHoveredId(null)}
    >
      {/* Grid */}
      {yTicks.map(({ y, v }) => (
        <line key={v} x1={paddingLeft} y1={y} x2={paddingLeft + chartW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
      ))}

      {/* Segment color bands */}
      {segments.map((seg) => {
        const x1 = toX(seg.startDistance);
        const x2 = toX(seg.endDistance);
        const isHovered = hoveredId === seg.id;
        return (
          <rect
            key={seg.id}
            x={x1} y={paddingTop}
            width={x2 - x1} height={chartH}
            fill={SEGMENT_COLORS[seg.type]}
            opacity={isHovered ? 0.35 : 0.12}
            className="seg-band"
            onMouseEnter={() => setHoveredId(seg.id)}
          />
        );
      })}

      {/* Hovered segment highlight border */}
      {hoveredId !== null && (() => {
        const seg = segments.find((s) => s.id === hoveredId);
        if (!seg) return null;
        const x1 = toX(seg.startDistance);
        const x2 = toX(seg.endDistance);
        return (
          <rect
            x={x1} y={paddingTop}
            width={x2 - x1} height={chartH}
            fill="none"
            stroke={SEGMENT_COLORS[seg.type]}
            strokeWidth={2}
            rx={1}
            className="seg-overlay"
          />
        );
      })()}

      {/* Elevation fill */}
      {pathData && <path d={pathData} fill="#94a3b8" opacity={0.35} className="seg-overlay" />}

      {/* Elevation line */}
      {points.length > 1 && (
        <polyline
          points={points.map((p) => `${toX(p.distance)},${toY(p.elevation)}`).join(' ')}
          fill="none" stroke="#334155" strokeWidth={1.5}
          className="seg-overlay"
        />
      )}

      {/* Axes */}
      <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + chartH} stroke="#475569" strokeWidth={1.5} />
      <line x1={paddingLeft} y1={paddingTop + chartH} x2={paddingLeft + chartW} y2={paddingTop + chartH} stroke="#475569" strokeWidth={1.5} />

      {/* X ticks */}
      {kmTicks.map(({ x, km }) => (
        <g key={km}>
          <line x1={x} y1={paddingTop + chartH} x2={x} y2={paddingTop + chartH + 4} stroke="#475569" strokeWidth={1} />
          <text x={x} y={paddingTop + chartH + 14} textAnchor="middle" fontSize={10} fill="#64748b">{km}</text>
        </g>
      ))}
      <text x={paddingLeft + chartW / 2} y={height - 2} textAnchor="middle" fontSize={10} fill="#64748b">{t.chartXLabel}</text>

      {/* Y ticks */}
      {yTicks.map(({ y, v }) => (
        <g key={v}>
          <line x1={paddingLeft - 4} y1={y} x2={paddingLeft} y2={y} stroke="#475569" strokeWidth={1} />
          <text x={paddingLeft - 7} y={y + 4} textAnchor="end" fontSize={10} fill="#64748b">{v}</text>
        </g>
      ))}
      <text x={12} y={paddingTop + chartH / 2} textAnchor="middle" fontSize={10} fill="#64748b"
        transform={`rotate(-90, 12, ${paddingTop + chartH / 2})`}>{t.chartYLabel}</text>

      {/* Legend */}
      {legend.map(({ type, label }, i) => (
        <g key={type} transform={`translate(${paddingLeft + i * 90}, ${paddingTop - 18})`}>
          <rect x={0} y={-8} width={12} height={10} fill={SEGMENT_COLORS[type]} opacity={0.7} rx={2} />
          <text x={15} y={0} fontSize={10} fill="#475569">{label}</text>
        </g>
      ))}
    </svg>
  );
};

export default ElevationChart;
