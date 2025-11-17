// API 설정 및 공통 함수

// API 기본 URL
const API_BASE_URL = 'http://localhost:8080';

// API 요청 래퍼 함수
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 기본 헤더 설정
  const defaultHeaders = {};
  
  // FormData가 아닐 때만 Content-Type 추가
  // FormData는 브라우저가 자동으로 multipart/form-data + boundary 설정
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
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
    
    // FormData는 로그로 보기 어려우니 타입만 표시
    if (options.body instanceof FormData) {
      console.log('➡️ 요청 데이터: FormData');
      for (let [key, value] of options.body.entries()) {
        console.log(`   - ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }
    } else if (options.body) {
      // JSON일 때만 parse
      console.log('➡️ 요청 데이터:', JSON.parse(options.body));
    } else {
      console.log('➡️ 요청 데이터: 없음');
    }
    
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
    console.error('API 요청 실패:', error);
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
// 내 정보 조회
async function getMyInfo() {
  console.log('내 정보 조회 API 호출');
  return await apiRequest('/users/me', {
    method: 'GET'
  });
}

/*
// 닉네임 중복 체크
async function checkNickname(nickname) {
  console.log('닉네임 중복 체크:', nickname);
  
  try {
    const response = await apiRequest(`/users/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
      method: 'GET'
    });
    
    // 백엔드 응답 형식에 따라 조정 필요
    // 예: { available: true } 또는 { isDuplicate: false }
    return response.data.available || !response.data.isDuplicate;
    
  } catch (error) {
    if (error.status === 409) {
      // 중복
      return false;
    }
    throw error;
  }
}
*/

console.log('common/api.js 로드 완료');