import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
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
  const [zoom, setZoom] = useState(1);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', handler, { passive: false });

    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(el);

    return () => {
      el.removeEventListener('wheel', handler);
      obs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (hoveredId === null || !containerRef.current) return;

    const el = containerRef.current;
    if (el.matches(':hover')) return;

    const seg = segments.find((s) => s.id === hoveredId);
    if (!seg) return;

    const totalDist = points.length > 0 ? (points[points.length - 1].distance || 1) : 1;
    const totalKm   = totalDist / 1000;
    const BASE_PX_PER_KM = 120;
    const cw = Math.max(el.clientWidth, totalKm * BASE_PX_PER_KM * zoom);

    const segCenterX = ((seg.startDistance + seg.endDistance) / 2 / totalDist) * cw;
    const targetScrollLeft = Math.max(0, segCenterX - el.clientWidth / 2);

    el.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
  }, [hoveredId, segments, points, zoom]);

  const height        = 235;
  const paddingLeft   = 55;
  const paddingRight  = 15;
  const paddingTop    = 10;
  const paddingBottom = 35;

  const BASE_PX_PER_KM = 120;
  const totalDist  = points.length > 0 ? (points[points.length - 1].distance || 1) : 1;
  const totalKm    = totalDist / 1000;
  const minZoom    = totalKm > 0 ? (containerWidth - paddingRight) / (totalKm * BASE_PX_PER_KM) : 1;
  const chartW     = Math.max(containerWidth - paddingRight, totalKm * BASE_PX_PER_KM * zoom);
  const chartH     = height - paddingTop - paddingBottom;

  const { minElev, maxElev } = useMemo(() => {
    if (points.length === 0) return { minElev: 0, maxElev: 100 };
    let min = Infinity, max = -Infinity;
    for (const p of points) {
      if (p.elevation < min) min = p.elevation;
      if (p.elevation > max) max = p.elevation;
    }
    const pad = (max - min) * 0.1 || 10;
    return { minElev: min - pad, maxElev: max + pad };
  }, [points]);

  const toX = (dist: number) => (dist / totalDist) * chartW;
  const toY = (elev: number) => paddingTop + chartH - ((elev - minElev) / (maxElev - minElev)) * chartH;

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    const line = points.map((p) => `${toX(p.distance)},${toY(p.elevation)}`).join(' L ');
    const bottom = paddingTop + chartH;
    return `M ${toX(0)},${bottom} L ${line} L ${toX(totalDist)},${bottom} Z`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, minElev, maxElev, totalDist, chartW]);

  const pxPerKm = BASE_PX_PER_KM * zoom;
  const use100m = pxPerKm >= 300;

  const xTicks = useMemo(() => {
    const ticks: { x: number; label: string; major: boolean }[] = [];
    if (use100m) {
      const total100m = Math.floor(totalDist / 100);
      for (let i = 0; i <= total100m; i++) {
        const distM = i * 100;
        const major = i % 10 === 0;
        const label = major ? `${distM / 1000} km` : '';
        ticks.push({ x: toX(distM), label, major });
      }
    } else {
      const totalKmFloor = Math.floor(totalDist / 1000);
      for (let km = 0; km <= totalKmFloor; km++) {
        ticks.push({ x: toX(km * 1000), label: `${km} km`, major: true });
      }
    }
    return ticks;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDist, chartW, use100m]);

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

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(chartW, svgX));
    setCursorX(clampedX);

    const dist = (clampedX / chartW) * totalDist;
    const nextHoveredId =
      segments.find((seg) => dist >= seg.startDistance && dist <= seg.endDistance)?.id ?? null;
    if (nextHoveredId !== hoveredId) setHoveredId(nextHoveredId);
  };

  const cursorDist = useMemo(() => {
    if (cursorX === null) return null;
    return (cursorX / chartW) * totalDist;
  }, [cursorX, chartW, totalDist]);

  const cursorElev = useMemo(() => {
    if (cursorDist === null || points.length === 0) return null;
    if (cursorDist <= points[0].distance) return points[0].elevation;
    if (cursorDist >= points[points.length - 1].distance) return points[points.length - 1].elevation;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i], p2 = points[i + 1];
      if (cursorDist >= p1.distance && cursorDist <= p2.distance) {
        const span = p2.distance - p1.distance;
        if (span <= 0) return p1.elevation;
        const frac = (cursorDist - p1.distance) / span;
        return p1.elevation + (p2.elevation - p1.elevation) * frac;
      }
    }
    return null;
  }, [cursorDist, points]);

  const cursorMarkerY = useMemo(() => {
    if (cursorElev === null) return null;
    return toY(cursorElev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorElev, minElev, maxElev, paddingTop, chartH]);

  const cursorGrade = useMemo(() => {
    if (cursorDist === null || points.length === 0) return null;
    if (cursorDist <= points[0].distance) return 0;
    if (cursorDist >= points[points.length - 1].distance) return 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i], p2 = points[i + 1];
      if (cursorDist >= p1.distance && cursorDist <= p2.distance) {
        const span = p2.distance - p1.distance;
        if (span <= 0) return 0;
        return (p2.elevation - p1.elevation) / span;
      }
    }
    return null;
  }, [cursorDist, points]);

  const segment = useMemo(() => {
    if (hoveredId === null) return null;
    return segments.find((s) => s.id === hoveredId) || null;
  }, [hoveredId, segments]);

  if (points.length === 0) {
    return <div className="chart-empty-text">{t.chartEmpty}</div>;
  }

  return (
    <div className="elevation-chart-wrapper">

      {/* Header: legenda + zoom tlačítka */}
      <div className="elevation-chart-header">
        <div className="elevation-legend">
          {legend.map(({ type, label }) => (
            <span key={type} className="elevation-legend-item">
              <span className="elevation-legend-swatch" style={{ background: SEGMENT_COLORS[type] }} />
              {label}
            </span>
          ))}
        </div>
        <div className="elevation-zoom-controls">
          <Button icon="pi pi-minus" size="small" text disabled={zoom <= minZoom * 1.01} onClick={() => setZoom(z => Math.max(minZoom, z / 1.5))} />
          <Button icon="pi pi-plus"  size="small" text disabled={zoom >= 8} onClick={() => setZoom(z => Math.min(8, z * 1.5))} />
        </div>
      </div>

      {/* Tělo grafu: pevná Y-osa vlevo + scrollovatelný obsah */}
      <div className="elevation-chart-body">

        {/* Pevná Y-osa */}
        <svg className="elevation-y-axis-svg" width={paddingLeft} height={height}>
          <line x1={paddingLeft - 1} y1={paddingTop} x2={paddingLeft - 1} y2={paddingTop + chartH} stroke="#475569" strokeWidth={1.5} />
          {yTicks.map(({ y, v }) => (
            <g key={v}>
              <line x1={paddingLeft - 5} y1={y} x2={paddingLeft - 1} y2={y} stroke="#475569" strokeWidth={1} />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#64748b">{v}</text>
            </g>
          ))}
          <text x={10} y={paddingTop + chartH / 2} textAnchor="middle" fontSize={10} fill="#64748b"
            transform={`rotate(-90, 10, ${paddingTop + chartH / 2})`}>{t.chartYLabel}</text>
        </svg>

        {/* Scrollovatelný obsah */}
        <div ref={containerRef} className="elevation-scroll-container">
          <svg
            width={chartW + paddingRight}
            height={height}
            className="elevation-svg"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHoveredId(null); setCursorX(null); }}
          >
            {/* Grid */}
            {yTicks.map(({ y, v }) => (
              <line key={v} x1={0} y1={y} x2={chartW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
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

            {/* Mouse position guide */}
            {cursorX !== null && (
              <line
                x1={cursorX} y1={paddingTop}
                x2={cursorX} y2={paddingTop + chartH}
                stroke="#0f172a" strokeWidth={1}
                strokeDasharray="4 3" opacity={0.65}
                className="seg-overlay"
              />
            )}

            {/* Intersection marker */}
            {cursorX !== null && cursorMarkerY !== null && (
              <circle
                cx={cursorX} cy={cursorMarkerY}
                r={3.8}
                fill="#0f172a" stroke="#f8fafc" strokeWidth={1.2}
                className="seg-overlay"
              />
            )}

            {/* X-osa */}
            <line x1={0} y1={paddingTop + chartH} x2={chartW + paddingRight} y2={paddingTop + chartH} stroke="#475569" strokeWidth={1.5} />

            {/* X ticks */}
            {xTicks.map(({ x, label, major }, i) => (
              <g key={i}>
                <line
                  x1={x} y1={paddingTop + chartH}
                  x2={x} y2={paddingTop + chartH + (major ? 5 : 3)}
                  stroke="#475569" strokeWidth={major ? 1 : 0.75}
                />
                {label && (
                  <text x={x} y={paddingTop + chartH + 15} textAnchor={x === 0 ? 'start' : 'middle'} fontSize={10} fill="#64748b">{label}</text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Info lišta */}
      <div className="elevation-seg-data">
        {cursorX && (
          <div className="elevation-seg-data">
            <span>{t.chartDist}: {cursorDist ? (cursorDist / 1000).toFixed(2) : '-'} km</span> | <span>{t.chartElev}: {cursorElev ? cursorElev.toFixed(0) : '-'} m</span> | <span>{t.chartGrade}: {cursorGrade ? (cursorGrade * 100).toFixed(1) : '-'}%</span>
          </div>
        )}
        {cursorX && <span>|</span>}
        <div className="elevation-seg-data">
          <span>{t.chartAvgGrade}: {segment ? segment.avgSlope.toFixed(1) : '-'}%</span> | <span>{t.chartLength}: {segment?.length ? (segment.length / 1000).toFixed(2) : '-'} km</span> | <span>{t.chartGain}: {segment ? segment.elevationGain > 0.5 ? segment.elevationGain.toFixed(0) : -segment.elevationLoss.toFixed(0) : '-'} m</span>
        </div>
      </div>
    </div>
  );
};

export default ElevationChart;
