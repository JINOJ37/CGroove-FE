// 게시글 작성 페이지

let myClubs = [];
let imageFiles = [];

const formValidation = {
  scope: true,
  club: true,
  title: false,
  content: false
};

// 내 동아리 목록 조회
async function loadMyClubs() {
  try {
    const response = await getMyClubs();
    myClubs = response.data || [];
    
    console.log('내 동아리 목록:', myClubs);
    
    if (myClubs.length === 0) {
      disableClubScope();
      return;
    }
    
    renderClubOptions();
    
  } catch (error) {
    console.error('동아리 목록 로드 실패:', error);
    showToast('동아리 목록을 불러오는데 실패했습니다', 3000, 'error');
    disableClubScope();
  }
}

// 게시글 작성
async function createPost(postData) {
  console.log('게시글 작성 API 호출');
  
  const formData = new FormData();
  
  formData.append('scope', postData.scope);
  
  if (postData.clubId) {
    formData.append('clubId', postData.clubId);
  }
  
  formData.append('title', postData.title);
  formData.append('content', postData.content);
  
  // 태그 추가
  if (postData.tags && postData.tags.length > 0) {
    postData.tags.forEach(tag => {
      formData.append('tags', tag);
    });
  }
  
  // 이미지 추가
  if (postData.images && postData.images.length > 0) {
    postData.images.forEach(imageFile => {
      formData.append('images', imageFile);
    });
    console.log(`이미지 ${postData.images.length}개 포함`);
  }
  
  return await apiRequest('/posts', {
    method: 'POST',
    body: formData
  });
}

// 동아리 옵션 렌더링
function renderClubOptions() {
  const wrapper = document.querySelector('.custom-select[data-target="clubSelect"]');
  const hiddenSelect = document.getElementById('clubSelect');
  const menu = wrapper ? wrapper.querySelector('.custom-select-menu') : null;
  
  // hidden select 초기화
  hiddenSelect.innerHTML = '<option value="">동아리를 선택해주세요</option>';
  
  // custom menu 초기화
  if (menu) {
    menu.innerHTML = '<div class="custom-select-option" data-value="">동아리를 선택해주세요</div>';
  }
  
  myClubs.forEach(club => {
    const id = club.clubId;
    const name = club.clubName || club.name || `클럽 ${id}`;
    
    // hidden select에 option 추가
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    hiddenSelect.appendChild(option);
    
    // custom menu에 option 추가
    if (menu) {
      const div = document.createElement('div');
      div.className = 'custom-select-option';
      div.dataset.value = id;
      div.textContent = name;
      menu.appendChild(div);
    }
  });
  
  // 커스텀 셀렉트 초기화
  if (window.initCustomSelects) {
    window.initCustomSelects();
  }
}

// 동아리 옵션 비활성화
function disableClubScope() {
  const clubRadio = document.querySelector('input[name="scope"][value="CLUB"]');
  const clubLabel = clubRadio.closest('.scope-option');
  
  clubRadio.disabled = true;
  clubLabel.style.opacity = '0.5';
  clubLabel.style.cursor = 'not-allowed';
  
  // 안내 문구 추가
  const helpText = document.createElement('div');
  helpText.className = 'scope-help-text';
  helpText.textContent = '동아리에 가입하면 사용할 수 있어요';
  helpText.style.fontSize = '13px';
  helpText.style.color = '#999';
  helpText.style.marginTop = '8px';
  
  const scopeOptions = document.querySelector('.scope-options');
  scopeOptions.appendChild(helpText);
  
  console.log('가입된 동아리가 없어 "내 동아리만" 옵션 비활성화');
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
  
  deleteBtn.addEventListener('click', () => {
    removeImageFromPreview(fileIndex);
  });
  
  previewItem.appendChild(img);
  previewItem.appendChild(deleteBtn);
  
  document.getElementById('imagePreviewContainer').appendChild(previewItem);
  
  img.src = createPreviewUrl(file);
}

// 이미지를 미리보기에서 삭제
function removeImageFromPreview(fileIndex) {
  imageFiles[fileIndex] = null;
  
  const previewItem = document.querySelector(`[data-index="${fileIndex}"]`);
  if (previewItem) {
    previewItem.remove();
  }
  
  console.log(`이미지 삭제됨. 현재 ${getValidImageCount()}개`);
}

// 유효한 이미지 개수 계산
function getValidImageCount() {
  return imageFiles.filter(file => file !== null).length;
}

// 유효한 이미지 파일들만 반환
function getValidImageFiles() {
  return imageFiles.filter(file => file !== null);
}

// 공개 범위 선택
function setupScopeEvents() {
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

// 동아리 선택
function setupClubSelectEvents() {
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

// 제목 입력
function setupTitleEvents() {
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

// 내용 입력
function setupContentEvents() {
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

// 이미지 업로드
function setupImageEvents() {
  document.getElementById('fileSelectBtn').addEventListener('click', function() {
    document.getElementById('imageInput').click();
  });
  
  document.getElementById('imageInput').addEventListener('change', async function(e) {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const validation = validateImageFile(file, {
        maxSizeBytes: 5 * 1024 * 1024
      });
      
      if (!validation.valid) {
        showToast(validation.error, 3000, 'error');
        continue;
      }
      
      const processed = await processImageFile(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8
      });
      
      addImageToPreview(processed.file);
    }
    
    this.value = '';
  });
}

// 폼 제출
function setupSubmitEvent() {
  document.getElementById('postForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const scope = document.querySelector('input[name="scope"]:checked').value;
    const clubId = scope === 'CLUB' ? document.getElementById('clubSelect').value : null;
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    const tagsInput = document.getElementById('tagsInput').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // 검증
    if (!validateTitle(title, formValidation)) {
      console.log('검증 실패: 제목');
      return;
    }
    if (!validateContent(content, formValidation)) {
      console.log('검증 실패: 내용');
      return;
    }
    if (scope === 'CLUB' && !clubId) {
      console.log('검증 실패: 동아리 선택');
      showError('clubSelect', '동아리를 선택해주세요');
      return;
    }
    
    // 로딩 상태
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '작성 중...';
    
    try {
      const postData = {
        scope: scope,
        clubId: clubId,
        title: title,
        content: content,
        tags: tags,
        images: getValidImageFiles()
      };
      
      const response = await createPost(postData);
      
      console.log('게시글 작성 완료!', response);
      
      showToast(response.message || '게시글이 작성되었습니다');
      
      navigateTo('post_list.html', 2000);
      
    } catch (error) {
      console.error('게시글 작성 실패:', error);
      
      if (error.status === 400) {
        showError('postForm', error.message || '입력 정보를 확인해주세요');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else if (error.status === 413) {
        showError('postForm', '이미지 용량이 너무 큽니다');
      } else {
        showError('postForm', '게시글 작성 중 오류가 발생했습니다');
      }
      
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// 뒤로가기
function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) {
    backBtn.onclick = () => {
      const hasContent = 
        document.getElementById('titleInput').value.trim() ||
        document.getElementById('contentInput').value.trim() ||
        imageFiles.length > 0;
      
      confirmBack('post_list.html', hasContent, '작성 중인 내용이 사라집니다.');
    };
  }
}

// 페이지 초기화
async function initPostCreatePage() {
  console.log('게시글 작성 페이지 초기화');
  
  await loadMyClubs();
  
  setupBackButton();
  setupScopeEvents();
  setupClubSelectEvents();
  setupTitleEvents();
  setupContentEvents();
  setupImageEvents();
  setupSubmitEvent();

  updateButtonState(formValidation);
  
  console.log('게시글 작성 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPostCreatePage);
} else {
  initPostCreatePage();
}

console.log('posts/create.js 로드 완료');