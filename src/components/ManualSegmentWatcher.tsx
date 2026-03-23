import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setSegments } from '../store/segmentsSlice';
import { setDisplayData } from '../store/gpxSlice';
import { manualInputsToSegments, manualInputsToGpxPoints } from '../services/manualSegmentService';
import { computeElevationStats } from '../services/gpxService';
import type { ManualSegmentInput } from '../types';

const EMPTY_INPUTS: ManualSegmentInput[] = [];

const ManualSegmentWatcher: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const manualInputs = useSelector((s: RootState) => s.segments.manualInputs ?? EMPTY_INPUTS);

  useEffect(() => {
    const segments = manualInputsToSegments(manualInputs);
    const points = manualInputsToGpxPoints(manualInputs);
    const totalDistance = points.length > 0 ? points[points.length - 1].distance : 0;
    const { totalElevationGain, totalElevationLoss } = computeElevationStats(points);

    dispatch(setSegments(segments));
    dispatch(setDisplayData({ smoothedPoints: points, totalDistance, totalElevationGain, totalElevationLoss }));
  }, [manualInputs, dispatch]);

  return null;
};

export default ManualSegmentWatcher;
