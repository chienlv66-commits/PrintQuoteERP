import { maxLayout } from './shared';
import { EXTRA_PRICING_DATA } from './data';

export interface TemCaoThanh1MauInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  cutSeparately: boolean;
}

export function calculateTemCaoThanh1Mau(input: TemCaoThanh1MauInput) {
  const d = EXTRA_PRICING_DATA.temCaoThanh1Mau;
  const layout = maxLayout(55, 95, input.lengthCm, input.widthCm, 0.2);
  const itemsPerMeter = layout.items;
  const meters = input.quantity / itemsPerMeter;

  let rollUnitPrice: number;
  let cutUnitPrice: number;

  if (meters <= d.lowTierMaxMeters) {
    rollUnitPrice = d.lowTierRollPrice * meters / input.quantity;
    cutUnitPrice = d.lowTierCutPrice * meters / input.quantity + d.cutExtraUnit;
  } else {
    rollUnitPrice = d.lowTierRollPrice * d.highTierRollFactor * meters / input.quantity;
    cutUnitPrice = d.highTierCutPrice * meters / input.quantity + d.cutExtraUnit;
  }

  const unitPrice = input.cutSeparately ? cutUnitPrice : rollUnitPrice;
  const total = unitPrice * input.quantity;

  return {
    productType: 'tem_cao_thanh_1_mau',
    quantity: input.quantity,
    total,
    unitPrice,
    sellTotal: total,
    sellUnit: unitPrice,
    breakdown: {
      phuong_an_ghep: layout,
      so_tem_tren_met: itemsPerMeter,
      so_met_in: meters,
      don_gia_cuon: rollUnitPrice,
      don_gia_cat_roi: cutUnitPrice
    },
  };
}
