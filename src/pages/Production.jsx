import React, { useState, useRef, useEffect } from 'react';
import { Factory, Printer, Shirt, Check, ChevronDown, RefreshCw } from 'lucide-react';
import { getDataFromSheet, updateDataInSheet } from '../services/api';

// ==================== STATUS DEFINITIONS ====================
const FABRIC_STATUSES = [
    { value: 'Chờ duyệt',   label: 'Chờ duyệt',   color: 'bg-slate-100 text-slate-600',    dot: '#94a3b8' },
    { value: 'Chờ in',      label: 'Chờ in',      color: 'bg-slate-100 text-slate-600',    dot: '#94a3b8' },
    { value: 'Đang in',     label: 'Đang in',     color: 'bg-amber-100 text-amber-700',    dot: '#f59e0b' },
    { value: 'Hoàn thiện',  label: 'Hoàn thiện',  color: 'bg-blue-100 text-blue-700',      dot: '#3b82f6' },
    { value: 'Đóng gói',    label: 'Đóng gói',    color: 'bg-purple-100 text-purple-700',  dot: '#8b5cf6' },
    { value: 'Giao hàng',   label: 'Giao hàng',   color: 'bg-indigo-100 text-indigo-700',  dot: '#6366f1' },
    { value: 'Hoàn tất',    label: 'Hoàn tất',    color: 'bg-emerald-100 text-emerald-700',dot: '#10b981' },
    { value: 'Lỗi',         label: 'Lỗi / Cần xử lý', color: 'bg-red-100 text-red-700',   dot: '#ef4444' },
];

const PAPER_STATUSES = [
    { value: 'Chờ duyệt',   label: 'Chờ duyệt',   color: 'bg-slate-100 text-slate-600',    dot: '#94a3b8' },
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

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('vi-VN');
    } catch {
        return dateStr;
    }
};

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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:opacity-80 ${cfg?.color || 'bg-slate-100 text-slate-700'}`}
            >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg?.dot || '#94a3b8' }} />
                {status || cfg?.label || 'Không rõ'}
                <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 top-full mt-1.5 right-0 bg-white rounded-xl shadow-xl border border-slate-100 py-1 min-w-[160px]">
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

function FabricTab({ data, updateStatus, search }) {
    const filtered = data.filter(r => (r[4]||'').toLowerCase().includes(search.toLowerCase()) || (r[0]||'').toLowerCase().includes(search.toLowerCase()));
    
    return (
        <div className="card p-0 overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1200px]">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 border-r border-slate-100">Mã ĐH</th>
                            <th className="px-4 py-3 border-r border-slate-100">Khách hàng</th>
                            <th className="px-4 py-3 border-r border-slate-100">Ngày trả hàng</th>
                            <th className="px-4 py-3 text-right border-r border-slate-100">Số lượng (cái)</th>
                            <th className="px-4 py-3 border-r border-slate-100">Chất liệu</th>
                            <th className="px-4 py-3 text-right border-r border-slate-100">Rộng (mm)</th>
                            <th className="px-4 py-3 text-right border-r border-slate-100">Dài (mm)</th>
                            <th className="px-4 py-3 text-right border-r border-slate-100">Khổ Vải (mm)</th>
                            <th className="px-4 py-3 text-right border-r border-slate-100">Số Mã</th>
                            <th className="px-4 py-3 text-right border-r border-slate-100">Số cuộn</th>
                            <th className="px-4 py-3 border-r border-slate-100">Gia công</th>
                            <th className="px-4 py-3 border-r border-slate-100">Phụ trách</th>
                            <th className="px-4 py-3 border-r border-slate-100">Ghi chú</th>
                            <th className="px-4 py-3 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filtered.length === 0 && <tr><td colSpan="14" className="p-8 text-center text-slate-500">Không có lệnh sản xuất nào</td></tr>}
                        {filtered.map((row) => (
                            <tr key={row[0]} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-600 border-r border-slate-50">{row[0]}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap border-r border-slate-50">{row[4]}</td>
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap border-r border-slate-50">{formatDate(row[1])}</td>
                                <td className="px-4 py-3 text-right font-medium border-r border-slate-50">{Number(row[10]).toLocaleString('vi-VN')}</td>
                                <td className="px-4 py-3 border-r border-slate-50">
                                    <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600 whitespace-pre-wrap block max-w-[150px]">{row[8]}</span>
                                </td>
                                <td className="px-4 py-3 text-right border-r border-slate-50">{row[19]}</td>
                                <td className="px-4 py-3 text-right border-r border-slate-50">{row[20]}</td>
                                <td className="px-4 py-3 text-right border-r border-slate-50">{row[21]}</td>
                                <td className="px-4 py-3 text-right font-medium text-blue-700 border-r border-slate-50">{row[22]}</td>
                                <td className="px-4 py-3 text-right text-slate-600 border-r border-slate-50">{row[23]}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-pre-wrap border-r border-slate-50 text-xs">{row[16]}</td>
                                <td className="px-4 py-3 text-slate-600 border-r border-slate-50 text-xs">-</td>
                                <td className="px-4 py-3 text-slate-400 text-xs max-w-[150px] truncate border-r border-slate-50" title={row[17]}>{row[17]}</td>
                                <td className="px-4 py-3 text-center">
                                    <StatusDropdown status={row[18]} statuses={FABRIC_STATUSES} onChange={val => updateStatus(row[0], val)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PaperTab({ data, updateStatus, search }) {
    const filtered = data.filter(r => (r[4]||'').toLowerCase().includes(search.toLowerCase()) || (r[0]||'').toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="card p-0 overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 border-r border-slate-100">Mã ĐH</th>
                            <th className="px-4 py-3 border-r border-slate-100">Khách hàng</th>
                            <th className="px-4 py-3 border-r border-slate-100">Tên sản phẩm</th>
                            <th className="px-4 py-3 border-r border-slate-100">Chất liệu</th>
                            <th className="px-4 py-3 border-r border-slate-100">Kích thước</th>
                            <th className="px-4 py-3 text-right border-r border-slate-100">S.Lượng in</th>
                            <th className="px-4 py-3 border-r border-slate-100">Quy cách & Gia công</th>
                            <th className="px-4 py-3 border-r border-slate-100">Ghi chú</th>
                            <th className="px-4 py-3 text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filtered.length === 0 && <tr><td colSpan="9" className="p-8 text-center text-slate-500">Không có lệnh sản xuất nào</td></tr>}
                        {filtered.map((row) => (
                            <tr key={row[0]} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-600 border-r border-slate-50">{row[0]}</td>
                                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap border-r border-slate-50">{row[4]}</td>
                                <td className="px-4 py-3 text-slate-700 whitespace-pre-wrap max-w-[200px] border-r border-slate-50">{row[7]}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-pre-wrap border-r border-slate-50"><span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600">{row[8]}</span></td>
                                <td className="px-4 py-3 text-slate-600 whitespace-pre-wrap border-r border-slate-50">{row[9]}</td>
                                <td className="px-4 py-3 text-right font-medium border-r border-slate-50">{Number(row[10]).toLocaleString('vi-VN')}</td>
                                <td className="px-4 py-3 text-slate-600 whitespace-pre-wrap border-r border-slate-50 text-xs">{(row[15] + '\n' + row[16]).trim()}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs max-w-[150px] truncate border-r border-slate-50" title={row[17]}>{row[17]}</td>
                                <td className="px-4 py-3 text-center">
                                    <StatusDropdown status={row[18]} statuses={PAPER_STATUSES} onChange={val => updateStatus(row[0], val)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function Production() {
    const [tab, setTab] = useState('fabric');
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const loadOrders = async () => {
        setIsLoading(true);
        try {
            const res = await getDataFromSheet('Orders');
            if (res.status === 'success') {
                // Sắp xếp đơn mới lên đầu
                setOrders(res.data.reverse());
            }
        } catch (e) {
            console.error("Lỗi lấy lệnh sản xuất:", e);
        }
        setIsLoading(false);
    };

    useEffect(() => { loadOrders(); }, []);

    const updateStatus = async (orderId, newStatus) => {
        const orderToUpdate = orders.find(o => o[0] === orderId);
        if (!orderToUpdate) return;
        
        const updatedRow = [...orderToUpdate];
        updatedRow[18] = newStatus;

        // Cập nhật giao diện lập tức (Optimistic update)
        setOrders(orders.map(o => o[0] === orderId ? updatedRow : o));

        try {
            await updateDataInSheet('Orders', orderId, updatedRow);
        } catch (e) {
            alert('Lỗi cập nhật trạng thái');
            loadOrders(); // Revert back
        }
    };

    const isFabric = (material = '', productName = '') => {
        const lowerMat = String(material).toLowerCase();
        const lowerProd = String(productName).toLowerCase();
        return lowerMat.includes('satin') || lowerMat.includes('cotton') || lowerMat.includes('vải giấy') || lowerMat.includes('vải') || lowerMat.includes('mác') || lowerProd.includes('mác') || lowerProd.includes('vải');
    };

    // Chỉ lấy những đơn chưa Hoàn tất hoặc mới Hoàn tất gần đây (hoặc lấy tất cả, hiện tại lấy tất cả)
    const fabricOrders = orders.filter(o => isFabric(o[8], o[7]));
    const paperOrders = orders.filter(o => !isFabric(o[8], o[7]));

    const TABS = [
        { id: 'fabric', label: 'In Vải / Mác', icon: Shirt, count: fabricOrders.length },
        { id: 'paper', label: 'In Giấy', icon: Printer, count: paperOrders.length },
    ];

    return (
        <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Factory className="text-blue-600" size={28} /> Quản lý Sản xuất
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi và cập nhật tiến độ sản xuất từ Đơn hàng thực tế</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Tìm khách hàng, mã ĐH..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 w-full sm:w-64"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                    </div>
                    <button onClick={loadOrders} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors" title="Làm mới dữ liệu">
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl w-fit gap-1 overflow-x-auto max-w-full">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center whitespace-nowrap gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                        <t.icon size={16} /> {t.label}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>{t.count}</span>
                    </button>
                ))}
            </div>

            {isLoading && orders.length === 0 ? (
                <div className="flex justify-center items-center h-64 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <RefreshCw className="animate-spin mr-2" size={20} /> Đang tải dữ liệu sản xuất...
                </div>
            ) : (
                tab === 'fabric' ? <FabricTab data={fabricOrders} updateStatus={updateStatus} search={search} /> : <PaperTab data={paperOrders} updateStatus={updateStatus} search={search} />
            )}
        </div>
    );
}
