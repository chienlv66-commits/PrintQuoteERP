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

  // Cũ: Phương án xếp đồng nhất
  const cols1 = floorDiv(58.0, w + 0.3);
  const rows1 = cols1 > 0 ? Math.ceil(quantity / cols1) : Number.POSITIVE_INFINITY;
  const length1Cm = cols1 > 0 ? rows1 * h + (rows1 - 1) * 0.3 : Number.POSITIVE_INFINITY;

  const cols2 = floorDiv(58.0, h + 0.3);
  const rows2 = cols2 > 0 ? Math.ceil(quantity / cols2) : Number.POSITIVE_INFINITY;
  const length2Cm = cols2 > 0 ? rows2 * w + (rows2 - 1) * 0.3 : Number.POSITIVE_INFINITY;

  let legacyLengthCm = Math.min(length1Cm, length2Cm);
  let legacyOrientation = length1Cm <= length2Cm ? 'normal' : 'rotated';
  let legacyCols = length1Cm <= length2Cm ? cols1 : cols2;
  let legacyRows = length1Cm <= length2Cm ? rows1 : rows2;

  // Mới: Phương án xếp hỗn hợp (Mixed 2D Bin Packing)
  const W = 58.0;
  const gap = 0.3;
  let bestMixed = null;
  let minTotalLength = Infinity;

  for (let a = 0; a <= 20; a++) {
    for (let b = 0; b <= 20; b++) {
      if (a === 0 && b === 0) continue;
      const widthUsed = a * w + b * h + (a + b - 1) * gap;
      if (widthUsed > W) continue;
      
      const max_n1 = a > 0 ? Math.floor((100 + gap) / (h + gap)) : 0;
      const max_n2 = b > 0 ? Math.floor((100 + gap) / (w + gap)) : 0;
      
      const min_n1 = a > 0 ? 1 : 0;
      const min_n2 = b > 0 ? 1 : 0;
      
      for (let n1 = min_n1; n1 <= max_n1; n1++) {
        for (let n2 = min_n2; n2 <= max_n2; n2++) {
          const N_block = a * n1 + b * n2;
          if (N_block === 0) continue;
          
          const L1 = a > 0 ? n1 * h + (n1 - 1) * gap : 0;
          const L2 = b > 0 ? n2 * w + (n2 - 1) * gap : 0;
          const L_block = Math.max(L1, L2);
          
          if (L_block > 100) continue;
          
          const numBlocks = Math.ceil(quantity / N_block);
          const totalLength = numBlocks * L_block + (numBlocks - 1) * gap;
          
          if (totalLength < minTotalLength) {
            minTotalLength = totalLength;
            bestMixed = {a, b, n1, n2, L_block, N_block, numBlocks, totalLength};
          }
        }
      }
    }
  }

  if (!bestMixed) {
    throw new Error('Kích thước tem quá khổ (vượt quá 58cm)!');
  }

  const optimalLengthCm = bestMixed.totalLength;
  const lengthMeter = optimalLengthCm / 100;
  
  let priceTable;
  if (customerType === 'ALI') priceTable = d.ali;
  else if (customerType === 'ChienLuu') priceTable = d.chienLuu;
  else priceTable = d.retail;

  const tier = findMeterTier(priceTable, lengthMeter);
  let basePricePerMeter = tier.price;

  if (customerType === 'Retail') {
    const discountFactor = 1 - (retailDiscount / 100);
    basePricePerMeter = basePricePerMeter * discountFactor;
  }

  const total = lengthMeter * basePricePerMeter;
  const unitPrice = total / quantity;

  // Tính tiền của cách cũ để so sánh
  const legacyLengthMeter = legacyLengthCm / 100;
  const legacyTier = findMeterTier(priceTable, legacyLengthMeter);
  let legacyBasePrice = legacyTier.price;
  if (customerType === 'Retail') legacyBasePrice = legacyBasePrice * (1 - (retailDiscount / 100));
  const legacyTotal = legacyLengthMeter * legacyBasePrice;

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
      phuong_an_ghep: `Tối ưu Hỗn hợp (Cụm ${bestMixed.N_block} tem, dài ${bestMixed.L_block.toFixed(1)}cm)`,
      chi_tiet_cum: `${bestMixed.a} cột dọc (${bestMixed.n1} tem/cột) + ${bestMixed.b} cột ngang (${bestMixed.n2} tem/cột)`,
      so_cum_in: bestMixed.numBlocks,
      tong_chieu_dai_m: lengthMeter.toFixed(2),
      don_gia_met: basePricePerMeter,
      tong_tien: total,
      so_sanh_cach_cu: {
        phuong_an: legacyOrientation === 'normal' ? 'Xếp một chiều dọc' : 'Xếp một chiều ngang',
        so_tem_mot_hang: legacyCols,
        so_hang: legacyRows,
        tong_chieu_dai_m: legacyLengthMeter.toFixed(2),
        tong_tien: legacyTotal
      }
    },
  };
}
