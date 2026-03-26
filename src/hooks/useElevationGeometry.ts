import { useMemo } from 'react';
import type { GpxPoint } from '../types';

function lttb(points: GpxPoint[], threshold: number): GpxPoint[] {
  if (points.length <= threshold) return points;

  const sampled: GpxPoint[] = [points[0]];
  const bucketSize = (points.length - 2) / (threshold - 2);
  let prevSelected = 0;

  for (let i = 0; i < threshold - 2; i++) {
    // Average point of the next bucket (used as "anchor" for triangle area)
    const nextStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextEnd   = Math.min(Math.floor((i + 2) * bucketSize) + 1, points.length - 1);
    let avgX = 0, avgY = 0;
    for (let j = nextStart; j < nextEnd; j++) { avgX += points[j].distance; avgY += points[j].elevation; }
    const nextLen = nextEnd - nextStart;
    avgX /= nextLen; avgY /= nextLen;

    // Pick the point in the current bucket that forms the largest triangle
    const curStart = Math.floor(i * bucketSize) + 1;
    const curEnd   = Math.min(Math.floor((i + 1) * bucketSize) + 1, points.length - 1);
    const prev     = points[prevSelected];
    let maxArea = -1, maxIdx = curStart;

    for (let j = curStart; j < curEnd; j++) {
      const area = Math.abs(
        (prev.distance - avgX) * (points[j].elevation - prev.elevation) -
        (prev.distance - points[j].distance) * (avgY - prev.elevation),
      ) * 0.5;
      if (area > maxArea) { maxArea = area; maxIdx = j; }
    }

    sampled.push(points[maxIdx]);
    prevSelected = maxIdx;
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}

const HEIGHT         = 235;
const PADDING_LEFT   = 55;
const PADDING_RIGHT  = 15;
const PADDING_TOP    = 10;
const PADDING_BOTTOM = 35;
const BASE_PX_PER_KM = 120;

export interface ElevationGeometry {
  height: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  totalDist: number;
  chartW: number;
  chartH: number;
  minZoom: number;
  minElev: number;
  maxElev: number;
  toX: (dist: number) => number;
  toY: (elev: number) => number;
  decimatedPoints: GpxPoint[];
  pathData: string;
  xTicks: { x: number; label: string; major: boolean }[];
  yTicks: { y: number; v: number }[];
}

export function useElevationGeometry(
  points: GpxPoint[],
  zoom: number,
  containerWidth: number,
): ElevationGeometry {
  const totalDist = points.length > 0 ? (points[points.length - 1].distance || 1) : 1;
  const totalKm   = totalDist / 1000;
  const chartH    = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const minZoom   = totalKm > 0 ? (containerWidth - PADDING_RIGHT) / (totalKm * BASE_PX_PER_KM) : 1;
  const chartW    = Math.max(containerWidth - PADDING_RIGHT, totalKm * BASE_PX_PER_KM * zoom);

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
  const toY = (elev: number) => PADDING_TOP + chartH - ((elev - minElev) / (maxElev - minElev)) * chartH;

  const decimatedPoints = useMemo(() => {
    const threshold = Math.max(2, Math.round(chartW));
    return lttb(points, threshold);
  }, [points, chartW]);

  const pathData = useMemo(() => {
    if (decimatedPoints.length === 0) return '';
    const line = decimatedPoints.map((p) => `${toX(p.distance)},${toY(p.elevation)}`).join(' L ');
    const bottom = PADDING_TOP + chartH;
    return `M ${toX(0)},${bottom} L ${line} L ${toX(totalDist)},${bottom} Z`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decimatedPoints, minElev, maxElev, totalDist, chartW]);

  const pxPerKm = BASE_PX_PER_KM * zoom;
  const use100m = pxPerKm >= 300;

  const xTicks = useMemo(() => {
    const ticks: { x: number; label: string; major: boolean }[] = [];
    if (use100m) {
      // Minor ticks have no label — 6px spacing is enough
      const candidates = [100, 250, 500, 1000];
      const stepM = candidates.find(s => (s / totalDist) * chartW >= 6) ?? 1000;
      const total = Math.floor(totalDist / stepM);
      for (let i = 0; i <= total; i++) {
        const distM = i * stepM;
        const major = stepM >= 1000 || distM % 1000 === 0;
        const label = major ? `${distM / 1000} km` : '';
        ticks.push({ x: toX(distM), label, major });
      }
    } else {
      // Every tick has a label — need ~40px so labels don't overlap
      const candidates = [1, 2, 5, 10, 20, 50];
      const stepKm = candidates.find(s => (s * 1000 / totalDist) * chartW >= 40) ?? 50;
      const total = Math.floor(totalDist / 1000 / stepKm);
      for (let i = 0; i <= total; i++) {
        ticks.push({ x: toX(i * stepKm * 1000), label: `${i * stepKm} km`, major: true });
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

  return {
    height: HEIGHT,
    paddingLeft: PADDING_LEFT,
    paddingRight: PADDING_RIGHT,
    paddingTop: PADDING_TOP,
    paddingBottom: PADDING_BOTTOM,
    totalDist,
    chartW,
    chartH,
    minZoom,
    minElev,
    maxElev,
    toX,
    toY,
    decimatedPoints,
    pathData,
    xTicks,
    yTicks,
  };
}
