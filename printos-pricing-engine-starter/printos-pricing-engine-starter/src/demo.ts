import { pricingContext } from './db/in-memory-data';
import { calculateQuote, toCustomerQuote } from './pricing/index';

const quickPaper = calculateQuote({
  productType: 'quick_paper',
  quantity: 84,
  widthCm: 29.7,
  heightCm: 21,
  materialId: 'C300 thường',
  sideCount: 1,
  printPageTierLabel: '400-500',
  laminate: false,
  cut: true,
  drill: false,
  finishingType: 'auto',
}, pricingContext);

console.log('ADMIN QUICK PAPER');
console.log(JSON.stringify(quickPaper, null, 2));
console.log('CUSTOMER QUICK PAPER');
console.log(JSON.stringify(toCustomerQuote(quickPaper), null, 2));

const offset = calculateQuote({
  productType: 'offset',
  quantity: 5000,
  widthCm: 5,
  heightCm: 9,
  materialId: 'C300 thường',
  colorCount: 4,
  laminateSideCount: 1,
  cut: true,
  drill: false,
  finishingType: 'auto',
}, pricingContext);

console.log('ADMIN OFFSET');
console.log(JSON.stringify(offset, null, 2));
