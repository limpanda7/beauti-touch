# 웹뷰 구글 로그인 통합 가이드 (개선된 버전)

이 문서는 React Native WebView에서 웹 애플리케이션과 네이티브 앱 간의 구글 로그인 통신 방법을 설명합니다.

## 개요

웹뷰 환경에서는 네이티브 앱의 구글 로그인 기능을 사용하여 더 나은 사용자 경험을 제공합니다. 개선된 구조에서는 네이티브 앱에서 Google 로그인과 Firebase Auth까지 완료한 후, 유저 정보만 웹뷰로 전달합니다.

## 개선된 구조

### AS-IS (기존 구조)
1. **React Native**: GoogleSignin으로 idToken만 얻어서 웹뷰로 전달
2. **Web**: idToken을 받아서 Firebase Auth로 다시 인증 처리

### TO-BE (개선된 구조)
1. **React Native**: Google 로그인 → Firebase 로그인까지 네이티브에서 완료
2. **Web**: 유저 정보만 받아서 화면 렌더링에 사용 (Firebase Auth 불필요)

## 구현된 기능

### 1. 웹뷰 브리지 서비스 (`src/services/webviewBridge.ts`)

- 네이티브 앱과의 메시지 통신 처리
- 웹뷰 환경 감지
- 네이티브 유저 정보 처리

### 2. 수정된 컴포넌트

- `LoginForm.tsx`: 웹뷰 환경에서 네이티브 구글 로그인 사용
- `App.tsx`: 웹뷰 메시지 리스너 설정
- `authStore.ts`: 웹뷰 메시지 처리 및 상태 동기화

### 3. 다국어 지원

모든 언어 파일에 웹뷰 관련 에러 메시지 추가:
- `googleLoginFailed`: 구글 로그인 실패
- `googleLogoutFailed`: 구글 로그아웃 실패
- `authStatusFailed`: 인증 상태 확인 실패

## 메시지 통신 프로토콜

### 웹 → 네이티브 앱

| 메시지 타입 | 설명 | 파라미터 |
|------------|------|----------|
| `googleLogin` | 구글 로그인 요청 | 없음 |
| `googleLogout` | 구글 로그아웃 요청 | 없음 |
| `checkAuthStatus` | 인증 상태 확인 요청 | 없음 |

### 네이티브 앱 → 웹

| 메시지 타입 | 설명 | 파라미터 |
|------------|------|----------|
| `userLoginSuccess` | 네이티브 유저 로그인 성공 | `NativeUserInfo` |
| `userLoginFail` | 네이티브 유저 로그인 실패 | `string` (에러 메시지) |
| `userLogoutSuccess` | 네이티브 유저 로그아웃 성공 | 없음 |
| `userLogoutFail` | 네이티브 유저 로그아웃 실패 | `string` (에러 메시지) |
| `authStatusSuccess` | 인증 상태 확인 성공 | `{ isSignedIn: boolean, user: NativeUserInfo \| null }` |
| `authStatusFail` | 인증 상태 확인 실패 | `string` (에러 메시지) |

### 네이티브 유저 정보 구조

```typescript
interface NativeUserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}
```

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
    case 'userLoginSuccess':
      console.log('네이티브 유저 로그인 성공:', message.value);
      break;
    case 'userLoginFail':
      console.error('네이티브 유저 로그인 실패:', message.value);
      break;
  }
});
```

## 네이티브 앱 설정

### React Native 앱에서 필요한 설정

1. **Firebase Auth 설정**
   ```javascript
   import auth from '@react-native-firebase/auth';
   ```

2. **Google Sign-In 설정**
   ```javascript
   GoogleSignin.configure({
     webClientId: 'YOUR_WEB_CLIENT_ID_HERE',
   });
   ```

3. **WebView 메시지 처리**
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
       case 'checkAuthStatus':
         checkAuthStatus();
         break;
     }
   };
   ```

4. **웹뷰로 메시지 전송**
   ```javascript
   const postMessageToWebView = (type, value) => {
     const message = { type, value };
     webViewRef.current.postMessage(JSON.stringify(message));
   };
   ```

## 주의사항

1. **웹뷰 환경 감지**: `window.ReactNativeWebView` 객체의 존재 여부로 웹뷰 환경을 감지합니다.

2. **Firebase Auth**: 네이티브 앱에서만 Firebase Auth를 사용하고, 웹에서는 유저 정보만 받아서 사용합니다.

3. **에러 처리**: 네이티브 앱에서 발생한 에러는 웹으로 전달되어 사용자에게 표시됩니다.

4. **메시지 형식**: 모든 메시지는 JSON 형식으로 직렬화되어 전송됩니다.

## 테스트

### 웹뷰 환경 테스트

1. React Native 앱에서 웹뷰로 웹 애플리케이션 로드
2. 구글 로그인 버튼 클릭
3. 네이티브 구글 로그인 플로우 실행
4. 로그인 성공 후 유저 정보 전달 확인

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

2. **네이티브 로그인 실패**
   - 네이티브 앱의 Firebase 설정 확인
   - Google Sign-In 설정 확인
   - 에러 메시지 확인

3. **유저 정보 전달 실패**
   - 네이티브 앱의 유저 정보 변환 확인
   - 웹에서의 유저 정보 처리 확인

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