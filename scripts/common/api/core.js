// ==================== API 핵심 기능 (Core) ====================

// API 기본 URL
export const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8080'
  : '/api';

// ========== 커스텀 API 에러 클래스 ==========

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ========== 에러 메시지 매핑 ==========

function getErrorMessage(status) {
  const messages = {
    400: '잘못된 요청입니다.',
    401: '인증이 만료되었습니다.',
    403: '접근 권한이 없습니다.',
    404: '요청한 정보를 찾을 수 없습니다.',
    409: '이미 존재하는 데이터입니다.',
    413: '파일 크기가 너무 큽니다.',
    500: '서버 시스템 오류가 발생했습니다.'
  };
  return messages[status] || `알 수 없는 오류가 발생했습니다. (Code: ${status})`;
}

// ========== 토큰 관리 ==========

export function storeToken(accessToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('tokenStoredAt', Date.now().toString());
  sessionStorage.removeItem('logoutAlertShown');
}

export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

export function removeToken() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('tokenStoredAt');
}

export function isLoggedIn() {
  return !!localStorage.getItem('accessToken');
}

// ========== 토큰 재발급 (동시성 처리) ==========

let refreshPromise = null;

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }
  
  refreshPromise = (async () => {
    try {
      console.log('🔄 토큰 재발급 시도...');
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.accessToken) {
          storeToken(data.data.accessToken);
          console.log('토큰 재발급 성공');
          return true;
        }
      }
      
      console.warn('토큰 재발급 실패 (유효하지 않음)');
      return false;
      
    } catch (error) {
      console.error('토큰 재발급 네트워크 오류:', error);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ========== 로그아웃 및 리다이렉트 ==========

export function handleLogoutRedirect() {
  removeToken();
  
  if (window.location.pathname.includes('login.html')) {
    return;
  }

  if (!sessionStorage.getItem('logoutAlertShown')) {
    sessionStorage.setItem('logoutAlertShown', 'true');
    alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
  }
  
  window.location.href = '/login.html';
}

// ========== API 요청 래퍼 함수 (Interceptor) ==========

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    method: options.method || 'GET',
    headers: { ...options.headers },
    credentials: 'include',
    ...options
  };
  
  delete config.isFormData;

  if (!options.isFormData) {
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
  } else {
    delete config.headers['Content-Type'];
  }
  
  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    let response = await fetch(url, config);
    
    if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      console.log('401 감지 - 토큰 갱신 시도');
      
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        config.headers['Authorization'] = `Bearer ${getAccessToken()}`;
        response = await fetch(url, config);
      } else {
        handleLogoutRedirect();
        throw new ApiError('세션이 만료되었습니다.', 401, null);
      }
    }
    
    if (response.status === 204) {
      return { success: true };
    }
    
    let data = {};
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        console.warn('JSON 파싱 실패 (비어있는 본문일 수 있음)', e);
        data = {};
      }
    } else {
      const text = await response.text();
      data = { message: text };
    }
    
    if (!response.ok) {
      throw new ApiError(
        data.message || getErrorMessage(response.status),
        response.status,
        data
      );
    }
    
    return data;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API Request Error:', error);
    throw new ApiError('서버와 통신 중 문제가 발생했습니다.', 0, null);
  }
}

console.log('common/api/core.js 로드 완료');