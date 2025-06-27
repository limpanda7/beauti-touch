import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { Product } from '../types';
import { productService } from '../services/firestore';
import ProductModal from '../components/ProductModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrencyFormat } from '../utils/currency';
import { formatDuration } from '../utils/timeUtils';

const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [togglingProducts, setTogglingProducts] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    loadProducts();
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // URL 파라미터 처리
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      handleOpenModal(null);
      // URL에서 action 파라미터 제거
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const checkMobileView = () => {
    setIsMobile(window.innerWidth <= 900);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)));
    } catch (error) {
      console.error(t('products.loadError'), error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }, [products, searchTerm]);

  const handleRowClick = (product: Product) => {
    handleOpenModal(product);
  };

  const handleOpenModal = (product: Product | null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleProductSaved = (savedProduct: Product) => {
    setProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === savedProduct.id);
      if (existingIndex >= 0) {
        // 기존 상품 업데이트
        const updated = [...prev];
        updated[existingIndex] = savedProduct;
        return updated;
      } else {
        // 새 상품 추가
        return [savedProduct, ...prev];
      }
    });
    handleCloseModal();
  };

  const handleProductDeleted = () => {
    if (editingProduct) {
      setProducts(prev => prev.filter(p => p.id !== editingProduct.id));
    }
    handleCloseModal();
  };
  
  const handleToggleActive = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // 행 클릭 이벤트 방지
    
    // 로딩 상태 시작
    setLoadingProducts(prev => ({ ...prev, [product.id]: true }));
    
    try {
      await productService.update(product.id, { isActive: !product.isActive });
      await loadProducts();
    } catch (error) {
      console.error(t('products.statusChangeError'), error);
    } finally {
      // 로딩 상태 종료
      setLoadingProducts(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const isToggling = (productId: string) => togglingProducts.has(productId);

  const renderMobileProductCard = (product: Product) => (
    <div 
      key={product.id} 
      className="product-card"
      onClick={() => handleRowClick(product)}
    >
      <div className="product-card-header">
        <div className="product-card-name">
          {product.name}
        </div>
        <div className="product-card-category">
          {product.category}
        </div>
      </div>
      
      <div className="product-card-details">
        <div className="product-card-price">
          {formatCurrency(product.price)}
        </div>
        <div className="product-card-duration">
          {formatDuration(product.duration)}
        </div>
      </div>
      
      <div className="product-card-status">
        <label className="toggle-switch" onClick={(e) => handleToggleActive(product, e)}>
          <input
            type="checkbox"
            checked={product.isActive}
            readOnly
          />
          <div className="toggle-slider"></div>
        </label>
      </div>
    </div>
  );

  const renderDesktopTable = () => (
    <table>
      <thead>
        <tr>
          <th>{t('products.name')}</th>
          <th>{t('products.category')}</th>
          <th style={{ textAlign: 'right' }}>{t('products.price')}</th>
          <th style={{ textAlign: 'right' }}>{t('products.duration')}</th>
          <th style={{ textAlign: 'center' }}>{t('products.isActive')}</th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
              <LoadingSpinner text={t('common.loading')} />
            </td>
          </tr>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <tr 
              key={product.id} 
              className="products-table-row-pointer"
              onClick={() => handleRowClick(product)}
            >
              <td className="name">{product.name}</td>
              <td>{product.category}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(product.price)}</td>
              <td style={{ textAlign: 'right' }}>{formatDuration(product.duration)}</td>
              <td style={{ textAlign: 'center' }}>
                {loadingProducts[product.id] ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '1.5rem'
                  }}>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid #E5E7EB',
                      borderTop: '2px solid #3B82F6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  </div>
                ) : (
                  <label className="toggle-switch" onClick={(e) => handleToggleActive(product, e)}>
                    <input
                      type="checkbox"
                      checked={product.isActive}
                      readOnly
                    />
                    <div className="toggle-slider"></div>
                  </label>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="products-table-empty">
              {searchTerm ? t('products.noSearchResults') : t('products.noProducts')}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="content-wrapper products-page">
      {!isMobile && (
        <div className="page-header">
          <h1>{t('products.title')}</h1>
          <button
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            {t('products.newProduct')}
          </button>
        </div>
      )}

      {isMobile && (
        <div className="mobile-search-container">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      )}

      {!isMobile && (
        <>
          <div className={`search-container ${searchTerm ? 'has-content' : ''}`}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="table-container">
            {renderDesktopTable()}
          </div>
        </>
      )}

      {isMobile && (
        <div className="products-mobile-container">
          {loading ? (
            <div className="products-mobile-empty">
              <LoadingSpinner text={t('common.loading')} />
            </div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map(product => renderMobileProductCard(product))
          ) : (
            <div className="products-mobile-empty">
              {searchTerm ? t('products.noSearchResults') : t('products.noProducts')}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={handleProductSaved}
          onDelete={handleProductDeleted}
        />
      )}
    </div>
  );
};

export default ProductsPage; 