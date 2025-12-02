// ==================== Import ====================

import { 
  getClub,
  getActiveMembers,
  kickMember,
  updateMemberRole
} from '../common/api/club.js';

import { API_BASE_URL } from '../common/api/core.js';

import { 
  showToast, 
  showModal, 
  navigateTo, 
  smartBack 
} from '../common/util/utils.js';

import { getMyInfo } from '../common/api/user.js';

import { initHeader } from '../common/component/header.js';

// ==================== 상태 관리 ====================

let currentClubId = null;
let members = [];
let myRole = null; // OWNER, ADMIN, MEMBER

// ==================== URL 파라미터 ====================

function getClubIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('id');
  return clubId ? Number(clubId) : null;
}

// ==================== 렌더링 ====================

function renderMembers(list = members) {
  const container = document.getElementById('membersList');
  if (!container) return;

  if (list.length === 0) {
    renderEmptyState();
    return;
  }

  console.log('=== 렌더링 시작 ===');
  console.log('myRole:', myRole);

  container.innerHTML = list.map(member => {
    const profileImg = member.profileImage 
      ? `${API_BASE_URL}${member.profileImage}` 
      : '/assets/images/default-profile.png';

    const isLeader = member.role === 'LEADER';
    const isManager = member.role === 'MANAGER';
    const isMember = member.role === 'MEMBER';
    
    const canChangeRole = myRole === 'LEADER' && !isLeader && !member.isMe;
    const canKick = (myRole === 'LEADER' || myRole === 'MANAGER') && !isLeader;

    console.log(`멤버 [${member.nickname}]:`, {
      userId: member.userId,
      role: member.role,
      isMe: member.isMe,
      isLeader,
      myRole,
      canChangeRole,
      canKick
    });

    const roleText = isLeader ? '클럽장' :
                     isManager ? '운영진' : '멤버';
    const roleClass = isLeader ? 'leader' :
                      isManager ? 'manager' : 'member';

    const joinDate = new Date(member.createdAt).toLocaleDateString('ko-KR');

    return `
      <div class="member-card" data-user-id="${member.userId}">
        <div class="member-info">
          <img src="${profileImg}" alt="프로필" class="profile-image">
          <div class="member-details">
            <div class="member-name">
              ${member.nickname}
              <span class="role-badge ${roleClass}">${roleText}</span>
            </div>
            <div class="member-email">${member.userEmail || ''}</div>
            <div class="join-date">가입일: ${joinDate}</div>
          </div>
        </div>
        <div class="action-buttons">
          ${canChangeRole ? `
            <select class="role-select" data-user-id="${member.userId}" data-current-role="${member.role}">
              <option value="MEMBER" ${isMember ? 'selected' : ''}>멤버</option>
              <option value="MANAGER" ${isManager ? 'selected' : ''}>운영진</option>
            </select>
          ` : ''}
          ${canKick ? `
            <button class="btn btn-outline kick-btn" data-user-id="${member.userId}">
              추방
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  console.log('===================');
}

function renderEmptyState() {
  const container = document.getElementById('membersList');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-text">멤버 목록을 불러올 수 없습니다</div>
    </div>
  `;
}

// ==================== 이벤트 핸들러 ====================

function setupMemberActions() {
  const container = document.getElementById('membersList');
  if (!container) return;

  container.addEventListener('click', async (e) => {
    // 추방 버튼
    if (e.target.closest('.kick-btn')) {
      const userId = Number(e.target.closest('.kick-btn').dataset.userId);
      await handleKick(userId);
      return;
    }
  });

  // ✅ 역할 변경 드롭다운
  container.addEventListener('change', async (e) => {
    if (e.target.classList.contains('role-select')) {
      const userId = Number(e.target.dataset.userId);
      const currentRole = e.target.dataset.currentRole;
      const newRole = e.target.value;
      
      if (currentRole !== newRole) {
        await handleRoleChange(userId, newRole, e.target);
      }
    }
  });
}

async function handleRoleChange(userId, newRole, selectElement) {
  const roleText = newRole === 'MANAGER' ? '운영진' : '멤버';
  
  showModal(
    '역할 변경',
    `이 사용자를 ${roleText}으로 변경하시겠습니까?`,
    async () => {
      try {
        const response = await updateMemberRole(currentClubId, userId, newRole);
        showToast(response.message || '역할이 변경되었습니다');
        
        // 목록 다시 로드
        await loadMembers();
        
      } catch (error) {
        console.error('역할 변경 실패:', error);
        
        // ✅ 실패 시 드롭다운 원래대로
        selectElement.value = selectElement.dataset.currentRole;
        
        if (error.status === 401) {
          showToast('로그인이 필요합니다');
          setTimeout(() => navigateTo('login.html'), 1500);
        } else if (error.status === 403) {
          showToast('권한이 없습니다', 2000, 'error');
        } else {
          showToast(error.message || '역할 변경 중 오류가 발생했습니다', 2000, 'error');
        }
      }
    },
    () => {
      // ✅ 취소 시 드롭다운 원래대로
      selectElement.value = selectElement.dataset.currentRole;
    }
  );
}

async function handleKick(userId) {
  showModal(
    '멤버 추방',
    '정말로 이 멤버를 추방하시겠습니까?',
    async () => {
      try {
        const response = await kickMember(currentClubId, userId);
        showToast(response.message || '멤버가 추방되었습니다');

        // 목록 다시 로드
        await loadMembers();

      } catch (error) {
        console.error('추방 실패:', error);

        if (error.status === 401) {
          showToast('로그인이 필요합니다');
          setTimeout(() => navigateTo('login.html'), 1500);
        } else if (error.status === 403) {
          showToast('권한이 없습니다', 2000, 'error');
        } else {
          showToast(error.message || '추방 중 오류가 발생했습니다', 2000, 'error');
        }
      }
    }
  );
}

function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (!backBtn) return;

  backBtn.onclick = () => {
    smartBack(`club_detail.html?id=${currentClubId}`);
  };
}

// ==================== 데이터 로드 ====================

async function loadClubName() {
  try {
    const response = await getClub(currentClubId);
    const club = response.data;

    const nameEl = document.getElementById('clubName');
    if (nameEl && club) {
      nameEl.textContent = club.clubName;
    }

  } catch (error) {
    console.error('클럽 이름 로드 실패:', error);
  }
}

async function loadMembers() {
  const container = document.getElementById('membersList');
  if (!container) return;

  container.innerHTML = '<div class="loading-message">로딩 중...</div>';

  try {
    const response = await getActiveMembers(currentClubId);
    let memberList = response.data || [];

    console.log('=== 멤버 목록 ===');
    console.log('원본:', memberList);

    // ✅ isMe 필드가 없으면 직접 추가
    if (memberList.length > 0 && memberList[0].isMe === undefined) {
      console.log('isMe 필드 없음 - 내 정보로 설정');
      
      try {
        const myInfoResponse = await getMyInfo();
        const myUserId = myInfoResponse.data.userId;
        
        console.log('내 userId:', myUserId);
        
        // isMe 플래그 추가
        memberList = memberList.map(m => ({
          ...m,
          isMe: m.userId === myUserId
        }));
        
        console.log('isMe 플래그 추가 완료');
        
      } catch (error) {
        console.error('내 정보 조회 실패:', error);
        // 실패해도 계속 진행 (isMe 없이)
        memberList = memberList.map(m => ({
          ...m,
          isMe: false
        }));
      }
    }

    members = memberList;

    console.log('처리된 멤버 목록:', members);

    // 내 역할 찾기
    const me = members.find(m => m.isMe === true);
    
    console.log('나:', me);
    
    if (me) {
      myRole = me.role;
      console.log('내 역할:', myRole);
    } else {
      console.warn('내 정보를 찾을 수 없음');
      myRole = null;
    }
    
    console.log('================');

    renderMembers(members);

  } catch (error) {
    console.error('멤버 목록 로드 실패:', error);

    if (error.status === 401) {
      showToast('로그인이 필요합니다');
      setTimeout(() => navigateTo('login.html'), 1500);
    } else if (error.status === 403) {
      showToast('권한이 없습니다', 2000, 'error');
      setTimeout(() => navigateTo(`club_detail.html?id=${currentClubId}`), 1500);
    } else {
      renderEmptyState();
    }
  }
}
// ==================== 초기화 ====================

async function init() {
  console.log('멤버 관리 페이지 초기화');

  await initHeader();

  setupBackButton();
  setupMemberActions();

  currentClubId = getClubIdFromUrl();
  if (!currentClubId) {
    console.error('clubId 없음');
    showToast('잘못된 접근입니다', 2000, 'error');
    smartBack('club_list.html');
    return;
  }

  await loadClubName();
  await loadMembers();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('clubs/members.js 로드 완료');