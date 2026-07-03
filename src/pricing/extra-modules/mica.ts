import { maxLayout, ceilTo } from './shared';
import { EXTRA_PRICING_DATA } from './data';

export interface MicaInput {
  quantity: number;
  lengthCm: number;
  widthCm: number;
  materialUnitPrice: number;
  colorCount: number;
  sideCount: 1 | 2;
  cut?: boolean;
  drillOrCorner?: boolean;
}

export function calculateMica(input: MicaInput) {
  const d = EXTRA_PRICING_DATA.mica;
  const layout = maxLayout(d.sheetWidthCm, d.sheetHeightCm, input.lengthCm, input.widthCm, 0);
  const itemsPerSheet = layout.items;
  const sheets = Math.ceil(input.quantity / itemsPerSheet);

  const rawMaterial = (d.wasteSheets + sheets) * input.materialUnitPrice * d.rawPaperWidthCm * d.rawPaperHeightCm;
  const materialCost = ceilTo(rawMaterial, 1000);
  const printCost = input.colorCount * d.printPerColorPerSide * input.sideCount;
  
  const cutCost = input.cut ? Math.max(input.quantity / (itemsPerSheet * d.cutBatchQty) * d.cutBatchFee, d.cutMin) : 0;
  const processingCost = input.drillOrCorner ? (input.quantity * 10 > d.processingMin ? input.quantity * 20 : d.processingMin) : 0;
  
  const totalCost = materialCost + printCost + cutCost + processingCost;
  const unitPrice = totalCost / (input.quantity * d.marginDivisor);

  return {
    productType: 'mica',
    quantity: input.quantity,
    total: totalCost,
    unitPrice,
    sellTotal: totalCost / d.marginDivisor, // wait, formula says unitPrice = totalCost / (quantity * 0.6)
    sellUnit: unitPrice,
    breakdown: {
      phuong_an_ghep: layout,
      so_tem_tren_to: itemsPerSheet,
      so_to_in: sheets,
      so_to_bu_hao: d.wasteSheets,
      phi_vat_tu: materialCost,
      phi_in: printCost,
      phi_cat: cutCost,
      phi_gia_cong: processingCost
    },
  };
}
