import { calculateQuote, type CalculateQuoteInput } from './index';
import type { PricingContext } from './types';
import seedData from '../data/seed-from-excel.json';

// Provide the full context containing materials, tiers, processes
const context: PricingContext = {
    materials: seedData.materials,
    quantityTiers: seedData.quantityTiers,
    processPrices: seedData.processPrices,
};

export function runPricingEngine(input: CalculateQuoteInput) {
    return calculateQuote(input, context);
}
