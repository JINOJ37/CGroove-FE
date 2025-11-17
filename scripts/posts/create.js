// 게시물 작성 메인 로직

// 폼 검증 상태
const formValidation = {
  title: false,
  content: false
};

// 제목 입력 이벤트
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

// 내용 입력 이벤트
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

// 이미지 업로드 이벤트
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

// '완료' 버튼 이벤트
function setupSubmitEvent() {
  console.log('게시글 작성 시도');
  
  document.getElementById('postForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    
    if (!validateTitle(title, formValidation)) {
      console.log('검증 실패: 제목');
      return;
    }
    if (!validateContent(content, formValidation)) {
      console.log('검증 실패: 내용');
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
        scope: 'GLOBAL',  // 기본값 (나중에 선택 옵션 추가 가능)
        clubId: null,     // 개인 게시글 (나중에 동아리 선택 추가 가능)
        title: title,
        content: content,
        tags: [],         // 태그 기능 (나중에 추가 가능)
        images: getValidImageFiles()  // 업로드된 이미지들
      };
      
      const response = await createPost(postData);
      
      console.log('게시글 작성 완료!', response);
      
      showToast(response.message || '게시글이 작성되었습니다');
      
      navigateTo('main.html', 2000);
      
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
      // 로딩 종료
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// 게시글 작성
async function createPost(postData) {
  console.log('📝 게시글 작성 API 호출');
  
  // FormData 구성
  const formData = new FormData();
  
  formData.append('scope', postData.scope || 'PUBLIC');  // 기본값: PUBLIC
  
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

// 페이지 초기화
function init() {
  console.log('게시글 작성 페이지 불러오는 중');
  
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

console.log('post/create.js 로드 완료');