import React, { useState, useEffect } from 'react';
import { Scale, Search, Filter, Download, ArrowRight, ArrowDownRight, ArrowUpRight, CheckCircle, X } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { getDataFromSheet, appendDataToSheet, updateDataInSheet } from '../services/api';

export default function Debt() {
    const [activeTab, setActiveTab] = useState('phai_thu');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [receivables, setReceivables] = useState([]); // Phải thu (Khách hàng)
    const [payables, setPayables] = useState([]); // Phải trả (Nhà CC)
    const [fullOrdersData, setFullOrdersData] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [payAmount, setPayAmount] = useState(0);
    const [payNote, setPayNote] = useState('');
    const [payOrderLink, setPayOrderLink] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Lấy dữ liệu Đơn hàng (Phải thu)
            const resOrders = await getDataFromSheet('Orders');
            let recMap = {};
            if (resOrders.status === 'success' && resOrders.data) {
                setFullOrdersData(resOrders.data);
                resOrders.data.forEach(order => {
                    const [
                        id, dateStr, user, type, cusName, phone, addr, 
                        prodName, mat, dim, qty, price, total, 
                        deposit, remain, spec, proc, note, status
                    ] = order;

                    const name = (cusName || '').trim();
                    const r = Number(remain) || 0;
                    if (!name || r <= 0) return; // Chỉ lấy người có nợ
                    
                    if (!recMap[name]) {
                        recMap[name] = {
                            id: `KH-${Object.keys(recMap).length + 1}`,
                            partner: name,
                            type: 'Khách hàng',
                            totalDebt: 0,
                            lastUpdate: dateStr || '',
                            relatedOrders: []
                        };
                    }
                    recMap[name].totalDebt += r;
                    recMap[name].relatedOrders.push(id);
                    if (new Date(dateStr) > new Date(recMap[name].lastUpdate)) {
                        recMap[name].lastUpdate = dateStr;
                    }
                });
            }

            // Lấy dữ liệu Thu Chi (Phải trả Nhà CC)
            const resTrans = await getDataFromSheet('Transactions');
            let payMap = {};
            if (resTrans.status === 'success' && resTrans.data) {
                resTrans.data.forEach(row => {
                    const typeRaw = row[2] ? row[2].toString().toLowerCase() : '';
                    if (!typeRaw.includes('chi') && !typeRaw.includes('expense')) return;

                    const name = (row[4] || '').trim();
                    const debtVal = Number(row[12]) || 0; // Còn lại
                    if (!name || debtVal <= 0) return;

                    if (!payMap[name]) {
                        payMap[name] = {
                            id: `NCC-${Object.keys(payMap).length + 1}`,
                            partner: name,
                            type: 'Nhà cung cấp',
                            totalDebt: 0,
                            lastUpdate: row[1] || '',
                            relatedOrders: []
                        };
                    }
                    payMap[name].totalDebt += debtVal;
                    if (row[13]) payMap[name].relatedOrders.push(row[13]);
                    if (new Date(row[1]) > new Date(payMap[name].lastUpdate)) {
                        payMap[name].lastUpdate = row[1];
                    }
                });
            }

            setReceivables(Object.values(recMap).sort((a,b) => b.totalDebt - a.totalDebt));
            setPayables(Object.values(payMap).sort((a,b) => b.totalDebt - a.totalDebt));

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ["Khách Hàng/Nhà CC", "Loại", "Tổng Nợ", "Cập Nhật Cuối", "Đơn Liên Quan"];
        const list = activeTab === 'phai_thu' ? receivables : payables;
        const rows = list.map(d => [
            d.partner, d.type, d.totalDebt, 
            d.lastUpdate ? d.lastUpdate.substring(0,10) : '', 
            d.relatedOrders.join(', ')
        ]);
        exportToCSV(`CongNo_${activeTab}`, [headers, ...rows]);
    };

    const openPaymentModal = (debt) => {
        setSelectedDebt(debt);
        setPayAmount(debt.totalDebt);
        setPayNote(`Thanh toán công nợ ${debt.partner}`);
        setPayOrderLink(''); // Default empty
        setIsModalOpen(true);
    };

    const handlePayment = async () => {
        setIsSaving(true);
        try {
            const prefix = activeTab === 'phai_thu' ? 'PT' : 'PC';
            const typeVal = activeTab === 'phai_thu' ? 'income' : 'expense';
            const cat = activeTab === 'phai_thu' ? 'Thu nợ' : 'Thanh toán NCC';
            const newId = `${prefix}${(Math.floor(Math.random()*1000)).toString().padStart(3, '0')}`;
            const dateStr = new Date().toLocaleDateString();
            const amtNum = Number(payAmount) || 0;

            const newRow = [
                newId, dateStr, typeVal, cat, selectedDebt.partner,
                '', '', 'Thanh toán đối trừ công nợ', 1, amtNum, amtNum, amtNum, 0, payOrderLink, payNote
            ];
            
            const res = await appendDataToSheet('Transactions', newRow);
            if (res.status === 'success') {
                if (activeTab === 'phai_thu' && payOrderLink) {
                    const orderRow = fullOrdersData.find(r => r[0] === payOrderLink);
                    if (orderRow) {
                        const updatedRow = [...orderRow];
                        updatedRow[13] = (Number(updatedRow[13]) || 0) + amtNum; // Tạm ứng
                        updatedRow[14] = (Number(updatedRow[12]) || 0) - updatedRow[13]; // Còn lại PTT
                        await updateDataInSheet('Orders', payOrderLink, updatedRow);
                    }
                }
                
                alert(`Đã lập Phiếu ${prefix === 'PT' ? 'Thu' : 'Chi'} và đối trừ công nợ thành công!`);
                setIsModalOpen(false);
                fetchData();
            } else {
                alert("Lỗi: " + res.message);
            }
        } catch (err) {
            alert("Lỗi kết nối: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const currentData = activeTab === 'phai_thu' ? receivables : payables;
    const filtered = currentData.filter(d => d.partner.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const totalReceivable = receivables.reduce((s, c) => s + c.totalDebt, 0);
    const totalPayable = payables.reduce((s, c) => s + c.totalDebt, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Scale className="text-blue-600" /> Quản lý Công Nợ
                </h1>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
                        <Download size={18} /> Xuất Báo Cáo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-2xl p-6 border shadow-sm transition-colors cursor-pointer ${activeTab === 'phai_thu' ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200 hover:bg-blue-50'}`} onClick={() => setActiveTab('phai_thu')}>
                    <div className={`font-semibold mb-2 flex items-center gap-2 ${activeTab === 'phai_thu' ? 'text-blue-100' : 'text-slate-600'}`}>
                        <ArrowDownRight size={18} /> Tổng Phải Thu (Khách hàng)
                    </div>
                    <div className={`text-3xl font-black ${activeTab === 'phai_thu' ? 'text-white' : 'text-blue-600'}`}>{totalReceivable.toLocaleString()} đ</div>
                </div>
                <div className={`rounded-2xl p-6 border shadow-sm transition-colors cursor-pointer ${activeTab === 'phai_tra' ? 'bg-red-500 border-red-500' : 'bg-white border-slate-200 hover:bg-red-50'}`} onClick={() => setActiveTab('phai_tra')}>
                    <div className={`font-semibold mb-2 flex items-center gap-2 ${activeTab === 'phai_tra' ? 'text-red-100' : 'text-slate-600'}`}>
                        <ArrowUpRight size={18} /> Tổng Phải Trả (Nhà cung cấp)
                    </div>
                    <div className={`text-3xl font-black ${activeTab === 'phai_tra' ? 'text-white' : 'text-red-500'}`}>{totalPayable.toLocaleString()} đ</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm đối tác..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4">Đối tác</th>
                                <th className="p-4">Phân loại</th>
                                <th className="p-4 text-right">Tổng Nợ Hiện Tại</th>
                                <th className="p-4">Giao dịch cuối</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">Đang tổng hợp dữ liệu...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">Không có dữ liệu công nợ.</td>
                                </tr>
                            ) : filtered.map((d, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{d.partner}</div>
                                        <div className="text-xs text-slate-400 mt-1 max-w-[250px] truncate" title={d.relatedOrders.join(', ')}>
                                            Đơn l/q: {d.relatedOrders.join(', ')}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${activeTab === 'phai_thu' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                            {d.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-800">{d.totalDebt.toLocaleString()} đ</td>
                                    <td className="p-4 text-slate-500 text-sm">{d.lastUpdate ? d.lastUpdate.substring(0, 10) : ''}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => openPaymentModal(d)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm flex items-center justify-center gap-1 mx-auto transition-colors">
                                            Lập Phiếu <ArrowRight size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Lập phiếu đối trừ */}
            {isModalOpen && selectedDebt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="bg-blue-50 p-5 border-b border-blue-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-blue-900">Đối Trừ Công Nợ</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-blue-700 hover:text-blue-900 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                <div className="text-sm text-slate-500 mb-1">Đối tác:</div>
                                <div className="font-bold text-lg text-slate-800">{selectedDebt.partner}</div>
                                <div className="flex justify-between mt-3 pt-3 border-t border-slate-200">
                                    <span className="text-sm font-semibold text-slate-600">Tổng Nợ Cần Thanh Toán:</span>
                                    <span className="font-black text-red-500">{selectedDebt.totalDebt.toLocaleString()} đ</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Số tiền thanh toán (đ)</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 font-bold"
                                    value={payAmount}
                                    onChange={e => setPayAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Liên kết Đơn hàng (Nếu có)</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-slate-50"
                                    value={payOrderLink}
                                    onChange={e => setPayOrderLink(e.target.value)}
                                >
                                    <option value="">-- Chọn đơn hàng liên quan --</option>
                                    {selectedDebt.relatedOrders.map((ordId, idx) => (
                                        <option key={idx} value={ordId}>{ordId}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú phiếu</label>
                                <textarea 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 resize-none" 
                                    rows="2"
                                    value={payNote}
                                    onChange={e => setPayNote(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
                            <button onClick={handlePayment} disabled={isSaving || payAmount <= 0} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                {isSaving ? 'Đang lưu...' : <><CheckCircle size={18}/> Xác Nhận Thanh Toán</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
