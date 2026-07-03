import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runPricingEngine } from '../pricing/engine';
import { Settings, Calculator, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import seedData from '../data/seed-from-excel.json';

const methodLabels = {
    'cut': 'Xén',
    'laser_diecut': 'Bế Laze',
    'mold_diecut': 'Bế Khuôn',
    'mount_cut': 'Bồi Xén',
    'mount_diecut': 'Bồi Bế'
};

export default function AdminTestPricing() {
    const { currentUser, transferQuoteToOrder } = useAppContext();
    const isAdmin = currentUser?.role === 'admin';
    const navigate = useNavigate();

    // Inputs
    const [productType, setProductType] = useState('quick_paper');
    const [quantity, setQuantity] = useState(100);
    const [widthCm, setWidthCm] = useState(5.4);
    const [heightCm, setHeightCm] = useState(8.0);
    const [materialId, setMaterialId] = useState('C300 thường');
    const [sideCount, setSideCount] = useState(2);
    
    // Quick Paper Finishing
    const [laminate, setLaminate] = useState(true);
    const [cut, setCut] = useState(true);
    const [drill, setDrill] = useState(false);
    const [finishingType, setFinishingType] = useState('auto');
    const [printPageTierLabel, setPrintPageTierLabel] = useState('');

    // Offset Card Finishing
    const [printMode, setPrintMode] = useState('ntn');
    const [printColor, setPrintColor] = useState(4);
    const [offLaminate, setOffLaminate] = useState('none');
    const [offMount, setOffMount] = useState('none');
    const [offCut, setOffCut] = useState('normal');
    const [offDrill, setOffDrill] = useState('none');
    const [offDiecut, setOffDiecut] = useState('none');
    const [offUv, setOffUv] = useState('none');
    const [offFoil, setOffFoil] = useState('none');
    const [wasteOverride, setWasteOverride] = useState('');
    const [formatOverride, setFormatOverride] = useState('auto');

    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleCalculate = () => {
        try {
            setError('');
            let payload;
            if (productType === 'quick_paper') {
                payload = {
                    productType,
                    quantity: Number(quantity),
                    widthCm: Number(widthCm),
                    heightCm: Number(heightCm),
                    materialId,
                    sideCount: Number(sideCount),
                    laminate,
                    cut,
                    drill,
                    finishingType,
                    printPageTierLabel: printPageTierLabel || undefined
                };
            } else if (productType === 'decal_quick') {
                payload = {
                    productType,
                    quantity: Number(quantity),
                    widthCm: Number(widthCm),
                    lengthCm: Number(heightCm),
                    materialCode: materialId,
                    sideCount: Number(sideCount),
                    laminateFlag: laminate ? 1 : 0,
                    cutFlag: cut ? 1 : 0,
                    finishingType,
                    printTierLabel: printPageTierLabel || undefined
                };
            } else if (productType === 'offset_card') {
                payload = {
                    productType,
                    quantity: Number(quantity),
                    widthCm: Number(widthCm),
                    heightCm: Number(heightCm),
                    materialCode: materialId,
                    printMode,
                    printColor: Number(printColor),
                    laminate: offLaminate,
                    mount: offMount,
                    cut: offCut,
                    drill: offDrill,
                    diecut: offDiecut,
                    uv: offUv,
                    foil: offFoil,
                    wasteSheetsOverride: wasteOverride ? Number(wasteOverride) : undefined,
                    formatOverride: formatOverride
                };
            } else {
                throw new Error('Unsupported product type in UI');
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
        const quoteData = {
            productName: productType === 'quick_paper' ? 'In Nhanh' : productType === 'decal_quick' ? 'Decal In Nhanh' : 'In Offset',
            material: materialId,
            dimensions: `${widthCm}x${heightCm}cm`,
            quantity: Number(quantity),
            unitPrice: result.sellUnit,
            totalPrice: result.sellTotal,
            specs: `Mặt in: ${productType === 'quick_paper' ? sideCount : printMode === 'ntn' ? '2 mặt' : '1 mặt'}`,
            processing: `Cán: ${laminate || offLaminate !== 'none' ? 'Có' : 'Không'}, Xén: ${cut || offCut !== 'none' ? 'Có' : 'Không'}`
        };
        transferQuoteToOrder(quoteData);
        navigate('/create-order');
    };

    const fmt = (n) => Math.round(n || 0).toLocaleString('vi-VN');

    return (
        <div className="max-w-screen-xl mx-auto space-y-6 pb-20">
            <style>{`
                .label { display:block; font-size:.75rem; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:4px; }
                .inp { width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:.875rem; background:white; outline:none; }
                .inp:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
                .chk { width:18px; height:18px; accent-color:#3b82f6; cursor:pointer; }
            `}</style>
            
            <div className="flex items-center gap-3 border-b pb-4">
                <Database className="text-slate-500" size={28}/>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Admin Test Pricing Engine</h1>
                    <p className="text-sm text-slate-500">Môi trường kiểm thử công thức (độ lệch với Excel mục tiêu &lt; 1%)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Input */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h2 className="font-bold flex items-center gap-2 text-slate-700">
                            <Settings size={18}/> Tham số tính toán
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="label">Loại SP</label>
                                <select className="inp" value={productType} onChange={e => setProductType(e.target.value)}>
                                    <option value="quick_paper">In Nhanh</option>
                                    <option value="decal_quick">Decal In Nhanh</option>
                                    <option value="offset_card">In Offset (Thẻ bài)</option>
                                </select>
                            </div>
                            <div><label className="label">Số lượng</label>
                                <input type="number" className="inp" value={quantity} onChange={e => setQuantity(e.target.value)} />
                            </div>
                            <div><label className="label">Rộng (cm)</label>
                                <input type="number" step="0.1" className="inp" value={widthCm} onChange={e => setWidthCm(e.target.value)} />
                            </div>
                            <div><label className="label">Dài (cm)</label>
                                <input type="number" step="0.1" className="inp" value={heightCm} onChange={e => setHeightCm(e.target.value)} />
                            </div>
                        </div>

                        <div><label className="label">Mã Giấy / Decal (materialId)</label>
                            <select className="inp" value={materialId} onChange={e => setMaterialId(e.target.value)}>
                                {seedData.materials.map(m => (
                                    <option key={m.id} value={m.name}>{m.name} {m.gsm ? `(${m.gsm}gsm)` : ''}</option>
                                ))}
                            </select>
                        </div>

                        {productType === 'quick_paper' || productType === 'decal_quick' ? (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="label">Số mặt in</label>
                                        <select className="inp" value={sideCount} onChange={e => setSideCount(e.target.value)}>
                                            <option value={1}>1 mặt</option>
                                            <option value={2}>2 mặt</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Finishing Type</label>
                                        {productType === 'decal_quick' ? (
                                            <select className="inp" value={finishingType} onChange={e => setFinishingType(e.target.value)}>
                                                <option value="auto">Auto (Chọn rẻ nhất)</option>
                                                <option value="square_cut">Xén</option>
                                                <option value="diecut">Bế</option>
                                            </select>
                                        ) : (
                                            <select className="inp" value={finishingType} onChange={e => setFinishingType(e.target.value)}>
                                                <option value="auto">Auto (Chọn rẻ nhất)</option>
                                                <option value="cut">Xén</option>
                                                <option value="laser_diecut">Bế Laze (In nhanh)</option>
                                                <option value="mold_diecut">Bế khuôn</option>
                                                <option value="mount_cut">Bồi Xén</option>
                                                <option value="mount_diecut">Bồi Bế</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center gap-4">
                                    <label className="flex items-center gap-1.5 font-semibold text-slate-700 text-sm">
                                        <input type="checkbox" className="chk" checked={laminate} onChange={e => setLaminate(e.target.checked)}/> Cán màng
                                    </label>
                                    <label className="flex items-center gap-1.5 font-semibold text-slate-700 text-sm">
                                        <input type="checkbox" className="chk" checked={cut} onChange={e => setCut(e.target.checked)}/> Xén vuông
                                    </label>
                                    {productType === 'quick_paper' && (
                                        <label className="flex items-center gap-1.5 font-semibold text-slate-700 text-sm">
                                            <input type="checkbox" className="chk" checked={drill} onChange={e => setDrill(e.target.checked)}/> Khoan lỗ
                                        </label>
                                    )}
                                </div>

                                <div><label className="label">Tier Trang In (Ghi đè thủ công)</label>
                                    <input type="text" className="inp" value={printPageTierLabel} onChange={e => setPrintPageTierLabel(e.target.value)} placeholder="Vd: 400-500" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="label">Kiểu In</label>
                                        <select className="inp" value={printMode} onChange={e => setPrintMode(e.target.value)}>
                                            <option value="ntn">In 2 mặt</option>
                                            <option value="one_side">In 1 mặt</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Màu In</label>
                                        <select className="inp" value={printColor} onChange={e => setPrintColor(e.target.value)}>
                                            <option value={4}>4 Màu</option>
                                            <option value={3}>3 Màu</option>
                                            <option value={2}>2 Màu</option>
                                            <option value={1}>1 Màu</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Cán Màng</label>
                                        <select className="inp" value={offLaminate} onChange={e => setOffLaminate(e.target.value)}>
                                            <option value="none">Không cán</option>
                                            <option value="matte">Cán mờ</option>
                                            <option value="gloss">Cán bóng</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Bồi</label>
                                        <select className="inp" value={offMount} onChange={e => setOffMount(e.target.value)}>
                                            <option value="none">Không bồi</option>
                                            <option value="double_card">Bồi đôi thẻ</option>
                                            <option value="by_job">Bồi theo bài</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Xén</label>
                                        <select className="inp" value={offCut} onChange={e => setOffCut(e.target.value)}>
                                            <option value="normal">Xén thường</option>
                                            <option value="mounted">Xén bồi</option>
                                            <option value="by_design">Xén theo bài</option>
                                            <option value="none">Không xén</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Bế Khuôn</label>
                                        <select className="inp" value={offDiecut} onChange={e => setOffDiecut(e.target.value)}>
                                            <option value="none">Không bế</option>
                                            <option value="full_mold">Bế khuôn cả</option>
                                            <option value="half_mold">Bế khuôn nửa</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Phủ UV</label>
                                        <select className="inp" value={offUv} onChange={e => setOffUv(e.target.value)}>
                                            <option value="none">Không UV</option>
                                            <option value="under_500">UV Dưới 500 tờ</option>
                                            <option value="under_1000">UV Dưới 1000 tờ</option>
                                            <option value="over_1000">UV Trên 1000 tờ</option>
                                            <option value="one_side">UV 1 mặt</option>
                                            <option value="two_side">UV 2 mặt</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Ép Nhũ</label>
                                        <select className="inp" value={offFoil} onChange={e => setOffFoil(e.target.value)}>
                                            <option value="none">Không ép nhũ</option>
                                            <option value="foil">Ép nhũ</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Khoan lỗ</label>
                                        <select className="inp" value={offDrill} onChange={e => setOffDrill(e.target.value)}>
                                            <option value="none">Không khoan</option>
                                            <option value="drill">Khoan 1 lỗ</option>
                                        </select>
                                    </div>
                                    <div><label className="label">Bù hao (ghi đè)</label>
                                        <input type="number" className="inp" value={wasteOverride} onChange={e => setWasteOverride(e.target.value)} placeholder="Tự động" />
                                    </div>
                                    <div><label className="label">Khổ in (ép buộc)</label>
                                        <select className="inp border-amber-300" value={formatOverride} onChange={e => setFormatOverride(e.target.value)}>
                                            <option value="auto">Tự động (Tối ưu nhất)</option>
                                            <option value="650x430">650 x 430</option>
                                            <option value="545x395">545 x 395</option>
                                            <option value="395x360">395 x 360</option>
                                            <option value="430x325">430 x 325</option>
                                            <option value="395x272.5">395 x 272.5</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        <button onClick={handleCalculate} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                            <Calculator size={18}/> Tính Giá Mới
                        </button>
                    </div>
                </div>

                {/* Results Output */}
                <div className="lg:col-span-8">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mb-4 flex items-center gap-3 font-semibold">
                            <AlertTriangle/> {error}
                        </div>
                    )}
                    
                    {result && (
                        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                            <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <CheckCircle className="text-green-400"/> Kết quả được chọn: {methodLabels[result.selectedMethod] || result.selectedMethod}
                                    </h2>
                                    <p className="text-sm text-slate-300 mt-1">Hệ số biên lợi nhuận: {result.marginRate ? Math.round(result.marginRate * 100) : 0}%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-300 font-medium">Đơn giá sx: {fmt(result.costUnit)}đ <span className="opacity-70">(Tổng: {fmt(result.costTotal)}đ)</span></p>
                                    <p className="text-sm text-slate-300 mt-2">Giá bán khách/cái</p>
                                    <p className="text-3xl font-black text-emerald-400">{fmt(result.sellUnit)}đ</p>
                                    <p className="text-sm font-semibold">Tổng: {fmt(result.sellTotal)}đ</p>
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Chi tiết cấu thành (Breakdown) - Base Cost: {fmt(result.costTotal)}đ / {fmt(result.costUnit)}đ/c</h3>
                                <pre className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs overflow-x-auto text-slate-700">
                                    {JSON.stringify(result.breakdown, null, 2)}
                                </pre>
                            </div>

                            {result.alternatives && result.alternatives.length > 0 && (
                                <div className="p-6 bg-slate-50 border-t">
                                    <h3 className="font-bold text-slate-800 mb-4">Các Phương Án Thay Thế Lựa Chọn (Alternatives)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {result.alternatives.map((a) => (
                                            <div key={a.method} className={`p-3 border rounded-xl bg-white ${a.method === result.selectedMethod ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                                                <p className="font-bold text-slate-700 text-sm">{methodLabels[a.method] || a.method} {a.method === result.selectedMethod && '⭐'}</p>
                                                <div className="flex justify-between mt-2 text-xs">
                                                    <span className="text-slate-500">Giá vốn/cái:</span>
                                                    <span className="font-medium">{fmt(a.costUnit)}đ</span>
                                                </div>
                                                <div className="flex justify-between mt-1 text-xs">
                                                    <span className="text-slate-500">Giá bán/cái:</span>
                                                    <span className="font-bold text-emerald-600">{fmt(a.sellUnit)}đ</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
        </div>
    );
}
