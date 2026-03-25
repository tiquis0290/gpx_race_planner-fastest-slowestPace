import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setResults } from '../store/resultsSlice';
import { computeResults } from '../services/segmentationService';
import type { SegmentResult } from '../types';
import { useDebounce } from '../hooks/useDebounce';

const ResultsCalculator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const segments      = useSelector((s: RootState) => s.segments.segments);
  const totalDistance = useSelector((s: RootState) => s.gpx.totalDistance);
  const { targetPaceSeconds, effortModel, uphillCost, downhillBenefit, powerExponent, splitStrategy, splitStrength } =
    useSelector((s: RootState) => s.settings);

  const dPace     = useDebounce(targetPaceSeconds, 1000);
  const dModel    = useDebounce(effortModel,       1000);
  const dUphill   = useDebounce(uphillCost,        1000);
  const dDownhill = useDebounce(downhillBenefit,   1000);
  const dExponent = useDebounce(powerExponent,     1000);
  const dStrategy = useDebounce(splitStrategy,     1000);
  const dStrength = useDebounce(splitStrength,     1000);

  useEffect(() => {
    if (segments.length === 0 || totalDistance === 0 || dPace === 0) {
      dispatch(setResults({ basePace: 0, segmentResults: [] }));
      return;
    }

    const { basePace, effortFactors, splitFactors } = computeResults(
      segments,
      totalDistance,
      dPace,
      dUphill,
      dDownhill,
      dStrategy,
      dStrength,
      dModel,
      dExponent,
    );

    let cumulativeTime = 0;
    const segmentResults: SegmentResult[] = segments.map((seg, i) => {
      const pace = basePace * effortFactors[i] * splitFactors[i];
      const segTime = (seg.length / 1000) * pace;
      cumulativeTime += segTime;
      return {
        segmentId: seg.id,
        effortFactor: effortFactors[i],
        splitFactor: splitFactors[i],
        paceSec: pace,
        segmentTimeSec: segTime,
        cumulativeTimeSec: cumulativeTime,
      };
    });

    dispatch(setResults({ basePace, segmentResults }));
  }, [segments, totalDistance, dPace, dModel, dUphill, dDownhill, dExponent, dStrategy, dStrength, dispatch]);

  return null;
};

export default ResultsCalculator;
