import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Segment, ManualSegmentInput } from '../types';

interface SegmentsState {
  segments: Segment[];
  slopeThreshold: number;
  minSegmentLength: number;
  smoothingWindow: number;
  manualInputs: ManualSegmentInput[];
}

const initialState: SegmentsState = {
  segments: [],
  slopeThreshold: 5,
  minSegmentLength: 100,
  smoothingWindow: 7,
  manualInputs: [],
};

const segmentsSlice = createSlice({
  name: 'segments',
  initialState,
  reducers: {
    setSegments(state, action: PayloadAction<Segment[]>) {
      state.segments = action.payload;
    },
    setSlopeThreshold(state, action: PayloadAction<number>) {
      state.slopeThreshold = action.payload;
    },
    setMinSegmentLength(state, action: PayloadAction<number>) {
      state.minSegmentLength = action.payload;
    },
    setSmoothingWindow(state, action: PayloadAction<number>) {
      state.smoothingWindow = action.payload;
    },
    resetSegments(state) {
      state.segments = [];
    },
    setManualInputs(state, action: PayloadAction<ManualSegmentInput[]>) {
      state.manualInputs = action.payload;
    },
    addManualInput(state, action: PayloadAction<ManualSegmentInput>) {
      state.manualInputs.push(action.payload);
    },
    updateManualInput(state, action: PayloadAction<ManualSegmentInput>) {
      const idx = state.manualInputs.findIndex((s) => s.uid === action.payload.uid);
      if (idx !== -1) state.manualInputs[idx] = action.payload;
    },
    removeManualInput(state, action: PayloadAction<string>) {
      state.manualInputs = state.manualInputs.filter((s) => s.uid !== action.payload);
    },
    resetManualInputs(state) {
      state.manualInputs = [];
    },
  },
});

export const {
  setSegments,
  setSlopeThreshold,
  setMinSegmentLength,
  setSmoothingWindow,
  resetSegments,
  setManualInputs,
  addManualInput,
  updateManualInput,
  removeManualInput,
  resetManualInputs,
} = segmentsSlice.actions;
export default segmentsSlice.reducer;
