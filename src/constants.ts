import type { Lang } from './i18n/translations';

// App / author links shown in the footer
export const GITHUB_URL   = 'https://github.com/tiquis0290/gpx_race_planner-improvements';
export const AUTHOR_URL   = 'https://martinkobelka.cz';
export const AUTHOR_LABEL = 'original author: martinkobelka.cz';

// Available UI languages
export const LANGS: { value: Lang; label: string }[] = [
  { value: 'cs', label: 'CS' },
  { value: 'sk', label: 'SK' },
  { value: 'en', label: 'EN' },
];

