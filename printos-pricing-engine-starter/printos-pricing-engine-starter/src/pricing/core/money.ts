import type { QuoteAlternative } from '../types';

export function chooseCheapest<T extends { sellUnit: number }>(options: T[]): T {
  if (!options.length) throw new Error('Không có phương án tính giá hợp lệ');
  return [...options].sort((a, b) => a.sellUnit - b.sellUnit)[0];
}

export function finalizeAlternative(input: Omit<QuoteAlternative, 'costUnit' | 'sellTotal'> & { quantity: number }): QuoteAlternative {
  return {
    method: input.method,
    costTotal: input.costTotal,
    costUnit: input.costTotal / input.quantity,
    sellUnit: input.sellUnit,
    sellTotal: input.sellUnit * input.quantity,
    breakdown: input.breakdown,
  };
}
