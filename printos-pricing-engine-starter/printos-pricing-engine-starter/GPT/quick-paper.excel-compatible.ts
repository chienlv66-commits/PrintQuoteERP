import { maxLayout } from '../core/layout';
import { chooseCheapest, finalizeAlternative } from '../core/money';
import { ceilMoney } from '../core/rounding';
import { findTier } from '../core/tier';
import type { Material, PricingContext, QuoteAlternative, QuoteResult } from '../types';

export interface QuickPaperInput {
  quantity: number;                 // Excel C2
  widthCm: number;                  // Excel C3 - Dài
  heightCm: number;                 // Excel C4 - Rộng
  materialId: string;               // Excel C6
  sideCount: 1 | 2;                 // Excel C7
  printPageTierLabel?: string;      // Excel C9 - ví dụ: "400-500"
  laminate?: boolean;               // Excel C10 - 1/0
  cut?: boolean;                    // Excel C11 - 1/0
  drill?: boolean;                  // Excel C12 - 1/0
  finishingType?: 'auto' | 'cut' | 'laser_diecut' | 'mold_diecut' | 'mount_cut' | 'mount_diecut';
}

function getMaterial(ctx: PricingContext, materialId: string): Material {
  const m = ctx.materials.find(x => x.id === materialId || x.name === materialId);
  if (!m) throw new Error(`Không tìm thấy vật liệu: ${materialId}`);
  return m;
}

/**
 * Excel-compatible pricing for sheet "Giấy In Nhanh".
 * Công thức bám theo các ô C5:C30 trong Excel.
 */
export function calculateQuickPaper(input: QuickPaperInput, ctx: PricingContext): QuoteResult {
  if (input.quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
  if (!input.widthCm || !input.heightCm) throw new Error('Kích thước phải lớn hơn 0');

  const material = getMaterial(ctx, input.materialId);

  // C5 = MAX(FLOOR(31.5/C3)*FLOOR(42/C4), FLOOR(42/C3)*FLOOR(31.5/C4))
  const layout = maxLayout(31.5, 42, input.widthCm, input.heightCm, 0);
  const itemsPerSheet = layout.itemsPerSheet;

  // Excel C8 = C2*2*C7/C5. Giữ số lẻ, KHÔNG Math.ceil.
  const printPages = (input.quantity * 2 * input.sideCount) / itemsPerSheet;

  // Excel dùng C9 chọn nhãn để VLOOKUP, không tự chọn hoàn toàn theo số trang.
  // Nếu admin không truyền C9 thì mới auto tier theo printPages.
  const printTier = findTier(ctx.quantityTiers, 'quick_print_page', printPages, input.printPageTierLabel);

  // Excel C13 = (10 + ROUNDUP(C2/C5,0)) * (unitPriceM2 * 32.5 * 43) * 1.1
  // Lưu ý: Excel đang dùng 32.5*43 theo cm2, giá giấy trong DB phải cùng đơn vị như Excel.
  const printedSheets = Math.ceil(input.quantity / itemsPerSheet);
  const paperCostRaw = (10 + printedSheets) * material.unitPriceM2 * 32.5 * 43 * 1.1;

  // Excel C14 = ROUNDUP(C13,-3)
  const paperCost = ceilMoney(paperCostRaw, 1000);

  // Excel C15 = VLOOKUP(C9,'Loại giấy'!K3:L17,2,0)*C8
  const printCost = printTier.value * printPages;

  // Excel C16 = 500*C8*C10; C17 = ROUNDUP(C16,-4)
  const laminationRaw = input.laminate ? 500 * printPages : 0;
  const laminationCost = input.laminate ? ceilMoney(laminationRaw, 10_000) : 0;

  // Excel C18 = IF(C2*20<50000,50000,C2*20)*C11
  const cuttingCost = input.cut ? Math.max(input.quantity * 20, 50_000) : 0;

  // Excel C19 = IF(C2*50<50000,50000,C2*50)*C12
  const drillingCost = input.drill ? Math.max(input.quantity * 50, 50_000) : 0;

  // Excel C20 = 500000
  const moldFee = 500_000;

  // Excel C21 = IF(C2/C5*400<250000,250000,C2/C5*400)
  const moldDiecutCost = Math.max((input.quantity / itemsPerSheet) * 400, 250_000);

  // Excel C22 = IF(C2/C5*3200<=100000,100000,C2/C5*3200)
  const laserDiecutCost = Math.max((input.quantity / itemsPerSheet) * 3200, 100_000);

  // Excel C26 = C14
  const secondPaperCost = paperCost;

  // Excel C27 hiện là 150000 cố định
  const mountScoreCost = 150_000;

  // Excel C28 = IF(C2/C5*32.5*43*0.2<200000,200000,C2/C5*32.5*43*0.2)
  const mountingCost = Math.max((input.quantity / itemsPerSheet) * 32.5 * 43 * 0.2, 200_000);

  const marginDivisor = 0.65;

  const baseBreakdown = {
    materialName: material.name,
    itemsPerSheet,
    orientation: layout.orientation,
    normalLayout: layout.normal,
    rotatedLayout: layout.rotated,
    printedSheets,
    printPages,
    printTierLabel: printTier.label,
    printTierValue: printTier.value,
    paperCostRaw,
    paperCost,
    printCost,
    laminationRaw,
    laminationCost,
    cuttingCost,
    drillingCost,
    moldFee,
    moldDiecutCost,
    laserDiecutCost,
    secondPaperCost,
    mountScoreCost,
    mountingCost,
    marginDivisor,
  };

  const alternatives: QuoteAlternative[] = [];
  const add = (method: QuoteAlternative['method'], costTotal: number, extra: Record<string, number | string | boolean | null> = {}) => {
    const sellUnit = costTotal / (input.quantity * marginDivisor);
    alternatives.push(finalizeAlternative({
      method,
      quantity: input.quantity,
      costTotal,
      sellUnit,
      breakdown: { ...baseBreakdown, ...extra },
    }));
  };

  // Excel C23 = (SUM(C13:C19)-C16-C13)/(C2*0.65)
  // Tương đương dùng C14 thay C13 và C17 thay C16.
  add('cut', paperCost + printCost + laminationCost + cuttingCost + drillingCost);

  // Excel C24 = (SUM(C13:C22)-C13-C16-C18-C19-C20-C21)/(C2*0.65)
  // Chỉ gồm: C14 + C15 + C17 + C22
  add('laser_diecut', paperCost + printCost + laminationCost + laserDiecutCost);

  // Excel C25 = (SUM(C13:C21)-C16-C13)/(C2*0.65)
  // Gồm: C14 + C15 + C17 + C18 + C19 + C20 + C21
  add('mold_diecut', paperCost + printCost + laminationCost + cuttingCost + drillingCost + moldFee + moldDiecutCost);

  // Excel C29 = (SUM(C13:C19)-C16-C13+C26+C28+C27)/(C2*0.65)
  // Gồm: C14 + C15 + C17 + C18 + C19 + C26 + C27 + C28
  add('mount_cut', paperCost + printCost + laminationCost + cuttingCost + drillingCost + secondPaperCost + mountScoreCost + mountingCost);

  // Excel C30 = (SUM(C13:C21)-C13-C18-C19-C16+C26+C28+C27)/(C2*0.65)
  // Gồm: C14 + C15 + C17 + C20 + C21 + C26 + C27 + C28
  // Lưu ý: theo Excel, bồi bế KHÔNG cộng xén/khoan.
  add('mount_diecut', paperCost + printCost + laminationCost + moldFee + moldDiecutCost + secondPaperCost + mountScoreCost + mountingCost);

  const filtered = input.finishingType && input.finishingType !== 'auto'
    ? alternatives.filter(a => a.method === input.finishingType)
    : alternatives;

  const selected = chooseCheapest(filtered.length ? filtered : alternatives);

  return {
    productType: 'quick_paper',
    selectedMethod: selected.method,
    costTotal: selected.costTotal,
    costUnit: selected.costUnit,
    sellUnit: selected.sellUnit,
    sellTotal: selected.sellTotal,
    marginRate: 1 - marginDivisor,
    breakdown: selected.breakdown,
    alternatives,
  };
}
