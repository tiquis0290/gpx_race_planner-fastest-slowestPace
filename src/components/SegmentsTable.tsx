import React, { useEffect, useRef, useState } from 'react';
import TableExportPanel from './TableExportPanel';
import { useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Dialog } from 'primereact/dialog';
import type { AppDispatch } from '../store';
import { setVisibleColumns } from '../store/settingsSlice';
import CollapsibleCard from './CollapsibleCard';
import { useSegmentData } from '../hooks/useSegmentData';
import { useResults } from '../hooks/useResults';
import { useAppSettings } from '../hooks/useAppSettings';
import type { Segment, SegmentResult, SegmentType } from '../types';
import { TYPE_SEVERITY } from '../types';
import { formatPace, formatDuration, formatTime } from '../services/formatters';
import { useT } from '../i18n/useT';
import { useHoveredSegment } from '../contexts/HoveredSegment';

const ALL_COL_KEYS = ['fromTo', 'lengthKm', 'elev', 'avgSlope', 'type', 'pace', 'segTime', 'cumTime', 'avgPace'] as const;
type ColKey = typeof ALL_COL_KEYS[number];

interface RowData {
  id: number;
  fromTo: string;
  lengthKm: string;
  elevGain: number;
  elevLoss: number;
  avgSlope: string;
  type: SegmentType;
  typeLabel: string;
  pace: string;
  segTime: string;
  cumTime: string;
  avgPace: string;
}



const SegmentsTable: React.FC = () => {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const { hoveredId, setHoveredId } = useHoveredSegment();
  const tableRef = useRef<DataTable<RowData[]>>(null);
  const tableSettingsRef = useRef<OverlayPanel>(null);
  const [exportVisible, setExportVisible] = useState(false);
  const { segments } = useSegmentData();
  const { segmentResults } = useResults();
  const { targetPaceSeconds, visibleColumns } = useAppSettings();
  const visibleCols = (visibleColumns ?? [...ALL_COL_KEYS]) as ColKey[];

  useEffect(() => {
    if (hoveredId === null || !tableRef.current) return;

    const tableElement = tableRef.current.getElement();
    if (!tableElement) return;

    if (tableElement.matches(':hover')) return;

    const scrollContainer = tableElement.querySelector('.p-datatable-wrapper') as HTMLElement;
    if (!scrollContainer) return;

    const hoveredRow = scrollContainer.querySelector('.segment-row-hovered') as HTMLElement;
    if (!hoveredRow) return;

    const rowRect = hoveredRow.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();

    const rowTop = rowRect.top - containerRect.top + scrollContainer.scrollTop;
    const oneThirdHeight = scrollContainer.clientHeight / 2;
    const targetScrollTop = Math.max(0, rowTop - oneThirdHeight);

    scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }, [hoveredId]);

  if (segments.length === 0) return null;

  const vis = (k: ColKey) => visibleCols.includes(k);

  const colOptions: { label: string; value: ColKey }[] = [
    { label: t.colFromTo,  value: 'fromTo'   },
    { label: t.colLength,  value: 'lengthKm' },
    { label: t.colElev,    value: 'elev'     },
    { label: t.colSlope,   value: 'avgSlope' },
    { label: t.colType,    value: 'type'     },
    { label: t.colPace,    value: 'pace'     },
    { label: t.colSegTime, value: 'segTime'  },
    { label: t.colCumTime, value: 'cumTime'  },
    { label: t.colAvgPace, value: 'avgPace'  },
  ];

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
    const cumDistKm = seg.endDistance / 1000;
    const avgPaceSec = cumTime > 0 && cumDistKm > 0 ? cumTime / cumDistKm : 0;
    return {
      id: seg.id,
      fromTo: `${(seg.startDistance / 1000).toFixed(2)}–${(seg.endDistance / 1000).toFixed(2)}`,
      lengthKm: (seg.length / 1000).toFixed(2),
      elevGain: Math.round(seg.elevationGain),
      elevLoss: Math.round(seg.elevationLoss),
      avgSlope: seg.avgSlope.toFixed(1),
      type: seg.type,
      typeLabel: typeLabels[seg.type],
      pace: `${formatPace(pace)} /km`,
      segTime: formatDuration(segTime),
      cumTime: formatTime(cumTime),
      avgPace: avgPaceSec > 0 ? `${formatPace(avgPaceSec)} /km` : '—',
    };
  });

  return (
    <>
      <CollapsibleCard
        title={t.segCardTitle(segments.length)}
        className="mb-3"
        fullscreenEnabled
        headerExtra={() => (
          <>
            <Button
              icon="pi pi-cog"
              text rounded
              className="collapsible-card-btn"
              tooltip={t.tableSettingsLabel}
              tooltipOptions={{ position: 'bottom' }}
              onClick={(e) => tableSettingsRef.current?.toggle(e)}
            />
            <Button
              icon="pi pi-download"
              text rounded
              className="collapsible-card-btn"
              tooltip={t.tableExportLabel}
              tooltipOptions={{ position: 'bottom' }}
              onClick={() => setExportVisible(true)}
            />
          </>
        )}
      >
        {(() => {
          const columns = [
            <Column key="id" field="id" header={t.colNum} style={{ width: '3rem' }} />,
          ];
          if (vis('fromTo'))   columns.push(<Column key="fromTo"   field="fromTo"   header={t.colFromTo} />);
          if (vis('lengthKm')) columns.push(<Column key="lengthKm" field="lengthKm" header={t.colLength} />);
          if (vis('elev'))     columns.push(<Column key="elev"     field="elevGain"  header={t.colElev} body={(r: RowData) => (
            <span>
              {r.elevGain > 0 && <span className="text-uphill">+{r.elevGain} m</span>}
              {r.elevLoss > 0 && <span className="text-downhill"> -{r.elevLoss} m</span>}
              {r.elevGain === 0 && r.elevLoss === 0 && '—'}
            </span>
          )} />);
          if (vis('avgSlope')) columns.push(<Column key="avgSlope" field="avgSlope"  header={t.colSlope} body={(r: RowData) => {
            const v = parseFloat(r.avgSlope);
            const cls = v > 0 ? 'text-uphill slope-value' : v < 0 ? 'text-downhill slope-value' : 'text-neutral slope-value';
            return <span className={cls}>{r.avgSlope}%</span>;
          }} />);
          if (vis('type'))     columns.push(<Column key="type"     field="typeLabel" header={t.colType} body={(r: RowData) => <Tag value={r.typeLabel} severity={TYPE_SEVERITY[r.type]} />} />);
          if (vis('pace'))     columns.push(<Column key="pace"    field="pace"    header={t.colPace} />);
          if (vis('segTime'))  columns.push(<Column key="segTime" field="segTime" header={t.colSegTime} />);
          if (vis('cumTime'))  columns.push(<Column key="cumTime" field="cumTime" header={t.colCumTime} />);
          if (vis('avgPace'))  columns.push(<Column key="avgPace" field="avgPace" header={t.colAvgPace} />);
          return (
            <DataTable
              key={visibleCols.join(',')}
              ref={tableRef}
              value={rows}
              size="small"
              scrollable
              scrollHeight="400px"
              rowClassName={(row: RowData) => hoveredId === row.id ? 'segment-row-hovered' : ''}
              onRowMouseEnter={(e) => setHoveredId((e.data as RowData).id)}
              onRowMouseLeave={() => setHoveredId(null)}
            >
              {columns}
            </DataTable>
          );
        })()}
      </CollapsibleCard>
      <Dialog
        header={t.tableExportLabel}
        visible={exportVisible}
        onHide={() => setExportVisible(false)}
        style={{ width: '800px' }}
      >
        <TableExportPanel
          columns={[
            { field: 'id',        label: t.colNum     },
            { field: 'fromTo',    label: t.colFromTo  },
            { field: 'lengthKm',  label: t.colLength  },
            { field: 'elev',      label: t.colElev    },
            { field: 'avgSlope',  label: t.colSlope   },
            { field: 'typeLabel', label: t.colType    },
            { field: 'pace',      label: t.colPace    },
            { field: 'segTime',   label: t.colSegTime },
            { field: 'cumTime',   label: t.colCumTime },
            { field: 'avgPace',   label: t.colAvgPace },
          ]}
          getData={(fields) => rows.map(r => {
            const map: Record<string, string | number> = {
              id: r.id,
              fromTo: r.fromTo,
              lengthKm: r.lengthKm,
              elev: r.elevGain > 0 ? `+${r.elevGain}` : r.elevLoss > 0 ? `-${r.elevLoss}` : '0',
              avgSlope: `${r.avgSlope}%`,
              typeLabel: r.typeLabel,
              pace: r.pace,
              segTime: r.segTime,
              cumTime: r.cumTime,
              avgPace: r.avgPace,
            };
            return fields.map(f => map[f] ?? '');
          })}
          onClose={() => setExportVisible(false)}
        />
      </Dialog>
      <OverlayPanel ref={tableSettingsRef}>
        <div className="text-sm font-semibold mb-3">{t.colColumns}</div>
        <MultiSelect
          value={visibleCols}
          options={colOptions}
          optionValue="value"
          onChange={(e) => dispatch(setVisibleColumns(e.value))}
          maxSelectedLabels={0}
          selectedItemsLabel={t.colColumns}
          className="col-selector"
        />
      </OverlayPanel>
    </>
  );
};

export default SegmentsTable;
