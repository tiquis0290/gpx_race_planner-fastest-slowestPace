import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useAppSettings = () =>
  useSelector((s: RootState) => s.settings);
