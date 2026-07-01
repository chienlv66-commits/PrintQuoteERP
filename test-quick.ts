import { runPricingEngine } from './src/pricing/engine';

const testCases = [
    {
        name: 'Test 2: 1000 card 4x6 1 mặt C300',
        input: { productType: 'quick_paper', quantity: 1000, widthCm: 4.0, heightCm: 6.0, materialId: 'C300 thường', sideCount: 1, laminate: true, cut: true, drill: false, finishingType: 'auto' },
        expected: {}
    }
];

testCases.forEach((tc, idx) => {
    try {
        const res = runPricingEngine(tc.input as any);
        console.log(`--- ${tc.name} ---`);
        console.log(`Sell Unit: ${res.sellUnit}`);
        console.log(JSON.stringify(res.breakdown, null, 2));
        console.log(JSON.stringify(res.alternatives.map(a => ({ method: a.method, sellUnit: a.sellUnit })), null, 2));
    } catch (e) {
        console.error(`Error in ${tc.name}:`, e.message);
    }
});
