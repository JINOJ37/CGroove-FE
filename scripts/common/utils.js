//DOM 응용

// 에러 메세지 표시
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) {
    console.error(`showError: ${inputId} 요소를 찾을 수 없습니다`);
    return;
  }
  
  const helperText = input.nextElementSibling;
  
  input.style.borderColor = '#ff4444';
  input.classList.add('error');
  
  if (helperText && helperText.classList.contains('helper-text')) {
    helperText.textContent = message;
    helperText.classList.add('error');
    helperText.style.display = 'block';
    helperText.style.color = '#e74c3c';
  }
  
  console.log(`❌ 에러 표시: ${inputId} - ${message}`);
}

// 에러 메세지 초기화
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

// 버튼 활성화/비활성화 상태 업데이트
function updateButtonState(formValidation) {
  const submitBtn = document.querySelector('button[type="submit"]');
  if (!submitBtn) return;

  const allValid = Object.values(formValidation).every(v => v === true);
  
  if (allValid) {
    submitBtn.disabled = false;
    submitBtn.style.background = '#7F6AEE';
    submitBtn.style.cursor = 'pointer';
  } else {
    submitBtn.disabled = true;
    submitBtn.style.background = '#ACA0EB';
    submitBtn.style.cursor = 'not-allowed';
  }
}

// 로딩 상태 표시 (버튼)
function setLoadingState(isLoading, text = '처리중...') {
  const submitBtn = document.querySelector('button[type="submit"]');
  if (!submitBtn) return;
  
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.textContent = text;
    submitBtn.style.background = '#ACA0EB';
    submitBtn.style.cursor = 'wait';
  } else {
    submitBtn.style.background = '';
    submitBtn.style.cursor = '';
    submitBtn.textContent = text;
    submitBtn.disabled = false;
  }
}

// 로딩 인디케이터 표시 (컨테이너)
function showLoading(containerId = 'postsContainer', message = '로딩 중...') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (document.getElementById('loading')) return;
  
  const loader = document.createElement('div');
  loader.id = 'loading';
  loader.style.textAlign = 'center';
  loader.style.padding = '40px';
  loader.style.color = '#999';
  loader.style.fontSize = '15px';
  loader.textContent = message;
  
  container.appendChild(loader);
}

// 로딩 인디케이터 숨기기
function hideLoading() {
  const loader = document.getElementById('loading');
  if (loader) {
    loader.remove();
  }
}

// 토스트 메시지 표시
function showToast(message, duration = 3000, type = 'success') {
  // 기존 토스트 제거
  const existingToast = document.getElementById('toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 토스트 생성
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  
  // 스타일 적용
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '16px 24px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#fff',
    zIndex: '10000',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '200px',
    textAlign: 'center'
  });
  
  // 타입별 색상
  const colors = {
    success: '#7F6AEE',
    error: '#ff4444',
    info: '#555'
  };
  toast.style.background = colors[type] || colors.success;
  
  // DOM에 추가
  document.body.appendChild(toast);
  
  // 애니메이션
  setTimeout(() => {
    toast.style.opacity = '1';
  }, 10);
  
  // 자동 제거
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// 모달 표시
function showModal(title, message, onConfirm, onCancel) {
  // 기존 모달 제거
  const existingModal = document.getElementById('customModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // 모달 오버레이
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
  
  // 모달 박스
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  `;
  
  // 제목
  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = `
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 12px 0;
    text-align: center;
  `;
  
  // 메시지
  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.style.cssText = `
    font-size: 15px;
    color: #666;
    margin: 0 0 24px 0;
    text-align: center;
    line-height: 1.5;
  `;
  
  // 버튼 컨테이너
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 12px;
  `;
  
  // 취소 버튼
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '취소';
  cancelBtn.style.cssText = `
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    background: #333;
    color: white;
  `;
  cancelBtn.onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };
  
  // 확인 버튼
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = '확인';
  confirmBtn.style.cssText = `
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    background: #7F6AEE;
    color: white;
  `;
  confirmBtn.onclick = () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  };
  
  // 조립
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);
  
  modal.appendChild(titleEl);
  modal.appendChild(messageEl);
  modal.appendChild(buttonContainer);
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // 오버레이 클릭 시 닫기
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (onCancel) onCancel();
    }
  });
}

// 특정 요소에 포커스
function focusElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
}

// 페이지 이동
function navigateTo(url, delay = 0) {
  setTimeout(() => {
    window.location.href = url;
  }, delay);
}

// localStorage에 데이터 저장
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

// localStorage에서 데이터 가져오기
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

// localStorage에서 데이터 삭제
function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Storage remove error:', error);
    return false;
  }
}

// 디바운스
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

console.log('common/utils.js 로드 완료');