// ==================== Import ====================

import { 
  getClub,
  getActiveMembers,
  getPendingApplications,
  approveApplication,
  rejectApplication,
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
let applications = [];
let myRole = null; 

// ==================== URL 파라미터 ====================

function getClubIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('id');
  return clubId ? Number(clubId) : null;
}

// ==================== API 호출 ====================

async function loadAllData() {
  await loadClubName();
  try {
    await Promise.all([
      loadMembers(),
      loadApplications()
    ]);
  } catch (err) {
    console.error("데이터 로드 중 일부 오류:", err);
  }
}

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
  const countEl = document.getElementById('memberCount');
  
  try {
    const response = await getActiveMembers(currentClubId);
    let memberList = response.data || [];

    if (memberList.length > 0 && memberList[0].isMe === undefined) {
        try {
            const myInfo = await getMyInfo();
            const myId = myInfo.data.userId;
            memberList = memberList.map(m => ({ ...m, isMe: m.userId === myId }));
        } catch(e) {
            console.warn("내 정보 로드 실패", e);
        }
    }

    members = memberList;
    if (countEl) countEl.textContent = members.length;

    const me = members.find(m => m.isMe);
    if (me) myRole = me.role;

    renderMembers(members);

  } catch (error) {
    console.error('멤버 목록 로드 실패:', error);
    if(container) container.innerHTML = '<div class="empty-state">멤버 정보를 불러올 수 없습니다</div>';
  }
}

async function loadApplications() {
  const section = document.getElementById('applicationsSection');
  const divider = document.getElementById('sectionDivider');
  const container = document.getElementById('applicationsList');
  const countEl = document.getElementById('appCount');

  try {
    const response = await getPendingApplications(currentClubId);
    applications = response.data || [];

    if (countEl) countEl.textContent = applications.length;

    if (applications.length > 0) {
        section.style.display = 'block';
        divider.style.display = 'block';
        renderApplications(applications);
    } else {
        section.style.display = 'none';
        divider.style.display = 'none';
    }

  } catch (error) {
    if (error.status === 403) {
        if(section) section.style.display = 'none';
        if(divider) divider.style.display = 'none';
    } else {
        console.error('신청 목록 로드 실패:', error);
    }
  }
}

// ==================== 렌더링 ====================

function renderApplications(list) {
  const container = document.getElementById('applicationsList');
  if (!container) return;

  container.innerHTML = list.map(app => {
    const profileImg = app.profileImage 
      ? `${API_BASE_URL}${app.profileImage}` 
      : '/images/default-profile.png';
    const dateStr = new Date(app.createdAt).toLocaleDateString('ko-KR');

    return `
      <div class="application-card" data-user-id="${app.userId}">
        <div class="user-info">
          <img src="${profileImg}" alt="프로필" class="profile-image">
          <div class="user-details">
            <div class="user-name">${app.nickname}</div>
            <div class="user-email">${app.userEmail || ''}</div>
            <div class="application-date">신청일: ${dateStr}</div>
          </div>
        </div>
        <div class="action-buttons">
          <button class="btn btn-primary approve-btn" data-user-id="${app.userId}">승인</button>
          <button class="btn btn-outline reject-btn" data-user-id="${app.userId}">거절</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderMembers(list) {
  const container = document.getElementById('membersList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state">멤버가 없습니다</div>`;
    return;
  }

  container.innerHTML = list.map(member => {
    const profileImg = member.profileImage 
      ? `${API_BASE_URL}${member.profileImage}` 
      : '/images/default-profile.png';

    const isLeader = member.role === 'LEADER';
    const isManager = member.role === 'MANAGER';
    const isMember = member.role === 'MEMBER';
    
    let canChangeRole = false;
    let canKick = false;

    if (!member.isMe) {
        if (myRole === 'LEADER') {
            canChangeRole = true; 
            canKick = true;
        } else if (myRole === 'MANAGER') {
            if (isMember) canKick = true; 
        }
    }

    const roleText = isLeader ? '클럽장' : isManager ? '운영진' : '멤버';
    const roleClass = isLeader ? 'leader' : isManager ? 'manager' : 'member';
    const joinDate = new Date(member.createdAt).toLocaleDateString('ko-KR');

    let roleActionHTML = '';
    
    if (canChangeRole) {
      roleActionHTML = `
        <select class="role-select" data-user-id="${member.userId}" data-current-role="${member.role}">
          <option value="MEMBER" ${member.role === 'MEMBER' ? 'selected' : ''}>멤버</option>
          <option value="MANAGER" ${member.role === 'MANAGER' ? 'selected' : ''}>운영진</option>
        </select>
      `;
    }

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
          ${roleActionHTML}
          ${canKick ? `
            <button class="btn btn-outline kick-btn" data-user-id="${member.userId}">추방</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ==================== 이벤트 핸들러 ====================

function setupEventHandlers() {
  const appContainer = document.getElementById('applicationsList');
  if (appContainer) {
    appContainer.addEventListener('click', async (e) => {
      const userId = Number(e.target.dataset.userId);
      if (e.target.classList.contains('approve-btn')) await handleApprove(userId);
      if (e.target.classList.contains('reject-btn')) await handleReject(userId);
    });
  }

  const memContainer = document.getElementById('membersList');
  if (memContainer) {
    
    // 추방 버튼 클릭
    memContainer.addEventListener('click', async (e) => {
      if (e.target.classList.contains('kick-btn')) {
        const userId = Number(e.target.dataset.userId);
        await handleKick(userId);
      }
    });

    // ✅ 변경 이벤트 (Native Select Change)
    memContainer.addEventListener('change', async (e) => {
      if (e.target.classList.contains('role-select')) {
        const userId = Number(e.target.dataset.userId);
        const newRole = e.target.value;
        const currentRole = e.target.dataset.currentRole;
        
        // 값이 실제로 변경되었을 때만 실행
        if (newRole !== currentRole) {
            await handleRoleChange(userId, newRole, e.target);
        }
      }
    });
  }

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.onclick = () => smartBack(`club_detail.html?id=${currentClubId}`);
  }
}

// --- 액션 로직들 ---

async function handleApprove(userId) {
  showModal('가입 승인', '승인하시겠습니까?', async () => {
    try {
      await approveApplication(currentClubId, userId);
      showToast('승인되었습니다');
      loadAllData(); 
    } catch (e) {
      showToast('오류가 발생했습니다', 2000, 'error');
    }
  });
}

async function handleReject(userId) {
  showModal('가입 거절', '거절하시겠습니까?', async () => {
    try {
      await rejectApplication(currentClubId, userId);
      showToast('거절되었습니다');
      loadApplications(); 
    } catch (e) {
      showToast('오류가 발생했습니다', 2000, 'error');
    }
  });
}

async function handleKick(userId) {
  showModal('멤버 추방', '정말 추방하시겠습니까?', async () => {
    try {
      await kickMember(currentClubId, userId);
      showToast('추방되었습니다');
      loadMembers(); 
    } catch (e) {
      showToast('오류가 발생했습니다', 2000, 'error');
    }
  });
}

// ✅ 역할 변경 로직 (Wrapper 처리 불필요)
async function handleRoleChange(userId, newRole, selectEl) {
  const roleText = newRole === 'MANAGER' ? '운영진' : '멤버';
  
  showModal('역할 변경', `변경하시겠습니까?`, async () => {
    try {
      await updateMemberRole(currentClubId, userId, newRole);
      showToast('변경되었습니다');
      loadMembers(); 
    } catch (e) {
      showToast('오류가 발생했습니다', 2000, 'error');
      // 실패 시 값 원복 (단순 value 변경만 하면 됨)
      selectEl.value = selectEl.dataset.currentRole;
    }
  }, () => {
    // 취소 시 값 원복
    selectEl.value = selectEl.dataset.currentRole;
  });
}

// ==================== 초기화 ====================

async function init() {
  console.log('통합 멤버 관리 페이지 초기화');
  await initHeader();
  
  currentClubId = getClubIdFromUrl();
  if (!currentClubId) {
    showToast('잘못된 접근입니다', 2000, 'error');
    smartBack('club_list.html');
    return;
  }

  setupEventHandlers();
  await loadAllData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('clubs/members.js 로드 완료');