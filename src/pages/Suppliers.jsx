import React, { useState, useEffect, useMemo } from 'react';
import { Factory, Search, Plus, Download, X, CheckCircle, ChevronDown, Sparkles } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';
import { getDataFromSheet, appendDataToSheet } from '../services/api';

const DEFAULT_CATEGORIES = [
    'Vật tư / Gia công',
    'In ấn / Gia công',
    'Tem UV-DTF',
    'Vận chuyển',
    'Khác',
];

const UV_DTF_TIERS = [
    { max: 3, price: 180000, label: '<= 3m (mốc 1 - 3m)' },
    { max: 10, price: 165000, label: '3,5 - 10m' },
    { max: 50, price: 155000, label: '11 - 50m' },
    { max: 100, price: 145000, label: '51 - 100m' },
    { max: 300, price: 140000, label: '101 - 300m' },
    { max: Infinity, price: 135000, label: '> 300m' },
];

const getUvDtfTier = (meters) => {
    const qty = Number(meters);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    return UV_DTF_TIERS.find(t => qty <= t.max) || UV_DTF_TIERS[UV_DTF_TIERS.length - 1];
};

const INITIAL_FORM = {
    name: '',
    phone: '',
    address: '',
    category: 'Vật tư / Gia công',
    itemType: 'general', // 'general' | 'uv_dtf'
    productName: '',
    qty: '',
    unitPrice: '',
    paidAmount: '',
    orderLink: '',
    note: '',
};

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [showOrderDropdown, setShowOrderDropdown] = useState(false);

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
                    
                    // Cập nhật thông tin mới nhất nếu có
                    if (cat) suppMap[name].category = cat;
                    if (phone) suppMap[name].phone = phone;
                    if (address) suppMap[name].address = address;
                });

                const sorted = Object.values(suppMap).sort((a, b) => b.totalBought - a.totalBought);
                setSuppliers(sorted);
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
        const headers = ["Nhà Cung Cấp", "Danh mục", "SĐT", "Tổng Nhập", "Đã Thanh Toán", "Công Nợ", "Giao Dịch Gần Nhất", "Địa Chỉ"];
        const rows = suppliers.map(s => [
            s.name, s.category, s.phone, s.totalBought, s.totalPaid, s.totalDebt, 
            s.lastTransDate ? s.lastTransDate.substring(0,10) : '', s.address
        ]);
        exportToCSV("NhaCungCap_Export", [headers, ...rows]);
    };

    const categoryOptions = useMemo(() => {
        const set = new Set(DEFAULT_CATEGORIES);
        suppliers.forEach(s => {
            if (s.category && s.category.trim()) set.add(s.category.trim());
        });
        return Array.from(set);
    }, [suppliers]);

    const filteredCategories = useMemo(() => {
        const q = formData.category.trim().toLowerCase();
        if (!q || categoryOptions.some(c => c.toLowerCase() === q)) return categoryOptions;
        const matches = categoryOptions.filter(c => c.toLowerCase().includes(q));
        return matches.length > 0 ? matches : categoryOptions;
    }, [categoryOptions, formData.category]);

    const supplierSuggestions = useMemo(() => {
        const q = formData.name.trim().toLowerCase();
        if (!q) return suppliers.slice(0, 6);
        return suppliers
            .filter(s =>
                s.name.toLowerCase().includes(q) ||
                (s.phone || '').toLowerCase().includes(q)
            )
            .slice(0, 6);
    }, [suppliers, formData.name]);

    const filteredOrders = useMemo(() => {
        const q = orderSearch.trim().toLowerCase();
        if (!q) return orders.slice(0, 30);
        return orders
            .filter(o =>
                o.id.toLowerCase().includes(q) ||
                o.customer.toLowerCase().includes(q) ||
                o.product.toLowerCase().includes(q)
            )
            .slice(0, 30);
    }, [orders, orderSearch]);

    const selectedOrderObj = useMemo(
        () => orders.find(o => o.id === formData.orderLink) || null,
        [orders, formData.orderLink]
    );

    const matchedUvTier = useMemo(
        () => (formData.itemType === 'uv_dtf' ? getUvDtfTier(formData.qty) : null),
        [formData.itemType, formData.qty]
    );

    const qtyNum = formData.qty === '' ? 1 : (Number(formData.qty) || 0);
    const priceNum = Number(formData.unitPrice) || 0;
    const computedTotal = Math.round(qtyNum * priceNum);

    const openAddModal = () => {
        setFormData(INITIAL_FORM);
        setOrderSearch('');
        setShowSupplierSuggestions(false);
        setShowCategoryDropdown(false);
        setShowOrderDropdown(false);
        setIsModalOpen(true);
    };

    const handleSelectSupplier = (sup) => {
        setFormData(prev => ({
            ...prev,
            name: sup.name,
            category: sup.category || prev.category,
            phone: sup.phone || '',
            address: sup.address || '',
        }));
        setShowSupplierSuggestions(false);
    };

    const handleItemTypeChange = (nextType) => {
        setFormData(prev => {
            if (nextType === 'uv_dtf') {
                const tier = getUvDtfTier(prev.qty);
                return {
                    ...prev,
                    itemType: 'uv_dtf',
                    productName: prev.productName.trim() ? prev.productName : 'In tem UV-DTF (khổ 58cm)',
                    unitPrice: tier ? String(tier.price) : prev.unitPrice,
                };
            }
            return {
                ...prev,
                itemType: 'general',
                productName: prev.productName === 'In tem UV-DTF (khổ 58cm)' ? '' : prev.productName,
            };
        });
    };

    const handleQtyChange = (rawVal) => {
        setFormData(prev => {
            if (prev.itemType === 'uv_dtf') {
                const tier = getUvDtfTier(rawVal);
                return {
                    ...prev,
                    qty: rawVal,
                    unitPrice: tier ? String(tier.price) : '',
                };
            }
            return { ...prev, qty: rawVal };
        });
    };

    const handleSaveSupplier = async () => {
        if (!formData.name.trim()) {
            alert("Vui lòng nhập tên Nhà cung cấp");
            return;
        }

        setIsSaving(true);
        try {
            const newId = `PC${(Math.floor(Math.random()*1000)).toString().padStart(3, '0')}`;
            const dateStr = new Date().toLocaleDateString();
            
            const saveQty = formData.qty === '' ? 1 : (Number(formData.qty) || 0);
            const savePrice = Number(formData.unitPrice) || 0;
            const totalNum = Math.round(saveQty * savePrice);
            const paidNum = Number(formData.paidAmount) || 0;
            const debtNum = totalNum - paidNum;

            const newRow = [
                newId, dateStr, 'expense', formData.category.trim() || 'Khác', formData.name.trim(), 
                formData.phone, formData.address, formData.productName || 'Khởi tạo NCC', 
                saveQty, savePrice, totalNum, paidNum, debtNum, formData.orderLink, formData.note
            ];
            
            const res = await appendDataToSheet('Transactions', newRow);
            if (res.status === 'success') {
                setIsModalOpen(false);
                setFormData(INITIAL_FORM);
                setOrderSearch('');
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
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="bg-amber-50 p-5 border-b border-amber-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-amber-900">Thêm Nhà Cung Cấp</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-amber-700 hover:text-amber-900 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
                            {/* Khung Thông tin Đối tác */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">Thông tin Nhà cung cấp</h3>
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Nhà CC *</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                        placeholder="Nhập hoặc chọn tên NCC đã lưu..."
                                        autoComplete="off"
                                        value={formData.name}
                                        onFocus={() => setShowSupplierSuggestions(true)}
                                        onBlur={() => setShowSupplierSuggestions(false)}
                                        onChange={e => {
                                            setFormData({...formData, name: e.target.value});
                                            setShowSupplierSuggestions(true);
                                        }}
                                    />
                                    {showSupplierSuggestions && supplierSuggestions.length > 0 && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {supplierSuggestions.map((s, idx) => (
                                                <div
                                                    key={idx}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleSelectSupplier(s);
                                                    }}
                                                    className="px-3 py-2.5 hover:bg-amber-50 cursor-pointer border-b last:border-b-0 flex items-center justify-between gap-2"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm text-slate-800 truncate">{s.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {s.phone ? `SĐT: ${s.phone}` : 'Chưa có SĐT'}
                                                            {s.address ? ` • ${s.address}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-medium">
                                                        {s.category}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Danh mục</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full border border-slate-300 rounded-lg p-2.5 pr-8 outline-none focus:border-amber-500 bg-white text-sm"
                                                placeholder="Chọn hoặc nhập mới..."
                                                autoComplete="off"
                                                value={formData.category}
                                                onFocus={() => setShowCategoryDropdown(true)}
                                                onBlur={() => setShowCategoryDropdown(false)}
                                                onChange={e => {
                                                    setFormData({...formData, category: e.target.value});
                                                    setShowCategoryDropdown(true);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setShowCategoryDropdown(v => !v);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                        </div>
                                        {showCategoryDropdown && (
                                            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-44 overflow-y-auto">
                                                {filteredCategories.map((cat) => (
                                                    <div
                                                        key={cat}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setFormData(prev => ({ ...prev, category: cat }));
                                                            setShowCategoryDropdown(false);
                                                        }}
                                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-amber-50 border-b last:border-b-0 ${formData.category === cat ? 'bg-amber-50 font-semibold text-amber-800' : 'text-slate-700'}`}
                                                    >
                                                        {cat}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                                    <h3 className="font-semibold text-slate-800">Chi tiết Hàng hóa / Dịch vụ</h3>
                                    <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={() => handleItemTypeChange('general')}
                                            className={`px-2.5 py-1 rounded-md transition-colors ${formData.itemType === 'general' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                                        >
                                            Chung
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleItemTypeChange('uv_dtf')}
                                            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${formData.itemType === 'uv_dtf' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                                        >
                                            <Sparkles size={12} /> Tem UV-DTF
                                        </button>
                                    </div>
                                </div>

                                {formData.itemType === 'uv_dtf' && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 space-y-1">
                                        <div className="font-semibold flex flex-wrap items-center justify-between gap-1">
                                            <span>Bảng giá Tem UV-DTF (khổ 58cm - đ/md)</span>
                                            {matchedUvTier && (
                                                <span className="bg-amber-600 text-white px-2 py-0.5 rounded font-bold">
                                                    Mốc {matchedUvTier.label}: {matchedUvTier.price.toLocaleString('vi-VN')} đ
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-amber-700">
                                            ≤3m: 180k • 3,5-10m: 165k • 11-50m: 155k • 51-100m: 145k • 101-300m: 140k • &gt;300m: 135k (Chưa gồm VAT &amp; ship)
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mặt hàng / Dịch vụ</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white" 
                                            placeholder={formData.itemType === 'uv_dtf' ? 'VD: In tem UV-DTF (khổ 58cm)...' : 'VD: Mua giấy C300, Phủ UV...'}
                                            value={formData.productName}
                                            onChange={e => setFormData({...formData, productName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            {formData.itemType === 'uv_dtf' ? 'Số mét (md)' : 'Số lượng'}
                                        </label>
                                        <input 
                                            type="number"
                                            step="any"
                                            min="0"
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white font-semibold" 
                                            placeholder={formData.itemType === 'uv_dtf' ? '0.5' : '1'}
                                            value={formData.qty}
                                            onChange={e => handleQtyChange(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                                            {formData.itemType === 'uv_dtf' ? 'Đơn giá (đ/md)' : 'Đơn giá (đ)'}
                                        </label>
                                        <input 
                                            type="number"
                                            step="any"
                                            min="0"
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white font-semibold text-amber-800" 
                                            placeholder={formData.itemType === 'uv_dtf' ? 'Tự tính theo md...' : '50000'}
                                            value={formData.unitPrice}
                                            onChange={e => setFormData({...formData, unitPrice: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng tiền (đ)</label>
                                        <input 
                                            type="text" 
                                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none bg-slate-200 text-slate-700 font-bold" 
                                            disabled
                                            value={computedTotal.toLocaleString('vi-VN')}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Khung Thanh toán và Liên kết */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                                <h3 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">Thanh toán & Liên kết</h3>
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
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Liên kết Đơn hàng báo giá (NẾU CÓ)</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-amber-600" size={16} />
                                        <input
                                            type="text"
                                            className="w-full border-2 border-amber-400 rounded-lg p-2.5 pl-9 pr-8 outline-none focus:border-amber-600 bg-amber-50/70 text-sm text-slate-800"
                                            placeholder="Tìm mã đơn, tên khách hoặc tên sản phẩm..."
                                            autoComplete="off"
                                            value={orderSearch}
                                            onFocus={() => setShowOrderDropdown(true)}
                                            onBlur={() => setShowOrderDropdown(false)}
                                            onChange={e => {
                                                setOrderSearch(e.target.value);
                                                setShowOrderDropdown(true);
                                            }}
                                        />
                                        {(orderSearch || formData.orderLink) && (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setOrderSearch('');
                                                    setFormData(prev => ({ ...prev, orderLink: '' }));
                                                }}
                                                title="Bỏ liên kết đơn hàng"
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {formData.orderLink && (
                                        <div className="mt-1.5 inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md text-xs font-semibold">
                                            <span>Đang gắn đơn: {formData.orderLink}</span>
                                            {selectedOrderObj?.customer && <span className="font-normal text-amber-800">• {selectedOrderObj.customer}</span>}
                                        </div>
                                    )}
                                    {showOrderDropdown && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                                            <div
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setFormData(prev => ({ ...prev, orderLink: '' }));
                                                    setOrderSearch('');
                                                    setShowOrderDropdown(false);
                                                }}
                                                className="px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 cursor-pointer border-b"
                                            >
                                                -- Không gắn với đơn hàng nào --
                                            </div>
                                            {filteredOrders.length === 0 ? (
                                                <div className="px-3 py-3 text-xs text-slate-400 text-center">Không tìm thấy đơn hàng phù hợp</div>
                                            ) : filteredOrders.map(o => (
                                                <div
                                                    key={o.id}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setFormData(prev => ({ ...prev, orderLink: o.id }));
                                                        setOrderSearch(`${o.id}${o.customer ? ` - ${o.customer}` : ''}`);
                                                        setShowOrderDropdown(false);
                                                    }}
                                                    className={`px-3 py-2 hover:bg-amber-50 cursor-pointer border-b last:border-b-0 ${formData.orderLink === o.id ? 'bg-amber-50' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-bold text-xs text-amber-800">{o.id}</span>
                                                        <span className="text-xs font-semibold text-slate-600">{o.total.toLocaleString('vi-VN')} đ</span>
                                                    </div>
                                                    <div className="text-xs text-slate-700 truncate">
                                                        {o.customer || 'Khách lẻ'}{o.product ? ` • ${o.product.replace(/\n/g, ', ')}` : ''}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
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
