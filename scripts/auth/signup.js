// ==================== Import ====================

import { signup } from '../common/api/auth.js';

import { 
  showError, 
  clearError, 
  updateButtonState,
  setLoadingState,
  showToast, 
  navigateTo,
  hideLoading
} from '../common/util/utils.js';

import { 
  validateEmail, 
  validatePassword,
  validatePasswordConfirm,
  validateNickname
} from '../common/util/validators.js';

import { processImageFile } from '../common/util/image_util.js';

// ==================== 상태 관리 ====================

const formValidation = {
  email: false,
  password: false,
  passwordConfirm: false,
  nickname: false
};

let profileImage = null;

// ==================== 이벤트 핸들러 ====================

function setupProfileImageEvents() {
  const profileImageContainer = document.getElementById('profileImageContainer');
  const profileImageUpload = document.getElementById('profileImageUpload');

  profileImageContainer.addEventListener('click', () => {
    profileImageUpload.click();
  });

  profileImageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file: processedFile, previewUrl } = await processImageFile(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        maxSizeBytes: 2 * 1024 * 1024
      });

      profileImage = processedFile;

      profileImageContainer.innerHTML = `
        <img src="${previewUrl}" 
             alt="프로필 미리보기"
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
      `;
      
      console.log('프로필 이미지 선택:', processedFile.name);
      
    } catch (err) {
      console.error('이미지 처리 중 오류:', err);
      showToast(err.message || '이미지 처리 중 오류가 발생했습니다', 2000, 'error');
    }
  });
}

function setupEmailEvents() {  
  const emailInput = document.getElementById('emailInput');

  emailInput.addEventListener('blur', () => {
    validateEmail(emailInput.value.trim(), formValidation);
    updateButtonState(formValidation);
  });
  
  emailInput.addEventListener('input', () => {
    if (emailInput.value) clearError('emailInput');
  });
}

function setupPasswordEvents() {  
  const passwordInput = document.getElementById('passwordInput');

  passwordInput.addEventListener('blur', () => {
    validatePassword(passwordInput.value, formValidation);
    updateButtonState(formValidation);
  });
  
  passwordInput.addEventListener('input', () => {
    if (passwordInput.value) clearError('passwordInput');
    updateButtonState(formValidation);
  });
}

function setupPasswordConfirmEvents() {  
  const passwordConfirmInput = document.getElementById('passwordConfirmInput');

  passwordConfirmInput.addEventListener('blur', () => {
    validatePasswordConfirm(passwordConfirmInput.value, formValidation);
    updateButtonState(formValidation);
  });
  
  passwordConfirmInput.addEventListener('input', () => {
    if (passwordConfirmInput.value) clearError('passwordConfirmInput');
    updateButtonState(formValidation);
  });
}

function setupNicknameEvents() {  
  const nicknameInput = document.getElementById('nicknameInput');

  nicknameInput.addEventListener('blur', () => {
    validateNickname(nicknameInput.value.trim(), formValidation);
    updateButtonState(formValidation);
  });
  
  nicknameInput.addEventListener('input', () => {
    if (nicknameInput.value) clearError('nicknameInput');
  });
}

function setupSignupBtnEvents() {
  const signupForm = document.getElementById('signupForm');
  
  signupForm.addEventListener('submit', async (e) => {
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
    const emailValid = validateEmail(signupData.email, formValidation);
    const passwordValid = validatePassword(signupData.password, formValidation);
    const passwordConfirmValid = validatePasswordConfirm(signupData.passwordConfirm, formValidation);
    const nicknameValid = validateNickname(signupData.nickname, formValidation);
    
    if (!emailValid || !passwordValid || !passwordConfirmValid || !nicknameValid) {
      console.log('검증 실패: 기본 검증');
      return;
    }
    
    await handleSignup(signupData);
  });
}

// ==================== 회원가입 처리 ====================

async function handleSignup(signupData) {
  try {
    const formData = new FormData();

    // JSON 데이터를 Blob으로 변환하여 "request" 파트로 추가
    const requestData = {
      email: signupData.email,
      password: signupData.password,
      nickname: signupData.nickname
    };
    formData.append('request', new Blob([JSON.stringify(requestData)], {
      type: 'application/json'
    }));

    // 이미지 파일은 "profileImage" 파트로 추가
    if (signupData.profileImage) {
      formData.append('profileImage', signupData.profileImage);
      console.log('프로필 이미지 포함:', signupData.profileImage.name);
    } else {
      console.log('프로필 이미지 없음 (서버에서 null 처리)');
    }

    const response = await signup(formData);
    
    console.log('회원가입 성공!', response);
    showToast(response.message || '회원가입 성공!');
    
    navigateTo('login.html', 2000);

  } catch (error) {
    console.error('회원가입 실패:', error);
    
    if (error.status === 409) {
      if (error.message.includes('이메일')) {
        showError('emailInput', '이미 사용 중인 이메일입니다');
      } else if (error.message.includes('닉네임')) {
        showError('nicknameInput', '이미 사용 중인 닉네임입니다');
      } else {
        showToast('이미 사용 중인 정보가 있습니다', 2000, 'error');
      }
    } else if (error.status === 400) {
      showToast(error.message || '입력 정보를 확인해주세요', 2000, 'error');
    } else {
      showToast(error.message || '회원가입 중 오류가 발생했습니다', 2000, 'error');
    }
    
  } finally {
    setLoadingState(false, '회원가입');
  }
}

// ==================== 초기화 ====================

function init() {  
  hideLoading();
  
  setupProfileImageEvents();
  setupEmailEvents();
  setupPasswordEvents();
  setupPasswordConfirmEvents();
  setupNicknameEvents();
  setupSignupBtnEvents();

  updateButtonState(formValidation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('signup.js 로드 완료');