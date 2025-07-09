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


