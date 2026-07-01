import React, { useState, useRef, useEffect } from 'react';
import {
    Factory, Plus, Search, Printer, Shirt, X, Check,
    Clock, AlertTriangle, ChevronDown, PackageCheck, Settings, Truck
} from 'lucide-react';

// ==================== STATUS DEFINITIONS ====================
const FABRIC_STATUSES = [
    { value: 'Chờ in',      label: 'Chờ in',      color: 'bg-slate-100 text-slate-600',    dot: '#94a3b8' },
    { value: 'Đang in',     label: 'Đang in',     color: 'bg-amber-100 text-amber-700',    dot: '#f59e0b' },
    { value: 'Hoàn thiện',  label: 'Hoàn thiện',  color: 'bg-blue-100 text-blue-700',      dot: '#3b82f6' },
    { value: 'Đóng gói',    label: 'Đóng gói',    color: 'bg-purple-100 text-purple-700',  dot: '#8b5cf6' },
    { value: 'Giao hàng',   label: 'Giao hàng',   color: 'bg-indigo-100 text-indigo-700',  dot: '#6366f1' },
    { value: 'Hoàn tất',    label: 'Hoàn tất',    color: 'bg-emerald-100 text-emerald-700',dot: '#10b981' },
    { value: 'Lỗi',         label: 'Lỗi / Cần xử lý', color: 'bg-red-100 text-red-700',   dot: '#ef4444' },
];

const PAPER_STATUSES = [
    { value: 'Chờ in',      label: 'Chờ in',      color: 'bg-slate-100 text-slate-600',    dot: '#94a3b8' },
    { value: 'Đang in',     label: 'Đang in',     color: 'bg-amber-100 text-amber-700',    dot: '#f59e0b' },
    { value: 'Cán/Ép',      label: 'Đang cán/Ép', color: 'bg-sky-100 text-sky-700',        dot: '#0ea5e9' },
    { value: 'Bế/Xén',      label: 'Đang bế/Xén', color: 'bg-blue-100 text-blue-700',      dot: '#3b82f6' },
    { value: 'Kiểm tra',    label: 'Kiểm tra QC', color: 'bg-yellow-100 text-yellow-700',  dot: '#eab308' },
    { value: 'Đóng gói',    label: 'Đóng gói',    color: 'bg-purple-100 text-purple-700',  dot: '#8b5cf6' },
    { value: 'Giao hàng',   label: 'Giao hàng',   color: 'bg-indigo-100 text-indigo-700',  dot: '#6366f1' },
    { value: 'Hoàn tất',    label: 'Hoàn tất',    color: 'bg-emerald-100 text-emerald-700',dot: '#10b981' },
    { value: 'Lỗi',         label: 'Lỗi / Cần xử lý', color: 'bg-red-100 text-red-700',   dot: '#ef4444' },
];

// ==================== STATUS DROPDOWN COMPONENT ====================
function StatusDropdown({ status, statuses, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const cfg = statuses.find(s => s.value === status) || statuses[0];

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 ${cfg.color}`}
            >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                {cfg.label}
                <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 top-full mt-1.5 left-0 bg-white rounded-xl shadow-xl border border-slate-100 py-1 min-w-[160px]">
                    {statuses.map(s => (
                        <button
                            key={s.value}
                            onClick={() => { onChange(s.value); setOpen(false); }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-50 transition-colors text-left ${s.value === status ? 'bg-slate-50 font-bold' : ''}`}
                        >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
                            <span>{s.label}</span>
                            {s.value === status && <Check size={12} className="ml-auto text-emerald-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ==================== MOCK DATA ====================
const FABRIC_MOCK = [
    { id: 1, customer: 'Minibebe', deliveryDate: '1/6', qty: 45000, material: 'Cotton ngà', widthR: 25, widthD: 57, widthKho: 200, widthKhoe: 2250, area: 22.8, finishing: 'Gấp đôi', inCharge: 'Hoa', note: '4 size 2 màu', status: 'Hoàn tất' },
    { id: 2, customer: 'Mimbebe', deliveryDate: '1/6', qty: 45000, material: 'Satin trắng bóng 1 mặt', widthR: 30, widthD: 60, widthKho: 200, widthKhoe: 2700, area: 13.7, finishing: 'Cắt rời', inCharge: 'Hoa', note: '', status: 'Đang in' },
    { id: 3, customer: 'Coquec', deliveryDate: '2/6', qty: 12000, material: 'Satin trắng không bóng 1 mặt', widthR: 13, widthD: 50, widthKho: 180, widthKhoe: 600, area: 3.5, finishing: 'Cắt rời', inCharge: 'Thảo', note: '', status: 'Chờ in' },
    { id: 4, customer: 'Mác môn', deliveryDate: '2/6', qty: 24000, material: 'Satin trắng bóng 2 mặt', widthR: 13, widthD: 67, widthKho: 200, widthKhoe: 1608, area: 8.2, finishing: 'Cắt rời', inCharge: 'Thảo', note: '4 mã 2 mặt', status: 'Hoàn thiện' },
    { id: 5, customer: 'Mác size', deliveryDate: '2/6', qty: 42000, material: 'Satin trắng không bóng 1 mặt', widthR: 16, widthD: 47, widthKho: 180, widthKhoe: 1974, area: 11.2, finishing: 'Gấp 2 đầu', inCharge: 'Thảo', note: '8 size', status: 'Đóng gói' },
    { id: 6, customer: 'Maximuxi', deliveryDate: '4/6', qty: 5000, material: 'Satin trắng không bóng 1 mặt', widthR: 16, widthD: 67, widthKho: 200, widthKhoe: 335, area: 210, finishing: 'Gấp 2 đầu', inCharge: 'Dụ', note: '', status: 'Giao hàng' },
    { id: 7, customer: 'Điệu CL', deliveryDate: '3/6', qty: 2000, material: 'Cotton ngà', widthR: 16, widthD: 67, widthKho: 100, widthKhoe: 134, area: 1.7, finishing: 'Gấp 2 đầu', inCharge: 'Thảo', note: '', status: 'Chờ in' },
];

const PAPER_SIZES_PROD = [
    { name: '65x43 cm', l: 650, w: 430 },
    { name: '54.5x39.5 cm', l: 545, w: 395 },
    { name: '39.5x36 cm', l: 395, w: 360 },
    { name: '43x32.5 cm', l: 430, w: 325 },
];

const PAPER_MOCK = [
    { id: 'P001', customer: 'Anh Tú Cường An', product: 'Thẻ bài', cardL: 60, cardW: 40, qty: 10000, paperType: '65x43 cm', gridCount: 65, sheetCount: 154, status: 'Đang in' },
    { id: 'P002', customer: 'Shop Fashion ABC', product: 'Hangtag quần áo', cardL: 55, cardW: 85, qty: 5000, paperType: '54.5x39.5 cm', gridCount: 20, sheetCount: 250, status: 'Cán/Ép' },
    { id: 'P003', customer: 'Cty Minibebe', product: 'Nhãn thùng', cardL: 100, cardW: 70, qty: 2000, paperType: '65x43 cm', gridCount: 21, sheetCount: 95, status: 'Hoàn tất' },
];

// ==================== FABRIC TAB ====================
function FabricTab() {
    const [rows, setRows] = useState(FABRIC_MOCK);
    const [search, setSearch] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [form, setForm] = useState({ customer: '', deliveryDate: '', qty: '', material: 'Satin trắng bóng 1 mặt', widthR: '', widthD: '', widthKho: 200, finishing: 'Gấp đôi', inCharge: '', note: '' });

    const filtered = rows.filter(r => r.customer.toLowerCase().includes(search.toLowerCase()));
    const area = form.widthR && form.widthD && form.widthKho ? Math.round((+form.widthKho / +form.widthR) * 10) / 10 : 0;
    const widthKhoe = form.qty && form.widthR ? Math.round((+form.qty * +form.widthD) / +form.widthKho * 10) / 10 : 0;

    const handleAdd = () => {
        setRows([...rows, { id: Date.now(), ...form, qty: +form.qty, widthR: +form.widthR, widthD: +form.widthD, widthKho: +form.widthKho, widthKhoe, area, status: 'Chờ in' }]);
        setAddOpen(false);
        setForm({ customer: '', deliveryDate: '', qty: '', material: 'Satin trắng bóng 1 mặt', widthR: '', widthD: '', widthKho: 200, finishing: 'Gấp đôi', inCharge: '', note: '' });
    };

    const changeStatus = (id, newStatus) => setRows(rows.map(r => r.id === id ? { ...r, status: newStatus } : r));

    const stats = FABRIC_STATUSES.map(s => ({ ...s, count: rows.filter(r => r.status === s.value).length })).filter(s => s.count > 0);

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm khách hàng..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
                </div>
                <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 whitespace-nowrap">
                    <Plus size={16} /> Thêm mã in
                </button>
            </div>

            {/* Status summary pills */}
            <div className="flex flex-wrap gap-2 mb-4">
                {stats.map(s => (
                    <span key={s.value} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                        {s.label}: {s.count}
                    </span>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['#','Khách hàng','Ngày TH','SL (cái)','Chất liệu','R (mm)','D (mm)','Khổ','Khổe','S cuộn','Gia công','P.Trách','Ghi chú','Trạng thái'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 text-xs whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, idx) => (
                                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{row.customer}</td>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.deliveryDate}</td>
                                    <td className="px-4 py-3 text-right font-medium">{row.qty.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${row.material.includes('Cotton') ? 'bg-orange-50 text-orange-700' : row.material.includes('2 mặt') ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {row.material}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">{row.widthR}</td>
                                    <td className="px-4 py-3 text-right">{row.widthD}</td>
                                    <td className="px-4 py-3 text-right">{row.widthKho}</td>
                                    <td className="px-4 py-3 text-right font-medium text-blue-700">{row.widthKhoe?.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{row.area}</td>
                                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.finishing}</td>
                                    <td className="px-4 py-3 text-slate-600">{row.inCharge}</td>
                                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[80px] truncate">{row.note}</td>
                                    <td className="px-4 py-3">
                                        <StatusDropdown
                                            status={row.status}
                                            statuses={FABRIC_STATUSES}
                                            onChange={val => changeStatus(row.id, val)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {addOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-800">Thêm mã in vải mới</h3>
                            <button onClick={() => setAddOpen(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            {[['Khách hàng','customer','text'],['Ngày trả hàng','deliveryDate','text'],['Số lượng (cái)','qty','number'],['Chiều R (mm)','widthR','number'],['Chiều D (mm)','widthD','number'],['Khổ vải (mm)','widthKho','number'],['Phụ trách','inCharge','text'],['Ghi chú','note','text']].map(([label, key, type]) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                                    <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Chất liệu</label>
                                <select value={form.material} onChange={e => setForm({...form, material: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
                                    {['Satin trắng bóng 1 mặt','Satin trắng bóng 2 mặt','Satin trắng không bóng 1 mặt','Satin trắng không bóng 2 mặt','Cotton ngà','Vải giấy'].map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Gia công</label>
                                <select value={form.finishing} onChange={e => setForm({...form, finishing: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
                                    {['Gấp đôi','Gấp 2 đầu','Cắt rời','Nguyên cuộn'].map(f => <option key={f}>{f}</option>)}
                                </select>
                            </div>
                            {area > 0 && (
                                <div className="col-span-2 bg-blue-50 rounded-xl p-3 text-sm">
                                    <span className="text-blue-500">Số cuộn: </span><strong>{area}</strong>
                                    <span className="text-blue-500 ml-4">Khổe: </span><strong>{widthKhoe} mm</strong>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-slate-600 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">Hủy</button>
                            <button onClick={handleAdd} className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium">Thêm vào bảng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== PAPER TAB ====================
function PaperTab() {
    const [rows, setRows] = useState(PAPER_MOCK);
    const [addOpen, setAddOpen] = useState(false);
    const [form, setForm] = useState({ customer: '', product: '', cardL: '', cardW: '', qty: '', paperType: '65x43 cm', gripper: 1.5 });

    const MARGIN_LR = 2, MARGIN_TOP = 2, GRIPPER_MM = 10;
    const PAPERS_DEF = { '65x43 cm': { l: 650, w: 430 }, '54.5x39.5 cm': { l: 545, w: 395 }, '39.5x36 cm': { l: 395, w: 360 }, '43x32.5 cm': { l: 430, w: 325 } };

    const calcGrid = (cardL, cardW, paperName) => {
        const p = PAPERS_DEF[paperName];
        if (!p || !cardL || !cardW) return { gridCount: 0, sheetCount: 0 };
        const ul = p.l - MARGIN_LR * 2, uw = p.w - MARGIN_TOP - GRIPPER_MM;
        const cL = cardL, cW = cardW;
        const r1 = Math.floor(ul / cL) * Math.floor(uw / cW);
        const r2 = Math.floor(ul / cW) * Math.floor(uw / cL);
        const gridCount = Math.max(r1, r2, 1);
        const sheetCount = Math.ceil((+form.qty || 0) / gridCount) + 5;
        return { gridCount, sheetCount };
    };

    const { gridCount: previewGrid, sheetCount: previewSheet } = calcGrid(+form.cardL, +form.cardW, form.paperType);

    const handleAdd = () => {
        const { gridCount, sheetCount } = calcGrid(+form.cardL, +form.cardW, form.paperType);
        setRows([...rows, { id: `P${Date.now()}`, ...form, cardL: +form.cardL, cardW: +form.cardW, qty: +form.qty, gridCount, sheetCount, status: 'Chờ in' }]);
        setAddOpen(false);
    };

    const changeStatus = (id, newStatus) => setRows(rows.map(r => r.id === id ? { ...r, status: newStatus } : r));

    const stats = PAPER_STATUSES.map(s => ({ ...s, count: rows.filter(r => r.status === s.value).length })).filter(s => s.count > 0);

    return (
        <div>
            <div className="flex gap-3 mb-4">
                <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
                    <Plus size={16} /> Thêm lệnh in giấy
                </button>
            </div>

            {/* Status summary */}
            <div className="flex flex-wrap gap-2 mb-4">
                {stats.map(s => (
                    <span key={s.value} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
                        {s.label}: {s.count}
                    </span>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                {['Mã','Khách hàng','Sản phẩm','Kích thước','SL in','Khổ giấy','Bát/tờ','Số tờ cần','Trạng thái'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 font-semibold text-slate-500 text-xs whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{row.id}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-800">{row.customer}</td>
                                    <td className="px-4 py-3 text-slate-600">{row.product}</td>
                                    <td className="px-4 py-3 text-right text-slate-600">{row.cardL}×{row.cardW} mm</td>
                                    <td className="px-4 py-3 text-right font-medium">{row.qty.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md font-medium">{row.paperType}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-blue-700">{row.gridCount}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{row.sheetCount}</td>
                                    <td className="px-4 py-3">
                                        <StatusDropdown
                                            status={row.status}
                                            statuses={PAPER_STATUSES}
                                            onChange={val => changeStatus(row.id, val)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {addOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-800">Thêm lệnh in giấy</h3>
                            <button onClick={() => setAddOpen(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[['Khách hàng','customer','text'],['Tên sản phẩm','product','text'],['Dài thẻ (mm)','cardL','number'],['Rộng thẻ (mm)','cardW','number'],['Số lượng in','qty','number']].map(([l,k,t]) => (
                                    <div key={k}>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">{l}</label>
                                        <input type={t} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Khổ giấy</label>
                                    <select value={form.paperType} onChange={e => setForm({...form, paperType: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
                                        {Object.keys(PAPERS_DEF).map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            {previewGrid > 0 && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm">
                                    <p className="font-semibold text-emerald-800 mb-2">Kết quả tính toán (lề 2mm×3 + nhíp 10mm)</p>
                                    <div className="flex gap-6">
                                        <div><span className="text-slate-500">Số bát/tờ:</span> <strong className="text-blue-700">{previewGrid}</strong></div>
                                        <div><span className="text-slate-500">Số tờ cần in:</span> <strong className="text-emerald-700">{previewSheet}</strong></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Hủy</button>
                            <button onClick={handleAdd} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Thêm lệnh in</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== MAIN ====================
export default function Production() {
    const [tab, setTab] = useState('fabric');

    const TABS = [
        { id: 'fabric', label: 'In Vải / Mác', icon: Shirt },
        { id: 'paper', label: 'In Giấy', icon: Printer },
    ];

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <Factory className="text-blue-600" size={28} /> Quản lý Sản xuất
                </h1>
                <p className="text-slate-500 text-sm mt-1">Theo dõi tiến độ theo từng giai đoạn sản xuất</p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {tab === 'fabric' ? <FabricTab /> : <PaperTab />}
        </div>
    );
}
