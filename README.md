# 🕺 C.Groove - Dance Community Platform (FE)

> **C.Groove**의 웹 클라이언트 프로젝트입니다.  
> **Vanilla JS(ES6+)** 와 **CSS3**를 사용하여 모던하고 반응형 웹을 구현했습니다.

**프로젝트의 자세한 설명은 [Backend README](https://github.com/100-hours-a-week/ktb3-full-nj-be)를 확인해주세요.**

---

## 🛠️ Tech Stack

- **Core**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Styling**: Custom CSS (Flexbox / Grid Layout) - *No Bootstrap/Tailwind*
- **Communication**: Fetch API (Custom Wrapper)

---

## 🖥️ UI/UX Screens
<img width="1512" height="862" alt="스크린샷 2025-12-07 오후 11 30 04" src="https://github.com/user-attachments/assets/8a5e7da1-a447-4de0-ba24-5ac6267bd3ac" />
<img width="1512" height="862" alt="스크린샷 2025-12-07 오후 11 30 16" src="https://github.com/user-attachments/assets/5b61a9ca-e472-440f-9c43-7a8aee35078d" />
<img width="1512" height="862" alt="스크린샷 2025-12-07 오후 11 30 30" src="https://github.com/user-attachments/assets/d1396f42-e145-4fed-aad5-28006c6a9c18" />
<img width="1512" height="862" alt="스크린샷 2025-12-07 오후 11 30 52" src="https://github.com/user-attachments/assets/eb542d0f-4999-4acb-93ea-6e7e3ea3013e" />

> *직관적인 UI를 통해 댄서들이 쉽게 행사 정보를 확인하고 클럽에 가입할 수 있도록 디자인했습니다.*

---

## ⚡ Technical Highlights

프레임워크의 도움 없이 **순수 자바스크립트로 애플리케이션의 구조를 잡는 데 집중**했습니다.

### 1. Custom Fetch Wrapper (Axios-like)
반복되는 `fetch` 호출과 헤더 설정을 줄이기 위해 통신 모듈을 직접 추상화했습니다.
- **인터셉터 구현**: API 요청 시 JWT Access Token 자동 주입
- **에러 핸들링**: 401(Unauthorized) 응답 시 로그인 페이지 리다이렉트 처리 공통화

### 2. 모듈형 아키텍처 (ES6 Modules)
단일 파일의 비대화를 막기 위해 기능별로 JS 파일을 분리하고 모듈화했습니다.
- `api/`: 서버 통신 로직 분리
- `utils/`: 공통 함수 (DOM 조작, 쿠키 파싱 등)
- `components/`: 재사용 가능한 UI 로직 (모달, 내비게이션 바 등)

### 3. 반응형 레이아웃 (Pure CSS)
미디어 쿼리(`@media`)와 Flexbox/Grid를 활용하여 모바일과 데스크톱 환경 모두에 최적화된 레이아웃을 구성했습니다.

---

## 🌟 주요 기능 (Client Side)

- **회원가입/로그인**: 유효성 검사(Validation) 및 에러 메시지 실시간 피드백
- **클럽 대시보드**: 내 클럽 정보 수정 및 멤버 관리 UI
- **행사 목록**: 필터링 기능을 포함한 카드형 리스트 뷰
- **이미지 업로드**: `FormData` 객체를 활용한 멀티파트 파일 전송 처리

---

## 🚀 실행 방법

별도의 빌드 과정(Webpack, Vite 등) 없이 브라우저에서 즉시 실행 가능합니다.

**1. 프로젝트 클론**
```bash
git clone https://github.com/100-hours-a-week/ktb3-full-nj-fe
cd ktb3-full-nj-fe
```

**2. 실행 (Live Server 권장)**
- VS Code의 **Live Server** 확장을 사용하여 `index.html` 실행
- 또는 로컬 웹 서버 구동:
  ```bash
  npx serve .
  ```

**3. 백엔드 서버 연결**
- 백엔드 서버가 `http://localhost:8080`에서 실행 중이어야 합니다.
- 자세한 내용은 [Backend README](https://github.com/100-hours-a-week/ktb3-full-nj-be) 참고

---

## 🚧 향후 계획

- [ ] **React Migration**
- [ ] **TypeScript 도입**
- [ ] **UX 개선**
- [ ] **테스트 환경 구축**

---

## 👨‍💻 개발자

**NJ** (남진)  
GitHub: [@JINOJ37](https://github.com/JINOJ37)
Email: jinoj0423@gmail.com

---

<div align="center">

**Made with ❤️ for University Street Dancers**

</div>
