// 프로필 수정

let currentUserData = null;
let profileImageFile = null;
let hasChanges = false;
let imageDeleted = false;

// 프로필 수정 폼 검증
const formValidation = {
  nickname: false
};

// 프로필 이미지 수정 이벤트
function setupProfileImageEvent() {
  console.log('프로필 수정 : 프로필 이미지 처리 중');
  
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

      profileImageFile = processedFile;
      imageDeleted = false;

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
      () => {
        profileImageDiv.innerHTML = '<span class="profile-image-empty">+</span>';
        profileImageFile = null;
        imageDeleted = true;
        removeBtn.classList.remove('show');
        checkForChanges();
        showToast('프로필 사진이 삭제되었습니다');
      }
    );
  });
}

// 닉네임 수정 이벤트
function setupNicknameEvents() {
  console.log('프로필 수정 : 닉네임 처리 중');
  
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

// 수정 여부 확인
function checkForChanges() {
  if (!currentUserData) {
    hasChanges = false;
    updateButtonState(formValidation, hasChanges);
    return;
  }
  
  const currentNickname = document.getElementById('nicknameInput').value.trim();
  const nicknameChanged = currentNickname !== currentUserData.nickname;
  const imageChanged = (profileImageFile !== null) || imageDeleted;
  
  hasChanges = (nicknameChanged || imageChanged) && formValidation.nickname;
  
  updateButtonState(formValidation, hasChanges);
}

// '수정하기' 버튼 이벤트
function setupEditButtonEvent() {
  console.log('프로필 수정 : 수정하기 버튼 처리 중');
  
  document.getElementById('profileForm').addEventListener('submit', async (e) => {
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
      const updateData = {
        nickname: nickname,
        profileImage: profileImageFile,
        deleteImage: imageDeleted
      };
      
      const response = await updateUserInfo(updateData);
      
      console.log('수정 완료!', response);
      showToast(response.message || '수정 완료');
      
      currentUserData.nickname = nickname;
      if (imageDeleted) {
        currentUserData.profileImage = null;
      } else if (profileImageFile && response.data && response.data.profileImage) {
        currentUserData.profileImage = response.data.profileImage;
      }
      
      profileImageFile = null;
      imageDeleted = false;
      hasChanges = false;
      updateButtonState(formValidation, hasChanges);
      
      navigateTo('main.html', 2000);
      
    } catch (error) {
      if (error.status === 409) {
        showError('nicknameInput', '이미 사용 중인 닉네임입니다');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else {
        showToast('수정 중 오류가 발생했습니다');
      }
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

async function updateUserInfo(updateData) {
  console.log('프로필 수정 : 프로필 수정 API 호출');
  
  const formData = new FormData();
  formData.append('nickname', updateData.nickname);
  
  if (updateData.deleteImage) {
    formData.append('deleteImage', 'true');
  } else if (updateData.profileImage) {
    formData.append('profileImage', updateData.profileImage);
  }
  
  return await apiRequest('/users', {
    method: 'PATCH',
    body: formData
  });
}

// '회원 탈퇴' 버튼 이벤트
function setupDeleteAccountEvent() {
  console.log('프로필 수정 : 회원 탈퇴 버튼 처리 중');
  
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
          if (error.status === 401) {
            showToast('로그인이 필요합니다');
            setTimeout(() => navigateTo('login.html'), 1500);
          } else {
            showToast('회원 탈퇴 중 오류가 발생했습니다');
          }
        }
      }
    );
  });
}

// 뒤로가기 버튼 업데이트
function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) {
    backBtn.onclick = () => {
      confirmBack('main.html', hasChanges, '수정 사항이 저장되지 않습니다.');
    };
  }
}

// 사용자 정보 로드
async function loadUserData() {
  console.log('사용자 정보 로드');
  
  try {
    const response = await getMyInfo();
    currentUserData = response.data;
    
    console.log('사용자 정보:', currentUserData);
    
    document.getElementById('emailDisplay').value = currentUserData.email;
    document.getElementById('nicknameInput').value = currentUserData.nickname;
    
    const profileImageDiv = document.getElementById('profileImage');
    const removeBtn = document.getElementById('removeImageBtn');
    
    if (currentUserData.profileImage) {
      profileImageDiv.innerHTML = `<img src="${API_BASE_URL}${currentUserData.profileImage}" alt="프로필">`;
      removeBtn.classList.add('show');
    } else {
      profileImageDiv.innerHTML = '<span class="profile-image-empty">+</span>';
      removeBtn.classList.remove('show');
    }
    
    formValidation.nickname = true;
    imageDeleted = false; 
    
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
    
    if (error.status === 401) {
      showToast('로그인이 필요합니다');
      setTimeout(() => navigateTo('login.html'), 1500);
    } else {
      showToast('사용자 정보를 불러오는데 실패했습니다');
    }
  }
}

// 페이지 초기화
async function init() {
  console.log('프로필 수정 페이지 불러오는 중');
  
  await loadUserData();
  setupBackButton();
  setupProfileImageEvent();
  setupNicknameEvents();
  setupEditButtonEvent();
  setupDeleteAccountEvent();
  
  hasChanges = false;
  updateButtonState(formValidation, hasChanges);
  
  console.log('프로필 수정 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('profile_edit.js 로드 완료');