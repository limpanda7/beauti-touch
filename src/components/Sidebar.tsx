import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, ClipboardList, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobile = false, className = '' }) => {
  const { t } = useTranslation();
  
  const menuItems = [
    { id: 'reservations', label: t('navigation.reservations'), icon: Calendar, path: '/dashboard/reservations' },
    { id: 'customers', label: t('navigation.customers'), icon: Users, path: '/dashboard/customers' },
    { id: 'products', label: t('navigation.products'), icon: ClipboardList, path: '/dashboard/products' },
    { id: 'settings', label: t('navigation.settings'), icon: Settings, path: '/dashboard/settings' },
  ];

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
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
              <NavLink to={item.path} onClick={handleNavClick} replace>
                <item.icon />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar; 