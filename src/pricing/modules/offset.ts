import { maxLayout } from '../core/layout';
import { chooseCheapest, finalizeAlternative } from '../core/money';
import { roundUp } from '../core/rounding';
import { findTier } from '../core/tier';
import type { Material, PricingContext, QuoteAlternative, QuoteResult } from '../types';

export interface OffsetInput {
  quantity: number;
  quantityTierLabel?: string;
  widthCm: number;
  heightCm: number;
  materialId: string;
  colorCount: number;
  laminateSideCount?: 0 | 1 | 2;
  cut?: boolean;
  drill?: boolean;
  finishingType?: 'auto' | 'cut' | 'diecut' | 'mount_cut' | 'mount_diecut' | 'foil' | 'emboss' | 'uv_spot';
}

function getMaterial(ctx: PricingContext, materialId: string): Material {
  const m = ctx.materials.find(x => x.id === materialId || x.name === materialId);
  if (!m) throw new Error(`Không tìm thấy vật liệu: ${materialId}`);
  return m;
}

function offsetPrintCost(quantity: number, layout: number): number {
  const printSheets = quantity * 2 / layout;
  return printSheets > 1000 ? 360_000 + 120 * (printSheets - 1000) : 360_000;
}

export function calculateOffset(input: OffsetInput, ctx: PricingContext): QuoteResult {
  if (input.quantity <= 0) throw new Error('Số lượng phải lớn hơn 0');
  const material = getMaterial(ctx, input.materialId);
  const tier = findTier(ctx.quantityTiers, 'offset_margin_factor', input.quantity, input.quantityTierLabel);
  const divisor = 1 - tier.value;

  const sizes = [
    { methodPrefix: 'large', sheetW: 39.5, sheetH: 54.5, layoutW: 37.5, layoutH: 53, moldFee: 500_000, dieRate: 400 },
    { methodPrefix: 'small', sheetW: 32.5, sheetH: 43, layoutW: 31.5, layoutH: 40, moldFee: 600_000, dieRate: 200 },
  ];

  const alternatives: QuoteAlternative[] = [];

  for (const s of sizes) {
    const layout = maxLayout(s.layoutW, s.layoutH, input.widthCm, input.heightCm, 0);
    const itemsPerSheet = layout.itemsPerSheet;
    const sheets = Math.ceil(input.quantity / itemsPerSheet);
    const paperCost = (100 + sheets) * material.unitPriceM2 * s.sheetW * s.sheetH;
    const plateCost = (material.platePrice ?? 60_000) * input.colorCount;
    const printCost = offsetPrintCost(input.quantity, itemsPerSheet);
    const laminationCost = input.laminateSideCount
      ? Math.max(roundUp(0.22 * 1.1 * (sheets + 100) * s.sheetW * s.sheetH, 0) * input.laminateSideCount, 200_000)
      : 0;
    const cuttingCost = input.cut ? Math.max(input.quantity * 10, 50_000) : 0;
    const drillingCost = input.drill ? Math.max(input.quantity * 10, 100_000) : 0;

    const base = {
      ten_vat_tu: material.name,
      kho_giay: `${s.sheetW}x${s.sheetH}`,
      kho_in: `${s.layoutW}x${s.layoutH}`,
      so_tem_tren_to: itemsPerSheet,
      phuong_an_ghep: layout.orientation,
      so_to_in: sheets,
      moc_loi_nhuan: tier.label,
      he_so_loi_nhuan: tier.value,
      he_so_chia: divisor,
      phi_giay: paperCost,
      phi_ban_kem: plateCost,
      phi_in: printCost,
      phi_can_mang: laminationCost,
      phi_xen: cuttingCost,
      phi_khoan: drillingCost,
    };

    const add = (method: string, costTotal: number, extra: Record<string, number | string | boolean | null> = {}) => {
      const sellUnit = costTotal / (input.quantity * divisor);
      alternatives.push(finalizeAlternative({
        method: `${s.methodPrefix}_${method}`,
        quantity: input.quantity,
        costTotal,
        sellUnit,
        breakdown: { ...base, ...extra },
      }));
    };

    add('cut', paperCost + plateCost + printCost + laminationCost + cuttingCost + drillingCost);
    const diecutCost = Math.max((input.quantity / itemsPerSheet) * s.dieRate, 250_000);
    add('diecut', paperCost + plateCost + printCost + laminationCost + s.moldFee + diecutCost + drillingCost, { phi_khuon: s.moldFee, phi_be_khuon: diecutCost });

    const mountingCost = Math.max((input.quantity / itemsPerSheet) * s.sheetW * s.sheetH * 0.2, 200_000);
    add('mount_cut', paperCost * 2 + plateCost + printCost + laminationCost + mountingCost + cuttingCost + drillingCost, { phi_boi: mountingCost });
    add('mount_diecut', paperCost * 2 + plateCost + printCost + laminationCost + mountingCost + s.moldFee + diecutCost + drillingCost, { phi_boi: mountingCost, phi_khuon: s.moldFee, phi_be_khuon: diecutCost });

    const foilUnit = input.quantity > 20_000 ? (700_000 + input.quantity * 42) / input.quantity : (700_000 + input.quantity * 65) / input.quantity;
    add('foil', paperCost + plateCost + printCost + laminationCost + cuttingCost + drillingCost + foilUnit * input.quantity, { don_gia_ep_kim: foilUnit });

    const embossUnit = input.quantity / itemsPerSheet * 200 < 250_000
      ? 1_100_000 / input.quantity
      : (1_150_000 + input.quantity / itemsPerSheet * 200) / input.quantity;
    add('emboss', paperCost + plateCost + printCost + laminationCost + cuttingCost + drillingCost + embossUnit * input.quantity, { don_gia_thuc_noi: embossUnit });

    const uvSpotUnit = input.quantity > 13_600 ? 70 : 950_000 / input.quantity;
    add('uv_spot', paperCost + plateCost + printCost + laminationCost + cuttingCost + drillingCost + uvSpotUnit * input.quantity, { don_gia_phu_uv: uvSpotUnit });
  }

  const filtered = input.finishingType && input.finishingType !== 'auto'
    ? alternatives.filter(a => a.method.endsWith(`_${input.finishingType}`))
    : alternatives;
  const selected = chooseCheapest(filtered.length ? filtered : alternatives);

  return {
    productType: 'offset',
    selectedMethod: selected.method,
    costTotal: selected.costTotal,
    costUnit: selected.costUnit,
    sellUnit: selected.sellUnit,
    sellTotal: selected.sellTotal,
    marginRate: tier.value,
    breakdown: selected.breakdown,
    alternatives,
  };
}
