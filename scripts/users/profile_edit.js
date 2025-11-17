// 프로필 수정 로직

// 프로필 수정 폼 검증
const formValidation = {
    nickname: false
};

// 현재 사용자 정보 (로드된 데이터 저장)
let currentUserData = null;

/*
// 닉네임 중복 체크
async function checkNicknameDuplicate(nickname) {
  console.log('회원정보 수정 : 중복 체크 -> ', nickname);
  
  // 현재 닉네임과 같으면 중복 체크 안 함
  if (currentUserData && nickname === currentUserData.nickname) {
    formValidation.nickname = true;
    return true;
  }
  
  try {
    const isAvailable = await checkNickname(nickname);
    
    if (!isAvailable) {
      showError('nicknameInput', '*중복된 닉네임 입니다');
      formValidation.nickname = false;
      return false;
    }
    
    formValidation.nickname = true;
    return true;
    
  } catch (error) {
    console.error('닉네임 중복 체크 실패:', error);
    showError('nicknameInput', '중복 체크 중 오류가 발생했습니다');
    return false;
  }
}*/

// 프로필 이미지 수정 이벤트
let profileImage = null;
function setupProfileImageEvent() {
  console.log('회원정보 수정 : 프로필 이미지 처리 중');
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
        const profileImageInput = document.getElementById('profileImage');
        if (profileImageInput) {
            profileImageInput.innerHTML = `<img src="${e.target.result}">`;
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// 닉네임 수정 이벤트
function setupNicknameEvents() {
  console.log('회원정보 수정 : 닉네임 처리 중');
  const nicknameInput = document.getElementById('nicknameInput');

  nicknameInput.addEventListener('blur', function() {
    validateNickname(this.value.trim(),formValidation);
    // checkNicknameDuplicate(this.value.trim());
  });

  nicknameInput.addEventListener('input', function() {
    if (this.value) clearError('nicknameInput');
  });
}

// '수정하기' 버튼 이벤트
function setupEditButtonEvent() {
  console.log('수정하기 시도');
  
  document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nickname = document.getElementById('nicknameInput').value.trim();
    if (!validateNickname(nickname, formValidation)) {
      console.log('검증 실패: 기본 검증');
      return;
    }
    
    /*
    if (currentUserData && nickname !== currentUserData.nickname) {
      const isDuplicateCheck = await checkNicknameDuplicate(nickname);
      if (!isDuplicateCheck) {
        console.log('검증 실패: 중복된 닉네임');
        return;
      }
    }*/
    
    // 로딩 상태
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '수정 중...';
    
    try {
      // API 호출
      const updateData = {
        nickname: nickname,
        profileImage: profileImage  // File 객체 또는 null
      };
      
      const response = await updateUserInfo(updateData);
      
      console.log('✅ 수정 완료!', response);
      
      // 성공 토스트
      showToast(response.message || '수정 완료');
      
      // 사용자 정보 업데이트
      currentUserData.nickname = nickname;
      if (profileImage) {
        // 응답에 새 이미지 경로가 있다면 업데이트
        if (response.data && response.data.profileImage) {
          currentUserData.profileImage = response.data.profileImage;
        }
      }
      
      // 프로필 이미지 초기화
      profileImage = null;
      
    } catch (error) {      
      if (error.status === 409) {
        showError('nicknameInput', '이미 사용 중인 닉네임입니다');
      } else if (error.status === 400) {
        showError('profileForm', error.message || '입력 정보를 확인해주세요');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else {
        showError('profileForm', '수정 중 오류가 발생했습니다');
      }
      
    } finally {
      // 로딩 종료
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// '회원 탈퇴' 버튼 이벤트
function setupDeleteAccountEvent() {
  console.log('회원 탈퇴 시도');
  
  const deleteBtn = document.querySelector('.btn-secondary');
  if (deleteBtn) {
    // 기존 onclick 제거
    deleteBtn.removeAttribute('onclick');
    
    deleteBtn.addEventListener('click', function() {
      console.log('회원 탈퇴 클릭');
      
      // 확인 모달
      showModal(
        '회원탈퇴 하시겠습니까?',
        '작성된 게시글과 댓글은 삭제됩니다.',
        async function() {
          // 확인 클릭
          console.log('회원 탈퇴 확인');
          
          try {
            const response = await deleteAccount();
            
            console.log('회원 탈퇴 완료', response);
            
            // 토큰 삭제
            removeAccessToken();
            localStorage.removeItem('refreshToken');
            
            showToast(response.message || '회원 탈퇴가 완료되었습니다');
            
            // 2초 후 로그인 페이지로
            setTimeout(() => {
              navigateTo('login.html');
            }, 2000);
            
          } catch (error) {
            console.error('회원 탈퇴 실패:', error);
            
            if (error.status === 401) {
              showToast('로그인이 필요합니다');
              setTimeout(() => navigateTo('login.html'), 1500);
            } else {
              showToast('회원 탈퇴 중 오류가 발생했습니다');
            }
          }
        },
        function() {
          // 취소 클릭
          console.log('회원 탈퇴 취소');
        }
      );
    });
  }
}

// 회원정보 수정
async function updateUserInfo(updateData) {
  console.log('회원정보 수정 API 호출');
  
  // FormData 구성
  const formData = new FormData();
  
  if (updateData.nickname) {
    formData.append('nickname', updateData.nickname);
  }
  
  // 프로필 이미지가 있을 때만 추가
  if (updateData.profileImage) {
    formData.append('profileImage', updateData.profileImage);
    console.log('📷 프로필 이미지 포함:', updateData.profileImage.name);
  } else {
    console.log('📷 프로필 이미지 변경 없음');
  }
  
  // API 호출
  return await apiRequest('/users', {
    method: 'PATCH',
    body: formData
  });
}

// 회원 탈퇴
async function deleteAccount() {
  console.log('🗑️ 회원 탈퇴 API 호출');
  
  return await apiRequest('/users', {
    method: 'DELETE'
  });
}

// 사용자 정보 로드
async function loadUserData() {
  console.log('회원정보 수정 : 사용자 정보 로드');
  
  try {
    const response = await getMyInfo();
    currentUserData = response.data;
    
    console.log('사용자 정보 로드 완료:', currentUserData);
    
    document.getElementById('emailDisplay').value = currentUserData.email;

    // UI 업데이트
    document.getElementById('emailDisplay').textContent = currentUserData.email;
    document.getElementById('nicknameInput').value = currentUserData.nickname;
    
    // 프로필 이미지 설정
    if (currentUserData.profileImage) {
      const profileImageDiv = document.getElementById('profileImage');
      profileImageDiv.innerHTML = `<img src="${API_BASE_URL}${currentUserData.profileImage}" alt="프로필">`;
    }
    
    // 초기 검증 상태 설정
    formValidation.nickname = true;
    
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

// 회원정보 수정 페이지 초기화
async function init() {
  console.log('회원정보 수정 페이지 불러오는 중');
  
  await loadUserData();
  setupProfileImageEvent();
  setupNicknameEvents();
  setupEditButtonEvent();
  setupDeleteAccountEvent();
  
  console.log('회원정보 수정 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('profile/edit.js 로드 완료');