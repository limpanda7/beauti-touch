import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Customer } from '../types';

interface CustomerInfoProps {
  customer: Customer;
  isEdit?: boolean;
  formData?: Partial<Customer>;
  onFormChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  className?: string;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({
  customer,
  isEdit = false,
  formData,
  onFormChange,
  className = ''
}) => {
  const { t } = useTranslation();

  return (
    <div className={`customer-info ${className}`}>
      <div className="customer-info-table-container">
        <table className="customer-info-table">
          <tbody>
            <tr className="customer-info-table-row">
              <td className="customer-info-table-label">ID</td>
              <td className="customer-info-table-label">{t('customers.name')}</td>
              <td className="customer-info-table-label">{t('customers.phone')}</td>
              <td className="customer-info-table-label customer-info-memo-label-desktop">{t('customers.memo')}</td>
            </tr>
            <tr className="customer-info-table-row">
              <td className="customer-info-table-value">
                {customer.id.length === 4 && /^\d{4}$/.test(customer.id) ? customer.id : customer.id.slice(0, 4)}
              </td>
              <td className="customer-info-table-value">
                {isEdit ? (
                  <input
                    type="text"
                    name="name"
                    value={formData?.name || ''}
                    onChange={onFormChange}
                    className="customer-info-table-input"
                  />
                ) : (
                  <span>{customer.name}</span>
                )}
              </td>
              <td className="customer-info-table-value">
                {isEdit ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData?.phone || ''}
                    onChange={onFormChange}
                    className="customer-info-table-input"
                  />
                ) : (
                  <span>{customer.phone}</span>
                )}
              </td>
              <td className="customer-info-table-value customer-info-memo-value-desktop">
                {isEdit ? (
                  <textarea
                    name="memo"
                    value={formData?.memo || ''}
                    onChange={onFormChange}
                    className="customer-info-table-textarea"
                    rows={4}
                  />
                ) : (
                  <span className="customer-info-memo-text">{customer.memo || '-'}</span>
                )}
              </td>
            </tr>
            {/* 모바일에서 메모를 별도 행으로 표시 */}
            { (isEdit || customer.memo) && (
              <>
                <tr className="customer-info-table-row customer-info-memo-row-mobile">
                  <td className="customer-info-table-label" colSpan={3}>{t('customers.memo')}</td>
                </tr>
                <tr className="customer-info-table-row customer-info-memo-row-mobile">
                  <td className="customer-info-table-value" colSpan={3}>
                    {isEdit ? (
                      <textarea
                        name="memo"
                        value={formData?.memo || ''}
                        onChange={onFormChange}
                        className="customer-info-table-textarea"
                        rows={4}
                      />
                    ) : (
                      <span className="customer-info-memo-text">{customer.memo || '-'}</span>
                    )}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerInfo; 