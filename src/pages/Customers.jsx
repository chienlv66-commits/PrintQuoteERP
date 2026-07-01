import React, { useState, useEffect } from 'react';
import { Users, Search, Download } from 'lucide-react';
import { getDataFromSheet } from '../services/api';
import { exportToCSV } from '../utils/csvExport';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Tính toán Khách hàng từ bảng Orders để luôn đồng bộ
            const resOrders = await getDataFromSheet('Orders');
            if (resOrders.status === 'success' && resOrders.data) {
                const customerMap = {};

                resOrders.data.forEach(order => {
                    const [
                        id, dateStr, user, type, cusName, phone, addr, 
                        prodName, mat, dim, qty, price, total, 
                        deposit, remain, spec, proc, note, status
                    ] = order;

                    const t = Number(total) || 0;
                    const r = Number(remain) || 0;
                    const name = (cusName || '').trim();
                    const sLower = (status || '').toLowerCase();

                    if (!name) return;
                    if (sLower.includes('hủy')) return; // Không tính đơn hủy

                    if (!customerMap[name]) {
                        customerMap[name] = {
                            name,
                            phone: phone || '',
                            type: type || 'ca_nhan',
                            address: addr || '',
                            totalSpent: 0,
                            totalDebt: 0,
                            totalOrders: 0,
                            lastOrder: dateStr || ''
                        };
                    }

                    customerMap[name].totalSpent += t;
                    customerMap[name].totalDebt += r;
                    customerMap[name].totalOrders += 1;
                    
                    if (new Date(dateStr) > new Date(customerMap[name].lastOrder)) {
                        customerMap[name].lastOrder = dateStr;
                    }
                });

                const sortedCustomers = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
                setCustomers(sortedCustomers);
            }
        } catch (error) {
            console.error("Customers fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const headers = ["Tên Khách Hàng", "SĐT", "Phân Loại", "Tổng Chi Tiêu", "Công Nợ", "Số Đơn", "Đơn Gần Nhất", "Địa chỉ"];
        const rows = customers.map(c => [
            c.name, c.phone, c.type, c.totalSpent, c.totalDebt, c.totalOrders, 
            c.lastOrder ? c.lastOrder.substring(0,10) : '', c.address
        ]);
        exportToCSV("KhachHang_Export", [headers, ...rows]);
    };

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.toString().includes(searchTerm)
    );

    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-blue-600" /> Quản lý Khách Hàng
                </h1>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 shadow-sm transition-colors">
                        <Download size={18} /> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                    <div className="text-blue-800 font-semibold mb-2 flex items-center gap-2">Tổng số Khách hàng</div>
                    <div className="text-3xl font-black text-blue-700">{totalCustomers}</div>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 shadow-sm">
                    <div className="text-emerald-800 font-semibold mb-2 flex items-center gap-2">Tổng Chi Tiêu Khách Hàng</div>
                    <div className="text-3xl font-black text-emerald-700">{totalRevenue.toLocaleString()} đ</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm khách hàng, số điện thoại..." 
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
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">Phân loại</th>
                                <th className="p-4 text-center">Tổng số đơn</th>
                                <th className="p-4 text-right">Tổng chi tiêu</th>
                                <th className="p-4 text-right">Công nợ</th>
                                <th className="p-4">Đơn gần nhất</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Đang tổng hợp dữ liệu từ Đơn hàng...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Chưa có dữ liệu.</td>
                                </tr>
                            ) : filtered.map((c, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{c.name}</div>
                                        <div className="text-xs text-slate-500 mt-1">{c.phone}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold uppercase">
                                            {c.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-bold text-slate-700">{c.totalOrders}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">{c.totalSpent.toLocaleString()} đ</td>
                                    <td className="p-4 text-right font-bold text-red-500">{c.totalDebt > 0 ? `${c.totalDebt.toLocaleString()} đ` : '-'}</td>
                                    <td className="p-4 text-slate-500 text-sm">{c.lastOrder ? c.lastOrder.substring(0, 10) : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
