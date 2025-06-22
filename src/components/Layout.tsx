import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, X, Calendar, Users, ClipboardList, Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import '../styles/main.scss';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1200);
      if (window.innerWidth >= 1200) {
        setIsSidebarOpen(false);
        setIsClosing(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    if (isSidebarOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsSidebarOpen(false);
        setIsClosing(false);
      }, 400);
    } else {
      setIsSidebarOpen(true);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsClosing(true);
      setTimeout(() => {
        setIsSidebarOpen(false);
        setIsClosing(false);
      }, 400);
    }
  };

  const handleOverlayClick = () => {
    if (isMobile && !isClosing) {
      closeSidebar();
    }
  };

  const menuItems = [
    { path: '/reservations', icon: Calendar, label: '예약' },
    { path: '/customers', icon: Users, label: '고객' },
    { path: '/products', icon: ClipboardList, label: '상품' },
    { path: '/settings', icon: Settings, label: '설정' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="layout">
      {/* 사이드바 - 데스크톱에서는 항상 표시, 모바일에서는 조건부 표시 */}
      {(!isMobile || isSidebarOpen || isClosing) && (
        <Sidebar 
          onClose={closeSidebar} 
          isMobile={isMobile} 
          className={`${isMobile && isSidebarOpen && !isClosing ? 'sidebar-open' : ''} ${isClosing ? 'sidebar-closing' : ''}`}
        />
      )}

      {/* 모바일에서 사이드바가 열려있을 때 오버레이 */}
      {isMobile && (isSidebarOpen || isClosing) && (
        <div className="sidebar-overlay" onClick={handleOverlayClick} />
      )}

      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>

      {/* 모바일 하단 네비게이션 바 */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};

export default Layout; 