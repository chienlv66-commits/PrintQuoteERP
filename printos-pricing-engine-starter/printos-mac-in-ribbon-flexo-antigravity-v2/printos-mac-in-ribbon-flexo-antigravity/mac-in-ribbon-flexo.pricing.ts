/**
 * PrintOS Pricing Engine - Mác in: Riboon + In Flexo
 * Source Excel: "1.Bảng tính Mác in 12-12-24.xlsx"
 *
 * Mục tiêu:
 * - Bám công thức sheet Riboon và In Flexo.
 * - Tách dữ liệu bảng giá sang object/JSON để sau này nhập database.
 * - Trả breakdown chi tiết để admin/sale đối chiếu với Excel.
 *
 * Lưu ý:
 * - Excel đang dùng nhiều ô chọn thủ công: khoảng số lượng, phí khác, ra phim, số mã/bài in...
 * - Code có auto-tier theo qty, nhưng vẫn cho override tierLabel để khớp Excel 100%.
 */

export type PrintColorLabel =
  | '1 màu: 1 mặt'
  | '2 màu: 2 màu mặt trước'
  | '2 màu: 1 mặt trước + 1 mặt sau'
  | '3 màu: 3 màu mặt trước'
  | '3 màu: 2 màu mặt trước + 1 màu mặt sau'
  | '4 màu: 3 màu mặt trước + 1 màu mặt sau';

export type FlexoGroup = 'ST' | 'CT' | 'VG';
export type MaterialGroup = 'satin' | 'cotton' | 'vai_giay';

export interface RibbonInput {
  widthCm: number;             // B6
  lengthMm: number;            // C6: dài mác, đơn vị mm, bao gồm dư may. Excel ghi "(m)" nhưng công thức dùng /1000.
  quantity: number;            // H3
  materialCode: string;        // D6
  inkColor: 'Đen' | 'Trắng';   // E6
  printFeeOverride?: number;   // M6 nếu cần ép thủ công, mặc định max(qty*100,30000)
  cutFlag: 0 | 1;              // M3: nguyên cuộn = 0, cắt thành phẩm = 1
  solidBackgroundFlag?: 0 | 1; // N3: Excel hiện chưa dùng trong công thức Riboon, vẫn giữ để UI đồng bộ.
  otherCost?: number;          // J6 "Khác", mặc định 30000 theo file mẫu
  extraCost?: number;          // K6, nếu có chi phí khác bổ sung
  tierLabel?: string;          // J3, nếu bỏ trống sẽ auto theo quantity
}

export interface FlexoInput {
  widthCm: number;             // B6/B7/B8
  lengthMm: number;            // C6/C7/C8
  quantity: number;            // G3
  materialCode: string;        // D6/D7/D8
  materialGroup: MaterialGroup;// để chọn logic row Giấy dai/Satin/Coton
  printColor: PrintColorLabel; // K6/K7/K8
  codeCount: number;           // K3: số mã trên 1 bài in
  cutFlag: 0 | 1;              // L3: nguyên cuộn = 0, cắt TP = 1
  solidBackgroundFlag: 0 | 1;  // M3: không nền bệt = 0, có nền bệt = 1
  filmCost?: number;           // I6/I7/I8 Ra fim, mặc định 25000
  tierLabel?: string;          // I3, nếu bỏ trống sẽ auto theo quantity
}

export interface QuoteBreakdown {
  [key: string]: number | string | boolean | null | undefined;
}

export interface QuoteResult {
  productType: 'ribbon' | 'flexo';
  totalCost: number;
  unitPrice: number;           // giá/cái, tương ứng Q6 hoặc P6
  rollPrice?: number;          // riêng Flexo: O6 = P6 * F6
  meterPrice?: number;         // riêng Ribbon: P6 = O6/G6
  breakdown: QuoteBreakdown;
}

export const MAC_IN_DATA = {
  inkPrices: {
    'Đen': 700.8,
    'Trắng': 1284.8,
  },

  printColors: {
    '1 màu: 1 mặt': {
      printFee: 45000,
      colorCount: 1,
      plateFactor: 3.006253006253006,
      inkFactor: 0.011194029850746268,
    },
    '2 màu: 2 màu mặt trước': {
      printFee: 65000,
      colorCount: 2,
      plateFactor: 6.012506012506012,
      inkFactor: 0.022388059701492536,
    },
    '2 màu: 1 mặt trước + 1 mặt sau': {
      printFee: 65000,
      colorCount: 2,
      plateFactor: 6.012506012506012,
      inkFactor: 0.022388059701492536,
    },
    '3 màu: 3 màu mặt trước': {
      printFee: 65000,
      colorCount: 3,
      plateFactor: 9.018759018759019,
      inkFactor: 0.033582089552238806,
    },
    '3 màu: 2 màu mặt trước + 1 màu mặt sau': {
      printFee: 65000,
      colorCount: 3,
      plateFactor: 9.018759018759019,
      inkFactor: 0.033582089552238806,
    },
    '4 màu: 3 màu mặt trước + 1 màu mặt sau': {
      printFee: 80000,
      colorCount: 4,
      plateFactor: 12.025012025012025,
      inkFactor: 0.04477611940298507,
    },
  },

  flexoMaterialWidthsCm: [1, 1.3, 1.6, 1.9, 2, 2.5, 3, 3.2, 3.5, 3.8, 4, 4.5, 5, 6.4, 7.5, 10],

  flexoMaterialRollPrices: {
    'CB480 (Trắng)': [52000, 68000, 83000, 98800, 104000, 130000, 156000, 166400, 182000, 197600, 208000, 234000, 265000, null, null, null],
    'CH480 (Trắng ngà)': [52000, 68000, 83000, 98800, 104000, 130000, 156000, 166400, 182000, 197600, 208000, 234000, 265000, null, null, null],
    'CM019 (Vàng kem)': [52000, 68000, 83000, 98800, 104000, 130000, 156000, 166400, 182000, 197600, 208000, 234000, 265000, null, null, null],
    'PS009 (Trắng)': [35000, 46000, 55600, 66100, 69600, 87000, 104400, 111300, 121800, 132200, 139200, 156600, null, null, null, null],
    'PS009 Black(đen)': [38000, 50000, 60800, 72200, 76000, 95000, 114000, 121600, 133000, 144400, 152000, 171000, null, null, null, null],
    'A01 (Vàng)': [48000, 63000, 76800, 91200, 96000, 120000, 144000, 153600, 168000, 182400, 192000, 216000, null, null, null, null],
    'A02 (Kem)': [48000, 63000, 76800, 91200, 96000, 120000, 144000, 153600, 168000, 182400, 192000, 216000, null, null, null, null],
    'PS010 (Trắng)': [38000, 49000, 60100, 71400, 75200, 94000, 112800, 120300, 131600, 142800, 150400, 169200, null, null, null, null],
    'PS010 (Đen)': [46000, 59000, 72300, 85800, 90400, 113000, 135600, 144600, 158200, 171700, 180800, 203400, null, null, null, null],
    'PS001 Không biên bóng 1 mặt': [18000, 23000, 27900, 33100, 34800, 43500, 52200, 55700, 60900, 66200, 69600, 78300, 87000, null, null, null],
    'PS008 không biên bóng 2 mặt': [32000, 42000, 50600, 60100, 63200, 79000, 94800, 101200, 110600, 120100, 126400, 142200, 158000, null, null, null],
    'NT002': [12000, 15000, 18600, 22000, 23200, 29000, 34800, 37200, 40600, 44100, 46400, 52200, 58000, 74300, 87000, 116000],
    'NT003': [16000, 20000, 24400, 28900, 30400, 38000, 45600, 48700, 53200, 57800, 60800, 68400, 76000, 97300, 114000, 152000],
    'NT004': [34000, 44000, 53200, 63100, 66400, 83000, 99600, 106300, 116200, 126200, 132800, 149400, 166000, 212500, 249000, 332000],
  },

  ribbonMaterialWidthsCm: [1, 1.6, 2],

  ribbonMaterialRollPrices: {
    'Ribbon': [96000, 108000, 120000],
    'PS009 (Trắng)': [35000, 55600, 69600],
    'PS009 Black(đen)': [38000, 60800, 76000],
    'A01 (Vàng)': [48000, 76800, 96000],
    'A02 (Kem)': [48000, 76800, 96000],
    'PS010 (Trắng)': [38000, 60100, 75200],
    'PS010 (Đen)': [46000, 72300, 90400],
    'PS001 Không biên bóng 1 mặt': [18000, 27900, 34800],
    'PS008 không biên bóng 2 mặt': [32000, 50600, 63200],
    'NT002': [12000, 18600, 23200],
    'NT003': [16000, 24400, 30400],
    'NT004': [34000, 53200, 66400],
  },

  flexoQuantityCoefficients: [
    { label: 'G3<=3.000', min: 0, max: 3000, ST: 0.51, CT: 0.468, VG: 0.55 },
    { label: '3.000<G3<=5.000', min: 3000, max: 5000, ST: 0.495, CT: 0.46, VG: 0.55 },
    { label: '5.000<G3<=10.000', min: 5000, max: 10000, ST: 0.475, CT: 0.42, VG: 0.55 },
    { label: '10.000<G3<=20.000', min: 10000, max: 20000, ST: 0.42, CT: 0.38, VG: 0.52 },
    { label: '20.000<G3<=50.000', min: 20000, max: 50000, ST: 0.35, CT: 0.32, VG: 0.52 },
    { label: '50.000<G3<=100.000', min: 50000, max: 100000, ST: 0.3, CT: 0.28, VG: 0.5 },
    { label: '100.000<G3<=200.000', min: 100000, max: 200000, ST: 0.25, CT: 0.25, VG: 0.45 },
    { label: '200.000<G3<=500.000', min: 200000, max: 500000, ST: 0.22, CT: 0.2, VG: 0.4 },
  ],

  ribbonQuantityCoefficients: [
    { label: 'G3<=100', min: 0, max: 100, coef: 0.55 },
    { label: '100<G3<=500', min: 100, max: 500, coef: 0.5 },
    { label: '500<G3<=1.000', min: 500, max: 1000, coef: 0.45 },
    { label: '1.000<G3<=2.000', min: 1000, max: 2000, coef: 0.4 },
    { label: '2.000<G3<=5.000', min: 2000, max: 5000, coef: 0.38 },
    { label: '5.000<G3<=10.000', min: 5000, max: 10000, coef: 0.35 },
    { label: '10.000<G3<=20.000', min: 10000, max: 20000, coef: 0.32 },
    { label: '20.000<G3<=50.000', min: 20000, max: 50000, coef: 0.3 },
  ],
} as const;

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} phải là số > 0`);
  }
}

function findExactWidthIndex(widths: readonly number[], widthCm: number): number {
  const index = widths.findIndex((w) => Math.abs(w - widthCm) < 0.000001);
  if (index < 0) {
    throw new Error(`Không tìm thấy khổ rộng ${widthCm}cm trong bảng giá. Cần chọn đúng khổ có trong Excel.`);
  }
  return index;
}

function findRollPrice(
  table: Record<string, readonly (number | null)[]>,
  widths: readonly number[],
  materialCode: string,
  widthCm: number,
): number {
  const row = table[materialCode];
  if (!row) throw new Error(`Không tìm thấy mã nguyên liệu: ${materialCode}`);
  const index = findExactWidthIndex(widths, widthCm);
  const price = row[index];
  if (price === null || price === undefined) {
    throw new Error(`Mã ${materialCode} chưa có giá cho khổ ${widthCm}cm`);
  }
  return price;
}

function findFlexoTierByQtyOrLabel(quantity: number, tierLabel?: string) {
  if (tierLabel) {
    const tier = MAC_IN_DATA.flexoQuantityCoefficients.find((x) => x.label === tierLabel);
    if (!tier) throw new Error(`Không tìm thấy mốc số lượng Flexo: ${tierLabel}`);
    return tier;
  }
  return MAC_IN_DATA.flexoQuantityCoefficients.find((x) => quantity > x.min && quantity <= x.max)
    ?? MAC_IN_DATA.flexoQuantityCoefficients[MAC_IN_DATA.flexoQuantityCoefficients.length - 1];
}

function findRibbonTierByQtyOrLabel(quantity: number, tierLabel?: string) {
  if (tierLabel) {
    const tier = MAC_IN_DATA.ribbonQuantityCoefficients.find((x) => x.label === tierLabel);
    if (!tier) throw new Error(`Không tìm thấy mốc số lượng Riboon: ${tierLabel}`);
    return tier;
  }
  return MAC_IN_DATA.ribbonQuantityCoefficients.find((x) => quantity > x.min && quantity <= x.max)
    ?? MAC_IN_DATA.ribbonQuantityCoefficients[MAC_IN_DATA.ribbonQuantityCoefficients.length - 1];
}

function flexoCoefficientGroup(group: MaterialGroup): FlexoGroup {
  if (group === 'satin') return 'ST';
  if (group === 'cotton') return 'CT';
  return 'VG';
}

function flexoRollLengthMeter(group: MaterialGroup): number {
  // Excel: Giấy dai/Satin dùng 190m; Cotton dùng 95m.
  return group === 'cotton' ? 95 : 190;
}

function flexoMarginBase(group: MaterialGroup): number {
  // Excel: Cotton row N8 chia 0.71, các row khác chia 0.65.
  return group === 'cotton' ? 0.71 : 0.65;
}

/**
 * Sheet Riboon - row 6.
 *
 * Công thức Excel chính:
 * F6 = INDEX('Công in'!B38:E50, MATCH(D6,...), MATCH(B6,...))
 * G6 = H3*C6/1000
 * H6 = H3*F6/(190/(C6/1000))*1.2
 * I6 = H3*C6/1000*VLOOKUP(E6,'Công in'!G1:H2,2,0)
 * M6 = IF(H3*100>=30000,H3*100,30000)
 * N6 = IF(H3*30>=50000,H3*30,50000)*M3
 * O6 = (N6+M6+H6+J6+K6+I6)/(1-VLOOKUP(J3,'Công in'!G29:H36,2,0))
 * P6 = O6/G6
 * Q6 = O6/H3
 */
export function calculateRibbon(input: RibbonInput): QuoteResult {
  assertPositive('widthCm', input.widthCm);
  assertPositive('lengthMm', input.lengthMm);
  assertPositive('quantity', input.quantity);

  const rollPrice = findRollPrice(
    MAC_IN_DATA.ribbonMaterialRollPrices,
    MAC_IN_DATA.ribbonMaterialWidthsCm,
    input.materialCode,
    input.widthCm,
  );

  const meters = input.quantity * input.lengthMm / 1000; // G6
  const tagsPerRoll = 190 / (input.lengthMm / 1000);
  const materialCost = input.quantity * rollPrice / tagsPerRoll * 1.2; // H6

  const inkUnit = MAC_IN_DATA.inkPrices[input.inkColor];
  if (inkUnit === undefined) throw new Error(`Không tìm thấy màu mực: ${input.inkColor}`);
  const inkCost = meters * inkUnit; // I6

  const printFee = input.printFeeOverride ?? Math.max(input.quantity * 100, 30000); // M6
  const cutCost = Math.max(input.quantity * 30, 50000) * input.cutFlag; // N6
  const otherCost = input.otherCost ?? 30000; // J6
  const extraCost = input.extraCost ?? 0; // K6

  const tier = findRibbonTierByQtyOrLabel(input.quantity, input.tierLabel);
  const coefficient = tier.coef;

  const totalCost = (cutCost + printFee + materialCost + otherCost + extraCost + inkCost) / (1 - coefficient);
  const meterPrice = totalCost / meters;
  const unitPrice = totalCost / input.quantity;

  return {
    productType: 'ribbon',
    totalCost,
    unitPrice,
    meterPrice,
    breakdown: {
      excelRow: 'Riboon!6',
      tierLabel: tier.label,
      coefficient,
      rollPrice,
      meters,
      tagsPerRoll,
      materialCost,
      inkUnit,
      inkCost,
      printFee,
      cutFlag: input.cutFlag,
      cutCost,
      otherCost,
      extraCost,
      solidBackgroundFlagIgnoredLikeExcel: input.solidBackgroundFlag ?? 0,
      formula: '(cutCost + printFee + materialCost + otherCost + extraCost + inkCost) / (1 - coefficient)',
    },
  };
}

/**
 * Sheet In Flexo - rows 6/7/8.
 *
 * Công thức Excel chính:
 * E = tra giá nguyên liệu theo mã + rộng
 * F = rollLength / (lengthMm/1000)  ; rollLength = 190, riêng Cotton = 95
 * G = qty*E/F*1.2
 * H = nếu không nền bệt: inkFactor*lengthMm*10*qty/15, nếu nền bệt: inkFactor*lengthMm*10*qty
 * J = nếu codeCount>=1: plateFactor*widthCm*lengthMm*10*5*codeCount, ngược lại plateFactor*widthCm*lengthMm*4
 * L = tiền in theo printFee*G/E, có hệ số riêng theo qty và nhóm
 * M = nếu qty>=10000: qty*22*cutFlag, ngược lại qty*25*cutFlag
 * N = (M+L+G+I+J+H)/(marginBase*(1-coefficient))
 * O = P*F
 * P = N/qty
 */
export function calculateFlexo(input: FlexoInput): QuoteResult {
  assertPositive('widthCm', input.widthCm);
  assertPositive('lengthMm', input.lengthMm);
  assertPositive('quantity', input.quantity);

  const rollPrice = findRollPrice(
    MAC_IN_DATA.flexoMaterialRollPrices,
    MAC_IN_DATA.flexoMaterialWidthsCm,
    input.materialCode,
    input.widthCm,
  );

  const color = MAC_IN_DATA.printColors[input.printColor];
  if (!color) throw new Error(`Không tìm thấy màu/cấu hình in: ${input.printColor}`);

  const rollLengthM = flexoRollLengthMeter(input.materialGroup);
  const tagsPerRoll = rollLengthM / (input.lengthMm / 1000); // F
  const materialCost = input.quantity * rollPrice / tagsPerRoll * 1.2; // G

  const inkCost = input.solidBackgroundFlag === 0
    ? color.inkFactor * input.lengthMm * 10 * input.quantity / 15
    : color.inkFactor * input.lengthMm * 10 * input.quantity;

  const filmCost = input.filmCost ?? 25000;

  const plateCost = input.codeCount >= 1
    ? color.plateFactor * input.widthCm * input.lengthMm * 10 * 5 * input.codeCount
    : color.plateFactor * input.widthCm * input.lengthMm * 4;

  let printCost = color.printFee * materialCost / rollPrice;

  if (input.materialGroup === 'cotton') {
    // Excel L8: >=5000 thì *0.65, <5000 không nhân thêm.
    printCost = input.quantity >= 5000 ? printCost * 0.65 : printCost;
  } else {
    // Excel L6/L7: <5000 thì *1.2, >=5000 giữ nguyên.
    printCost = input.quantity >= 5000 ? printCost : printCost * 1.2;
  }

  const cutCost = (input.quantity >= 10000 ? input.quantity * 22 : input.quantity * 25) * input.cutFlag;

  const tier = findFlexoTierByQtyOrLabel(input.quantity, input.tierLabel);
  const coeffGroup = flexoCoefficientGroup(input.materialGroup);
  const coefficient = tier[coeffGroup];
  const marginBase = flexoMarginBase(input.materialGroup);

  const totalCost = (cutCost + printCost + materialCost + filmCost + plateCost + inkCost)
    / (marginBase * (1 - coefficient));

  const unitPrice = totalCost / input.quantity;
  const rollQuotePrice = unitPrice * tagsPerRoll;

  return {
    productType: 'flexo',
    totalCost,
    unitPrice,
    rollPrice: rollQuotePrice,
    breakdown: {
      excelRow: input.materialGroup === 'vai_giay' ? 'In Flexo!6' : input.materialGroup === 'satin' ? 'In Flexo!7' : 'In Flexo!8',
      tierLabel: tier.label,
      coeffGroup,
      coefficient,
      marginBase,
      rollLengthM,
      rollPrice,
      tagsPerRoll,
      materialCost,
      printColor: input.printColor,
      printFee: color.printFee,
      inkFactor: color.inkFactor,
      inkCost,
      filmCost,
      plateFactor: color.plateFactor,
      plateCost,
      codeCount: input.codeCount,
      printCost,
      cutFlag: input.cutFlag,
      cutCost,
      formula: '(cutCost + printCost + materialCost + filmCost + plateCost + inkCost) / (marginBase * (1 - coefficient))',
    },
  };
}

/**
 * API helper gợi ý:
 * POST /api/quotes/calculate
 * body: { productType: "ribbon" | "flexo", ...input }
 */
export function calculateMacInQuote(input: ({ productType: 'ribbon' } & RibbonInput) | ({ productType: 'flexo' } & FlexoInput)): QuoteResult {
  if (input.productType === 'ribbon') return calculateRibbon(input);
  return calculateFlexo(input);
}

/**
 * Test nhanh theo dữ liệu mẫu trong Excel:
 *
 * calculateRibbon({
 *   productType: 'ribbon',
 *   widthCm: 1.6,
 *   lengthMm: 53,
 *   quantity: 500,
 *   materialCode: 'PS009 (Trắng)',
 *   inkColor: 'Đen',
 *   cutFlag: 1,
 *   solidBackgroundFlag: 0,
 *   otherCost: 30000,
 *   tierLabel: 'G3<=100',
 * })
 *
 * Kết quả mục tiêu gần Excel: tổng khoảng 350837.52, mét khoảng 26.5, đơn giá/cái khoảng 701.675.
 */
