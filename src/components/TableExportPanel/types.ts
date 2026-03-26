export type Format = 'csv' | 'xlsx' | 'xml' | 'html' | 'json' | 'pdf';
export type LineEnding = 'crlf' | 'lf';
export type PdfOrientation = 'portrait' | 'landscape';
export type PdfPaperSize = 'a4' | 'a3' | 'letter';

export interface ExportColumn {
  field: string;
  label: string;
}

// ── Format-specific option groups ────────────────────────────────────────────
// These are used both as component props and passed directly to download helpers.

export interface CsvOptions {
  delimiter: string;
  bom: boolean;
}

export interface TextOptions {
  lineEnding: LineEnding;
  encoding: string;
  decimal: string;
}

export interface XlsxOptions {
  sheetName: string;
}

export interface XmlOptions {
  xmlRoot: string;
  xmlRow: string;
}

export interface HtmlOptions {
  htmlTitle: string;
  htmlStyles: boolean;
}

export interface PdfOptions {
  orientation: PdfOrientation;
  paperSize: PdfPaperSize;
  title: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  headerEnabled: boolean;
  headerShowTitle: boolean;
  headerShowDate: boolean;
  footerEnabled: boolean;
  footerShowPageNum: boolean;
  fitToPage: boolean;
}

// ── Component props ───────────────────────────────────────────────────────────

export interface TableExportPanelProps {
  columns: ExportColumn[];
  getData: (fields: string[]) => (string | number)[][];
  onClose: () => void;
}
