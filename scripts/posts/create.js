// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { initCustomSelects } from '../common/component/customSelect.js';
import { showLoading, hideLoading } from '../common/util/utils.js';
import { showToast } from '../common/util/utils.js';
import { navigateTo, confirmBack } from '../common/util/utils.js';
import { isValidTitle, isValidContent } from '../common/util/validators.js';
import { parseTags } from '../common/util/format.js';
import { createPost } from '../common/api/post.js';
import { getMyClubs } from '../common/api/club.js';

// ==================== 상수 ====================

const MAX_IMAGES = 5;

// ==================== 상태 관리 ====================

let selectedFiles = [];
let myClubs = [];

const touchedFields = {
  clubSelect: false,
  titleInput: false,
  contentInput: false
};

// ==================== API 호출 ====================

async function loadMyClubs() {
  try {
    const response = await getMyClubs();
    myClubs = response.data || [];

    console.log('내 동아리 목록:', myClubs.length, '개');

    const hiddenSelect = document.getElementById('clubSelect');
    const wrapper = document.querySelector('.custom-select[data-target="clubSelect"]');
    
    if (!hiddenSelect || !wrapper) {
      console.warn('clubSelect 요소를 찾을 수 없습니다');
      return;
    }

    const menu = wrapper.querySelector('.custom-select-menu');

    // 1. 동아리가 없을 때
    if (myClubs.length === 0) {
      console.warn('가입한 동아리가 없습니다');
      disableClubScope();
      
      hiddenSelect.innerHTML = '<option value="">동아리가 없습니다</option>';
      if (menu) {
          menu.innerHTML = '<div class="custom-select-option" data-value="">동아리가 없습니다</div>';
      }
      
      const trigger = wrapper.querySelector('.custom-select-trigger');
      if (trigger) trigger.textContent = '동아리가 없습니다';

      initCustomSelects();
      wrapper.classList.remove('has-value'); 
      return;
    }

    // 2. 동아리가 있을 때 -> 렌더링
    renderClubOptions();
    
  } catch (error) {
    console.error('동아리 로드 실패:', error);
    showToast('동아리 목록을 불러오지 못했습니다', 2000, 'error');
    disableClubScope();
    initCustomSelects();
  }
}

async function submitPost(formData) {
  try {
    showLoading();
    const response = await createPost(formData);
    hideLoading();

    console.log('게시글 작성 성공:', response);
    showToast('게시글이 등록되었습니다', 2000, 'success');

    setTimeout(() => {
      navigateTo('post_list.html');
    }, 1000);
  } catch (error) {
    hideLoading();
    console.error('게시글 작성 실패:', error);
    showToast(error.message || '게시글 등록에 실패했습니다', 2000, 'error');
  }
}

// ==================== UI 렌더링 ====================

function renderClubOptions() {
  const hiddenSelect = document.getElementById('clubSelect');
  const wrapper = document.querySelector('.custom-select[data-target="clubSelect"]');
  
  if (!hiddenSelect || !wrapper) return;

  const menu = wrapper.querySelector('.custom-select-menu');
  if (!menu) return;

  // 1. Hidden Select 초기화
  hiddenSelect.innerHTML = '<option value="">동아리를 선택해주세요</option>';
  
  // 2. Custom Menu 초기화 (플레이스홀더 항목 포함)
  menu.innerHTML = '<div class="custom-select-option" data-value="">동아리를 선택해주세요</div>';

  // 3. 동아리 목록 추가
  myClubs.forEach(club => {
    const clubId = club.clubId;
    const clubName = club.clubName || `클럽 ${clubId}`;

    const option = document.createElement('option');
    option.value = clubId;
    option.textContent = clubName;
    hiddenSelect.appendChild(option);

    const div = document.createElement('div');
    div.className = 'custom-select-option';
    div.dataset.value = clubId;
    div.textContent = clubName;
    menu.appendChild(div);
  });

  // 4. 커스텀 셀렉트 활성화 (이미 초기화된 경우 무시됨)
  initCustomSelects();

  // ✅ [핵심 수정] 강제로 첫 번째 항목(placeholder)에 '선택됨' 스타일 적용
  // initCustomSelects가 skip되더라도 시각적으로 선택된 상태를 만들어줍니다.
  const placeholderOption = menu.querySelector('.custom-select-option[data-value=""]');
  if (placeholderOption) {
      placeholderOption.classList.add('is-selected');
  }
  
  console.log('동아리 옵션 렌더링 완료');
}

function renderImagePreview(file, index) {
  const container = document.getElementById('imagePreviewContainer');

  const wrapper = document.createElement('div');
  wrapper.className = 'image-preview-item';
  wrapper.dataset.index = index;

  const img = document.createElement('img');
  img.className = 'image-preview-img';

  const reader = new FileReader();
  reader.onload = (e) => {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'image-preview-remove';
  removeBtn.innerHTML = '×';
  removeBtn.addEventListener('click', () => removeImage(index));

  wrapper.appendChild(img);
  wrapper.appendChild(removeBtn);
  container.appendChild(wrapper);
}

function updateImagePreview() {
  const container = document.getElementById('imagePreviewContainer');
  container.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    renderImagePreview(file, index);
  });

  console.log('이미지 미리보기 업데이트:', selectedFiles.length, '개');
}

function removeImage(index) {
  selectedFiles.splice(index, 1);
  updateImagePreview();
  updateButtonState();

  console.log('이미지 제거:', index, '/ 남은 개수:', selectedFiles.length);
}

function disableClubScope() {
  const clubRadio = document.querySelector('input[name="scope"][value="CLUB"]');
  const clubLabel = clubRadio ? clubRadio.closest('.scope-option') : null;
  
  if (clubRadio && clubLabel) {
    clubRadio.disabled = true;
    clubLabel.style.opacity = '0.5';
    clubLabel.style.cursor = 'not-allowed';
    
    const helpText = document.createElement('div');
    helpText.className = 'scope-help-text';
    helpText.textContent = '가입된 동아리가 없습니다';
    helpText.style.fontSize = '12px';
    helpText.style.color = '#999';
    helpText.style.marginTop = '4px';
    
    if (!clubLabel.parentNode.querySelector('.scope-help-text')) {
        clubLabel.parentNode.appendChild(helpText);
    }
  }
  
  const globalRadio = document.querySelector('input[name="scope"][value="GLOBAL"]');
  if (globalRadio) globalRadio.checked = true;
}

// ==================== 검증 ====================

function validateForm(showErrors = false) {
  const scopeEl = document.querySelector('input[name="scope"]:checked');
  const scope = scopeEl ? scopeEl.value : 'GLOBAL';
  const clubId = document.getElementById('clubSelect').value;
  const title = document.getElementById('titleInput').value.trim();
  const content = document.getElementById('contentInput').value.trim();

  let isValid = true;

  if (scope === 'CLUB' && !clubId) {
    if (showErrors && touchedFields.clubSelect) {
      setFieldError('clubSelect', '동아리를 선택해주세요');
    }
    isValid = false;
  } else {
    clearFieldError('clubSelect');
  }

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

  return isValid;
}

function updateButtonState() {
  const isValid = validateForm(false);
  const submitBtn = document.getElementById('submitBtn');
  if(submitBtn) submitBtn.disabled = !isValid;
}

function validateField(fieldId) {
  touchedFields[fieldId] = true;
  validateForm(true);
  updateButtonState();
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if(!field) return;
  const parent = field.closest('.form-group') || field.parentElement;
  const helperText = parent.querySelector('.helper-text');

  field.classList.add('error');
  if(field.id === 'clubSelect') {
      const trigger = parent.querySelector('.custom-select-trigger');
      if(trigger) trigger.classList.add('error');
  }

  if (helperText) {
    helperText.textContent = message;
    helperText.classList.add('error');
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if(!field) return;
  const parent = field.closest('.form-group') || field.parentElement;
  const helperText = parent.querySelector('.helper-text');

  field.classList.remove('error');
  if(field.id === 'clubSelect') {
      const trigger = parent.querySelector('.custom-select-trigger');
      if(trigger) trigger.classList.remove('error');
  }

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
      const hasContent = 
        document.getElementById('titleInput').value.trim() ||
        document.getElementById('contentInput').value.trim() ||
        selectedFiles.length > 0;
      
      confirmBack('post_list.html', hasContent, '작성 중인 내용이 사라집니다.');
    });
  }
}

function setupScopeToggle() {
  const scopeRadios = document.querySelectorAll('input[name="scope"]');
  const clubSelectGroup = document.getElementById('clubSelectGroup');

  scopeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const scope = e.target.value;

      if (scope === 'CLUB' && myClubs.length === 0) {
          showToast('가입된 동아리가 없습니다', 2000, 'error');
          document.querySelector('input[name="scope"][value="GLOBAL"]').checked = true;
          if(clubSelectGroup) clubSelectGroup.style.display = 'none';
          return;
      }

      const isClubScope = scope === 'CLUB';

      if (isClubScope) {
        if(clubSelectGroup) clubSelectGroup.style.display = 'block';
      } else {
        if(clubSelectGroup) clubSelectGroup.style.display = 'none';
        const clubSelect = document.getElementById('clubSelect');
        if(clubSelect) clubSelect.value = '';
        clearFieldError('clubSelect');
      }

      updateButtonState();
    });
  });

  console.log('공개 범위 토글 이벤트 등록 완료');
}

function setupInputEvents() {
  const clubSelect = document.getElementById('clubSelect');
  const titleInput = document.getElementById('titleInput');
  const contentInput = document.getElementById('contentInput');

  if(clubSelect) clubSelect.addEventListener('blur', () => validateField('clubSelect'));
  if(titleInput) titleInput.addEventListener('blur', () => validateField('titleInput'));
  if(contentInput) contentInput.addEventListener('blur', () => validateField('contentInput'));

  if(clubSelect) {
      clubSelect.addEventListener('change', () => {
        clearFieldError('clubSelect');
        updateButtonState();
      });
  }

  if(titleInput) {
      titleInput.addEventListener('input', () => {
        clearFieldError('titleInput');
        updateButtonState();
      });
  }

  if(contentInput) {
      contentInput.addEventListener('input', () => {
        clearFieldError('contentInput');
        updateButtonState();
      });
  }

  console.log('입력 이벤트 등록 완료');
}

function setupFileSelect() {
  const fileSelectBtn = document.getElementById('fileSelectBtn');
  const imageInput = document.getElementById('imageInput');

  if(fileSelectBtn) {
      fileSelectBtn.addEventListener('click', () => {
        imageInput.click();
      });
  }

  if(imageInput) {
      imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);

        if (selectedFiles.length + files.length > MAX_IMAGES) {
          showToast(`최대 ${MAX_IMAGES}개까지만 선택 가능합니다`, 2000, 'error');
          return;
        }

        selectedFiles = [...selectedFiles, ...files];
        updateImagePreview();
        updateButtonState();

        imageInput.value = '';
      });
  }

  console.log('파일 선택 이벤트 등록 완료');
}

function setupFormSubmit() {
  const form = document.getElementById('postForm');
  if(!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    Object.keys(touchedFields).forEach(key => {
      touchedFields[key] = true;
    });

    if (!validateForm(true)) {
      showToast('필수 항목을 입력해주세요', 2000, 'error');
      return;
    }

    const formData = new FormData();

    const scope = document.querySelector('input[name="scope"]:checked').value;
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    const tagsInput = document.getElementById('tagsInput').value.trim();
    const tags = parseTags(tagsInput);

    // JSON 데이터를 Blob으로 변환하여 "request" 파트로 추가
    const requestData = {
      scope: scope,
      clubId: scope === 'CLUB' ? document.getElementById('clubSelect').value : null,
      title: title,
      content: content,
      tags: tags
    };
    formData.append('request', new Blob([JSON.stringify(requestData)], {
      type: 'application/json'
    }));

    // 이미지 파일들은 "images" 파트로 추가
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    console.log('게시글 데이터:', {
      scope,
      clubId: scope === 'CLUB' ? document.getElementById('clubSelect').value : null,
      title,
      content,
      tags,
      imageCount: selectedFiles.length
    });

    await submitPost(formData);
  });

  console.log('폼 제출 이벤트 등록 완료');
}

// ==================== 초기화 ====================

async function init() {
  console.log('게시글 작성 페이지 초기화');

  await initHeader();

  initCustomSelects();

  setupBackButton();
  setupScopeToggle();
  setupInputEvents();
  setupFileSelect();
  setupFormSubmit();

  await loadMyClubs();

  updateButtonState();

  console.log('게시글 작성 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/create.js 로드 완료');