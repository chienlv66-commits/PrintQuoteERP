import { maxLayout, findByLabel } from './shared';
import { EXTRA_PRICING_DATA } from './data';

export interface VoidInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  colorCount: 1 | 2;
  quantityTierLabel: string;
  laminate: 0 | 1;
}

export function calculateVoid(input: VoidInput) {
  const d = EXTRA_PRICING_DATA.void;
  const layout = maxLayout(9.5, 98, input.lengthCm, input.widthCm, 0.1);
  const itemsPerMeter = layout.items;
  const meters = input.quantity / itemsPerMeter;
  const tier = findByLabel(d.quantityFactors, input.quantityTierLabel);

  const materialCost = (meters + d.wasteMeters) * d.materialCostPerMeter;
  const printDieCost = Math.max(input.quantity * d.basePrintUnit, d.minPrintCost) * tier.factor / d.marginDivisor;
  const laminateCost = d.laminateUnit * meters * input.laminate;
  const moldCost = d.moldCost;
  const secondColorFee = input.colorCount === 2 ? d.secondColorFee : 0;
  const total = materialCost + printDieCost + laminateCost + moldCost + secondColorFee;
  const unitPrice = total / input.quantity;

  return {
    productType: 'void',
    quantity: input.quantity,
    total,
    unitPrice,
    sellTotal: total,
    sellUnit: unitPrice,
    breakdown: {
      phuong_an_ghep: layout,
      so_tem_tren_met: itemsPerMeter,
      so_met_in: meters,
      he_so_so_luong: tier.factor,
      phi_vat_tu: materialCost,
      phi_in_va_be: printDieCost,
      phi_can_mang: laminateCost,
      phi_khuon: moldCost,
      phu_phi_mau_thu_2: secondColorFee
    },
  };
}
