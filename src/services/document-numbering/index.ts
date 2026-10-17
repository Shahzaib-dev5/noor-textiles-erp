import type { DocumentNumber } from '@/types/common';

/** Caller commits the generated number with the document in one state update. No cross-tab locking. */
export function nextDocumentNumber(prefix: 'PO' | 'GRN' | 'PC' | 'PR' | 'PRQ' | 'BILL' | 'SPAY' | 'PRET' | 'PUT' | 'TRF' | 'RSV' | 'STK' | 'ADJ' | 'QH' | 'DSN' | 'COL' | 'BOM' | 'SMP' | 'PPL' | 'PWO' | 'PAL' | 'PMI' | 'PMR' | 'CUT' | 'PEC' | 'PER' | 'EBL' | 'PQC' | 'RWK' | 'PCD' | 'PEX' | 'APL' | 'ACR' | 'ACI' | 'ACB' | 'MAT' | 'MIS' | 'FQC' | 'ARW' | 'ARP' | 'PMT' | 'PMW' | 'PKO' | 'PMA' | 'PKC' | 'FGR' | 'FTR' | 'FAD' | 'FQH' | 'CTN' | 'CUG' | 'WPL' | 'QUO' | 'SO' | 'SRS' | 'SRL' | 'PCK' | 'PCF' | 'DSP' | 'DLV' | 'COV' | 'SOC', year: number, existing: readonly DocumentNumber[]): DocumentNumber {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new Error('سال درست نہیں۔');
  const expression = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const maximum = existing.reduce((max, number) => { const match = expression.exec(number); return match ? Math.max(max, Number(match[1])) : max; }, 0);
  if (!Number.isSafeInteger(maximum + 1)) throw new Error('دستاویز نمبر کی حد مکمل ہو گئی۔');
  return `${prefix}-${year}-${String(maximum + 1).padStart(4, '0')}`;
}
