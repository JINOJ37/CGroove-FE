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
  const profileImageContainer = document.getElementById('profileImageContainer');
  const profileImageUpload = document.getElementById('profileImageUpload');

  profileImageContainer.addEventListener('click', function() {
    profileImageUpload.click();
  });

  profileImageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      profileImage = file;
      const reader = new FileReader();
      reader.onload = function(e) {
        if(profileImageContainer){
          profileImageContainer.innerHTML = `<img src="${e.target.result}">`;
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
  console.log('회원가입 : 비밀번호 처리 중');
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
  console.log('회원가입 : 비밀번호 확인 처리 중');
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
  console.log('회원가입 : 닉네임 처리 중');
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
function setupSignupBtnEvents() {  
  console.log('회원가입 시도');

  document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 데이터 수집
    const signupData = {
      profileImage: profileImage,
      email: document.getElementById('emailInput').value.trim(),
      password: document.getElementById('passwordInput').value,
      passwordConfirm: document.getElementById('passwordConfirmInput').value,
      nickname: document.getElementById('nicknameInput').value.trim(),
    };
    
    // 최종 검증
    const isValid = 
      validateEmail(signupData.email, formValidation) &&
      validatePassword(signupData.password, formValidation) &&
      validatePasswordConfirm(signupData.passwordConfirm, formValidation) &&
      validateNickname(signupData.nickname, formValidation);
    
    if (!isValid) {
      console.log('검증 실패 : 기본 검증');
      return;
    }
    
    await handleSignup(signupData);
  });
}

// 회원가입 처리
async function handleSignup(signupData) {
    setLoadingState(true, '회원가입 중..');
    
    try {
      // FormData 구성
      const formData = new FormData();
      formData.append('email', signupData.email);
      formData.append('password', signupData.password);
      formData.append('nickname', signupData.nickname);
      
      // 프로필 이미지가 있을 때만 추가
      if (signupData.profileImage) {
        formData.append('profileImage', signupData.profileImage);
        console.log('프로필 이미지 포함:', signupData.profileImage.name);
      } else {
        console.log('프로필 이미지 없음 (디폴트 사용 예정)');
      }
      
      // API 요청
      const response = await apiRequest('/auth/signup', {
        method: 'POST',
        body: formData
      });
      
      console.log('회원가입 성공!', response.message);
      showToast(response.message);
      navigateTo('login.html', 2000);

    } catch (error) {

      console.error('회원가입 실패:', error.message);
      
      // 에러 상태 코드별 분기
      if (error.status === 409) {
        // 중복 에러 (이메일 또는 닉네임)
        // 백엔드 메시지에 따라 분기
        if (error.message.includes('이메일')) {
          showError('emailInput', '이미 사용 중인 이메일입니다');
        } else if (error.message.includes('닉네임')) {
          showError('nicknameInput', '이미 사용 중인 닉네임입니다');
        } else {
          showError('signupForm', '이미 사용 중인 정보가 있습니다');
        }
      } else if (error.status === 400) {
        // 검증 에러
        showError('signupForm', error.message || '입력 정보를 확인해주세요');
      } else if (error.status === 0) {
        // 네트워크 에러
        showError('signupForm', '네트워크 연결을 확인해주세요');
      } else {
        // 기타 서버 에러
        showError('signupForm', '회원가입 중 오류가 발생했습니다');
      }
      
    } finally {
      // 7. 로딩 종료
      setLoadingState(false, '회원가입');
    }

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