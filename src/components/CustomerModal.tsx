import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Customer } from '../types';
import { customerService } from '../services/firestore';

interface CustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    memo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        memo: customer.memo || '',
      });
    } else {
      // 새 고객인 경우 폼 초기화
      setFormData({
        name: '',
        phone: '',
        memo: '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // 새 고객인 경우 폼 초기화
    if (!customer) {
      setFormData({
        name: '',
        phone: '',
        memo: '',
      });
    }

    // 필수 필드 검증
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError(t('errors.requiredFields'));
      return;
    }

    // 전화번호 형식 검증 (4자리 숫자)
    if (!/^\d{4}$/.test(formData.phone)) {
      setError(t('customers.phoneRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let savedCustomer: Customer;

      if (customer) {
        // 기존 고객 수정
        const updatedData = {
          ...customer,
          name: formData.name,
          phone: formData.phone,
          memo: formData.memo,
        };
        
        await customerService.update(customer.id, updatedData);
        const updatedCustomer = await customerService.getById(customer.id);
        if (!updatedCustomer) {
          throw new Error(t('customers.updateError'));
        }
        savedCustomer = updatedCustomer;
      } else {
        // 새 고객 생성
        const newCustomerData = {
          name: formData.name,
          phone: formData.phone,
          memo: formData.memo,
        };
        
        const newCustomerId = await customerService.create(newCustomerData);
        const newCustomer = await customerService.getById(newCustomerId);
        if (!newCustomer) {
          throw new Error(t('customers.createError'));
        }
        savedCustomer = newCustomer;
      }

      onSave(savedCustomer);
    } catch (error) {
      console.error(t('customers.saveError'), error);
      setError(t('customers.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="customer-modal-header">
          <h2 className="customer-modal-title">
            {customer ? t('customers.editCustomer') : t('customers.newCustomer')}
          </h2>
          <button onClick={onClose} className="btn btn-icon">
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>

        {error && (
          <div className="customer-modal-error">
            <div className="customer-modal-error-content">
              <AlertCircle className="customer-modal-error-icon" />
              <p className="customer-modal-error-text">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('customers.name')}*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">{t('customers.phone')}*</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </div>

          <div className="form-group">
            <label htmlFor="memo">{t('customers.memo')}</label>
            <textarea
              id="memo"
              name="memo"
              value={formData.memo}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="customer-modal-info">
            <p className="customer-modal-info-text">
              <AlertCircle style={{ width: '1rem', height: '1rem' }} />
              {t('customers.privacyNotice')}
            </p>
          </div>

          <div className="customer-modal-btn-group">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal; 