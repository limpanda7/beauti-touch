# 웹뷰 구글 로그인 통합 가이드

이 문서는 React Native WebView에서 웹 애플리케이션과 네이티브 앱 간의 구글 로그인 통신 방법을 설명합니다.

## 개요

웹뷰 환경에서는 네이티브 앱의 구글 로그인 기능을 사용하여 더 나은 사용자 경험을 제공합니다. 웹과 앱 간의 통신은 메시지 기반으로 이루어집니다.

## 구현된 기능

### 1. 웹뷰 브리지 서비스 (`src/services/webviewBridge.ts`)

- 네이티브 앱과의 메시지 통신 처리
- 웹뷰 환경 감지
- Firebase 인증 상태 동기화

### 2. 수정된 컴포넌트

- `LoginForm.tsx`: 웹뷰 환경에서 네이티브 구글 로그인 사용
- `App.tsx`: 웹뷰 메시지 리스너 설정
- `authStore.ts`: 웹뷰 메시지 처리 및 상태 동기화

### 3. 다국어 지원

모든 언어 파일에 웹뷰 관련 에러 메시지 추가:
- `googleLoginFailed`: 구글 로그인 실패
- `googleLogoutFailed`: 구글 로그아웃 실패

## 메시지 통신 프로토콜

### 웹 → 네이티브 앱

| 메시지 타입 | 설명 | 파라미터 |
|------------|------|----------|
| `googleLogin` | 구글 로그인 요청 | 없음 |
| `googleLogout` | 구글 로그아웃 요청 | 없음 |
| `checkFirebaseAuthStatus` | Firebase 인증 상태 확인 요청 | 없음 |
| `getPlatform` | 플랫폼 정보 요청 | 없음 |
| `showAlert` | 알림 표시 요청 | `{ message: string }` |

### 네이티브 앱 → 웹

| 메시지 타입 | 설명 | 파라미터 |
|------------|------|----------|
| `firebaseAuthStateChanged` | Firebase 인증 상태 변경 | `{ isSignedIn: boolean, user: FirebaseUser \| null }` |
| `googleLoginSuccess` | 구글 로그인 성공 | `FirebaseUser` |
| `googleLoginFail` | 구글 로그인 실패 | `string` (에러 메시지) |
| `googleLogoutSuccess` | 구글 로그아웃 성공 | 없음 |
| `googleLogoutFail` | 구글 로그아웃 실패 | `string` (에러 메시지) |
| `signInToWebFirebase` | 웹 Firebase에 로그인 요청 | `{ idToken: string, user: FirebaseUser }` |
| `signOutFromWebFirebase` | 웹 Firebase에서 로그아웃 요청 | 없음 |
| `firebaseAuthStatusSuccess` | Firebase 인증 상태 확인 성공 | `{ isSignedIn: boolean, user: FirebaseUser \| null }` |
| `firebaseAuthStatusFail` | Firebase 인증 상태 확인 실패 | `string` (에러 메시지) |
| `getPlatformSuccess` | 플랫폼 정보 응답 | `string` (플랫폼) |

### 웹 → 네이티브 앱 (응답)

| 메시지 타입 | 설명 | 파라미터 |
|------------|------|----------|
| `webFirebaseSignInSuccess` | 웹 Firebase 로그인 성공 | `{ user: User }` |
| `webFirebaseSignInFail` | 웹 Firebase 로그인 실패 | `{ error: string }` |
| `webFirebaseSignOutSuccess` | 웹 Firebase 로그아웃 성공 | 없음 |
| `webFirebaseSignOutFail` | 웹 Firebase 로그아웃 실패 | `{ error: string }` |

## 사용 방법

### 1. 웹뷰 환경 감지

```typescript
import { isWebViewEnvironment } from '../services/webviewBridge';

if (isWebViewEnvironment()) {
  // 웹뷰 환경에서 실행 중
  console.log('웹뷰 환경에서 실행 중');
}
```

### 2. 네이티브 앱에 구글 로그인 요청

```typescript
import { requestGoogleLogin } from '../services/webviewBridge';

const handleGoogleLogin = async () => {
  if (isWebViewEnvironment()) {
    // 웹뷰 환경에서는 네이티브 구글 로그인 사용
    requestGoogleLogin();
  } else {
    // 일반 웹 환경에서는 기존 방식 사용
    await signInWithGoogle();
  }
};
```

### 3. 웹뷰 메시지 리스너 설정

```typescript
import { setWebViewMessageListener } from '../services/webviewBridge';

setWebViewMessageListener((message) => {
  switch (message.type) {
    case 'googleLoginSuccess':
      console.log('네이티브 구글 로그인 성공:', message.value);
      break;
    case 'googleLoginFail':
      console.error('네이티브 구글 로그인 실패:', message.value);
      break;
  }
});
```

## 네이티브 앱 설정

### React Native 앱에서 필요한 설정

1. **Google Sign-In 설정**
   ```javascript
   GoogleSignin.configure({
     webClientId: 'YOUR_WEB_CLIENT_ID_HERE', // 실제 웹 클라이언트 ID로 교체
   });
   ```

2. **WebView 메시지 처리**
   ```javascript
   const onMessage = (e) => {
     const { type, value } = JSON.parse(e.nativeEvent.data);
     
     switch (type) {
       case 'googleLogin':
         googleLogin();
         break;
       case 'googleLogout':
         googleLogout();
         break;
     }
   };
   ```

3. **웹뷰로 메시지 전송**
   ```javascript
   const postMessageToWebView = (type, value) => {
     const message = { type, value };
     webViewRef.current.postMessage(JSON.stringify(message));
   };
   ```

## 주의사항

1. **웹뷰 환경 감지**: `window.ReactNativeWebView` 객체의 존재 여부로 웹뷰 환경을 감지합니다.

2. **Firebase 동기화**: 네이티브 앱에서 로그인/로그아웃 시 웹 Firebase Auth도 동기화됩니다.

3. **에러 처리**: 네이티브 앱에서 발생한 에러는 웹으로 전달되어 사용자에게 표시됩니다.

4. **메시지 형식**: 모든 메시지는 JSON 형식으로 직렬화되어 전송됩니다.

## 테스트

### 웹뷰 환경 테스트

1. React Native 앱에서 웹뷰로 웹 애플리케이션 로드
2. 구글 로그인 버튼 클릭
3. 네이티브 구글 로그인 플로우 실행
4. 로그인 성공 후 웹 Firebase Auth 동기화 확인

### 일반 웹 환경 테스트

1. 브라우저에서 직접 웹 애플리케이션 접속
2. 구글 로그인 버튼 클릭
3. 기존 웹 기반 구글 로그인 플로우 실행

## 문제 해결

### 일반적인 문제들

1. **메시지 수신 안됨**
   - 웹뷰 환경 감지 확인
   - 메시지 리스너 등록 확인
   - JSON 파싱 오류 확인

2. **Firebase 동기화 실패**
   - 네이티브 앱의 Firebase 설정 확인
   - 웹 Firebase 설정 확인
   - 토큰 전달 과정 확인

3. **구글 로그인 실패**
   - 네이티브 앱의 Google Sign-In 설정 확인
   - 웹 클라이언트 ID 설정 확인
   - 에러 메시지 확인

## 추가 개발

### 새로운 메시지 타입 추가

1. `webviewBridge.ts`에 새로운 메시지 처리 함수 추가
2. 필요한 경우 다국어 메시지 추가
3. 네이티브 앱에서도 해당 메시지 처리 로직 추가

### 기능 확장

- Apple 로그인 지원
- 다른 소셜 로그인 지원
- 푸시 알림 통합
- 파일 업로드/다운로드 통합 