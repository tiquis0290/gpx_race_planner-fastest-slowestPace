import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useGpxData = () =>
  useSelector((s: RootState) => s.gpx);
