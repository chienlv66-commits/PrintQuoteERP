import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { appendDataToSheet, getDataFromSheet } from '../services/api';
import { Save, Plus, Trash2, FileText, Settings2, Copy, CheckCircle, Search } from 'lucide-react';

export default function CreateOrder() {
    const navigate = useNavigate();
    const { currentUser, pendingQuoteData, setPendingQuoteData, saveOrderToSheet } = useAppContext();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [customers, setCustomers] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    
    // UI states
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showZaloModal, setShowZaloModal] = useState(false);
    const [zaloText, setZaloText] = useState('');
    const [copied, setCopied] = useState(false);

    const [customerInfo, setCustomerInfo] = useState({
        type: 'Công ty',
        name: '',
        phone: '',
        address: ''
    });

    const [products, setProducts] = useState([
        { id: 1, name: '', material: '', size: '', quantity: 1, unitPrice: 0, specs: '', processing: '', notes: '' }
    ]);

    const [deposit, setDeposit] = useState(0);

    // Fetch Customers for Auto-Complete
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await getDataFromSheet('Customers');
                if (res.status === 'success' && res.data) {
                    // Map to array of objects [Name, TotalSpent, Debt, ... Phone is not in the list explicitly but usually Name/Phone is stored. Wait, Customers table columns: Tên KH, Tổng Chi Tiêu, Công Nợ... We will just use the name for search, and assume Phone might be in the Name or Address, or we just suggest by Name]
                    // Actually, let's keep it simple. We store the raw rows.
                    setCustomers(res.data);
                }
            } catch (err) {
                console.log("Could not fetch customers for autocomplete", err);
            }
        };
        fetchCustomers();
    }, []);

    // Handle incoming quote data
    useEffect(() => {
        if (pendingQuoteData) {
            setProducts([{
                id: 1,
                name: pendingQuoteData.productName || '',
                material: pendingQuoteData.material || '',
                size: pendingQuoteData.dimensions || '',
                quantity: pendingQuoteData.quantity || 1,
                unitPrice: pendingQuoteData.unitPrice || 0,
                specs: pendingQuoteData.specs || '',
                processing: pendingQuoteData.processing || '',
                notes: ''
            }]);
            setShowAdvanced(true); // Auto expand if quote has advanced details
        }
    }, [pendingQuoteData]);

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCustomerInfo(prev => ({ ...prev, [name]: value }));

        // Auto-complete logic for name or phone
        if (name === 'name' || name === 'phone') {
            if (value.length > 1) {
                const query = value.toLowerCase();
                const matches = customers.filter(row => {
                    const rowName = String(row[0] || '').toLowerCase(); // Tên KH
                    return rowName.includes(query);
                }).slice(0, 5); // top 5
                setSuggestions(matches);
            } else {
                setSuggestions([]);
            }
        }
    };

    const applySuggestion = (row) => {
        setCustomerInfo({
            ...customerInfo,
            name: row[0] || '', // Tên KH
            type: row[6] || 'Cá nhân', // Phân loại (Cột 7)
            // Assuming phone/address might not be perfectly mapped in Customers sheet, we leave them as is or map if we know. We'll map what we have.
        });
        setSuggestions([]);
    };

    const handleProductChange = (id, field, value) => {
        setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const addProduct = () => {
        setProducts([...products, { id: Date.now(), name: '', material: '', size: '', quantity: 1, unitPrice: 0, specs: '', processing: '', notes: '' }]);
    };

    const removeProduct = (id) => {
        if (products.length > 1) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    const totalOrderValue = products.reduce((sum, p) => sum + ((parseFloat(p.quantity) || 0) * (parseFloat(p.unitPrice) || 0)), 0);
    const remaining = totalOrderValue - deposit;

    const generateZaloText = (orderId, customer, prods, total, dep, rem) => {
        let text = `*BÁO GIÁ IN ẤN*\nMã ĐH: ${orderId}\nKhách hàng: ${customer.name || 'Khách lẻ'}\nSĐT: ${customer.phone || 'Không có'}\nĐịa chỉ: ${customer.address || 'Không có'}\n-------------------------\n`;
        
        prods.forEach((p, index) => {
            text += `SẢN PHẨM ${index + 1}: ${p.name} [${p.size}]\n`;
            text += `- Chất liệu: ${p.material}\n`;
            text += `- Kích thước: ${p.size}\n`;
            text += `- Số lượng: ${Number(p.quantity).toLocaleString('vi-VN')}\n`;
            text += `- Đơn giá: ${Number(p.unitPrice).toLocaleString('vi-VN')} đ\n`;
            text += `- Thành tiền: ${(Number(p.quantity) * Number(p.unitPrice)).toLocaleString('vi-VN')} đ\n`;
            if (p.specs || p.processing) {
                text += `- Quy cách/Gia công: ${p.specs} ${p.processing}\n`;
            }
            text += `\n`;
        });
        
        text += `-------------------------\n`;
        text += `*TỔNG CỘNG: ${total.toLocaleString()} đ*\n`;
        text += `Đã cọc: ${dep.toLocaleString()} đ\n`;
        text += `*CÒN LẠI: ${rem.toLocaleString()} đ*\n\n`;
        text += `Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ!`;
        return text;
    };

    const handleSaveOrder = async () => {
        if (!customerInfo.name || products.some(p => !p.name || !Number(p.quantity) || p.unitPrice === undefined || p.unitPrice === '')) {
            setError('Vui lòng điền đầy đủ Tên khách hàng và thông tin sản phẩm (có đánh dấu *)');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const orderId = `ORD-${Math.floor(Math.random() * 100000)}`;
            
            // For multiple products, we'll join them or save the primary one. 
            // In a strict flat 19-column table, we typically join them into strings.
            const joinedNames = products.map(p => p.name).join(' + ');
            const joinedMaterials = products.map(p => p.material).join(' + ');
            const joinedSizes = products.map(p => p.size).join(' + ');
            const totalQty = products.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
            const joinedSpecs = products.map(p => p.specs).filter(Boolean).join(' | ');
            const joinedProc = products.map(p => p.processing).filter(Boolean).join(' | ');
            const joinedNotes = products.map(p => p.notes).filter(Boolean).join(' | ');
            // Average unit price is tricky, so we leave it as 0 or the first one if there are multiple.
            const unitPriceRep = products.length === 1 ? products[0].unitPrice : 0;

            const finalOrderData = {
                orderId,
                customerType: customerInfo.type,
                customerName: customerInfo.name,
                phone: customerInfo.phone,
                address: customerInfo.address,
                productName: joinedNames,
                material: joinedMaterials,
                dimensions: joinedSizes,
                quantity: totalQty,
                unitPrice: unitPriceRep,
                totalPrice: totalOrderValue,
                deposit: deposit,
                remaining: remaining,
                specs: joinedSpecs,
                processing: joinedProc,
                notes: joinedNotes
            };

            const res = await saveOrderToSheet(finalOrderData);
            if (!res.success) {
                throw new Error(res.message);
            }

            // Auto-sync: Push deposit to Transactions sheet if > 0
            if (deposit > 0) {
                try {
                    const transId = `PT${(Math.floor(Math.random() * 1000)).toString().padStart(3, '0')}`;
                    const dateStr = new Date().toLocaleDateString();
                    const transRow = [
                        transId, dateStr, 'income', 'Thu tiền khách hàng', customerInfo.name,
                        customerInfo.phone, customerInfo.address, joinedNames,
                        totalQty, 0, deposit, deposit, 0, orderId, `Cọc đơn ${orderId}`
                    ];
                    await appendDataToSheet('Transactions', transRow);
                } catch (e) {
                    console.log("Could not auto-sync transaction", e);
                }
            }
            
            // Clear pending quote
            if (setPendingQuoteData) setPendingQuoteData(null);
            
            // Create Zalo text and open modal
            const text = generateZaloText(orderId, customerInfo, products, totalOrderValue, deposit, remaining);
            setZaloText(text);
            setShowZaloModal(true);

        } catch (err) {
            setError('Lỗi khi lưu đơn hàng: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(zaloText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const finishAndGoToOrders = () => {
        setShowZaloModal(false);
        navigate('/orders');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20 relative">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="text-blue-600" /> Tạo Đơn Hàng Mới
                </h2>
                <button 
                    onClick={handleSaveOrder} 
                    disabled={isLoading}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                >
                    <Save size={18} /> {isLoading ? 'Đang lưu...' : 'Lưu Đơn Hàng'}
                </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200">{error}</div>}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-3">Thông tin Khách hàng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Loại khách hàng</label>
                        <select name="type" value={customerInfo.type} onChange={handleCustomerChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                            <option>Công ty</option>
                            <option>Cá nhân</option>
                            <option>Khách sỉ</option>
                        </select>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên khách hàng *</label>
                        <div className="relative">
                            <input type="text" name="name" value={customerInfo.name} onChange={handleCustomerChange} className="w-full p-2.5 pl-10 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="Nhập tên khách hàng..." autoComplete="off" />
                            <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                        </div>
                        {/* Auto-complete dropdown */}
                        {suggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                                {suggestions.map((s, i) => (
                                    <div key={i} onClick={() => applySuggestion(s)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0">
                                        <p className="font-bold text-slate-800">{s[0]}</p>
                                        <p className="text-xs text-slate-500">Loại: {s[6]} - Đã chi: {s[1]}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
                        <input type="text" name="phone" value={customerInfo.phone} onChange={handleCustomerChange} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="09xxxx..." />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ (Tuỳ chọn)</label>
                        <input type="text" name="address" value={customerInfo.address} onChange={handleCustomerChange} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="Số nhà, đường..." />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {products.map((p, index) => (
                    <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative group border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Sản phẩm #{index + 1}</h3>
                            {products.length > 1 && (
                                <button onClick={() => removeProduct(p.id)} className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên hàng *</label>
                                <input type="text" value={p.name} onChange={(e) => handleProductChange(p.id, 'name', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="VD: Card visit, Tem..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chất liệu / Phân loại</label>
                                <input type="text" value={p.material} onChange={(e) => handleProductChange(p.id, 'material', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="Giấy, decal..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kích thước</label>
                                <input type="text" value={p.size} onChange={(e) => handleProductChange(p.id, 'size', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="5x5cm..." />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số lượng *</label>
                                <input type="number" step="any" min="0" value={p.quantity} onChange={(e) => handleProductChange(p.id, 'quantity', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-blue-700" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Đơn giá (đ) *</label>
                                <input type="number" step="any" min="0" value={p.unitPrice} onChange={(e) => handleProductChange(p.id, 'unitPrice', e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-bold text-emerald-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thành tiền (đ)</label>
                                <div className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 text-right">
                                    {((parseFloat(p.quantity) || 0) * (parseFloat(p.unitPrice) || 0)).toLocaleString('vi-VN')}
                                </div>
                            </div>
                        </div>

                        {/* Cấu hình nâng cao */}
                        {showAdvanced && (
                            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quy cách (Specs)</label>
                                    <textarea value={p.specs} onChange={(e) => handleProductChange(p.id, 'specs', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm" rows="2" placeholder="In 2 mặt, mực UV..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gia công (Processing)</label>
                                    <textarea value={p.processing} onChange={(e) => handleProductChange(p.id, 'processing', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm" rows="2" placeholder="Cán mờ, xén vuông..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú (Notes)</label>
                                    <textarea value={p.notes} onChange={(e) => handleProductChange(p.id, 'notes', e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm" rows="2" placeholder="Giao gấp..."></textarea>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button onClick={addProduct} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-900 font-bold flex items-center gap-2 transition-colors">
                    <Plus size={18} /> Thêm Sản Phẩm
                </button>
                <button onClick={() => setShowAdvanced(!showAdvanced)} className={`border px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors ${showAdvanced ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                    <Settings2 size={18} /> Cấu Hình Nâng Cao
                </button>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl lg:w-1/2 ml-auto">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-slate-300">TỔNG ĐƠN HÀNG:</span>
                    <span className="text-2xl font-black text-emerald-400">{totalOrderValue.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-slate-300">Khách đã cọc:</span>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            value={deposit} 
                            onChange={(e) => setDeposit(parseInt(e.target.value) || 0)}
                            className="w-32 p-2 text-right bg-slate-700 text-white rounded-lg outline-none font-bold focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-slate-300 font-bold">đ</span>
                    </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                    <span className="font-bold text-lg">CÒN LẠI:</span>
                    <span className="text-xl font-black text-orange-400">{remaining.toLocaleString()} đ</span>
                </div>
            </div>

            {/* Zalo Modal */}
            {showZaloModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
                        <div className="bg-emerald-600 p-5 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <CheckCircle /> Lưu Đơn Thành Công
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 font-medium mb-3">Copy đoạn văn bản dưới đây để gửi xác nhận cho khách qua Zalo/Telegram:</p>
                            <div className="relative">
                                <textarea 
                                    readOnly 
                                    value={zaloText} 
                                    className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 outline-none resize-none"
                                />
                                <button 
                                    onClick={copyToClipboard}
                                    className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                                >
                                    {copied ? <><CheckCircle size={14}/> Đã Copy</> : <><Copy size={14}/> Copy Text</>}
                                </button>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={finishAndGoToOrders} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
                                    Đóng & Vào Quản Lý Đơn
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
