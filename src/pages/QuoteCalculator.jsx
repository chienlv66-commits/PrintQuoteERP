import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Box, Layers, Tag, CreditCard, Sparkles, Droplet, Sun, Hash, Shirt } from 'lucide-react';

export default function QuoteCalculator() {
    const CALCULATORS = [
        {
            title: 'Mác In Vải (Ribbon/Flexo)',
            description: 'Công cụ tính giá Mác in Satin, Cotton, Vải Giấy (Chuyển nhiệt & Flexo cuộn).',
            icon: Shirt,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
            path: '/fabric-calculator'
        },
        {
            title: 'In Offset & Nhanh (Card, Tờ Rơi)',
            description: 'Công cụ báo giá tổng hợp cho In Offset và In Nhanh (Card visit, Tờ rơi, Giấy các loại).',
            icon: Layers,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            path: '/test-pricing'
        },
        {
            title: 'Tem UV DTF',
            description: 'Báo giá tem UV DTF dán mọi chất liệu, tính theo mét dài.',
            icon: Sparkles,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            path: '/test-extra?type=tem_uv_dtf'
        },
        {
            title: 'Tem Void',
            description: 'Tem niêm phong Void Open, để lại chữ khi bóc.',
            icon: Hash,
            color: 'text-red-500',
            bg: 'bg-red-50',
            border: 'border-red-200',
            path: '/test-extra?type=void'
        },
        {
            title: 'Biển Mica',
            description: 'Báo giá biển bảng Mica, cắt CNC, in UV.',
            icon: Box,
            color: 'text-cyan-500',
            bg: 'bg-cyan-50',
            border: 'border-cyan-200',
            path: '/test-extra?type=mica'
        },
        {
            title: 'Mác Da',
            description: 'Báo giá mác da PU, da thật khắc laser dập chìm.',
            icon: CreditCard,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            path: '/test-extra?type=mac_da'
        },
        {
            title: 'Tem Nhiệt',
            description: 'Giấy in mã vạch, tem trà sữa bế cuộn.',
            icon: Droplet,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            path: '/test-extra?type=tem_nhiet'
        },
        {
            title: 'Tem PET',
            description: 'Tem PET chịu nhiệt, độ bền cao.',
            icon: Sun,
            color: 'text-yellow-500',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            path: '/test-extra?type=tem_pet'
        },
        {
            title: 'Tem Cao Thành 1 Màu',
            description: 'Tem cao cấp ép nổi, phủ silicone cao thành.',
            icon: Tag,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            path: '/test-extra?type=tem_cao_thanh_1_mau'
        },
        {
            title: 'Dây Logo',
            description: 'Dây dù, dây sáp, lụa ruy băng in logo.',
            icon: Layers,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
            path: '/test-extra?type=day_logo'
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                <Calculator className="text-blue-600" /> Trung Tâm Báo Giá (Quote Hub)
            </h1>
            <p className="text-slate-500 mb-8">Lựa chọn công cụ tính giá tự động phù hợp với loại sản phẩm khách hàng yêu cầu.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CALCULATORS.map((calc, i) => (
                    <Link 
                        key={i} 
                        to={calc.path}
                        className={`block bg-white rounded-2xl border ${calc.border} p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group`}
                    >
                        <div className={`w-14 h-14 ${calc.bg} ${calc.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <calc.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{calc.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{calc.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}