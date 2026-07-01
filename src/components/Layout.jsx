import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
    LayoutDashboard, Calculator, FileText, Factory, Wallet,
    LogOut, ChevronLeft, ChevronRight, Menu, X, PlusCircle, Bell,
    Users, Settings, DollarSign, Package
} from 'lucide-react';

const MENU = [
    {
        group: 'Tổng Quan',
        items: [
            { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'sale', 'production', 'accountant'] },
        ]
    },
    {
        group: 'Kinh Doanh',
        items: [
            { path: '/calculator', icon: Calculator, label: 'Báo giá nhanh', roles: ['admin', 'sale'] },
            { path: '/orders', icon: FileText, label: 'Đơn hàng', roles: ['admin', 'sale'] },
            { path: '/create-order', icon: PlusCircle, label: 'Tạo đơn mới', roles: ['admin', 'sale'] },
            { path: '/customers', icon: Users, label: 'Khách hàng', roles: ['admin', 'sale'] },
        ]
    },
    {
        group: 'Sản Xuất',
        items: [
            { path: '/production', icon: Factory, label: 'Lệnh sản xuất', roles: ['admin', 'production'] },
            { path: '/inventory', icon: Package, label: 'Kho vật tư', roles: ['admin', 'production', 'accountant'] },
        ]
    },
    {
        group: 'Kế Toán',
        items: [
            { path: '/cashbook', icon: Wallet, label: 'Sổ thu chi', roles: ['admin', 'accountant'] },
            { path: '/debt', icon: DollarSign, label: 'Công nợ', roles: ['admin', 'accountant'] },
            { path: '/suppliers', icon: Users, label: 'Nhà cung cấp', roles: ['admin', 'accountant', 'production'] },
        ]
    },
    {
        group: 'Quản Trị',
        items: [
            { path: '/test-pricing', icon: FileText, label: 'Test Công thức', roles: ['admin'] },
            { path: '/test-extra', icon: Calculator, label: 'Test Extra Modules', roles: ['admin'] },
        ]
    },
];

const ROLE_LABELS = { admin: 'Quản trị viên', sale: 'Nhân viên Sale', production: 'Xưởng sản xuất', accountant: 'Kế toán' };
const ROLE_COLORS = { admin: 'bg-blue-600', sale: 'bg-emerald-600', production: 'bg-orange-500', accountant: 'bg-purple-600' };

export default function Layout() {
    const { currentUser, logout } = useAppContext();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!currentUser) return null;

    const sidebarW = collapsed ? 'w-16' : 'w-64';
    const mainML = collapsed ? 'ml-16' : 'ml-64';

    const NavItem = ({ item, mobile = false }) => {
        const hasAccess = item.roles.includes(currentUser.role);
        if (!hasAccess) return null;

        return (
            <NavLink
                to={item.path}
                end={item.path === '/'}
                onClick={() => mobile && setMobileOpen(false)}
                className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                        : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
                    }
                    ${collapsed && !mobile ? 'justify-center px-2' : ''}
                    `
                }
                title={collapsed && !mobile ? item.label : ''}
            >
                <item.icon size={18} className="shrink-0" />
                {(!collapsed || mobile) && <span>{item.label}</span>}
            </NavLink>
        );
    };

    const SidebarContent = ({ mobile = false }) => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center justify-between px-4 py-4 border-b border-slate-700/50 ${collapsed && !mobile ? 'justify-center' : ''}`}>
                {(!collapsed || mobile) && (
                    <span className="text-xl font-bold text-white tracking-tight">
                        Print<span className="text-blue-400">Quote</span>
                        <span className="text-xs ml-1.5 bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold tracking-wide">ERP</span>
                    </span>
                )}
                {!mobile && (
                    <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                )}
            </div>

            {/* User info */}
            {(!collapsed || mobile) && (
                <div className="px-4 py-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${ROLE_COLORS[currentUser.role]} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                            {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{currentUser.name}</p>
                            <p className="text-xs text-slate-400">{ROLE_LABELS[currentUser.role]}</p>
                        </div>
                    </div>
                </div>
            )}
            {collapsed && !mobile && (
                <div className="flex justify-center py-3 border-b border-slate-700/50">
                    <div className={`w-8 h-8 rounded-full ${ROLE_COLORS[currentUser.role]} flex items-center justify-center text-white font-bold text-sm`}>
                        {currentUser.name.charAt(0)}
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {MENU.map(group => {
                    const visibleItems = group.items.filter(i => i.roles.includes(currentUser.role));
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={group.group}>
                            {(!collapsed || mobile) && (
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 px-1">{group.group}</p>
                            )}
                            <div className="space-y-0.5">
                                {visibleItems.map(item => <NavItem key={item.path} item={item} mobile={mobile} />)}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-slate-700/50">
                <button
                    onClick={logout}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}
                    title={collapsed && !mobile ? 'Đăng xuất' : ''}
                >
                    <LogOut size={18} className="shrink-0" />
                    {(!collapsed || mobile) && 'Đăng xuất'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Desktop Sidebar */}
            <aside className={`${sidebarW} bg-slate-900 fixed top-0 left-0 h-screen z-30 transition-all duration-200 ease-in-out hidden md:block overflow-hidden`}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 z-50 overflow-y-auto">
                        <div className="flex justify-end p-3">
                            <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <SidebarContent mobile={true} />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-1 ${mainML} transition-all duration-200 ease-in-out min-w-0`}>
                {/* Top bar */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 md:px-6 py-3 flex items-center justify-between">
                    <button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-500 hover:text-slate-900 p-1">
                        <Menu size={22} />
                    </button>
                    <div className="hidden md:block text-sm text-slate-500">
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className={`w-8 h-8 rounded-full ${ROLE_COLORS[currentUser.role]} flex items-center justify-center text-white font-bold text-sm`}>
                            {currentUser.name.charAt(0)}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 md:p-6 lg:p-8 page-enter">
                    <Outlet />
                </main>

                {/* Mobile bottom nav */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex">
                    {MENU.flatMap(g => g.items).filter(i => i.roles.includes(currentUser.role)).slice(0, 5).map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors
                                ${isActive ? 'text-blue-600' : 'text-slate-500'}`
                            }
                        >
                            <item.icon size={20} />
                            <span className="truncate max-w-full px-1">{item.label.split(' ')[0]}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
}