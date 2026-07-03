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
  const pp = ctx.processPrices || {};
  const marginDivisor = pp.margin_divisor ?? 0.65;
  const paperCalcWidth = pp.paper_calc_width ?? 31.5;
  const paperCalcHeight = pp.paper_calc_height ?? 42;
  const quickPaperSheetWidth = pp.quick_paper_sheet_width ?? 32.5;
  const quickPaperSheetHeight = pp.quick_paper_sheet_height ?? 43;
  const paperWasteMultiplier = pp.paper_waste_multiplier ?? 1.1;
  const paperWasteSheets = pp.paper_waste_sheets ?? 10;
  const lamPrice = pp.lamination_price_per_page ?? 500;
  
  const cutPricePerItem = pp.cut_price_per_item ?? 20;
  const cutMin = pp.cut_min ?? 50000;
  const drillPricePerItem = pp.drill_price_per_item ?? 50;
  const drillMin = pp.drill_min ?? 50000;
  
  const moldFee = pp.mold_fee ?? 500000;
  const moldDiecutPerSheet = pp.mold_diecut_per_sheet ?? 400;
  const moldDiecutMin = pp.mold_diecut_min ?? 250000;
  
  const laserDiecutPerSheet = pp.laser_diecut_per_sheet ?? 3200;
  const laserDiecutMin = pp.laser_diecut_min ?? 100000;
  
  const mountScoreFixed = pp.mount_score_fixed ?? 150000;
  const mountingRate = pp.mounting_rate ?? 0.2;
  const mountingMin = pp.mounting_min ?? 200000;

  const layout = maxLayout(paperCalcWidth, paperCalcHeight, input.widthCm, input.heightCm, 0);
  const itemsPerSheet = layout.itemsPerSheet;
  const sheets = Math.ceil(input.quantity / itemsPerSheet);
  const printPages = input.quantity * 2 * input.sideCount / itemsPerSheet;
  const printTier = findTier(ctx.quantityTiers, 'quick_print_page', printPages, input.printPageTierLabel);

  const paperCostRaw = (paperWasteSheets + sheets) * material.unitPriceM2 * quickPaperSheetWidth * quickPaperSheetHeight * paperWasteMultiplier;
  const paperCost = ceilMoney(paperCostRaw, 1000);
  const printCost = printTier.value * printPages;
  const laminationRaw = input.laminate ? lamPrice * printPages : 0;
  const laminationCost = input.laminate ? ceilMoney(laminationRaw, 10000) : 0;
  
  const cuttingCost = input.cut ? Math.max(input.quantity * cutPricePerItem, cutMin) : 0;
  const drillingCost = input.drill ? Math.max(input.quantity * drillPricePerItem, drillMin) : 0;

  const baseBreakdown = {
    ten_vat_tu: material.name,
    so_tem_tren_to: itemsPerSheet,
    phuong_an_ghep: layout.orientation,
    so_to_in: sheets,
    so_trang_in: printPages,
    moc_so_luong_in: printTier.label,
    phi_giay: paperCost,
    phi_in: printCost,
    phi_can_mang: laminationCost,
    phi_xen: cuttingCost,
    phi_khoan: drillingCost,
    he_so_bien_loi_nhuan: marginDivisor,
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

  const laserDiecutCost = Math.max((input.quantity / itemsPerSheet) * laserDiecutPerSheet, laserDiecutMin);
  add('laser_diecut', paperCost + printCost + laminationCost + laserDiecutCost, { phi_be_laze: laserDiecutCost });

  const moldDiecutCost = Math.max((input.quantity / itemsPerSheet) * moldDiecutPerSheet, moldDiecutMin);
  add('mold_diecut', paperCost + printCost + laminationCost + cuttingCost + drillingCost + moldFee + moldDiecutCost, { phi_khuon: moldFee, phi_be_khuon: moldDiecutCost });

  const secondPaperCost = paperCost;
  const mountingCost = Math.max((input.quantity / itemsPerSheet) * quickPaperSheetWidth * quickPaperSheetHeight * mountingRate, mountingMin);
  
  add('mount_cut', paperCost + printCost + laminationCost + cuttingCost + drillingCost + secondPaperCost + mountScoreFixed + mountingCost, { phi_boi: mountingCost, phi_can_boi: mountScoreFixed, phi_giay_lop_2: secondPaperCost });

  add('mount_diecut', paperCost + printCost + laminationCost + moldFee + moldDiecutCost + secondPaperCost + mountScoreFixed + mountingCost, { phi_boi: mountingCost, phi_can_boi: mountScoreFixed, phi_khuon: moldFee, phi_be_khuon: moldDiecutCost, phi_giay_lop_2: secondPaperCost });

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
