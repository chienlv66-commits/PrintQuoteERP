import { floorDiv, findMeterTier } from './shared';
import { EXTRA_PRICING_DATA } from './data';

export interface TemUvDtfInput {
  quantity: number;
  widthCm: number;
  heightCm: number;
  customerType: 'ALI' | 'ChienLuu' | 'Retail';
  retailDiscount?: number; // from 5 to 20
}

export function calculateTemUvDtf(input: TemUvDtfInput) {
  const { quantity, widthCm: w, heightCm: h, customerType, retailDiscount = 15 } = input;
  const d = EXTRA_PRICING_DATA.temUvDtf;

  // Phương án 1: Giữ nguyên chiều dọc
  const cols1 = floorDiv(58.2, w + 0.2);
  const rows1 = cols1 > 0 ? Math.ceil(quantity / cols1) : Number.POSITIVE_INFINITY;
  const length1Cm = cols1 > 0 ? rows1 * (h + 0.4) : Number.POSITIVE_INFINITY;

  // Phương án 2: Xoay 90 độ
  const cols2 = floorDiv(58.2, h + 0.2);
  const rows2 = cols2 > 0 ? Math.ceil(quantity / cols2) : Number.POSITIVE_INFINITY;
  const length2Cm = cols2 > 0 ? rows2 * (w + 0.4) : Number.POSITIVE_INFINITY;

  if (cols1 === 0 && cols2 === 0) {
    throw new Error('Kích thước tem quá khổ (vượt quá 58cm)!');
  }

  let optimalOrientation: 'normal' | 'rotated';
  let optimalLengthCm: number;
  let optimalCols: number;
  let optimalRows: number;

  if (length1Cm <= length2Cm) {
    optimalOrientation = 'normal';
    optimalLengthCm = length1Cm;
    optimalCols = cols1;
    optimalRows = rows1;
  } else {
    optimalOrientation = 'rotated';
    optimalLengthCm = length2Cm;
    optimalCols = cols2;
    optimalRows = rows2;
  }

  const lengthMeter = optimalLengthCm / 100;
  
  let priceTable;
  if (customerType === 'ALI') priceTable = d.ali;
  else if (customerType === 'ChienLuu') priceTable = d.chienLuu;
  else priceTable = d.retail;

  const tier = findMeterTier(priceTable, lengthMeter);
  let basePricePerMeter = tier.price;

  if (customerType === 'Retail') {
    // apply discount
    const discountFactor = 1 - (retailDiscount / 100);
    basePricePerMeter = basePricePerMeter * discountFactor;
  }

  const total = lengthMeter * basePricePerMeter;
  const unitPrice = total / quantity;

  return {
    productType: 'tem_uv_dtf',
    quantity,
    total,
    unitPrice,
    sellTotal: total,
    sellUnit: unitPrice,
    breakdown: {
      chieu_ngang: w,
      chieu_doc: h,
      so_luong: quantity,
      loai_khach_hang: customerType,
      chiet_khau_khach_le: customerType === 'Retail' ? `${retailDiscount}%` : '0%',
      phuong_an_ghep: optimalOrientation === 'normal' ? 'Giu nguyen chieu' : 'Xoay 90 do',
      so_tem_mot_hang: optimalCols,
      so_hang: optimalRows,
      tong_chieu_dai_cm: optimalLengthCm,
      tong_chieu_dai_m: lengthMeter,
      don_gia_met: basePricePerMeter,
      tong_tien: total
    },
  };
}
