import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, ClipboardList, Settings, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobile = false, className = '' }) => {
  const { t } = useTranslation();
  const location = useLocation();
  
  const menuItems = [
    { id: 'reservations', label: t('navigation.reservations'), icon: Calendar, path: '/dashboard/reservations' },
    { id: 'charts', label: t('navigation.charts'), icon: FileText, path: '/dashboard/charts' },
    { id: 'customers', label: t('navigation.customers'), icon: Users, path: '/dashboard/customers' },
    { id: 'products', label: t('navigation.products'), icon: ClipboardList, path: '/dashboard/products' },
    { id: 'settings', label: t('navigation.settings'), icon: Settings, path: '/dashboard/settings' },
  ];

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    const currentPath = location.pathname;
    
    // 차트 메뉴의 경우 차트 목록과 차트 작성 페이지 모두에서 active 상태
    if (path === '/dashboard/charts') {
      return currentPath === '/dashboard/charts' || currentPath.startsWith('/dashboard/chart/');
    }
    
    // 고객 메뉴의 경우 고객 목록과 고객 상세 페이지 모두에서 active 상태
    if (path === '/dashboard/customers') {
      return currentPath === '/dashboard/customers' || currentPath.startsWith('/dashboard/customers/');
    }
    
    return currentPath === path;
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
              <Link 
                to={item.path} 
                onClick={handleNavClick} 
                replace
                className={isActive(item.path) ? 'active' : ''}
              >
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 