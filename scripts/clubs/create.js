// scripts/clubs/create.js

// =======================
// 상태 관리
// =======================

// 폼 검증 상태
const clubFormValidation = {
  clubName: false,
  intro: false,
  locationName: false,
  description: false
};

// 대표 이미지 파일 (압축된 최종 파일)
let clubImageFile = null;

// =======================
// 유틸: 버튼 상태 업데이트
// =======================
function updateClubSubmitButtonState() {
  const btn = document.getElementById('clubSubmitBtn');
  if (!btn) return;

  const allValid = Object.values(clubFormValidation).every(v => v === true);
  btn.disabled = !allValid;
}

// =======================
// 유틸: 개별 필드 검증
// =======================

function validateClubName(value) {
  if (!value) {
    showError('clubNameInput', '동아리 이름을 입력해주세요');
    clubFormValidation.clubName = false;
    return false;
  }
  clearError('clubNameInput');
  clubFormValidation.clubName = true;
  return true;
}

function validateIntro(value) {
  if (!value) {
    showError('clubSubtitleInput', '한 줄 소개를 입력해주세요');
    clubFormValidation.intro = false;
    return false;
  }
  clearError('clubSubtitleInput');
  clubFormValidation.intro = true;
  return true;
}

function validateLocation(value) {
  if (!value) {
    showError('locationInput', '활동 장소를 입력해주세요');
    clubFormValidation.locationName = false;
    return false;
  }
  clearError('locationInput');
  clubFormValidation.locationName = true;
  return true;
}

function validateDescription(value) {
  if (!value) {
    showError('descriptionInput', '동아리 소개를 입력해주세요');
    clubFormValidation.description = false;
    return false;
  }
  clearError('descriptionInput');
  clubFormValidation.description = true;
  return true;
}

// =======================
// 대표 이미지 업로드 이벤트 (원형 아바타)
// =======================
function setupClubImageEvent() {
  console.log('동아리 생성 : 대표 이미지 처리 중');

  const container = document.getElementById('clubImageContainer');
  const fileInput = document.getElementById('clubImageUpload');

  if (!container || !fileInput) {
    console.warn('clubImageContainer 또는 clubImageUpload를 찾을 수 없습니다.');
    return;
  }

  container.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 이미지 압축/리사이즈 (회원가입과 동일 패턴)
      const { file: processedFile, previewUrl } = await processImageFile(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        maxSizeBytes: 2 * 1024 * 1024 // 2MB 이하이면 압축 X
      });

      clubImageFile = processedFile;

      container.innerHTML = `
        <img src="${previewUrl}" 
             alt="동아리 대표 이미지"
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
      `;
    } catch (err) {
      console.error('동아리 대표 이미지 처리 중 오류:', err);
      alert('이미지 처리 중 오류가 발생했습니다.');
    } finally {
      // 파일 입력값 초기화 (같은 파일 다시 선택해도 change 이벤트 발생하게)
      fileInput.value = '';
    }
  });
}

// =======================
// 입력 이벤트 바인딩
// =======================

function setupClubNameEvents() {
  console.log('동아리 생성 : 이름 처리 중');
  const input = document.getElementById('clubNameInput');
  if (!input) return;

  input.addEventListener('blur', function () {
    validateClubName(this.value.trim());
    updateClubSubmitButtonState();
  });

  input.addEventListener('input', function () {
    if (this.value.trim()) clearError('clubNameInput');
    validateClubName(this.value.trim());
    updateClubSubmitButtonState();
  });
}

function setupIntroEvents() {
  console.log('동아리 생성 : 한 줄 소개 처리 중');
  const input = document.getElementById('clubSubtitleInput');
  if (!input) return;

  input.addEventListener('blur', function () {
    validateIntro(this.value.trim());
    updateClubSubmitButtonState();
  });

  input.addEventListener('input', function () {
    if (this.value.trim()) clearError('clubSubtitleInput');
    validateIntro(this.value.trim());
    updateClubSubmitButtonState();
  });
}

function setupLocationEvents() {
  console.log('동아리 생성 : 위치 처리 중');
  const input = document.getElementById('locationInput');
  if (!input) return;

  input.addEventListener('blur', function () {
    validateLocation(this.value.trim());
    updateClubSubmitButtonState();
  });

  input.addEventListener('input', function () {
    if (this.value.trim()) clearError('locationInput');
    validateLocation(this.value.trim());
    updateClubSubmitButtonState();
  });
}

function setupDescriptionEvents() {
  console.log('동아리 생성 : 소개 처리 중');
  const input = document.getElementById('descriptionInput');
  if (!input) return;

  input.addEventListener('blur', function () {
    validateDescription(this.value.trim());
    updateClubSubmitButtonState();
  });

  input.addEventListener('input', function () {
    if (this.value.trim()) clearError('descriptionInput');
    validateDescription(this.value.trim());
    updateClubSubmitButtonState();
  });
}

// =======================
// 폼 제출 이벤트
// =======================

function setupClubSubmitEvent() {
  console.log('동아리 생성 : 제출 이벤트 설정 중');
  const form = document.getElementById('clubCreateForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const clubName = document.getElementById('clubNameInput').value.trim();
    const intro = document.getElementById('clubSubtitleInput').value.trim();
    const locationName = document.getElementById('locationInput').value.trim();
    const description = document.getElementById('descriptionInput').value.trim();
    const clubType = document.querySelector('input[name="clubType"]:checked').value;
    const tagsInput = document.getElementById('tagsInput').value.trim();

    const tags = tagsInput
      ? tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    // 최종 검증
    const valid =
      validateClubName(clubName) &&
      validateIntro(intro) &&
      validateLocation(locationName) &&
      validateDescription(description);

    updateClubSubmitButtonState();

    if (!valid) {
      console.log('동아리 생성 검증 실패');
      return;
    }

    const btn = document.getElementById('clubSubmitBtn');
    const originalText = btn ? btn.textContent : '';

    if (btn) {
      btn.disabled = true;
      btn.textContent = '생성 중...';
    }

    try {
      // FormData 구성
      const formData = new FormData();
      formData.append('clubName', clubName);
      formData.append('intro', intro);
      formData.append('locationName', locationName);
      formData.append('description', description);
      formData.append('clubType', clubType); 

      if (tags.length > 0) {
        tags.forEach(tag => formData.append('tags', tag));
      }

      if (clubImageFile) {
        formData.append('clubImage', clubImageFile);
        console.log('동아리 이미지 포함:', clubImageFile.name);
      } else {
        console.log('동아리 이미지 없음');
      }

      console.log('동아리 생성 API 호출');
      const response = await apiRequest('/clubs', {
        method: 'POST',
        body: formData
      });

      console.log('동아리 생성 성공:', response);
      showToast(response.message || '동아리가 생성되었습니다.');
      navigateTo('club_list.html', 1500);
    } catch (error) {
      console.error('동아리 생성 실패:', error);

      if (error.status === 400) {
        showError('clubCreateForm', error.message || '입력 정보를 확인해주세요');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다', 2000, 'error');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else if (error.status === 413) {
        showError('clubCreateForm', '이미지 용량이 너무 큽니다');
      } else {
        showError('clubCreateForm', '동아리 생성 중 오류가 발생했습니다');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  });
}

// =======================
// 뒤로가기 버튼
// =======================

function setupClubBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (!backBtn) return;

  backBtn.onclick = () => {
    const hasContent =
      document.getElementById('clubNameInput').value.trim() ||
      document.getElementById('clubSubtitleInput').value.trim() ||
      document.getElementById('locationInput').value.trim() ||
      document.getElementById('descriptionInput').value.trim() ||
      !!clubImageFile;

    // posts/create.js에서 쓰던 confirmBack 재사용 가정
    confirmBack('club_list.html', hasContent, '작성 중인 내용이 사라집니다.');
  };
}

// =======================
// 초기화
// =======================

function initClubCreatePage() {
  console.log('동아리 생성 페이지 불러오는 중');

  setupClubImageEvent();
  setupClubNameEvents();
  setupIntroEvents();
  setupLocationEvents();
  setupDescriptionEvents();
  setupClubSubmitEvent();
  setupClubBackButton();

  updateClubSubmitButtonState();

  console.log('동아리 생성 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClubCreatePage);
} else {
  initClubCreatePage();
}

console.log('clubs/create.js 로드 완료');
