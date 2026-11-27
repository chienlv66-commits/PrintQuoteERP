export const DEFAULT_CATEGORIES = [
    'Vật tư / Gia công',
    'In ấn / Gia công',
    'Tem UV-DTF',
    'Vận chuyển',
    'Khác',
];

export const UV_DTF_TIERS = [
    { max: 3, price: 180000, label: '<= 3m (mốc 1 - 3m)' },
    { max: 10, price: 165000, label: '3,5 - 10m' },
    { max: 50, price: 155000, label: '11 - 50m' },
    { max: 100, price: 145000, label: '51 - 100m' },
    { max: 300, price: 140000, label: '101 - 300m' },
    { max: Infinity, price: 135000, label: '> 300m' },
];

export const getUvDtfTier = (meters) => {
    const qty = Number(meters);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    return UV_DTF_TIERS.find(t => qty <= t.max) || UV_DTF_TIERS[UV_DTF_TIERS.length - 1];
};

export const createEmptySupplierEntry = () => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: '',
    phone: '',
    address: '',
    category: 'Vật tư / Gia công',
    itemType: 'general', // 'general' | 'uv_dtf'
    productName: '',
    qty: '',
    unitPrice: '',
    paidAmount: '',
    orderLink: '',
    note: '',
});

export const computeSupplierEntryTotal = (entry) => {
    const qtyNum = entry.qty === '' ? 1 : (Number(entry.qty) || 0);
    const priceNum = Number(entry.unitPrice) || 0;
    return Math.round(qtyNum * priceNum);
};

export const buildSupplierTransactionRow = (entry, overrideOrderLink) => {
    const newId = `PC${Math.floor(100 + Math.random() * 900)}`;
    const dateStr = new Date().toLocaleDateString();

    const saveQty = entry.qty === '' ? 1 : (Number(entry.qty) || 0);
    const savePrice = Number(entry.unitPrice) || 0;
    const totalNum = Math.round(saveQty * savePrice);
    const paidNum = Number(entry.paidAmount) || 0;
    const debtNum = totalNum - paidNum;
    const orderLink = overrideOrderLink !== undefined ? overrideOrderLink : (entry.orderLink || '');

    return [
        newId,
        dateStr,
        'expense',
        String(entry.category ?? '').trim() || 'Khác',
        String(entry.name ?? '').trim(),
        String(entry.phone ?? ''),
        String(entry.address ?? ''),
        String(entry.productName ?? '').trim() || 'Khởi tạo NCC',
        saveQty,
        savePrice,
        totalNum,
        paidNum,
        debtNum,
        orderLink,
        String(entry.note ?? ''),
    ];
};

export const parseSuppliersFromTransactions = (rows = []) => {
    const suppMap = {};

    rows.forEach(row => {
        const typeRaw = row[2] ? row[2].toString().toLowerCase() : '';
        if (!typeRaw.includes('chi') && !typeRaw.includes('expense')) return;

        const name = String(row[4] ?? '').trim();
        if (!name) return;

        const phone = String(row[5] ?? '').trim();
        const address = String(row[6] ?? '').trim();
        const cat = String(row[3] ?? '').trim() || 'Khác';
        const totalVal = Number(row[10]) || 0;
        const paidVal = Number(row[11]) || 0;
        const debtVal = Number(row[12]) || 0;

        if (!suppMap[name]) {
            suppMap[name] = {
                name,
                category: cat,
                phone,
                address,
                totalBought: 0,
                totalPaid: 0,
                totalDebt: 0,
                lastTransDate: String(row[1] ?? ''),
            };
        }

        suppMap[name].totalBought += totalVal;
        suppMap[name].totalPaid += paidVal;
        suppMap[name].totalDebt += debtVal;

        if (new Date(row[1]) > new Date(suppMap[name].lastTransDate)) {
            suppMap[name].lastTransDate = String(row[1] ?? '');
        }

        if (cat) suppMap[name].category = cat;
        if (phone) suppMap[name].phone = phone;
        if (address) suppMap[name].address = address;
    });

    return Object.values(suppMap).sort((a, b) => b.totalBought - a.totalBought);
};
