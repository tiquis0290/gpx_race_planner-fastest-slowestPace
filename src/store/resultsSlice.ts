import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SegmentResult } from '../types';

interface ResultsState {
  basePace: number;
  segmentResults: SegmentResult[];
  isCalculating: boolean;
}

const initialState: ResultsState = {
  basePace: 0,
  segmentResults: [],
  isCalculating: false,
};

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setResults(state, action: PayloadAction<{ basePace: number; segmentResults: SegmentResult[] }>) {
      state.basePace = action.payload.basePace;
      state.segmentResults = action.payload.segmentResults;
      state.isCalculating = false;
    },
    setIsCalculating(state, action: PayloadAction<boolean>) {
      state.isCalculating = action.payload;
    },
    resetResults() {
      return initialState;
    },
  },
});

export const { setResults, setIsCalculating, resetResults } = resultsSlice.actions;
export default resultsSlice.reducer;
