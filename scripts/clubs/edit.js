// ==================== Import ====================
import { getClub, updateClub, deleteClub, deleteClubImage } from '../common/api/club.js';
import { API_BASE_URL } from '../common/api/core.js';
import { showToast, showLoading, hideLoading, confirmBack, showModal } from '../common/util/utils.js';
import { parseTags } from '../common/util/format.js';
import { initHeader } from '../common/component/header.js';
import { processImageFile, getImageUrl } from '../common/util/image_util.js';

// ==================== 상태 관리 ====================
let clubId = null;
let originalData = null;
let newImageFile = null;
let hasChanges = false;

// ==================== 초기화 & 데이터 로드 ====================
async function init() {
  await initHeader();
  
  const urlParams = new URLSearchParams(window.location.search);
  clubId = urlParams.get('id');

  if (!clubId) {
    showToast('잘못된 접근입니다', 2000, 'error');
    setTimeout(() => window.history.back(), 1500);
    return;
  }

  setupEventListeners();
  await loadClubData();
}

async function loadClubData() {
  showLoading();
  try {
    const response = await getClub(clubId);
    originalData = response.data;
    populateForm(originalData);
  } catch (error) {
    console.error('동아리 정보 로드 실패:', error);
    showToast('동아리 정보를 불러오는데 실패했습니다', 2000, 'error');
    setTimeout(() => window.history.back(), 1500);
  } finally {
    hideLoading();
  }
}

function populateForm(data) {
  // 텍스트 필드
  document.getElementById('clubNameInput').value = data.clubName || '';
  document.getElementById('introInput').value = data.intro || '';
  document.getElementById('descriptionInput').value = data.description || '';
  document.getElementById('locationInput').value = data.locationName || '';
  document.getElementById('tagsInput').value = (data.tags || []).join(', ');

  // 라디오 버튼
  const typeRadios = document.getElementsByName('clubType');
  for (const radio of typeRadios) {
    if (radio.value === data.clubType) {
      radio.checked = true;
      break;
    }
  }

  // 이미지 미리보기 및 삭제 버튼 상태
  updateImageUI(data.clubImage);
}

function updateImageUI(imagePath) {
  const previewDiv = document.getElementById('clubImagePreview');
  const removeBtn = document.getElementById('removeImageBtn');

  if (imagePath || newImageFile) {
    // 새 파일이 있으면 미리보기 URL 사용, 아니면 서버 URL 사용
    let src = '';
    if (newImageFile) {
        // 이미 handleImageChange에서 처리했지만, 초기화 로직용
        // (실제로는 handleImageChange에서 DOM을 직접 수정하므로 여기서는 서버 이미지만 처리해도 무방)
    } else {
        src = getImageUrl(imagePath);
        previewDiv.innerHTML = `
          <img src="${src}" 
               alt="동아리 이미지" 
               style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
        `;
    }
    removeBtn.classList.add('show');
  } else {
    previewDiv.innerHTML = '<span class="profile-image-empty">+</span>';
    removeBtn.classList.remove('show');
  }
}

function checkForChanges() {
  if (!originalData) {
    hasChanges = false;
    return;
  }

  const nameChanged = document.getElementById('clubNameInput').value.trim() !== originalData.clubName;
  const introChanged = document.getElementById('introInput').value.trim() !== originalData.intro;
  const descChanged = document.getElementById('descriptionInput').value.trim() !== originalData.description;
  const locChanged = document.getElementById('locationInput').value.trim() !== originalData.locationName;
  const imageChanged = newImageFile !== null;

  hasChanges = nameChanged || introChanged || descChanged || locChanged || imageChanged;
}

// ==================== 이벤트 핸들러 ====================
function setupEventListeners() {
  // 뒤로가기
  document.getElementById('backBtn').addEventListener('click', () => {
    checkForChanges();
    confirmBack(`club_detail.html?id=${clubId}`, hasChanges, '수정 중인 내용이 저장되지 않습니다.');
  });

  // 입력 감지
  ['clubNameInput', 'introInput', 'descriptionInput', 'locationInput', 'tagsInput'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', checkForChanges);
  });
  document.querySelectorAll('input[name="clubType"]').forEach(radio => {
    radio.addEventListener('change', checkForChanges);
  });

  // 이미지 관련 이벤트
  setupImageEvents();

  // 폼 제출
  document.getElementById('clubEditForm').addEventListener('submit', handleSubmit);

  // 동아리 삭제 버튼
  const deleteBtn = document.getElementById('deleteClubBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', handleDeleteClub);
  }
}

function setupImageEvents() {
  const container = document.getElementById('clubImageContainer');
  const fileInput = document.getElementById('clubImageUpload');
  const removeBtn = document.getElementById('removeImageBtn');

  // 1. 클릭 -> 파일 선택
  container.addEventListener('click', (e) => {
    if (e.target.closest('#removeImageBtn')) return;
    fileInput.click();
  });

  // 2. 파일 변경
  fileInput.addEventListener('change', handleImageChange);

  // 3. 삭제 버튼 (즉시 삭제 로직 - 프로필 방식)
  if (removeBtn) {
    removeBtn.addEventListener('click', handleImageDelete);
  }
}

// 이미지 선택 처리
async function handleImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일만 업로드 가능합니다', 2000, 'error');
    return;
  }

  try {
    const { file: processedFile, previewUrl } = await processImageFile(file, {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      maxSizeBytes: 2 * 1024 * 1024
    });

    newImageFile = processedFile;
    
    // UI 업데이트
    const previewDiv = document.getElementById('clubImagePreview');
    previewDiv.innerHTML = `<img src="${previewUrl}" alt="미리보기" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    
    document.getElementById('removeImageBtn').classList.add('show');
    showToast('이미지가 선택되었습니다');
    checkForChanges();

  } catch (err) {
    console.error('이미지 처리 실패:', err);
    showToast('이미지 처리 중 오류가 발생했습니다', 2000, 'error');
  } finally {
    e.target.value = ''; // 같은 파일 재선택 허용
  }
}

// ✅ [프로필 방식] 이미지 즉시 삭제 처리
async function handleImageDelete(e) {
  e.stopPropagation();

  showModal(
    '이미지 삭제', 
    '동아리 대표 이미지를 삭제하시겠습니까?', 
    async () => {
        // 1. UI 초기화
        const previewDiv = document.getElementById('clubImagePreview');
        const removeBtn = document.getElementById('removeImageBtn');
        
        previewDiv.innerHTML = '<span class="profile-image-empty">+</span>';
        removeBtn.classList.remove('show');
        newImageFile = null;

        // 2. API 호출 (서버에서 즉시 삭제)
        // 만약 서버에 이미지가 없는 상태(기본 이미지)라면 API 호출 불필요할 수도 있음
        if (originalData.clubImage) {
            try {
                await deleteClubImage(clubId);
                originalData.clubImage = null; // 로컬 데이터 동기화
                showToast('이미지가 삭제되었습니다');
            } catch (error) {
                console.error('이미지 삭제 실패:', error);
                // 에러나면 다시 복구하거나 알림
                showToast('이미지 삭제 중 오류가 발생했습니다', 2000, 'error');
                // (선택사항) UI 원복 로직 필요 시 추가
            }
        } else {
            // 아직 저장하지 않은 새 이미지를 지운 경우
            showToast('이미지 선택이 취소되었습니다');
        }
        
        checkForChanges();
    }
  );
}

// 폼 제출 (정보 수정)
async function handleSubmit(e) {
  e.preventDefault();

  const clubName = document.getElementById('clubNameInput').value.trim();
  const intro = document.getElementById('introInput').value.trim();
  const description = document.getElementById('descriptionInput').value.trim();
  const locationName = document.getElementById('locationInput').value.trim();
  const clubType = document.querySelector('input[name="clubType"]:checked').value;
  const tagsStr = document.getElementById('tagsInput').value.trim();

  if (!clubName || !intro || !description || !locationName) {
    showToast('모든 필수 항목을 입력해주세요', 2000, 'error');
    return;
  }

  const formData = new FormData();

  const tags = parseTags(tagsStr);

  // JSON 데이터를 Blob으로 변환하여 "request" 파트로 추가
  const requestData = {
    clubName: clubName,
    intro: intro,
    description: description,
    locationName: locationName,
    clubType: clubType,
    tags: tags.length > 0 ? tags : null
  };
  formData.append('request', new Blob([JSON.stringify(requestData)], {
    type: 'application/json'
  }));

  // 새 이미지가 있을 때만 "clubImage" 파트로 추가
  if (newImageFile) {
    formData.append('clubImage', newImageFile);
  }

  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '수정 중...';

  try {
    showLoading();
    await updateClub(clubId, formData);
    hideLoading();
    
    showToast('동아리 정보가 수정되었습니다');
    
    setTimeout(() => {
      if (document.referrer && document.referrer.includes('club_detail.html')) {
          history.back(); 
      } else {
          window.location.replace(`club_detail.html?id=${clubId}`);
      }
    }, 1000);

  } catch (error) {
    hideLoading();
    console.error('수정 실패:', error);
    
    if (error.status === 409) {
      showToast('이미 존재하는 동아리 이름입니다', 2000, 'error');
    } else if (error.status === 413) {
      showToast('이미지 용량이 너무 큽니다 (최대 2MB)', 2000, 'error');
    } else {
      showToast('수정 중 오류가 발생했습니다', 2000, 'error');
    }
    
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// 동아리 삭제 (전체)
async function handleDeleteClub() {
  showModal(
    '동아리 삭제',
    '정말로 동아리를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
    async () => {
      try {
        showLoading();
        await deleteClub(clubId);
        hideLoading();
        
        showToast('동아리가 삭제되었습니다');
        setTimeout(() => window.location.replace('club_list.html'), 1000);
        
      } catch (error) {
        hideLoading();
        console.error('삭제 실패:', error);
        if (error.status === 403) {
          showToast('삭제 권한이 없습니다', 2000, 'error');
        } else {
          showToast('삭제 중 오류가 발생했습니다', 2000, 'error');
        }
      }
    }
  );
}

// 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}