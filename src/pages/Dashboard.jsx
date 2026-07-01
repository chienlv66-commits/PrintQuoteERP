import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getDataFromSheet } from '../services/api';
import {
    TrendingUp, ShoppingCart, AlertCircle, CheckCircle,
    Clock, DollarSign, Package, Users, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n || 0);

const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    let bg = 'bg-slate-100 text-slate-800';
    if (s.includes('chờ')) bg = 'bg-yellow-100 text-yellow-800';
    if (s.includes('nhận') || s.includes('chốt')) bg = 'bg-blue-100 text-blue-800';
    if (s.includes('sản xuất')) bg = 'bg-purple-100 text-purple-800';
    if (s.includes('hoàn tất') || s.includes('thanh toán')) bg = 'bg-emerald-100 text-emerald-800';
    if (s.includes('giao')) bg = 'bg-indigo-100 text-indigo-800';
    if (s.includes('hủy')) bg = 'bg-red-100 text-red-800';

    return (
        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md ${bg} whitespace-nowrap`}>
            {status || 'Chờ xác nhận'}
        </span>
    );
};

const StatCard = ({ icon: Icon, label, value, sub, color, trend, trendUp }) => (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color}`}></div>
        <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={`p-2.5 rounded-xl text-white shadow-sm ${color}`}>
                <Icon size={20} />
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-500 bg-red-50 px-2 py-1 rounded-md'}`}>
                    {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            )}
        </div>
        <div className="text-2xl font-black text-slate-800 mb-1 relative z-10">{value}</div>
        <div className="text-sm font-medium text-slate-500 relative z-10">{label}</div>
        {sub && <div className="text-xs font-semibold text-slate-400 mt-1 relative z-10">{sub}</div>}
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-100 rounded-xl shadow-xl px-4 py-3 text-sm">
                <p className="font-bold text-slate-700 mb-2">{label}</p>
                {payload.map((p, i) => (
                    <p key={i} className="font-medium" style={{ color: p.color }}>
                        {p.name}: <strong>{fmt(p.value)} đ</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const { currentUser } = useAppContext();
    const isAdmin = currentUser?.role === 'admin';
    const isSale = currentUser?.role === 'sale';

    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        revenueMonth: 0,
        activeOrders: 0,
        needConfirm: 0,
        totalDebt: 0,
        completedOrders: 0,
        recentOrders: [],
        statusData: [],
        salePerf: [],
        revenueData: []
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const resOrders = await getDataFromSheet('Orders');
            if (resOrders.status === 'success' && resOrders.data) {
                const orders = resOrders.data;
                processDashboardData(orders);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const processDashboardData = (orders) => {
        const currentMonth = new Date().getMonth(); // 0-11
        const currentYear = new Date().getFullYear();

        let revMonth = 0;
        let activeOrd = 0;
        let needConf = 0;
        let tDebt = 0;
        let compOrd = 0;

        const statusCount = {};
        const saleMap = {};
        const revByMonthMap = {};

        // Prepare last 6 months for chart
        for (let i = 5; i >= 0; i--) {
            let d = new Date(currentYear, currentMonth - i, 1);
            let mStr = `T${d.getMonth() + 1}`;
            revByMonthMap[mStr] = { name: mStr, doanhThu: 0, chiPhi: 0 };
        }

        orders.forEach(o => {
            const [
                id, dateStr, user, type, cusName, phone, addr, 
                prodName, mat, dim, qty, price, total, 
                deposit, remain, spec, proc, note, status
            ] = o;

            const t = Number(total) || 0;
            const r = Number(remain) || 0;
            const s = (status || 'Chờ xác nhận').trim();
            const u = (user || 'Admin').trim();

            const orderDate = new Date(dateStr);
            const isThisMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
            const mStr = `T${orderDate.getMonth() + 1}`;

            // Aggregate Monthly Revenue (Doanh thu tháng này)
            if (isThisMonth && !s.toLowerCase().includes('hủy')) {
                revMonth += t;
            }

            // Chart Revenue
            if (revByMonthMap[mStr] && !s.toLowerCase().includes('hủy')) {
                revByMonthMap[mStr].doanhThu += t;
                // Giả lập chi phí = 65% doanh thu
                revByMonthMap[mStr].chiPhi += t * 0.65; 
            }

            // Active orders & Completed
            const sLower = s.toLowerCase();
            if (sLower.includes('hoàn tất') || sLower.includes('thanh toán')) {
                if (isThisMonth) compOrd++;
            } else if (!sLower.includes('hủy')) {
                activeOrd++;
                if (sLower.includes('chờ')) needConf++;
            }

            // Debt
            if (!sLower.includes('hủy')) {
                tDebt += r;
            }

            // Status count
            statusCount[s] = (statusCount[s] || 0) + 1;

            // Sale Performance
            if (!saleMap[u]) saleMap[u] = { name: u, rev: 0, orders: 0 };
            if (isThisMonth && !sLower.includes('hủy')) {
                saleMap[u].rev += t;
                saleMap[u].orders += 1;
            }
        });

        const statusColors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#64748b'];
        const statusData = Object.keys(statusCount).map((key, idx) => ({
            name: key,
            value: statusCount[key],
            color: statusColors[idx % statusColors.length]
        }));

        const salePerf = Object.values(saleMap)
            .sort((a, b) => b.rev - a.rev)
            .slice(0, 5); // top 5

        const recentOrders = [...orders].reverse().slice(0, 5).map(o => ({
            id: o[0],
            customer: o[4],
            product: o[7],
            qty: o[10],
            total: o[12],
            status: o[18] || 'Chờ xác nhận',
            date: o[1] ? new Date(o[1]).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'}) : ''
        }));

        setStats({
            revenueMonth: revMonth,
            activeOrders: activeOrd,
            needConfirm: needConf,
            totalDebt: tDebt,
            completedOrders: compOrd,
            recentOrders,
            statusData,
            salePerf,
            revenueData: Object.values(revByMonthMap)
        });
    };

    return (
        <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isAdmin ? 'Tổng quan Hệ thống' : `Chào ${currentUser?.name} 👋`}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {isAdmin ? 'Báo cáo toàn công ty theo thời gian thực' : 'Dữ liệu cá nhân của bạn'}
                    </p>
                </div>
                <button 
                    onClick={fetchData} 
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    Đồng bộ
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={DollarSign}
                    label="Doanh thu tháng này"
                    value={isLoading ? "..." : `${fmt(stats.revenueMonth)} đ`}
                    sub="Cập nhật real-time"
                    color="bg-blue-600"
                    trendUp={true}
                />
                <StatCard
                    icon={ShoppingCart}
                    label="Đơn đang chạy"
                    value={isLoading ? "..." : stats.activeOrders}
                    sub={`${stats.needConfirm} cần xác nhận`}
                    color="bg-amber-500"
                    trendUp={true}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Công nợ phải thu"
                    value={isLoading ? "..." : `${fmt(stats.totalDebt)} đ`}
                    sub="Tổng cộng"
                    color="bg-red-500"
                    trendUp={false}
                />
                <StatCard
                    icon={CheckCircle}
                    label="Đơn hoàn tất"
                    value={isLoading ? "..." : stats.completedOrders}
                    sub="Tháng này"
                    color="bg-emerald-500"
                    trendUp={true}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" /> Doanh thu & Chi phí (6 tháng)
                    </h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(val) => `${val / 1000000}M`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                <Line type="monotone" name="Doanh thu" dataKey="doanhThu" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" name="Chi phí (Ước tính)" dataKey="chiPhi" stroke="#cbd5e1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Package size={18} className="text-purple-500" /> Tỉ trọng Trạng thái
                    </h3>
                    <div className="flex-grow flex items-center justify-center relative min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} đơn`, 'Số lượng']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-3xl font-black text-slate-800">{stats.activeOrders + stats.completedOrders}</span>
                            <span className="text-xs font-semibold text-slate-400">Tổng Đơn</span>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {stats.statusData.map(item => (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="text-slate-600 truncate" title={item.name}>{item.name}</span>
                                <span className="font-bold text-slate-800 ml-auto">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Clock size={18} className="text-amber-500" /> Đơn hàng gần đây
                        </h3>
                        <a href="/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Xem tất cả &rarr;</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                    <th className="p-4">Mã ĐH</th>
                                    <th className="p-4">Khách hàng</th>
                                    <th className="p-4">Sản phẩm</th>
                                    <th className="p-4 text-right">Giá trị</th>
                                    <th className="p-4 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr><td colSpan="5" className="p-4 text-center text-slate-400">Đang tải...</td></tr>
                                ) : stats.recentOrders.length === 0 ? (
                                    <tr><td colSpan="5" className="p-4 text-center text-slate-400">Chưa có đơn hàng nào</td></tr>
                                ) : stats.recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-700">{order.id}</td>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-700 truncate max-w-[150px]">{order.customer}</div>
                                            <div className="text-xs text-slate-400">{order.date}</div>
                                        </td>
                                        <td className="p-4 font-medium text-slate-600 truncate max-w-[150px]">{order.product}</td>
                                        <td className="p-4 text-right font-bold text-slate-800">{fmt(order.total)} đ</td>
                                        <td className="p-4 text-center"><StatusBadge status={order.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Sales */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Users size={18} className="text-emerald-500" /> Bảng xếp hạng Doanh thu
                        </h3>
                    </div>
                    <div className="p-2">
                        {isLoading ? (
                            <div className="p-4 text-center text-slate-400">Đang tải...</div>
                        ) : stats.salePerf.length === 0 ? (
                            <div className="p-4 text-center text-slate-400">Chưa có dữ liệu</div>
                        ) : stats.salePerf.map((sale, idx) => (
                            <div key={sale.name} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-700">{sale.name}</div>
                                        <div className="text-xs font-semibold text-slate-400">{sale.orders} đơn hàng</div>
                                    </div>
                                </div>
                                <div className="font-black text-slate-800 text-right">
                                    {fmt(sale.rev)} đ
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
