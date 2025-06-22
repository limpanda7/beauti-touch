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
    gender: '' as 'female' | 'male' | '',
    age: '',
    memo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        gender: customer.gender || '',
        age: customer.age?.toString() || '',
        memo: customer.memo || '',
      });
    } else {
      // 새 고객인 경우 폼 초기화
      setFormData({
        name: '',
        phone: '',
        gender: '',
        age: '',
        memo: '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 필수 필드 검증
      if (!formData.name.trim()) {
        setError(t('customers.nameRequired'));
        setLoading(false);
        return;
      }

      if (!formData.phone.trim()) {
        setError(t('customers.phoneRequired'));
        setLoading(false);
        return;
      }

      // 데이터 정리 (빈 값은 undefined로 처리)
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender || undefined,
        age: formData.age && formData.age.trim() ? parseInt(formData.age, 10) : undefined,
        memo: formData.memo.trim() || undefined,
      };

      let savedCustomer: Customer;
      
      if (customer) {
        // 기존 고객 수정
        await customerService.update(customer.id, customerData);
        const updatedCustomer = await customerService.getById(customer.id);
        if (!updatedCustomer) {
          throw new Error('고객 업데이트 후 데이터를 가져올 수 없습니다.');
        }
        savedCustomer = updatedCustomer;
      } else {
        // 새 고객 생성
        const newId = await customerService.create(customerData);
        const newCustomer = await customerService.getById(newId);
        if (!newCustomer) {
          throw new Error('고객 생성 후 데이터를 가져올 수 없습니다.');
        }
        savedCustomer = newCustomer;
      }

      onSave(savedCustomer);
    } catch (error) {
      console.error('고객 저장 실패:', error);
      setError(t('customers.saveError'));
    } finally {
      setLoading(false);
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
              placeholder="고객 이름을 입력하세요"
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
              placeholder="연락처를 입력하세요"
            />
          </div>

          <div className="form-group">
            <label>{t('customers.gender')} <span className="optional-text">({t('common.optional')})</span></label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                />
                <span className="radio-label">{t('customers.genders.female')}</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                />
                <span className="radio-label">{t('customers.genders.male')}</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="age">{t('customers.age')} <span className="optional-text">({t('common.optional')})</span></label>
            <input
              type="text"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="나이를 입력하세요"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="memo">{t('customers.memo')} <span className="optional-text">({t('common.optional')})</span></label>
            <textarea
              id="memo"
              name="memo"
              value={formData.memo}
              onChange={handleChange}
              rows={3}
              placeholder="메모를 입력하세요"
            />
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