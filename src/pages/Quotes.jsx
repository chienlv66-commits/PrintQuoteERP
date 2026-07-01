import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Edit, Trash2, X, CheckCircle, Download } from 'lucide-react';
import { getDataFromSheet, updateDataInSheet, deleteDataInSheet } from '../services/api';
import { exportToCSV } from '../utils/csvExport';

export default function Quotes() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await getDataFromSheet('Orders');
            if (res.status === 'success' && res.data) {
                // Reverse to show newest first
                setOrders(res.data.reverse());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (orderId) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${orderId}? Hành động này sẽ cập nhật trực tiếp lên Google Sheets.`)) {
            return;
        }
        
        try {
            const res = await deleteDataInSheet('Orders', orderId);
            if (res.status === 'success') {
                setOrders(orders.filter(o => o[0] !== orderId));
                alert("Đã xóa đơn hàng thành công!");
            } else {
                alert("Lỗi khi xóa: " + res.message);
            }
        } catch (err) {
            alert("Lỗi kết nối: " + err.message);
        }
    };

    const openEditModal = (order) => {
        // order is the raw array from Google Sheets
        // Columns: 
        // 0: Mã, 1: Ngày, 2: T.Khoản, 3: Phân loại, 4: Tên KH, 5: SĐT, 6: Địa chỉ
        // 7: Tên SP, 8: Chất liệu, 9: Kích thước, 10: SL, 11: Đơn giá, 12: Tổng tiền
        // 13: Tạm ứng, 14: Còn lại, 15: Quy cách, 16: Gia công, 17: Ghi chú, 18: Tình trạng
        setEditingOrder({
            id: order[0],
            rawIndex: orders.findIndex(o => o[0] === order[0]), // to update local state
            rawData: [...order],
            status: order[18] || 'Chờ xác nhận',
            deposit: Number(order[13]) || 0,
            total: Number(order[12]) || 0,
            notes: order[17] || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        setIsSaving(true);
        try {
            const updatedRow = [...editingOrder.rawData];
            updatedRow[18] = editingOrder.status; // Tình trạng
            updatedRow[13] = editingOrder.deposit; // Tạm ứng
            updatedRow[14] = editingOrder.total - editingOrder.deposit; // Còn lại
            updatedRow[17] = editingOrder.notes; // Ghi chú

            const res = await updateDataInSheet('Orders', editingOrder.id, updatedRow);
            if (res.status === 'success') {
                const newOrders = [...orders];
                newOrders[editingOrder.rawIndex] = updatedRow;
                setOrders(newOrders);
                setIsEditModalOpen(false);
                alert("Cập nhật đơn hàng thành công!");
            } else {
                alert("Lỗi khi cập nhật: " + res.message);
            }
        } catch (err) {
            alert("Lỗi kết nối: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = () => {
        const headers = ["Mã Đơn", "Ngày Tạo", "Tài Khoản", "Phân Loại", "Tên Khách Hàng", "Số Điện Thoại", "Địa Chỉ", "Tên Sản Phẩm", "Chất Liệu", "Kích Thước", "Số Lượng", "Đơn Giá", "Tổng Tiền", "Tạm Ứng", "Còn Lại PTT", "Quy Cách", "Gia Công", "Ghi Chú", "Tình Trạng ĐH"];
        exportToCSV("QuanLyDonHang", [headers, ...orders]);
    };

    const getStatusColor = (status) => {
        const s = status ? status.toLowerCase() : '';
        if (s.includes('chờ')) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        if (s.includes('nhận') || s.includes('chốt')) return 'bg-blue-100 text-blue-800 border border-blue-200';
        if (s.includes('sản xuất')) return 'bg-purple-100 text-purple-800 border border-purple-200';
        if (s.includes('hoàn tất') || s.includes('thanh toán')) return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
        if (s.includes('giao')) return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    };

    const filteredOrders = orders.filter(o => {
        const str = o.join(' ').toLowerCase();
        return str.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-blue-500" /> Quản lý Đơn Hàng
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                        <Download size={18} /> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã đơn, khách hàng, SĐT..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium outline-none focus:border-blue-500">
                    <option value="">Tất cả khách hàng</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4">Mã ĐH & Ngày</th>
                                <th className="p-4">Nhân viên</th>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4 w-64">Tên hàng</th>
                                <th className="p-4 text-center">Số lượng</th>
                                <th className="p-4 text-right">Thành tiền</th>
                                <th className="p-4 text-right">Công nợ</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-slate-500">Đang tải dữ liệu từ Google Sheets...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-8 text-center text-slate-500">Không tìm thấy đơn hàng nào.</td>
                                </tr>
                            ) : filteredOrders.map((o, i) => {
                                const [
                                    id, date, user, type, cusName, phone, addr, 
                                    prodName, mat, dim, qty, price, total, 
                                    deposit, remain, spec, proc, note, status
                                ] = o;

                                return (
                                    <tr key={id || i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{id}</div>
                                            <div className="text-xs text-slate-500 mt-1">{date ? date.substring(0, 10) : ''}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">{user || 'Admin'}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700">{cusName}</div>
                                            <div className="text-xs text-slate-500 mt-1">{phone} • {type}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 truncate max-w-[200px]">{prodName}</div>
                                            <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{spec || mat || dim}</div>
                                        </td>
                                        <td className="p-4 text-center font-semibold text-slate-700">{Number(qty).toLocaleString()}</td>
                                        <td className="p-4 text-right font-semibold text-slate-700">{Number(total).toLocaleString()} đ</td>
                                        <td className="p-4 text-right font-bold text-red-500">{Number(remain).toLocaleString()} đ</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(status)} whitespace-nowrap`}>
                                                {status || 'Chờ xác nhận'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => openEditModal(o)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Sửa">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Xóa">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Sửa Đơn Hàng */}
            {isEditModalOpen && editingOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Cập Nhật Đơn Hàng {editingOrder.id}</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Tình Trạng Đơn Hàng</label>
                                <select 
                                    className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 font-medium"
                                    value={editingOrder.status}
                                    onChange={e => setEditingOrder({...editingOrder, status: e.target.value})}
                                >
                                    <option>Chờ xác nhận</option>
                                    <option>Đã nhận</option>
                                    <option>Đã chốt</option>
                                    <option>Đang sản xuất</option>
                                    <option>Đang giao</option>
                                    <option>Hoàn tất</option>
                                    <option>Đã thanh toán</option>
                                    <option>Hủy</option>
                                </select>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-slate-600">Tổng giá trị đơn:</span>
                                    <span className="font-bold text-slate-800">{editingOrder.total.toLocaleString()} đ</span>
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Khách đã thanh toán / Tạm ứng (đ)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border rounded-lg p-2 outline-none focus:border-blue-500 font-bold text-emerald-600"
                                        value={editingOrder.deposit}
                                        onChange={e => setEditingOrder({...editingOrder, deposit: Number(e.target.value)})}
                                    />
                                </div>
                                <div className="flex justify-between mt-3 pt-3 border-t border-slate-200">
                                    <span className="text-sm font-bold text-slate-700">Công nợ còn lại:</span>
                                    <span className="font-bold text-red-500">{(editingOrder.total - editingOrder.deposit).toLocaleString()} đ</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú điều hành</label>
                                <textarea 
                                    className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 resize-none text-sm" 
                                    rows="3" 
                                    placeholder="Ghi chú thêm..."
                                    value={editingOrder.notes}
                                    onChange={e => setEditingOrder({...editingOrder, notes: e.target.value})}
                                ></textarea>
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
                            <button onClick={handleSaveEdit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                {isSaving ? 'Đang lưu...' : <><CheckCircle size={18}/> Lưu Cập Nhật</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}