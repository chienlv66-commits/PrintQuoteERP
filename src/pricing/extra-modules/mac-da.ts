import { findByLabel } from './shared';
import { EXTRA_PRICING_DATA } from './data';

export interface MacDaInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  quantityTierLabel: string;
}

export function calculateMacDa(input: MacDaInput) {
  const d = EXTRA_PRICING_DATA.macDa;
  const area = input.lengthCm * input.widthCm;
  const moldCost = input.quantity < d.moldMinQty ? d.moldCost : 0;

  let baseUnit: number;
  if (area > d.largeAreaThreshold) {
    baseUnit = area * d.largeAreaUnit + moldCost / input.quantity;
  } else {
    baseUnit = d.smallAreaBase + d.smallMoldShare * moldCost / input.quantity;
  }

  const tier = findByLabel(d.quantityFactors, input.quantityTierLabel);
  const unitPrice = baseUnit / tier.factor;
  const total = unitPrice * input.quantity;

  return {
    productType: 'mac_da',
    quantity: input.quantity,
    total,
    unitPrice,
    sellTotal: total,
    sellUnit: unitPrice,
    breakdown: { area, moldCost, baseUnit, tierFactor: tier.factor },
  };
}
