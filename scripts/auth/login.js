// 로그인

// 로그인 폼 검증
const formValidation = {
  email: false,
  password: false
};

// 이메일 입력 이벤트
function setupEmailEvents() {
  console.log('로그인 : 이메일 처리 중');
  const emailInput = document.getElementById('emailInput');
  
  emailInput.addEventListener('blur', function() {
    validateEmail(this.value.trim(), formValidation, true);
    updateButtonState(formValidation);
  });
  
  emailInput.addEventListener('input', function() {
    if (this.value) clearError('emailInput');
  });
}

// 비밀번호 입력 이벤트
function setupPasswordEvents() {
  console.log('로그인 : 비밀번호 처리 중');
  const passwordInput = document.getElementById('passwordInput');
  
  passwordInput.addEventListener('blur', function() {
    validatePassword(this.value, formValidation, true);
    updateButtonState(formValidation);
  });
  
  passwordInput.addEventListener('input', function() {
    if (this.value) clearError('passwordInput');
  });
}

// '로그인' 버튼 이벤트
function setupLoginBtnEvents() {
  console.log('로그인 시도');
  
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 데이터 수집
    const formData = {
      email: document.getElementById('emailInput').value.trim(),
      password: document.getElementById('passwordInput').value
    };
    
    // 최종 검증
    const isValid = 
      validateEmail(formData.email, formValidation, true) &&
      validatePassword(formData.password, formValidation, true);

    if (!isValid) {
      console.log('검증 실패 : 기본 검증');
      return;
    }

    // 로그인 실행
    await handleLogin(formData);
  });
}

// 로그인 처리
async function handleLogin(formData) {
  setLoadingState(true, '로그인 중..');
  
  try {    
    // API 요청
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      })
    });
    
    // 토큰 저장
    if (response.data && response.data.accessToken && response.data.refreshToken) {
      storeToken(response.data.accessToken, response.data.refreshToken);
    }
    
    console.log('로그인 성공!');
    showToast(response.message);
    navigateTo('main.html', 2000);

  } catch (error) {
    console.error('로그인 실패:', error.message);
    
    // 에러 메시지 표시
    if (error.status === 401) {
      showToast('이메일 또는 비밀번호가 잘못되었습니다', 3000, 'error');
    } else if (error.status === 400) {
      showToast('입력 정보를 확인해주세요', 3000, 'error');
    } else {
      showToast('로그인 중 오류가 발생했습니다', 3000, 'error');
    }
    
  } finally {
    setLoadingState(false, '로그인');
  }
}

// 로그인 페이지 초기화
function init() {
  console.log('로그인 페이지 불러오는 중');
  
  setupEmailEvents();
  setupPasswordEvents();
  setupLoginBtnEvents();
  
  updateButtonState(formValidation);
  
  console.log('로그인 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('login.js 로드 완료');