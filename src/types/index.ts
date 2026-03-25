export interface GpxPoint {
  lat: number;
  lon: number;
  elevation: number;
  distance: number; // cumulative distance in meters
}

export type SegmentType = 'uphill' | 'downhill' | 'flat';

export const TYPE_SEVERITY: Record<SegmentType, 'danger' | 'success' | 'secondary'> = {
  uphill: 'danger',
  downhill: 'success',
  flat: 'secondary',
};

export interface Segment {
  id: number;
  startDistance: number; // meters
  endDistance: number;   // meters
  length: number;        // meters
  startElevation: number;
  endElevation: number;
  elevationGain: number;
  elevationLoss: number;
  avgSlope: number;      // percent
  type: SegmentType;
}

export interface ManualSegmentInput {
  uid: string;
  type: SegmentType;
  lengthKm: number;
  elevationChangeM: number; // positive = gain, negative = loss
}

export interface SegmentResult {
  segmentId: number;
  effortFactor: number;
  splitFactor: number;
  paceSec: number;       // sec/km
  segmentTimeSec: number;
  cumulativeTimeSec: number;
}
