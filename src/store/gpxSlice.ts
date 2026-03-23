import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GpxPoint } from '../types';

interface GpxState {
  fileName: string | null;
  rawPoints: GpxPoint[];
  smoothedPoints: GpxPoint[];
  totalDistance: number;
  totalElevationGain: number;
  totalElevationLoss: number;
}

const initialState: GpxState = {
  fileName: null,
  rawPoints: [],
  smoothedPoints: [],
  totalDistance: 0,
  totalElevationGain: 0,
  totalElevationLoss: 0,
};

const gpxSlice = createSlice({
  name: 'gpx',
  initialState,
  reducers: {
    setGpxData(state, action: PayloadAction<{
      fileName: string | null;
      rawPoints: GpxPoint[];
      smoothedPoints: GpxPoint[];
      totalDistance: number;
      totalElevationGain: number;
      totalElevationLoss: number;
    }>) {
      state.fileName = action.payload.fileName;
      state.rawPoints = action.payload.rawPoints;
      state.smoothedPoints = action.payload.smoothedPoints;
      state.totalDistance = action.payload.totalDistance;
      state.totalElevationGain = action.payload.totalElevationGain;
      state.totalElevationLoss = action.payload.totalElevationLoss;
    },
    // Updates only the display fields (smoothedPoints + stats).
    // Used by both SegmentationWatcher and ManualSegmentWatcher so that
    // rawPoints and fileName are never overwritten when switching modes.
    setDisplayData(state, action: PayloadAction<{
      smoothedPoints: GpxPoint[];
      totalDistance: number;
      totalElevationGain: number;
      totalElevationLoss: number;
    }>) {
      state.smoothedPoints = action.payload.smoothedPoints;
      state.totalDistance = action.payload.totalDistance;
      state.totalElevationGain = action.payload.totalElevationGain;
      state.totalElevationLoss = action.payload.totalElevationLoss;
    },
    resetGpx() {
      return initialState;
    },
  },
});

export const { setGpxData, setDisplayData, resetGpx } = gpxSlice.actions;
export default gpxSlice.reducer;
