import type { CustomerQuoteResult, PricingContext, ProductType, QuoteResult } from './types';
import { calculateQuickPaper, type QuickPaperInput } from './modules/quick-paper';
import { calculateOffset, type OffsetInput } from './modules/offset';
import { calculateOffsetCard, type OffsetCardInput } from './modules/offset-card';
import { calculateDecalQuick, type DecalQuickInput } from './modules/decal-quick';
import {
  calculateVoid, type VoidInput,
  calculateMica, type MicaInput,
  calculateMacDa, type MacDaInput,
  calculateTemNhiet, type TemNhietInput,
  calculateTemPet, type TemPetInput,
  calculateTemUvDtf, type TemUvDtfInput,
  calculateTemCaoThanh1Mau, type TemCaoThanh1MauInput,
  calculateDayLogo, type DayLogoInput
} from './extra-modules';

export type CalculateQuoteInput =
  | ({ productType: 'quick_paper' } & QuickPaperInput)
  | ({ productType: 'decal_quick' } & DecalQuickInput)
  | ({ productType: 'offset' } & OffsetInput)
  | ({ productType: 'offset_card' } & OffsetCardInput)
  | ({ productType: 'void' } & VoidInput)
  | ({ productType: 'mica' } & MicaInput)
  | ({ productType: 'mac_da' } & MacDaInput)
  | ({ productType: 'tem_nhiet' } & TemNhietInput)
  | ({ productType: 'tem_pet' } & TemPetInput)
  | ({ productType: 'tem_uv_dtf' } & TemUvDtfInput)
  | ({ productType: 'tem_cao_thanh_1_mau' } & TemCaoThanh1MauInput)
  | ({ productType: 'day_logo' } & DayLogoInput);

export function calculateQuote(input: CalculateQuoteInput, ctx: PricingContext): QuoteResult {
  let result: any;
  switch (input.productType) {
    case 'quick_paper': result = calculateQuickPaper(input, ctx); break;
    case 'decal_quick': result = calculateDecalQuick(input, ctx); break;
    case 'offset': result = calculateOffset(input, ctx); break;
    case 'offset_card': result = calculateOffsetCard(input, ctx); break;
    case 'void': result = calculateVoid(input); break;
    case 'mica': result = calculateMica(input); break;
    case 'mac_da': result = calculateMacDa(input); break;
    case 'tem_nhiet': result = calculateTemNhiet(input); break;
    case 'tem_pet': result = calculateTemPet(input); break;
    case 'tem_uv_dtf': result = calculateTemUvDtf(input); break;
    case 'tem_cao_thanh_1_mau': result = calculateTemCaoThanh1Mau(input); break;
    case 'day_logo': result = calculateDayLogo(input); break;
    default: {
      const neverValue: never = input;
      throw new Error(`Module chưa được triển khai`);
    }
  }
  
  if (!result.selectedMethod) result.selectedMethod = 'standard';
  if (result.costTotal === undefined) result.costTotal = result.total;
  if (result.costUnit === undefined) result.costUnit = result.unitPrice;
  if (result.sellTotal === undefined) result.sellTotal = result.total;
  if (result.sellUnit === undefined) result.sellUnit = result.unitPrice;
  if (!result.alternatives) result.alternatives = [];
  
  
  return result as QuoteResult;
}

export function toCustomerQuote(result: QuoteResult): CustomerQuoteResult {
  return {
    productType: result.productType,
    unitPrice: Math.ceil(result.sellUnit),
    totalPrice: Math.ceil(result.sellTotal),
    note: 'Giá tham khảo, chưa bao gồm VAT. Sale/Admin có thể điều chỉnh theo thực tế sản xuất.',
  };
}

export * from './types';
