// DOM 조작

// 에러 메세지 표시
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const helperText = input.nextElementSibling;
  
  input.style.borderColor = '#ff4444';
  if (helperText) {
    helperText.textContent = message;
    helperText.style.display = 'block';
  }
}

// 에러 메세지 초기화
function clearError(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  const helperText = input.nextElementSibling;
  
  input.style.borderColor = '#e0e0e0';
  if (helperText) {
    helperText.style.display = 'none';
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
function setLoadingState(isLoading, loadingText = '처리중...', defaultText = null) {
  const submitBtn = document.querySelector('button[type="submit"]');
  if (!submitBtn) return;
  
  if (isLoading) {
    submitBtn.disabled = true;
    submitBtn.textContent = loadingText;
    submitBtn.style.cursor = 'wait';
  } else {
    // 기본 텍스트 자동 감지
    if (!defaultText) {
      const form = submitBtn.closest('form');
      if (form && form.id.includes('login')) {
        defaultText = '로그인';
      } else if (form && form.id.includes('signin')) {
        defaultText = '회원가입';
      } else {
        defaultText = '완료';
      }
    }
    submitBtn.textContent = defaultText;
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