// ==================== Import ====================

import { getMyInfo } from '../common/api/user.js';
import { apiRequest, removeToken } from '../common/api/core.js';

import { 
  showError, 
  clearError, 
  updateButtonState, 
  showToast, 
  navigateTo,
  showModal,
  confirmBack
} from '../common/util/utils.js';

import { validateNickname } from '../common/util/validators.js';

import { 
  processImageFile, 
  getImageUrl 
} from '../common/util/image_util.js';

import { initHeader } from '../common/component/header.js';

// ==================== 상태 관리 ====================

let currentUserData = null;
let newProfileImage = null;
let hasChanges = false;

const formValidation = {
  nickname: false
};

// ==================== 이벤트 핸들러 ====================

function setupProfileImageEvent() {  
  const profileImageContainer = document.getElementById('profileImageContainer');
  const profileImageUpload = document.getElementById('profileImageUpload');
  const profileImageDiv = document.getElementById('profileImage');
  const removeBtn = document.getElementById('removeImageBtn');
  
  profileImageContainer.addEventListener('click', (e) => {
    if (e.target.id === 'removeImageBtn') return;
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

      newProfileImage = processedFile;

      profileImageDiv.innerHTML = `
        <img src="${previewUrl}" alt="프로필"
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
      `;
      removeBtn.classList.add('show');
      
    } catch (err) {
      console.error('프로필 이미지 처리 중 오류:', err);
      showToast('이미지 처리 중 오류가 발생했습니다', 2000, 'error');
      
    } finally {
      profileImageUpload.value = '';
      checkForChanges();
    }
  });
  
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    showModal(
      '프로필 사진 삭제',
      '프로필 사진을 삭제하시겠습니까?',
      async () => {
        try {
          await apiRequest('/users/profile-image', { 
            method: 'DELETE' 
          });

          profileImageDiv.innerHTML = '<span class="profile-image-empty">+</span>';
          removeBtn.classList.remove('show');
          
          currentUserData.profileImage = null;
          newProfileImage = null;
          
          showToast('프로필 사진이 삭제되었습니다');
          checkForChanges();
          
        } catch (error) {
          console.error('프로필 이미지 삭제 실패:', error);
          
          if (error.status === 401) {
            showToast('로그인이 필요합니다');
            setTimeout(() => navigateTo('login.html'), 1500);
          } else {
            showToast('이미지 삭제 중 오류가 발생했습니다', 2000, 'error');
          }
        }
      }
    );
  });
}

function setupNicknameEvents() {  
  const nicknameInput = document.getElementById('nicknameInput');
  
  nicknameInput.addEventListener('blur', () => {
    validateNickname(nicknameInput.value.trim(), formValidation);
    checkForChanges();
  });
  
  nicknameInput.addEventListener('input', () => {
    if (nicknameInput.value) clearError('nicknameInput');
    checkForChanges();
  });
}

function checkForChanges() {
  if (!currentUserData) {
    hasChanges = false;
    updateButtonState(formValidation, hasChanges);
    return;
  }
  
  const currentNickname = document.getElementById('nicknameInput').value.trim();
  const nicknameChanged = currentNickname !== currentUserData.nickname;
  const imageChanged = newProfileImage !== null;
  
  hasChanges = (nicknameChanged || imageChanged) && formValidation.nickname;
  
  updateButtonState(formValidation, hasChanges);
}

function setupEditButtonEvent() {  
  const profileForm = document.getElementById('profileForm');
  
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!hasChanges) {
      showToast('변경된 내용이 없습니다');
      return;
    }
    
    const nickname = document.getElementById('nicknameInput').value.trim();
    if (!validateNickname(nickname, formValidation)) {
      return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '수정 중...';
    
    try {
      const response = await updateUserInfo(nickname);
      
      console.log('수정 완료!', response);
      showToast(response.message || '수정 완료');
      
      currentUserData.nickname = nickname;
      if (response.data && response.data.profileImage !== undefined) {
        currentUserData.profileImage = response.data.profileImage;
      }
      
      newProfileImage = null;
      hasChanges = false;
      updateButtonState(formValidation, hasChanges);
      
      navigateTo('main.html', 2000);
      
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      
      if (error.status === 409) {
        showError('nicknameInput', '이미 사용 중인 닉네임입니다');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else {
        showToast('수정 중 오류가 발생했습니다', 2000, 'error');
      }
      
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

async function updateUserInfo(nickname) {
  const formData = new FormData();

  // JSON 데이터를 Blob으로 변환하여 "request" 파트로 추가
  const requestData = { nickname: nickname };
  formData.append('request', new Blob([JSON.stringify(requestData)], {
    type: 'application/json'
  }));

  // 이미지 파일은 "profileImage" 파트로 추가
  if (newProfileImage) {
    formData.append('profileImage', newProfileImage);
  }

  return await apiRequest('/users', {
    method: 'PATCH',
    body: formData,
    isFormData: true
  });
}

function setupDeleteAccountEvent() {  
  const deleteBtn = document.querySelector('.btn-danger');
  if (!deleteBtn) return;
  
  deleteBtn.addEventListener('click', () => {
    showModal(
      '회원탈퇴 하시겠습니까?',
      '작성된 게시글과 댓글은 삭제됩니다.',
      async () => {
        try {
          const response = await apiRequest('/users', { method: 'DELETE' });
          
          console.log('회원 탈퇴 완료', response);
          removeToken();
          showToast(response.message || '회원 탈퇴가 완료되었습니다');
          
          setTimeout(() => navigateTo('login.html'), 2000);
          
        } catch (error) {
          console.error('회원 탈퇴 실패:', error);
          
          if (error.status === 401) {
            showToast('로그인이 필요합니다');
            setTimeout(() => navigateTo('login.html'), 1500);
          } else {
            showToast('회원 탈퇴 중 오류가 발생했습니다', 2000, 'error');
          }
        }
      }
    );
  });
}

function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) {
    backBtn.onclick = () => {
      const nicknameChanged = 
        document.getElementById('nicknameInput').value.trim() !== currentUserData.nickname;
      const imageChanged = newProfileImage !== null;
      
      const hasUnsavedChanges = nicknameChanged || imageChanged;
      
      confirmBack('main.html', hasUnsavedChanges, '수정 사항이 저장되지 않습니다.');
    };
  }
}

// ==================== 데이터 로드 ====================

// 사용자 정보 로드
async function loadUserData() {  
  try {
    const response = await getMyInfo();
    currentUserData = response.data;
    
    console.log('사용자 정보:', currentUserData);
    
    document.getElementById('emailDisplay').value = currentUserData.email;
    document.getElementById('nicknameInput').value = currentUserData.nickname;
    
    const profileImageDiv = document.getElementById('profileImage');
    const removeBtn = document.getElementById('removeImageBtn');
    
    if (currentUserData.profileImage) {
      const imageUrl = getImageUrl(currentUserData.profileImage, 'profile');
      profileImageDiv.innerHTML = `
        <img src="${imageUrl}" 
             alt="프로필"
             onerror="this.src='/assets/images/default-profile.png'"
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
      `;
      removeBtn.classList.add('show');
    } else {
      profileImageDiv.innerHTML = '<span class="profile-image-empty">+</span>';
      removeBtn.classList.remove('show');
    }
    
    formValidation.nickname = true;
    newProfileImage = null;
    
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
    
    if (error.status === 401) {
      showToast('로그인이 필요합니다');
      setTimeout(() => navigateTo('login.html'), 1500);
    } else {
      showToast('사용자 정보를 불러오는데 실패했습니다', 2000, 'error');
    }
  }
}

// ==================== 초기화 ====================

async function init() {
  await initHeader();
  await loadUserData();
  
  setupBackButton();
  setupProfileImageEvent();
  setupNicknameEvents();
  setupEditButtonEvent();
  setupDeleteAccountEvent();
  
  hasChanges = false;
  updateButtonState(formValidation, hasChanges);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('profile_edit.js 로드 완료');