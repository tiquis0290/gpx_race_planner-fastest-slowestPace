/**
 * Pure download helpers — one function per export format.
 * None of these functions touch React state; they receive plain data and options.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import type { LineEnding, PdfOptions, PdfPaperSize } from './types';

// ── Shared utilities ──────────────────────────────────────────────────────────

/** Converts an arbitrary string to a valid XML tag name. */
export const toSlug = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_') || 'item';

const xmlEsc  = (v: unknown) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fixDec  = (v: unknown, decimal: string) => String(v).replace('.', decimal);

export const getExtension = (format: string): string =>
  ({ xlsx: '.xlsx', csv: '.csv', xml: '.xml', html: '.html', json: '.json', pdf: '.pdf' } as Record<string, string>)[format] ?? '';

/** Creates a temporary <a> and triggers a file download. */
export const triggerDownload = (content: string, mime: string, filename: string) => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Format-specific downloaders ───────────────────────────────────────────────

export const downloadXlsx = (
  heads: string[], rows: (string | number)[][], filename: string, sheetName: string,
) => {
  const ws = XLSX.utils.aoa_to_sheet([heads, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
  XLSX.writeFile(wb, filename + '.xlsx');
};

export const downloadCsv = (
  heads: string[], rows: (string | number)[][], filename: string,
  delimiter: string, lineEnding: LineEnding, bom: boolean, decimal: string,
) => {
  const eol    = lineEnding === 'crlf' ? '\r\n' : '\n';
  const csvEsc = (v: unknown) => `"${fixDec(v, decimal).replace(/"/g, '""')}"`;
  const lines  = [heads.map(csvEsc).join(delimiter), ...rows.map(r => r.map(csvEsc).join(delimiter))].join(eol);
  triggerDownload((bom ? '\uFEFF' : '') + lines, 'text/csv', filename + '.csv');
};

export const downloadJson = (
  fields: string[], rows: (string | number)[][], filename: string,
) => {
  const data = rows.map(r => Object.fromEntries(fields.map((f, i) => [f, r[i]])));
  triggerDownload(JSON.stringify(data, null, 2), 'application/json', filename + '.json');
};

export const downloadXml = (
  heads: string[], rows: (string | number)[][], filename: string,
  xmlRoot: string, xmlRow: string, encoding: string, decimal: string,
) => {
  const colKeys = heads.map(toSlug);
  const rowTag  = toSlug(xmlRow) || 'segment';
  const rootTag = toSlug(xmlRoot) || 'pace-plan';
  const items   = rows.map(r =>
    `  <${rowTag}>\n` +
    r.map((v, i) => `    <${colKeys[i]}>${xmlEsc(fixDec(v, decimal))}</${colKeys[i]}>`).join('\n') +
    `\n  </${rowTag}>`
  ).join('\n');
  triggerDownload(
    `<?xml version="1.0" encoding="${encoding}"?>\n<${rootTag}>\n${items}\n</${rootTag}>`,
    'application/xml',
    filename + '.xml',
  );
};

export const downloadHtml = (
  heads: string[], rows: (string | number)[][], filename: string,
  htmlTitle: string, htmlStyles: boolean, encoding: string, decimal: string,
) => {
  const style = htmlStyles
    ? `<style>body{font-family:sans-serif;padding:1rem}table{border-collapse:collapse;width:100%}` +
      `th,td{border:1px solid #cbd5e1;padding:6px 10px;text-align:left}` +
      `th{background:#f1f5f9;font-weight:600}tr:nth-child(even){background:#f8fafc}</style>`
    : '';
  const thead = `<thead><tr>${heads.map(h => `<th>${xmlEsc(h)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r => `<tr>${r.map(v => `<td>${xmlEsc(fixDec(v, decimal))}</td>`).join('')}</tr>`).join('')}</tbody>`;
  triggerDownload(
    `<!DOCTYPE html>\n<html>\n<head><meta charset="${encoding}"><title>${xmlEsc(htmlTitle)}</title>${style}</head>\n` +
    `<body><h1>${xmlEsc(htmlTitle)}</h1><table>${thead}${tbody}</table></body>\n</html>`,
    'text/html',
    filename + '.html',
  );
};

// ── PDF downloader ────────────────────────────────────────────────────────────

const PDF_PAGE_SIZES: Record<PdfPaperSize, { w: number; h: number }> = {
  a4:     { w: 210, h: 297 },
  a3:     { w: 297, h: 420 },
  letter: { w: 216, h: 279 },
};

export const downloadPdf = async (
  heads: string[], rows: (string | number)[][], filename: string, opts: PdfOptions,
) => {
  const doc        = new jsPDF({ orientation: opts.orientation, unit: 'mm', format: opts.paperSize });
  const pageWidth  = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const headerH    = opts.headerEnabled ? 12 : 0;
  const footerH    = opts.footerEnabled ? 10 : 0;
  const contentX   = opts.marginLeft;
  const contentY   = opts.marginTop + headerH;
  const contentW   = pageWidth  - opts.marginLeft - opts.marginRight;
  const pageSliceH = pageHeight - contentY   - opts.marginBottom - footerH;

  // Render table as HTML at the exact pixel width that corresponds to contentW mm
  const elW   = Math.round(contentW * 3.7795); // mm → px at 96 DPI
  const SCALE = 2;                             // retina-quality canvas

  const S = '#_pdf_export_';
  const theadHtml = `<tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr>`;
  const tbodyHtml = rows.map(r => `<tr>${r.map(v => `<td>${String(v)}</td>`).join('')}</tr>`).join('');
  const tableHtml = [
    `<style>`,
    `${S}*{box-sizing:border-box;margin:0;padding:0}`,
    `${S} table{border-collapse:collapse;font-size:11px;font-family:Arial,Helvetica,sans-serif}`,
    `${S} th{background:#f1f5f9;font-weight:bold;padding:4px 8px;border:1px solid #cbd5e1;text-align:left}`,
    `${S} td{padding:3px 8px;border:1px solid #e2e8f0}`,
    `${S} tr:nth-child(even) td{background:#f8fafc}`,
    `</style>`,
    `<table><thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table>`,
  ].join('');

  // Mount the element off-screen without affecting page layout
  const el = document.createElement('div');
  el.id = '_pdf_export_';
  el.innerHTML = tableHtml;
  el.style.cssText = `width:${elW}px;`;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;pointer-events:none;';
  wrapper.appendChild(el);
  document.body.appendChild(wrapper);

  try {
    // Wait two animation frames so the browser finishes layout
    await new Promise<void>(r => requestAnimationFrame(() => { requestAnimationFrame(() => r()); }));

    const canvas = await html2canvas(el, {
      scale: SCALE, useCORS: true, backgroundColor: '#ffffff', logging: false,
      width: elW, height: el.offsetHeight,
    });

    const mmPerPx  = contentW / canvas.width;
    const sliceHpx = Math.ceil(pageSliceH / mmPerPx);

    // Collect row bottom positions in canvas pixels to snap page breaks to row boundaries
    const elTop     = el.getBoundingClientRect().top;
    const rowBottoms = Array.from(el.querySelectorAll('tr')).map(tr =>
      Math.round((tr.getBoundingClientRect().bottom - elTop) * SCALE)
    );

    const addHeaderFooter = (pageNum: number) => {
      if (opts.headerEnabled) {
        doc.setTextColor(60, 60, 60);
        if (opts.headerShowTitle && opts.title) {
          doc.setFontSize(11); doc.setFont('helvetica', 'bold');
          doc.text(opts.title, opts.marginLeft, opts.marginTop + 7);
        }
        if (opts.headerShowDate) {
          doc.setFontSize(9); doc.setFont('helvetica', 'normal');
          doc.text(new Date().toLocaleDateString(), pageWidth - opts.marginRight, opts.marginTop + 7, { align: 'right' });
        }
        doc.setDrawColor(180, 180, 180);
        doc.line(opts.marginLeft, opts.marginTop + 9, pageWidth - opts.marginRight, opts.marginTop + 9);
      }
      if (opts.footerEnabled) {
        doc.setTextColor(120, 120, 120); doc.setFont('helvetica', 'normal');
        doc.setDrawColor(180, 180, 180);
        doc.line(opts.marginLeft, pageHeight - opts.marginBottom + 1, pageWidth - opts.marginRight, pageHeight - opts.marginBottom + 1);
        if (opts.footerShowPageNum) {
          doc.setFontSize(9);
          doc.text(String(pageNum), pageWidth / 2, pageHeight - opts.marginBottom + 6, { align: 'center' });
        }
      }
      doc.setTextColor(0, 0, 0);
    };

    let offsetPx = 0;
    let pageNum  = 0;

    while (offsetPx < canvas.height) {
      if (pageNum > 0) doc.addPage();

      // Snap to the last row boundary that fits — prevents cutting through a row
      const maxEnd  = offsetPx + sliceHpx;
      const fitting = rowBottoms.filter(b => b > offsetPx && b <= maxEnd);
      const snapEnd = fitting[fitting.length - 1] ?? Math.min(maxEnd, canvas.height);
      const sliceH  = Math.min(snapEnd, canvas.height) - offsetPx;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, sliceH);
      ctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', contentX, contentY, contentW, sliceH * mmPerPx);
      addHeaderFooter(pageNum + 1);

      offsetPx += sliceH;
      pageNum++;
    }

    doc.save(filename + '.pdf');
  } finally {
    document.body.removeChild(wrapper);
  }
};

export { PDF_PAGE_SIZES };
