import { Bell, User, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Header = () => {
  const { currentUser, logout } = useAppContext();

  return (
    <header className="header">
      <div className="header-title"></div>
      
      <div className="header-user">
        <button className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }} onClick={logout} title="Đăng xuất">
          <LogOut size={20} />
        </button>
        <div className="avatar">
          <User size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{currentUser?.name || 'Khách'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {currentUser?.role === 'admin' ? 'Quản lý' : 'Nhân viên Sale'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
