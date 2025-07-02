// 브라우저 감지 및 관련 유틸리티 함수들

// 문제가 있는 브라우저 감지 (Google 로그인에서 문제가 되는 브라우저들)
export const detectProblematicBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('naver') || 
         userAgent.includes('whale') || 
         userAgent.includes('wv') || 
         userAgent.includes('line') || 
         userAgent.includes('kakao');
};

// 네이버 브라우저 감지
export const isNaverBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('naver') || userAgent.includes('whale');
};

// 인앱 브라우저 감지
export const isInAppBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('wv') || 
         userAgent.includes('line') || 
         userAgent.includes('kakao') ||
         userAgent.includes('instagram') ||
         userAgent.includes('facebook');
};

// 모바일 브라우저 감지
export const isMobileBrowser = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

// 브라우저 정보 가져오기
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const isProblematic = detectProblematicBrowser();
  const isNaver = isNaverBrowser();
  const isInApp = isInAppBrowser();
  const isMobile = isMobileBrowser();
  
  return {
    userAgent,
    isProblematic,
    isNaver,
    isInApp,
    isMobile,
    browserName: getBrowserName(userAgent),
    browserVersion: getBrowserVersion(userAgent)
  };
};

// 브라우저 이름 추출
const getBrowserName = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('naver') || ua.includes('whale')) return 'Naver';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  if (ua.includes('ie')) return 'Internet Explorer';
  
  return 'Unknown';
};

// 브라우저 버전 추출
const getBrowserVersion = (userAgent: string): string => {
  const match = userAgent.match(/(chrome|firefox|safari|edge|opera|ie)\/?([\d.]+)/i);
  return match ? match[2] : 'Unknown';
};

// 브라우저별 권장사항 메시지
export const getBrowserRecommendation = (): string => {
  const browserInfo = getBrowserInfo();
  
  if (browserInfo.isNaver) {
    return '네이버 브라우저에서는 Google 로그인이 제한될 수 있습니다. Chrome, Safari, Firefox 등의 브라우저를 사용해주세요.';
  }
  
  if (browserInfo.isInApp) {
    return '인앱 브라우저에서는 Google 로그인이 제한될 수 있습니다. 외부 브라우저를 사용해주세요.';
  }
  
  return '';
}; 