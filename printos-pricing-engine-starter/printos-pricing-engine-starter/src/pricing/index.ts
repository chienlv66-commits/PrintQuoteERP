import type { CustomerQuoteResult, PricingContext, ProductType, QuoteResult } from './types';
import { calculateQuickPaper, type QuickPaperInput } from './modules/quick-paper';
import { calculateOffset, type OffsetInput } from './modules/offset';

export type CalculateQuoteInput =
  | ({ productType: 'quick_paper' } & QuickPaperInput)
  | ({ productType: 'offset' } & OffsetInput);

export function calculateQuote(input: CalculateQuoteInput, ctx: PricingContext): QuoteResult {
  switch (input.productType) {
    case 'quick_paper': return calculateQuickPaper(input, ctx);
    case 'offset': return calculateOffset(input, ctx);
    default: {
      const neverValue: never = input;
      throw new Error(`Module chưa được triển khai: ${(neverValue as { productType: ProductType }).productType}`);
    }
  }
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
