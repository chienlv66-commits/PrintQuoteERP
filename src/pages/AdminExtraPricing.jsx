import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { runPricingEngine } from '../pricing/engine';
import { Calculator, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AdminExtraPricing() {
    const { currentUser, transferQuoteToOrder } = useAppContext();
    const isAdmin = currentUser?.role === 'admin';
    const location = useLocation();
    const navigate = useNavigate();

    const [productType, setProductType] = useState('tem_uv_dtf');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const typeParam = params.get('type');
        if (typeParam) {
            setProductType(typeParam);
        }
    }, [location]);
    const [quantity, setQuantity] = useState(1000);
    const [widthCm, setWidthCm] = useState(5);
    const [heightCm, setHeightCm] = useState(5);
    
    // UV DTF specific
    const [customerType, setCustomerType] = useState('ALI');
    const [retailDiscount, setRetailDiscount] = useState(15);
    
    // General
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleCalculate = () => {
        try {
            setError('');
            let payload = {
                productType,
                quantity: Number(quantity),
                widthCm: Number(widthCm),
                heightCm: Number(heightCm),
                lengthCm: Number(heightCm)
            };

            if (productType === 'tem_uv_dtf') {
                payload.customerType = customerType;
                payload.retailDiscount = Number(retailDiscount);
            } else if (productType === 'tem_pet' || productType === 'tem_cao_thanh_1_mau') {
                payload.cutSeparately = false; // Mock for testing
            } else if (productType === 'void') {
                payload.colorCount = 1;
                payload.quantityTierLabel = '<10.000';
                payload.laminate = 0;
            } else if (productType === 'mica') {
                payload.materialUnitPrice = 0; // Requires actual context or passing number
                payload.colorCount = 1;
                payload.sideCount = 1;
            } else if (productType === 'mac_da') {
                payload.quantityTierLabel = '<3.000';
            } else if (productType === 'tem_nhiet') {
                payload.colorCount = 1;
                payload.sizeSplitCount = 0;
            } else if (productType === 'day_logo') {
                payload.materialType = 'du';
                payload.twoSides = false;
            }

            const r = runPricingEngine(payload);
            setResult(r);
        } catch (err) {
            setError(err.message);
            setResult(null);
        }
    };

    const handleTransferToOrder = () => {
        if (!result) return;
        const PRODUCT_NAMES = {
            tem_uv_dtf: 'Tem UV DTF',
            void: 'Tem Void',
            mica: 'Biển Mica',
            mac_da: 'Mác Da',
            tem_nhiet: 'Tem Nhiệt',
            tem_pet: 'Tem PET',
            tem_cao_thanh_1_mau: 'Tem Cao Thành 1 Màu',
            day_logo: 'Dây Logo'
        };
        const quoteData = {
            productName: PRODUCT_NAMES[productType] || 'Sản phẩm khác',
            material: PRODUCT_NAMES[productType] || '',
            dimensions: `${widthCm}x${heightCm}cm`,
            quantity: Number(quantity),
            unitPrice: result.sellUnit,
            totalPrice: result.sellTotal,
            specs: `Kích thước: ${widthCm}x${heightCm}cm`,
            processing: ''
        };
        transferQuoteToOrder(quoteData);
        navigate('/create-order');
    };

    const fmt = (num) => num ? num.toLocaleString('vi-VN') : '0';

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Calculator className="text-blue-500" />
                        Test Công Thức Mở Rộng (Extra Modules)
                    </h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Loại Sản Phẩm</label>
                            <select className="w-full border p-2 rounded-lg" value={productType} onChange={e => setProductType(e.target.value)}>
                                <option value="tem_uv_dtf">Tem UV DTF</option>
                                <option value="void">Tem Void</option>
                                <option value="mica">Mica</option>
                                <option value="mac_da">Mác Da</option>
                                <option value="tem_nhiet">Tem Nhiệt</option>
                                <option value="tem_pet">Tem PET</option>
                                <option value="tem_cao_thanh_1_mau">Tem Cao Thành 1 Màu</option>
                                <option value="day_logo">Dây Logo</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold mb-1">Số Lượng</label>
                            <input type="number" className="w-full border p-2 rounded-lg" value={quantity} onChange={e => setQuantity(e.target.value)} />
                        </div>
                        
                        {(productType !== 'day_logo') && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Chiều Ngang (cm)</label>
                                    <input type="number" step="0.1" className="w-full border p-2 rounded-lg" value={widthCm} onChange={e => setWidthCm(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Chiều Dọc (cm)</label>
                                    <input type="number" step="0.1" className="w-full border p-2 rounded-lg" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
                                </div>
                            </>
                        )}

                        {productType === 'tem_uv_dtf' && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Loại Khách Hàng</label>
                                    <select className="w-full border p-2 rounded-lg" value={customerType} onChange={e => setCustomerType(e.target.value)}>
                                        <option value="ALI">ALI</option>
                                        <option value="ChienLuu">ChienLuu</option>
                                        <option value="Retail">Khách Lẻ</option>
                                    </select>
                                </div>
                                {customerType === 'Retail' && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">% Chiết Khấu Khách Lẻ (5 - 20)</label>
                                        <input type="number" min="5" max="20" className="w-full border p-2 rounded-lg" value={retailDiscount} onChange={e => setRetailDiscount(e.target.value)} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <button onClick={handleCalculate} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                        <Calculator size={18} /> Tính Giá
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3 font-semibold">
                        <AlertTriangle/> {error}
                    </div>
                )}
                
                {result && (
                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                        <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <CheckCircle className="text-green-400"/> Tính toán thành công
                                </h2>
                                <p className="text-sm text-slate-300 mt-1">Sản phẩm: {result.productType}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-300 font-medium">Đơn giá sx: {fmt(result.costUnit)}đ <span className="opacity-70">(Tổng: {fmt(result.costTotal)}đ)</span></p>
                                <p className="text-sm text-slate-300 mt-2">Giá bán khách/cái</p>
                                <p className="text-3xl font-black text-emerald-400">{fmt(result.sellUnit)}đ</p>
                                <p className="text-sm font-semibold">Tổng: {fmt(result.sellTotal)}đ</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Chi tiết cấu thành (Breakdown)</h3>
                            <pre className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs overflow-x-auto text-slate-700">
                                {JSON.stringify(result.breakdown, null, 2)}
                            </pre>
                        </div>
                        
                        <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <button 
                                onClick={handleTransferToOrder}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                                Tạo Đơn Hàng Từ Báo Giá Này
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
