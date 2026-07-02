import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Save, Copy, Shirt } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { calculateMacInQuote } from '../utils/fabricPricingEngine';
import MAC_IN_DATA from '../data/fabricPricingData.json';

const RibbonForm = ({ isAdmin, onCalculate }) => {
    const [widthCm, setWidthCm] = useState(MAC_IN_DATA.ribbonMaterialWidthsCm[0]);
    const [lengthMm, setLengthMm] = useState('');
    const [quantity, setQuantity] = useState('');
    const [materialCode, setMaterialCode] = useState(Object.keys(MAC_IN_DATA.ribbonMaterialRollPrices)[0]);
    const [inkColor, setInkColor] = useState(Object.keys(MAC_IN_DATA.inkPrices)[0]);
    const [cutFlag, setCutFlag] = useState(1);
    const [solidBackgroundFlag, setSolidBackgroundFlag] = useState(0);
    const [otherCost, setOtherCost] = useState(30000);

    const handleCalculate = () => {
        if (!lengthMm || !quantity) {
            alert('Vui lòng nhập Dài mác và Số lượng!');
            return;
        }
        
        try {
            const result = calculateMacInQuote({
                productType: 'ribbon',
                widthCm: parseFloat(widthCm),
                lengthMm: parseFloat(lengthMm),
                quantity: parseInt(quantity),
                materialCode,
                inkColor,
                cutFlag,
                solidBackgroundFlag,
                otherCost: parseFloat(otherCost),
            });
            onCalculate({
                ...result,
                details: { widthCm, lengthMm, quantity, materialCode, inkColor, cutFlag, solidBackgroundFlag }
            });
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Loại nguyên liệu</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={materialCode} onChange={e => setMaterialCode(e.target.value)}>
                        {Object.keys(MAC_IN_DATA.ribbonMaterialRollPrices).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Khổ rộng (cm)</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={widthCm} onChange={e => setWidthCm(e.target.value)}>
                        {MAC_IN_DATA.ribbonMaterialWidthsCm.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Dài mác (mm)</label>
                    <input type="number" step="any" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="VD: 55" value={lengthMm} onChange={e => setLengthMm(e.target.value)} />
                    <span className="text-xs text-slate-500">(Bao gồm dư may)</span>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng mác</label>
                    <input type="number" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="VD: 1000" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mực in</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={inkColor} onChange={e => setInkColor(e.target.value)}>
                        {Object.keys(MAC_IN_DATA.inkPrices).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quy cách giao</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={cutFlag} onChange={e => setCutFlag(parseInt(e.target.value))}>
                        <option value={1}>Cắt thành phẩm</option>
                        <option value={0}>Giao nguyên cuộn</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nền bệt</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={solidBackgroundFlag} onChange={e => setSolidBackgroundFlag(parseInt(e.target.value))}>
                        <option value={0}>Không in nền bệt</option>
                        <option value={1}>In nền bệt</option>
                    </select>
                </div>
                {isAdmin && (
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Phí khác (VNĐ)</label>
                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={otherCost} onChange={e => setOtherCost(e.target.value)} />
                    </div>
                )}
            </div>
            <button onClick={handleCalculate} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-4">
                <Calculator size={20} /> Tính Giá
            </button>
        </div>
    );
};

const FlexoForm = ({ isAdmin, onCalculate }) => {
    const [materialGroup, setMaterialGroup] = useState('satin');
    const [widthCm, setWidthCm] = useState(MAC_IN_DATA.flexoMaterialWidthsCm[10]); // Default 4cm
    const [lengthMm, setLengthMm] = useState('');
    const [quantity, setQuantity] = useState('');
    const [materialCode, setMaterialCode] = useState('CB480 (Trắng)');
    const [printColor, setPrintColor] = useState(Object.keys(MAC_IN_DATA.printColors)[0]);
    const [codeCount, setCodeCount] = useState(1);
    const [cutFlag, setCutFlag] = useState(1);
    const [solidBackgroundFlag, setSolidBackgroundFlag] = useState(0);
    const [filmCost, setFilmCost] = useState(25000);

    const handleCalculate = () => {
        if (!lengthMm || !quantity || !codeCount) {
            alert('Vui lòng nhập Dài mác, Số lượng và Số mã!');
            return;
        }
        
        try {
            const result = calculateMacInQuote({
                productType: 'flexo',
                materialGroup,
                widthCm: parseFloat(widthCm),
                lengthMm: parseFloat(lengthMm),
                quantity: parseInt(quantity),
                materialCode,
                printColor,
                codeCount: parseInt(codeCount),
                cutFlag,
                solidBackgroundFlag,
                filmCost: parseFloat(filmCost),
            });
            onCalculate({
                ...result,
                details: { widthCm, lengthMm, quantity, materialCode, printColor, codeCount, cutFlag, solidBackgroundFlag, materialGroup }
            });
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nhóm vật liệu</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={materialGroup} onChange={e => setMaterialGroup(e.target.value)}>
                        <option value="satin">Satin</option>
                        <option value="cotton">Cotton</option>
                        <option value="vai_giay">Vải Giấy / Giấy dai</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mã nguyên liệu</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={materialCode} onChange={e => setMaterialCode(e.target.value)}>
                        {Object.keys(MAC_IN_DATA.flexoMaterialRollPrices).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Khổ rộng (cm)</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={widthCm} onChange={e => setWidthCm(e.target.value)}>
                        {MAC_IN_DATA.flexoMaterialWidthsCm.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Dài mác (mm)</label>
                    <input type="number" step="any" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="VD: 55" value={lengthMm} onChange={e => setLengthMm(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng mác</label>
                    <input type="number" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="VD: 10000" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Số mã / 1 bài in</label>
                    <input type="number" min="1" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={codeCount} onChange={e => setCodeCount(e.target.value)} />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cấu hình in (Mực)</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={printColor} onChange={e => setPrintColor(e.target.value)}>
                        {Object.keys(MAC_IN_DATA.printColors).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quy cách giao</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={cutFlag} onChange={e => setCutFlag(parseInt(e.target.value))}>
                        <option value={1}>Cắt thành phẩm</option>
                        <option value={0}>Giao nguyên cuộn</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nền bệt</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={solidBackgroundFlag} onChange={e => setSolidBackgroundFlag(parseInt(e.target.value))}>
                        <option value={0}>Không nền bệt</option>
                        <option value={1}>Có nền bệt</option>
                    </select>
                </div>
                {isAdmin && (
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Phí ra phim (VNĐ)</label>
                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500" value={filmCost} onChange={e => setFilmCost(e.target.value)} />
                    </div>
                )}
            </div>
            <button onClick={handleCalculate} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-4">
                <Calculator size={20} /> Tính Giá
            </button>
        </div>
    );
};

export default function FabricCalculator() {
    const { currentUser, transferQuoteToOrder } = useAppContext();
    const isAdmin = currentUser?.role === 'admin';
    const [mode, setMode] = useState('ribbon'); // 'ribbon' | 'flexo'
    const [result, setResult] = useState(null);

    const handleCreateOrder = () => {
        if (!result) return;
        transferQuoteToOrder({
            productName: `Mác in vải (${mode === 'ribbon' ? 'Ribbon' : 'Flexo'})`,
            unitPrice: Math.round(result.unitPrice),
            ...result.details
        });
        window.location.href = '#/create-order';
    };

    return (
        <div className="p-6 max-w-5xl mx-auto pb-20 md:pb-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <Shirt className="text-blue-600" /> Báo Giá Mác In Vải
            </h1>
            <p className="text-slate-500 text-sm mb-6">Tính giá tự động cho mác Ribbon và mác In Flexo cuộn.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                        <button onClick={() => { setMode('ribbon'); setResult(null); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'ribbon' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            In Ribbon (Chuyển nhiệt)
                        </button>
                        <button onClick={() => { setMode('flexo'); setResult(null); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${mode === 'flexo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            In Flexo (Cuộn cao cấp)
                        </button>
                    </div>

                    {mode === 'ribbon' ? <RibbonForm isAdmin={isAdmin} onCalculate={setResult} /> : <FlexoForm isAdmin={isAdmin} onCalculate={setResult} />}
                </div>

                {result && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 h-fit">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calculator size={20} className="text-emerald-600" /> Kết Quả Báo Giá
                        </h2>
                        
                        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm mb-4">
                            <div className="text-sm text-slate-500 mb-1">Đơn giá / Cái</div>
                            <div className="text-3xl font-bold text-emerald-600">{Math.round(result.unitPrice).toLocaleString('vi-VN')} đ</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                <div className="text-xs text-slate-500">Tổng chi phí</div>
                                <div className="font-bold text-slate-800">{Math.round(result.totalCost).toLocaleString('vi-VN')} đ</div>
                            </div>
                            {result.productType === 'ribbon' && (
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <div className="text-xs text-slate-500">Đơn giá / Mét</div>
                                    <div className="font-bold text-slate-800">{Math.round(result.meterPrice).toLocaleString('vi-VN')} đ</div>
                                </div>
                            )}
                            {result.productType === 'flexo' && (
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                    <div className="text-xs text-slate-500">Đơn giá / Cuộn ({result.breakdown.rollLengthM}m)</div>
                                    <div className="font-bold text-slate-800">{Math.round(result.rollPrice).toLocaleString('vi-VN')} đ</div>
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <div className="mb-6">
                                <div className="text-sm font-bold text-slate-700 mb-2 border-b pb-2">Chi tiết Breakdown (Admin)</div>
                                <ul className="space-y-1 text-xs text-slate-600">
                                    <li className="flex justify-between"><span>Mốc số lượng:</span> <strong>{result.breakdown.tierLabel}</strong></li>
                                    <li className="flex justify-between"><span>Hệ số (Coefficient):</span> <strong>{result.breakdown.coefficient}</strong></li>
                                    {result.breakdown.marginBase && <li className="flex justify-between"><span>Margin Base:</span> <strong>{result.breakdown.marginBase}</strong></li>}
                                    <li className="flex justify-between"><span>Tổng tiền mực:</span> <strong>{Math.round(result.breakdown.inkCost).toLocaleString('vi-VN')} đ</strong></li>
                                    <li className="flex justify-between"><span>Tiền vật tư (Cuộn):</span> <strong>{Math.round(result.breakdown.materialCost).toLocaleString('vi-VN')} đ</strong></li>
                                    {result.breakdown.printCost && <li className="flex justify-between"><span>Tiền công in:</span> <strong>{Math.round(result.breakdown.printCost).toLocaleString('vi-VN')} đ</strong></li>}
                                    {result.breakdown.printFee && <li className="flex justify-between"><span>Phí in/kẽm:</span> <strong>{Math.round(result.breakdown.printFee || result.breakdown.plateCost).toLocaleString('vi-VN')} đ</strong></li>}
                                    <li className="flex justify-between"><span>Công cắt:</span> <strong>{Math.round(result.breakdown.cutCost).toLocaleString('vi-VN')} đ</strong></li>
                                </ul>
                            </div>
                        )}

                        <button onClick={handleCreateOrder} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2">
                            Lên Đơn Ngay <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
