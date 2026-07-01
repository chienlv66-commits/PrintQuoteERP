import { maxLayout } from '../core/layout';
import { chooseCheapest, finalizeAlternative } from '../core/money';
import { ceilMoney } from '../core/rounding';
import { findTier } from '../core/tier';
import type { Material, PricingContext, QuoteAlternative, QuoteResult } from '../types';

export interface QuickPaperInput {
  quantity: number;
  widthCm: number;
  heightCm: number;
  materialId: string;
  sideCount: 1 | 2;
  printPageTierLabel?: string;
  laminate?: boolean;
  cut?: boolean;
  drill?: boolean;
  finishingType?: 'auto' | 'cut' | 'laser_diecut' | 'mold_diecut' | 'mount_cut' | 'mount_diecut';
}

function getMaterial(ctx: PricingContext, materialId: string): Material {
  const m = ctx.materials.find(x => x.id === materialId || x.name === materialId);
  if (!m) throw new Error(`Không tìm thấy vật liệu: ${materialId}`);
  return m;
}

export function calculateQuickPaper(input: QuickPaperInput, ctx: PricingContext): QuoteResult {
  if (input.quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
  const material = getMaterial(ctx, input.materialId);
  const layout = maxLayout(31.5, 42, input.widthCm, input.heightCm, 0);
  const itemsPerSheet = layout.itemsPerSheet;
  const sheets = Math.ceil(input.quantity / itemsPerSheet);
  const printPages = input.quantity * 2 * input.sideCount / itemsPerSheet;
  const printTier = findTier(ctx.quantityTiers, 'quick_print_page', printPages, input.printPageTierLabel);

  const paperCostRaw = (10 + sheets) * material.unitPriceM2 * 32.5 * 43 * 1.1;
  const paperCost = ceilMoney(paperCostRaw, 1000);
  const printCost = printTier.value * printPages;
  const laminationCost = input.laminate ? 500 * printPages : 0;
  const cuttingCost = input.cut ? Math.max(input.quantity * 20, 50_000) : 0;
  const drillingCost = input.drill ? Math.max(input.quantity * 50, 50_000) : 0;
  const marginDivisor = 0.65;

  const baseBreakdown = {
    materialName: material.name,
    itemsPerSheet,
    orientation: layout.orientation,
    sheets,
    printPages,
    printTierLabel: printTier.label,
    paperCost,
    printCost,
    laminationCost,
    cuttingCost,
    drillingCost,
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

  add('cut', paperCost + printCost + laminationCost + cuttingCost + drillingCost);

  const laserDiecutCost = Math.max((input.quantity / itemsPerSheet) * 3200, 100_000);
  add('laser_diecut', paperCost + printCost + laminationCost + laserDiecutCost + drillingCost, { laserDiecutCost });

  const moldFee = 500_000;
  const moldDiecutCost = Math.max((input.quantity / itemsPerSheet) * 400, 250_000);
  add('mold_diecut', paperCost + printCost + laminationCost + moldFee + moldDiecutCost + drillingCost, { moldFee, moldDiecutCost });

  const mountingCost = Math.max((input.quantity / itemsPerSheet) * 32.5 * 43 * 0.2, 200_000);
  add('mount_cut', paperCost * 2 + printCost + laminationCost + mountingCost + cuttingCost + drillingCost, { mountingCost });

  const mountDiecutCost = 150_000;
  add('mount_diecut', paperCost * 2 + printCost + laminationCost + mountingCost + mountDiecutCost + drillingCost, { mountingCost, mountDiecutCost });

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
