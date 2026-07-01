import React, { useState, useEffect } from 'react';
import { PackageSearch, Search, Plus, ArrowRightLeft, X, CheckCircle, Download } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { appendDataToSheet, getDataFromSheet } from '../services/api';

export default function Inventory() {
    const [inventory, setInventory] = useState([
        { code: 'VT001', name: 'Giấy C300', unit: 'Tờ', category: 'Giấy Offset', stock: 15000, minStock: 5000, value: '45,000,000đ', warning: false },
        { code: 'VT002', name: 'Decal Nhựa Sữa', unit: 'Mét', category: 'Decal Cuộn', stock: 200, minStock: 50, value: '8,000,000đ', warning: false },
        { code: 'VT003', name: 'Mực UV DTF Xanh', unit: 'Lít', category: 'Mực In', stock: 5, minStock: 10, value: '2,500,000đ', warning: true },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        unit: 'Tờ',
        category: 'Giấy',
        quantity: 0,
        price: 0,
        minStock: 100
    });

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const res = await getDataFromSheet('Inventory');
                if (res.status === 'success' && res.data) {
                    const mapped = res.data.map(row => {
                        const stock = Number(row[4]) || 0;
                        const min = Number(row[6]) || 0;
                        return {
                            code: row[0] || 'VT...',
                            name: row[1] || 'Unknown',
                            unit: row[2] || '',
                            category: row[3] || '',
                            stock: stock,
                            value: row[5] ? Number(row[5]).toLocaleString() + 'đ' : '0đ',
                            minStock: min,
                            warning: stock < min
                        };
                    });
                    if(mapped.length > 0) {
                        setInventory(mapped);
                    }
                }
            } catch (err) {
                console.log(err);
            }
        };
        fetchInventory();
    }, []);

    const handleExport = () => {
        const headers = ["Mã VT", "Tên Vật Tư", "Đơn vị", "Danh mục", "Tồn kho", "Giá trị tồn", "Cảnh báo"];
        const rows = inventory.map(i => [i.code, i.name, i.unit, i.category, i.stock, i.value, i.warning ? 'Dưới mức tối thiểu' : 'Đủ hàng']);
        exportToCSV("TonKho_Export", [headers, ...rows]);
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const newCode = `VT${(inventory.length+1).toString().padStart(3, '0')}`;
            const stock = Number(formData.quantity) || 0;
            const price = Number(formData.price) || 0;
            const totalVal = stock * price;
            const minStk = Number(formData.minStock) || 0;

            // Columns expected in Inventory tab: Mã VT, Tên VT, Đơn vị, Danh mục, Tồn kho, Giá trị, Tồn tối thiểu
            const newRow = [
                newCode,
                formData.name,
                formData.unit,
                formData.category,
                stock,
                totalVal,
                minStk
            ];
            await appendDataToSheet('Inventory', newRow);
            
            // Local update
            setInventory([...inventory, {
                code: newCode,
                name: formData.name,
                unit: formData.unit,
                category: formData.category,
                stock: stock,
                value: totalVal.toLocaleString() + 'đ',
                minStock: minStk,
                warning: stock < minStk
            }]);

            setIsModalOpen(false);
            setFormData({ name: '', unit: 'Tờ', category: 'Giấy', quantity: 0, price: 0, minStock: 100 });
            alert("Nhập kho thành công!");
        } catch (error) {
            alert("Lỗi khi nhập kho: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <PackageSearch className="text-purple-500" /> Quản Lý Kho
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi tồn kho vật tư, cảnh báo sắp hết</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                        <Download size={18} /> Xuất Excel
                    </button>
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                        <ArrowRightLeft size={18} /> Kiểm Kho
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700 shadow-sm">
                        <Plus size={18} /> Nhập Kho Mới
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input type="text" placeholder="Tìm mã vật tư, tên vật tư..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-purple-500" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200 text-slate-600 text-sm">
                                <th className="p-4 font-semibold">Mã VT</th>
                                <th className="p-4 font-semibold">Tên Vật Tư</th>
                                <th className="p-4 font-semibold">Đơn vị</th>
                                <th className="p-4 font-semibold">Danh mục</th>
                                <th className="p-4 font-semibold text-right">Tồn kho</th>
                                <th className="p-4 font-semibold text-right">Giá trị tồn</th>
                                <th className="p-4 font-semibold">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item, i) => (
                                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 text-sm font-medium text-slate-500">{item.code}</td>
                                    <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                    <td className="p-4 text-slate-600">{item.unit}</td>
                                    <td className="p-4 text-slate-600">{item.category}</td>
                                    <td className={`p-4 text-right font-bold ${item.warning ? 'text-red-500' : 'text-slate-700'}`}>
                                        {item.stock.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right font-medium text-slate-600">{item.value}</td>
                                    <td className="p-4">
                                        {item.warning ? (
                                            <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-xs font-semibold">Dưới mức tối thiểu</span>
                                        ) : (
                                            <span className="bg-green-50 text-green-600 px-2 py-1 rounded-md text-xs font-semibold">Đủ hàng</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-purple-50">
                            <h3 className="font-bold text-lg text-purple-900">Nhập Vật Tư Mới Vào Kho</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-purple-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Vật Tư *</label>
                                <input type="text" className="w-full border rounded-lg p-2.5 outline-none focus:border-purple-500" placeholder="VD: Giấy C300, Mực In..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Danh mục</label>
                                    <select className="w-full border rounded-lg p-2.5 outline-none focus:border-purple-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        <option>Giấy</option>
                                        <option>Decal</option>
                                        <option>Mực In</option>
                                        <option>Vật tư màng</option>
                                        <option>Linh kiện máy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn vị tính</label>
                                    <input type="text" className="w-full border rounded-lg p-2.5 outline-none focus:border-purple-500" placeholder="Tờ, Cuộn, Lít..." value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng nhập ban đầu</label>
                                    <input type="number" className="w-full border rounded-lg p-2.5 outline-none focus:border-purple-500" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn giá nhập (đ/ĐV)</label>
                                    <input type="number" className="w-full border rounded-lg p-2.5 outline-none focus:border-purple-500" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Mức tồn tối thiểu (Để cảnh báo)</label>
                                <input type="number" className="w-full border rounded-lg p-2.5 outline-none focus:border-purple-500" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">Hủy</button>
                            <button onClick={handleSave} disabled={isLoading || !formData.name} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                {isLoading ? 'Đang lưu...' : <><CheckCircle size={18}/> Hoàn Tất Nhập Kho</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
