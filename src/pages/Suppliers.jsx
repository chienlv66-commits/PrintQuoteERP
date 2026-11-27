import React, { useState, useEffect } from 'react';
import { Factory, Search, Plus, Download, X, CheckCircle } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { getDataFromSheet, appendDataToSheet } from '../services/api';
import SupplierExpenseFields from '../components/SupplierExpenseFields';
import {
    createEmptySupplierEntry,
    buildSupplierTransactionRow,
    parseSuppliersFromTransactions,
} from '../utils/supplierHelpers';

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState(createEmptySupplierEntry);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resTrans, resOrders] = await Promise.all([
                getDataFromSheet('Transactions'),
                getDataFromSheet('Orders'),
            ]);

            if (resTrans.status === 'success' && resTrans.data) {
                setSuppliers(parseSuppliersFromTransactions(resTrans.data));
            }

            if (resOrders.status === 'success' && resOrders.data) {
                const orderList = resOrders.data
                    .filter(row => row[0] && row[0].toString().trim() !== '' && row[0] !== 'Mã Đơn')
                    .map(row => ({
                        id: String(row[0]).trim(),
                        customer: String(row[4] || '').trim(),
                        product: String(row[7] || '').trim(),
                        total: Number(row[12]) || 0,
                    }));
                setOrders(orderList.reverse());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ['Nhà Cung Cấp', 'Danh mục', 'SĐT', 'Tổng Nhập', 'Đã Thanh Toán', 'Công Nợ', 'Giao Dịch Gần Nhất', 'Địa Chỉ'];
        const rows = suppliers.map(s => [
            s.name, s.category, s.phone, s.totalBought, s.totalPaid, s.totalDebt,
            s.lastTransDate ? String(s.lastTransDate).substring(0, 10) : '', s.address,
        ]);
        exportToCSV('NhaCungCap_Export', [headers, ...rows]);
    };

    const openAddModal = () => {
        setFormData(createEmptySupplierEntry());
        setIsModalOpen(true);
    };

    const handleSaveSupplier = async () => {
        if (!String(formData.name ?? '').trim()) {
            alert('Vui lòng nhập tên Nhà cung cấp');
            return;
        }

        setIsSaving(true);
        try {
            const newRow = buildSupplierTransactionRow(formData);
            const res = await appendDataToSheet('Transactions', newRow);
            if (res.status === 'success') {
                setIsModalOpen(false);
                setFormData(createEmptySupplierEntry());
                fetchData();
            } else {
                alert('Lỗi: ' + res.message);
            }
        } catch (err) {
            alert('Lỗi kết nối: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const filtered = suppliers.filter(s =>
        String(s.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.category ?? '').toLowerCase().includes(searchTerm.toLowerCase())
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
                    <button onClick={openAddModal} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-700 shadow-sm transition-colors">
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
                                    <td className="p-4 text-slate-500 text-sm">{s.lastTransDate ? String(s.lastTransDate).substring(0, 10) : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Thêm NCC */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="bg-amber-50 p-5 border-b border-amber-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-amber-900">Thêm Nhà Cung Cấp</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-amber-700 hover:text-amber-900 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-5 max-h-[80vh] overflow-y-auto">
                            <SupplierExpenseFields
                                value={formData}
                                onChange={setFormData}
                                suppliers={suppliers}
                                orders={orders}
                                showOrderLink={true}
                            />
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
                            <button onClick={handleSaveSupplier} disabled={isSaving} className="bg-amber-600 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-700 shadow-sm transition-colors disabled:opacity-70">
                                {isSaving ? 'Đang lưu...' : <><CheckCircle size={18} /> Lưu NCC</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
