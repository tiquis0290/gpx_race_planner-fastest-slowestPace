export function formatPace(secondsPerKm: number): string {
  if (!isFinite(secondsPerKm) || secondsPerKm <= 0) return '--:--';
  const total = Math.round(secondsPerKm);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatTime(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '--:--:--';
  const total = Math.round(totalSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimeMinSec(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '--:--';
  const total = Math.round(totalSeconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Formats as mm:ss for times under an hour, h:mm:ss otherwise. */
export function formatDuration(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '--:--';
  return totalSeconds >= 3600 ? formatTime(totalSeconds) : formatTimeMinSec(totalSeconds);
}

export function parsePace(str: string): number | null {
  const match = str.match(/^(\d+):(\d{2})$/);
  if (!match) return null;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  if (secs >= 60) return null;
  return mins * 60 + secs;
}

export function parseTimeHMS(str: string): number | null {
  const match = str.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = parseInt(match[3], 10);
  if (m >= 60 || s >= 60) return null;
  return h * 3600 + m * 60 + s;
}
