import { useState } from 'react';
import { Trash2, Edit } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const STATUS_LIST = ['Chờ xác nhận', 'Đã chốt', 'Đang sản xuất', 'Đang giao hàng', 'Đã nhận', 'Đã thanh toán'];

const getStatusBadge = (status) => {
  switch (status) {
    case 'Chờ xác nhận': return 'badge-warning';
    case 'Đã chốt': return 'badge-info';
    case 'Đang sản xuất': return 'badge-primary';
    case 'Đang giao hàng': return 'badge-secondary';
    case 'Đã nhận': return 'badge-success';
    case 'Đã thanh toán': return 'badge-success';
    default: return 'badge-neutral';
  }
};

const Orders = () => {
  const { orders, updateOrderStatus, deleteOrder, currentUser, allUsers } = useAppContext();
  const [filterTag, setFilterTag] = useState('all');
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'admin';
  const mySaleId = currentUser?.id;

  // Lọc theo người dùng (Sale chỉ thấy đơn của mình, Admin thấy hết)
  let visibleOrders = isAdmin ? orders : orders.filter(o => o.saleId === mySaleId);

  // Lọc theo tag khách hàng
  if (filterTag !== 'all') {
    visibleOrders = visibleOrders.filter(o => o.customerType === filterTag);
  }

  // Đảo ngược để đơn mới lên đầu
  visibleOrders = [...visibleOrders].reverse();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="h1" style={{ margin: 0 }}>Quản lý Đơn Hàng</h1>
        
        <select 
          className="form-input" 
          style={{ width: '200px' }}
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
        >
          <option value="all">Tất cả khách hàng</option>
          <option value="ca_nhan">Cá nhân</option>
          <option value="ho_kinh_doanh">Hộ kinh doanh</option>
          <option value="cong_ty">Công ty</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead style={{ backgroundColor: 'var(--secondary)', color: 'var(--text-muted)' }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Mã ĐH</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Ngày</th>
                {isAdmin && <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Nhân viên</th>}
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Khách hàng</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Tên hàng</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Thành tiền</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Công nợ</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>Trạng thái</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 500, textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? "8" : "7"} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              ) : (
                visibleOrders.map(order => {
                  const saleName = allUsers.find(u => u.id === order.saleId)?.name || 'N/A';
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}><strong>{order.id}</strong></td>
                      <td style={{ padding: '1rem' }}>{order.date}</td>
                      {isAdmin && (
                        <td style={{ padding: '1rem' }}>
                          <span className="badge badge-info">{saleName}</span>
                        </td>
                      )}
                      <td style={{ padding: '1rem' }}>
                        <div>{order.customerName || 'Khách lẻ'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {order.customerPhone ? `${order.customerPhone} • ` : ''} 
                          {order.customerType === 'ca_nhan' ? 'Cá nhân' : order.customerType === 'cong_ty' ? 'Công ty' : 'Hộ KD'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        <div style={{ fontWeight: 500 }}>{order.itemName}</div>
                        {(order.material || order.size) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {order.material} {order.size ? `(${order.size})` : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', textAlign: 'center' }}>
                        {order.quantity}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN').format(order.total)} đ</div>
                      </td>
                      <td style={{ padding: '1rem', color: order.debt > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {new Intl.NumberFormat('vi-VN').format(order.debt)} đ
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select 
                          className={`badge ${getStatusBadge(order.status)}`}
                          style={{ border: 'none', outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '1.5rem', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .5rem top 50%', backgroundSize: '.65rem auto' }}
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        >
                          {STATUS_LIST.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            onClick={() => navigate('/quotes', { state: { editOrder: order } })}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.25rem' }}
                            title="Sửa đơn hàng"
                          >
                            <Edit size={18} />
                          </button>
                          {(isAdmin || mySaleId === order.saleId) && (
                            <button 
                              onClick={() => deleteOrder(order.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                              title="Xóa đơn hàng"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
