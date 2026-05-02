import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Landmark, TrendingUp, Cpu, ShieldCheck, BookOpen, LogOut
} from 'lucide-react';

const NAV = [
  { path: '/',            label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/banking',     label: 'Banking',         icon: Landmark },
  { path: '/trading',     label: 'Trading',         icon: TrendingUp },
  { path: '/concurrency', label: 'Concurrency Demo',icon: Cpu },
  { path: '/admin',       label: 'Admin Panel',     icon: ShieldCheck, role: 'Admin' },
  { path: '/concepts',    label: 'ACID Concepts',   icon: BookOpen },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const items = NAV.filter(n => !n.role || user?.role === n.role);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>⚡ FinTech HFT</h2>
        <span>SECURE BANKING PORTAL</span>
      </div>

      <nav className="sidebar-nav">
        {items.map(({ path, label, icon: Icon }) => (
          <button
            key={path}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="avatar">{user?.name?.[0] ?? 'U'}</div>
          <div className="user-info" style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{user?.name}</div>
            <small>{user?.email}</small>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop: 10 }}>
          <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          <button className="btn btn-danger btn-sm" onClick={logout} title="Logout">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
