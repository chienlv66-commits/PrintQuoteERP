import { runPricingEngine } from './src/pricing/engine';

const result = runPricingEngine({
    productType: 'offset_card',
    quantity: 10000,
    widthCm: 6,
    heightCm: 9,
    materialCode: 'ốp 250',
    printMode: 'ntn',
    printColor: 4,
    laminate: 'none',
    mount: 'none',
    cut: 'normal',
    drill: 'none',
    diecut: 'none',
    wasteSheetsOverride: 70,
} as any);

console.log('--- Test Offset Card 10000 6x9 ---');
console.log('Selected format:', result.breakdown.format.ma_kho);
console.log('Items per side:', result.breakdown.format.so_bat_mot_mat);
console.log('Paper sheets base:', result.breakdown.giay.to_chinh);
console.log('Waste sheets:', result.breakdown.giay.bu_hao);
console.log('Paper sheets total:', result.breakdown.giay.tong_to);
console.log('Diecut Work Cost:', result.breakdown.gia_cong.cong_be);
console.log('Cut Cost:', result.breakdown.gia_cong.tien_xen);
console.log('Total Cost:', result.costTotal);
console.log('Selling Total:', result.sellTotal);
