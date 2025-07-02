import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  lang?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image = 'https://beauti-touch.web.app/logo-with-text.png',
  url,
  type = 'website',
  lang
}) => {
  const { t, i18n } = useTranslation();
  
  // 기본값 설정
  const defaultTitle = t('navigation.pageTitle');
  const defaultDescription = t('navigation.adminSystem');
  const currentLang = lang || i18n.language;
  const currentUrl = url || window.location.href;
  
  const seoTitle = title || defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || 'beauty, salon, management, reservation, customer, product, beauti-touch';

  // hreflang URL 생성 함수
  const getHreflangUrl = (langCode: string) => {
    const baseUrl = window.location.origin;
    const path = window.location.pathname;
    
    // 현재 경로에서 언어 코드 제거 (있다면)
    const pathWithoutLang = path.replace(/^\/[a-z]{2}\//, '/');
    
    // 새로운 언어 코드로 URL 생성
    return `${baseUrl}/${langCode}${pathWithoutLang}`;
  };

  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="author" content="Beauti-Touch" />
      
      {/* 언어 설정 */}
      <html lang={currentLang} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph 태그 */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Beauti-Touch" />
      <meta property="og:locale" content={currentLang} />
      
      {/* Twitter Card 태그 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* 추가 메타 태그 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#6366f1" />
      
      {/* 다국어 지원을 위한 hreflang */}
      <link rel="alternate" hrefLang="ko" href={getHreflangUrl('ko')} />
      <link rel="alternate" hrefLang="en" href={getHreflangUrl('en')} />
      <link rel="alternate" hrefLang="es" href={getHreflangUrl('es')} />
      <link rel="alternate" hrefLang="pt" href={getHreflangUrl('pt')} />
      <link rel="alternate" hrefLang="th" href={getHreflangUrl('th')} />
      <link rel="alternate" hrefLang="vi" href={getHreflangUrl('vi')} />
      <link rel="alternate" hrefLang="id" href={getHreflangUrl('id')} />
    </Helmet>
  );
};

export default SEO; 