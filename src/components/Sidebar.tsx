import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, ClipboardList, Settings, X, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUser } from '../stores/authStore';

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobile = false, className = '' }) => {
  const { t } = useTranslation();
  const { signOut } = useAuthStore();
  const user = useUser();
  
  const menuItems = [
    { id: 'reservations', label: t('navigation.reservations'), icon: Calendar, path: '/reservations' },
    { id: 'customers', label: t('navigation.customers'), icon: Users, path: '/customers' },
    { id: 'products', label: t('navigation.products'), icon: ClipboardList, path: '/products' },
    { id: 'settings', label: t('navigation.settings'), icon: Settings, path: '/settings' },
  ];

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <div className={`sidebar ${isMobile ? 'sidebar-mobile' : ''} ${className}`}>
      <div className="sidebar-header">
        <div className="brand-container">
          <img src="/logo.png" alt="Beauti-Touch Logo" className="sidebar-logo-large" />
        </div>
        <h1>{t('navigation.beauti-touch')}</h1>
        <p>{t('navigation.adminSystem')}</p>
      </div>
      
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <NavLink to={item.path} onClick={handleNavClick}>
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <div className="user-avatar">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user.displayName || user.email}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        )}
        
        <button
          type="button"
          className="logout-btn"
          onClick={handleLogout}
          title={t('auth.logout')}
        >
          <LogOut size={20} />
          <span>{t('auth.logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 