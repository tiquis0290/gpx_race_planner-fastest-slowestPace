/**
 * Visual PDF margin editor.
 * Shows a scaled page preview with interactive margin areas.
 * Clicking a margin area focuses the corresponding input.
 */

import React, { useRef, useState } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { useT } from '../../i18n/useT';
import type { PdfOrientation, PdfPaperSize } from './types';

interface Props {
  paperSize: PdfPaperSize;
  orientation: PdfOrientation;
  top: number;    onTopChange:    (v: number) => void;
  bottom: number; onBottomChange: (v: number) => void;
  left: number;   onLeftChange:   (v: number) => void;
  right: number;  onRightChange:  (v: number) => void;
}

const PAGE_SIZES: Record<PdfPaperSize, { w: number; h: number }> = {
  a4:     { w: 210, h: 297 },
  a3:     { w: 297, h: 420 },
  letter: { w: 216, h: 279 },
};

type MarginSide = 'top' | 'bottom' | 'left' | 'right';

// Scale factors for the preview — PREVIEW_SCALE converts mm to px, MARGIN_SCALE
// additionally exaggerates the visible margin bands so small values remain clickable.
const PREVIEW_SCALE = 0.35;
const MARGIN_SCALE  = PREVIEW_SCALE * 1.5;
const INPUT_COL_W   = 110;

const PdfMarginEditor: React.FC<Props> = ({
  paperSize, orientation,
  top, onTopChange, bottom, onBottomChange, left, onLeftChange, right, onRightChange,
}) => {
  const t = useT();
  const refs = {
    top:    useRef<HTMLInputElement>(null),
    bottom: useRef<HTMLInputElement>(null),
    left:   useRef<HTMLInputElement>(null),
    right:  useRef<HTMLInputElement>(null),
  };
  const [active, setActive] = useState<MarginSide | null>(null);

  const base = PAGE_SIZES[paperSize] ?? PAGE_SIZES.a4;
  const dims = orientation === 'landscape' ? { w: base.h, h: base.w } : base;
  const pw   = dims.w * PREVIEW_SCALE;
  const ph   = dims.h * PREVIEW_SCALE;

  const marginAreaStyle = (side: MarginSide): React.CSSProperties => ({
    cursor: 'pointer',
    position: 'absolute',
    backgroundColor: active === side ? 'rgba(66,114,196,0.4)' : 'rgba(66,114,196,0.15)',
    transition: 'background-color 0.2s',
    ...(side === 'top'    && { top: 0, left: 0, right: 0, height: top    * MARGIN_SCALE, borderBottom: active === 'top'    ? '2px solid #4472C4' : '1px dashed #4472C4' }),
    ...(side === 'bottom' && { bottom: 0, left: 0, right: 0, height: bottom * MARGIN_SCALE, borderTop:    active === 'bottom' ? '2px solid #4472C4' : '1px dashed #4472C4' }),
    ...(side === 'left'   && { top: 0, bottom: 0, left: 0, width: left   * MARGIN_SCALE, borderRight: active === 'left'   ? '2px solid #4472C4' : '1px dashed #4472C4' }),
    ...(side === 'right'  && { top: 0, bottom: 0, right: 0, width: right  * MARGIN_SCALE, borderLeft:  active === 'right'  ? '2px solid #4472C4' : '1px dashed #4472C4' }),
  });

  const renderInput = (side: MarginSide, label: string, value: number, onChange: (v: number) => void) => (
    <div style={{ width: '100%' }}>
      <div className="text-sm mb-1" style={{ textAlign: 'center' }}>{label}</div>
      <InputNumber
        inputRef={refs[side]}
        value={value}
        onValueChange={(e) => onChange(e.value ?? 10)}
        onFocus={() => setActive(side)}
        onBlur={() => setActive(null)}
        min={0} max={50} suffix=" mm"
        className="w-full"
        inputStyle={{ width: '100%', textAlign: 'center' }}
      />
    </div>
  );

  return (
    <div>
      <div className="text-sm mb-2">{t.tableExportPdfMargins}</div>

      {/* 3×3 grid: inputs on the four compass points, page preview in the centre */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `${INPUT_COL_W}px 1fr ${INPUT_COL_W}px`,
        gridTemplateRows: 'auto auto auto',
        gap: '0.5rem',
        alignItems: 'center',
        justifyItems: 'center',
      }}>
        {/* Top — column 2, row 1 */}
        <div style={{ gridColumn: 2, gridRow: 1, width: '100%' }}>
          {renderInput('top', t.tableExportPdfMarginTop, top, onTopChange)}
        </div>

        {/* Left — column 1, row 2 */}
        <div style={{ gridColumn: 1, gridRow: 2, width: '100%' }}>
          {renderInput('left', t.tableExportPdfMarginLeft, left, onLeftChange)}
        </div>

        {/* Page preview — column 2, row 2 */}
        <div style={{
          gridColumn: 2, gridRow: 2,
          width: pw, height: ph, flexShrink: 0,
          border: '1px solid #dee2e6', background: '#fff',
          position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {(['top', 'bottom', 'left', 'right'] as MarginSide[]).map(side => (
            <div key={side} onClick={() => refs[side].current?.focus()} style={marginAreaStyle(side)} />
          ))}
          {/* Mock content lines */}
          <div style={{
            position: 'absolute',
            top: top * MARGIN_SCALE + 5, bottom: bottom * MARGIN_SCALE + 5,
            left: left * MARGIN_SCALE + 5, right: right * MARGIN_SCALE + 5,
            display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden',
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 3, background: '#e9ecef', borderRadius: 1 }} />
            ))}
          </div>
        </div>

        {/* Right — column 3, row 2 */}
        <div style={{ gridColumn: 3, gridRow: 2, width: '100%' }}>
          {renderInput('right', t.tableExportPdfMarginRight, right, onRightChange)}
        </div>

        {/* Bottom — column 2, row 3 */}
        <div style={{ gridColumn: 2, gridRow: 3, width: '100%' }}>
          {renderInput('bottom', t.tableExportPdfMarginBottom, bottom, onBottomChange)}
        </div>
      </div>
    </div>
  );
};

export default PdfMarginEditor;
