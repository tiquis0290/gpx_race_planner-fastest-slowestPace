import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { translations } from './translations';

export function useT() {
  const lang = useSelector((s: RootState) => s.settings.language);
  return translations[lang] ?? translations.cs;
}
