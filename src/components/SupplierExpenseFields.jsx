import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, ChevronDown, Sparkles } from 'lucide-react';
import {
    DEFAULT_CATEGORIES,
    getUvDtfTier,
    computeSupplierEntryTotal,
} from '../utils/supplierHelpers';

/**
 * Shared supplier expense form fields used by both the Suppliers modal
 * and the inline supplier section inside CreateOrder.
 */
export default function SupplierExpenseFields({
    value,
    onChange,
    suppliers = [],
    orders = [],
    showOrderLink = false,
}) {
    const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [orderSearch, setOrderSearch] = useState('');
    const [showOrderDropdown, setShowOrderDropdown] = useState(false);

    useEffect(() => {
        if (!value.orderLink) {
            setOrderSearch('');
        }
    }, [value.orderLink]);

    const categoryOptions = useMemo(() => {
        const set = new Set(DEFAULT_CATEGORIES);
        suppliers.forEach(s => {
            const catStr = String(s.category ?? '').trim();
            if (catStr) set.add(catStr);
        });
        return Array.from(set);
    }, [suppliers]);

    const filteredCategories = useMemo(() => {
        const q = String(value.category ?? '').trim().toLowerCase();
        if (!q || categoryOptions.some(c => c.toLowerCase() === q)) return categoryOptions;
        const matches = categoryOptions.filter(c => c.toLowerCase().includes(q));
        return matches.length > 0 ? matches : categoryOptions;
    }, [categoryOptions, value.category]);

    const supplierSuggestions = useMemo(() => {
        const q = String(value.name ?? '').trim().toLowerCase();
        if (!q) return suppliers.slice(0, 6);
        return suppliers
            .filter(s =>
                String(s.name ?? '').toLowerCase().includes(q) ||
                String(s.phone ?? '').toLowerCase().includes(q)
            )
            .slice(0, 6);
    }, [suppliers, value.name]);

    const filteredOrders = useMemo(() => {
        if (!showOrderLink) return [];
        const q = orderSearch.trim().toLowerCase();
        if (!q) return orders.slice(0, 30);
        return orders
            .filter(o =>
                o.id.toLowerCase().includes(q) ||
                o.customer.toLowerCase().includes(q) ||
                o.product.toLowerCase().includes(q)
            )
            .slice(0, 30);
    }, [orders, orderSearch, showOrderLink]);

    const selectedOrderObj = useMemo(
        () => (showOrderLink ? orders.find(o => o.id === value.orderLink) || null : null),
        [orders, value.orderLink, showOrderLink]
    );

    const matchedUvTier = useMemo(
        () => (value.itemType === 'uv_dtf' ? getUvDtfTier(value.qty) : null),
        [value.itemType, value.qty]
    );

    const computedTotal = computeSupplierEntryTotal(value);

    const updateField = (patch) => {
        onChange({ ...value, ...patch });
    };

    const handleSelectSupplier = (sup) => {
        updateField({
            name: String(sup.name ?? ''),
            category: String(sup.category ?? '').trim() || value.category,
            phone: String(sup.phone ?? ''),
            address: String(sup.address ?? ''),
        });
        setShowSupplierSuggestions(false);
    };

    const handleItemTypeChange = (nextType) => {
        if (nextType === 'uv_dtf') {
            const tier = getUvDtfTier(value.qty);
            updateField({
                itemType: 'uv_dtf',
                productName: String(value.productName ?? '').trim()
                    ? value.productName
                    : 'In tem UV-DTF (khổ 58cm)',
                unitPrice: tier ? String(tier.price) : value.unitPrice,
            });
            return;
        }
        updateField({
            itemType: 'general',
            productName: value.productName === 'In tem UV-DTF (khổ 58cm)' ? '' : value.productName,
        });
    };

    const handleQtyChange = (rawVal) => {
        if (value.itemType === 'uv_dtf') {
            const tier = getUvDtfTier(rawVal);
            updateField({
                qty: rawVal,
                unitPrice: tier ? String(tier.price) : '',
            });
            return;
        }
        updateField({ qty: rawVal });
    };

    return (
        <div className="space-y-4">
            {/* Khung Thông tin Đối tác */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-2 text-sm">
                    Thông tin Nhà cung cấp
                </h4>
                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Nhà CC *</label>
                    <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white"
                        placeholder="Nhập hoặc chọn tên NCC đã lưu..."
                        autoComplete="off"
                        value={value.name}
                        onFocus={() => setShowSupplierSuggestions(true)}
                        onBlur={() => setShowSupplierSuggestions(false)}
                        onChange={e => {
                            updateField({ name: e.target.value });
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Danh mục</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full border border-slate-300 rounded-lg p-2.5 pr-8 outline-none focus:border-amber-500 bg-white text-sm"
                                placeholder="Chọn hoặc nhập mới..."
                                autoComplete="off"
                                value={value.category}
                                onFocus={() => setShowCategoryDropdown(true)}
                                onBlur={() => setShowCategoryDropdown(false)}
                                onChange={e => {
                                    updateField({ category: e.target.value });
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
                                            updateField({ category: cat });
                                            setShowCategoryDropdown(false);
                                        }}
                                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-amber-50 border-b last:border-b-0 ${value.category === cat ? 'bg-amber-50 font-semibold text-amber-800' : 'text-slate-700'}`}
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
                            value={value.phone}
                            onChange={e => updateField({ phone: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ</label>
                    <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white"
                        placeholder="Nhập địa chỉ..."
                        value={value.address}
                        onChange={e => updateField({ address: e.target.value })}
                    />
                </div>
            </div>

            {/* Khung Chi tiết Hàng hóa / Dịch vụ */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <h4 className="font-semibold text-slate-800 text-sm">Chi tiết Hàng hóa / Dịch vụ</h4>
                    <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => handleItemTypeChange('general')}
                            className={`px-2.5 py-1 rounded-md transition-colors ${value.itemType === 'general' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            Chung
                        </button>
                        <button
                            type="button"
                            onClick={() => handleItemTypeChange('uv_dtf')}
                            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${value.itemType === 'uv_dtf' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                        >
                            <Sparkles size={12} /> Tem UV-DTF
                        </button>
                    </div>
                </div>

                {value.itemType === 'uv_dtf' && (
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mặt hàng / Dịch vụ</label>
                        <input
                            type="text"
                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white"
                            placeholder={value.itemType === 'uv_dtf' ? 'VD: In tem UV-DTF (khổ 58cm)...' : 'VD: Mua giấy C300, Phủ UV...'}
                            value={value.productName}
                            onChange={e => updateField({ productName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {value.itemType === 'uv_dtf' ? 'Số mét (md)' : 'Số lượng'}
                        </label>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white font-semibold"
                            placeholder={value.itemType === 'uv_dtf' ? '0.5' : '1'}
                            value={value.qty}
                            onChange={e => handleQtyChange(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {value.itemType === 'uv_dtf' ? 'Đơn giá (đ/md)' : 'Đơn giá (đ)'}
                        </label>
                        <input
                            type="number"
                            step="any"
                            min="0"
                            className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white font-semibold text-amber-800"
                            placeholder={value.itemType === 'uv_dtf' ? 'Tự tính theo md...' : '50000'}
                            value={value.unitPrice}
                            onChange={e => updateField({ unitPrice: e.target.value })}
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
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-2 text-sm">
                    {showOrderLink ? 'Thanh toán & Liên kết' : 'Thanh toán & Ghi chú NCC'}
                </h4>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Đã thanh toán (Trả NCC)</label>
                    <input
                        type="number"
                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white"
                        placeholder="Nhập số tiền đã trả..."
                        value={value.paidAmount}
                        onChange={e => updateField({ paidAmount: e.target.value })}
                    />
                </div>

                {showOrderLink && (
                    <div className="relative">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Liên kết Đơn hàng báo giá (NẾU CÓ)
                        </label>
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
                            {(orderSearch || value.orderLink) && (
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setOrderSearch('');
                                        updateField({ orderLink: '' });
                                    }}
                                    title="Bỏ liên kết đơn hàng"
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        {value.orderLink && (
                            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md text-xs font-semibold">
                                <span>Đang gắn đơn: {value.orderLink}</span>
                                {selectedOrderObj?.customer && (
                                    <span className="font-normal text-amber-800">• {selectedOrderObj.customer}</span>
                                )}
                            </div>
                        )}
                        {showOrderDropdown && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                                <div
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        updateField({ orderLink: '' });
                                        setOrderSearch('');
                                        setShowOrderDropdown(false);
                                    }}
                                    className="px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 cursor-pointer border-b"
                                >
                                    -- Không gắn với đơn hàng nào --
                                </div>
                                {filteredOrders.length === 0 ? (
                                    <div className="px-3 py-3 text-xs text-slate-400 text-center">
                                        Không tìm thấy đơn hàng phù hợp
                                    </div>
                                ) : (
                                    filteredOrders.map(o => (
                                        <div
                                            key={o.id}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                updateField({ orderLink: o.id });
                                                setOrderSearch(`${o.id}${o.customer ? ` - ${o.customer}` : ''}`);
                                                setShowOrderDropdown(false);
                                            }}
                                            className={`px-3 py-2 hover:bg-amber-50 cursor-pointer border-b last:border-b-0 ${value.orderLink === o.id ? 'bg-amber-50' : ''}`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-xs text-amber-800">{o.id}</span>
                                                <span className="text-xs font-semibold text-slate-600">
                                                    {o.total.toLocaleString('vi-VN')} đ
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-700 truncate">
                                                {o.customer || 'Khách lẻ'}
                                                {o.product ? ` • ${o.product.replace(/\n/g, ', ')}` : ''}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                    <textarea
                        className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-amber-500 bg-white resize-none"
                        rows="2"
                        placeholder="Chi tiết tài khoản, nội dung chuyển..."
                        value={value.note}
                        onChange={e => updateField({ note: e.target.value })}
                    ></textarea>
                </div>
            </div>
        </div>
    );
}
