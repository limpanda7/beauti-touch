import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, ClipboardList, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  
  const menuItems = [
    { id: 'reservations', label: t('navigation.reservations'), icon: Calendar, path: '/reservations' },
    { id: 'customers', label: t('navigation.customers'), icon: Users, path: '/customers' },
    { id: 'products', label: t('navigation.products'), icon: ClipboardList, path: '/products' },
    { id: 'settings', label: t('navigation.settings'), icon: Settings, path: '/settings' },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="brand-container">
          <img src="/logo.png" alt="Beautitouch Logo" className="sidebar-logo-large" />
        </div>
        <h1>{t('navigation.beautitouch')}</h1>
        <p>{t('navigation.adminSystem')}</p>
      </div>
      
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <NavLink to={item.path}>
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