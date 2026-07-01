import React, { useState, useEffect } from 'react';
import { Wallet, Search, Plus, ArrowUpRight, ArrowDownRight, Download, X, CheckCircle } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { appendDataToSheet, getDataFromSheet, updateDataInSheet } from '../services/api';

export default function Cashbook() {
    const [transactions, setTransactions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [fullOrdersData, setFullOrdersData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('income'); // 'income' or 'expense'
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        category: 'Thu tiền khách hàng',
        orderLink: '',
        partnerName: '',
        partnerPhone: '',
        partnerAddress: '',
        itemName: '',
        qty: 1,
        unitPrice: 0,
        paidAmount: 0,
        note: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resTrans, resOrders] = await Promise.all([
                getDataFromSheet('Transactions'),
                getDataFromSheet('Orders')
            ]);
            
            if (resTrans.status === 'success' && resTrans.data) {
                const mapped = resTrans.data.map(row => {
                    const typeRaw = row[2] ? row[2].toString().toLowerCase() : '';
                    const isThu = typeRaw.includes('thu') || typeRaw.includes('income');
                    const paidAmount = Number(row[11]) || 0; 
                    return {
                        id: row[0] || '...',
                        date: row[1] ? row[1].substring(0, 10) : '',
                        typeRaw: typeRaw,
                        type: isThu ? 'Thu' : 'Chi',
                        category: row[3] || '',
                        partner: row[4] || '',
                        amount: paidAmount,
                        orderLink: row[13] || '',
                        note: row[14] || ''
                    };
                }).reverse(); 
                setTransactions(mapped);
            }

            if (resOrders.status === 'success' && resOrders.data) {
                setFullOrdersData(resOrders.data);
                const orderList = resOrders.data
                    .map(row => row[0])
                    .filter(id => id && id.toString().trim() !== '' && id !== 'Mã Đơn');
                setOrders(orderList.reverse()); // Đơn mới lên trên
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (type) => {
        setModalType(type);
        setFormData({
            category: type === 'income' ? 'Thu tiền khách hàng' : 'Vật tư / Gia công',
            orderLink: '',
            partnerName: '',
            partnerPhone: '',
            partnerAddress: '',
            itemName: '',
            qty: 1,
            unitPrice: 0,
            paidAmount: 0,
            note: ''
        });
        setIsModalOpen(true);
    };

    const handleExport = () => {
        const headers = ["Ngày", "Mã Phiếu", "Loại", "Hạng Mục", "Đối Tác", "Số Tiền", "Liên Kết Đơn", "Ghi Chú"];
        const rows = transactions.map(t => [t.date, t.id, t.type, t.category, t.partner, t.amount, t.orderLink, t.note]);
        exportToCSV("SoThuChi_Export", [headers, ...rows]);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const prefix = modalType === 'income' ? 'PT' : 'PC';
            const newId = `${prefix}${(Math.floor(Math.random()*1000)).toString().padStart(3, '0')}`;
            const dateStr = new Date().toLocaleDateString();
            
            const q = Number(formData.qty) || 1;
            const up = Number(formData.unitPrice) || 0;
            const totalAmt = q * up;
            const paidAmt = Number(formData.paidAmount) || 0;
            const debtAmt = totalAmt - paidAmt;

            const newRow = [
                newId,
                dateStr,
                modalType, 
                formData.category,
                formData.partnerName,
                formData.partnerPhone, 
                formData.partnerAddress, 
                formData.itemName, 
                q,  
                up, 
                totalAmt, 
                paidAmt, 
                debtAmt, 
                formData.orderLink, 
                formData.note 
            ];
            
            const res = await appendDataToSheet('Transactions', newRow);
            if (res.status === 'success') {
                if (modalType === 'income' && formData.orderLink) {
                    const orderRow = fullOrdersData.find(r => r[0] === formData.orderLink);
                    if (orderRow) {
                        const updatedRow = [...orderRow];
                        updatedRow[13] = (Number(updatedRow[13]) || 0) + paidAmt; // Tạm ứng
                        updatedRow[14] = (Number(updatedRow[12]) || 0) - updatedRow[13]; // Còn lại PTT
                        await updateDataInSheet('Orders', formData.orderLink, updatedRow);
                    }
                }
                
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

    const filtered = transactions.filter(t => 
        t.partner.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.orderLink || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalThu = transactions.filter(t => t.type === 'Thu').reduce((sum, t) => sum + t.amount, 0);
    const totalChi = transactions.filter(t => t.type === 'Chi').reduce((sum, t) => sum + t.amount, 0);
    
    const isIncome = modalType === 'income';

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Wallet className="text-emerald-600" /> Sổ Quỹ Thu Chi
                </h1>
                <div className="flex gap-3">
                    <button onClick={() => openModal('income')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 shadow-sm transition-colors">
                        <Plus size={18} /> Lập phiếu thu
                    </button>
                    <button onClick={() => openModal('expense')} className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-red-600 shadow-sm transition-colors">
                        <Plus size={18} /> Lập phiếu chi
                    </button>
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
                        <Download size={18} /> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="text-emerald-800 font-semibold mb-2 flex items-center gap-2">
                        <ArrowDownRight size={18} /> Tổng Thu
                    </div>
                    <div className="text-3xl font-black text-emerald-700">{totalThu.toLocaleString()} đ</div>
                </div>
                <div className="bg-red-50 rounded-2xl p-6 border border-red-100 shadow-sm">
                    <div className="text-red-800 font-semibold mb-2 flex items-center gap-2">
                        <ArrowUpRight size={18} /> Tổng Chi
                    </div>
                    <div className="text-3xl font-black text-red-600">{totalChi.toLocaleString()} đ</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                    <div className="text-blue-800 font-semibold mb-2">Tồn Quỹ Hiện Tại</div>
                    <div className="text-3xl font-black text-blue-700">{(totalThu - totalChi).toLocaleString()} đ</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm phiếu thu/chi, đối tác, đơn hàng..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
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
                                <th className="p-4">Ngày / Mã</th>
                                <th className="p-4">Hạng mục</th>
                                <th className="p-4">Đối tượng</th>
                                <th className="p-4 text-center">Liên kết Đơn</th>
                                <th className="p-4 text-right">Thu</th>
                                <th className="p-4 text-right">Chi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Không có dữ liệu sổ quỹ.</td>
                                </tr>
                            ) : filtered.map((t, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{t.id}</div>
                                        <div className="text-xs text-slate-500">{t.date}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-700">{t.category}</div>
                                        <div className="text-xs text-slate-500 max-w-[200px] truncate" title={t.note}>{t.note}</div>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700">{t.partner}</td>
                                    <td className="p-4 text-center">
                                        {t.orderLink ? (
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold border border-slate-200">
                                                {t.orderLink}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-right font-bold text-emerald-600">
                                        {t.type === 'Thu' ? `+${t.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="p-4 text-right font-bold text-red-500">
                                        {t.type === 'Chi' ? `-${t.amount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Lập Phiếu Advanced */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8 animate-in zoom-in-95">
                        <div className={`p-5 border-b border-slate-100 flex justify-between items-center ${isIncome ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                            <h3 className="font-bold text-lg">Tạo Phiếu Mới</h3>
                            <button onClick={() => setIsModalOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Dòng 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Loại phiếu</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 bg-slate-50"
                                        value={modalType}
                                        disabled
                                    >
                                        <option value="income">Thu tiền / Nhận cọc</option>
                                        <option value="expense">Chi tiền / Nhập hàng từ NCC</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Hạng mục</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                                        value={formData.category}
                                        onChange={e => setFormData({...formData, category: e.target.value})}
                                    >
                                        {isIncome ? (
                                            <>
                                                <option>Thu tiền khách hàng</option>
                                                <option>Thu nợ</option>
                                                <option>Khác</option>
                                            </>
                                        ) : (
                                            <>
                                                <option>Vật tư / Gia công</option>
                                                <option>Thanh toán NCC</option>
                                                <option>Chi phí VP</option>
                                                <option>Lương NV</option>
                                                <option>Ship</option>
                                                <option>Khác</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-emerald-700 mb-1">Liên kết Đơn hàng báo giá (NẾU CÓ)</label>
                                    <select 
                                        className="w-full border-2 border-emerald-500 rounded-lg p-2.5 outline-none bg-emerald-50 text-emerald-800"
                                        value={formData.orderLink}
                                        onChange={e => setFormData({...formData, orderLink: e.target.value})}
                                    >
                                        <option value="">-- Không gắn với đơn hàng nào --</option>
                                        {orders.map(o => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Section Đối tác */}
                            <div>
                                <h4 className="text-md font-bold text-slate-800 mb-3 border-b pb-2">
                                    Thông tin {isIncome ? 'Khách hàng' : 'Nhà cung cấp'}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tên {isIncome ? 'khách hàng' : 'nhà cung cấp'}</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                                            value={formData.partnerName}
                                            onChange={e => setFormData({...formData, partnerName: e.target.value})}
                                            placeholder={isIncome ? 'Tên khách hàng...' : 'Tên xưởng / Đại lý...'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại {isIncome ? 'KH' : 'NCC'}</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                                            value={formData.partnerPhone}
                                            onChange={e => setFormData({...formData, partnerPhone: e.target.value})}
                                            placeholder="09xx..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ {isIncome ? 'KH' : 'NCC'}</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                                        value={formData.partnerAddress}
                                        onChange={e => setFormData({...formData, partnerAddress: e.target.value})}
                                        placeholder="Nhập địa chỉ..."
                                    />
                                </div>
                            </div>

                            {/* Section Hàng hóa */}
                            <div>
                                <h4 className="text-md font-bold text-slate-800 mb-3 border-b pb-2">Chi tiết Hàng hóa / Dịch vụ</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mặt hàng / Dịch vụ</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                                            value={formData.itemName}
                                            onChange={e => setFormData({...formData, itemName: e.target.value})}
                                            placeholder="VD: In hộp, Mua giấy C300..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng</label>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                                            value={formData.qty}
                                            onChange={e => setFormData({...formData, qty: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn giá (đ)</label>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500"
                                            value={formData.unitPrice}
                                            onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng tiền (đ)</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-700"
                                            value={(Number(formData.qty) * Number(formData.unitPrice)).toLocaleString()}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section Thanh toán */}
                            <div>
                                <h4 className="text-md font-bold text-slate-800 mb-3 border-b pb-2">Thanh toán & Ghi chú</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Đã thanh toán ({isIncome ? 'Thu KH' : 'Trả NCC'})</label>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500 font-bold text-emerald-700"
                                            value={formData.paidAmount}
                                            onChange={e => setFormData({...formData, paidAmount: e.target.value})}
                                            placeholder="Nhập số tiền đã trả..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                                        <input 
                                            type="text"
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-emerald-500" 
                                            value={formData.note}
                                            onChange={e => setFormData({...formData, note: e.target.value})}
                                            placeholder="Chi tiết (ví dụ: Số tài khoản, nội dung...)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                                {isSaving ? 'Đang lưu...' : 'Lưu Giao Dịch'}
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors">
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
