// 게시물 작성 메인 로직

//=========상태 관리=========
let myClubs = [];

// 폼 검증 상태
const formValidation = {
  scope: true,    // 기본값 GLOBAL이라 true
  club: true,     // GLOBAL일 때는 club 선택 불필요
  title: false,
  content: false
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
  
  // 라디오 버튼 비활성화
  clubRadio.disabled = true;
  
  // 스타일 변경
  clubLabel.style.opacity = '0.5';
  clubLabel.style.cursor = 'not-allowed';
  
  // 안내 문구 추가
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
  console.log('게시글 작성 : 공개 범위 처리 중');
  
  const scopeRadios = document.querySelectorAll('input[name="scope"]');
  const clubSelectGroup = document.getElementById('clubSelectGroup');
  const clubSelect = document.getElementById('clubSelect');
  
  scopeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const scope = e.target.value;
      
      if (scope === 'CLUB') {
        // 동아리가 없는데 선택하려고 하면 (혹시 몰라 추가 방어)
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
  console.log('게시글 작성 : 동아리 선택 처리 중');
  
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

//=========제목 입력 이벤트=========
function setupTitleEvents() {
  console.log('게시글 작성 : 제목 처리 중');
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
  console.log('게시글 작성 : 내용 처리 중');
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

//=========이미지 업로드 이벤트=========
let imageFiles = [];

function setupImageEvents() {
  console.log('게시글 작성 : 이미지 업로드 처리 중');
  
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
  // 파일을 배열에 추가
  imageFiles.push(file);
  const fileIndex = imageFiles.length - 1;
  
  // 미리보기 요소 생성
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.index = fileIndex;
  
  const img = document.createElement('img');
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'image-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = '이미지 삭제';
  
  // 삭제 버튼 이벤트
  deleteBtn.addEventListener('click', function() {
    removeImageFromPreview(fileIndex);
  });
  
  previewItem.appendChild(img);
  previewItem.appendChild(deleteBtn);
  
  // 컨테이너에 추가
  document.getElementById('imagePreviewContainer').appendChild(previewItem);
  
  // 파일 읽기
  const reader = new FileReader();
  reader.onload = function(e) {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// 이미지를 미리보기에서 삭제
function removeImageFromPreview(fileIndex) {
  // 배열에서 제거 (null로 표시)
  imageFiles[fileIndex] = null;
  
  // DOM에서 제거
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
  console.log('게시글 작성 시도');
  
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
      // API 호출
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

//=========게시글 작성 API=========
async function createPost(postData) {
  console.log('게시글 작성 API 호출');
  
  // FormData 구성
  const formData = new FormData();
  
  formData.append('scope', postData.scope);
  
  if (postData.clubId) {
    formData.append('clubId', postData.clubId);
  }
  
  formData.append('title', postData.title);
  formData.append('content', postData.content);
  
  // 태그 추가 (있을 경우)
  if (postData.tags && postData.tags.length > 0) {
    postData.tags.forEach(tag => {
      formData.append('tags', tag);
    });
  }
  
  // 이미지 추가 (여러 개)
  if (postData.images && postData.images.length > 0) {
    postData.images.forEach(imageFile => {
      formData.append('images', imageFile);
    });
    console.log(`📷 이미지 ${postData.images.length}개 포함`);
  } else {
    console.log('📷 이미지 없음');
  }
  
  // API 호출
  return await apiRequest('/posts', {
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
      
      confirmBack('post_list.html', hasContent, '작성 중인 내용이 사라집니다.');
    };
  }
}

//=========페이지 초기화=========
async function init() {
  console.log('게시글 작성 페이지 불러오는 중');
  
  await loadMyClubs();
  
  setupBackButton();
  setupScopeEvents();
  setupClubSelectEvents();
  setupTitleEvents();
  setupContentEvents();
  setupImageEvents();
  setupSubmitEvent();

  updateButtonState(formValidation);
  
  console.log('게시글 작성 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/write.js 로드 완료');