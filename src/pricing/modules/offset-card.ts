export type OffsetCardCut = 'none' | 'normal' | 'mount_cut' | 'by_card';
export type OffsetCardDiecut = 'none' | 'diecut_work_only' | 'half_mold' | 'full_mold';
export type LaminateType = 'none' | 'gloss' | 'matte';

export interface OffsetCardInput {
  quantity: number;
  widthCm: number;
  heightCm: number;
  materialCode: string;
  printMode: 'one_side' | 'ntn';
  printColor: 1 | 2 | 3 | 4;
  laminate: 'none' | 'matte' | 'gloss';
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
  
  forcedPaperCode?: string;
  paperWidthCmOverride?: number;
  paperHeightCmOverride?: number;
}

export interface OffsetCardMaterial {
  code: string;
  gsm: number;
  unitPrice: number;
}

export interface PaperFormat {
  code: string;
  widthMm: number;
  heightMm: number;
}

export interface PaperFormatResult {
  ma_kho: string;
  kho_giay_rong_mm: number;
  kho_giay_dai_mm: number;
  vung_in_rong_mm: number;
  vung_in_dai_mm: number;
  chieu_xep: 'vertical' | 'horizontal';
  the_rong_mm: number;
  the_dai_mm: number;
  so_cot: number;
  so_hang: number;
  so_bat_mot_mat: number;
  to_chinh: number;
  bu_hao: number;
  tong_to: number;
  uoc_tinh_tien_giay: number;
  kho_giay_rong_cm: number;
  kho_giay_dai_cm: number;
  le_phai_mm: number;
  le_duoi_mm: number;
}

export const OFFSET_CARD_MATERIALS: OffsetCardMaterial[] = [
  { code: 'I250', gsm: 250, unitPrice: 0.0017 },
  { code: 'I210', gsm: 210, unitPrice: 0.0018 },
  { code: 'I300', gsm: 300, unitPrice: 0.0017 },
  { code: 'I350', gsm: 350, unitPrice: 0.0017 },
  { code: 'I400', gsm: 400, unitPrice: 0.0017 },
  { code: 'C120', gsm: 120, unitPrice: 0.0021 },
  { code: 'C150', gsm: 150, unitPrice: 0.0021 },
  { code: 'C200', gsm: 200, unitPrice: 0.0021 },
  { code: 'C250', gsm: 250, unitPrice: 0.0021 },
  { code: 'C300', gsm: 300, unitPrice: 0.0021 },
  { code: 'C300pindo', gsm: 300, unitPrice: 0.0024 },
  { code: 'ốp 100', gsm: 100, unitPrice: 0.0026 },
  { code: 'ốp 150', gsm: 150, unitPrice: 0.0026 },
  { code: 'ốp 200', gsm: 200, unitPrice: 0.0028 },
  { code: 'ốp 250', gsm: 250, unitPrice: 0.0028 }, // Đã cập nhật 0.0028 theo yêu cầu
  { code: 'C350pindo', gsm: 350, unitPrice: 0.0025 },
  { code: 'Decal', gsm: 1, unitPrice: 1.3 },
  { code: 'Duplex 230', gsm: 230, unitPrice: 0.0018 },
  { code: 'Duplex 250', gsm: 250, unitPrice: 0.0018 },
  { code: 'Duplex 300', gsm: 300, unitPrice: 0.0018 },
  { code: 'Duplex 350', gsm: 350, unitPrice: 0.0018 },
  { code: 'Duplex 400', gsm: 400, unitPrice: 0.0018 },
  { code: 'Kraft nhật 120', gsm: 120, unitPrice: 0.00295 },
  { code: 'không chọn', gsm: 0, unitPrice: 0 },
];

export const OFFSET_PAPER_FORMATS: PaperFormat[] = [
  { code: '650x430', widthMm: 650, heightMm: 430 },
  { code: '545x395', widthMm: 545, heightMm: 395 },
  { code: '395x360', widthMm: 395, heightMm: 360 },
  { code: '430x325', widthMm: 430, heightMm: 325 },
  { code: '395x272.5', widthMm: 395, heightMm: 272.5 },
];

const PRINT_PRICE = {
  1: { base: 250000, overRate: 100, plate: 54000 },
  2: { base: 300000, overRate: 110, plate: 108000 },
  3: { base: 330000, overRate: 110, plate: 162000 },
  4: { base: 360000, overRate: 120, plate: 216000 },
} as const;

const LAMINATE_UNIT = {
  none: 0,
  matte: 0.2,
  gloss: 0.2,
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
  const moldFee = input.diecut === 'none' ? 0 : DIECUT_MOLD_FEE[input.diecut];
  
  // Dù không bế nhưng nếu CÓ XÉN thì vẫn tốn công thợ xếp/lọc thẻ, áp dụng công thức tương đương công bế
  let diecutWorkCost = 0;
  if (input.diecut !== 'none' || input.cut !== 'none') {
    diecutWorkCost = Math.max(totalSheets * sides * 200, 250000);
  }

  return { moldFee, diecutWorkCost, diecutCost: moldFee + diecutWorkCost };
}

function calcUvCost(input: OffsetCardInput): number {
  if (!input.uv || input.uv === 'none') return 0;
  if (input.uv === 'under_500') return 450000;
  if (input.uv === 'under_1000') return 600000;
  if (input.uv === 'over_1000') return 595000;
  if (input.uv === 'one_side') return input.quantity * 30;
  if (input.uv === 'two_side') return input.quantity * 30 * 2;
  return 0;
}

function calcFoilCost(input: OffsetCardInput): number {
  if (!input.foil || input.foil === 'none') return 0;
  const moldCount = input.foilMoldCount ?? 1;
  const faceCount = input.foilFaceCount ?? 1;
  return 500000 * moldCount + input.quantity * 30 * faceCount;
}

export function calculateOffsetCardCostBlock(params: {
  input: OffsetCardInput;
  material: { gsm: number; unitPrice: number; code?: string };
  paperWidthCm: number;
  paperHeightCm: number;
  paperSheetsBase: number;
  wasteSheets: number;
}) {
  const { input, material, paperWidthCm, paperHeightCm, paperSheetsBase, wasteSheets } = params;
  const sides = input.printMode.toLowerCase() === 'ntn' ? 2 : 1;
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
      giay: { ma_giay: input.materialCode, don_gia: unitPrice, dinh_luong: material.gsm, rong_cm: paperWidthCm, dai_cm: paperHeightCm, to_chinh: paperSheetsBase, bu_hao: wasteSheets, tong_to: totalSheets, tien_giay: paperCost },
      in_an: { kieu_in: input.printMode, so_mat: sides, mau_in: input.printColor, luot_in: totalSheets * sides, tien_kem: plateCost, cong_in: printCost },
      gia_cong: { can_mang: input.laminate, tien_can: laminateCost, boi_giay: input.mount, tien_boi: mountCost, cong_be_boi: mountScoreCost, xen: input.cut, tien_xen: cutCost, khoan: input.drill, tien_khoan: drillCost, be_khuon: input.diecut, tien_khuon: moldFee, cong_be: diecutWorkCost, tong_tien_be: diecutCost, phu_uv: input.uv, tien_uv: uvCost, ep_nhu: input.foil, tien_ep_nhu: foilCost },
    },
  };
}

function getMaterial(ctx: any, code: string): OffsetCardMaterial {
  if (ctx && ctx.materials) {
    const foundSeed = ctx.materials.find((m: any) => m.name.toLowerCase() === code.toLowerCase());
    if (foundSeed) {
      return {
        code: foundSeed.name,
        gsm: foundSeed.gsm,
        unitPrice: foundSeed.basePrice / 10_000,
      };
    }
  }

  const found = OFFSET_CARD_MATERIALS.find(m => m.code.toLowerCase() === code.toLowerCase());
  if (!found) {
    throw new Error('Không tìm thấy mã giấy ' + code + ' trong hệ thống.');
  }
  return found;
}

function suggestedWasteSheets(baseSheets: number): number {
  if (baseSheets >= 500) return 100;
  if (baseSheets >= 150) return 70;
  if (baseSheets >= 50) return 50;
  return 5;
}

function layoutForFormat(
  format: PaperFormat,
  cardW: number,
  cardH: number,
  quantity: number,
  material: OffsetCardMaterial,
  input: OffsetCardInput,
  wasteOverride: number | undefined,
  orientation: 'vertical' | 'horizontal',
  spacingMm: number,
): PaperFormatResult | null {
  const safeWidth = format.widthMm - 4;
  const safeHeight = format.heightMm - 12;

  const w = orientation === 'vertical' ? cardW : cardH;
  const h = orientation === 'vertical' ? cardH : cardW;

  const cols = Math.floor((safeWidth + spacingMm) / (w + spacingMm));
  const rows = Math.floor((safeHeight + spacingMm) / (h + spacingMm));
  const itemsPerSide = cols * rows;
  if (itemsPerSide <= 0) return null;

  const sheetsBase = Math.ceil(quantity / itemsPerSide);
  const wasteSheets = wasteOverride ?? suggestedWasteSheets(sheetsBase);
  
  const costEstimate = calculateOffsetCardCostBlock({
    input,
    material,
    paperWidthCm: format.widthMm / 10,
    paperHeightCm: format.heightMm / 10,
    paperSheetsBase: sheetsBase,
    wasteSheets
  });

  const usedW = cols * w + Math.max(0, cols - 1) * spacingMm;
  const usedH = rows * h + Math.max(0, rows - 1) * spacingMm;

  return {
    ma_kho: format.code,
    kho_giay_rong_mm: format.widthMm,
    kho_giay_dai_mm: format.heightMm,
    vung_in_rong_mm: safeWidth,
    vung_in_dai_mm: safeHeight,
    chieu_xep: orientation,
    the_rong_mm: w,
    the_dai_mm: h,
    so_cot: cols,
    so_hang: rows,
    so_bat_mot_mat: itemsPerSide,
    to_chinh: sheetsBase,
    bu_hao: wasteSheets,
    tong_to: sheetsBase + wasteSheets,
    uoc_tinh_tien_giay: costEstimate.totalCost,
    kho_giay_rong_cm: format.widthMm / 10,
    kho_giay_dai_cm: format.heightMm / 10,
    le_phai_mm: safeWidth - usedW,
    le_duoi_mm: safeHeight - usedH,
  };
}

export function findBestOffsetCardFormat(input: OffsetCardInput, material: OffsetCardMaterial): PaperFormatResult {
  const cardW = input.widthCm * 10;
  const cardH = input.heightCm * 10;
  const spacing = 0; 
  
  const allowedFormats = input.forcedPaperCode
    ? OFFSET_PAPER_FORMATS.filter(f => f.code === input.forcedPaperCode)
    : OFFSET_PAPER_FORMATS;

  const candidates = allowedFormats.flatMap(format => [
    layoutForFormat(format, cardW, cardH, input.quantity, material, input, input.wasteSheetsOverride, 'vertical', spacing),
    layoutForFormat(format, cardW, cardH, input.quantity, material, input, input.wasteSheetsOverride, 'horizontal', spacing),
  ]).filter((x): x is PaperFormatResult => Boolean(x));

  if (candidates.length === 0) throw new Error('Không có khổ giấy nào ghép được kích thước thẻ này.');

  return candidates.sort((a, b) => {
    if (a.uoc_tinh_tien_giay !== b.uoc_tinh_tien_giay) return a.uoc_tinh_tien_giay - b.uoc_tinh_tien_giay;
    if (a.tong_to !== b.tong_to) return a.tong_to - b.tong_to;
    if (a.so_bat_mot_mat !== b.so_bat_mot_mat) return b.so_bat_mot_mat - a.so_bat_mot_mat;
    return (a.le_phai_mm + a.le_duoi_mm) - (b.le_phai_mm + b.le_duoi_mm);
  })[0];
}

export function _calculateOffsetCard(input: OffsetCardInput, ctx?: any) {
  const material = getMaterial(ctx, input.materialCode);
  const format = input.forcedPaperFormat && input.forcedPaperFormat !== 'auto'
      ? findBestOffsetCardFormat({ ...input, forcedPaperCode: input.forcedPaperFormat }, material)
      : findBestOffsetCardFormat(input, material);

  const paperSheetsBase = Math.ceil(input.quantity / format.so_bat_mot_mat);
  const wasteSheets = input.wasteSheetsOverride ?? format.bu_hao;
  const paperWidthCm = input.paperWidthCmOverride ?? format.kho_giay_rong_cm;
  const paperHeightCm = input.paperHeightCmOverride ?? format.kho_giay_dai_cm;

  const costBlock = calculateOffsetCardCostBlock({
    input,
    material,
    paperWidthCm,
    paperHeightCm,
    paperSheetsBase,
    wasteSheets
  });

  return {
    productType: 'offset_card',
    input,
    ...costBlock,
    breakdown: {
      kho_in: format,
      so_luong: input.quantity,
      ...costBlock.breakdown
    }
  };
}

export function calculateOffsetCard(input: OffsetCardInput, ctx: any): import('../types').QuoteResult {
  const result = _calculateOffsetCard(input, ctx);
  return {
    productType: 'offset_card',
    selectedMethod: 'offset_card',
    costTotal: result.totalCost,
    costUnit: result.factoryUnitPrice,
    sellTotal: result.sellingTotal,
    sellUnit: result.sellingUnitPrice,
    marginRate: (result.sellingTotal - result.totalCost) / result.sellingTotal,
    breakdown: result.breakdown as any,
    alternatives: []
  };
}

// Test chuẩn theo ảnh Excel: tổng xấp xỉ 1.700.412, đơn giá báo khách xấp xỉ 243.
export const excelTestOffsetCard = _calculateOffsetCard({
  quantity: 10_000,
  widthCm: 6,
  heightCm: 9,
  materialCode: 'ốp 250',
  printMode: 'ntn',
  printColor: 4,
  laminate: 'none',
  mount: 'none',
  cut: 'none',
  drill: 'none',
  diecut: 'diecut_work_only',
  uv: 'none',
  foil: 'none',
  wasteSheetsOverride: 70,
  forcedPaperFormat: '545x395'
}, { materials: [{ name: 'ốp 250', gsm: 250, basePrice: 28 }] });
