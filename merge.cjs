const fs = require('fs');

const orig = fs.readFileSync('src/pricing/modules/offset-card.ts', 'utf-8');
const patch = fs.readFileSync('printos-pricing-engine-starter/printos-pricing-engine-starter/GPT/offset-card-excel-sync.patch.ts', 'utf-8');

// The patch file has lines prepended with numbers like "1: ". We need to clean that up.
const cleanPatch = patch.split('\n').map(line => line.replace(/^\d+:\s?/, '')).join('\n');

const layoutStart = orig.indexOf('function layoutForFormat(');
if (layoutStart === -1) { console.log('layoutForFormat not found'); process.exit(1); }

const layoutEnd = orig.indexOf('export function _calculateOffsetCard(');
if (layoutEnd === -1) { console.log('_calculateOffsetCard not found'); process.exit(1); }

let layoutLogic = orig.substring(layoutStart, layoutEnd);

layoutLogic = layoutLogic.replace(
    'const paperCostEstimate = fullCostEstimate(totalSheets, format, material, input);',
    `const paperCostEstimate = calculateOffsetCardCostBlock({
    input,
    material,
    paperWidthCm: format.widthMm / 10,
    paperHeightCm: format.heightMm / 10,
    paperSheetsBase: sheetsBase,
    wasteSheets
  }).totalCost;`
);

const calcLogic = `
export function _calculateOffsetCard(input: OffsetCardInput, ctx?: any) {
  const material = getMaterial(ctx, input.materialCode);
  const format = findBestOffsetCardFormat(input, material);
  const sides = sideMultiplier(input.printMode);

  const paperSheetsBase = Math.ceil(input.quantity / format.itemsPerSide);
  const wasteSheets = input.wasteSheetsOverride ?? format.wasteSheets;
  const paperWidthCm = input.paperWidthCmOverride ?? format.paperWidthCmForCost;
  const paperHeightCm = input.paperHeightCmOverride ?? format.paperHeightCmForCost;

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
    breakdown: {
      format,
      quantity: input.quantity,
      material,
      sides,
      ...costBlock
    }
  };
}

export function calculateOffsetCard(input: OffsetCardInput, ctx: any): import('../types').QuoteResult {
  const result = _calculateOffsetCard(input, ctx) as any;
  return {
    productType: 'offset_card',
    selectedMethod: 'offset_card',
    costTotal: result.breakdown.totalCost,
    costUnit: result.breakdown.factoryUnitPrice,
    sellTotal: result.breakdown.sellingTotal,
    sellUnit: result.breakdown.sellingUnitPrice,
    marginRate: (result.breakdown.sellingTotal - result.breakdown.totalCost) / result.breakdown.sellingTotal,
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
  diecut: 'half_mold',
  uv: 'none',
  foil: 'none',
  wasteSheetsOverride: 70,
}, { materials: [{ name: 'ốp 250', gsm: 250, basePrice: 28 }] });
`;

const helpersStart = orig.indexOf('function getMaterial(');
const helpersEnd = orig.indexOf('function fullCostEstimate(');

const helpersLogic = orig.substring(helpersStart, helpersEnd);

const finalCode = cleanPatch + '\n' + helpersLogic + '\n' + layoutLogic + '\n' + calcLogic;

fs.writeFileSync('src/pricing/modules/offset-card.ts', finalCode, 'utf-8');
console.log('Success');
