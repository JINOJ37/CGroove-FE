import { apiRequest } from './core.js';

// ==========================================
// 게시글 (Post) API
// ==========================================

// 전체 게시물 조회
export async function getPosts() {
  return await apiRequest('/posts', { method: 'GET' });
}

// HOT 게시물 조회
export async function getHotPosts() {
  return await apiRequest('/posts/hot', { method: 'GET' });
}

// MyClub 게시물 조회
export async function getMyClubPosts() {
  return await apiRequest('/posts/my-club', { method: 'GET' });
}

// 게시물 상세 조회
export async function getPost(postId) {
  return await apiRequest(`/posts/${postId}`, { method: 'GET' });
}

// 게시물 생성
export async function createPost(formData) {
  return await apiRequest('/posts', {
    method: 'POST',
    body: formData,
    isFormData: true
  });
}

// 게시물 수정
export async function updatePost(postId, formData) {
  return await apiRequest(`/posts/${postId}`, {
    method: 'PATCH',
    body: formData,
    isFormData: true
  });
}

// 게시물 삭제
export async function deletePost(postId) {
  return await apiRequest(`/posts/${postId}`, { method: 'DELETE' });
}

export async function togglePostLike(postId) {
  return await apiRequest(`/posts/${postId}/like`, { method: 'POST' });
}

console.log('common/api/post.js 로드 완료');