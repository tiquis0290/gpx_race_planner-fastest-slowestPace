import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setSegments } from '../store/segmentsSlice';
import { setDisplayData } from '../store/gpxSlice';
import { buildSegments } from '../services/segmentationService';
import { smoothElevations, computeElevationStats } from '../services/gpxService';
import { useDebounce } from '../hooks/useDebounce';

const SegmentationWatcher: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const rawPoints = useSelector((s: RootState) => s.gpx.rawPoints);
  const { slopeThreshold, minSegmentLength, smoothingWindow } = useSelector((s: RootState) => s.segments);

  const dSmoothing  = useDebounce(smoothingWindow,  1000);
  const dSlope      = useDebounce(slopeThreshold,   1000);
  const dMinLength  = useDebounce(minSegmentLength, 1000);

  useEffect(() => {
    if (rawPoints.length < 2) return;

    const smoothed = smoothElevations(rawPoints, dSmoothing);
    const { totalElevationGain, totalElevationLoss } = computeElevationStats(smoothed);
    const totalDistance = smoothed[smoothed.length - 1].distance;

    dispatch(setDisplayData({ smoothedPoints: smoothed, totalDistance, totalElevationGain, totalElevationLoss }));
    dispatch(setSegments(buildSegments(smoothed, dSlope, dMinLength)));
  }, [rawPoints, dSmoothing, dSlope, dMinLength, dispatch]);

  return null;
};

export default SegmentationWatcher;
