import React, { useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Calendar, Users, ClipboardList, Settings, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import '../styles/main.scss';

const Layout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { initializeSettings } = useSettingsStore();
  
  const {
    isMobile,
    isSidebarOpen,
    isClosing,
    isModalOpen,
    setIsModalOpen,
    toggleSidebar,
    closeSidebar,
    checkScreenSize
  } = useUIStore();

  // 사용자 설정 초기화
  useEffect(() => {
    if (user?.uid) {
      const initSettings = async () => {
        try {
          await initializeSettings(user.uid);
        } catch (error) {
          console.error('설정 초기화 실패:', error);
        }
      };
      initSettings();
    }
  }, [user?.uid, initializeSettings]);



  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [checkScreenSize]);

  useEffect(() => {
    const checkModalOpen = () => {
      const modalOverlay = document.querySelector('.modal-overlay');
      setIsModalOpen(!!modalOverlay);
    };

    checkModalOpen();

    const observer = new MutationObserver(checkModalOpen);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [setIsModalOpen]);

  const handleOverlayClick = () => {
    if (isMobile && !isClosing) {
      closeSidebar();
    }
  };

  const handleFloatingButtonClick = () => {
    const currentPath = location.pathname;
    
    switch (currentPath) {
      case '/dashboard/reservations':
        navigate('/dashboard/reservations?action=new');
        break;
      case '/dashboard/customers':
        navigate('/dashboard/customers?action=new');
        break;
      case '/dashboard/products':
        navigate('/dashboard/products?action=new');
        break;
      default:
        break;
    }
  };

  // floating action button을 표시할 경로인지 확인
  const shouldShowFloatingButton = () => {
    const currentPath = location.pathname;
    // 메인 페이지들만 floating button 표시 (상세 페이지 제외)
    return ['/dashboard/reservations', '/dashboard/customers', '/dashboard/products'].includes(currentPath);
  };

  const menuItems = [
    { path: '/dashboard/reservations', icon: Calendar, label: t('navigation.reservations') },
    { path: '/dashboard/customers', icon: Users, label: t('navigation.customers') },
    { path: '/dashboard/products', icon: ClipboardList, label: t('navigation.products') },
    { path: '/dashboard/settings', icon: Settings, label: t('navigation.settings') },
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

      {/* 모바일 플로팅 + 버튼 - 모달이 열려있지 않을 때만 표시 */}
      {isMobile && !isModalOpen && shouldShowFloatingButton() && (
        <button 
          className="floating-action-button"
          onClick={handleFloatingButtonClick}
          aria-label={t('common.addNew')}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default Layout; 