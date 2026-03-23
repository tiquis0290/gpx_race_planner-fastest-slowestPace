import React from 'react';
import { useSelector } from 'react-redux';
import { Card } from 'primereact/card';
import type { RootState } from '../store';
import { formatPace, formatTime } from '../services/formatters';
import { useT } from '../i18n/useT';

const SummaryPanel: React.FC = () => {
  const t = useT();
  const { totalDistance, totalElevationGain, totalElevationLoss } = useSelector((s: RootState) => s.gpx);
  const targetPaceSeconds = useSelector((s: RootState) => s.settings.targetPaceSeconds);
  const basePace          = useSelector((s: RootState) => s.results.basePace);

  const totalTimeSec = (totalDistance / 1000) * targetPaceSeconds;

  const stats = [
    { label: t.statDistance,  value: totalDistance > 0 ? `${(totalDistance / 1000).toFixed(2)} km` : '—', icon: 'pi pi-map',        color: '#3b82f6' },
    { label: t.statAscent,    value: totalElevationGain > 0 ? `+${Math.round(totalElevationGain)} m` : '—', icon: 'pi pi-arrow-up',   color: '#ef4444' },
    { label: t.statDescent,   value: totalElevationLoss > 0 ? `-${Math.round(totalElevationLoss)} m` : '—', icon: 'pi pi-arrow-down', color: '#22c55e' },
    { label: t.statTime,      value: totalDistance > 0 && targetPaceSeconds > 0 ? formatTime(totalTimeSec) : '—', icon: 'pi pi-clock', color: '#8b5cf6' },
    { label: t.statPace,      value: targetPaceSeconds > 0 ? `${formatPace(targetPaceSeconds)} /km` : '—', icon: 'pi pi-bolt',       color: '#f59e0b' },
    { label: t.statBasePace,  value: basePace > 0 ? `${formatPace(basePace)} /km` : '—',                   icon: 'pi pi-chart-line', color: '#06b6d4' },
  ];

  return (
    <div className="grid mb-3">
      {stats.map((s) => (
        <div key={s.label} className="col-4 lg:col summary-stat">
          <Card className="summary-card">
            <i className={`${s.icon} summary-card__icon`} style={{ '--icon-color': s.color } as React.CSSProperties} />
            <div className="summary-card__value">{s.value}</div>
            <div className="summary-card__label">{s.label}</div>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default SummaryPanel;
