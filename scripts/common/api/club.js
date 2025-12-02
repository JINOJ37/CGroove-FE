import { apiRequest } from './core.js';

// ==========================================
// 1. 클럽 관리 (CRUD) - ClubController
// ==========================================

// 클럽 생성
export async function createClub(formData) {
  return await apiRequest('/clubs', {
    method: 'POST',
    body: formData,
    isFormData: true
  });
}

// 전체 클럽 조회
export async function getClubs() {
  return await apiRequest('/clubs', { method: 'GET' });
}

// 특정 클럽 상세 조회
export async function getClub(clubId) {
  return await apiRequest(`/clubs/${clubId}`, { method: 'GET' });
}

//클럽 정보 수정
export async function updateClub(clubId, formData) {
  return await apiRequest(`/clubs/${clubId}`, {
    method: 'PATCH',
    body: formData,
    isFormData: true
  });
}

// 클럽 이미지 삭제
export async function deleteClubImage(clubId) {
  return await apiRequest(`/clubs/${clubId}/club-image`, { method: 'DELETE' });
}

// 클럽 삭제 (리더 전용)
export async function deleteClub(clubId) {
  return await apiRequest(`/clubs/${clubId}`, { method: 'DELETE' });
}

// ==========================================
// 2. 클럽 멤버십 (가입/탈퇴) - ClubJoinController
// ==========================================

// 내 가입한 클럽 목록 조회
export async function getMyClubs() {
  return await apiRequest('/clubs/my', { method: 'GET' });
}

// 내 가입한 클럽 목록 조회 (신청 중 포함)
export async function getMyAllClubs() {
  return await apiRequest('/clubs/my-all', { method: 'GET' });
}

// 클럽 가입 신청
export async function applyToClub(clubId) {
  return await apiRequest(`/clubs/${clubId}/apply`, { method: 'POST' });
}

// 클럽 가입 신청 취소
export async function cancelApplication(clubId) {
  return await apiRequest(`/clubs/${clubId}/apply`, { method: 'DELETE' });
}

// 클럽 탈퇴
export async function leaveClub(clubId) {
  return await apiRequest(`/clubs/${clubId}/leave`, { method: 'DELETE' });
}

// 내 가입 상태 조회 (특정 클럽)
export async function getMyJoinStatus(clubId) {
  return await apiRequest(`/clubs/${clubId}/my-status`, { method: 'GET' });
}

// ==========================================
// 3. 클럽 운영 (리더/매니저 전용) - ClubJoinController
// ==========================================

// 활동 중인 멤버 목록 조회
export async function getActiveMembers(clubId) {
  return await apiRequest(`/clubs/${clubId}/members`, { method: 'GET' });
}

// 가입 대기 중인 신청 목록 조회
export async function getPendingApplications(clubId) {
  return await apiRequest(`/clubs/${clubId}/applications`, { method: 'GET' });
}

// 가입 신청 승인
export async function approveApplication(clubId, applicantId) {
  return await apiRequest(`/clubs/${clubId}/applications/${applicantId}/approve`, { method: 'POST' });
}

// 가입 신청 거절
export async function rejectApplication(clubId, applicantId) {
  return await apiRequest(`/clubs/${clubId}/applications/${applicantId}/reject`, { method: 'POST' });
}

// 멤버 역할 변경
export async function updateMemberRole(clubId, userId, role) {
  return await apiRequest(`/clubs/${clubId}/members/${userId}/role?newRole=${role}`, {
    method: 'PATCH'
  });
}

// 멤버 추방
export async function kickMember(clubId, memberId) {
  return await apiRequest(`/clubs/${clubId}/members/${memberId}`, { method: 'DELETE' });
}

console.log('common/api/club.js 로드 완료');