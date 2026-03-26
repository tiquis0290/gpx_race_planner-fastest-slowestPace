import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useElevationGeometry } from '../../src/hooks/useElevationGeometry';
import type { GpxPoint } from '../../src/types/index';

const pt = (distance: number, elevation: number): GpxPoint => ({ lat: 0, lon: 0, distance, elevation });

// containerWidth and zoom chosen so chartW is predictable in each describe block.
// chartW = max(containerWidth - 15, totalKm * 120 * zoom)

describe('useElevationGeometry – toX / toY', () => {
  // 10 km route, containerWidth=1200, zoom=1 → chartW = max(1185, 1200) = 1200
  const points = [pt(0, 300), pt(5000, 400), pt(10000, 350)];

  it('toX(0) === 0', () => {
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    expect(result.current.toX(0)).toBe(0);
  });

  it('toX(totalDist) === chartW', () => {
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    const { toX, totalDist, chartW } = result.current;
    expect(toX(totalDist)).toBeCloseTo(chartW, 5);
  });

  it('toY(maxElev) === paddingTop (top of chart area)', () => {
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    const { toY, maxElev, paddingTop } = result.current;
    expect(toY(maxElev)).toBeCloseTo(paddingTop, 5);
  });

  it('toY(minElev) === paddingTop + chartH (bottom of chart area)', () => {
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    const { toY, minElev, paddingTop, chartH } = result.current;
    expect(toY(minElev)).toBeCloseTo(paddingTop + chartH, 5);
  });

  it('midpoint elevation maps between top and bottom', () => {
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    const { toY, minElev, maxElev, paddingTop, chartH } = result.current;
    const mid = (minElev + maxElev) / 2;
    expect(toY(mid)).toBeCloseTo(paddingTop + chartH / 2, 5);
  });
});

describe('useElevationGeometry – minElev / maxElev with padding', () => {
  it('adds 10% of range as padding on both sides', () => {
    // range = 100, pad = 10 → minElev = 90, maxElev = 210
    const points = [pt(0, 100), pt(1000, 200)];
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    expect(result.current.minElev).toBeCloseTo(90, 5);
    expect(result.current.maxElev).toBeCloseTo(210, 5);
  });

  it('uses fallback padding of 10 when route is flat (range = 0)', () => {
    const points = [pt(0, 300), pt(1000, 300)];
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    expect(result.current.minElev).toBeCloseTo(290, 5);
    expect(result.current.maxElev).toBeCloseTo(310, 5);
  });

  it('returns default 0–100 for empty points array', () => {
    const { result } = renderHook(() => useElevationGeometry([], 1, 1200));
    expect(result.current.minElev).toBe(0);
    expect(result.current.maxElev).toBe(100);
  });
});

describe('useElevationGeometry – pathData', () => {
  it('returns empty string for empty points', () => {
    const { result } = renderHook(() => useElevationGeometry([], 1, 1200));
    expect(result.current.pathData).toBe('');
  });

  it('starts with "M " for non-empty points', () => {
    const points = [pt(0, 100), pt(1000, 150), pt(2000, 120)];
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    expect(result.current.pathData).toMatch(/^M /);
  });

  it('ends with "Z" (closed path)', () => {
    const points = [pt(0, 100), pt(1000, 150), pt(2000, 120)];
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    expect(result.current.pathData).toMatch(/Z$/);
  });
});

describe('useElevationGeometry – LTTB decimation', () => {
  it('returns all points when count is below the pixel threshold', () => {
    // 3 points, containerWidth=1200, zoom=1 → chartW=1200 → threshold=1200 → no decimation
    const points = [pt(0, 100), pt(5000, 150), pt(10000, 120)];
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    expect(result.current.decimatedPoints).toHaveLength(3);
  });

  it('always keeps first and last original point', () => {
    // 50 points, containerWidth=20, zoom=0.001 → chartW≈6 → threshold=6 → decimation fires
    const points = Array.from({ length: 50 }, (_, i) => pt(i * 1000, 100 + Math.sin(i) * 30));
    const { result } = renderHook(() => useElevationGeometry(points, 0.001, 20));
    const dec = result.current.decimatedPoints;
    expect(dec[0]).toBe(points[0]);
    expect(dec[dec.length - 1]).toBe(points[points.length - 1]);
  });

  it('reduces number of points when input exceeds threshold', () => {
    const points = Array.from({ length: 50 }, (_, i) => pt(i * 1000, 100 + Math.sin(i) * 30));
    const { result } = renderHook(() => useElevationGeometry(points, 0.001, 20));
    expect(result.current.decimatedPoints.length).toBeLessThan(points.length);
  });
});

describe('useElevationGeometry – yTicks', () => {
  it('generates ticks within the displayed elevation range', () => {
    const points = [pt(0, 200), pt(5000, 600)];
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    const { yTicks, minElev, maxElev } = result.current;
    expect(yTicks.length).toBeGreaterThan(0);
    for (const tick of yTicks) {
      expect(tick.v).toBeGreaterThanOrEqual(Math.floor(minElev));
      expect(tick.v).toBeLessThanOrEqual(Math.ceil(maxElev));
    }
  });

  it('tick values are multiples of 10', () => {
    const points = [pt(0, 200), pt(5000, 600)];
    const { result } = renderHook(() => useElevationGeometry(points, 1, 1200));
    for (const tick of result.current.yTicks) {
      expect(tick.v % 10).toBe(0);
    }
  });
});
