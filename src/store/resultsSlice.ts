import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SegmentResult } from '../types';

interface ResultsState {
  basePace: number;
  segmentResults: SegmentResult[];
}

const initialState: ResultsState = {
  basePace: 0,
  segmentResults: [],
};

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setResults(state, action: PayloadAction<{ basePace: number; segmentResults: SegmentResult[] }>) {
      state.basePace = action.payload.basePace;
      state.segmentResults = action.payload.segmentResults;
    },
    resetResults() {
      return initialState;
    },
  },
});

export const { setResults, resetResults } = resultsSlice.actions;
export default resultsSlice.reducer;
