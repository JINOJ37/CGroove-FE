// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { showLoading, hideLoading } from '../common/util/utils.js';
import { showToast } from '../common/util/utils.js';
import { navigateTo, confirmBack } from '../common/util/utils.js';
import { isValidTitle, isValidContent } from '../common/util/validators.js';
import { parseTags } from '../common/util/format.js';
import { getEvent, updateEvent } from '../common/api/event.js';
import { getMyClubs } from '../common/api/club.js';
import { API_BASE_URL } from '../common/api/core.js';

// ==================== 상수 ====================

const EVENT_TYPE_LABELS = {
  WORKSHOP: '워크샵',
  BATTLE: '배틀',
  JAM: '잼',
  PERFORMANCE: '공연'
};

// ==================== 상태 관리 ====================

let eventId = null;
let originalEventData = null;
let myClubs = [];
let imageFiles = [];
let existingImages = [];
let hasChanges = false;

const touchedFields = {
  titleInput: false,
  contentInput: false,
  capacityInput: false,
  startsAtInput: false,
  endsAtInput: false
};

// ==================== API 호출 ====================

async function loadEventData() {
  const urlParams = new URLSearchParams(window.location.search);
  eventId = urlParams.get('id');
  
  if (!eventId) {
    showToast('행사를 찾을 수 없습니다', 1500);
    setTimeout(() => navigateTo('post_list.html'), 1500);
    return;
  }
  
  showLoading();
  
  try {
    const response = await getEvent(eventId);
    originalEventData = response.data;
    
    console.log('행사 데이터 로드:', originalEventData);
    
    await loadMyClubs();
    populateForm();
    hideLoading();
    
  } catch (error) {
    hideLoading();
    console.error('행사 로드 실패:', error);
    
    if (error.status === 404) {
      showToast('존재하지 않는 행사입니다', 1500);
    } else if (error.status === 403) {
      showToast('수정 권한이 없습니다', 1500);
    } else {
      showToast('행사를 불러오는데 실패했습니다', 1500);
    }
    
    setTimeout(() => navigateTo('post_list.html'), 1500);
  }
}

async function loadMyClubs() {
  try {
    const response = await getMyClubs();
    myClubs = response.data || [];
    console.log('내 동아리 목록:', myClubs.length, '개');
  } catch (error) {
    console.error('동아리 목록 로드 실패:', error);
    myClubs = [];
  }
}

async function submitEvent(formData) {
  try {
    showLoading();
    const response = await updateEvent(eventId, formData);
    hideLoading();
    
    console.log('행사 수정 완료!', response);
    
    showToast('행사가 수정되었습니다', 1500);
    
    setTimeout(() => {
      if (document.referrer && document.referrer.includes('event_detail.html')) {
          history.back(); 
      } else {
          window.location.replace(`event_detail.html?id=${eventId}`);
      }
      
    }, 1500);
    
  } catch (error) {
    hideLoading();
    console.error('행사 수정 실패:', error);
    
    if (error.status === 400) {
      showToast(error.message || '입력 정보를 확인해주세요', 2000, 'error');
    } else if (error.status === 401) {
      showToast('로그인이 필요합니다', 2000, 'error');
      setTimeout(() => navigateTo('login.html'), 1500);
    } else if (error.status === 403) {
      showToast('수정 권한이 없습니다', 2000, 'error');
    } else if (error.status === 413) {
      showToast('이미지 용량이 너무 큽니다', 2000, 'error');
    } else {
      showToast('행사 수정 중 오류가 발생했습니다', 2000, 'error');
    }
    
    throw error;
  }
}

// ==================== UI 렌더링 ====================

function populateForm() {
  // ✅ 읽기 전용 필드 표시
  displayReadOnlyFields();
  
  // 기본 정보
  document.getElementById('titleInput').value = originalEventData.title || '';
  document.getElementById('contentInput').value = originalEventData.content || '';
  
  // 장소 정보
  document.getElementById('locationNameInput').value = originalEventData.locationName || '';
  document.getElementById('locationAddressInput').value = originalEventData.locationAddress || '';
  document.getElementById('locationLinkInput').value = originalEventData.locationLink || '';
  
  // 수용 인원
  document.getElementById('capacityInput').value = originalEventData.capacity || '';
  
  // 일시
  if (originalEventData.startsAt) {
    document.getElementById('startsAtInput').value = formatDateTimeLocal(originalEventData.startsAt);
  }
  if (originalEventData.endsAt) {
    document.getElementById('endsAtInput').value = formatDateTimeLocal(originalEventData.endsAt);
  }
  
  // 태그
  if (originalEventData.tags && originalEventData.tags.length > 0) {
    document.getElementById('tagsInput').value = originalEventData.tags.join(', ');
  }
  
  // 기존 이미지
  if (originalEventData.images && originalEventData.images.length > 0) {
    existingImages = [...originalEventData.images];
    renderExistingImages();
  }
  
  console.log('폼 데이터 채우기 완료');
}

function displayReadOnlyFields() {
  // 공개 범위
  const scopeDisplay = document.getElementById('scopeDisplay');
  const scope = originalEventData.scope || 'GLOBAL';
  scopeDisplay.textContent = scope === 'GLOBAL' ? '전체 공개' : '내 동아리만';
  
  // 동아리 (CLUB 범위일 때만 표시)
  if (scope === 'CLUB') {
    const clubDisplayGroup = document.getElementById('clubDisplayGroup');
    const clubDisplay = document.getElementById('clubDisplay');
    
    const club = myClubs.find(c => c.clubId === originalEventData.clubId);
    clubDisplay.textContent = club ? club.clubName : '동아리 정보 없음';
    clubDisplayGroup.style.display = 'block';
  }
  
  // 행사 유형
  const typeDisplay = document.getElementById('typeDisplay');
  const eventType = originalEventData.eventType || originalEventData.type;
  typeDisplay.textContent = EVENT_TYPE_LABELS[eventType] || eventType;
}

function formatDateTimeLocal(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function renderExistingImages() {
  const container = document.getElementById('imagePreviewContainer');
  
  existingImages.forEach((imagePath, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'image-preview-item';
    previewItem.dataset.type = 'existing';
    previewItem.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = `${API_BASE_URL}${imagePath}`;
    img.onerror = function() {
      console.warn('이미지 로드 실패:', this.src);
      this.parentElement.remove();
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'image-delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = '이미지 삭제';
    
    deleteBtn.addEventListener('click', () => {
      removeExistingImage(index);
    });
    
    previewItem.appendChild(img);
    previewItem.appendChild(deleteBtn);
    container.appendChild(previewItem);
  });
}

function removeExistingImage(index) {
  existingImages[index] = null;
  
  const previewItem = document.querySelector(`[data-type="existing"][data-index="${index}"]`);
  if (previewItem) {
    previewItem.remove();
  }
  
  hasChanges = true;
  updateButtonState();
  
  console.log('기존 이미지 제거:', index);
}

function addImageToPreview(file) {
  imageFiles.push(file);
  const fileIndex = imageFiles.length - 1;
  
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.type = 'new';
  previewItem.dataset.index = fileIndex;
  
  const img = document.createElement('img');
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'image-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = '이미지 삭제';
  
  deleteBtn.addEventListener('click', () => {
    removeNewImage(fileIndex);
  });
  
  previewItem.appendChild(img);
  previewItem.appendChild(deleteBtn);
  
  document.getElementById('imagePreviewContainer').appendChild(previewItem);
  
  const reader = new FileReader();
  reader.onload = function(e) {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  
  hasChanges = true;
}

function removeNewImage(fileIndex) {
  imageFiles[fileIndex] = null;
  
  const previewItem = document.querySelector(`[data-type="new"][data-index="${fileIndex}"]`);
  if (previewItem) {
    previewItem.remove();
  }
  
  hasChanges = true;
  updateButtonState();
  
  console.log(`새 이미지 삭제됨. 현재 ${getValidImageCount()}개`);
}

// ==================== 유틸리티 ====================

function getValidImageCount() {
  const existingCount = existingImages.filter(img => img !== null).length;
  const newCount = imageFiles.filter(file => file !== null).length;
  return existingCount + newCount;
}

function getValidImageFiles() {
  return imageFiles.filter(file => file !== null);
}

function getValidExistingImages() {
  return existingImages.filter(img => img !== null);
}

function checkForChanges() {
  const currentTitle = document.getElementById('titleInput').value.trim();
  const currentContent = document.getElementById('contentInput').value.trim();
  
  const titleChanged = currentTitle !== (originalEventData.title || '');
  const contentChanged = currentContent !== (originalEventData.content || '');
  
  hasChanges = titleChanged || contentChanged || getValidImageCount() !== (originalEventData.images?.length || 0);
  
  return hasChanges;
}

function createEventFormData() {
  const formData = new FormData();

  const tagsInput = document.getElementById('tagsInput').value.trim();
  const tags = parseTags(tagsInput);
  const validExistingImages = getValidExistingImages();

  // JSON 데이터를 Blob으로 변환하여 "request" 파트로 추가
  const requestData = {
    title: document.getElementById('titleInput').value.trim(),
    content: document.getElementById('contentInput').value.trim(),
    locationName: document.getElementById('locationNameInput').value.trim() || null,
    locationAddress: document.getElementById('locationAddressInput').value.trim() || null,
    locationLink: document.getElementById('locationLinkInput').value.trim() || null,
    capacity: parseInt(document.getElementById('capacityInput').value),
    startsAt: document.getElementById('startsAtInput').value,
    endsAt: document.getElementById('endsAtInput').value,
    tags: tags.length > 0 ? tags : null,
    keepImages: validExistingImages.length > 0 ? validExistingImages : []
  };
  formData.append('request', new Blob([JSON.stringify(requestData)], {
    type: 'application/json'
  }));

  // 새로 추가된 이미지 파일들은 "images" 파트로 추가
  const validNewImages = getValidImageFiles();
  validNewImages.forEach(file => {
    formData.append('images', file);
  });

  return formData;
}

// ==================== 검증 ====================

function validateForm(showErrors = false) {
  const title = document.getElementById('titleInput').value.trim();
  const content = document.getElementById('contentInput').value.trim();
  const capacity = parseInt(document.getElementById('capacityInput').value);
  const startsAt = document.getElementById('startsAtInput').value;
  const endsAt = document.getElementById('endsAtInput').value;
  
  let isValid = true;
  
  if (!isValidTitle(title)) {
    if (showErrors && touchedFields.titleInput) {
      if (!title || title.trim() === '') {
        setFieldError('titleInput', '제목을 입력해주세요');
      } else if (title.length > 200) {
        setFieldError('titleInput', '제목은 최대 200자까지 작성 가능합니다');
      }
    }
    isValid = false;
  } else {
    clearFieldError('titleInput');
  }
  
  if (!isValidContent(content)) {
    if (showErrors && touchedFields.contentInput) {
      setFieldError('contentInput', '내용을 입력해주세요');
    }
    isValid = false;
  } else {
    clearFieldError('contentInput');
  }
  
  if (!capacity || capacity <= 0) {
    if (showErrors && touchedFields.capacityInput) {
      setFieldError('capacityInput', '수용 인원을 입력해주세요 (1명 이상)');
    }
    isValid = false;
  } else {
    clearFieldError('capacityInput');
  }
  
  if (!startsAt) {
    if (showErrors && touchedFields.startsAtInput) {
      setFieldError('startsAtInput', '시작 일시를 입력해주세요');
    }
    isValid = false;
  } else {
    clearFieldError('startsAtInput');
  }
  
  if (!endsAt) {
    if (showErrors && touchedFields.endsAtInput) {
      setFieldError('endsAtInput', '종료 일시를 입력해주세요');
    }
    isValid = false;
  } else {
    clearFieldError('endsAtInput');
  }
  
  if (startsAt && endsAt) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    
    if (start >= end) {
      if (showErrors && touchedFields.endsAtInput) {
        setFieldError('endsAtInput', '종료 일시는 시작 일시보다 늦어야 합니다');
      }
      isValid = false;
    }
  }
  
  return isValid;
}

function updateButtonState() {
  const isValid = validateForm(false);
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = !isValid;
}

function validateField(fieldId) {
  touchedFields[fieldId] = true;
  validateForm(true);
  updateButtonState();
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const helperText = field.parentElement.querySelector('.helper-text');

  field.classList.add('error');
  if (helperText) {
    helperText.textContent = message;
    helperText.classList.add('error');
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const helperText = field.parentElement.querySelector('.helper-text');

  field.classList.remove('error');
  if (helperText) {
    helperText.textContent = '';
    helperText.classList.remove('error');
  }
}

// ==================== 이벤트 핸들러 ====================

function setupBackButton() {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      checkForChanges();
      confirmBack(`event_detail.html?id=${eventId}`, hasChanges, '수정 중인 내용이 사라집니다.');
    });
  }
}

function setupInputEvents() {
  const titleInput = document.getElementById('titleInput');
  const contentInput = document.getElementById('contentInput');
  const capacityInput = document.getElementById('capacityInput');
  const startsAtInput = document.getElementById('startsAtInput');
  const endsAtInput = document.getElementById('endsAtInput');
  
  titleInput.addEventListener('blur', () => validateField('titleInput'));
  contentInput.addEventListener('blur', () => validateField('contentInput'));
  capacityInput.addEventListener('blur', () => validateField('capacityInput'));
  startsAtInput.addEventListener('blur', () => validateField('startsAtInput'));
  endsAtInput.addEventListener('blur', () => validateField('endsAtInput'));
  
  titleInput.addEventListener('input', () => {
    clearFieldError('titleInput');
    hasChanges = true;
    updateButtonState();
  });
  
  contentInput.addEventListener('input', () => {
    clearFieldError('contentInput');
    hasChanges = true;
    updateButtonState();
  });
  
  capacityInput.addEventListener('input', () => {
    clearFieldError('capacityInput');
    hasChanges = true;
    updateButtonState();
  });
  
  startsAtInput.addEventListener('change', () => {
    clearFieldError('startsAtInput');
    hasChanges = true;
    updateButtonState();
  });
  
  endsAtInput.addEventListener('change', () => {
    clearFieldError('endsAtInput');
    hasChanges = true;
    updateButtonState();
  });
  
  console.log('입력 이벤트 등록 완료');
}

function setupImageEvents() {
  const fileSelectBtn = document.getElementById('fileSelectBtn');
  const imageInput = document.getElementById('imageInput');
  
  fileSelectBtn.addEventListener('click', function() {
    imageInput.click();
  });
  
  imageInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        addImageToPreview(file);
      }
    });

    this.value = '';
    console.log(`${files.length}개 이미지 추가됨. 총 ${imageFiles.length}개`);
  });
  
  console.log('이미지 업로드 이벤트 등록 완료');
}

function setupSubmitEvent() {
  const eventForm = document.getElementById('editForm');
  if (!eventForm) {
      console.error("HTML에서 'editForm' ID를 가진 요소를 찾을 수 없습니다.");
      return;
  }
  
  eventForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    Object.keys(touchedFields).forEach(key => {
      touchedFields[key] = true;
    });
    
    if (!validateForm(true)) {
      showToast('필수 항목을 입력해주세요', 2000, 'error');
      return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '수정 중...';
    
    try {
      const formData = createEventFormData();
      await submitEvent(formData);
      
    } catch (error) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
  
  console.log('폼 제출 이벤트 등록 완료');
}

// ==================== 초기화 ====================

async function init() {
  console.log('행사 수정 페이지 초기화');
  
  await initHeader();
  
  await loadEventData();
  
  setupBackButton();
  setupInputEvents();
  setupImageEvents();
  setupSubmitEvent();

  updateButtonState();
  
  console.log('행사 수정 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('events/edit.js 로드 완료');