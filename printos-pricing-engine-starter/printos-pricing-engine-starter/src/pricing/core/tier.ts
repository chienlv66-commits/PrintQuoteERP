import type { QuantityTier } from '../types';

export function parseTierLabel(label: string): { min?: number; max?: number } {
  const clean = label.replace(/\./g, '').replace(/,/g, '').replace(/k/gi, '000').replace(/\s+/g, '');
  if (clean.startsWith('<=')) return { max: Number(clean.slice(2)) };
  if (clean.startsWith('<')) return { max: Number(clean.slice(1)) - 1 };
  if (clean.startsWith('>=')) return { min: Number(clean.slice(2)) };
  if (clean.startsWith('>')) return { min: Number(clean.slice(1)) + 1 };
  const range = clean.match(/^(\d+)-(\d+)$/);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const nums = clean.match(/\d+/g);
  if (nums?.length === 2) return { min: Number(nums[0]), max: Number(nums[1]) };
  if (nums?.length === 1) return { min: Number(nums[0]), max: Number(nums[0]) };
  return {};
}

export function findTier(tiers: QuantityTier[], module: string, quantity: number, explicitLabel?: string): QuantityTier {
  const moduleTiers = tiers.filter(t => t.module === module);
  if (explicitLabel) {
    const found = moduleTiers.find(t => t.label === explicitLabel);
    if (found) return found;
  }
  const found = moduleTiers.find(t => {
    const min = t.minQty ?? parseTierLabel(t.label).min ?? -Infinity;
    const max = t.maxQty ?? parseTierLabel(t.label).max ?? Infinity;
    return quantity >= min && quantity <= max;
  });
  if (!found) throw new Error(`Không tìm thấy tier ${module} cho số lượng ${quantity}`);
  return found;
}
