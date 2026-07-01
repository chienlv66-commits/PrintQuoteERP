import seed from '../../data/seed-from-excel.json' assert { type: 'json' };
import type { PricingContext } from '../pricing/types';

export const pricingContext: PricingContext = {
  materials: seed.materials,
  quantityTiers: seed.quantityTiers,
  processPrices: {},
};
