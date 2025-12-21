// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { showLoading, hideLoading } from '../common/util/utils.js';
import { showToast } from '../common/util/utils.js';
import { navigateTo, confirmBack, replaceLocation } from '../common/util/utils.js';
import { clearError, updateButtonState } from '../common/util/utils.js';
import { validateTitle, validateContent } from '../common/util/validators.js';
import { getPost, updatePost } from '../common/api/post.js';
import { getMyInfo } from '../common/api/user.js';
import { processImageFile } from '../common/util/image_util.js';
import { API_BASE_URL } from '../common/api/core.js';

// ==================== 상태 관리 ====================

let postData = null;
let currentUserId = null;
let hasChanges = false;

const validation = {
  title: true,
  content: true
};

let imageFiles = [];

// ==================== API 호출 ====================

async function loadCurrentUser() {
  try {
    const response = await getMyInfo();
    currentUserId = response.data.userId;
    console.log('현재 사용자 ID:', currentUserId);
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
    currentUserId = null;
  }
}

async function loadPostData() {
  console.log('게시글 데이터 로드 중');

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId) {
    showToast('게시글을 찾을 수 없습니다', 1500);
    setTimeout(() => navigateTo('post_list.html'), 1500);
    return;
  }

  showLoading();

  try {
    const response = await getPost(postId);
    postData = response.data;

    console.log('게시글 로드 완료:', postData.postId);

    if (!checkEditPermission()) {
      return;
    }

    hideLoading();
    updateFormUI();

  } catch (error) {
    console.error('게시글 로드 실패:', error);
    hideLoading();
    handleLoadError(error);
  }
}

async function updatePostData(formData) {
  try {
    showLoading();
    const response = await updatePost(postData.postId, formData);
    hideLoading();
    
    console.log('게시글 수정 완료');
    
    showToast('게시글이 수정되었습니다', 1500);
    
    setTimeout(() => {

      const isFromDetail = document.referrer && document.referrer.includes('post_detail.html');
      
      if (isFromDetail) {
        history.back();
      } else {
        replaceLocation(`post_detail.html?id=${postData.postId}`);
      }
    }, 1500);

  } catch (error) {
    hideLoading();
    console.error('게시글 수정 실패:', error);
    handleUpdateError(error);
    throw error;
  }
}

// ==================== UI 렌더링 ====================

function updateFormUI() {
  document.getElementById('titleInput').value = postData.title;
  document.getElementById('contentInput').value = postData.content;

  loadExistingImages();

  console.log('폼 UI 업데이트 완료');
}

function loadExistingImages() {
  if (!postData.images || postData.images.length === 0) return;

  postData.images.forEach(imagePath => {
    const imageUrl = `${API_BASE_URL}${imagePath}`;
    addExistingImageToPreview(imageUrl, imagePath);
  });

  console.log('기존 이미지 로드:', postData.images.length, '개');
}

function addExistingImageToPreview(imageUrl, imagePath) {
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.path = imagePath;
  previewItem.dataset.type = 'existing';

  const img = document.createElement('img');
  img.src = imageUrl;

  const deleteBtn = createImageDeleteButton(() => {
    removeExistingImageFromPreview(imagePath);
  });

  previewItem.appendChild(img);
  previewItem.appendChild(deleteBtn);

  document.getElementById('imagePreviewContainer').appendChild(previewItem);
}

function addImageToPreview(file, previewUrl) {
  imageFiles.push(file);
  const fileIndex = imageFiles.length - 1;

  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  previewItem.dataset.index = fileIndex;
  previewItem.dataset.type = 'new';

  const img = document.createElement('img');
  img.src = previewUrl;

  const deleteBtn = createImageDeleteButton(() => {
    removeImageFromPreview(fileIndex);
  });

  previewItem.appendChild(img);
  previewItem.appendChild(deleteBtn);

  document.getElementById('imagePreviewContainer').appendChild(previewItem);
}

function createImageDeleteButton(onClickHandler) {
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'image-delete-btn';
  deleteBtn.textContent = '×';
  deleteBtn.title = '이미지 삭제';
  deleteBtn.addEventListener('click', onClickHandler);
  return deleteBtn;
}

function removeExistingImageFromPreview(imagePath) {
  const previewItem = document.querySelector(`[data-path="${imagePath}"]`);
  if (previewItem) {
    previewItem.remove();
    console.log('기존 이미지 삭제:', imagePath);
  }

  checkForChanges();
}

function removeImageFromPreview(fileIndex) {
  imageFiles[fileIndex] = null;

  const previewItem = document.querySelector(`[data-index="${fileIndex}"]`);
  if (previewItem) {
    previewItem.remove();
    console.log('새 이미지 삭제 (현재:', getValidImageCount(), '개)');
  }

  checkForChanges();
}

// ==================== 검증 ====================

function checkEditPermission() {
  if (Number(postData.authorId) !== Number(currentUserId)) {
    console.error('수정 권한이 없습니다');
    showToast('수정 권한이 없습니다', 1500);

    setTimeout(() => {
      navigateTo(`post_detail.html?id=${postData.postId}`);
    }, 1500);

    return false;
  }

  return true;
}

function validateForm(title, content) {
  if (!validateTitle(title, validation)) {
    showToast('제목을 확인해주세요', 2000, 'error');
    return false;
  }

  if (!validateContent(content, validation)) {
    showToast('내용을 확인해주세요', 2000, 'error');
    return false;
  }

  return true;
}

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
  const imagesChanged = checkImageChanges();

  hasChanges =
    (titleChanged || contentChanged || imagesChanged) &&
    validation.title &&
    validation.content;

  updateButtonState(validation, hasChanges);
}

function checkImageChanges() {
  const currentExistingPaths = getExistingImagePaths();
  const originalImagePaths = postData.images || [];

  const existingImagesChanged =
    currentExistingPaths.length !== originalImagePaths.length ||
    !currentExistingPaths.every(path => originalImagePaths.includes(path));

  const newImagesAdded = getValidImageCount() > 0;

  return existingImagesChanged || newImagesAdded;
}

// ==================== 유틸리티 ====================

function getValidImageCount() {
  return imageFiles.filter(file => file !== null).length;
}

function getValidImageFiles() {
  return imageFiles.filter(file => file !== null);
}

function getExistingImagePaths() {
  const existingItems = document.querySelectorAll('[data-type="existing"]');
  return Array.from(existingItems).map(item => item.dataset.path);
}

function createUpdateFormData(title, content) {
  const formData = new FormData();

  const imagesChanged = checkImageChanges();
  const keepImagePaths = imagesChanged ? getExistingImagePaths() : [];

  // JSON 데이터를 Blob으로 변환하여 "request" 파트로 추가
  const requestData = {
    title: title,
    content: content,
    tags: null,  // tags 기능이 구현되면 여기에 추가
    keepImages: keepImagePaths.length > 0 ? keepImagePaths : []
  };
  formData.append('request', new Blob([JSON.stringify(requestData)], {
    type: 'application/json'
  }));

  if (imagesChanged) {
    if (keepImagePaths.length > 0) {
      console.log('유지할 이미지:', keepImagePaths.length, '개');
      console.log('경로:', keepImagePaths);
    } else {
      console.log('모든 기존 이미지 삭제');
    }
  }

  // 새 이미지 파일들은 "images" 파트로 추가
  const validNewImages = getValidImageFiles();
  if (validNewImages.length > 0) {
    validNewImages.forEach(file => {
      formData.append('images', file);
    });
    console.log('새 이미지:', validNewImages.length, '개');
  }

  return formData;
}

// ==================== 에러 처리 ====================

function handleLoadError(error) {
  if (error.status === 404) {
    showToast('존재하지 않는 게시글입니다', 1500);
  } else if (error.status === 401) {
    showToast('로그인이 필요합니다', 1500);
  } else {
    showToast('게시글을 불러오는데 실패했습니다', 1500);
  }

  setTimeout(() => navigateTo('post_list.html'), 1500);
}

function handleUpdateError(error) {
  if (error.status === 403) {
    showToast('수정 권한이 없습니다', 2000, 'error');
  } else if (error.status === 401) {
    showToast('로그인이 필요합니다', 2000, 'error');
  } else if (error.status === 413) {
    showToast('이미지 용량이 너무 큽니다 (최대 20MB)', 2000, 'error');
  } else {
    showToast('게시글 수정 중 오류가 발생했습니다', 2000, 'error');
  }
}

// ==================== 이벤트 핸들러 ====================

function setupBackButton() {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const fallback = postData?.postId
        ? `post_detail.html?id=${postData.postId}`
        : 'post_list.html';
      confirmBack(fallback, hasChanges, '수정 사항이 저장되지 않습니다.');
    });
  }
}

function setupTitleEvents() {
  const titleInput = document.getElementById('titleInput');

  titleInput.addEventListener('blur', function() {
    validateTitle(this.value.trim(), validation);
    checkForChanges();
  });

  titleInput.addEventListener('input', function() {
    if (this.value) {
      clearError('titleInput');
      validateTitle(this.value.trim(), validation);
    }
    checkForChanges();
  });

  console.log('제목 입력 이벤트 등록 완료');
}

function setupContentEvents() {
  const contentInput = document.getElementById('contentInput');

  contentInput.addEventListener('blur', function() {
    validateContent(this.value.trim(), validation);
    checkForChanges();
  });

  contentInput.addEventListener('input', function() {
    if (this.value) {
      clearError('contentInput');
      validateContent(this.value.trim(), validation);
    }
    checkForChanges();
  });

  console.log('내용 입력 이벤트 등록 완료');
}

function setupImageEvents() {
  const fileSelectBtn = document.getElementById('fileSelectBtn');
  const imageInput = document.getElementById('imageInput');

  fileSelectBtn.addEventListener('click', function() {
    imageInput.click();
  });

  imageInput.addEventListener('change', async function(e) {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (!file || !file.type.startsWith('image/')) continue;

      try {
        const { file: processedFile, previewUrl } = await processImageFile(file, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.8,
          maxSizeBytes: 2 * 1024 * 1024
        });

        addImageToPreview(processedFile, previewUrl);
        console.log('새 이미지 추가:', processedFile.name || 'blob');
      } catch (err) {
        console.error('이미지 처리 중 오류:', err);
        showToast('이미지 처리 중 오류가 발생했습니다', 2000, 'error');
      }
    }

    this.value = '';

    console.log('현재 새 이미지 개수:', getValidImageCount());
    checkForChanges();
  });

  console.log('이미지 업로드 이벤트 등록 완료');
}

function setupSubmitEvent() {
  const editForm = document.getElementById('editForm');

  editForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!hasChanges) {
      showToast('변경된 내용이 없습니다', 2000);
      return;
    }

    const title = document.getElementById('titleInput').value.trim();
    const content = document.getElementById('contentInput').value.trim();

    if (!validateForm(title, content)) {
      return;
    }

    await handleUpdatePost(e.target, title, content);
  });

  console.log('폼 제출 이벤트 등록 완료');
}

async function handleUpdatePost(form, title, content) {
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;

  btn.disabled = true;
  btn.textContent = '수정 중...';

  try {
    const formData = createUpdateFormData(title, content);
    await updatePostData(formData);

  } catch (error) {
    btn.disabled = false;
    btn.textContent = originalText;
    checkForChanges();
  }
}

// ==================== 초기화 ====================

async function init() {
  console.log('게시글 수정 페이지 초기화');

  await initHeader();

  await loadCurrentUser();
  await loadPostData();

  setupBackButton();
  setupTitleEvents();
  setupContentEvents();
  setupImageEvents();
  setupSubmitEvent();

  hasChanges = false;
  updateButtonState(validation, hasChanges);

  console.log('게시글 수정 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/edit.js 로드 완료');