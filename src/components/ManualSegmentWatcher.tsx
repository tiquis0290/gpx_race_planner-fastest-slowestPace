import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { setSegments } from '../store/segmentsSlice';
import { setDisplayData } from '../store/gpxSlice';
import { manualInputsToSegments, manualInputsToGpxPoints } from '../services/manualSegmentService';
import { computeElevationStats } from '../services/gpxService';
import { useSegmentData } from '../hooks/useSegmentData';

const ManualSegmentWatcher: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { manualInputs } = useSegmentData();

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
