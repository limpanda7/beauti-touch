import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../types';
import { productService } from '../services/firestore';
import ProductModal from '../components/ProductModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrencyFormat } from '../utils/currency';

const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrencyFormat();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [togglingProducts, setTogglingProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)));
    } catch (error) {
      console.error('상품 목록을 불러오는데 실패했습니다:', error);
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
        console.error('상품 삭제에 실패했습니다:', error);
      }
    }
  };
  
  const handleToggleActive = async (product: Product) => {
    try {
      // 로딩 상태 시작
      setTogglingProducts(prev => new Set(prev).add(product.id));
      
      await productService.update(product.id, { isActive: !product.isActive });
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, isActive: !p.isActive } : p
      ));
    } catch (error) {
      console.error('상품 상태 변경에 실패했습니다:', error);
    } finally {
      // 로딩 상태 종료
      setTogglingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const isToggling = (productId: string) => togglingProducts.has(productId);

  return (
    <div className="content-wrapper">
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
                  <td style={{ textAlign: 'right' }}>{product.duration}</td>
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