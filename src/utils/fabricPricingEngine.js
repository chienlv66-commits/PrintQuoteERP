import MAC_IN_DATA from '../data/fabricPricingData.json';

function assertPositive(name, value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} phải là số > 0`);
  }
}

function assertNonNegative(name, value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} phải là số >= 0`);
  }
}

function normalizeCodeCount(codeCount) {
  const value = codeCount ?? 1;
  if (!Number.isFinite(value) || value < 1) {
    throw new Error('Số mã trên 1 bài in phải >= 1 theo quy định vận hành hiện tại');
  }
  return Math.floor(value);
}

function findExactWidthIndex(widths, widthCm) {
  const index = widths.findIndex((w) => Math.abs(w - widthCm) < 0.000001);
  if (index < 0) {
    throw new Error(`Không tìm thấy khổ rộng ${widthCm}cm trong bảng giá. Cần chọn đúng khổ có trong báo giá.`);
  }
  return index;
}

function findRollPrice(table, widths, materialCode, widthCm) {
  const row = table[materialCode];
  if (!row) throw new Error(`Không tìm thấy mã nguyên liệu: ${materialCode}`);
  const index = findExactWidthIndex(widths, widthCm);
  const price = row[index];
  if (price === null || price === undefined) {
    throw new Error(`Mã ${materialCode} chưa có giá cho khổ ${widthCm}cm`);
  }
  return price;
}

function findFlexoTierByQtyOrLabel(quantity, tierLabel) {
  if (tierLabel) {
    const tier = MAC_IN_DATA.flexoQuantityCoefficients.find((x) => x.label === tierLabel);
    if (!tier) throw new Error(`Không tìm thấy mốc số lượng Flexo: ${tierLabel}`);
    return tier;
  }
  return MAC_IN_DATA.flexoQuantityCoefficients.find((x) => quantity > x.min && quantity <= x.max)
    ?? MAC_IN_DATA.flexoQuantityCoefficients[MAC_IN_DATA.flexoQuantityCoefficients.length - 1];
}

function findRibbonTierByQtyOrLabel(quantity, tierLabel) {
  if (tierLabel) {
    const tier = MAC_IN_DATA.ribbonQuantityCoefficients.find((x) => x.label === tierLabel);
    if (!tier) throw new Error(`Không tìm thấy mốc số lượng Riboon: ${tierLabel}`);
    return tier;
  }
  return MAC_IN_DATA.ribbonQuantityCoefficients.find((x) => quantity > x.min && quantity <= x.max)
    ?? MAC_IN_DATA.ribbonQuantityCoefficients[MAC_IN_DATA.ribbonQuantityCoefficients.length - 1];
}

function flexoCoefficientGroup(group) {
  if (group === 'satin') return 'ST';
  if (group === 'cotton') return 'CT';
  return 'VG';
}

function flexoRollLengthMeter(group) {
  return group === 'cotton' ? 95 : 190;
}

function flexoMarginBase(group) {
  return group === 'cotton' ? 0.71 : 0.65;
}

export function calculateRibbon(input) {
  assertPositive('widthCm', input.widthCm);
  assertPositive('lengthMm', input.lengthMm);
  assertPositive('quantity', input.quantity);

  const rollPrice = findRollPrice(
    MAC_IN_DATA.ribbonMaterialRollPrices,
    MAC_IN_DATA.ribbonMaterialWidthsCm,
    input.materialCode,
    input.widthCm
  );

  const meters = input.quantity * input.lengthMm / 1000;
  const tagsPerRoll = 190 / (input.lengthMm / 1000);
  const materialCost = input.quantity * rollPrice / tagsPerRoll * 1.2;

  const inkUnit = MAC_IN_DATA.inkPrices[input.inkColor];
  if (inkUnit === undefined) throw new Error(`Không tìm thấy màu mực: ${input.inkColor}`);
  const inkCost = meters * inkUnit;

  const printFee = input.printFeeOverride ?? Math.max(input.quantity * 100, 30000);
  const cutCost = Math.max(input.quantity * 30, 50000) * input.cutFlag;
  const otherCost = input.otherCost ?? 30000;
  const extraCost = input.extraCost ?? 0;
  assertNonNegative('otherCost', otherCost);
  assertNonNegative('extraCost', extraCost);

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
      otherCostDefaultApplied: input.otherCost === undefined,
      extraCost,
      solidBackgroundFlag: input.solidBackgroundFlag ?? 0,
      solidBackgroundFlagIgnoredLikeExcel: true,
      formula: '(cutCost + printFee + materialCost + otherCost + extraCost + inkCost) / (1 - coefficient)',
    },
  };
}

export function calculateFlexo(input) {
  assertPositive('widthCm', input.widthCm);
  assertPositive('lengthMm', input.lengthMm);
  assertPositive('quantity', input.quantity);
  const codeCount = normalizeCodeCount(input.codeCount);
  assertPositive('codeCount', codeCount);

  const rollPrice = findRollPrice(
    MAC_IN_DATA.flexoMaterialRollPrices,
    MAC_IN_DATA.flexoMaterialWidthsCm,
    input.materialCode,
    input.widthCm
  );

  const color = MAC_IN_DATA.printColors[input.printColor];
  if (!color) throw new Error(`Không tìm thấy màu/cấu hình in: ${input.printColor}`);

  const rollLengthM = flexoRollLengthMeter(input.materialGroup);
  const tagsPerRoll = rollLengthM / (input.lengthMm / 1000);
  const materialCost = input.quantity * rollPrice / tagsPerRoll * 1.2;

  const inkCost = input.solidBackgroundFlag === 0
    ? color.inkFactor * input.lengthMm * 10 * input.quantity / 15
    : color.inkFactor * input.lengthMm * 10 * input.quantity;

  const filmCost = input.filmCost ?? 25000;

  const plateCost = color.plateFactor * input.widthCm * input.lengthMm * 10 * 5 * codeCount;

  let printCost = color.printFee * materialCost / rollPrice;

  if (input.materialGroup === 'cotton') {
    printCost = input.quantity >= 5000 ? printCost * 0.65 : printCost;
  } else {
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
      filmCostDefaultApplied: input.filmCost === undefined,
      plateFactor: color.plateFactor,
      plateCost,
      codeCount,
      printCost,
      cutFlag: input.cutFlag,
      cutCost,
      formula: '(cutCost + printCost + materialCost + filmCost + plateCost + inkCost) / (marginBase * (1 - coefficient))',
    },
  };
}

export function calculateMacInQuote(input) {
  if (input.productType === 'ribbon') return calculateRibbon(input);
  return calculateFlexo(input);
}
