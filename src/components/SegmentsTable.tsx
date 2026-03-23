import React from 'react';
import { useSelector } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import type { RootState } from '../store';
import type { Segment, SegmentResult, SegmentType } from '../types';
import { formatPace, formatTimeMinSec, formatTime } from '../services/formatters';
import { useT } from '../i18n/useT';
import { useHoveredSegment } from '../contexts/HoveredSegment';

interface RowData {
  id: number;
  fromTo: string;
  lengthKm: string;
  elevGain: number;
  elevLoss: number;
  avgSlope: string;
  type: SegmentType;
  pace: string;
  segTime: string;
  cumTime: string;
}

const TYPE_SEVERITY: Record<SegmentType, 'danger' | 'success' | 'secondary'> = {
  uphill: 'danger',
  downhill: 'success',
  flat: 'secondary',
};

const SegmentsTable: React.FC = () => {
  const t = useT();
  const { hoveredId, setHoveredId } = useHoveredSegment();
  const segments = useSelector((s: RootState) => s.segments.segments);
  const segmentResults = useSelector((s: RootState) => s.results.segmentResults);
  const targetPaceSeconds = useSelector((s: RootState) => s.settings.targetPaceSeconds);

  if (segments.length === 0) return null;

  const typeLabels: Record<SegmentType, string> = {
    uphill: t.typeUphill,
    downhill: t.typeDownhill,
    flat: t.typeFlat,
  };

  const rows: RowData[] = segments.map((seg: Segment, idx: number) => {
    const result: SegmentResult | undefined = segmentResults[idx];
    const pace = result ? result.paceSec : targetPaceSeconds;
    const segTime = result ? result.segmentTimeSec : (seg.length / 1000) * targetPaceSeconds;
    const cumTime = result ? result.cumulativeTimeSec : 0;
    return {
      id: seg.id,
      fromTo: `${(seg.startDistance / 1000).toFixed(2)}–${(seg.endDistance / 1000).toFixed(2)}`,
      lengthKm: (seg.length / 1000).toFixed(2),
      elevGain: Math.round(seg.elevationGain),
      elevLoss: Math.round(seg.elevationLoss),
      avgSlope: seg.avgSlope.toFixed(1),
      type: seg.type,
      pace: `${formatPace(pace)} /km`,
      segTime: formatTimeMinSec(segTime),
      cumTime: formatTime(cumTime),
    };
  });

  return (
    <DataTable
      value={rows}
      size="small"
      scrollable
      scrollHeight="400px"
      rowClassName={(row: RowData) => hoveredId === row.id ? 'segment-row-hovered' : ''}
      onRowMouseEnter={(e) => setHoveredId((e.data as RowData).id)}
      onRowMouseLeave={() => setHoveredId(null)}
    >
      <Column field="id" header={t.colNum} style={{ width: '3rem' }} />
      <Column field="fromTo" header={t.colFromTo} />
      <Column field="lengthKm" header={t.colLength} />
      <Column header={t.colElev} body={(r: RowData) => (
        <span>
          {r.elevGain > 0 && <span className="text-uphill">+{r.elevGain} m</span>}
          {r.elevLoss > 0 && <span className="text-downhill"> -{r.elevLoss} m</span>}
          {r.elevGain === 0 && r.elevLoss === 0 && '—'}
        </span>
      )} />
      <Column header={t.colSlope} body={(r: RowData) => {
        const v = parseFloat(r.avgSlope);
        const cls = v > 0 ? 'text-uphill slope-value' : v < 0 ? 'text-downhill slope-value' : 'text-neutral slope-value';
        return <span className={cls}>{r.avgSlope}%</span>;
      }} />
      <Column header={t.colType} body={(r: RowData) => <Tag value={typeLabels[r.type]} severity={TYPE_SEVERITY[r.type]} />} />
      <Column field="pace" header={t.colPace} />
      <Column field="segTime" header={t.colSegTime} />
      <Column field="cumTime" header={t.colCumTime} />
    </DataTable>
  );
};

export default SegmentsTable;
