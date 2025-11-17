/**
 * 게시물 수정 메인 로직
 */

// 상태
let postData = null;
let currentUserId = null;

// 폼 검증 상태
const validation = {
  title: true,
  content: true
};

// 이미지 상태
let imageFiles = [];

// ✅ 변경 여부 추적
let hasChanges = false;

/**
 * 현재 사용자 정보 가져오기
 */
async function loadCurrentUser() {
  try {
    const response = await getMyInfo();
    currentUserId = response.data.userId;
    console.log('✅ 현재 사용자 ID:', currentUserId);
  } catch (error) {
    console.error('❌ 사용자 정보 로드 실패:', error);
    currentUserId = null;
  }
}

/**
 * 게시글 데이터 로드
 */
async function loadPostData() {
  console.log('📄 게시글 수정 : 기존 데이터 로드 중');
  
  // URL에서 postId 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  
  if (!postId) {
    showToast('게시글을 찾을 수 없습니다');
    setTimeout(() => navigateTo('main.html'), 1500);
    return;
  }
  
  try {
    const response = await getPost(postId);
    postData = response.data;
    
    console.log('✅ 게시글 데이터 로드:', postData);
    
    // 권한 체크
    if (Number(postData.authorId) !== Number(currentUserId)) {
      console.error('❌ 수정 권한이 없습니다');
      showToast('수정 권한이 없습니다');
      setTimeout(() => navigateTo(`post_detail.html?id=${postId}`), 1500);
      return;
    }
    
    // 기존 데이터 설정
    document.getElementById('titleInput').value = postData.title;
    document.getElementById('contentInput').value = postData.content;
    
    // 기존 이미지들 로드
    if (postData.images && postData.images.length > 0) {
      postData.images.forEach((imagePath, index) => {
        const imageUrl = `${API_BASE_URL}${imagePath}`;
        addExistingImageToPreview(imageUrl, imagePath);
      });
    }
    
    console.log('✅ 게시글 UI 업데이트 완료');
    
  } catch (error) {
    console.error('❌ 게시글 로드 실패:', error);
    
    if (error.status === 404) {
      showToast('존재하지 않는 게시글입니다');
    } else if (error.status === 401) {
      showToast('로그인이 필요합니다');
    } else {
      showToast('게시글을 불러오는데 실패했습니다');
    }
    
    setTimeout(() => navigateTo('main.html'), 1500);
  }
}

/**
 * ✅ 변경 여부 체크 함수
 */
function checkForChanges() {
  if (!postData) {
    hasChanges = false;
    updateButtonState(validation, hasChanges);
    return;
  }
  
  const currentTitle = document.getElementById('titleInput').value.trim();
  const currentContent = document.getElementById('contentInput').value.trim();
  
  const titleChanged = currentTitle !== postData.title;
  const contentChanged = currentContent !== postData.content;
  
  // 기존 이미지 변경 여부
  const currentExistingPaths = getExistingImagePaths();
  const originalImagePaths = postData.images || [];
  
  const existingImagesChanged = 
    currentExistingPaths.length !== originalImagePaths.length ||
    !currentExistingPaths.every(path => originalImagePaths.includes(path));
  
  // 새 이미지 추가 여부
  const newImagesAdded = getValidImageCount() > 0;
  
  hasChanges = (titleChanged || contentChanged || existingImagesChanged || newImagesAdded) && 
               validation.title && 
               validation.content;
  
  console.log('변경 감지:', {
    titleChanged,
    contentChanged,
    existingImagesChanged,
    newImagesAdded,
    hasChanges,
    titleValid: validation.title,
    contentValid: validation.content
  });
  
  updateButtonState(validation, hasChanges);
}

/**
 * 기존 이미지를 미리보기에 추가
 */
function addExistingImageToPreview(imageUrl, imagePath) {
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.path = imagePath;
  previewItem.dataset.type = 'existing';
  
  const img = document.createElement('img');
  img.src = imageUrl;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'image-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = '이미지 삭제';
  
  deleteBtn.addEventListener('click', function() {
    removeExistingImageFromPreview(imagePath);
  });
  
  previewItem.appendChild(img);
  previewItem.appendChild(deleteBtn);
  
  document.getElementById('imagePreviewContainer').appendChild(previewItem);
}

/**
 * 기존 이미지 삭제
 */
function removeExistingImageFromPreview(imagePath) {
  const previewItem = document.querySelector(`[data-path="${imagePath}"]`);
  if (previewItem) {
    previewItem.remove();
  }
  console.log('🗑️ 기존 이미지 삭제됨:', imagePath);
  
  // ✅ 변경 감지
  checkForChanges();
}

/**
 * 제목 입력 이벤트
 */
function setupTitleEvents() {
  console.log('게시글 수정 : 제목 입력 처리 중');
  const titleInput = document.getElementById('titleInput');
  
  titleInput.addEventListener('blur', function() {
    validateTitle(this.value.trim(), validation);
    checkForChanges();  // ✅ 변경 감지
  });
  
  titleInput.addEventListener('input', function() {
    if (this.value) {
      clearError('titleInput');
      validateTitle(this.value.trim(), validation);
    }
    checkForChanges();  // ✅ 변경 감지
  });
}

/**
 * 내용 입력 이벤트
 */
function setupContentEvents() {
  console.log('게시글 수정 : 내용 입력 처리 중');
  const contentInput = document.getElementById('contentInput');
  
  contentInput.addEventListener('blur', function() {
    validateContent(this.value.trim(), validation);
    checkForChanges();  // ✅ 변경 감지
  });
  
  contentInput.addEventListener('input', function() {
    if (this.value) {
      clearError('contentInput');
      validateContent(this.value.trim(), validation);
    }
    checkForChanges();  // ✅ 변경 감지
  });
}

/**
 * 이미지 업로드 이벤트
 */
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
    
    // ✅ 변경 감지
    checkForChanges();
  });
}

/**
 * 이미지를 미리보기에 추가
 */
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

/**
 * 이미지를 미리보기에서 삭제
 */
function removeImageFromPreview(fileIndex) {
  imageFiles[fileIndex] = null;
  
  const previewItem = document.querySelector(`[data-index="${fileIndex}"]`);
  if (previewItem) {
    previewItem.remove();
  }
  
  console.log(`🗑️ 새 이미지 삭제됨. 현재 ${getValidImageCount()}개`);
  
  // ✅ 변경 감지
  checkForChanges();
}

/**
 * 유효한 이미지 개수 계산
 */
function getValidImageCount() {
  return imageFiles.filter(file => file !== null).length;
}

/**
 * 유효한 이미지 파일들만 반환
 */
function getValidImageFiles() {
  return imageFiles.filter(file => file !== null);
}

/**
 * 현재 남아있는 기존 이미지들 가져오기
 */
function getExistingImagePaths() {
  const existingItems = document.querySelectorAll('[data-type="existing"]');
  return Array.from(existingItems).map(item => item.dataset.path);
}

/**
 * 수정하기 버튼
 */
function setupSubmitEvent() {
  console.log('게시글 수정 : 수정하기 버튼 처리 중');
  
  document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // ✅ 변경 없으면 제출 불가
    if (!hasChanges) {
      showToast('변경된 내용이 없습니다');
      return;
    }
    
    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();
    
    if (!validateTitle(title, validation)) {
      console.log('검증 실패: 제목');
      showToast('제목을 확인해주세요');
      return;
    }
    if (!validateContent(content, validation)) {
      console.log('검증 실패: 내용');
      showToast('내용을 확인해주세요');
      return;
    }
    
    // 로딩 상태
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '수정 중...';
    
    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      
      // ✅ 새 이미지가 있을 때만 추가
      const validNewImages = getValidImageFiles();
      if (validNewImages.length > 0) {
        validNewImages.forEach(file => {
          formData.append('images', file);
        });
        console.log('📷 새 이미지 추가:', validNewImages.length, '개');
      } else {
        console.log('📷 새 이미지 없음');
      }
      
      console.log('수정 요청 데이터:', {
        postId: postData.postId,
        title,
        content,
        newImagesCount: validNewImages.length,
        existingImagesCount: getExistingImagePaths().length
      });
      
      // API 호출
      const response = await updatePost(postData.postId, formData);
      
      console.log('✅ 게시글 수정 완료:', response);
      
      showToast('게시글이 수정되었습니다');
      
      setTimeout(() => {
        navigateTo(`post_detail.html?id=${postData.postId}`);
      }, 1500);
      
    } catch (error) {
      console.error('❌ 게시글 수정 실패:', error);
      
      btn.disabled = false;
      btn.textContent = originalText;
      
      if (error.status === 403) {
        showToast('수정 권한이 없습니다');
      } else if (error.status === 401) {
        showToast('로그인이 필요합니다');
      } else {
        showToast('게시글 수정 중 오류가 발생했습니다');
      }
      
      // ✅ 에러 후 변경 감지 재확인
      checkForChanges();
    }
  });
}

/**
 * 게시글 수정
 * @param {number} postId - 게시글 ID
 * @param {FormData} formData - 수정할 데이터 (title, content, images 등)
 */
async function updatePost(postId, formData) {
  console.log('✏️ 게시글 수정 API 호출', postId);
  
  return await apiRequest(`/posts/${postId}`, {
    method: 'PATCH',
    body: formData,
    isFormData: true  // ✅ FormData 표시
  });
}

/**
 * 페이지 초기화
 */
async function init() {
  console.log('게시글 수정 페이지 불러오는 중');
  
  // 사용자 정보 로드
  await loadCurrentUser();
  
  // 게시글 데이터 로드
  await loadPostData();
  
  // 이벤트 설정
  setupTitleEvents();
  setupContentEvents();
  setupImageEvents();
  setupSubmitEvent();
  
  // ✅ 초기 버튼 상태
  hasChanges = false;
  updateButtonState(validation, hasChanges);
  
  console.log('게시글 수정 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('post/edit.js 로드 완료');