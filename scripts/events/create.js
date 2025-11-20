// 행사 등록 메인 로직

//=========상태 관리=========
let myClubs = [];

// 폼 검증 상태
const formValidation = {
  scope: true,      // 기본값 GLOBAL
  club: true,       // GLOBAL일 때는 club 선택 불필요
  type: false,      // 행사 유형
  title: false,
  content: false,
  capacity: false,  // 수용 인원
  startsAt: false,  // 시작 일시
  endsAt: false     // 종료 일시
};

//=========동아리 목록 로드=========
async function loadMyClubs() {
  try {
    console.log('내 동아리 목록 로드 중...');
    
    const response = await getMyClubs();
    myClubs = response.data || [];
    
    console.log('내 동아리 목록:', myClubs);
    
    // 동아리가 없으면 "내 동아리만" 옵션 비활성화
    if (myClubs.length === 0) {
      disableClubScope();
      return;
    }
    
    // 동아리 선택 옵션 렌더링
    const clubSelect = document.getElementById('clubSelect');
    clubSelect.innerHTML = '<option value="">동아리를 선택해주세요</option>';
    
    myClubs.forEach(club => {
      const option = document.createElement('option');
      option.value = club.clubId;
      option.textContent = club.name;
      clubSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('동아리 목록 로드 실패:', error);
    showToast('동아리 목록을 불러오는데 실패했습니다', 3000, 'error');
    disableClubScope();
  }
}

//=========동아리 옵션 비활성화=========
function disableClubScope() {
  const clubRadio = document.querySelector('input[name="scope"][value="CLUB"]');
  const clubLabel = clubRadio.closest('.scope-option');
  
  clubRadio.disabled = true;
  clubLabel.style.opacity = '0.5';
  clubLabel.style.cursor = 'not-allowed';
  
  const helpText = document.createElement('div');
  helpText.className = 'scope-help-text';
  helpText.innerHTML = '💡 동아리에 가입하면 사용할 수 있어요';
  helpText.style.fontSize = '13px';
  helpText.style.color = '#999';
  helpText.style.marginTop = '8px';
  
  const scopeOptions = document.querySelector('.scope-options');
  scopeOptions.appendChild(helpText);
  
  console.log('⚠️ 가입된 동아리가 없어 "내 동아리만" 옵션 비활성화');
}

//=========공개 범위 선택 이벤트=========
function setupScopeEvents() {
  console.log('행사 등록 : 공개 범위 처리 중');
  
  const scopeRadios = document.querySelectorAll('input[name="scope"]');
  const clubSelectGroup = document.getElementById('clubSelectGroup');
  const clubSelect = document.getElementById('clubSelect');
  
  scopeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const scope = e.target.value;
      
      if (scope === 'CLUB') {
        if (myClubs.length === 0) {
          showToast('가입된 동아리가 없습니다', 2000, 'error');
          document.querySelector('input[name="scope"][value="GLOBAL"]').checked = true;
          return;
        }
        
        clubSelectGroup.style.display = 'block';
        formValidation.club = false;
        clubSelect.required = true;
      } else {
        clubSelectGroup.style.display = 'none';
        formValidation.club = true;
        clubSelect.required = false;
        clubSelect.value = '';
        clearError('clubSelect');
      }
      
      updateButtonState(formValidation);
    });
  });
}

//=========동아리 선택 이벤트=========
function setupClubSelectEvents() {
  console.log('행사 등록 : 동아리 선택 처리 중');
  
  const clubSelect = document.getElementById('clubSelect');
  
  clubSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      formValidation.club = true;
      clearError('clubSelect');
    } else {
      formValidation.club = false;
      showError('clubSelect', '동아리를 선택해주세요');
    }
    updateButtonState(formValidation);
  });
}

//=========행사 유형 선택 이벤트=========
function setupTypeEvents() {
  console.log('행사 등록 : 행사 유형 처리 중');
  
  const typeSelect = document.getElementById('typeSelect');
  
  typeSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      formValidation.type = true;
      clearError('typeSelect');
    } else {
      formValidation.type = false;
      showError('typeSelect', '행사 유형을 선택해주세요');
    }
    updateButtonState(formValidation);
  });
}

//=========제목 입력 이벤트=========
function setupTitleEvents() {
  console.log('행사 등록 : 제목 처리 중');
  const titleInput = document.getElementById('titleInput');
  
  titleInput.addEventListener('blur', function() {
    validateTitle(this.value.trim(), formValidation);
    updateButtonState(formValidation);
  });
  
  titleInput.addEventListener('input', function() {
    if (this.value) clearError('titleInput');
    updateButtonState(formValidation);
  });
}

//=========내용 입력 이벤트=========
function setupContentEvents() {
  console.log('행사 등록 : 내용 처리 중');
  const contentInput = document.getElementById('contentInput');
  
  contentInput.addEventListener('blur', function() {
    validateContent(this.value.trim(), formValidation);
    updateButtonState(formValidation);
  });
  
  contentInput.addEventListener('input', function() {
    if (this.value) clearError('contentInput');
    updateButtonState(formValidation);
  });
}

//=========수용 인원 입력 이벤트=========
function setupCapacityEvents() {
  console.log('행사 등록 : 수용 인원 처리 중');
  const capacityInput = document.getElementById('capacityInput');
  
  capacityInput.addEventListener('blur', function() {
    const value = parseInt(this.value);
    
    if (!value || value <= 0) {
      formValidation.capacity = false;
      showError('capacityInput', '수용 인원을 입력해주세요 (1명 이상)');
    } else {
      formValidation.capacity = true;
      clearError('capacityInput');
    }
    
    updateButtonState(formValidation);
  });
  
  capacityInput.addEventListener('input', function() {
    if (this.value) clearError('capacityInput');
    updateButtonState(formValidation);
  });
}

//=========일시 입력 이벤트=========
function setupDateTimeEvents() {
  console.log('행사 등록 : 일시 처리 중');
  
  const startsAtInput = document.getElementById('startsAtInput');
  const endsAtInput = document.getElementById('endsAtInput');
  
  startsAtInput.addEventListener('change', function() {
    if (this.value) {
      formValidation.startsAt = true;
      clearError('startsAtInput');
      
      // 종료 시간도 입력되었으면 검증
      if (endsAtInput.value) {
        validateDateTimeRange(startsAtInput.value, endsAtInput.value);
      }
    } else {
      formValidation.startsAt = false;
      showError('startsAtInput', '시작 일시를 입력해주세요');
    }
    updateButtonState(formValidation);
  });
  
  endsAtInput.addEventListener('change', function() {
    if (this.value) {
      formValidation.endsAt = true;
      clearError('endsAtInput');
      
      // 시작 시간도 입력되었으면 검증
      if (startsAtInput.value) {
        validateDateTimeRange(startsAtInput.value, endsAtInput.value);
      }
    } else {
      formValidation.endsAt = false;
      showError('endsAtInput', '종료 일시를 입력해주세요');
    }
    updateButtonState(formValidation);
  });
}

// 시작/종료 시간 검증
function validateDateTimeRange(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  
  if (start >= end) {
    formValidation.endsAt = false;
    showError('endsAtInput', '종료 일시는 시작 일시보다 늦어야 합니다');
    return false;
  }
  
  formValidation.endsAt = true;
  clearError('endsAtInput');
  return true;
}

//=========이미지 업로드 이벤트=========
let imageFiles = [];

function setupImageEvents() {
  console.log('행사 등록 : 이미지 업로드 처리 중');
  
  document.getElementById('fileSelectBtn').addEventListener('click', function() {
    document.getElementById('imageInput').click();
  });
  
  document.getElementById('imageInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        addImageToPreview(file);
      }
    });

    this.value = '';
    console.log(`${files.length}개 이미지 추가됨. 총 ${imageFiles.length}개`);
  });
}

// 이미지를 미리보기에 추가
function addImageToPreview(file) {
  imageFiles.push(file);
  const fileIndex = imageFiles.length - 1;
  
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.index = fileIndex;
  
  const img = document.createElement('img');
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'image-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = '이미지 삭제';
  
  deleteBtn.addEventListener('click', function() {
    removeImageFromPreview(fileIndex);
  });
  
  previewItem.appendChild(img);
  previewItem.appendChild(deleteBtn);
  
  document.getElementById('imagePreviewContainer').appendChild(previewItem);
  
  const reader = new FileReader();
  reader.onload = function(e) {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// 이미지를 미리보기에서 삭제
function removeImageFromPreview(fileIndex) {
  imageFiles[fileIndex] = null;
  
  const previewItem = document.querySelector(`[data-index="${fileIndex}"]`);
  if (previewItem) {
    previewItem.remove();
  }
  
  console.log(`🗑️ 이미지 삭제됨. 현재 ${getValidImageCount()}개`);
}

// 유효한 이미지 개수 계산
function getValidImageCount() {
  return imageFiles.filter(file => file !== null).length;
}

// 유효한 이미지 파일들만 반환
function getValidImageFiles() {
  return imageFiles.filter(file => file !== null);
}

//=========폼 제출 이벤트=========
function setupSubmitEvent() {
  console.log('행사 등록 시도');
  
  document.getElementById('eventForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const scope = document.querySelector('input[name="scope"]:checked').value;
    const clubId = scope === 'CLUB' ? document.getElementById('clubSelect').value : null;
    const type = document.getElementById('typeSelect').value;
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    const locationName = document.getElementById('locationNameInput').value.trim() || null;
    const locationAddress = document.getElementById('locationAddressInput').value.trim() || null;
    const locationLink = document.getElementById('locationLinkInput').value.trim() || null;
    const capacity = parseInt(document.getElementById('capacityInput').value);
    const startsAt = document.getElementById('startsAtInput').value;
    const endsAt = document.getElementById('endsAtInput').value;
    const tagsInput = document.getElementById('tagsInput').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // 검증
    if (scope === 'CLUB' && !clubId) {
      showError('clubSelect', '동아리를 선택해주세요');
      return;
    }
    if (!type) {
      showError('typeSelect', '행사 유형을 선택해주세요');
      return;
    }
    if (!validateTitle(title, formValidation)) {
      return;
    }
    if (!validateContent(content, formValidation)) {
      return;
    }
    if (!capacity || capacity <= 0) {
      showError('capacityInput', '수용 인원을 입력해주세요');
      return;
    }
    if (!startsAt) {
      showError('startsAtInput', '시작 일시를 입력해주세요');
      return;
    }
    if (!endsAt) {
      showError('endsAtInput', '종료 일시를 입력해주세요');
      return;
    }
    if (!validateDateTimeRange(startsAt, endsAt)) {
      return;
    }
    
    // 로딩 상태
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '등록 중...';
    
    try {
      // API 호출
      const eventData = {
        scope: scope,
        clubId: clubId,
        type: type,
        title: title,
        content: content,
        locationName: locationName,
        locationAddress: locationAddress,
        locationLink: locationLink,
        capacity: capacity,
        startsAt: startsAt,
        endsAt: endsAt,
        tags: tags,
        images: getValidImageFiles()
      };
      
      const response = await createEvent(eventData);
      
      console.log('행사 등록 완료!', response);
      
      showToast(response.message || '행사가 등록되었습니다');
      
      navigateTo('posts.html', 2000);
      
    } catch (error) {
      console.error('행사 등록 실패:', error);
      
      if (error.status === 400) {
        showError('eventForm', error.message || '입력 정보를 확인해주세요');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else if (error.status === 413) {
        showError('eventForm', '이미지 용량이 너무 큽니다');
      } else {
        showError('eventForm', '행사 등록 중 오류가 발생했습니다');
      }
      
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

//=========행사 등록 API=========
async function createEvent(eventData) {
  console.log('행사 등록 API 호출');
  
  // FormData 구성
  const formData = new FormData();
  
  formData.append('scope', eventData.scope);
  
  if (eventData.clubId) {
    formData.append('clubId', eventData.clubId);
  }
  
  formData.append('type', eventData.type);
  formData.append('title', eventData.title);
  formData.append('content', eventData.content);
  
  if (eventData.locationName) {
    formData.append('locationName', eventData.locationName);
  }
  if (eventData.locationAddress) {
    formData.append('locationAddress', eventData.locationAddress);
  }
  if (eventData.locationLink) {
    formData.append('locationLink', eventData.locationLink);
  }
  
  formData.append('capacity', eventData.capacity);
  formData.append('startsAt', eventData.startsAt);
  formData.append('endsAt', eventData.endsAt);
  
  // 태그 추가
  if (eventData.tags && eventData.tags.length > 0) {
    eventData.tags.forEach(tag => {
      formData.append('tags', tag);
    });
  }
  
  // 이미지 추가
  if (eventData.images && eventData.images.length > 0) {
    eventData.images.forEach(imageFile => {
      formData.append('images', imageFile);
    });
    console.log(`📷 이미지 ${eventData.images.length}개 포함`);
  }
  
  // API 호출
  return await apiRequest('/events', {
    method: 'POST',
    body: formData
  });
}

//=========뒤로가기 버튼=========
function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) {
    backBtn.onclick = () => {
      const hasContent = 
        document.getElementById('titleInput').value.trim() ||
        document.getElementById('contentInput').value.trim() ||
        imageFiles.length > 0;
      
      confirmBack('posts.html', hasContent, '작성 중인 내용이 사라집니다.');
    };
  }
}

//=========페이지 초기화=========
async function init() {
  console.log('행사 등록 페이지 불러오는 중');
  
  await loadMyClubs();
  
  setupBackButton();
  setupScopeEvents();
  setupClubSelectEvents();
  setupTypeEvents();
  setupTitleEvents();
  setupContentEvents();
  setupCapacityEvents();
  setupDateTimeEvents();
  setupImageEvents();
  setupSubmitEvent();

  updateButtonState(formValidation);
  
  console.log('행사 등록 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('events/create.js 로드 완료');