/**
 * PRINTOS - Offset Card / Thẻ bài pricing engine
 * Excel source: sheet "Thẻ bài" + file "Xem khổ in.xlsx"
 * Goal: match Excel logic, but calculate paper format/layout automatically.
 */

export type PrintMode = 'NTN' | 'ONE_SIDE';
export type LaminateType = 'none' | 'gloss' | 'matte';
export type MountType = 'none' | 'double_card' | 'by_job';
export type CutType = 'none' | 'normal' | 'mounted' | 'by_design';
export type DrillType = 'none' | 'drill';
export type DiecutType = 'none' | 'full_mold' | 'half_mold';
export type UvType = 'none' | 'under_500' | 'under_1000' | 'over_1000' | 'one_side' | 'two_side';
export type FoilType = 'none' | 'foil';

export interface OffsetCardInput {
  quantity: number;          // số lượng thẻ, ví dụ 10000
  widthCm: number;           // chiều rộng thẻ thành phẩm, ví dụ 6
  heightCm: number;          // chiều dài thẻ thành phẩm, ví dụ 9
  materialCode: string;      // ví dụ "ốp 250", "C300", "I250"
  printMode: PrintMode;      // NTN = nó trở nó; ONE_SIDE = in 1 mặt
  printColor: 1 | 2 | 3 | 4; // số màu in
  laminate: LaminateType;
  mount: MountType;
  cut: CutType;
  drill: DrillType;
  diecut: DiecutType;
  uv?: UvType;
  foil?: FoilType;
  foilMoldCount?: number;
  foilFaceCount?: number;
  widthPaperCmOverride?: number;  // nếu admin muốn điền tay khổ giấy
  heightPaperCmOverride?: number;
  paperSheetsOverride?: number;   // nếu admin muốn điền tay số lượng giấy
  wasteSheetsOverride?: number;   // nếu admin muốn điền tay bù hao
  requireDiecutSpacing?: boolean; // true nếu bế khuôn, khoảng cách thẻ tối thiểu 3mm
}

export interface OffsetCardMaterial {
  code: string;
  gsm: number;
  unitPrice: number; // giống cột C sheet Thẻ bài, ví dụ 0.0028
}

export interface OffsetCardBreakdown {
  format: PaperFormatResult;
  quantity: number;
  material: OffsetCardMaterial;
  paperSheetsBase: number;
  wasteSheets: number;
  paperSheetsTotal: number;
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

export interface PaperFormat {
  code: string;
  widthMm: number;
  heightMm: number;
}

export interface PaperFormatResult {
  paperCode: string;
  paperWidthMm: number;
  paperHeightMm: number;
  halfWidthMm: number;
  halfHeightMm: number;
  safeWidthMm: number;
  safeHeightMm: number;
  orientation: 'vertical' | 'horizontal';
  cardWidthMm: number;
  cardHeightMm: number;
  cols: number;
  rows: number;
  itemsPerHalf: number; // Excel gọi là SL bát mỗi bên thực tế
  sheetsNeeded: number; // chưa bù hao
  wasteRightMm: number;
  wasteBottomMm: number;
}

export const OFFSET_CARD_MATERIALS: OffsetCardMaterial[] = [
  { code: 'I250', gsm: 250, unitPrice: 17 / 10000 },
  { code: 'I210', gsm: 210, unitPrice: 0.0018 },
  { code: 'I300', gsm: 300, unitPrice: 17 / 10000 },
  { code: 'I350', gsm: 350, unitPrice: 17 / 10000 },
  { code: 'I400', gsm: 400, unitPrice: 17 / 10000 },
  { code: 'C120', gsm: 120, unitPrice: 0.0021 },
  { code: 'C150', gsm: 150, unitPrice: 0.0021 },
  { code: 'C200', gsm: 200, unitPrice: 0.0021 },
  { code: 'C250', gsm: 250, unitPrice: 0.0021 },
  { code: 'C300', gsm: 300, unitPrice: 0.0021 },
  { code: 'C300pindo', gsm: 300, unitPrice: 24 / 10000 },
  { code: 'ốp 100', gsm: 100, unitPrice: 0.0026 },
  { code: 'ốp 150', gsm: 150, unitPrice: 0.0026 },
  { code: 'ốp 200', gsm: 200, unitPrice: 0.0028 },
  { code: 'ốp 250', gsm: 250, unitPrice: 0.0028 },
  { code: 'C350pindo', gsm: 350, unitPrice: 25 / 10000 },
  { code: 'Decal', gsm: 1, unitPrice: 1.3 },
  { code: 'Duplex 230', gsm: 230, unitPrice: 0.0018 },
  { code: 'Duplex 250', gsm: 250, unitPrice: 0.0018 },
  { code: 'Duplex 300', gsm: 300, unitPrice: 0.0018 },
  { code: 'Duplex 350', gsm: 350, unitPrice: 0.0018 },
  { code: 'Duplex 400', gsm: 400, unitPrice: 0.0018 },
  { code: 'Kraft nhật 120', gsm: 120, unitPrice: 29.5 / 10000 },
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

const LAMINATE_UNIT: Record<LaminateType, number> = {
  none: 0,
  gloss: 0.2,
  matte: 0.2,
};

const MOUNT_UNIT: Record<MountType, number> = {
  none: 0,
  double_card: 0.18,
  by_job: 0, // nếu tính theo bài, nhập trực tiếp bằng rule riêng sau này
};

const CUT_RULE: Record<CutType, { fee: number; capacity: number }> = {
  none: { fee: 0, capacity: 1 },
  normal: { fee: 40_000, capacity: 200 },
  mounted: { fee: 40_000, capacity: 100 },
  by_design: { fee: 80_000, capacity: 850 },
};

const DIECUT_MOLD_FEE: Record<DiecutType, number> = {
  none: 0,
  full_mold: 500_000,
  half_mold: 350_000,
};

function ceil(n: number): number {
  return Math.ceil(n);
}

function roundMoney(n: number): number {
  return Math.round(n);
}

function getMaterial(code: string): OffsetCardMaterial {
  const found = OFFSET_CARD_MATERIALS.find(m => m.code.toLowerCase() === code.toLowerCase());
  if (!found) throw new Error(`Không tìm thấy mã giấy: ${code}`);
  return found;
}

function sideMultiplier(printMode: PrintMode): number {
  // Excel: NTN = 2; in 1 mặt = 1
  return printMode === 'NTN' ? 2 : 1;
}

function defaultWasteSheets(quantity: number, baseSheets: number): number {
  // Excel có các mức bù hao 5 / 50 / 70 / 100. Cho phép admin override.
  if (quantity >= 10_000 || baseSheets >= 250) return 100;
  if (quantity >= 5_000 || baseSheets >= 150) return 70;
  if (quantity >= 1_000 || baseSheets >= 50) return 50;
  return 5;
}

function layoutOneHalf(
  format: PaperFormat,
  cardW: number,
  cardH: number,
  quantity: number,
  printMode: PrintMode,
  spacingMm: number,
  orientation: 'vertical' | 'horizontal',
): PaperFormatResult {
  // Excel chia đôi khổ theo chiều dài: 650x430 => 325x430.
  const halfWidth = format.widthMm / 2;
  const halfHeight = format.heightMm;

  // Vùng an toàn: trái 2mm, phải 2mm, trên 2mm, dưới 10mm.
  // Trong file Xem khổ in, phần tính 1 nửa giấy đang dùng: width - 2, height - 12.
  // Theo yêu cầu mới của bạn, vùng in thực tế toàn khổ là 646x418; khi chia nửa dùng halfWidth - 2 và height - 12 để khớp Excel.
  const safeWidth = halfWidth - 2;
  const safeHeight = halfHeight - 12;

  const w = orientation === 'vertical' ? cardW : cardH;
  const h = orientation === 'vertical' ? cardH : cardW;

  const cols = Math.floor((safeWidth + spacingMm) / (w + spacingMm));
  const rows = Math.floor((safeHeight + spacingMm) / (h + spacingMm));
  const itemsPerHalf = Math.max(0, cols * rows);

  // Khớp ví dụ: 10.000 thẻ, 6x9, NTN, 18 bát mỗi bên => 278 tờ.
  const sheetsNeeded = itemsPerHalf > 0 ? ceil(quantity / (itemsPerHalf * 2)) : Number.POSITIVE_INFINITY;

  const usedW = cols > 0 ? cols * w + Math.max(0, cols - 1) * spacingMm : 0;
  const usedH = rows > 0 ? rows * h + Math.max(0, rows - 1) * spacingMm : 0;

  return {
    paperCode: format.code,
    paperWidthMm: format.widthMm,
    paperHeightMm: format.heightMm,
    halfWidthMm: halfWidth,
    halfHeightMm: halfHeight,
    safeWidthMm: safeWidth,
    safeHeightMm: safeHeight,
    orientation,
    cardWidthMm: w,
    cardHeightMm: h,
    cols,
    rows,
    itemsPerHalf,
    sheetsNeeded,
    wasteRightMm: safeWidth - usedW,
    wasteBottomMm: safeHeight - usedH,
  };
}

export function findBestOffsetCardFormat(input: OffsetCardInput): PaperFormatResult {
  const cardW = input.widthCm * 10;
  const cardH = input.heightCm * 10;
  const spacing = input.requireDiecutSpacing || input.diecut !== 'none' ? 3 : 0;

  const candidates = OFFSET_PAPER_FORMATS.flatMap(format => [
    layoutOneHalf(format, cardW, cardH, input.quantity, input.printMode, spacing, 'vertical'),
    layoutOneHalf(format, cardW, cardH, input.quantity, input.printMode, spacing, 'horizontal'),
  ]).filter(x => x.itemsPerHalf > 0 && Number.isFinite(x.sheetsNeeded));

  if (candidates.length === 0) throw new Error('Không có khổ giấy nào ghép được kích thước thẻ này.');

  // Ưu tiên ít giấy nhất; nếu bằng nhau chọn phương án nhiều bát hơn, dư mép ít hơn.
  return candidates.sort((a, b) => {
    if (a.sheetsNeeded !== b.sheetsNeeded) return a.sheetsNeeded - b.sheetsNeeded;
    if (a.itemsPerHalf !== b.itemsPerHalf) return b.itemsPerHalf - a.itemsPerHalf;
    return (a.wasteRightMm + a.wasteBottomMm) - (b.wasteRightMm + b.wasteBottomMm);
  })[0];
}

export function calculateOffsetCard(input: OffsetCardInput): OffsetCardResult {
  const material = getMaterial(input.materialCode);
  const format = findBestOffsetCardFormat(input);
  const paperWidthCm = input.widthPaperCmOverride ?? (format.paperHeightMm / 10); // Excel hay điền 43
  const paperHeightCm = input.heightPaperCmOverride ?? ((format.paperWidthMm / 2) / 10); // Excel hay điền 32.5
  const paperSheetsBase = input.paperSheetsOverride ?? format.sheetsNeeded;
  const wasteSheets = input.wasteSheetsOverride ?? defaultWasteSheets(input.quantity, paperSheetsBase);
  const paperSheetsTotal = paperSheetsBase + wasteSheets;
  const sides = sideMultiplier(input.printMode);

  // H9 = H6 * H7 * H8 * đơn giá giấy * định lượng giấy
  const paperCost = roundMoney(paperSheetsTotal * paperWidthCm * paperHeightCm * material.unitPrice * material.gsm);

  // H10 = tiền kẽm theo số màu
  const plateCost = PRINT_PRICE[input.printColor].plate;

  // H11 = nếu số lượt > 1000: base + (lượt - 1000) * 120, ngược lại base
  // Excel đang dùng *120 cho phần vượt, kể cả 1-4 màu.
  const printImpressions = paperSheetsTotal * sides;
  const printBase = PRINT_PRICE[input.printColor].base;
  const printCost = printImpressions > 1000 ? printBase + (printImpressions - 1000) * 120 : printBase;

  // H13 = khổ giấy * số lượng giấy * đơn giá cán * số lượt cán
  const laminateCost = roundMoney(paperWidthCm * paperHeightCm * paperSheetsTotal * sides * LAMINATE_UNIT[input.laminate]);

  // H14 = bồi thẻ = đơn giá bồi * khổ giấy * số lượng giấy
  const mountCost = roundMoney(MOUNT_UNIT[input.mount] * paperWidthCm * paperHeightCm * paperSheetsTotal);

  // H15 = bế gân để bồi = nếu có bồi thì số lượng giấy * 100
  const mountScoreCost = mountCost > 0 ? paperSheetsTotal * 100 : 0;

  // H16 = số lượng giấy / số tờ mỗi lần xén * phí/lần
  const cutRule = CUT_RULE[input.cut];
  const cutCost = input.cut === 'none' ? 0 : roundMoney((paperSheetsTotal / cutRule.capacity) * cutRule.fee);

  // H17 = khoan = 10đ/thẻ * số lượng thẻ
  const drillCost = input.drill === 'drill' ? 10 * input.quantity : 0;

  // H18 = khuôn + công bế; công bế tối thiểu 250k, hoặc lượt * 200đ
  const moldFee = DIECUT_MOLD_FEE[input.diecut];
  const diecutWork = input.diecut === 'none' ? 0 : Math.max(paperSheetsTotal * sides * 200, 250_000);
  const diecutCost = input.diecut === 'none' ? 0 : moldFee + diecutWork;

  // H20: UV đơn giản theo Excel. Có thể tinh chỉnh sau theo loại UV cụ thể.
  let uvBase = 0;
  const uv = input.uv ?? 'none';
  if (uv === 'under_500') uvBase = 450_000;
  if (uv === 'under_1000') uvBase = 600_000;
  if (uv === 'over_1000') uvBase = 595_000;
  const uvFaceCount = uv === 'two_side' ? 2 : uv === 'one_side' ? 1 : 0;
  const uvCost = uvBase > 0 ? uvBase : uvFaceCount > 0 ? input.quantity * 30 * uvFaceCount : 0;

  // Ép nhũ: Excel có khuôn nhũ + 30đ/mặt thẻ; đang để mặc định 500k nếu chọn.
  const foilMoldCount = input.foilMoldCount ?? 1;
  const foilFaceCount = input.foilFaceCount ?? 1;
  const foilCost = input.foil === 'foil' ? 500_000 * foilMoldCount + 30 * input.quantity * foilFaceCount : 0;

  const totalCost = roundMoney(
    paperCost + plateCost + printCost + laminateCost + mountCost + mountScoreCost +
    cutCost + drillCost + diecutCost + uvCost + foilCost,
  );

  const factoryUnitPrice = totalCost / input.quantity;
  const sellingUnitPrice = factoryUnitPrice / 0.7; // H28 = H27 / 0.7
  const sellingTotal = sellingUnitPrice * input.quantity;

  return {
    productType: 'offset_card',
    input,
    breakdown: {
      format,
      quantity: input.quantity,
      material,
      paperSheetsBase,
      wasteSheets,
      paperSheetsTotal,
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

// Test nhanh theo ví dụ của bạn:
// 10.000 thẻ, 6x9cm, NTN, ốp 250, không cán, xén thường.
export const exampleOffsetCard = calculateOffsetCard({
  quantity: 10_000,
  widthCm: 6,
  heightCm: 9,
  materialCode: 'ốp 250',
  printMode: 'NTN',
  printColor: 4,
  laminate: 'none',
  mount: 'none',
  cut: 'normal',
  drill: 'none',
  diecut: 'none',
  wasteSheetsOverride: 100,
});
