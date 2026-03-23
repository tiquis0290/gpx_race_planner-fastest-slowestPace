import React, { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { parseGpx, smoothElevations, computeElevationStats } from '../services/gpxService';
import { buildSegments } from '../services/segmentationService';
import { setGpxData, resetGpx } from '../store/gpxSlice';
import { setSegments, resetSegments, setSmoothingWindow, setSlopeThreshold, setMinSegmentLength } from '../store/segmentsSlice';
import { resetResults } from '../store/resultsSlice';
import type { RootState, AppDispatch } from '../store';
import HelpIcon from './HelpIcon';
import { useT } from '../i18n/useT';

const GpxUploader: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const fileName = useSelector((s: RootState) => s.gpx.fileName);
  const { slopeThreshold, minSegmentLength, smoothingWindow } = useSelector((s: RootState) => s.segments);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        alert('Prosím nahrajte soubor ve formátu .gpx');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const raw = parseGpx(text);
          const smoothed = smoothElevations(raw, smoothingWindow);
          const { totalElevationGain, totalElevationLoss } = computeElevationStats(smoothed);
          const totalDistance = smoothed.length > 0 ? smoothed[smoothed.length - 1].distance : 0;
          dispatch(setGpxData({ fileName: file.name, rawPoints: raw, smoothedPoints: smoothed, totalDistance, totalElevationGain, totalElevationLoss }));
          dispatch(setSegments(buildSegments(smoothed, slopeThreshold, minSegmentLength)));
        } catch (err) {
          alert('Chyba při čtení GPX souboru: ' + (err as Error).message);
        }
      };
      reader.readAsText(file);
    },
    [dispatch, smoothingWindow, slopeThreshold, minSegmentLength]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); };
  const handleDrop      = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };
  const handleReset     = () => { dispatch(resetGpx()); dispatch(resetSegments()); dispatch(resetResults()); };

  return (
    <Card title={t.gpxCard} className="mb-3">
      {fileName ? (
        <div>
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-map file-icon" />
            <span className="file-name">{fileName}</span>
            <Button label={t.remove} icon="pi pi-trash" severity="danger" size="small" outlined onClick={handleReset} className="ml-auto" />
          </div>
          <div className="gpx-params">
            <div className="gpx-param">
              <label className="block mb-1 text-sm font-medium gpx-param__label">
                {t.smoothing}
                <HelpIcon id="help-smoothing" text={t.helpSmoothing} />
              </label>
              <InputNumber value={smoothingWindow} onValueChange={(e) => dispatch(setSmoothingWindow(e.value ?? 7))} min={1} max={50} showButtons />
            </div>
            <div className="gpx-param">
              <label className="block mb-1 text-sm font-medium gpx-param__label">
                {t.slopeThreshold}
                <HelpIcon id="help-slope" text={t.helpSlope} />
              </label>
              <InputNumber value={slopeThreshold} onValueChange={(e) => dispatch(setSlopeThreshold(e.value ?? 5))} min={1} max={50} step={1} minFractionDigits={0} maxFractionDigits={0} suffix=" m/km" showButtons />
            </div>
            <div className="gpx-param">
              <label className="block mb-1 text-sm font-medium gpx-param__label">
                {t.minLength}
                <HelpIcon id="help-minlen" text={t.helpMinLen} />
              </label>
              <InputNumber value={minSegmentLength} onValueChange={(e) => dispatch(setMinSegmentLength(e.value ?? 100))} min={50} max={2000} step={50} showButtons />
            </div>
          </div>
        </div>
      ) : (
        <>
          <input ref={fileInputRef} type="file" accept=".gpx" className="fit-export-hidden" onChange={handleFileInput} />
          <div
            className={`drop-zone${dragging ? ' drop-zone--dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <i className={`pi pi-upload drop-zone__icon${dragging ? ' drop-zone__icon--dragging' : ''}`} />
            <div className={`drop-zone__title${dragging ? ' drop-zone__title--dragging' : ''}`}>
              {dragging ? t.dropZoneActive : t.dropZoneTitle}
            </div>
            <div className="drop-zone__hint">{t.dropZoneHint}</div>
          </div>
        </>
      )}
    </Card>
  );
};

export default GpxUploader;
