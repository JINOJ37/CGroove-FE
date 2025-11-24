// 비밀번호 수정

// 비밀번호 수정 폼 검증
const formValidation = {
  password: false,
  passwordConfirm: false
};

// 비밀번호 수정 이벤트
function setupPasswordEvents() {
  console.log('비밀번호 수정 : 비밀번호 처리 중');
  const passwordInput = document.getElementById('passwordInput');
  
  passwordInput.addEventListener('blur', function() {
    validatePassword(this.value, formValidation);
    updateButtonState(formValidation);
  });
  
  passwordInput.addEventListener('input', function() {
    if (this.value) clearError('passwordInput');
    updateButtonState(formValidation);
  });
}

// 비밀번호 확인 수정 이벤트
function setupPasswordConfirmEvents() {
  console.log('비밀번호 수정 : 비밀번호 확인 처리 중');
  const passwordConfirmInput = document.getElementById('passwordConfirmInput');
  
  passwordConfirmInput.addEventListener('blur', function() {
    validatePasswordConfirm(this.value, formValidation);
    updateButtonState(formValidation);
  });
  
  passwordConfirmInput.addEventListener('input', function() {
    if (this.value) clearError('passwordConfirmInput');
    updateButtonState(formValidation);
  });
}

// '수정하기' 버튼 이벤트
function setupSubmitEvent() {
  console.log('비밀번호 수정 : 수정하기 버튼 처리 중');

  document.getElementById('passwordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = document.getElementById('passwordInput').value;
    const passwordConfirm = document.getElementById('passwordConfirmInput').value;
    
    // 검증
    if (!validatePassword(password, formValidation)) {
      console.log('검증 실패: 비밀번호');
      return;
    }
    if (!validatePasswordConfirm(passwordConfirm, formValidation)) {
      console.log('검증 실패: 비밀번호 확인');
      return;
    }
    
    // 로딩 상태
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '수정 중...';
    
    try {
      const response = await updatePassword(password);

      console.log('비밀번호 변경 완료!', response);
      showToast(response.message || '비밀번호가 변경되었습니다');
      
      document.getElementById('passwordInput').value = '';
      document.getElementById('passwordConfirmInput').value = '';
      formValidation.password = false;
      formValidation.passwordConfirm = false;
      
      navigateTo('main.html', 2000);
      
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      if (error.status === 400) {
        showError('passwordForm', error.message || '비밀번호 형식을 확인해주세요');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else if (error.status === 403) {
        showError('passwordForm', '현재 비밀번호가 일치하지 않습니다');
      } else {
        showError('passwordForm', '비밀번호 변경 중 오류가 발생했습니다');
      }
      
    } finally {
      // 로딩 종료
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// 비밀번호 변경
async function updatePassword(newPassword) {
  console.log('비밀번호 수정 : 비밀번호 수정 API 호출');
  
  return await apiRequest('/users/password', {
    method: 'PATCH',
    body: JSON.stringify({
      password: newPassword
    })
  });
}

// 뒤로가기 버튼 업데이트
function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) {
    backBtn.onclick = () => {
      const fallback = 'main.html';
      confirmBack(fallback, true, '수정 사항이 저장되지 않습니다.');
    };
  }
}

// 페이지 초기화
function init() {
  console.log('비밀번호 수정 페이지 불러오는 중');
  
  setupBackButton();
  setupPasswordEvents();
  setupPasswordConfirmEvents();
  setupSubmitEvent();

  updateButtonState(formValidation);
  
  console.log('비밀번호 수정 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('users/password_edit.js 로드 완료');