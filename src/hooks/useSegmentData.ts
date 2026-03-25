import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useSegmentData = () =>
  useSelector((s: RootState) => s.segments);
