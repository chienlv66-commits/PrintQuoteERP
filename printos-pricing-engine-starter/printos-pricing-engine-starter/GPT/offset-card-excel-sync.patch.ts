// PATCH CỐT LÕI CHO offset-card.ts
// Mục tiêu: đồng bộ cách tính In Offset / Thẻ bài với Excel sheet "Thẻ bài".

export type OffsetCardCut = 'none' | 'normal' | 'mount_cut' | 'by_card';
export type OffsetCardDiecut = 'none' | 'diecut_work_only' | 'half_mold' | 'full_mold';

export interface OffsetCardInput {
  quantity: number;
  widthCm: number;
  heightCm: number;
  materialCode: string;
  printMode: 'one_side' | 'ntn';
  printColor: 1 | 2 | 3 | 4;
  laminate: 'none' | 'matte' | 'glossy';
  mount: 'none' | 'mount_card';
  cut: OffsetCardCut;
  drill: 'none' | 'drill';
  diecut: OffsetCardDiecut;
  uv: 'none' | 'under_500' | 'under_1000' | 'over_1000' | 'one_side' | 'two_side';
  foil: 'none' | 'foil';
  foilMoldCount?: number;
  foilFaceCount?: number;
  forcedPaperFormat?: 'auto' | '650x430' | '545x395' | '395x360' | '430x325' | '395x272.5';
  paperSheetsOverride?: number;
  wasteSheetsOverride?: number;
  materialUnitPriceOverride?: number;
}

const PRINT_PRICE = {
  1: { base: 250000, overRate: 100, plate: 54000 },
  2: { base: 300000, overRate: 110, plate: 108000 },
  3: { base: 330000, overRate: 110, plate: 162000 },
  4: { base: 360000, overRate: 120, plate: 216000 },
} as const;

const LAMINATE_UNIT = {
  none: 0,
  matte: 0.2,
  glossy: 0.2,
} as const;

const DIECUT_MOLD_FEE = {
  none: 0,
  diecut_work_only: 0,
  half_mold: 350000,
  full_mold: 500000,
} as const;

function calcPrintCost(totalSheets: number, sides: number, color: 1 | 2 | 3 | 4): number {
  const impressions = totalSheets * sides;
  const rule = PRINT_PRICE[color];
  if (impressions <= 1000) return rule.base;
  return Math.round(rule.base + (impressions - 1000) * rule.overRate);
}

function calcLaminateCost(totalSheets: number, paperWidthCm: number, paperHeightCm: number, sides: number, laminate: OffsetCardInput['laminate']) {
  return Math.round(totalSheets * paperWidthCm * paperHeightCm * sides * LAMINATE_UNIT[laminate]);
}

function calcMountCost(totalSheets: number, paperWidthCm: number, paperHeightCm: number, mount: OffsetCardInput['mount']) {
  if (mount === 'none') return 0;
  return Math.round(totalSheets * paperWidthCm * paperHeightCm * 0.18);
}

function calcMountScoreCost(totalSheets: number, mount: OffsetCardInput['mount']) {
  if (mount === 'none') return 0;
  return Math.max(totalSheets * 100, 100000);
}

function calcCutCost(totalSheets: number, cut: OffsetCardCut): number {
  if (cut === 'none') return 0;
  if (cut === 'by_card') return 80000;
  if (cut === 'normal') return Math.round((totalSheets / 200) * 40000);
  if (cut === 'mount_cut') return Math.round((totalSheets / 100) * 40000);
  return 0;
}

function calcDrillCost(quantity: number, drill: OffsetCardInput['drill']) {
  return drill === 'drill' ? quantity * 10 : 0;
}

function calcDiecut(input: OffsetCardInput, totalSheets: number, sides: number) {
  if (input.diecut === 'none') {
    return { moldFee: 0, diecutWorkCost: 0, diecutCost: 0 };
  }
  const moldFee = DIECUT_MOLD_FEE[input.diecut];
  const diecutWorkCost = Math.max(totalSheets * sides * 200, 250000);
  return { moldFee, diecutWorkCost, diecutCost: moldFee + diecutWorkCost };
}

function calcUvCost(input: OffsetCardInput): number {
  if (input.uv === 'none') return 0;
  if (input.uv === 'under_500') return 450000;
  if (input.uv === 'under_1000') return 600000;
  if (input.uv === 'over_1000') return 595000;
  if (input.uv === 'one_side') return input.quantity * 30;
  if (input.uv === 'two_side') return input.quantity * 30 * 2;
  return 0;
}

function calcFoilCost(input: OffsetCardInput): number {
  if (input.foil === 'none') return 0;
  const moldCount = input.foilMoldCount ?? 1;
  const faceCount = input.foilFaceCount ?? 1;
  return 500000 * moldCount + input.quantity * 30 * faceCount;
}

// Thay phần tính chi phí trong hàm calculateOffsetCard bằng block này.
export function calculateOffsetCardCostBlock(params: {
  input: OffsetCardInput;
  material: { gsm: number; unitPrice: number; code?: string };
  paperWidthCm: number;
  paperHeightCm: number;
  paperSheetsBase: number;
  wasteSheets: number;
}) {
  const { input, material, paperWidthCm, paperHeightCm, paperSheetsBase, wasteSheets } = params;
  const sides = input.printMode === 'ntn' ? 2 : 1;
  const totalSheets = paperSheetsBase + wasteSheets;
  const unitPrice = input.materialUnitPriceOverride ?? material.unitPrice;

  const paperCost = Math.round(totalSheets * paperWidthCm * paperHeightCm * unitPrice * material.gsm);
  const plateCost = PRINT_PRICE[input.printColor].plate;
  const printCost = calcPrintCost(totalSheets, sides, input.printColor);
  const laminateCost = calcLaminateCost(totalSheets, paperWidthCm, paperHeightCm, sides, input.laminate);
  const mountCost = calcMountCost(totalSheets, paperWidthCm, paperHeightCm, input.mount);
  const mountScoreCost = calcMountScoreCost(totalSheets, input.mount);
  const cutCost = calcCutCost(totalSheets, input.cut);
  const drillCost = calcDrillCost(input.quantity, input.drill);
  const { moldFee, diecutWorkCost, diecutCost } = calcDiecut(input, totalSheets, sides);
  const uvCost = calcUvCost(input);
  const foilCost = calcFoilCost(input);

  const totalCost = Math.round(
    paperCost + plateCost + printCost + laminateCost + mountCost + mountScoreCost +
    cutCost + drillCost + diecutCost + uvCost + foilCost,
  );

  const factoryUnitPrice = Math.round(totalCost / input.quantity);
  const sellingUnitPrice = Math.round(factoryUnitPrice / 0.7);
  const sellingTotal = sellingUnitPrice * input.quantity;

  return {
    totalCost,
    factoryUnitPrice,
    sellingUnitPrice,
    sellingTotal,
    breakdown: {
      paper: { unitPrice, gsm: material.gsm, paperWidthCm, paperHeightCm, paperSheetsBase, wasteSheets, totalSheets, paperCost },
      print: { printMode: input.printMode, sides, printColor: input.printColor, impressions: totalSheets * sides, plateCost, printCost },
      finishing: { laminate: input.laminate, laminateCost, mount: input.mount, mountCost, mountScoreCost, cut: input.cut, cutCost, drill: input.drill, drillCost, diecut: input.diecut, moldFee, diecutWorkCost, diecutCost, uv: input.uv, uvCost, foil: input.foil, foilCost },
    },
  };
}
