import React, { useState, useMemo } from 'react';
import {
    Wallet, Plus, Search, ArrowUpCircle, ArrowDownCircle,
    TrendingUp, FileText, DollarSign, X, Receipt, Building,
    User, Users, ChevronDown, Download, Printer, Check,
    Tag, Calendar, CreditCard, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

// ==================== MOCK DATA ====================

const MOCK_REVENUE = [
    { id: 'DT-001', date: '07/01/2026', product: 'TEM UV', spec: 'In Cốc Huế · 4m', qty: 6, unit: 'm', unitPrice: 285000, vat: 136800, deposit: 0, depositDate: '', paid: 1846800, paidDate: '07/01/2026', bank: 'ACCA', note: '', tag: 'Cá nhân', vatExport: false, invoiceStatus: '' },
    { id: 'DT-002', date: '11/01/2026', product: 'TEM UV', spec: 'Anh Khang · 2mặt', qty: 15, unit: 'cái', unitPrice: 40000, vat: 0, deposit: 300000, depositDate: '12/1', paid: 300000, paidDate: '4/2', bank: 'Thi', note: 'Ship COD 300k Thi', tag: 'Cá nhân', vatExport: false, invoiceStatus: '' },
    { id: 'DT-003', date: '22/01/2026', product: 'TEM UV', spec: 'Hiền màu · UV 2 mặt', qty: 20000, unit: 'cái', unitPrice: 662, vat: 1059200, deposit: 0, depositDate: '', paid: 14299200, paidDate: '3/2', bank: 'ACCA', note: '', tag: 'Công ty', vatExport: true, invoiceStatus: 'Đã xuất' },
    { id: 'DT-004', date: '12/01/2026', product: 'TEM UV', spec: 'BNA · 1 mặt', qty: 11, unit: 'cái', unitPrice: 35000, vat: 0, deposit: 0, depositDate: '', paid: 385000, paidDate: '13/1', bank: 'Thi', note: '', tag: 'Cá nhân', vatExport: false, invoiceStatus: '' },
    { id: 'DT-005', date: '16/01/2026', product: 'TEM UV', spec: 'FPT · Logo công ty', qty: 2, unit: 'cái', unitPrice: 35000, vat: 0, deposit: 0, depositDate: '', paid: 70000, paidDate: '19/1', bank: 'Thi', note: '', tag: 'Công ty', vatExport: true, invoiceStatus: 'Chờ xuất' },
    { id: 'DT-006', date: '20/01/2026', product: 'TEM UV', spec: 'Deluxehome emir', qty: 5, unit: 'cái', unitPrice: 60000, vat: 0, deposit: 0, depositDate: '', paid: 300000, paidDate: '3/2', bank: 'Thi', note: 'Ship COD Thi', tag: 'Hộ KD', vatExport: false, invoiceStatus: '' },
    { id: 'DT-007', date: '23/05/2026', product: 'Thẻ bài', spec: 'Thẻ tag tải trọng sứt kĩ 8.5x14.2cm đỏ nhũ vàng', qty: 5000, unit: 'cái', unitPrice: 930, vat: 372000, deposit: 0, depositDate: '', paid: 5022000, paidDate: '25/5', bank: 'ACCA', note: '', tag: 'Công ty', vatExport: true, invoiceStatus: 'Đã xuất' },
    { id: 'DT-008', date: '27/05/2026', product: 'Tem uv dtf', spec: 'Tem uv dtf', qty: 22.3, unit: 'm', unitPrice: 145000, vat: 258831, deposit: 0, depositDate: '', paid: 3494216, paidDate: '', bank: '', note: '', tag: 'Công ty', vatExport: true, invoiceStatus: 'Chờ xuất' },
];

const MOCK_SUPPLIERS = [
    { id: 'NCC-001', name: 'Cty Giấy XYZ', mst: '0123456789', phone: '0901234567', email: 'xyz@gmail.com', bank: 'Vietcombank - 1234567890', address: '12 Nguyễn Văn Bảo, Q.Gò Vấp', type: 'Nguyên liệu', note: 'Cung cấp giấy định lượng C300, I300' },
    { id: 'NCC-002', name: 'Cty In Offset ABC', mst: '9876543210', phone: '0987654321', email: 'abc@company.vn', bank: 'Techcombank - 9876543210', address: '55 Đinh Tiên Hoàng, Q.1', type: 'In ấn', note: 'Thuê in offset số lượng lớn' },
    { id: 'NCC-003', name: 'Cty Gia công Bế XYZ', mst: '1122334455', phone: '0912345678', email: 'be@xyz.vn', bank: 'MB Bank - 0001234567', address: '88 Lý Thường Kiệt, Q.10', type: 'Gia công', note: 'Bế khuôn, Bồi, Cán' },
];

const MOCK_SUPPLIER_INVOICES = [
    { id: 'HDNCC-001', supplierId: 'NCC-001', supplierName: 'Cty Giấy XYZ', date: '05/01/2026', invoiceNo: 'HD20260001', desc: 'Mua giấy C300 định lượng 300g', amount: 2400000, vat: 240000, total: 2640000, paid: 2640000, paidDate: '10/01/2026', forOrders: 'DT-003, DT-007', status: 'Đã thanh toán', note: '' },
    { id: 'HDNCC-002', supplierId: 'NCC-002', supplierName: 'Cty In Offset ABC', date: '20/01/2026', invoiceNo: 'HD20260015', desc: 'Thuê in offset thẻ bài 10.000c', amount: 3600000, vat: 360000, total: 3960000, paid: 2000000, paidDate: '25/01/2026', forOrders: 'DT-007', status: 'Còn nợ', note: 'Còn nợ 1.960.000đ' },
    { id: 'HDNCC-003', supplierId: 'NCC-003', supplierName: 'Cty Gia công Bế XYZ', date: '22/01/2026', invoiceNo: 'HD20260022', desc: 'Bế khuôn + cán mờ 20.000 tem', amount: 1800000, vat: 180000, total: 1980000, paid: 0, paidDate: '', forOrders: 'DT-003', status: 'Chưa thanh toán', note: '' },
    { id: 'HDNCC-004', supplierId: 'NCC-001', supplierName: 'Cty Giấy XYZ', date: '20/05/2026', invoiceNo: 'HD20260089', desc: 'Mua giấy I300 5.000 tờ khổ 65x43', amount: 4200000, vat: 420000, total: 4620000, paid: 4620000, paidDate: '23/05/2026', forOrders: 'DT-007, DT-008', status: 'Đã thanh toán', note: '' },
];

const MOCK_VAT_INVOICES = [
    { id: 'HD-001', date: '07/01/2026', product: 'TEM UV In Cốc Huế', spec: 'Tem UV 4m', specOrder: 'Tem UV [0.4x7.5x3.5] 4m', unit: 'm', qty: 6, price: 285000, vat: 136800, total: 1846800, sale: 'Chiến', company: 'In Cốc Huế', mst: '', email: '', written: 'Đã viết', note: '' },
    { id: 'HD-002', date: '22/01/2026', product: 'TEM UV Hiền màu', spec: 'Tem UV 2 mặt 20.000c', specOrder: 'Tem UV [0.42x13/0.39x14/0.34x10x2]', unit: 'cái', qty: 20000, price: 662, vat: 1059200, total: 14299200, sale: 'Chiến', company: 'Cty Hiền màu', mst: '2601152032', email: 'gmt2303@gmail.com', written: 'Đã viết', note: '' },
    { id: 'HD-003', date: '23/05/2026', product: 'Thẻ bài', spec: 'Thẻ 8.5x14.2cm đỏ nhũ vàng', specOrder: 'Thẻ tag tải trọng 8.5x14.2cm', unit: 'cái', qty: 5000, price: 930, vat: 372000, total: 5022000, sale: 'Chiến', company: 'Cty TNHH SX Pearl Farm', mst: '1101339301', email: 'pearlfarm.vn@gmail.com', written: 'Chờ viết', note: '' },
];

const VAT_COLS = ['STT','Ngày','Tên SP xuất VAT','Quy cách','Quy cách ĐH+BC','ĐVT','SL','Đơn giá','Thành tiền','VAT (10%)','Tổng đơn','NVKD','Thông tin CT','MST','Email nhận HĐ','Trạng thái','Ghi chú'];
const TAGS = ['Cá nhân','Hộ KD','Công ty'];
const TAG_COLORS = { 'Cá nhân': 'bg-slate-100 text-slate-700', 'Hộ KD': 'bg-emerald-100 text-emerald-700', 'Công ty': 'bg-blue-100 text-blue-700' };

const CHART_DATA = [
    { name: 'T1', thu: 48, chi: 32 }, { name: 'T2', thu: 62, chi: 41 },
    { name: 'T3', thu: 55, chi: 38 }, { name: 'T4', thu: 71, chi: 45 },
    { name: 'T5', thu: 83, chi: 52 }, { name: 'T6', thu: 92, chi: 59 },
];
const PIE_CATS = [
    { name: 'Tiền hàng', value: 68, color: '#3b82f6' },
    { name: 'Mua nguyên liệu', value: 16, color: '#f59e0b' },
    { name: 'Lương', value: 12, color: '#8b5cf6' },
    { name: 'Chi phí in', value: 4, color: '#ef4444' },
];

// ==================== MODALS ====================
function AddVATModal({ onClose, onAdd }) {
    const [f, setF] = useState({ date: '', product: '', spec: '', specOrder: '', unit: 'cái', qty: '', price: '', sale: 'Chiến', company: '', mst: '', email: '', written: 'Chờ viết', note: '' });
    const amount = (f.qty || 0) * (f.price || 0);
    const vat = amount * 0.1;
    const total = amount + vat;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-blue-50 rounded-t-2xl">
                    <h3 className="font-semibold text-blue-800 flex items-center gap-2"><Receipt size={18} /> Thêm Hóa đơn VAT Đầu ra</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4">
                    <div><label className="label">Ngày</label><input type="text" value={f.date} onChange={e => setF({...f, date: e.target.value})} placeholder="DD/MM/YYYY" className="inp" /></div>
                    <div><label className="label">NVKD</label><input value={f.sale} onChange={e => setF({...f, sale: e.target.value})} className="inp" /></div>
                    <div className="col-span-2"><label className="label">Tên sản phẩm xuất VAT</label><input value={f.product} onChange={e => setF({...f, product: e.target.value})} className="inp" /></div>
                    <div><label className="label">Quy cách</label><input value={f.spec} onChange={e => setF({...f, spec: e.target.value})} className="inp" /></div>
                    <div><label className="label">Quy cách ĐH+BC</label><input value={f.specOrder} onChange={e => setF({...f, specOrder: e.target.value})} className="inp" /></div>
                    <div><label className="label">ĐVT</label>
                        <select value={f.unit} onChange={e => setF({...f, unit: e.target.value})} className="inp">
                            <option>cái</option><option>m</option><option>bộ</option><option>hộp</option>
                        </select>
                    </div>
                    <div><label className="label">Số lượng</label><input type="number" value={f.qty} onChange={e => setF({...f, qty: +e.target.value})} className="inp" /></div>
                    <div><label className="label">Đơn giá</label><input type="number" value={f.price} onChange={e => setF({...f, price: +e.target.value})} className="inp" /></div>
                    <div className="col-span-2 bg-blue-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-sm">
                        <div><p className="text-slate-500 text-xs">Thành tiền</p><p className="font-bold text-slate-800">{fmt(amount)}đ</p></div>
                        <div><p className="text-slate-500 text-xs">VAT 10%</p><p className="font-bold text-purple-700">{fmt(vat)}đ</p></div>
                        <div><p className="text-slate-500 text-xs">Tổng đơn</p><p className="font-bold text-blue-700">{fmt(total)}đ</p></div>
                    </div>
                    <div className="col-span-2"><label className="label">Tên Công ty khách</label><input value={f.company} onChange={e => setF({...f, company: e.target.value})} className="inp" /></div>
                    <div><label className="label">MST</label><input value={f.mst} onChange={e => setF({...f, mst: e.target.value})} className="inp" /></div>
                    <div><label className="label">Email nhận HĐ</label><input value={f.email} onChange={e => setF({...f, email: e.target.value})} className="inp" /></div>
                    <div><label className="label">Trạng thái</label>
                        <select value={f.written} onChange={e => setF({...f, written: e.target.value})} className="inp">
                            <option>Chờ viết</option><option>Đã viết</option><option>Đã gửi</option>
                        </select>
                    </div>
                    <div><label className="label">Ghi chú</label><input value={f.note} onChange={e => setF({...f, note: e.target.value})} className="inp" /></div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                    <button onClick={onClose} className="btn-ghost">Hủy</button>
                    <button onClick={() => onAdd({...f, id: `HD-${Date.now()}`, amount, vat, total})} className="btn-blue">Lưu hóa đơn</button>
                </div>
            </div>
        </div>
    );
}

function AddSupplierModal({ onClose, onAdd }) {
    const [f, setF] = useState({ name: '', mst: '', phone: '', email: '', bank: '', address: '', type: 'Nguyên liệu', note: '' });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-amber-50 rounded-t-2xl">
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2"><Building size={18} /> Thêm Nhà cung cấp</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="label">Tên NCC</label><input value={f.name} onChange={e => setF({...f, name: e.target.value})} className="inp" /></div>
                    <div><label className="label">Mã số thuế</label><input value={f.mst} onChange={e => setF({...f, mst: e.target.value})} className="inp" /></div>
                    <div><label className="label">Loại dịch vụ</label>
                        <select value={f.type} onChange={e => setF({...f, type: e.target.value})} className="inp">
                            {['Nguyên liệu','In ấn','Gia công','Vận chuyển','Khác'].map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div><label className="label">SĐT</label><input value={f.phone} onChange={e => setF({...f, phone: e.target.value})} className="inp" /></div>
                    <div><label className="label">Email</label><input value={f.email} onChange={e => setF({...f, email: e.target.value})} className="inp" /></div>
                    <div className="col-span-2"><label className="label">Số tài khoản NH</label><input value={f.bank} onChange={e => setF({...f, bank: e.target.value})} className="inp" /></div>
                    <div className="col-span-2"><label className="label">Địa chỉ</label><input value={f.address} onChange={e => setF({...f, address: e.target.value})} className="inp" /></div>
                    <div className="col-span-2"><label className="label">Ghi chú</label><input value={f.note} onChange={e => setF({...f, note: e.target.value})} className="inp" /></div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                    <button onClick={onClose} className="btn-ghost">Hủy</button>
                    <button onClick={() => onAdd({...f, id: `NCC-${Date.now()}`})} className="btn-amber">Lưu NCC</button>
                </div>
            </div>
        </div>
    );
}

function AddSupplierInvoiceModal({ suppliers, onClose, onAdd }) {
    const [f, setF] = useState({ supplierId: suppliers[0]?.id || '', invoiceNo: '', date: '', desc: '', amount: '', vat: 0, paid: 0, paidDate: '', forOrders: '', status: 'Chưa thanh toán', note: '' });
    const total = (+f.amount || 0) + (+f.vat || 0);
    const debt = total - (+f.paid || 0);
    const selSupplier = suppliers.find(s => s.id === f.supplierId);
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-rose-50 rounded-t-2xl">
                    <h3 className="font-semibold text-rose-800 flex items-center gap-2"><Receipt size={18} /> Thêm HĐ Nhà cung cấp (Đầu vào)</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="label">Nhà cung cấp</label>
                        <select value={f.supplierId} onChange={e => setF({...f, supplierId: e.target.value})} className="inp">
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div><label className="label">Số HĐ / mã chứng từ</label><input value={f.invoiceNo} onChange={e => setF({...f, invoiceNo: e.target.value})} className="inp" /></div>
                    <div><label className="label">Ngày HĐ</label><input value={f.date} onChange={e => setF({...f, date: e.target.value})} placeholder="DD/MM/YYYY" className="inp" /></div>
                    <div className="col-span-2"><label className="label">Nội dung / Diễn giải</label><input value={f.desc} onChange={e => setF({...f, desc: e.target.value})} className="inp" /></div>
                    <div><label className="label">Thành tiền (chưa VAT)</label><input type="number" value={f.amount} onChange={e => setF({...f, amount: +e.target.value})} className="inp" /></div>
                    <div><label className="label">VAT đầu vào</label><input type="number" value={f.vat} onChange={e => setF({...f, vat: +e.target.value})} className="inp" /></div>
                    <div className="col-span-2 bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-sm">
                        <div><p className="text-xs text-slate-500">Tổng tiền</p><p className="font-bold">{fmt(total)}đ</p></div>
                        <div><p className="text-xs text-slate-500">Đã TT</p><p className="font-bold text-emerald-700">{fmt(f.paid)}đ</p></div>
                        <div><p className="text-xs text-slate-500">Còn nợ</p><p className={`font-bold ${debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(debt)}đ</p></div>
                    </div>
                    <div><label className="label">Đã thanh toán</label><input type="number" value={f.paid} onChange={e => setF({...f, paid: +e.target.value})} className="inp" /></div>
                    <div><label className="label">Ngày TT</label><input value={f.paidDate} onChange={e => setF({...f, paidDate: e.target.value})} className="inp" /></div>
                    <div className="col-span-2"><label className="label">Cung cấp cho đơn hàng nào (mã DT, cách nhau dấu phẩy)</label><input value={f.forOrders} onChange={e => setF({...f, forOrders: e.target.value})} placeholder="VD: DT-003, DT-007" className="inp" /></div>
                    <div><label className="label">Trạng thái</label>
                        <select value={f.status} onChange={e => setF({...f, status: e.target.value})} className="inp">
                            <option>Chưa thanh toán</option><option>Còn nợ</option><option>Đã thanh toán</option>
                        </select>
                    </div>
                    <div><label className="label">Ghi chú</label><input value={f.note} onChange={e => setF({...f, note: e.target.value})} className="inp" /></div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                    <button onClick={onClose} className="btn-ghost">Hủy</button>
                    <button onClick={() => onAdd({...f, id: `HDNCC-${Date.now()}`, supplierName: selSupplier?.name || '', total, debt})} className="bg-rose-600 text-white px-5 py-2 rounded-xl font-semibold text-sm hover:bg-rose-700">Lưu HĐ đầu vào</button>
                </div>
            </div>
        </div>
    );
}

function AddRevenueModal({ onClose, onAdd }) {
    const [f, setF] = useState({ date: '', product: '', spec: '', qty: '', unit: 'cái', unitPrice: '', vat: 0, deposit: 0, depositDate: '', paid: '', paidDate: '', bank: '', note: '', tag: 'Cá nhân', vatExport: false, invoiceStatus: '' });
    const amount = (f.qty || 0) * (f.unitPrice || 0);
    const vatAmt = f.vatExport ? amount * 0.1 : 0;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-emerald-50 rounded-t-2xl">
                    <h3 className="font-semibold text-emerald-800 flex items-center gap-2"><Plus size={18} /> Thêm Doanh thu</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4">
                    <div><label className="label">Ngày lên đơn</label><input type="text" value={f.date} onChange={e => setF({...f, date: e.target.value})} placeholder="DD/MM/YYYY" className="inp" /></div>
                    <div><label className="label">Tag loại khách</label>
                        <select value={f.tag} onChange={e => setF({...f, tag: e.target.value})} className="inp">
                            {TAGS.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2"><label className="label">Tên sản phẩm</label><input value={f.product} onChange={e => setF({...f, product: e.target.value})} className="inp" /></div>
                    <div className="col-span-2"><label className="label">Quy cách (kích thước, nguyên liệu, số màu, số mã)</label><input value={f.spec} onChange={e => setF({...f, spec: e.target.value})} className="inp" /></div>
                    <div><label className="label">SL</label><input type="number" value={f.qty} onChange={e => setF({...f, qty: +e.target.value})} className="inp" /></div>
                    <div><label className="label">ĐVT</label>
                        <select value={f.unit} onChange={e => setF({...f, unit: e.target.value})} className="inp">
                            <option>cái</option><option>m</option><option>bộ</option><option>hộp</option>
                        </select>
                    </div>
                    <div><label className="label">Đơn giá</label><input type="number" value={f.unitPrice} onChange={e => setF({...f, unitPrice: +e.target.value})} className="inp" /></div>
                    <div className="flex items-center gap-2 mt-4">
                        <input type="checkbox" id="vat_exp" checked={f.vatExport} onChange={e => setF({...f, vatExport: e.target.checked, invoiceStatus: e.target.checked ? 'Chờ xuất' : ''})} className="w-4 h-4 accent-blue-600" />
                        <label htmlFor="vat_exp" className="text-sm font-medium text-slate-700">Xuất hóa đơn VAT</label>
                    </div>
                    <div className="col-span-2 bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-sm">
                        <div><p className="text-xs text-slate-500">Thành tiền</p><p className="font-bold">{fmt(amount)}đ</p></div>
                        <div><p className="text-xs text-slate-500">VAT (10%)</p><p className="font-bold text-purple-700">{fmt(vatAmt)}đ</p></div>
                        <div><p className="text-xs text-slate-500">Tổng tiền</p><p className="font-bold text-emerald-700">{fmt(amount + vatAmt)}đ</p></div>
                    </div>
                    <div><label className="label">Số tiền cọc</label><input type="number" value={f.deposit} onChange={e => setF({...f, deposit: +e.target.value})} className="inp" /></div>
                    <div><label className="label">Ngày cọc</label><input type="text" value={f.depositDate} onChange={e => setF({...f, depositDate: e.target.value})} className="inp" /></div>
                    <div><label className="label">Số tiền TT</label><input type="number" value={f.paid} onChange={e => setF({...f, paid: +e.target.value})} className="inp" /></div>
                    <div><label className="label">Ngày TT</label><input type="text" value={f.paidDate} onChange={e => setF({...f, paidDate: e.target.value})} className="inp" /></div>
                    <div><label className="label">Tài khoản NH</label><input value={f.bank} onChange={e => setF({...f, bank: e.target.value})} className="inp" /></div>
                    <div><label className="label">Ghi chú (giảm % / trừ ship)</label><input value={f.note} onChange={e => setF({...f, note: e.target.value})} className="inp" /></div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                    <button onClick={onClose} className="btn-ghost">Hủy</button>
                    <button onClick={() => onAdd({...f, id: `DT-${Date.now()}`, vat: vatAmt})} className="btn-green">Lưu doanh thu</button>
                </div>
            </div>
        </div>
    );
}

// ==================== MAIN ====================
export default function Finance() {
    const [activeTab, setActiveTab] = useState('revenue');
    const [vatInvoices, setVatInvoices] = useState(MOCK_VAT_INVOICES);
    const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS);
    const [supplierInvoices, setSupplierInvoices] = useState(MOCK_SUPPLIER_INVOICES);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [revenue, setRevenue] = useState(MOCK_REVENUE);
    const [tagFilter, setTagFilter] = useState('Tất cả');
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);

    const TABS = [
        { id: 'revenue', label: 'Bảng Doanh thu', icon: TrendingUp },
        { id: 'vat', label: 'Hóa đơn VAT', icon: Receipt },
        { id: 'supplier', label: 'Nhà cung cấp', icon: Building },
        { id: 'report', label: 'Báo cáo', icon: DollarSign },
    ];

    const filteredRevenue = useMemo(() => {
        return revenue.filter(r => {
            const matchTag = tagFilter === 'Tất cả' || r.tag === tagFilter;
            const matchSearch = !search || r.product.toLowerCase().includes(search.toLowerCase()) || r.spec.toLowerCase().includes(search.toLowerCase());
            return matchTag && matchSearch;
        });
    }, [revenue, tagFilter, search]);

    const companyRevenue = revenue.filter(r => r.tag === 'Công ty');
    const totalRevenue = filteredRevenue.reduce((s, r) => s + r.qty * r.unitPrice, 0);
    const totalVAT = filteredRevenue.reduce((s, r) => s + (r.vat || 0), 0);
    const totalDebt = filteredRevenue.reduce((s, r) => s + Math.max(0, (r.qty * r.unitPrice + (r.vat || 0)) - (r.paid || 0)), 0);
    const companyTotalBeforeTax = companyRevenue.reduce((s, r) => s + r.qty * r.unitPrice, 0);

    // Export CSV
    const exportCSV = (data, filename) => {
        const header = Object.keys(data[0]).join(',');
        const rows = data.map(r => Object.values(r).join(','));
        const blob = new Blob(['\uFEFF' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = filename + '.csv'; a.click();
    };

    const exportCompanyReport = () => {
        const data = companyRevenue.map((r, i) => ({
            STT: i + 1, 'Ngày': r.date, 'Sản phẩm': r.product, 'Quy cách': r.spec,
            'SL': r.qty, 'ĐVT': r.unit, 'Đơn giá': r.unitPrice,
            'Thành tiền': r.qty * r.unitPrice, 'VAT': r.vat || 0,
            'Tổng tiền': r.qty * r.unitPrice + (r.vat || 0),
            'Tiền cọc': r.deposit, 'Ngày cọc': r.depositDate,
            'Đã TT': r.paid, 'Ngày TT': r.paidDate,
            'TK NH': r.bank, 'Xuất VAT': r.vatExport ? 'Có' : 'Không', 'Ghi chú': r.note,
        }));
        exportCSV(data, 'doanhthu_congty');
    };

    return (
        <div className="space-y-6 pb-24 md:pb-8">
            <style>{`
                .label { display:block; font-size:0.75rem; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; }
                .inp { width:100%; padding:8px 12px; border:1px solid #e2e8f0; border-radius:10px; font-size:0.875rem; outline:none; }
                .inp:focus { border-color:#60a5fa; box-shadow:0 0 0 3px rgba(96,165,250,.15); }
                .btn-ghost { padding:8px 16px; font-size:0.875rem; color:#64748b; border:1px solid #e2e8f0; border-radius:10px; }
                .btn-ghost:hover { background:#f8fafc; }
                .btn-blue { padding:8px 20px; font-size:0.875rem; color:white; background:#2563eb; border-radius:10px; font-weight:600; }
                .btn-blue:hover { background:#1d4ed8; }
                .btn-green { padding:8px 20px; font-size:0.875rem; color:white; background:#059669; border-radius:10px; font-weight:600; }
                .btn-green:hover { background:#047857; }
                .btn-amber { padding:8px 20px; font-size:0.875rem; color:white; background:#d97706; border-radius:10px; font-weight:600; }
                .btn-amber:hover { background:#b45309; }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <Wallet className="text-blue-600" size={28} /> Kế toán & Tài chính
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Doanh thu · Hóa đơn VAT · Nhà cung cấp · Báo cáo</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {activeTab === 'revenue' && (
                        <>
                            <button onClick={() => setModal('revenue')} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700">
                                <Plus size={16} /> Thêm doanh thu
                            </button>
                            {tagFilter === 'Công ty' && (
                                <button onClick={exportCompanyReport} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
                                    <Download size={16} /> Xuất bảng Công ty
                                </button>
                            )}
                        </>
                    )}
                    {activeTab === 'vat' && (
                        <button onClick={() => setModal('vat')} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
                            <Plus size={16} /> Thêm HĐ VAT
                        </button>
                    )}
                    {activeTab === 'supplier' && (
                        <button onClick={() => setModal('supplier')} className="flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-700">
                            <Plus size={16} /> Thêm NCC
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">Tổng DT ({tagFilter})</p>
                    <p className="text-xl font-bold text-emerald-600">{fmt(totalRevenue)}đ</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">VAT đầu ra</p>
                    <p className="text-xl font-bold text-purple-600">{fmt(totalVAT)}đ</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">Công nợ phải thu</p>
                    <p className="text-xl font-bold text-amber-600">{fmt(totalDebt)}đ</p>
                </div>
                <div className="bg-blue-600 rounded-2xl p-5 border border-blue-500 shadow-sm">
                    <p className="text-xs text-blue-100 mb-1">DT Công ty (trước thuế)</p>
                    <p className="text-xl font-bold text-white">{fmt(companyTotalBeforeTax)}đ</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1 w-fit">
                {TABS.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                        <t.icon size={15} /> {t.label}
                    </button>
                ))}
            </div>

            {/* ==================== REVENUE TAB ==================== */}
            {activeTab === 'revenue' && (
                <div>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm, quy cách..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400" />
                        </div>
                        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
                            {['Tất cả', ...TAGS].map(t => (
                                <button key={t} onClick={() => setTagFilter(t)} className={`px-3 py-2 text-xs font-semibold transition-colors ${tagFilter === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{t}</button>
                            ))}
                        </div>
                    </div>

                    {/* Company revenue banner */}
                    {tagFilter === 'Công ty' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Building size={20} className="text-blue-600" />
                                <div>
                                    <p className="font-semibold text-blue-800">Doanh thu Công ty tháng này</p>
                                    <p className="text-sm text-blue-600">Tổng doanh thu trước thuế: <strong>{fmt(companyTotalBeforeTax)}đ</strong> · VAT: <strong>{fmt(companyRevenue.reduce((s,r) => s+(r.vat||0), 0))}đ</strong></p>
                                </div>
                            </div>
                            <button onClick={exportCompanyReport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                                <Download size={16} /> Xuất CSV
                            </button>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        {['Ngày','Tên SP','Quy cách','SL','ĐVT','Đơn giá','Thành tiền','VAT','Tổng tiền','Tiền cọc','Ng.cọc','Đã TT','Ng.TT','TK NH','Tag','Ghi chú'].map(h => (
                                            <th key={h} className="text-left px-3 py-3 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRevenue.map(r => {
                                        const amount = r.qty * r.unitPrice;
                                        const total = amount + (r.vat || 0);
                                        return (
                                            <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{r.date}</td>
                                                <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{r.product}</td>
                                                <td className="px-3 py-2.5 text-slate-600 max-w-[150px] truncate" title={r.spec}>{r.spec}</td>
                                                <td className="px-3 py-2.5 text-right">{r.qty.toLocaleString('vi-VN')}</td>
                                                <td className="px-3 py-2.5 text-slate-500">{r.unit}</td>
                                                <td className="px-3 py-2.5 text-right">{fmt(r.unitPrice)}</td>
                                                <td className="px-3 py-2.5 text-right font-semibold">{fmt(amount)}</td>
                                                <td className="px-3 py-2.5 text-right text-purple-600">{r.vat ? fmt(r.vat) : '—'}</td>
                                                <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{fmt(total)}</td>
                                                <td className="px-3 py-2.5 text-right text-blue-600">{r.deposit ? fmt(r.deposit) : '—'}</td>
                                                <td className="px-3 py-2.5 text-slate-500">{r.depositDate || '—'}</td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{r.paid ? fmt(r.paid) : '—'}</td>
                                                <td className="px-3 py-2.5 text-slate-500">{r.paidDate || '—'}</td>
                                                <td className="px-3 py-2.5 text-slate-600">{r.bank || '—'}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${TAG_COLORS[r.tag]}`}>{r.tag}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-500 max-w-[100px] truncate">{r.note || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-sm">
                                        <td colSpan={6} className="px-3 py-3 text-slate-600">Tổng ({filteredRevenue.length} đơn)</td>
                                        <td className="px-3 py-3 text-right text-slate-800">{fmt(filteredRevenue.reduce((s,r) => s + r.qty*r.unitPrice, 0))}</td>
                                        <td className="px-3 py-3 text-right text-purple-600">{fmt(totalVAT)}</td>
                                        <td className="px-3 py-3 text-right text-emerald-700">{fmt(filteredRevenue.reduce((s,r) => s + r.qty*r.unitPrice + (r.vat||0), 0))}</td>
                                        <td colSpan={7}></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== VAT INVOICES TAB ==================== */}
            {activeTab === 'vat' && (
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                            <p className="text-xs text-blue-600 font-semibold mb-1">Tổng HĐ đầu ra</p>
                            <p className="text-2xl font-bold text-blue-700">{fmt(vatInvoices.reduce((s,i) => s + (i.total||0), 0))}đ</p>
                            <p className="text-xs text-blue-500 mt-0.5">VAT: {fmt(vatInvoices.reduce((s,i) => s + (i.vat||0), 0))}đ</p>
                        </div>
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                            <p className="text-xs text-amber-600 font-semibold mb-1">Chờ xuất</p>
                            <p className="text-2xl font-bold text-amber-700">{vatInvoices.filter(i => i.written === 'Chờ viết').length} hóa đơn</p>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-semibold mb-1">Đã viết/gửi</p>
                            <p className="text-2xl font-bold text-emerald-700">{vatInvoices.filter(i => i.written !== 'Chờ viết').length} hóa đơn</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[1400px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        {VAT_COLS.map(c => <th key={c} className="text-left px-3 py-3 font-semibold text-slate-500 whitespace-nowrap">{c}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {vatInvoices.map((inv, idx) => (
                                        <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="px-3 py-3 text-slate-500">{idx + 1}</td>
                                            <td className="px-3 py-3 whitespace-nowrap">{inv.date}</td>
                                            <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">{inv.product}</td>
                                            <td className="px-3 py-3 text-slate-600 max-w-[120px] truncate" title={inv.spec}>{inv.spec}</td>
                                            <td className="px-3 py-3 text-slate-500 max-w-[120px] truncate" title={inv.specOrder}>{inv.specOrder}</td>
                                            <td className="px-3 py-3">{inv.unit}</td>
                                            <td className="px-3 py-3 text-right">{(inv.qty||0).toLocaleString('vi-VN')}</td>
                                            <td className="px-3 py-3 text-right">{fmt(inv.price)}</td>
                                            <td className="px-3 py-3 text-right font-semibold">{fmt(inv.qty * inv.price)}</td>
                                            <td className="px-3 py-3 text-right text-purple-600">{fmt(inv.vat)}</td>
                                            <td className="px-3 py-3 text-right font-bold text-emerald-700">{fmt(inv.total)}</td>
                                            <td className="px-3 py-3">{inv.sale}</td>
                                            <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">{inv.company}</td>
                                            <td className="px-3 py-3 font-mono text-slate-600">{inv.mst || '—'}</td>
                                            <td className="px-3 py-3 text-blue-600">{inv.email || '—'}</td>
                                            <td className="px-3 py-3">
                                                <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${inv.written === 'Đã viết' ? 'bg-emerald-100 text-emerald-700' : inv.written === 'Đã gửi' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {inv.written}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-slate-500">{inv.note || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                        <h3 className="font-semibold text-slate-200 mb-4">Tổng hợp VAT khai báo tháng</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-slate-400 text-xs mb-1">DT xuất HĐ</p>
                                <p className="font-bold text-emerald-300">{fmt(vatInvoices.reduce((s,i) => s + i.qty*i.price, 0))}đ</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-slate-400 text-xs mb-1">VAT đầu ra (10%)</p>
                                <p className="font-bold text-blue-300">{fmt(vatInvoices.reduce((s,i) => s + (i.vat||0), 0))}đ</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-slate-400 text-xs mb-1">VAT đầu vào KT</p>
                                <p className="font-bold text-amber-300">0đ</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <p className="text-slate-400 text-xs mb-1">VAT phải nộp</p>
                                <p className="font-bold text-red-300">{fmt(vatInvoices.reduce((s,i) => s + (i.vat||0), 0))}đ</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== SUPPLIER TAB ==================== */}
            {activeTab === 'supplier' && (
                <div className="space-y-5">
                    {/* KPI công nợ NCC */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Tổng NCC</p>
                            <p className="text-2xl font-bold text-slate-800">{suppliers.length}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Tổng HĐ đầu vào</p>
                            <p className="text-2xl font-bold text-slate-800">{supplierInvoices.length}</p>
                        </div>
                        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 shadow-sm">
                            <p className="text-xs text-rose-600 mb-1">Công nợ phải trả</p>
                            <p className="text-xl font-bold text-rose-700">{fmt(supplierInvoices.reduce((s,i) => s + Math.max(0, (i.total||0) - (i.paid||0)), 0))}đ</p>
                        </div>
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 shadow-sm">
                            <p className="text-xs text-amber-600 mb-1">VAT đầu vào</p>
                            <p className="text-xl font-bold text-amber-700">{fmt(supplierInvoices.reduce((s,i) => s + (i.vat||0), 0))}đ</p>
                        </div>
                    </div>

                    {/* Add HĐ NCC button */}
                    <div className="flex gap-3">
                        <button onClick={() => setModal('supplierInvoice')} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-rose-700">
                            <Plus size={16} /> Thêm HĐ đầu vào
                        </button>
                    </div>

                    {/* Supplier cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {suppliers.map(s => {
                            const sInvs = supplierInvoices.filter(i => i.supplierId === s.id);
                            const totalDebtNCC = sInvs.reduce((acc, i) => acc + Math.max(0, (i.total||0) - (i.paid||0)), 0);
                            const typeColors = { 'Nguyên liệu': 'bg-blue-100 text-blue-700', 'In ấn': 'bg-purple-100 text-purple-700', 'Gia công': 'bg-emerald-100 text-emerald-700', 'Vận chuyển': 'bg-amber-100 text-amber-700', 'Khác': 'bg-slate-100 text-slate-600' };
                            return (
                                <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-800">{s.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${typeColors[s.type] || 'bg-slate-100 text-slate-600'}`}>{s.type}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">MST: <span className="font-mono text-slate-700">{s.mst || '—'}</span></p>
                                        </div>
                                        {totalDebtNCC > 0 && <span className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded-xl font-bold whitespace-nowrap">Nợ: {fmt(totalDebtNCC)}đ</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                                        <div className="flex items-center gap-1.5"><User size={12} />{s.phone}</div>
                                        <div className="flex items-center gap-1.5"><FileText size={12} />{s.email}</div>
                                        <div className="flex items-center gap-1.5 col-span-2"><CreditCard size={12} />{s.bank}</div>
                                        {s.address && <div className="flex items-center gap-1.5 col-span-2 text-slate-400">{s.address}</div>}
                                    </div>
                                    {s.note && <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-2 py-1 mb-3">{s.note}</p>}

                                    {/* Invoices for this supplier */}
                                    {sInvs.length > 0 && (
                                        <div className="border-t border-slate-100 pt-3">
                                            <p className="text-xs font-semibold text-slate-500 mb-2">Hóa đơn ({sInvs.length})</p>
                                            <div className="space-y-1.5">
                                                {sInvs.map(inv => {
                                                    const debt = Math.max(0, (inv.total||0) - (inv.paid||0));
                                                    return (
                                                        <div key={inv.id} className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-mono text-slate-500">{inv.invoiceNo}</span>
                                                                    <span className="text-xs text-slate-400">{inv.date}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-700 truncate mt-0.5">{inv.desc}</p>
                                                                {inv.forOrders && <p className="text-xs text-blue-500 mt-0.5">📦 {inv.forOrders}</p>}
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="text-xs font-bold text-slate-800">{fmt(inv.total)}đ</p>
                                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                                                                    inv.status === 'Đã thanh toán' ? 'bg-emerald-100 text-emerald-700' :
                                                                    inv.status === 'Còn nợ' ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>{debt > 0 ? `Nợ ${fmt(debt)}đ` : '✓ Xong'}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* All supplier invoices table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800">Tất cả Hóa đơn đầu vào</h3>
                            <span className="text-xs text-slate-500">{supplierInvoices.length} hóa đơn</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[900px]">
                                <thead><tr className="bg-slate-50 border-b border-slate-100">
                                    {['Ngày','NCC','Số HĐ','Nội dung','Thành tiền','VAT','Tổng tiền','Đã TT','Còn nợ','Đơn hàng','Trạng thái','Ghi chú'].map(h => (
                                        <th key={h} className="text-left px-3 py-3 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {supplierInvoices.map(inv => {
                                        const debt = Math.max(0, (inv.total||0) - (inv.paid||0));
                                        return (
                                            <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{inv.date}</td>
                                                <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">{inv.supplierName}</td>
                                                <td className="px-3 py-2.5 font-mono text-slate-500">{inv.invoiceNo}</td>
                                                <td className="px-3 py-2.5 text-slate-600 max-w-[150px] truncate" title={inv.desc}>{inv.desc}</td>
                                                <td className="px-3 py-2.5 text-right">{fmt(inv.amount)}</td>
                                                <td className="px-3 py-2.5 text-right text-purple-600">{fmt(inv.vat)}</td>
                                                <td className="px-3 py-2.5 text-right font-bold text-slate-800">{fmt(inv.total)}</td>
                                                <td className="px-3 py-2.5 text-right text-emerald-600 font-semibold">{fmt(inv.paid)}</td>
                                                <td className="px-3 py-2.5 text-right font-bold text-rose-600">{debt > 0 ? fmt(debt) : '—'}</td>
                                                <td className="px-3 py-2.5 text-blue-500">{inv.forOrders || '—'}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        inv.status === 'Đã thanh toán' ? 'bg-emerald-100 text-emerald-700' :
                                                        inv.status === 'Còn nợ' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>{inv.status}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-slate-400">{inv.note || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot><tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-sm">
                                    <td colSpan={4} className="px-3 py-3 text-slate-700">TỔNG ({supplierInvoices.length})</td>
                                    <td className="px-3 py-3 text-right">{fmt(supplierInvoices.reduce((s,i) => s+(i.amount||0), 0))}</td>
                                    <td className="px-3 py-3 text-right text-purple-600">{fmt(supplierInvoices.reduce((s,i) => s+(i.vat||0), 0))}</td>
                                    <td className="px-3 py-3 text-right">{fmt(supplierInvoices.reduce((s,i) => s+(i.total||0), 0))}</td>
                                    <td className="px-3 py-3 text-right text-emerald-700">{fmt(supplierInvoices.reduce((s,i) => s+(i.paid||0), 0))}</td>
                                    <td className="px-3 py-3 text-right text-rose-600">{fmt(supplierInvoices.reduce((s,i) => s+Math.max(0,(i.total||0)-(i.paid||0)), 0))}</td>
                                    <td colSpan={3}></td>
                                </tr></tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== REPORT TAB ==================== */}
            {activeTab === 'report' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-5">Doanh thu theo tháng (tr.đ)</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={CHART_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip formatter={(v, n) => [`${v} tr.đ`, n === 'thu' ? 'Doanh thu' : 'Chi phí']} />
                                <Bar dataKey="thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="chi" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="font-semibold text-slate-800 mb-4">Phân loại DT</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart><Pie data={PIE_CATS} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                                {PIE_CATS.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie><Tooltip formatter={v => [v + '%', '']} /></PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-2">
                            {PIE_CATS.map(c => (
                                <div key={c.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} /><span className="text-slate-600">{c.name}</span></div>
                                    <span className="font-semibold">{c.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Company pre-tax revenue breakdown */}
                    <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-slate-800">Bảng Doanh thu Công ty – Trước thuế</h3>
                            <button onClick={exportCompanyReport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                                <Download size={15} /> Xuất CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[700px]">
                                <thead><tr className="bg-slate-50 border-b border-slate-100">
                                    {['Ngày','Sản phẩm','Quy cách','SL','Đơn giá','Thành tiền','VAT','Tổng tiền','Xuất HĐ','Ghi chú'].map(h => (
                                        <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-500">{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {companyRevenue.map(r => (
                                        <tr key={r.id} className="border-b border-slate-50">
                                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.date}</td>
                                            <td className="px-3 py-2.5 font-medium text-slate-800">{r.product}</td>
                                            <td className="px-3 py-2.5 text-slate-600 max-w-[140px] truncate" title={r.spec}>{r.spec}</td>
                                            <td className="px-3 py-2.5 text-right">{r.qty.toLocaleString('vi-VN')}</td>
                                            <td className="px-3 py-2.5 text-right">{fmt(r.unitPrice)}</td>
                                            <td className="px-3 py-2.5 text-right font-semibold">{fmt(r.qty * r.unitPrice)}</td>
                                            <td className="px-3 py-2.5 text-right text-purple-600">{fmt(r.vat || 0)}</td>
                                            <td className="px-3 py-2.5 text-right font-bold text-emerald-700">{fmt(r.qty * r.unitPrice + (r.vat||0))}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.vatExport ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {r.invoiceStatus || 'Không'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-500">{r.note || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot><tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-sm">
                                    <td colSpan={5} className="px-3 py-3 text-slate-700">TỔNG CỘNG ({companyRevenue.length} đơn Công ty)</td>
                                    <td className="px-3 py-3 text-right text-slate-800">{fmt(companyTotalBeforeTax)}</td>
                                    <td className="px-3 py-3 text-right text-purple-600">{fmt(companyRevenue.reduce((s,r) => s + (r.vat||0), 0))}</td>
                                    <td className="px-3 py-3 text-right text-emerald-700">{fmt(companyRevenue.reduce((s,r) => s + r.qty*r.unitPrice + (r.vat||0), 0))}</td>
                                    <td colSpan={2}></td>
                                </tr></tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {modal === 'vat' && <AddVATModal onClose={() => setModal(null)} onAdd={inv => { setVatInvoices(p => [inv, ...p]); setModal(null); }} />}
            {modal === 'supplier' && <AddSupplierModal onClose={() => setModal(null)} onAdd={s => { setSuppliers(p => [s, ...p]); setModal(null); }} />}
            {modal === 'revenue' && <AddRevenueModal onClose={() => setModal(null)} onAdd={r => { setRevenue(p => [r, ...p]); setModal(null); }} />}
            {modal === 'supplierInvoice' && <AddSupplierInvoiceModal suppliers={suppliers} onClose={() => setModal(null)} onAdd={inv => { setSupplierInvoices(p => [inv, ...p]); setModal(null); }} />}
        </div>
    );
}
