import type { BOMLine, BillOfMaterials } from '@/domain/entities';
import { roundQuantity } from '@/domain/value-objects/quantity';

/** Planning only; finished inventory requires future inspection/assembly/packaging posting. */
export function calculateBOMRequirements(bom: BillOfMaterials, lines: readonly BOMLine[], suits: number) {
  if (!Number.isSafeInteger(suits) || suits <= 0) throw new Error('سوٹ کی تعداد مثبت صحیح عدد ہونی چاہیے۔');
  if (bom.lineIds.length !== lines.length || lines.some((line) => line.bomId !== bom.id || !bom.lineIds.includes(line.id))) throw new Error('BOM لائنوں کا تعلق درست نہیں۔');
  const components = new Set(lines.map((line) => line.component));
  if (components.size !== lines.length || !components.has('SHIRT') || components.size !== bom.pieceCount || (bom.pieceCount === 3 && (!components.has('TROUSER') || !components.has('DUPATTA')))) throw new Error('دو یا تین پیس سوٹ کے اجزاء مکمل نہیں ہیں۔');
  return lines.map((line) => {
    if (!Number.isFinite(line.consumptionMetersPerSuit) || line.consumptionMetersPerSuit <= 0 || !Number.isFinite(line.widthInches) || line.widthInches <= 0 || !Number.isFinite(line.wastePercent) || line.wastePercent < 0 || line.wastePercent > 100) throw new Error('BOM کی پیمائش درست نہیں۔');
    return { component: line.component, fabricId: line.fabricId, widthInches: line.widthInches, meters: roundQuantity(line.consumptionMetersPerSuit * suits * (1 + line.wastePercent / 100)) };
  });
}
