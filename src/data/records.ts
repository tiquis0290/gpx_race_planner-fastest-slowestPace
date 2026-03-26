export interface RunningRecord {
  id: string;
  distanceLabelKey: 'dist10km' | 'distMaraton';
  gender: 'M' | 'F';
  recordType: 'WR' | 'ČR';
  timeSec: number;
  distanceKm: number;
  athlete: string;
  year: number;
}

export const RUNNING_RECORDS: RunningRecord[] = [
  // Czech records
  {
    id: 'cr_mar_m',
    distanceLabelKey: 'distMaraton',
    gender: 'M',
    recordType: 'ČR',
    timeSec: 2 * 3600 + 11 * 60 + 57, // 2:11:57
    distanceKm: 42.195,
    athlete: 'Karel David',
    year: 1993,
  },
  {
    id: 'cr_mar_f',
    distanceLabelKey: 'distMaraton',
    gender: 'F',
    recordType: 'ČR',
    timeSec: 2 * 3600 + 23 * 60 + 44, // 2:23:44
    distanceKm: 42.195,
    athlete: 'Moira Stewartová',
    year: 2024,
  },
  // Czech records – 10 km
  {
    id: 'cr_10km_m',
    distanceLabelKey: 'dist10km',
    gender: 'M',
    recordType: 'ČR',
    timeSec: 28 * 60 + 19,            // 28:19
    distanceKm: 10,
    athlete: 'Martin Zajíc',
    year: 2026,
  },
  {
    id: 'cr_10km_f',
    distanceLabelKey: 'dist10km',
    gender: 'F',
    recordType: 'ČR',
    timeSec: 31 * 60 + 5,             // 31:05
    distanceKm: 10,
    athlete: 'Tereza Hrochová',
    year: 2026,
  },
  // World records
  {
    id: 'wr_10km_m',
    distanceLabelKey: 'dist10km',
    gender: 'M',
    recordType: 'WR',
    timeSec: 26 * 60 + 24,            // 26:24
    distanceKm: 10,
    athlete: 'Rhonex Kipruto',
    year: 2020,
  },
  {
    id: 'wr_10km_f',
    distanceLabelKey: 'dist10km',
    gender: 'F',
    recordType: 'WR',
    timeSec: 28 * 60 + 46,            // 28:46
    distanceKm: 10,
    athlete: 'Agnes Ngetich',
    year: 2024,
  },
  {
    id: 'wr_mar_m',
    distanceLabelKey: 'distMaraton',
    gender: 'M',
    recordType: 'WR',
    timeSec: 2 * 3600 + 0 * 60 + 35,  // 2:00:35
    distanceKm: 42.195,
    athlete: 'Kelvin Kiptum',
    year: 2023,
  },
  {
    id: 'wr_mar_f',
    distanceLabelKey: 'distMaraton',
    gender: 'F',
    recordType: 'WR',
    timeSec: 2 * 3600 + 9 * 60 + 56,  // 2:09:56
    distanceKm: 42.195,
    athlete: 'Ruth Chepngetich',
    year: 2024,
  },
];
