import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { SelectButton } from 'primereact/selectbutton';
import type { RootState, AppDispatch } from '../store';
import { setTargetMode, setTargetPaceSeconds, setTargetTimeSeconds } from '../store/settingsSlice';
import { setIsCalculating } from '../store/resultsSlice';
import { formatPace, formatTime, parsePace, parseTimeHMS } from '../services/formatters';
import { useT } from '../i18n/useT';

const PaceSettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const { targetMode, targetPaceSeconds, targetTimeSeconds } = useSelector((s: RootState) => s.settings);
  const totalDistance = useSelector((s: RootState) => s.gpx.totalDistance);

  const [collapsed, setCollapsed] = useState(false);
  const [paceInput, setPaceInput] = useState(formatPace(targetPaceSeconds));
  const [timeInput, setTimeInput] = useState(formatTime(targetTimeSeconds));
  const [paceError, setPaceError] = useState('');
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (targetMode === 'pace') {
      setPaceInput(formatPace(targetPaceSeconds));
      if (totalDistance > 0) setTimeInput(formatTime((totalDistance / 1000) * targetPaceSeconds));
    } else {
      setTimeInput(formatTime(targetTimeSeconds));
      if (totalDistance > 0 && targetTimeSeconds > 0) setPaceInput(formatPace(targetTimeSeconds / (totalDistance / 1000)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMode, totalDistance]);

  const handlePaceChange = useCallback((val: string) => {
    setPaceInput(val);
    const parsed = parsePace(val);
    if (parsed === null) { setPaceError(t.paceErrorFormat); return; }
    if (parsed < 120 || parsed > 900) { setPaceError(t.paceErrorRange); return; }
    setPaceError('');
    dispatch(setIsCalculating(true));
    dispatch(setTargetPaceSeconds(parsed));
    if (totalDistance > 0) {
      const totalSec = Math.round((totalDistance / 1000) * parsed);
      dispatch(setTargetTimeSeconds(totalSec));
      setTimeInput(formatTime(totalSec));
    }
  }, [dispatch, totalDistance, t]);

  const handleTimeChange = useCallback((val: string) => {
    setTimeInput(val);
    const parsed = parseTimeHMS(val);
    if (parsed === null) { setTimeError(t.timeErrorFormat); return; }
    if (parsed <= 0) { setTimeError(t.timeErrorPositive); return; }
    setTimeError('');
    dispatch(setIsCalculating(true));
    dispatch(setTargetTimeSeconds(parsed));
    if (totalDistance > 0) {
      const paceSec = Math.round(parsed / (totalDistance / 1000));
      dispatch(setTargetPaceSeconds(paceSec));
      setPaceInput(formatPace(paceSec));
    }
  }, [dispatch, totalDistance, t]);

  const modeOptions = [
    { label: t.modePace, value: 'pace' },
    { label: t.modeTime, value: 'time' },
  ];

  const cardTitle = (
    <div className="collapsible-card-title">
      <Button
        icon={`pi pi-chevron-${collapsed ? 'down' : 'up'}`}
        text rounded
        className="collapsible-card-btn"
        onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
      />
      <span>{t.paceCard}</span>
    </div>
  );

  return (
    <Card title={cardTitle} className="mb-3">
      {collapsed ? null : <>
      <div className="mb-3">
        <SelectButton value={targetMode} options={modeOptions} disabled />
      </div>
      <div className="pace-inputs">
        <div className="pace-input">
          <label className="block mb-1 text-sm font-medium">{t.paceLabel}</label>
          <InputText
            value={paceInput}
            onChange={(e) => handlePaceChange(e.target.value)}
            onFocus={() => dispatch(setTargetMode('pace'))}
            placeholder="5:30"
            className={paceError ? 'p-invalid' : ''}
          />
          {paceError && <small className="p-error block mt-1">{paceError}</small>}
        </div>
        <div className="pace-input">
          <label className="block mb-1 text-sm font-medium">{t.timeLabel}</label>
          <InputText
            value={timeInput}
            onChange={(e) => handleTimeChange(e.target.value)}
            onFocus={() => dispatch(setTargetMode('time'))}
            placeholder="1:45:00"
            className={timeError ? 'p-invalid' : ''}
          />
          {timeError && <small className="p-error block mt-1">{timeError}</small>}
        </div>
      </div>
      {totalDistance === 0 && <small className="text-color-secondary mt-2 block">{t.paceHint}</small>}
      </>}
    </Card>
  );
};

export default PaceSettings;
