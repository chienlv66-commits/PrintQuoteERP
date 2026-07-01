import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LogIn, Printer, Shield, Users, Wrench, Calculator } from 'lucide-react';

const QUICK_ROLES = [
    { label: 'Quản lý / Admin', role: 'admin', email: 'admin@print.vn', icon: Shield, color: 'border-blue-500 bg-blue-50 text-blue-700' },
    { label: 'Nhân viên Sale', role: 'sale', email: 'sale@print.vn', icon: Users, color: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
    { label: 'Kế toán', role: 'accountant', email: 'accountant@print.vn', icon: Calculator, color: 'border-purple-500 bg-purple-50 text-purple-700' },
    { label: 'Xưởng Sản xuất', role: 'production', email: 'production@print.vn', icon: Wrench, color: 'border-orange-500 bg-orange-50 text-orange-700' },
];

export default function Login() {
    const { login, currentUser } = useAppContext();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [name, setName] = useState('');

    if (currentUser) return <Navigate to="/" replace />;

    const handleLogin = (e) => {
        e.preventDefault();
        
        // Cần đúng mật khẩu là 123456
        if (pass !== '123456') {
            alert('Mật khẩu không đúng! Vui lòng thử lại.');
            return;
        }

        let role = '';
        if (email === 'admin@print.vn') role = 'admin';
        else if (email === 'production@print.vn') role = 'production';
        else if (email === 'accountant@print.vn') role = 'accountant';
        else if (email === 'sale@print.vn') role = 'sale';
        else {
            alert('Email không tồn tại trong hệ thống!');
            return;
        }
        
        login(role, name);
        navigate('/');
    };

    return (
        <div className="min-h-screen flex bg-slate-900">
            {/* Left – branding */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Printer size={22} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">PrintQuote <span className="opacity-70">ERP</span></span>
                    </div>
                    <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                        Quản lý<br/>In ấn<br/>Chuyên nghiệp
                    </h1>
                    <p className="text-blue-200 text-lg">Hệ thống báo giá, quản lý đơn hàng, sản xuất và kế toán cho xưởng in.</p>
                </div>
                <div className="relative grid grid-cols-3 gap-4">
                    {[['Báo giá','Tính toán tự động, tối ưu khổ giấy'],['Sản xuất','Theo dõi tiến độ in vải & giấy'],['Kế toán','Sổ thu chi & quản lý VAT']].map(([t, d]) => (
                        <div key={t} className="bg-white/10 rounded-2xl p-4">
                            <p className="font-bold text-white mb-1">{t}</p>
                            <p className="text-blue-200 text-xs">{d}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right – login form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Printer size={20} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">PrintQuote <span className="text-blue-400">ERP</span></span>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">Đăng nhập</h2>
                        <p className="text-slate-500 text-sm mb-8">Đăng nhập để quản lý hệ thống in ấn của bạn</p>

                        <form onSubmit={handleLogin} className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên hiển thị</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all mb-4"
                                />
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    placeholder="admin@print.vn"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={pass}
                                    onChange={e => setPass(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-2 shadow-md shadow-blue-900/20">
                                <LogIn size={18} /> Đăng nhập
                            </button>
                        </form>

                    </div>
                </div>
            </div>
        </div>
    );
}