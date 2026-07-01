export type ProductType =
  | 'quick_paper'
  | 'offset'
  | 'quick_decal'
  | 'void'
  | 'roll_decal'
  | 'mica'
  | 'leather_tag'
  | 'thermal_label'
  | 'pet_label'
  | 'uv_label'
  | 'logo_string'
  | 'sample';

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
