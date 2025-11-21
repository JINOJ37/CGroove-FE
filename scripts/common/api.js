// API 설정 및 공통 함수

// API 기본 URL
const API_BASE_URL = 'http://localhost:8080';

// API 요청 래퍼 함수
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 요청 옵션 설정
  const config = {
    method: options.method || 'GET',
    headers: options.headers || {},
    ...options
  };
  
  // FormData가 아닐 때만 Content-Type 설정
  if (!options.isFormData && config.body && typeof config.body === 'string') {
    config.headers['Content-Type'] = 'application/json';
  }
  
  // Access Token 추가
  const token = getAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log(`➡️ API 요청: ${config.method} ${url}`);
  console.log('➡️ 요청 데이터:', config.body || '없음');
  
  try {
    // fetch 호출
    const response = await fetch(url, config);
    
    console.log(` ${config.method} ${url}`, response.status, response.statusText);
    
    // 204 No Content 처리
    if (response.status === 204) {
      console.log('➡️ 응답: 204 No Content (응답 바디 없음)');
      return { success: true };
    }
    
    // 응답 바디 있는지 확인
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // JSON이 아니면 텍스트로 읽기
      const text = await response.text();
      data = text ? { message: text } : { success: true };
    }
    
    console.log('➡️ 응답 (' + response.status + '):', data);
    
    // 에러 응답 처리
    if (!response.ok) {
      throw new ApiError(
        data.message || getErrorMessage(response.status),
        response.status,
        data
      );
    }
    
    return data;
    
  } catch (error) {
    console.log('API 요청 실패:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // 네트워크 에러
    throw new ApiError(
      '네트워크 연결을 확인해주세요',
      0,
      null
    );
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
function removeToken() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
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

// 내가 속한 동아리 목록 조회
async function getMyClubs() {
  console.log('내 동아리 목록 조회 API 호출');
  
  return await apiRequest('/club-joins/club', {
    method: 'GET'
  });
}
// 동아리 목록 조회
async function getClubs() {
  return await apiRequest('/clubs', { method: 'GET' });
}
// 동아리 목록 조회
async function getClub(clubId) {
  return await apiRequest(
    `/clubs/${clubId}`, { 
      method: 'GET' });
}

// 게시글 목록 조회
async function getPosts(page = 1, limit = 10) {
  console.log('게시글 목록 조회 API 호출', { page, limit }); 
  return await apiRequest('/posts', {
    method: 'GET'
  });
}
// 게시글 상세 조회
async function getPost(postId) {
  console.log('게시글 상세 조회 API 호출', postId);
  return await apiRequest(`/posts/${postId}`, {
    method: 'GET'
  });
}
// 게시글 수정
async function updatePost(postId, formData) {
  console.log('게시글 수정 API 호출:', postId);
  
  return await apiRequest(`/posts/${postId}`, {
    method: 'PATCH',
    body: formData,
    isFormData: true
  });
}
// 게시글 삭제
async function deletePost(postId) {
  console.log('게시글 삭제 API 호출:', postId);
  
  return await apiRequest(`/posts/${postId}`, {
    method: 'DELETE',
  });
}

console.log('common/api.js 로드 완료');