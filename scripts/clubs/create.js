// ==================== Import ====================
import { createClub } from '../common/api/club.js';

import { 
  showError, 
  clearError, 
  updateButtonState, 
  showToast, 
  navigateTo,
  confirmBack
} from '../common/util/utils.js';

import { 
  validateClubName,
  validateIntro,
  validateLocation,
  validateDescription
} from '../common/util/validators.js';

import { processImageFile } from '../common/util/image_util.js';

import { parseTags } from '../common/util/format.js';

import { initHeader } from '../common/component/header.js';

// ==================== 상태 관리 ====================

const clubFormValidation = {
  clubName: false,
  intro: false,
  locationName: false,
  description: false
};

let clubImageFile = null;

// ==================== 이벤트 핸들러 ====================

function setupClubImageEvent() {
  const container = document.getElementById('clubImageContainer');
  const fileInput = document.getElementById('clubImageUpload');

  if (!container || !fileInput) {
    console.warn('clubImageContainer 또는 clubImageUpload를 찾을 수 없습니다');
    return;
  }

  container.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file: processedFile, previewUrl } = await processImageFile(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        maxSizeBytes: 2 * 1024 * 1024
      });

      clubImageFile = processedFile;

      container.innerHTML = `
        <img src="${previewUrl}" 
             alt="동아리 대표 이미지"
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
      `;
      
      showToast('이미지가 선택되었습니다');
      
    } catch (err) {
      console.error('클럽 이미지 처리 중 오류:', err);
      showToast('이미지 처리 중 오류가 발생했습니다', 2000, 'error');
    } finally {
      fileInput.value = '';
    }
  });
}

function setupClubNameEvents() {
  const input = document.getElementById('clubNameInput');
  if (!input) return;

  input.addEventListener('blur', () => {
    validateClubName(input.value.trim(), clubFormValidation);
    updateButtonState(clubFormValidation);
  });

  input.addEventListener('input', () => {
    if (input.value.trim()) clearError('clubNameInput');
    updateButtonState(clubFormValidation);
  });
}

function setupIntroEvents() {
  const input = document.getElementById('clubSubtitleInput');
  if (!input) return;

  input.addEventListener('blur', () => {
    validateIntro(input.value.trim(), clubFormValidation);
    updateButtonState(clubFormValidation);
  });

  input.addEventListener('input', () => {
    if (input.value.trim()) clearError('clubSubtitleInput');
    updateButtonState(clubFormValidation);
  });
}

function setupLocationEvents() {
  const input = document.getElementById('locationInput');
  if (!input) return;

  input.addEventListener('blur', () => {
    validateLocation(input.value.trim(), clubFormValidation);
    updateButtonState(clubFormValidation);
  });

  input.addEventListener('input', () => {
    if (input.value.trim()) clearError('locationInput');
    updateButtonState(clubFormValidation);
  });
}

function setupDescriptionEvents() {
  const input = document.getElementById('descriptionInput');
  if (!input) return;

  input.addEventListener('blur', () => {
    validateDescription(input.value.trim(), clubFormValidation);
    updateButtonState(clubFormValidation);
  });

  input.addEventListener('input', () => {
    if (input.value.trim()) clearError('descriptionInput');
    updateButtonState(clubFormValidation);
  });
}

function setupClubSubmitEvent() {
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
    const tags = parseTags(tagsInput);

    // 최종 검증
    const valid =
      validateClubName(clubName, clubFormValidation) &&
      validateIntro(intro, clubFormValidation) &&
      validateLocation(locationName, clubFormValidation) &&
      validateDescription(description, clubFormValidation);

    if (!valid) {
      console.log('클럽 생성 검증 실패');
      showToast('입력 정보를 확인해주세요', 2000, 'error');
      return;
    }

    const btn = document.querySelector('button[type="submit"]');
    const originalText = btn ? btn.textContent : '';

    if (btn) {
      btn.disabled = true;
      btn.textContent = '생성 중...';
    }

    try {
      const formData = new FormData();

      // JSON 데이터를 Blob으로 변환하여 "request" 파트로 추가
      const requestData = {
        clubName: clubName,
        intro: intro,
        locationName: locationName,
        description: description,
        clubType: clubType,
        tags: tags.length > 0 ? tags : null
      };
      formData.append('request', new Blob([JSON.stringify(requestData)], {
        type: 'application/json'
      }));

      // 클럽 이미지는 "clubImage" 파트로 추가
      if (clubImageFile) {
        formData.append('clubImage', clubImageFile);
        console.log('클럽 이미지 포함:', clubImageFile.name);
      } else {
        console.log('클럽 이미지 없음');
      }

      const response = await createClub(formData);
      showToast(response.message || '동아리가 생성되었습니다');
      navigateTo('club_list.html', 1500);
      
    } catch (error) {
      console.error('클럽 생성 실패:', error);

      if (error.status === 400) {
        showToast(error.message || '입력 정보를 확인해주세요', 2000, 'error');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다', 2000, 'error');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else if (error.status === 409) {
        showError('clubNameInput', '이미 존재하는 동아리 이름입니다');
        clubFormValidation.clubName = false;
        updateButtonState(clubFormValidation);
      } else if (error.status === 413) {
        showToast('이미지 용량이 너무 큽니다 (최대 2MB)', 2000, 'error');
      } else {
        showToast('동아리 생성 중 오류가 발생했습니다', 2000, 'error');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  });
}

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

    confirmBack('club_list.html', hasContent, '작성 중인 내용이 사라집니다.');
  };
}

function setupCancelButton() {
  const cancelBtn = document.getElementById('cancelBtn');
  if (!cancelBtn) return;

  cancelBtn.onclick = () => {
    const hasContent =
      document.getElementById('clubNameInput').value.trim() ||
      document.getElementById('clubSubtitleInput').value.trim() ||
      document.getElementById('locationInput').value.trim() ||
      document.getElementById('descriptionInput').value.trim() ||
      !!clubImageFile;

    confirmBack('club_list.html', hasContent, '작성 중인 내용이 사라집니다.');
  };
}

// ==================== 초기화 ====================

async function initClubCreatePage() {
  await initHeader();

  setupClubImageEvent();
  setupClubNameEvents();
  setupIntroEvents();
  setupLocationEvents();
  setupDescriptionEvents();
  setupClubSubmitEvent();
  setupClubBackButton();
  setupCancelButton();

  updateButtonState(clubFormValidation);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClubCreatePage);
} else {
  initClubCreatePage();
}

console.log('club/create.js 로드 완료');