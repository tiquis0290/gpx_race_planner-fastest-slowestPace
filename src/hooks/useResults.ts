import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useResults = () =>
  useSelector((s: RootState) => s.results);
