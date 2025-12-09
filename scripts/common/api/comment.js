import { apiRequest } from './core.js';

// ==========================================
// 8. 댓글 (Comment) - CommentController
// ==========================================

// 댓글 작성
// data 구조: { content: "내용", postId: 1, eventId: null } (둘 중 하나 필수)
export async function createComment(data) {
  return await apiRequest('/comments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// 댓글 목록 조회
// params 구조: { postId: 1 } 또는 { eventId: 2 }
export async function getComments(params) {
  // 쿼리 파라미터 생성 (예: ?postId=1 또는 ?eventId=2)
  const queryString = new URLSearchParams(params).toString();
  return await apiRequest(`/comments?${queryString}`, { method: 'GET' });
}

// 댓글 수정
// content: 수정할 댓글 내용 문자열
export async function updateComment(commentId, content) {
  return await apiRequest(`/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content })
  });
}

// 댓글 삭제
export async function deleteComment(commentId) {
  return await apiRequest(`/comments/${commentId}`, { method: 'DELETE' });
}

console.log('common/api/comment.js 로드 완료');