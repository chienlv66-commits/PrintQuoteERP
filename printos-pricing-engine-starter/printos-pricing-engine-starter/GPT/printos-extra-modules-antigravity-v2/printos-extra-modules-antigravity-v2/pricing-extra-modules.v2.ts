// PrintOS - Extra pricing modules v2
// Đã chốt theo phản hồi:
// 1) Void: laminate dùng 0/1
// 2) Mica: giữ công thức Excel nhưng gia công cut/drillOrCorner là option khi cần
// 3) Tem PET: dùng bảng giá theo mét bên cạnh
// 4) Tem UV và Tem cao thành 1 màu là 2 sản phẩm riêng
// 5) Dây logo: tính theo mốc Excel, không tính theo số lượng thực tế lẻ

export function floorDiv(n: number, d: number): number {
  return Math.floor(n / d);
}

export function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

export function roundMoney(value: number): number {
  return Math.round(value);
}

export function maxLayout(sheetW: number, sheetH: number, itemW: number, itemH: number, spacing = 0) {
  const aCols = floorDiv(sheetW, itemW + spacing);
  const aRows = floorDiv(sheetH, itemH + spacing);
  const a = aCols * aRows;

  const bCols = floorDiv(sheetW, itemH + spacing);
  const bRows = floorDiv(sheetH, itemW + spacing);
  const b = bCols * bRows;

  if (a >= b) return { items: a, cols: aCols, rows: aRows, orientation: 'normal' as const };
  return { items: b, cols: bCols, rows: bRows, orientation: 'rotated' as const };
}

function findByLabel<T extends { label: string }>(rows: T[], label: string): T {
  const found = rows.find((r) => r.label === label);
  if (!found) throw new Error(`Không tìm thấy label: ${label}`);
  return found;
}

function findMeterTier<T extends { min: number; max: number }>(rows: T[], meters: number): T {
  const found = rows.find((r) => meters >= r.min && meters <= r.max);
  if (!found) throw new Error(`Không tìm thấy mốc mét cho ${meters}`);
  return found;
}

export const EXTRA_PRICING_DATA_V2 = {
  void: {
    materialCostPerMeter: 14200,
    wasteMeters: 25,
    basePrintUnit: 110,
    minPrintCost: 800000,
    marginDivisor: 0.6,
    moldCost: 400000,
    secondColorFee: 500000,
    laminateUnit: 500,
    quantityFactors: [
      { label: '<10.000', factor: 1.1 },
      { label: '10k - 19k', factor: 1.05 },
      { label: '20k-49k', factor: 1 },
      { label: '50k-99k', factor: 0.95 },
      { label: '100k-199k', factor: 0.9 },
      { label: '200k-499k', factor: 0.85 },
      { label: '>500k', factor: 0.8 },
    ],
  },
  mica: {
    sheetWidthCm: 26,
    sheetHeightCm: 40,
    rawPaperWidthCm: 27,
    rawPaperHeightCm: 42,
    wasteSheets: 100,
    printPerColorPerSide: 920000,
    cutMin: 250000,
    cutBatchQty: 100,
    cutBatchFee: 50000,
    processingMin: 200000,
    marginDivisor: 0.6,
  },
  macDa: {
    moldMinQty: 3000,
    moldCost: 600000,
    largeAreaThreshold: 12,
    largeAreaUnit: 33,
    smallAreaBase: 300,
    smallMoldShare: 0.5,
    quantityFactors: [
      { label: '<3.000', factor: 0.7 },
      { label: '4.000 - 10.000', factor: 0.72 },
      { label: '12.000 - 50.000', factor: 0.75 },
      { label: '55.000 - 100.000', factor: 0.8 },
      { label: '> 110.000', factor: 0.85 },
    ],
  },
  temPet: {
    meterTiers: [
      { min: 0, max: 9.999999, rollPricePerMeter: 140000 },
      { min: 10, max: 59.999999, rollPricePerMeter: 115000 },
      { min: 60, max: 199.999999, rollPricePerMeter: 95000 },
      { min: 200, max: Number.POSITIVE_INFINITY, rollPricePerMeter: 85000 },
    ],
    cutUnitExtra: 100,
  },
  temUv: {
    tiers: [
      { label: '1-2', price: 80000 },
      { label: '3-5', price: 60000 },
      { label: '6-9', price: 45000 },
      { label: '10-20', price: 40000 },
      { label: '21-29', price: 38000 },
      { label: '30-50', price: 35000 },
      { label: '51-60', price: 33000 },
      { label: '60-100', price: 30000 },
      { label: '>100', price: 28000 },
    ],
  },
  dayLogo: {
    twoSideExtra: 50,
    tiers: [5000, 10000, 20000, 30000, 40000, 50000, 100000],
    prices: {
      du: [760, 410, 300, 290, 280, 260, 220],
      sap: [null, 705, 550, 405, 395, 375, 305],
      ruy_bang: [null, 705, 550, 405, 395, 375, 335],
    } as const,
  },
};

export interface VoidInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  colorCount: 1 | 2;
  quantityTierLabel: string;
  laminate: 0 | 1;
}

export function calculateVoid(input: VoidInput) {
  const d = EXTRA_PRICING_DATA_V2.void;
  const layout = maxLayout(9.5, 98, input.lengthCm, input.widthCm, 0.1);
  const itemsPerMeter = layout.items;
  const meters = input.quantity / itemsPerMeter;
  const tier = findByLabel(d.quantityFactors, input.quantityTierLabel);

  const materialCost = (meters + d.wasteMeters) * d.materialCostPerMeter;
  const printDieCost = Math.max(input.quantity * d.basePrintUnit, d.minPrintCost) * tier.factor / d.marginDivisor;
  const laminateCost = d.laminateUnit * meters * input.laminate;
  const moldCost = d.moldCost;
  const secondColorFee = input.colorCount === 2 ? d.secondColorFee : 0;
  const total = materialCost + printDieCost + laminateCost + moldCost + secondColorFee;
  const unitPrice = total / input.quantity;

  return {
    productType: 'void',
    quantity: input.quantity,
    total,
    unitPrice,
    breakdown: { layout, itemsPerMeter, meters, tierFactor: tier.factor, materialCost, printDieCost, laminateCost, moldCost, secondColorFee },
  };
}

export interface MicaInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  materialUnitPrice: number;
  colorCount: number;
  sideCount: 1 | 2;
  cut?: boolean;
  drillOrCorner?: boolean;
}

export function calculateMica(input: MicaInput) {
  const d = EXTRA_PRICING_DATA_V2.mica;
  const layout = maxLayout(d.sheetWidthCm, d.sheetHeightCm, input.lengthCm, input.widthCm, 0);
  const itemsPerSheet = layout.items;
  const sheets = Math.ceil(input.quantity / itemsPerSheet);

  const rawMaterial = (d.wasteSheets + sheets) * input.materialUnitPrice * d.rawPaperWidthCm * d.rawPaperHeightCm;
  const materialCost = ceilTo(rawMaterial, 1000);
  const printCost = input.colorCount * d.printPerColorPerSide * input.sideCount;
  const cutCost = input.cut ? Math.max(input.quantity / (itemsPerSheet * d.cutBatchQty) * d.cutBatchFee, d.cutMin) : 0;
  const processingCost = input.drillOrCorner ? (input.quantity * 10 > d.processingMin ? input.quantity * 20 : d.processingMin) : 0;
  const totalCost = materialCost + printCost + cutCost + processingCost;
  const unitPrice = totalCost / (input.quantity * d.marginDivisor);

  return {
    productType: 'mica',
    quantity: input.quantity,
    total: totalCost,
    unitPrice,
    breakdown: { layout, itemsPerSheet, sheets, wasteSheets: d.wasteSheets, materialCost, printCost, cutCost, processingCost },
  };
}

export interface MacDaInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  quantityTierLabel: string;
}

export function calculateMacDa(input: MacDaInput) {
  const d = EXTRA_PRICING_DATA_V2.macDa;
  const tier = findByLabel(d.quantityFactors, input.quantityTierLabel);
  const area = input.lengthCm * input.widthCm;
  const moldCost = input.quantity < d.moldMinQty ? d.moldCost : 0;
  const baseUnit = area > d.largeAreaThreshold
    ? area * d.largeAreaUnit + moldCost / input.quantity
    : d.smallAreaBase + d.smallMoldShare * moldCost / input.quantity;
  const unitPrice = baseUnit / tier.factor;
  const total = unitPrice * input.quantity;

  return { productType: 'mac_da', quantity: input.quantity, total, unitPrice, breakdown: { area, moldCost, tierFactor: tier.factor, baseUnit } };
}

export interface TemNhietInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  colorCount: number;
  sizeSplitCount?: number;
}

export function calculateTemNhiet(input: TemNhietInput) {
  const layout = maxLayout(26, 40, input.lengthCm, input.widthCm, 0);
  const itemsPerSheet = layout.items;
  const sheetsForDisplay = input.quantity / itemsPerSheet + 20;
  const sheetsForFilm = Math.ceil(input.quantity / itemsPerSheet) + 20;
  const filmCost = (sheetsForFilm > 500 ? sheetsForFilm * 10000 : sheetsForFilm * 12000) / 0.55;
  const plateCost = input.colorCount > 2 ? 2 * 200000 + (input.colorCount - 2) * 350000 : input.colorCount * 200000;
  const processingCost = input.quantity > 1000 ? input.quantity * 25 : input.quantity * 50;
  const total = filmCost + plateCost + processingCost;
  const unitPrice = ceilTo(total / input.quantity, 10) + (input.sizeSplitCount ?? 0) * 10;

  return { productType: 'tem_nhiet', quantity: input.quantity, total, unitPrice, breakdown: { layout, itemsPerSheet, sheetsForDisplay, sheetsForFilm, filmCost, plateCost, processingCost } };
}

export interface TemPetInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  cut?: boolean;
}

export function calculateTemPet(input: TemPetInput) {
  const d = EXTRA_PRICING_DATA_V2.temPet;
  const layout = maxLayout(57.5, 90, input.lengthCm, input.widthCm, 0.2);
  const itemsPerMeter = layout.items;
  const meters = input.quantity / itemsPerMeter;
  const tier = findMeterTier(d.meterTiers, meters);
  const rollTotal = meters * tier.rollPricePerMeter;
  const rollUnitPrice = rollTotal / input.quantity;
  const cutUnitPrice = rollUnitPrice + (input.cut ? d.cutUnitExtra : 0);
  const cutTotal = cutUnitPrice * input.quantity;

  return {
    productType: 'tem_pet',
    quantity: input.quantity,
    total: input.cut ? cutTotal : rollTotal,
    unitPrice: input.cut ? cutUnitPrice : rollUnitPrice,
    breakdown: { layout, itemsPerMeter, meters, meterTier: tier, rollTotal, rollUnitPrice, cutUnitExtra: input.cut ? d.cutUnitExtra : 0, cutTotal },
  };
}

export interface TemUvInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  tierLabel: string;
}

export function calculateTemUv(input: TemUvInput) {
  const d = EXTRA_PRICING_DATA_V2.temUv;
  const layout = maxLayout(27, 95, input.lengthCm, input.widthCm, 0.15);
  const itemsPerMeter = layout.items / 1.02;
  const metersOrSheets = input.quantity / itemsPerMeter * 5;
  const tier = findByLabel(d.tiers, input.tierLabel);
  const total = tier.price * metersOrSheets;
  const unitPrice = total / input.quantity;

  return { productType: 'tem_uv', quantity: input.quantity, total, unitPrice, breakdown: { layout, itemsPerMeter, metersOrSheets, tierPrice: tier.price } };
}

export interface TemCaoThanhInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  cut?: boolean;
}

export function calculateTemCaoThanh1Mau(input: TemCaoThanhInput) {
  const layout = maxLayout(55, 95, input.lengthCm, input.widthCm, 0.2);
  const itemsPerMeter = layout.items;
  const meters = input.quantity / itemsPerMeter;
  const rollUnitPrice = meters <= 10 ? 260000 * meters / input.quantity : 260000 * 0.8 * meters / input.quantity;
  const cutUnitPrice = meters <= 10 ? 160000 * meters / input.quantity + 100 : 150000 * meters / input.quantity + 100;
  const unitPrice = input.cut ? cutUnitPrice : rollUnitPrice;
  const total = unitPrice * input.quantity;

  return { productType: 'tem_cao_thanh_1_mau', quantity: input.quantity, total, unitPrice, breakdown: { layout, itemsPerMeter, meters, rollUnitPrice, cutUnitPrice } };
}

export type DayLogoType = 'du' | 'sap' | 'ruy_bang';

export interface DayLogoInput {
  quantity: number;
  strapType: DayLogoType;
  logoTwoSides?: boolean;
}

export function calculateDayLogo(input: DayLogoInput) {
  const d = EXTRA_PRICING_DATA_V2.dayLogo;
  let tierIndex = -1;
  for (let i = 0; i < d.tiers.length; i++) {
    if (input.quantity >= d.tiers[i]) tierIndex = i;
  }
  if (tierIndex < 0) throw new Error('Số lượng chưa đạt MOQ của dây logo. MOQ thấp nhất là 5.000.');

  const basePrice = d.prices[input.strapType][tierIndex];
  if (basePrice == null) throw new Error('Loại dây này không làm ở mốc số lượng đã chọn.');

  const tierQty = d.tiers[tierIndex];
  const unitPrice = basePrice + (input.logoTwoSides ? d.twoSideExtra : 0);
  const billQty = tierQty; // quan trọng: khớp Excel, không lấy quantity thực tế
  const total = ceilTo(unitPrice * billQty, 1000);
  const actualTotalForReference = ceilTo(unitPrice * input.quantity, 1000);

  return {
    productType: 'day_logo',
    strapType: input.strapType,
    quantity: input.quantity,
    total,
    unitPrice,
    breakdown: { tierQty, billQty, basePrice, twoSideExtra: input.logoTwoSides ? d.twoSideExtra : 0, actualTotalForReference },
  };
}
