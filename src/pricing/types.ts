export type ProductType =
  | 'quick_paper'
  | 'offset'
  | 'offset_card'
  | 'decal_quick'
  | 'void'
  | 'mica'
  | 'mac_da'
  | 'tem_nhiet'
  | 'tem_pet'
  | 'tem_uv_dtf'
  | 'tem_cao_thanh_1_mau'
  | 'day_logo';

export interface Material {
  id: string;
  name: string;
  groupName?: string | null;
  gsm?: number | null;
  basePrice?: number | null;
  paperName?: string | null;
  unitPriceM2: number;
  platePrice?: number | null;
  sheetWidthCm?: number | null;
  sheetHeightCm?: number | null;
  sheetSizeText?: string | null;
  sheetPrice?: number | null;
}

export interface QuantityTier {
  module: string;
  label: string;
  minQty?: number | null;
  maxQty?: number | null;
  value: number;
  unit?: string;
}

export interface PricingContext {
  materials: Material[];
  quantityTiers: QuantityTier[];
  processPrices?: Record<string, number>;
}

export interface QuoteAlternative {
  method: string;
  costTotal: number;
  costUnit: number;
  sellUnit: number;
  sellTotal: number;
  breakdown: Record<string, number | string | boolean | null>;
}

export interface QuoteResult {
  productType: ProductType;
  selectedMethod: string;
  costTotal: number;
  costUnit: number;
  sellUnit: number;
  sellTotal: number;
  marginRate?: number;
  breakdown: Record<string, number | string | boolean | null>;
  alternatives: QuoteAlternative[];
}

export interface CustomerQuoteResult {
  productType: ProductType;
  unitPrice: number;
  totalPrice: number;
  note: string;
}
