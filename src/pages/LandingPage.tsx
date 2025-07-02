import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  FileText, 
  ClipboardList, 
  Smartphone, 
  Globe, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import SEO from '../components/SEO';
import Button from '../components/Button';
import '../styles/pages/_landing.scss';

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: t('features.reservation.title'),
      description: t('features.reservation.description'),
      benefits: [
        t('features.reservation.benefit1'),
        t('features.reservation.benefit2'),
        t('features.reservation.benefit3')
      ]
    },
    {
      icon: Users,
      title: t('features.customer.title'),
      description: t('features.customer.description'),
      benefits: [
        t('features.customer.benefit1'),
        t('features.customer.benefit2'),
        t('features.customer.benefit3')
      ]
    },
    {
      icon: FileText,
      title: t('features.chart.title'),
      description: t('features.chart.description'),
      benefits: [
        t('features.chart.benefit1'),
        t('features.chart.benefit2'),
        t('features.chart.benefit3')
      ]
    },
    {
      icon: ClipboardList,
      title: t('features.product.title'),
      description: t('features.product.description'),
      benefits: [
        t('features.product.benefit1'),
        t('features.product.benefit2'),
        t('features.product.benefit3')
      ]
    }
  ];

  const advantages = [
    {
      icon: Smartphone,
      title: t('features.advantages.mobile.title'),
      description: t('features.advantages.mobile.description')
    },
    {
      icon: Globe,
      title: t('features.advantages.multilingual.title'),
      description: t('features.advantages.multilingual.description')
    },
    {
      icon: Shield,
      title: t('features.advantages.security.title'),
      description: t('features.advantages.security.description')
    },
    {
      icon: Zap,
      title: t('features.advantages.automation.title'),
      description: t('features.advantages.automation.description')
    }
  ];

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="features-page">
      <SEO 
        title={t('features.pageTitle')}
        description={t('features.pageDescription')}
        keywords={t('navigation.seoKeywords.default')}
      />
      
      <LanguageSelector />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <img src="/logo-with-text.png" alt="Beauti-Touch" />
          </div>
          <h1 className="hero-title">{t('features.hero.title')}</h1>
          <p className="hero-subtitle">{t('features.hero.subtitle')}</p>
          
          {/* 베타 배지 */}
          <div className="hero-badge">
            <Star size={16} />
            <span>{t('features.hero.betaBadge')}</span>
          </div>
          
          <p className="hero-beta-description">{t('features.hero.betaDescription')}</p>
          
          <div className="hero-buttons">
            <Button onClick={handleLogin} variant="primary" size="lg">
              {t('features.hero.startFree')}
              <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('features.sectionTitle')}</h2>
            <p>{t('features.sectionDescription')}</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon size={32} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul className="feature-benefits">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex}>
                      <CheckCircle size={16} />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="advantages-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('features.advantages.title')}</h2>
            <p>{t('features.advantages.description')}</p>
          </div>
          
          <div className="advantages-grid">
            {advantages.map((advantage, index) => (
              <div key={index} className="advantage-card">
                <div className="advantage-icon">
                  <advantage.icon size={24} />
                </div>
                <h3>{advantage.title}</h3>
                <p>{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>{t('features.cta.title')}</h2>
            <p>{t('features.cta.description')}</p>
            <div className="cta-buttons">
              <Button onClick={handleLogin} variant="primary" size="lg">
                {t('features.cta.startNow')}
                <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 