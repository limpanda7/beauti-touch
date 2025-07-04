import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '../types';
import { productService } from '../services/firestore';
import { useCurrencyFormat } from '../utils/currency';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete?: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave, onDelete }) => {
  const { t } = useTranslation();
  const { getCurrencySymbol } = useCurrencyFormat();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    price: product?.price?.toString() || '',
    duration: product?.duration?.toString() || '',
    description: product?.description || '',
    isActive: product?.isActive !== undefined ? product.isActive : true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // 가격과 duration은 문자열로 저장하되, 숫자만 허용
    if (value === '' || /^\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    if (window.confirm(t('products.deleteConfirm'))) {
      setLoading(true);
      try {
        await productService.delete(product.id);
        onDelete?.();
      } catch (error) {
        console.error(t('products.deleteError'), error);
        setError(t('products.deleteError'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 가격과 duration은 문자열로 저장하되, 숫자만 허용
      const price = parseInt(formData.price);
      const duration = parseInt(formData.duration);

      if (isNaN(price) || price < 0) {
        setError(t('products.saveError'));
        setLoading(false);
        return;
      }

      if (isNaN(duration) || duration < 0) {
        setError(t('products.saveError'));
        setLoading(false);
        return;
      }

      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: price,
        duration: duration,
        description: formData.description.trim() || '',
        isActive: formData.isActive,
      };

      let savedProduct: Product;

      if (product) {
        // 기존 상품 수정
        await productService.update(product.id, productData);
        const updatedProduct = await productService.getById(product.id);
        if (!updatedProduct) {
          throw new Error(t('products.saveError'));
        }
        savedProduct = updatedProduct;
      } else {
        // 새 상품 생성
        const newId = await productService.create(productData);
        const newProduct = await productService.getById(newId);
        if (!newProduct) {
          throw new Error(t('products.saveError'));
        }
        savedProduct = newProduct;
      }

      onSave(savedProduct);
    } catch (error) {
      console.error(t('products.saveError'), error);
      setError(t('products.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="product-modal-overlay" onClick={onClose}>
        <div className="product-modal">
        <div className="product-modal-header">
          <h2 className="product-modal-title">
            {product ? t('products.editProduct') : t('products.newProduct')}
          </h2>
          <button onClick={onClose} className="product-modal-close-btn">
            <X className="product-modal-close-icon" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="product-modal-form">
          <div className="product-modal-grid">
            <div>
              <label className="product-modal-label" htmlFor="name">
                {t('products.name')} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="product-modal-input"
                required
              />
            </div>
            <div>
              <label className="product-modal-label" htmlFor="category">
                {t('products.category')}
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="product-modal-input"
              />
            </div>
          </div>

          <div className="product-modal-grid">
            <div>
              <label className="product-modal-label" htmlFor="price">
                {t('products.price')} *
              </label>
              <div className="product-modal-input-group">
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="product-modal-input"
                  required
                />
                <span className="product-modal-currency">
                  {getCurrencySymbol()}
                </span>
              </div>
            </div>
            <div>
              <label className="product-modal-label" htmlFor="duration">
                {t('products.duration')} *
              </label>
              <div className="product-modal-input-group">
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleNumberChange}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="product-modal-input"
                  required
                />
                <span className="product-modal-currency">
                  min
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="product-modal-label" htmlFor="description">
              {t('products.description')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="product-modal-textarea"
              placeholder={t('products.description')}
            />
          </div>
          
          <div className="product-modal-checkbox-group">
              <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="product-modal-checkbox"
              />
              <label className="product-modal-checkbox-label" htmlFor="isActive">
                  {t('products.activeDescription')}
              </label>
          </div>

          {error && (
            <div className="product-modal-error">
              {error}
            </div>
          )}

          <div className="product-modal-btn-group">
            {product && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="product-modal-btn product-modal-btn-delete"
              >
                <Trash2 style={{ width: '1rem', height: '1rem' }} />
                {t('common.delete')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="product-modal-btn product-modal-btn-cancel"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="product-modal-btn product-modal-btn-save"
            >
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
};

export default ProductModal; 