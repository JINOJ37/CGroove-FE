// API 설정 및 공통 함수

// API 기본 URL
const API_BASE_URL = 'http://localhost:8080';

// API 요청 래퍼 함수
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 기본 헤더 설정
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // 토큰이 있으면 Authorization 헤더 추가
  const token = getAccessToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // 요청 옵션 병합
  const requestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };
  
  try {
    console.log(`➡️ API 요청: ${options.method || 'GET'} ${url}`);
    console.log('➡️ 요청 데이터:', options.body ? JSON.parse(options.body) : null);
    
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    console.log(`➡️ 응답 (${response.status}):`, data);
    
    if (!response.ok) {
      throw new ApiError(response.status, data.message || '서버 오류가 발생했습니다');
    }
    
    return data;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // 네트워크 오류 등
    console.error('❌ API 요청 실패:', error);
    throw new ApiError(0, '네트워크 연결을 확인해주세요');
  }
}

// 커스텀 API 에러 클래스
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// 토큰 관리
function storeToken(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken)
}
function getAccessToken() {
  return localStorage.getItem('accessToken');
}
function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}
function removeAccessToken() {
  localStorage.removeItem('accessToken');
}

// 로그인 상태 확인
function isLoggedIn() {
  return !!getAccessToken();
}

console.log('common/api.js 로드 완료');