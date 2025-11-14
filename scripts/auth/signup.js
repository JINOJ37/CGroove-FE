// 회원가입 메인 로직

// 회원가입 폼 검증
const formValidation = {
  email: false,
  password: false,
  passwordConfirm: false,
  nickname: false
};

// 프로필 이미지 입력 이벤트
let profileImage = null;
function setupProfileImageEvent() {
  console.log('회원가입 : 프로필 이미지 처리 중');
  const profileImageInput = document.getElementById('profileInput');
  const profileImageUpload = document.getElementById('profileUpload');

  profileImageUpload.addEventListener('click', function() {
    profileImageInput.click();
  });

  profileImageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      profileImage = file;
      const reader = new FileReader();
      reader.onload = function(e) {
        if(profileImageUpload){
          profileImageUpload.innerHTML = `<img src="${e.target.result}">`;
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// 이메일 입력 이벤트
function setupEmailEvents() {
  console.log('회원가입 : 이메일 처리 중');
  const emailInput = document.getElementById('emailInput');

  emailInput.addEventListener('blur', function() {
    validateEmail(this.value.trim(), formValidation);
    updateButtonState(formValidation);
  });
  
  emailInput.addEventListener('input', function() {
    if (this.value) clearError('emailInput');
  });
}

// 비밀번호 입력 이벤트
function setupPasswordEvents() {
  console.log('회원가입 : 비밀번호 입력 처리 중');
  const passwordInput = document.getElementById('passwordInput');

  passwordInput.addEventListener('blur', function() {
    validatePassword(this.value, formValidation);
    updateButtonState(formValidation);
  });
  
  passwordInput.addEventListener('input', function() {
    if (this.value) clearError('passwordInput');
  });
}

// 비밀번호 확인 입력 이벤트
function setupPasswordConfirmEvents() {
  console.log('회원가입 : 비밀번호 확인 입력 처리 중');
  const passwordConfirmInput = document.getElementById('passwordConfirmInput');

  passwordConfirmInput.addEventListener('blur', function() {
    validatePasswordConfirm(this.value, formValidation);
    updateButtonState(formValidation);
  });
  
  passwordConfirmInput.addEventListener('input', function() {
    if (this.value) clearError('passwordConfirmInput');
  });
}

// 닉네임 입력 이벤트
function setupNicknameEvents() {
  console.log('회원가입 : 닉네임 입력 처리 중');
  const nicknameInput = document.getElementById('nicknameInput');

  nicknameInput.addEventListener('blur', function() {
    validateNickname(this.value.trim(), formValidation);
    updateButtonState(formValidation);
  });
  
  nicknameInput.addEventListener('input', function() {
    if (this.value) clearError('nicknameInput');
  });
}
  
// '회원가입' 버튼 이벤트
async function setupSignupBtnEvents() {  
  console.log('회원가입 시도');

  document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 데이터 수집
    const formData = {
      profileImage: profileImage,
      email: document.getElementById('emailInput').value.trim(),
      password: document.getElementById('passwordInput').value,
      passwordConfirm: document.getElementById('passwordConfirmInput').value,
      nickname: document.getElementById('nicknameInput').value.trim(),
    };
    
    // 최종 검증
    const isValid = 
      validateEmail(formData.email, formValidation) &&
      validatePassword(formData.password, formValidation) &&
      validatePasswordConfirm(formData.passwordConfirm, formValidation) &&
      validateNickname(formData.nickname, formValidation);
    
    if (!isValid) {
      console.log('검증 실패');
      return;
    }
    
    // TODO : api 연결 시도
    setLoadingState(true);
    navigateTo('login.html', 1000);
  });
}

// 회원가입 페이지 초기화
function init() {
  console.log('회원가입 페이지 불러오는 중');
  
  setupProfileImageEvent();
  setupEmailEvents();
  setupPasswordEvents();
  setupPasswordConfirmEvents();
  setupNicknameEvents();
  setupSignupBtnEvents();

  updateButtonState(formValidation);
  
  console.log('회원가입 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('signup.js 로드 완료');