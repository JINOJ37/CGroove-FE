/**
 * 게시물 수정 메인 로직
 */

// URL에서 게시글 ID 가져오기
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id') || 1;

// Mock 게시글 데이터
const mockPostData = {
  1: {
    id: 1,
    title: '제목 1',
    content: '무엇을 해야할까요? 아무말입니다. 실은 많상 할말이 모앗아요. 상관읍습니다. 우리는 매벽로 조회읍과 조해서 있기떄 대 미완성과 지다릅를 이벤더니다. 또한 우리는 주변의 사밤들과 갱정에서 서로짜 지지들을 밨습니다.',
    images: [
      'https://via.placeholder.com/800x400',
      'https://via.placeholder.com/600x300'
    ], // 기존 이미지들
    authorId: 1
  }
};

// 현재 사용자 (Mock)
const currentUser = { id: 1, name: '더미 작성자 1' };

// 폼 검증 상태
const validation = {
  title: true,   // 기존 데이터 있음
  content: true  // 기존 데이터 있음
};

// 이미지 상태 (create.js와 동일)
let imageFiles = [];

// 게시글 데이터 로드
function loadPostData() {
  console.log('게시글 수정 : 기존 데이터 로드 중');
  
  const postData = mockPostData[postId];
  if (!postData) {
    console.error('게시글을 찾을 수 없습니다');
    showToast('게시글을 찾을 수 없습니다', 3000, 'error');
    setTimeout(() => navigateTo('main.html'), 2000);
    return;
  }
  
  // 권한 체크
  if (postData.authorId !== currentUser.id) {
    console.error('수정 권한이 없습니다');
    showToast('수정 권한이 없습니다', 3000, 'error');
    setTimeout(() => navigateTo(`post_detail.html?id=${postId}`), 2000);
    return;
  }
  
  // 기존 데이터 설정
  document.getElementById('titleInput').value = postData.title;
  document.getElementById('contentInput').value = postData.content;
  
  // 기존 이미지들 로드
  if (postData.images && postData.images.length > 0) {
    postData.images.forEach((imageUrl, index) => {
      addExistingImageToPreview(imageUrl, `existing_${index}`);
    });
  }
  
  console.log('✅ 게시글 데이터 로드 완료:', postData);
}

// 기존 이미지를 미리보기에 추가
function addExistingImageToPreview(imageUrl, id) {
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.id = id;
  previewItem.dataset.type = 'existing';
  
  const img = document.createElement('img');
  img.src = imageUrl;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'image-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = '이미지 삭제';
  
  deleteBtn.addEventListener('click', function() {
    removeExistingImageFromPreview(id);
  });
  
  previewItem.appendChild(img);
  previewItem.appendChild(deleteBtn);
  
  document.getElementById('imagePreviewContainer').appendChild(previewItem);
}

// 기존 이미지 삭제
function removeExistingImageFromPreview(id) {
  const previewItem = document.querySelector(`[data-id="${id}"]`);
  if (previewItem) {
    previewItem.remove();
  }
  console.log('🗑️ 기존 이미지 삭제됨:', id);
}

// 제목 입력 이벤트
function setupTitleEvents() {
  console.log('게시글 수정 : 제목 입력 처리 중');
  const titleInput = document.getElementById('titleInput');
  
  titleInput.addEventListener('blur', function() {
    validateTitle(this.value.trim(), validation);
    updateButtonState(validation);
  });
  
  titleInput.addEventListener('input', function() {
    if (this.value) {
      clearError('titleInput');
      validateTitle(this.value.trim(), validation);
    }
    updateButtonState(validation);
  });
}

// 내용 입력 이벤트
function setupContentEvents() {
  console.log('게시글 수정 : 내용 입력 처리 중');
  const contentInput = document.getElementById('contentInput');
  
  contentInput.addEventListener('blur', function() {
    validateContent(this.value.trim(), validation);
    updateButtonState(validation);
  });
  
  contentInput.addEventListener('input', function() {
    if (this.value) {
      clearError('contentInput');
      validateContent(this.value.trim(), validation);
    }
    updateButtonState(validation);
  });
}

// 이미지 업로드 이벤트 (create.js와 동일)
function setupImageEvents() {
  console.log('게시글 수정 : 이미지 업로드 처리 중');
  
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
    console.log(`✅ ${files.length}개 이미지 추가됨. 총 ${imageFiles.length}개`);
  });
}

// 이미지를 미리보기에 추가 (create.js와 동일)
function addImageToPreview(file) {
  imageFiles.push(file);
  const fileIndex = imageFiles.length - 1;
  
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.index = fileIndex;
  previewItem.dataset.type = 'new';
  
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

// 이미지를 미리보기에서 삭제 (create.js와 동일)
function removeImageFromPreview(fileIndex) {
  imageFiles[fileIndex] = null;
  
  const previewItem = document.querySelector(`[data-index="${fileIndex}"]`);
  if (previewItem) {
    previewItem.remove();
  }
  
  console.log(`🗑️ 새 이미지 삭제됨. 현재 ${getValidImageCount()}개`);
}

// 유효한 이미지 개수 계산 (create.js와 동일)
function getValidImageCount() {
  return imageFiles.filter(file => file !== null).length;
}

// 유효한 이미지 파일들만 반환 (create.js와 동일)
function getValidImageFiles() {
  return imageFiles.filter(file => file !== null);
}

// 현재 남아있는 기존 이미지들 가져오기
function getExistingImages() {
  const existingItems = document.querySelectorAll('[data-type="existing"]');
  return Array.from(existingItems).map(item => {
    return {
      id: item.dataset.id,
      url: item.querySelector('img').src
    };
  });
}

// 수정하기 버튼
function setupSubmitEvent() {
  console.log('게시글 수정 : 수정하기 버튼 처리 중');
  
  document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    
    if (!validateTitle(title, validation)) {
      console.log('검증 실패: 제목');
      showToast('제목을 확인해주세요', 3000, 'error');
      return;
    }
    if (!validateContent(content, validation)) {
      console.log('검증 실패: 내용');
      showToast('내용을 확인해주세요', 3000, 'error');
      return;
    }
    
    // 로딩 상태
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '수정 중...';
    
    // Mock 처리
    const validNewImages = getValidImageFiles();
    const existingImages = getExistingImages();
    
    console.log('수정할 데이터:', {
      postId,
      title,
      content,
      newImages: validNewImages.map(f => f.name),
      existingImages: existingImages.map(img => img.id),
      totalImages: validNewImages.length + existingImages.length
    });
    
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '수정하기';
      
      // 성공 토스트
      showToast('게시글이 수정되었습니다');
      
      // 2초 후 상세 페이지로
      setTimeout(() => {
        navigateTo(`post_detail.html?id=${postId}`);
      }, 2000);
      
      // Phase 2: 실제 API 호출
      // const formData = new FormData();
      // formData.append('title', title);
      // formData.append('content', content);
      // 
      // // 새 이미지들 추가
      // validNewImages.forEach((file, index) => {
      //   formData.append(`newImages[${index}]`, file);
      // });
      // 
      // // 기존 이미지들 ID 추가
      // existingImages.forEach((img, index) => {
      //   formData.append(`keepImages[${index}]`, img.id);
      // });
      // 
      // const result = await fetch(`/api/posts/${postId}`, {
      //   method: 'PATCH',
      //   body: formData
      // });
    }, 1000);
  });
}

// 페이지 초기화
function init() {
  console.log('게시글 수정 페이지 불러오는 중');
  
  // 데이터 로드
  loadPostData();
  
  // 이벤트 설정
  setupTitleEvents();
  setupContentEvents();
  setupImageEvents();
  setupSubmitEvent();
  
  // 초기 버튼 상태
  updateButtonState(validation);
  
  console.log('게시글 수정 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('post/edit.js 로드 완료');