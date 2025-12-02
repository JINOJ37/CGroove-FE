import { apiRequest } from './core.js';

// ==========================================
// 1. 행사 관리 (CRUD) - EventController
// ==========================================

// 전체 행사 조회
export async function getEvents() {
  return await apiRequest('/events', { method: 'GET' });
}

// Upcoming 행사 조회
export async function getUpcomingEvents() {
  return await apiRequest('/events/upcoming', { method: 'GET' });
}

// 행사 상세 조회
export async function getEvent(eventId) {
  return await apiRequest(`/events/${eventId}`, { method: 'GET' });
}

// 행사 생성
export async function createEvent(formData) {
  return await apiRequest('/events', {
    method: 'POST',
    body: formData,
    isFormData: true
  });
}

// 행사 수정
export async function updateEvent(eventId, formData) {
  return await apiRequest(`/events/${eventId}`, {
    method: 'PATCH',
    body: formData,
    isFormData: true
  });
}

// 행사 삭제
export async function deleteEvent(eventId) {
  return await apiRequest(`/events/${eventId}`, { method: 'DELETE' });
}

export async function toggleEventLike(eventId) {
  return await apiRequest(`/events/${eventId}/like`, { method: 'POST' });
}

// ==========================================
// 2. 행사 참여 (신청/취소) - EventJoinController
// ==========================================

// 행사 신청 (선착순)
export async function applyEvent(eventId) {
  return await apiRequest(`/events/${eventId}/apply`, { method: 'POST' });
}

// 행사 신청 취소
export async function cancelEventJoin(eventId) {
  return await apiRequest(`/events/${eventId}/apply`, { method: 'DELETE' });
}

// 내 신청 상태 조회 (특정 행사)
export async function getMyJoinStatus(eventId) {
  return await apiRequest(`/events/${eventId}/my-status`, { method: 'GET' });
}

// 내가 신청한 행사 목록 조회
export async function getMyEvents() {
  return await apiRequest('/events/my-joins', { method: 'GET' });
}

// ==========================================
// 3. 행사 운영 (주최자용) - EventJoinController
// ==========================================

// 행사 참여자 목록 조회 (확정된 인원)
export async function getEventParticipants(eventId) {
  return await apiRequest(`/events/${eventId}/participants`, { method: 'GET' });
}

// 행사 신청 거절 (주최자 권한)
export async function rejectParticipation(eventId, participantId) {
  return await apiRequest(`/events/${eventId}/participation/${participantId}/reject`, { method: 'POST' });
}

console.log('common/api/event.js 로드 완료');