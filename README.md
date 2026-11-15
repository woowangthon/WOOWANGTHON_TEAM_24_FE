# 보이는 강의 (Frontend)

시각장애 학생이 PDF 강의자료 속 그림과 표의 내용을 이해할 수 있도록,
AI가 생성한 설명을 검수자가 확인·수정한 뒤 학생에게 제공하는 웹 서비스입니다.

## 주요 기능

- 검수자·학생 역할 선택 및 역할별 화면 접근 제한
- PDF 강의자료 등록과 추출·AI 분석 진행률 확인
- 문서별 검수 필요·학생 신고 건수 확인
- 원본 페이지 이미지와 AI 설명을 함께 확인
- AI 설명 승인·수정 및 검수 완료 문서 공개
- 학생용 공개 자료 목록·상세 열람
- 학생의 설명 오류 신고와 검수 화면 재반영
- 키보드 이동과 스크린 리더를 고려한 접근성 지원

## 기술 스택

- React 19
- React Router 7
- Vite 8
- ESLint

## 시작하기

### 1. 설치

```powershell
git clone https://github.com/woowangthon/WOOWANGTHON_TEAM_24_FE.git
cd WOOWANGTHON_TEAM_24_FE
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 실행 방식을 선택합니다.

실제 로컬 백엔드 API를 연결하는 경우:

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=
```

프론트엔드 화면만 Mock 데이터로 확인하는 경우:

```env
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=
```

`VITE_API_BASE_URL`을 비워 두면 Vite가 `/api` 요청을
`http://127.0.0.1:8000`으로 전달합니다. 실제 API 연결 시 백엔드 서버를 먼저 실행해야 합니다.

### 3. 개발 서버 실행

```powershell
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속합니다.

## 주요 화면

| 경로 | 화면 | 접근 역할 |
|---|---|---|
| `/` | 역할 선택 | 공통 |
| `/dashboard` | 강의자료 대시보드 | 검수자 |
| `/upload` | PDF 자료 등록 | 검수자 |
| `/progress/:id` | 문서 처리 현황 | 검수자 |
| `/review/:id` | AI 설명 검수 | 검수자 |
| `/student` | 공개 자료 목록·상세 열람 | 검수자·학생 |

## 명령어

```powershell
npm run dev      # 개발 서버 실행
npm run lint     # 코드 검사
npm run build    # 배포용 빌드
npm run preview  # 빌드 결과 확인
```

## 프로젝트 구조

```text
src/
├── api/          # 문서·검수 API 호출과 Mock 처리
├── components/   # 공통 UI 컴포넌트
├── data/         # Mock 데이터와 임시 이미지
├── pages/        # 역할 선택·대시보드·진행·검수·학생 화면
├── App.jsx       # 라우팅과 역할별 접근 제어
└── main.jsx      # 애플리케이션 진입점
```

백엔드 실행 방법과 확정된 API 데이터 형식은
[WOOWANGTHON_TEAM_24_BE](https://github.com/woowangthon/WOOWANGTHON_TEAM_24_BE)의
`README.md`와 `examples/CONTRACT.md`를 참고하세요.
