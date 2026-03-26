import type { GpxPoint } from '../types';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseGpx(xmlText: string): GpxPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const trkpts = doc.querySelectorAll('trkpt');
  if (trkpts.length === 0) {
    throw new Error('No track points found in GPX file');
  }

  const points: GpxPoint[] = [];
  let cumulativeDistance = 0;

  trkpts.forEach((pt, i) => {
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');
    const eleEl = pt.querySelector('ele');
    const elevation = eleEl ? parseFloat(eleEl.textContent || '0') : 0;

    if (i > 0) {
      const prev = points[i - 1];
      cumulativeDistance += haversineDistance(prev.lat, prev.lon, lat, lon);
    }

    points.push({ lat, lon, elevation, distance: cumulativeDistance });
  });

  return points;
}

export function smoothElevations(points: GpxPoint[], windowSize: number): GpxPoint[] {
  if (points.length === 0) return points;
  const half = Math.floor(windowSize / 2);
  const result: GpxPoint[] = new Array(points.length);

  // Seed the sliding window with the first window
  let sum = 0;
  let lo = 0;
  let hi = Math.min(half, points.length - 1);
  for (let j = lo; j <= hi; j++) sum += points[j].elevation;

  for (let i = 0; i < points.length; i++) {
    // Expand right edge when possible
    const newHi = Math.min(i + half, points.length - 1);
    while (hi < newHi) { hi++; sum += points[hi].elevation; }
    // Shrink left edge when past the start
    const newLo = Math.max(0, i - half);
    while (lo < newLo) { sum -= points[lo].elevation; lo++; }

    result[i] = { ...points[i], elevation: sum / (hi - lo + 1) };
  }

  return result;
}

export function computeElevationStats(points: GpxPoint[]): {
  totalElevationGain: number;
  totalElevationLoss: number;
} {
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].elevation - points[i - 1].elevation;
    if (delta > 0) gain += delta;
    else loss += Math.abs(delta);
  }
  return { totalElevationGain: gain, totalElevationLoss: loss };
}
