import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { setResults } from '../store/resultsSlice';
import { computeResults } from '../services/segmentationService';
import type { SegmentResult } from '../types';

const ResultsCalculator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const segments = useSelector((s: RootState) => s.segments.segments);
  const totalDistance = useSelector((s: RootState) => s.gpx.totalDistance);
  const { targetPaceSeconds, effortModel, uphillCost, downhillBenefit, powerExponent, splitStrategy, splitStrength } =
    useSelector((s: RootState) => s.settings);

  useEffect(() => {
    if (segments.length === 0 || totalDistance === 0 || targetPaceSeconds === 0) {
      dispatch(setResults({ basePace: 0, segmentResults: [] }));
      return;
    }

    const { basePace, effortFactors, splitFactors } = computeResults(
      segments,
      totalDistance,
      targetPaceSeconds,
      uphillCost,
      downhillBenefit,
      splitStrategy,
      splitStrength,
      effortModel,
      powerExponent,
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
  }, [segments, totalDistance, targetPaceSeconds, effortModel, uphillCost, downhillBenefit, powerExponent, splitStrategy, splitStrength, dispatch]);

  return null;
};

export default ResultsCalculator;
