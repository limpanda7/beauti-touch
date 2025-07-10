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
  isPublic?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image = 'https://beauti-touch.web.app/logo-with-text.png',
  url,
  type = 'website',
  lang,
  isPublic = true
}) => {
  const { t, i18n } = useTranslation();
  
  if (!isPublic) {
    return null;
  }
  
  const defaultDescription = t('navigation.seoDescription');
  const currentLang = lang || i18n.language;
  const currentUrl = url || window.location.href;
  
  // 타이틀을 항상 "Beauti-Touch"로 고정
  const seoTitle = 'Beauti-Touch';
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || t('navigation.seoKeywords.default');

  const getHreflangUrl = (langCode: string) => {
    const baseUrl = window.location.origin;
    const path = window.location.pathname;
    
    const pathWithoutLang = path.replace(/^\/[a-z]{2}\//, '/');
    
    return `${baseUrl}/${langCode}${pathWithoutLang}`;
  };

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="author" content="Beauti-Touch" />
      
      <html lang={currentLang} />
      
      <link rel="canonical" href={currentUrl} />
      
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Beauti-Touch" />
      <meta property="og:locale" content={currentLang} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={image} />
      
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#6366f1" />
      
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