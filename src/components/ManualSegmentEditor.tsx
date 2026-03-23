import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { SelectButton } from 'primereact/selectbutton';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import type { RootState, AppDispatch } from '../store';
import { addManualInput, removeManualInput, updateManualInput, resetManualInputs } from '../store/segmentsSlice';
import type { ManualSegmentInput, SegmentType } from '../types';
import { useT } from '../i18n/useT';
import { autoType } from '../services/manualSegmentService';

const TYPE_SEVERITY: Record<SegmentType, 'danger' | 'success' | 'secondary'> = {
  uphill: 'danger',
  downhill: 'success',
  flat: 'secondary',
};

const uid = () => Math.random().toString(36).slice(2);
const EMPTY_INPUTS: ManualSegmentInput[] = [];

const pctToM = (pct: number, lengthKm: number) => pct * lengthKm * 10;
const mToPct = (m: number, lengthKm: number) => lengthKm > 0 ? (m / (lengthKm * 1000)) * 100 : 0;

const ManualSegmentEditor: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const manualInputs = useSelector((s: RootState) => s.segments.manualInputs ?? EMPTY_INPUTS);
  const slopeThreshold = useSelector((s: RootState) => s.segments.slopeThreshold);

  const [formLength, setFormLength] = useState<number>(1);
  const [formElevM, setFormElevM] = useState<number>(0);
  const [elevUnit, setElevUnit] = useState<'m' | '%'>('m');
  const [editingUid, setEditingUid] = useState<string | null>(null);

  const formElevPct = mToPct(formElevM, formLength);
  const detectedType = autoType(formElevM, formLength, slopeThreshold);
  const editingIndex = editingUid ? manualInputs.findIndex((i) => i.uid === editingUid) : -1;

  const unitOptions = [
    { label: 'm', value: 'm' },
    { label: '%', value: '%' },
  ];

  const resetForm = () => {
    setFormLength(1);
    setFormElevM(0);
    setEditingUid(null);
  };

  const handleStartEdit = (row: ManualSegmentInput) => {
    setFormLength(row.lengthKm);
    setFormElevM(row.elevationChangeM);
    setElevUnit('m');
    setEditingUid(row.uid);
  };

  const handleSubmit = () => {
    if (!formLength || formLength <= 0) return;
    if (editingUid) {
      dispatch(updateManualInput({ uid: editingUid, type: detectedType, lengthKm: formLength, elevationChangeM: formElevM }));
      resetForm();
    } else {
      dispatch(addManualInput({ uid: uid(), type: detectedType, lengthKm: formLength, elevationChangeM: formElevM }));
      setFormElevM(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape' && editingUid) resetForm();
  };

  const totalKm   = manualInputs.reduce((s, i) => s + i.lengthKm, 0);
  const totalGain = manualInputs.reduce((s, i) => s + Math.max(0, i.elevationChangeM), 0);
  const totalLoss = manualInputs.reduce((s, i) => s + Math.max(0, -i.elevationChangeM), 0);

  const typeLabels = { uphill: t.typeUphill, downhill: t.typeDownhill, flat: t.typeFlat };

  return (
    <Card title={t.manualEditorCard} className="mb-3">
      {editingUid && (
        <div className="edit-banner">
          <i className="pi pi-pencil" />
          <span>{t.manualEditingSegment(editingIndex + 1)}</span>
        </div>
      )}

      <div className="manual-form">
        <div className="manual-form-row">
          <div className="manual-form-field">
            <label className="block mb-1 text-sm font-medium">{t.manualLength}</label>
            <InputNumber
              value={formLength}
              onValueChange={(e) => setFormLength(e.value ?? 1)}
              min={0.01} step={0.1} minFractionDigits={2} maxFractionDigits={2}
              suffix=" km" showButtons onKeyDown={handleKeyDown}
            />
          </div>
          <div className="manual-form-field">
            <label className="block mb-1 text-sm font-medium">{t.manualElevChange}</label>
            {elevUnit === 'm' ? (
              <InputNumber
                value={formElevM}
                onValueChange={(e) => setFormElevM(e.value ?? 0)}
                step={1} suffix=" m" showButtons onKeyDown={handleKeyDown}
                minFractionDigits={0} maxFractionDigits={0}
              />
            ) : (
              <InputNumber
                value={parseFloat(formElevPct.toFixed(2))}
                onValueChange={(e) => setFormElevM(pctToM(e.value ?? 0, formLength))}
                step={0.5} suffix=" %" showButtons onKeyDown={handleKeyDown}
                minFractionDigits={1} maxFractionDigits={2}
              />
            )}
          </div>
          <div>
            <SelectButton
              value={elevUnit}
              options={unitOptions}
              onChange={(e) => e.value && setElevUnit(e.value)}
            />
          </div>
          <div className="manual-form-actions">
            {editingUid ? (
              <>
                <Button icon="pi pi-check" severity="success" onClick={handleSubmit} tooltip={t.manualSave} tooltipOptions={{ position: 'top' }} />
                <Button icon="pi pi-times" severity="secondary" outlined onClick={resetForm} tooltip={t.manualCancel} tooltipOptions={{ position: 'top' }} />
              </>
            ) : (
              <Button icon="pi pi-plus" severity="success" onClick={handleSubmit} tooltip={t.manualAddSegment} tooltipOptions={{ position: 'top' }} />
            )}
          </div>
        </div>

        <div className="type-indicator">
          <span>{t.manualType}:</span>
          <Tag value={typeLabels[detectedType]} severity={TYPE_SEVERITY[detectedType]} />
          <span className="type-indicator__detail">
            ({formElevPct >= 0 ? '+' : ''}{formElevPct.toFixed(1)} %, {formElevM >= 0 ? '+' : ''}{Math.round(formElevM)} m)
          </span>
        </div>
      </div>

      {manualInputs.length > 0 ? (
        <>
          <DataTable
            value={manualInputs}
            size="small"
            scrollable
            scrollHeight="280px"
            rowClassName={(r: ManualSegmentInput) => r.uid === editingUid ? 'segment-row-editing' : ''}
          >
            <Column header="#" style={{ width: '2.5rem' }} body={(_row: ManualSegmentInput, opts) => opts.rowIndex + 1} />
            <Column header={t.manualLength} body={(r: ManualSegmentInput) => `${r.lengthKm.toFixed(2)} km`} />
            <Column
              header={t.manualElevChange}
              body={(r: ManualSegmentInput) => {
                const pct = mToPct(r.elevationChangeM, r.lengthKm);
                const cls = r.elevationChangeM > 0 ? 'text-uphill' : r.elevationChangeM < 0 ? 'text-downhill' : 'text-neutral';
                return (
                  <span className={`elev-value ${cls}`}>
                    {r.elevationChangeM > 0 ? '+' : ''}{Math.round(r.elevationChangeM)} m
                    <span className="elev-detail">
                      ({pct >= 0 ? '+' : ''}{pct.toFixed(1)} %)
                    </span>
                  </span>
                );
              }}
            />
            <Column
              header={t.colType}
              body={(r: ManualSegmentInput) => (
                <Tag value={typeLabels[r.type]} severity={TYPE_SEVERITY[r.type]} />
              )}
            />
            <Column
              style={{ width: '5rem' }}
              body={(r: ManualSegmentInput) => (
                <div className="manual-row-actions">
                  <Button icon="pi pi-pencil" size="small" text severity="info" onClick={() => handleStartEdit(r)} />
                  <Button icon="pi pi-trash" size="small" text severity="danger" onClick={() => { dispatch(removeManualInput(r.uid)); if (editingUid === r.uid) resetForm(); }} />
                </div>
              )}
            />
          </DataTable>

          <div className="manual-totals">
            <span><strong>{totalKm.toFixed(2)} km</strong></span>
            <span className="manual-totals__gain">+{Math.round(totalGain)} m</span>
            <span className="manual-totals__loss">-{Math.round(totalLoss)} m</span>
            <Button
              label={t.manualClearAll}
              icon="pi pi-trash"
              size="small"
              text
              severity="danger"
              onClick={() => { dispatch(resetManualInputs()); resetForm(); }}
              className="manual-totals__clear"
            />
          </div>
        </>
      ) : (
        <div className="manual-empty">{t.manualEmpty}</div>
      )}
    </Card>
  );
};

export default ManualSegmentEditor;
