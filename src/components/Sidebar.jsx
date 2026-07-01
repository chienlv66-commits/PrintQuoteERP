import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calculator, FileText, Factory, Wallet, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Sidebar() {
    const { currentUser, logout } = useAppContext();
    if (!currentUser) return null;

    // Định nghĩa menu theo Role
    const menus = [
        { path: '/', icon: LayoutDashboard, label: 'Tổng quan', roles: ['admin', 'sale', 'production'] },
        { path: '/calculator', icon: Calculator, label: 'Báo giá nhanh', roles: ['admin', 'sale'] },
        { path: '/orders', icon: FileText, label: 'Đơn hàng (Auto)', roles: ['admin', 'sale'] },
        { path: '/create-order', icon: FileText, label: 'Tạo đơn (Thủ công)', roles: ['admin', 'sale'] },
        { path: '/production', icon: Factory, label: 'Sản xuất', roles: ['admin', 'production'] },
        { path: '/finance', icon: Wallet, label: 'Kế toán', roles: ['admin'] },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed">
            <div className="p-6 text-2xl font-bold border-b border-slate-700">
                PrintQuote <span className="text-blue-400">ERP</span>
            </div>
            
            <div className="px-4 py-6 border-b border-slate-700">
                <p className="text-sm text-slate-400">Xin chào,</p>
                <p className="font-semibold text-lg">{currentUser.name}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500 text-xs rounded uppercase">{currentUser.role}</span>
            </div>

            <nav className="flex-grow py-4">
                {menus.filter(m => m.roles.includes(currentUser.role)).map((item, idx) => (
                    <NavLink 
                        key={idx} 
                        to={item.path} 
                        end={item.path === '/'}
                        className={({isActive}) => 
                            `flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
                        }
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <button onClick={logout} className="flex items-center gap-3 px-6 py-4 text-slate-400 hover:bg-red-600 hover:text-white transition-colors">
                <LogOut size={20} /> Đăng xuất
            </button>
        </aside>
    );
}