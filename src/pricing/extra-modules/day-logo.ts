import { ceilTo } from './shared';
import { EXTRA_PRICING_DATA } from './data';

export interface DayLogoInput {
  quantity: number;
  materialType: 'du' | 'sap' | 'ruy_bang';
  twoSides: boolean;
}

export function calculateDayLogo(input: DayLogoInput) {
  const d = EXTRA_PRICING_DATA.dayLogo;
  
  // Find the largest tier that is less than or equal to quantity
  let selectedTierIndex = 0;
  for (let i = 0; i < d.tiers.length; i++) {
    if (d.tiers[i] <= input.quantity) {
      selectedTierIndex = i;
    } else {
      break;
    }
  }

  const billQty = d.tiers[selectedTierIndex];
  const basePrice = d.prices[input.materialType][selectedTierIndex];

  if (basePrice === null) {
    throw new Error(`Không có mốc giá cho loại dây ${input.materialType} số lượng ${billQty}`);
  }

  const unitPrice = basePrice + (input.twoSides ? d.twoSideExtra : 0);
  const total = ceilTo(unitPrice * billQty, 1000);

  // In Excel they use the tier total as the exact price for the user
  // We can calculate actualUnit = total / quantity so the display is correct
  const actualUnit = total / input.quantity;

  return {
    productType: 'day_logo',
    quantity: input.quantity,
    total,
    unitPrice: actualUnit,
    sellTotal: total,
    sellUnit: actualUnit,
    breakdown: {
      so_luong_tinh_gia: billQty,
      gia_co_ban: basePrice,
      phu_phi_hai_mat: input.twoSides ? d.twoSideExtra : 0,
      don_gia_ap_dung: unitPrice,
      tong_tien: total
    },
  };
}
