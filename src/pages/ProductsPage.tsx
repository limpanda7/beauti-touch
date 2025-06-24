import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

  const handleOpenModal = (product: Product | null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('products.deleteConfirm'))) {
      try {
        await productService.delete(id);
        await loadProducts();
      } catch (error) {
        console.error(t('products.deleteError'), error);
      }
    }
  };
  
  const handleToggleActive = async (product: Product) => {
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

  return (
    <div className="content-wrapper">
      {/* 모바일에서는 헤더 숨김 */}
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

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('products.name')}</th>
              <th>{t('products.category')}</th>
              <th style={{ textAlign: 'right' }}>{t('products.price')}</th>
              <th style={{ textAlign: 'right' }}>{t('products.duration')}</th>
              <th style={{ textAlign: 'center' }}>{t('products.isActive')}</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  <LoadingSpinner text={t('common.loading')} />
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map(product => (
                <tr key={product.id}>
                  <td className="name">{product.name}</td>
                  <td>{product.category}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(product.price)}</td>
                  <td style={{ textAlign: 'right' }}>{formatDuration(product.duration)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {isToggling(product.id) ? (
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
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={() => handleToggleActive(product)}
                        />
                        <div className="toggle-slider"></div>
                      </label>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleOpenModal(product)} 
                        className="btn btn-icon edit"
                        disabled={isToggling(product.id)}
                      >
                        <Edit style={{ width: '1rem', height: '1rem' }} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)} 
                        className="btn btn-icon delete"
                        disabled={isToggling(product.id)}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>{t('products.noProducts')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={() => {
            handleCloseModal();
            loadProducts();
          }}
        />
      )}
    </div>
  );
};

export default ProductsPage; 