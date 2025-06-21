# BeautiTouch - 뷰티샵 관리 시스템

1인 뷰티샵을 위한 관리자 시스템입니다. 예약관리, 고객관리, 상품관리를 포함하며, 다국어 지원과 통화 설정 기능을 제공합니다.

## 주요 기능

### 🌍 다국어 지원
- **지원 언어**: 한국어, 영어, 베트남어, 태국어, 포르투갈어, 스페인어
- **언어 설정**: 설정 페이지에서 언어 변경 가능
- **자동 저장**: 선택한 언어는 로컬 스토리지에 저장되어 다음 방문 시 유지

### 💰 통화 설정
- **지원 통화**: 원(₩), 달러($), 유로(€), 동(₫), 바트(฿), 헤알(R$), 페소($)
- **통화 포맷팅**: 각 국가별 표준 통화 포맷 적용
- **설정 저장**: 선택한 통화는 로컬 스토리지에 저장

### 📅 예약관리
- **캘린더 뷰**: 월/주/일별 캘린더로 예약 확인
- **예약 생성/수정/삭제**: 직관적인 모달 인터페이스
- **예약 상태 관리**: 확정, 완료, 취소 상태 관리
- **고객/상품 선택**: 드롭다운으로 쉽게 선택

### 👥 고객관리
- **고객 목록**: 검색 기능이 포함된 고객 목록
- **고객 상세**: 고객 정보 조회 및 수정
- **예약 내역**: 고객별 예약 내역 확인
- **새 고객 등록**: 별도 페이지에서 고객 등록

### 🛍️ 상품관리
- **상품 목록**: 카테고리별 상품 관리
- **활성/비활성**: 상품 활성 상태 토글
- **가격/시간 관리**: 상품별 가격과 소요시간 설정
- **상품 등록/수정**: 모달을 통한 편리한 관리

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS (Sass)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Internationalization**: react-i18next
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth (준비 중)

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. Firebase 설정
`src/firebase.ts` 파일에서 Firebase 설정을 추가하세요:
```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 빌드
```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Layout.tsx      # 메인 레이아웃
│   ├── Sidebar.tsx     # 사이드바 네비게이션
│   ├── ReservationModal.tsx
│   ├── CustomerModal.tsx
│   └── ProductModal.tsx
├── pages/              # 페이지 컴포넌트
│   ├── ReservationsPage.tsx
│   ├── CustomersPage.tsx
│   ├── CustomerDetailPage.tsx
│   ├── CustomerNewPage.tsx
│   ├── ProductsPage.tsx
│   └── SettingsPage.tsx
├── services/           # Firebase 서비스
│   └── firestore.ts
├── styles/             # SCSS 스타일 파일
│   └── main.scss
├── types/              # TypeScript 타입 정의
│   └── index.ts
├── utils/              # 유틸리티 함수
│   ├── testData.ts
│   └── currency.ts
├── contexts/           # React Context
│   └── SettingsContext.tsx
├── i18n/               # 다국어 설정
│   ├── index.ts
│   └── locales/
│       ├── ko.json
│       ├── en.json
│       ├── vi.json
│       ├── th.json
│       ├── pt.json
│       └── es.json
└── App.tsx
```

## 스타일링 시스템

### SCSS 구조
- **변수**: 색상, 간격, 그림자 등을 변수로 관리
- **믹스인**: 반복되는 스타일을 믹스인으로 재사용
- **컴포넌트 스타일**: 각 컴포넌트별로 클래스 기반 스타일링
- **반응형**: 미디어 쿼리를 통한 모바일 대응

### 주요 클래스
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- `.card`, `.table-container`, `.form-group`
- `.calendar`, `.calendar-day`, `.reservation-item`
- `.toggle-switch`, `.loading-spinner`
- `.page-header`, `.modal-overlay`

## 다국어 지원

### 언어 추가 방법
1. `src/i18n/locales/` 폴더에 새로운 언어 파일 생성 (예: `ja.json`)
2. `src/i18n/index.ts`에서 새 언어 import 및 resources에 추가
3. `src/pages/SettingsPage.tsx`에서 언어 옵션 추가

### 번역 키 구조
```json
{
  "common": {
    "save": "저장",
    "cancel": "취소"
  },
  "navigation": {
    "reservations": "예약관리",
    "customers": "고객관리"
  },
  "reservations": {
    "title": "예약관리",
    "newReservation": "새 예약"
  }
}
```

## 통화 설정

### 통화 추가 방법
1. `src/utils/currency.ts`에서 새 통화 포맷터 추가
2. `src/i18n/locales/`의 각 언어 파일에서 통화 이름 추가
3. `src/pages/SettingsPage.tsx`에서 통화 옵션 추가

## 라이선스

MIT License

## 기여

프로젝트에 기여하고 싶으시다면 Pull Request를 보내주세요.

## 지원

문제가 있거나 기능 요청이 있으시면 Issue를 생성해주세요.
