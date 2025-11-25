//DOM 응용

//=========에러 메세지=========
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) {
    console.error(`showError: ${inputId} 요소를 찾을 수 없습니다`);
    return;
  }
  
  const helperText = input.nextElementSibling;
  
  input.style.borderColor = '#D32F2F';
  input.classList.add('error');
  
  if (helperText && helperText.classList.contains('helper-text')) {
    helperText.textContent = message;
    helperText.classList.add('error');
    helperText.style.display = 'block';
    helperText.style.color = '#D32F2F';
  }
  
  console.log(`❌ 에러 표시: ${inputId} - ${message}`);
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const helperText = input.nextElementSibling;
  
  input.style.borderColor = '#e0e0e0';
  if (helperText) {
    helperText.style.display = 'none';
    helperText.classList.remove('error');
  }
}

//=========버튼=========
function updateButtonState(formValidation, isValid = true) {
  const submitBtn = document.querySelector('button[type="submit"]');
  if (!submitBtn) return;

  const allValid = Object.values(formValidation).every(v => v === true) && isValid;
  
  if (allValid) {
    submitBtn.disabled = false;
    submitBtn.style.background = '#1A1A1A'; // 검정!
    submitBtn.style.cursor = 'pointer';
  } else {
    submitBtn.disabled = true;
    submitBtn.style.background = '#999'; // 회색!
    submitBtn.style.cursor = 'not-allowed';
  }
}

//=========로딩 상태=========
function setLoadingState(isLoading, text = '처리중...') {
  const submitBtn = document.querySelector('button[type="submit"]');
  if (!submitBtn) return;
  
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.textContent = text;
    submitBtn.style.background = '#999'; // 회색!
    submitBtn.style.cursor = 'wait';
  } else {
    submitBtn.style.background = '';
    submitBtn.style.cursor = '';
    submitBtn.textContent = text;
    submitBtn.disabled = false;
  }
}

function showLoading(message = '로딩 중...') {
  const loading = document.getElementById('globalLoading');
  if (!loading) {
    console.warn('globalLoading 요소를 찾을 수 없습니다');
    return;
  }
  
  const loadingText = loading.querySelector('.loading-text');
  if (loadingText) {
    loadingText.textContent = message;
  }
  
  loading.classList.add('active');
}

function hideLoading() {
  const loading = document.getElementById('globalLoading');
  if (loading) {
    loading.classList.remove('active');
  }
}

//=========토스트 메시지&모달&포커싱=========
function showToast(message, duration = 3000, type = 'success') {
  const existingToast = document.getElementById('toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '16px 24px',
    borderRadius: '0', // 직각!
    fontFamily: 'KoreaInstituteOfMachineryAndMaterials, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '15px',
    fontWeight: '500',
    color: '#fff',
    zIndex: '10000',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '200px',
    textAlign: 'center'
  });
  
  // 타입별 색상
  const colors = {
    success: '#1A1A1A', // 검정!
    error: '#D32F2F',   // 빨강!
    info: '#555'
  };
  toast.style.background = colors[type] || colors.success;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

function showModal(title, message, onConfirm, onCancel) {
  const existingModal = document.getElementById('customModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'customModal';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 0;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  `;
  
  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = `
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 12px 0;
    text-align: center;
  `;
  
  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.style.cssText = `
    font-size: 15px;
    color: #666;
    margin: 0 0 24px 0;
    text-align: center;
    line-height: 1.5;
  `;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 12px;
  `;
  
  // ✅ 취소 버튼 - .btn-secondary 클래스 사용
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '취소';
  cancelBtn.className = 'btn btn-secondary'; // 클래스로 변경!
  cancelBtn.style.cssText = `
    flex: 1;
    margin: 0;
  `; // 레이아웃만 인라인
  cancelBtn.onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };
  
  // ✅ 확인 버튼 - .btn-primary 클래스 사용
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '확인';
  confirmBtn.className = 'btn btn-primary'; // 클래스로 변경!
  confirmBtn.style.cssText = `
    flex: 1;
    margin: 0;
  `; // 레이아웃만 인라인
  confirmBtn.onclick = () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  };
  
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);
  
  modal.appendChild(titleEl);
  modal.appendChild(messageEl);
  modal.appendChild(buttonContainer);
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (onCancel) onCancel();
    }
  });
}

function focusElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
}

//=========페이지 이동=========
function navigateTo(url, delay = 0) {
  setTimeout(() => {
    window.location.href = url;
  }, delay);
}

function replaceLocation(url) {
  window.location.replace(url);
}

//=========localStorage=========
function saveToStorage(key, value) {
  try {
    const stringValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error('Storage save error:', error);
    return false;
  }
}

function getFromStorage(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return defaultValue;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    console.error('Storage get error:', error);
    return defaultValue;
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Storage remove error:', error);
    return false;
  }
}

//=========디바운스=========
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

//=========뒤로가기 컨트롤=========
function smartBack(fallbackUrl = 'main.html') {
  if (window.history.length > 1) {
    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.host)) {
      window.history.back();
      return;
    }
  }
  navigateTo(fallbackUrl);
}

function confirmBack(fallbackUrl, hasChanges, message = '변경 사항이 저장되지 않습니다.') {
  if (hasChanges) {
    showModal(
      '나가시겠습니까?',
      message,
      function() {
        smartBack(fallbackUrl);
      }
    );
  } else {
    smartBack(fallbackUrl);
  }
}

// 게시물 목록 : HTML 이스케이프
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// 게시물 목록 : 선택된 동아리 이름 가져오기
function getSelectedClubName() {
  const clubFilter = document.getElementById('clubFilter');
  
  if (!clubFilter || clubFilter.value === 'all') {
    return 'C.Groove';
  }
  
  const selectedClub = myClubs.find(c => {
    return String(c.clubId) === String(clubFilter.value);
  });
  
  return selectedClub ? (selectedClub.clubName || selectedClub.name) : 'C.Groove';
}

window.escapeHtml = escapeHtml;
window.getImageUrl = getImageUrl;

console.log('common/utils.js 로드 완료');