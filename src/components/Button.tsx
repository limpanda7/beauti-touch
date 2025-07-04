import React from 'react';

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'icon' | 'chart' | 'share';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * 공통 버튼 컴포넌트
 * 
 * 사용 예시:
 * 
 * // 기본 버튼
 * <Button onClick={handleClick}>클릭</Button>
 * 
 * // 보조 버튼
 * <Button variant="secondary" onClick={handleCancel}>취소</Button>
 * 
 * // 위험 버튼
 * <Button variant="danger" onClick={handleDelete}>삭제</Button>
 * 
 * // 차트 버튼 (초록색)
 * <Button variant="chart" onClick={handleChart}>차트 작성</Button>
 * 
 * // 로딩 상태
 * <Button loading onClick={handleSave}>저장</Button>
 * 
 * // 비활성화
 * <Button disabled onClick={handleSubmit}>제출</Button>
 */
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  fullWidth = false,
  loading = false,
}) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    icon: 'btn-icon',
    chart: 'btn-chart',
    share: 'btn-share',
  };
  
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className,
  ].filter(Boolean).join(' ');
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button; 