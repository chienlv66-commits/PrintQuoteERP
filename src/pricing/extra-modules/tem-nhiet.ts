import { maxLayout, ceilTo } from './shared';

export interface TemNhietInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  colorCount: number;
  sizeSplitCount: number;
}

export function calculateTemNhiet(input: TemNhietInput) {
  const layout = maxLayout(26, 40, input.lengthCm, input.widthCm, 0);
  const itemsPerSheet = layout.items;
  const sheetsForFilm = Math.ceil(input.quantity / itemsPerSheet) + 20;

  const filmCost = sheetsForFilm > 500
    ? sheetsForFilm * 10000 / 0.55
    : sheetsForFilm * 12000 / 0.55;

  const plateCost = input.colorCount > 2
    ? 2 * 200000 + (input.colorCount - 2) * 350000
    : input.colorCount * 200000;

  const processingCost = input.quantity > 1000 ? input.quantity * 25 : input.quantity * 50;

  const baseUnit = ceilTo((filmCost + plateCost + processingCost) / input.quantity, 10);
  const unitPrice = baseUnit + input.sizeSplitCount * 10;
  const total = unitPrice * input.quantity;

  return {
    productType: 'tem_nhiet',
    quantity: input.quantity,
    total,
    unitPrice,
    sellTotal: total,
    sellUnit: unitPrice,
    breakdown: { layout, sheetsForFilm, filmCost, plateCost, processingCost, baseUnit },
  };
}
