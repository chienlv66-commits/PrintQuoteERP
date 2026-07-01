/**
 * PRINTOS - Offset Card / Thẻ bài pricing engine
 * Excel-compatible version for sheet "Thẻ bài".
 * Key fix: choose cheapest paper/cost candidate, not only max items per sheet.
 */

export type PrintMode = 'NTN' | 'ONE_SIDE';
export type LaminateType = 'none' | 'gloss' | 'matte';
export type MountType = 'none' | 'double_card';
export type CutType = 'none' | 'normal' | 'mounted' | 'by_design';
export type DrillType = 'none' | 'drill';
export type DiecutType = 'none' | 'full_mold' | 'half_mold';
export type UvType = 'none' | 'under_500' | 'under_1000' | 'over_1000' | 'one_side' | 'two_side';
export type FoilType = 'none' | 'foil';

export interface OffsetCardInput {
  quantity: number;
  widthCm: number;
  heightCm: number;
  materialCode: string;
  printMode: PrintMode;
  printColor: 1 | 2 | 3 | 4;
  laminate: LaminateType;
  mount: MountType;
  cut: CutType;
  drill: DrillType;
  diecut: DiecutType;
  uv?: UvType;
  foil?: FoilType;
  foilMoldCount?: number;
  foilFaceCount?: number;

  // Admin overrides giống ô vàng/xanh trong Excel
  forcedPaperCode?: string;       // ví dụ '545x395'
  paperSheetsOverride?: number;   // H6 nếu muốn nhập tay tổng giấy hoặc base tuỳ UI
  wasteSheetsOverride?: number;   // bù hao 5 / 50 / 70 / 100
  paperWidthCmOverride?: number;  // H7
  paperHeightCmOverride?: number; // H8
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
  paperCode: string;
  paperWidthMm: number;
  paperHeightMm: number;
  safeWidthMm: number;
  safeHeightMm: number;
  orientation: 'vertical' | 'horizontal';
  cardWidthMm: number;
  cardHeightMm: number;
  cols: number;
  rows: number;
  itemsPerSide: number;
  sheetsBase: number;
  wasteSheets: number;
  totalSheets: number;
  paperCostEstimate: number;
  paperWidthCmForCost: number;
  paperHeightCmForCost: number;
  wasteRightMm: number;
  wasteBottomMm: number;
}

export interface OffsetCardBreakdown {
  format: PaperFormatResult;
  quantity: number;
  material: OffsetCardMaterial;
  sides: number;
  printImpressions: number;
  paperSheetsBase: number;
  wasteSheets: number;
  paperSheetsTotal: number;
  paperWidthCm: number;
  paperHeightCm: number;
  paperCost: number;
  plateCost: number;
  printCost: number;
  laminateCost: number;
  mountCost: number;
  mountScoreCost: number;
  cutCost: number;
  drillCost: number;
  diecutCost: number;
  uvCost: number;
  foilCost: number;
  totalCost: number;
  factoryUnitPrice: number;
  sellingUnitPrice: number;
  sellingTotal: number;
}

export interface OffsetCardResult {
  productType: 'offset_card';
  input: OffsetCardInput;
  breakdown: OffsetCardBreakdown;
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
  { code: 'ốp 250', gsm: 250, unitPrice: 0.0028 },
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
  1: { plate: 54_000, base: 250_000 },
  2: { plate: 108_000, base: 300_000 },
  3: { plate: 162_000, base: 330_000 },
  4: { plate: 216_000, base: 360_000 },
} as const;

const LAMINATE_UNIT: Record<LaminateType, number> = { none: 0, gloss: 0.2, matte: 0.2 };
const MOUNT_UNIT: Record<MountType, number> = { none: 0, double_card: 0.18 };
const CUT_RULE: Record<CutType, { fee: number; capacity: number }> = {
  none: { fee: 0, capacity: 1 },
  normal: { fee: 40_000, capacity: 200 },
  mounted: { fee: 40_000, capacity: 100 },
  by_design: { fee: 80_000, capacity: 850 },
};
const DIECUT_MOLD_FEE: Record<DiecutType, number> = { none: 0, full_mold: 500_000, half_mold: 350_000 };

function roundMoney(n: number): number { return Math.round(n); }
function sideMultiplier(printMode: PrintMode): number { return printMode === 'NTN' ? 2 : 1; }
function getMaterial(code: string): OffsetCardMaterial {
  const found = OFFSET_CARD_MATERIALS.find(m => m.code.trim().toLowerCase() === code.trim().toLowerCase());
  if (!found) throw new Error(`Không tìm thấy mã giấy: ${code}`);
  return found;
}

function suggestedWasteSheets(baseSheets: number): number {
  // Khớp ví dụ Excel: 278 tờ base => bù hao 70, tổng 348.
  if (baseSheets >= 500) return 100;
  if (baseSheets >= 150) return 70;
  if (baseSheets >= 50) return 50;
  return 5;
}

function paperCostOf(totalSheets: number, format: PaperFormat, material: OffsetCardMaterial): number {
  // Excel H9 dùng khổ giấy nhập H7 x H8 theo cm. Với khổ 545x395 => 54.5 x 39.5.
  return roundMoney(totalSheets * (format.widthMm / 10) * (format.heightMm / 10) * material.unitPrice * material.gsm);
}

function layoutForFormat(
  format: PaperFormat,
  cardW: number,
  cardH: number,
  quantity: number,
  material: OffsetCardMaterial,
  wasteOverride: number | undefined,
  orientation: 'vertical' | 'horizontal',
  spacingMm: number,
): PaperFormatResult | null {
  // Vùng in toàn khổ: trái 2, phải 2, trên 2, dưới 10 => width - 4, height - 12.
  const safeWidth = format.widthMm - 4;
  const safeHeight = format.heightMm - 12;

  const w = orientation === 'vertical' ? cardW : cardH;
  const h = orientation === 'vertical' ? cardH : cardW;

  const cols = Math.floor((safeWidth + spacingMm) / (w + spacingMm));
  const rows = Math.floor((safeHeight + spacingMm) / (h + spacingMm));
  const itemsPerSide = cols * rows;
  if (itemsPerSide <= 0) return null;

  const sheetsBase = Math.ceil(quantity / (itemsPerSide * 2));
  const wasteSheets = wasteOverride ?? suggestedWasteSheets(sheetsBase);
  const totalSheets = sheetsBase + wasteSheets;
  const paperCostEstimate = paperCostOf(totalSheets, format, material);

  const usedW = cols * w + Math.max(0, cols - 1) * spacingMm;
  const usedH = rows * h + Math.max(0, rows - 1) * spacingMm;

  return {
    paperCode: format.code,
    paperWidthMm: format.widthMm,
    paperHeightMm: format.heightMm,
    safeWidthMm: safeWidth,
    safeHeightMm: safeHeight,
    orientation,
    cardWidthMm: w,
    cardHeightMm: h,
    cols,
    rows,
    itemsPerSide,
    sheetsBase,
    wasteSheets,
    totalSheets,
    paperCostEstimate,
    paperWidthCmForCost: format.widthMm / 10,
    paperHeightCmForCost: format.heightMm / 10,
    wasteRightMm: safeWidth - usedW,
    wasteBottomMm: safeHeight - usedH,
  };
}

export function findBestOffsetCardFormat(input: OffsetCardInput, material: OffsetCardMaterial): PaperFormatResult {
  const cardW = input.widthCm * 10;
  const cardH = input.heightCm * 10;
  const spacing = input.diecut !== 'none' ? 3 : 0;
  const allowedFormats = input.forcedPaperCode
    ? OFFSET_PAPER_FORMATS.filter(f => f.code === input.forcedPaperCode)
    : OFFSET_PAPER_FORMATS;

  const candidates = allowedFormats.flatMap(format => [
    layoutForFormat(format, cardW, cardH, input.quantity, material, input.wasteSheetsOverride, 'vertical', spacing),
    layoutForFormat(format, cardW, cardH, input.quantity, material, input.wasteSheetsOverride, 'horizontal', spacing),
  ]).filter((x): x is PaperFormatResult => Boolean(x));

  if (candidates.length === 0) throw new Error('Không có khổ giấy nào ghép được kích thước thẻ này.');

  // Quan trọng: chọn theo tiền giấy rẻ nhất, không chọn theo số tờ ít nhất.
  return candidates.sort((a, b) => {
    if (a.paperCostEstimate !== b.paperCostEstimate) return a.paperCostEstimate - b.paperCostEstimate;
    if (a.totalSheets !== b.totalSheets) return a.totalSheets - b.totalSheets;
    if (a.itemsPerSide !== b.itemsPerSide) return b.itemsPerSide - a.itemsPerSide;
    return (a.wasteRightMm + a.wasteBottomMm) - (b.wasteRightMm + b.wasteBottomMm);
  })[0];
}

export function calculateOffsetCard(input: OffsetCardInput): OffsetCardResult {
  const material = getMaterial(input.materialCode);
  const format = findBestOffsetCardFormat(input, material);
  const sides = sideMultiplier(input.printMode);

  const paperSheetsBase = Math.ceil(input.quantity / (format.itemsPerSide * 2));
  const wasteSheets = input.wasteSheetsOverride ?? format.wasteSheets;
  const paperSheetsTotal = input.paperSheetsOverride ?? (paperSheetsBase + wasteSheets);

  const paperWidthCm = input.paperWidthCmOverride ?? format.paperWidthCmForCost;
  const paperHeightCm = input.paperHeightCmOverride ?? format.paperHeightCmForCost;

  // H9 = H6 * H7 * H8 * đơn giá giấy * định lượng giấy
  const paperCost = roundMoney(paperSheetsTotal * paperWidthCm * paperHeightCm * material.unitPrice * material.gsm);

  // H10
  const plateCost = PRINT_PRICE[input.printColor].plate;

  // H11 = IF(H6*H12>1000, base+(H6*H12-1000)*120, base)
  const printImpressions = paperSheetsTotal * sides;
  const printBase = PRINT_PRICE[input.printColor].base;
  const printCost = printImpressions > 1000 ? printBase + (printImpressions - 1000) * 120 : printBase;

  // H13
  const laminateCost = roundMoney(paperWidthCm * paperHeightCm * paperSheetsTotal * sides * LAMINATE_UNIT[input.laminate]);

  // H14, H15
  const mountCost = roundMoney(MOUNT_UNIT[input.mount] * paperWidthCm * paperHeightCm * paperSheetsTotal);
  const mountScoreCost = mountCost > 0 ? paperSheetsTotal * 100 : 0;

  // H16
  const cutRule = CUT_RULE[input.cut];
  const cutCost = input.cut === 'none' ? 0 : roundMoney((paperSheetsTotal / cutRule.capacity) * cutRule.fee);

  // H17
  const drillCost = input.drill === 'drill' ? input.quantity * 10 : 0;

  // H18
  const moldFee = DIECUT_MOLD_FEE[input.diecut];
  const diecutWork = input.diecut === 'none' ? 0 : Math.max(paperSheetsTotal * sides * 200, 250_000);
  const diecutCost = input.diecut === 'none' ? 0 : moldFee + diecutWork;

  // H20: theo cấu trúc Excel hiện tại, UV có thể nhập dạng giá trực tiếp hoặc tính theo mặt.
  const uv = input.uv ?? 'none';
  let uvCost = 0;
  if (uv === 'under_500') uvCost = 450_000;
  if (uv === 'under_1000') uvCost = 600_000;
  if (uv === 'over_1000') uvCost = 595_000;
  if (uv === 'one_side') uvCost = input.quantity * 30;
  if (uv === 'two_side') uvCost = input.quantity * 30 * 2;

  // H20 trong file: IF(G20>0,(H4*30*G22+G20*G21),0)
  const foilMoldCount = input.foilMoldCount ?? 1;
  const foilFaceCount = input.foilFaceCount ?? 1;
  const foilMoldFee = 500_000;
  const foilCost = input.foil === 'foil' ? foilMoldFee * foilMoldCount + input.quantity * 30 * foilFaceCount : 0;

  const totalCost = roundMoney(
    paperCost + plateCost + printCost + laminateCost + mountCost + mountScoreCost +
    cutCost + drillCost + diecutCost + uvCost + foilCost,
  );

  const factoryUnitPrice = totalCost / input.quantity;
  const sellingUnitPrice = factoryUnitPrice / 0.7;
  const sellingTotal = sellingUnitPrice * input.quantity;

  return {
    productType: 'offset_card',
    input,
    breakdown: {
      format,
      quantity: input.quantity,
      material,
      sides,
      printImpressions,
      paperSheetsBase,
      wasteSheets,
      paperSheetsTotal,
      paperWidthCm,
      paperHeightCm,
      paperCost,
      plateCost,
      printCost,
      laminateCost,
      mountCost,
      mountScoreCost,
      cutCost,
      drillCost,
      diecutCost,
      uvCost,
      foilCost,
      totalCost,
      factoryUnitPrice,
      sellingUnitPrice,
      sellingTotal,
    },
  };
}

// Test chuẩn theo ảnh Excel: tổng xấp xỉ 1.700.412, đơn giá báo khách xấp xỉ 243.
export const excelTestOffsetCard = calculateOffsetCard({
  quantity: 10_000,
  widthCm: 6,
  heightCm: 9,
  materialCode: 'ốp 250',
  printMode: 'NTN',
  printColor: 4,
  laminate: 'none',
  mount: 'none',
  cut: 'none',
  drill: 'none',
  diecut: 'half_mold',
  uv: 'none',
  foil: 'none',
  wasteSheetsOverride: 70,
});
