/**
 * Decal In Nhanh - Excel compatible pricing module
 * Source sheet: "Decal in nhanh" in file "4. Bảng giá Thẻ bài +tem nhãn 18-7-25.xlsx"
 * Goal: match Excel logic, not Giấy In Nhanh logic.
 */

import type { Material, PricingContext, QuoteAlternative, QuoteResult } from '../types';

export type DecalQuickInput = {
  quantity: number;          // Excel C2
  lengthCm: number;          // Excel C3 - Dài
  widthCm: number;           // Excel C4 - Rộng
  materialCode: string;      // Excel C7, e.g. Decal
  sideCount: 1 | 2;          // Excel C8
  printTierLabel?: string;   // Excel C11, e.g. <100, 100-200
  laminateFlag: 0 | 1;       // Excel C12: có cán = 1, không cán = 0
  cutFlag: 0 | 1;            // Excel C13: có xén = 1, không xén = 0
  finishingType?: 'auto' | 'square_cut' | 'diecut';
};

export type PrintTier = {
  label: string;
  min?: number;
  max?: number;
  value: number;
};

const DEFAULT_PRINT_TIERS: PrintTier[] = [
  { label: '<100', min: 0, max: 99.999999, value: 2200 },
  { label: '100-200', min: 100, max: 199.999999, value: 1700 },
  { label: '200-300', min: 200, max: 299.999999, value: 1300 },
  { label: '300-400', min: 300, max: 399.999999, value: 1200 },
  { label: '400-500', min: 400, max: 499.999999, value: 1100 },
  { label: '500-1000', min: 500, max: 1000, value: 1000 },
];

function assertPositive(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be > 0`);
}

function roundDown(value: number, digits = 0): number {
  const factor = Math.pow(10, digits);
  return Math.floor(value * factor) / factor;
}

function roundup(value: number): number {
  return Math.ceil(value);
}

function lookupMaterial(ctx: PricingContext, materialCode: string): Material {
  const material = ctx.materials.find(m => m.id === materialCode || m.name === materialCode);
  if (!material) throw new Error(`Material not found: ${materialCode}`);
  return material;
}

function findTierByLabelOrAuto(ctx: PricingContext, printPages: number, label?: string): PrintTier {
  const tiers = (ctx.quantityTiers?.length ? ctx.quantityTiers : DEFAULT_PRINT_TIERS) as any;
  if (label) {
    const byLabel = tiers.find(t => t.label === label);
    if (!byLabel) throw new Error(`Print tier label not found: ${label}`);
    return byLabel;
  }
  const auto = tiers.find(t =>
    (t.min === undefined || printPages >= t.min) &&
    (t.max === undefined || printPages <= t.max)
  );
  if (!auto) return tiers[tiers.length - 1];
  return auto;
}

/** Excel C5: Cái/tờ - Bế */
function calcItemsPerSheetDiecut(lengthCm: number, widthCm: number): number {
  const option1 = roundDown(26 / (lengthCm + 0.15)) * roundDown(39 / (widthCm + 0.15));
  const option2Compare = roundDown(39 / (lengthCm + 0.15)) * roundDown(26 / (widthCm + 0.15));
  const option2Excel = roundDown(39 / lengthCm) * roundDown(26 / (widthCm + 0.15));
  return (option1 > option2Compare ? option1 : option2Excel) / 1.1;
}

/** Excel C6: Cái/tờ - Xén */
function calcItemsPerSheetCut(lengthCm: number, widthCm: number): number {
  const option1 = roundDown(31.4 / lengthCm) * roundDown(42 / widthCm);
  const option2 = roundDown(42 / lengthCm) * roundDown(31.4 / widthCm);
  return option1 > option2 ? option1 : option2;
}

function makeAlternative(
  key: 'square_cut' | 'diecut',
  label: string,
  totalCost: number,
  quantity: number,
  divisor: number,
  breakdown: Record<string, number | string>,
): QuoteAlternative {
  const factoryUnitPrice = totalCost / quantity;
  const sellingUnitPrice = totalCost / (quantity * divisor);
  return {
    method: label, // We use label as method so it shows up beautifully in UI
    costTotal: totalCost,
    costUnit: factoryUnitPrice,
    sellUnit: sellingUnitPrice,
    sellTotal: sellingUnitPrice * quantity,
    breakdown,
  };
}

export function calculateDecalQuick(input: DecalQuickInput, ctx: PricingContext): QuoteResult {
  assertPositive('quantity', input.quantity);
  assertPositive('lengthCm', input.lengthCm);
  assertPositive('widthCm', input.widthCm);

  const material = lookupMaterial(ctx, input.materialCode);
  const sideCount = input.sideCount ?? 1;

  const itemsPerSheetDiecut = calcItemsPerSheetDiecut(input.lengthCm, input.widthCm); // C5
  const itemsPerSheetCut = calcItemsPerSheetCut(input.lengthCm, input.widthCm);       // C6
  if (itemsPerSheetDiecut <= 0 || itemsPerSheetCut <= 0) throw new Error('Kích thước decal quá lớn so với khổ in nhanh');

  const printPagesDiecut = input.quantity * 2 * sideCount / itemsPerSheetDiecut; // C9
  const printPagesCut = input.quantity * 2 * sideCount / itemsPerSheetCut;       // C10

  const printTier = findTierByLabelOrAuto(ctx, printPagesCut, input.printTierLabel);
  const printUnitPrice = printTier.value;
  const materialUnitPrice = material.unitPriceM2 ?? 0;

  const paperCostCut = (10 + roundup(input.quantity / itemsPerSheetCut)) * (materialUnitPrice * 32.5 * 43) * 1.1;
  const paperCostDiecut = paperCostCut * printPagesDiecut / printPagesCut;

  const printCostCut = printUnitPrice * printPagesCut;
  const printCostDiecut = printCostCut * printPagesDiecut / printPagesCut;

  const laminateCostCut = 500 * printPagesCut * input.laminateFlag;
  const laminateCostDiecut = 500 * printPagesDiecut * input.laminateFlag;

  const cutCost = Math.max(input.quantity * 20, 50_000) * input.cutFlag;
  const diecutCost = itemsPerSheetDiecut >= 200 ? (printPagesDiecut / 2) * 8000 : (printPagesDiecut / 2) * 2000;

  const cutTotal = paperCostCut + printCostCut + laminateCostCut + cutCost;
  const diecutTotal = paperCostDiecut + printCostDiecut + laminateCostDiecut + diecutCost;

  const cutDivisor = (cutTotal / (input.quantity * 0.6)) > 1_000_000 ? 0.65 : 0.6;
  const diecutDivisor = (diecutTotal / (input.quantity * 0.6)) > 1_000_000 ? 0.6 : 0.55;

  const baseBreakdown = {
    ma_vat_tu: material.id,
    don_gia_vat_tu: materialUnitPrice,
    so_luong: input.quantity,
    chieu_dai_cm: input.lengthCm,
    chieu_rong_cm: input.widthCm,
    so_mat_in: sideCount,
    cai_tren_to_be: itemsPerSheetDiecut,
    cai_tren_to_xen: itemsPerSheetCut,
    so_trang_in_be: printPagesDiecut,
    so_trang_in_xen: printPagesCut,
    moc_so_luong_in: printTier.label,
  };

  const altCut = makeAlternative(
    'square_cut',
    'Xén',
    cutTotal,
    input.quantity,
    cutDivisor,
    {
      ...baseBreakdown,
      phi_giay: paperCostCut,
      phi_in: printCostCut,
      phi_can_mang: laminateCostCut,
      phi_xen: cutCost,
      he_so_chia: cutDivisor,
    }
  );

  const altDiecut = makeAlternative(
    'diecut',
    'Bế',
    diecutTotal,
    input.quantity,
    diecutDivisor,
    {
      ...baseBreakdown,
      phi_giay: paperCostDiecut,
      phi_in: printCostDiecut,
      phi_can_mang: laminateCostDiecut,
      phi_be_khuon: diecutCost,
      he_so_chia: diecutDivisor,
    }
  );

  const alternatives = [altCut, altDiecut];

  let selectedAlt = altCut;
  if (input.finishingType === 'square_cut') {
    selectedAlt = altCut;
  } else if (input.finishingType === 'diecut') {
    selectedAlt = altDiecut;
  } else {
    // auto: choose cheapest
    selectedAlt = altCut.sellingUnitPrice <= altDiecut.sellingUnitPrice ? altCut : altDiecut;
  }

  return {
    productType: 'decal_quick',
    selectedMethod: selectedAlt.method,
    costTotal: selectedAlt.costTotal,
    costUnit: selectedAlt.costUnit,
    sellTotal: selectedAlt.sellTotal,
    sellUnit: selectedAlt.sellUnit,
    alternatives,
    breakdown: selectedAlt.breakdown,
  };
}
