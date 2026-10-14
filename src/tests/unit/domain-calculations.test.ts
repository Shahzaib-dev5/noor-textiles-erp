import { describe, expect, it } from 'vitest';
import { assertQuantity, isQuantity, metersToYards, roundQuantity, toMeters, yardsToMeters } from '@/domain/value-objects/quantity';
import { assertMoney, multiplyMoney, rupeesToPaisa } from '@/domain/value-objects/money';
import { assertTransition, canTransition } from '@/domain/workflows/status';
import { calculateBOMRequirements } from '@/domain/calculators/production';
import { seedMetadata } from '@/data/factories/metadata';
import { nextDocumentNumber } from '@/services/document-numbering';
import type { BillOfMaterials, BOMLine } from '@/domain/entities';

describe('canonical fabric measurements', () => {
  it('converts yards to canonical meters deterministically at four decimals', () => {
    expect(yardsToMeters(500)).toBe(457.2);
    expect(yardsToMeters(1)).toBe(0.9144);
    expect(metersToYards(457.2)).toBe(500);
    expect(metersToYards(1)).toBe(1.0936);
    expect(toMeters(125.5, 'METER')).toBe(125.5);
    expect(toMeters(100, 'YARD')).toBe(91.44);
  });
  it('uses individual actual lengths for rolls and thaans, with no fixed assumed length', () => {
    expect(toMeters(3, 'ROLL', [97.5, 101.2, 98.75])).toBe(297.45);
    expect(toMeters(2, 'THAAN', [20, 31.7])).toBe(51.7);
    expect(() => toMeters(2, 'ROLL')).toThrow();
    expect(() => toMeters(2, 'THAAN', [50])).toThrow();
    expect(() => toMeters(1.5, 'ROLL', [100])).toThrow();
  });
  it.each(['PIECE', 'SUIT', 'CARTON'] as const)('does not turn %s counts into meters', (unit) => {
    expect(() => toMeters(10, unit)).toThrow();
  });
  it.each([-1, NaN, Infinity, 0.00001, Number.MAX_SAFE_INTEGER])('rejects invalid or unsafe input %s', (value) => {
    expect(isQuantity(value)).toBe(false);
    expect(() => assertQuantity(value)).toThrow();
  });
  it('rejects overflow after conversion or aggregation as well as before it', () => {
    const nearLimit = 900_000_000_000;
    expect(isQuantity(nearLimit)).toBe(true);
    expect(() => metersToYards(nearLimit)).toThrow();
    expect(() => toMeters(2, 'ROLL', [nearLimit, nearLimit])).toThrow();
    expect(() => roundQuantity(Infinity)).toThrow();
  });
});

describe('integer paisa monetary calculations', () => {
  it('rounds half a paisa away from zero using decimal digits', () => {
    expect(rupeesToPaisa('1.005')).toBe(101);
    expect(rupeesToPaisa('10.075')).toBe(1008);
    expect(rupeesToPaisa('-1.005')).toBe(-101);
    expect(rupeesToPaisa('0.004')).toBe(0);
    expect(rupeesToPaisa(250.25)).toBe(25025);
  });
  it('calculates fractional-meter cost exactly then rounds once', () => {
    expect(multiplyMoney(25000, 1000)).toBe(25_000_000);
    expect(multiplyMoney(25000, 0.9144)).toBe(22860);
    expect(multiplyMoney(1, 0.5)).toBe(1);
    expect(() => multiplyMoney(0.5, 2)).toThrow();
    expect(() => multiplyMoney(Number.MAX_SAFE_INTEGER, 2)).toThrow();
    expect(() => multiplyMoney(100, -1)).toThrow();
    expect(() => assertMoney(-1)).toThrow();
    expect(() => rupeesToPaisa('1e8')).toThrow();
  });
});

describe('document transitions and numbering', () => {
  it('requires approval, permits partial receipts and keeps terminal states closed', () => {
    expect(canTransition('RECEIPT', 'DRAFT', 'POSTED')).toBe(false);
    expect(canTransition('RECEIPT', 'APPROVED', 'POSTED')).toBe(true);
    expect(canTransition('PROCESSING_CHALLAN', 'POSTED', 'PARTIALLY_RECEIVED')).toBe(true);
    expect(canTransition('PROCESSING_CHALLAN', 'PARTIALLY_RECEIVED', 'COMPLETED')).toBe(true);
    expect(canTransition('PROCESSING_CHALLAN', 'COMPLETED', 'APPROVED')).toBe(false);
    expect(() => assertTransition('RECEIPT', 'CANCELLED', 'POSTED')).toThrow();
  });
  it('numbers from existing documents per prefix and year without filling gaps', () => {
    expect(nextDocumentNumber('PO', 2026, ['PO-2026-0001', 'PO-2026-0012', 'PC-2026-0099', 'PO-2025-9999'])).toBe('PO-2026-0013');
    expect(nextDocumentNumber('GRN', 2026, [])).toBe('GRN-2026-0001');
    expect(() => nextDocumentNumber('PO', 1999, [])).toThrow();
  });
});

describe('BOM planning contracts keep fabric requirements separate from finished suits', () => {
  const bom: BillOfMaterials = { ...seedMetadata('bom:three-piece', 'APPROVED'), designId: 'design:one', version: 1, pieceCount: 3, lineIds: ['bom-line:shirt', 'bom-line:trouser', 'bom-line:dupatta'] };
  const lines: BOMLine[] = [
    { ...seedMetadata('bom-line:shirt', 'ACTIVE'), bomId: bom.id, component: 'SHIRT', fabricId: 'fabric:lawn', widthInches: 60, consumptionMetersPerSuit: 2.5, wastePercent: 2 },
    { ...seedMetadata('bom-line:trouser', 'ACTIVE'), bomId: bom.id, component: 'TROUSER', fabricId: 'fabric:cotton', widthInches: 54, consumptionMetersPerSuit: 2, wastePercent: 0 },
    { ...seedMetadata('bom-line:dupatta', 'ACTIVE'), bomId: bom.id, component: 'DUPATTA', fabricId: 'fabric:chiffon', widthInches: 44, consumptionMetersPerSuit: 2.25, wastePercent: 0 },
  ];
  it('preserves different widths, components, and consumption for three-piece suits', () => {
    const requirements = calculateBOMRequirements(bom, lines, 10);
    expect(requirements.map((line) => line.meters)).toEqual([25.5, 20, 22.5]);
    expect(requirements.map((line) => line.widthInches)).toEqual([60, 54, 44]);
  });
  it('accepts two-piece configurations but rejects missing and duplicated components', () => {
    const twoPiece = { ...bom, pieceCount: 2 as const, lineIds: bom.lineIds.slice(0, 2) };
    expect(calculateBOMRequirements(twoPiece, lines.slice(0, 2), 1)).toHaveLength(2);
    expect(() => calculateBOMRequirements(bom, lines.slice(0, 2), 1)).toThrow();
    expect(() => calculateBOMRequirements(bom, [lines[0], lines[1], { ...lines[2], component: 'SHIRT' }], 1)).toThrow();
    expect(() => calculateBOMRequirements(bom, lines, 1.5)).toThrow();
    expect(() => calculateBOMRequirements(bom, lines.map((line) => ({ ...line, consumptionMetersPerSuit: Number.MAX_VALUE })), 2)).toThrow();
  });
});
