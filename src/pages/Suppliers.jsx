import React, { useState, useEffect } from 'react';
import { Factory, Search, Plus, Download, X, CheckCircle } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { getDataFromSheet, appendDataToSheet } from '../services/api';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        category: 'In ấn / Gia công',
        productName: '',
        qty: '',
        unitPrice: '',
        paidAmount: '',
        orderLink: '',
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
                const suppMap = {};

                resTrans.data.forEach(row => {
                    const typeRaw = row[2] ? row[2].toString().toLowerCase() : '';
                    if (!typeRaw.includes('chi') && !typeRaw.includes('expense')) return;

                    const name = (row[4] || '').trim();
                    if (!name) return;

                    const phone = row[5] || '';
                    const address = row[6] || '';
                    const cat = row[3] || 'Khác';
                    const totalVal = Number(row[10]) || 0; // Thành tiền
                    const paidVal = Number(row[11]) || 0; // Đã TT
                    const debtVal = Number(row[12]) || 0; // Còn lại

                    if (!suppMap[name]) {
                        suppMap[name] = {
                            name,
                            category: cat,
                            phone,
                            address,
                            totalBought: 0,
                            totalPaid: 0,
                            totalDebt: 0,
                            lastTransDate: row[1] || ''
                        };
                    }

                    suppMap[name].totalBought += totalVal;
                    suppMap[name].totalPaid += paidVal;
                    suppMap[name].totalDebt += debtVal;
                    
                    if (new Date(row[1]) > new Date(suppMap[name].lastTransDate)) {
                        suppMap[name].lastTransDate = row[1];
                    }
                    
                    // Ưu tiên lưu SDT, Địa chỉ nếu dòng trước đó bị trống
                    if (!suppMap[name].phone && phone) suppMap[name].phone = phone;
                    if (!suppMap[name].address && address) suppMap[name].address = address;
                });

                const sorted = Object.values(suppMap).sort((a, b) => b.totalBought - a.totalBought);
                setSuppliers(sorted);
            }

            if (resOrders.status === 'success' && resOrders.data) {
                const orderList = resOrders.data
                    .map(row => row[0])
                    .filter(id => id && id.toString().trim() !== '' && id !== 'Mã Đơn');
                setOrders(orderList.reverse());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ["Nhà Cung Cấp", "Danh mục", "SĐT", "Tổng Nhập", "Đã Thanh Toán", "Công Nợ", "Giao Dịch Gần Nhất", "Địa Chỉ"];
        const rows = suppliers.map(s => [
            s.name, s.category, s.phone, s.totalBought, s.totalPaid, s.totalDebt, 
            s.lastTransDate ? s.lastTransDate.substring(0,10) : '', s.address
        ]);
        exportToCSV("NhaCungCap_Export", [headers, ...rows]);
    };

    const handleSaveSupplier = async () => {
        if (!formData.name) {
            alert("Vui lòng nhập tên Nhà cung cấp");
            return;
        }

        setIsSaving(true);
        try {
            const newId = `PC${(Math.floor(Math.random()*1000)).toString().padStart(3, '0')}`;
            const dateStr = new Date().toLocaleDateString();
            
            const qtyNum = Number(formData.qty) || 1;
            const priceNum = Number(formData.unitPrice) || 0;
            const totalNum = qtyNum * priceNum;
            const paidNum = Number(formData.paidAmount) || 0;
            const debtNum = totalNum - paidNum;

            const newRow = [
                newId, dateStr, 'expense', formData.category, formData.name, 
                formData.phone, formData.address, formData.productName || 'Khởi tạo NCC', 
                qtyNum, priceNum, totalNum, paidNum, debtNum, formData.orderLink, formData.note
            ];
            
            const res = await appendDataToSheet('Transactions', newRow);
            if (res.status === 'success') {
                setIsModalOpen(false);
                setFormData({
                    name: '', phone: '', address: '', category: 'In ấn / Gia công',
                    productName: '', qty: '', unitPrice: '', paidAmount: '', orderLink: '', note: ''
                });
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

    const filtered = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalNCC = suppliers.length;
    const totalDebt = suppliers.reduce((sum, s) => sum + s.totalDebt, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Factory className="text-amber-600" /> Nhà Cung Cấp
                </h1>
                <div className="flex gap-3">
                    <button onClick={() => setIsModalOpen(true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-700 shadow-sm transition-colors">
                        <Plus size={18} /> Thêm Nhà CC
                    </button>
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
                        <Download size={18} /> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm">
                    <div className="text-amber-800 font-semibold mb-2 flex items-center gap-2">Tổng số Nhà cung cấp</div>
                    <div className="text-3xl font-black text-amber-700">{totalNCC}</div>
                </div>
                <div className="bg-red-50 rounded-2xl p-6 border border-red-100 shadow-sm">
                    <div className="text-red-800 font-semibold mb-2 flex items-center gap-2">Tổng Công Nợ Phải Trả</div>
                    <div className="text-3xl font-black text-red-600">{totalDebt.toLocaleString()} đ</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm nhà cung cấp, hạng mục..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-amber-500"
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
                                <th className="p-4">Nhà cung cấp</th>
                                <th className="p-4">Danh mục</th>
                                <th className="p-4 text-right">Tổng chi mua</th>
                                <th className="p-4 text-right">Đã thanh toán</th>
                                <th className="p-4 text-right">Công nợ</th>
                                <th className="p-4">GD Gần nhất</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Đang tổng hợp dữ liệu từ Sổ thu chi...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Chưa có dữ liệu nhà cung cấp.</td>
                                </tr>
                            ) : filtered.map((s, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{s.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{s.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                                            {s.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-700">{s.totalBought.toLocaleString()} đ</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">{s.totalPaid.toLocaleString()} đ</td>
                                    <td className="p-4 text-right font-bold text-red-500">{s.totalDebt > 0 ? `${s.totalDebt.toLocaleString()} đ` : '-'}</td>
                                    <td className="p-4 text-slate-500 text-sm">{s.lastTransDate ? s.lastTransDate.substring(0, 10) : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Thêm NCC */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="bg-amber-50 p-5 border-b border-amber-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-amber-900">Thêm Nhà Cung Cấp</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-amber-700 hover:text-amber-900 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
                            {/* Khung Thông tin Đối tác */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">Thông tin Nhà cung cấp</h3>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Nhà CC *</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                        placeholder="Ví dụ: Công ty Giấy Bãi Bằng..."
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Danh mục</label>
                                        <select 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white"
                                            value={formData.category}
                                            onChange={e => setFormData({...formData, category: e.target.value})}
                                        >
                                            <option value="Vật tư / Gia công">Vật tư / Gia công</option>
                                            <option value="Vận chuyển">Vận chuyển</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                            placeholder="09xx..."
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                        placeholder="Nhập địa chỉ..."
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Khung Chi tiết Hàng hóa / Dịch vụ */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">Chi tiết Hàng hóa / Dịch vụ</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mặt hàng / Dịch vụ</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                            placeholder="VD: Mua giấy C300, Phủ UV..."
                                            value={formData.productName}
                                            onChange={e => setFormData({...formData, productName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng</label>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                            placeholder="1"
                                            value={formData.qty}
                                            onChange={e => setFormData({...formData, qty: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn giá (đ)</label>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                            placeholder="50000"
                                            value={formData.unitPrice}
                                            onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng tiền (đ)</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none bg-slate-200 text-slate-600 font-bold" 
                                            disabled
                                            value={((Number(formData.qty)||1) * (Number(formData.unitPrice)||0)).toLocaleString()}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Khung Thanh toán và Liên kết */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">Thanh toán & Liên kết</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Đã thanh toán (Trả NCC)</label>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                            placeholder="Nhập số tiền đã trả..."
                                            value={formData.paidAmount}
                                            onChange={e => setFormData({...formData, paidAmount: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Liên kết Đơn hàng báo giá (NẾU CÓ)</label>
                                        <select 
                                            className="w-full border-2 border-amber-500 rounded-lg p-2.5 outline-none bg-amber-50 text-amber-800"
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
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                                    <textarea 
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white resize-none" 
                                        rows="2"
                                        placeholder="Chi tiết tài khoản, nội dung chuyển..."
                                        value={formData.note}
                                        onChange={e => setFormData({...formData, note: e.target.value})}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
                            <button onClick={handleSaveSupplier} disabled={isSaving} className="bg-amber-600 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-700 shadow-sm transition-colors disabled:opacity-70">
                                {isSaving ? 'Đang lưu...' : <><CheckCircle size={18}/> Lưu NCC</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
