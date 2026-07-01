import { maxLayout, findMeterTier } from './shared';
import { EXTRA_PRICING_DATA } from './data';

export interface TemPetInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  cutSeparately: boolean;
}

export function calculateTemPet(input: TemPetInput) {
  const d = EXTRA_PRICING_DATA.temPet;
  const layout = maxLayout(57.5, 90, input.lengthCm, input.widthCm, 0.2);
  const itemsPerMeter = layout.items;
  const meters = input.quantity / itemsPerMeter;
  const meterTier = findMeterTier(d.meterTiers, meters);
  
  const rollTotal = meters * meterTier.rollPricePerMeter;
  const rollUnitPrice = rollTotal / input.quantity;

  let unitPrice = rollUnitPrice;
  let cutTotal = 0;
  
  if (input.cutSeparately) {
    unitPrice += d.cutUnitExtra;
    cutTotal = input.quantity * d.cutUnitExtra;
  }

  const total = unitPrice * input.quantity;

  return {
    productType: 'tem_pet',
    quantity: input.quantity,
    total,
    unitPrice,
    sellTotal: total,
    sellUnit: unitPrice,
    breakdown: { layout, itemsPerMeter, meters, rollPricePerMeter: meterTier.rollPricePerMeter, rollTotal, cutTotal },
  };
}
