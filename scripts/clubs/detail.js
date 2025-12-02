// ==================== Import ====================

import { 
  getClub,
  applyToClub,
  cancelApplication,
  leaveClub,
  getMyJoinStatus
} from '../common/api/club.js';

import { API_BASE_URL } from '../common/api/core.js';

import { 
  showToast, 
  showModal, 
  navigateTo, 
  smartBack 
} from '../common/util/utils.js';

import { formatDate } from '../common/util/format.js';

import { initHeader } from '../common/component/header.js';

// ==================== 더미 데이터 ====================

const DUMMY_DATA = {
  totalMembers: 45,
  newMembers: 12,
  performances: 15,
  gallery: [
    { id: 1, placeholder: '📸' },
    { id: 2, placeholder: '🎬' },
    { id: 3, placeholder: '🎤' },
    { id: 4, placeholder: '🎭' }
  ],
  leaders: [
    { name: '김동아', role: '회장', avatar: '👤' },
    { name: '이댄스', role: '부회장', avatar: '👤' }
  ],
  recentActivities: [
    {
      id: 1,
      title: '2024 가을 정기공연 성황리 종료',
      description: '지난 11월 15일, 학생회관 대강당에서 진행된 가을 정기공연이 성황리에 종료되었습니다.',
      date: '2024-11-16',
      image: '🎉'
    }
  ],
  contact: {
    email: 'club@univ.ac.kr',
    instagram: '@club_official',
    website: 'https://club.example.com',
    kakao: '카카오톡 오픈채팅'
  }
};

// ==================== 상태 관리 ====================

let currentClub = null;
let joinStatus = null; // { status: 'ACTIVE' | 'PENDING' | ..., role: 'LEADER' | 'MANAGER' | 'MEMBER' }

// ==================== URL 파라미터 ====================

function getClubIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('id');
  return clubId ? Number(clubId) : null;
}

// ==================== 렌더링 ====================

function renderClubDetail(club) {
  console.log('클럽 상세 렌더링:', club);

  renderBasicInfo(club);
  renderMetaInfo(club);
  renderTags(club.tags);
  renderStats(club.memberCount);
  renderGallery(club.gallery);
  renderLeadership(club.leaders);
  renderActivities(club.recentActivities);
  renderContact(club.contact);
  
  updateJoinButton();
  updateAdminButtons();
}

function renderBasicInfo(club) {
  const nameEl = document.getElementById('clubName');
  const subtitleEl = document.getElementById('clubSubtitle');
  const descEl = document.getElementById('clubDescription');
  const logoEl = document.getElementById('clubLogoLarge');
  const badgeEl = document.getElementById('clubBadge');

  if (nameEl) nameEl.textContent = club.clubName || '동아리 이름';
  if (subtitleEl) subtitleEl.textContent = club.intro || '';
  if (descEl) {
    const text = club.description || '';
    descEl.innerHTML = text.replace(/\n/g, '<br>');
  }

  if (logoEl) {
    if (club.clubImage) {
      const imgUrl = `${API_BASE_URL}${club.clubImage}`;
      logoEl.innerHTML = `<img src="${imgUrl}" alt="${club.clubName}">`;
    } else {
      const initial = (club.clubName || 'C').charAt(0);
      logoEl.textContent = initial;
      logoEl.classList.add('club-logo-initial');
    }
  }

  if (badgeEl) {
    badgeEl.style.display = (joinStatus && joinStatus.status === 'ACTIVE') ? 'inline-block' : 'none';
  }
}

function renderMetaInfo(club) {
  const metaEl = document.querySelector('.club-meta');
  if (!metaEl) return;

  const members = club.memberCount ?? DUMMY_DATA.totalMembers;
  const location = club.locationName || '위치 미등록';

  metaEl.innerHTML = `
    <span class="meta-item">👥 ${members}명</span>
    <span class="meta-divider">|</span>
    <span class="meta-item">📍 ${location}</span>
  `;
}

function renderTags(tags) {
  const tagsEl = document.querySelector('.club-tags-large');
  if (!tagsEl) return;

  const tagList = tags || [];
  if (tagList.length === 0) {
    tagsEl.innerHTML = `<span class="tag-large tag-empty">태그 없음</span>`;
  } else {
    tagsEl.innerHTML = tagList.map(tag => `<span class="tag-large">${tag}</span>`).join('');
  }
}

function renderStats(memberCount) {
  const statsEl = document.querySelector('.members-stats');
  if (!statsEl) return;

  const totalMembers = memberCount ?? DUMMY_DATA.totalMembers;
  const newMembers = DUMMY_DATA.newMembers;
  const performances = DUMMY_DATA.performances;

  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${totalMembers}</div>
      <div class="stat-label">전체 멤버</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${newMembers}</div>
      <div class="stat-label">신입 멤버</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${performances}</div>
      <div class="stat-label">공연 횟수</div>
    </div>
  `;
}

function renderGallery(gallery) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const source = (gallery && gallery.length > 0) ? gallery : DUMMY_DATA.gallery;

  grid.innerHTML = source.map(item => `
    <div class="gallery-item">
      ${item.imageUrl 
        ? `<img src="${API_BASE_URL}${item.imageUrl}" alt="gallery">` 
        : `<div class="gallery-placeholder">${item.placeholder || '📸'}</div>`}
    </div>
  `).join('');
}

function renderLeadership(leaders) {
  const grid = document.querySelector('.leadership-grid');
  if (!grid) return;

  const source = (leaders && leaders.length > 0) ? leaders : DUMMY_DATA.leaders;

  grid.innerHTML = source.map(leader => `
    <div class="leader-card">
      <div class="leader-avatar">${leader.avatar || '👤'}</div>
      <div class="leader-info">
        <div class="leader-name">${leader.name || '운영진'}</div>
        <div class="leader-role">${leader.role || ''}</div>
      </div>
    </div>
  `).join('');
}

function renderActivities(activities) {
  const list = document.getElementById('activityList');
  if (!list) return;

  const source = (activities && activities.length > 0) ? activities : DUMMY_DATA.recentActivities;

  list.innerHTML = source.map(activity => `
    <div class="activity-item" data-post-id="${activity.id}">
      <div class="activity-image">
        ${activity.imageUrl 
          ? `<img src="${API_BASE_URL}${activity.imageUrl}" alt="${activity.title}">` 
          : `<div class="gallery-placeholder">${activity.image || '📝'}</div>`}
      </div>
      <div class="activity-info">
        <h3 class="activity-title">${activity.title}</h3>
        <p class="activity-description">${activity.description}</p>
        <span class="activity-date">${formatDate(activity.date)}</span>
      </div>
    </div>
  `).join('');
}

function renderContact(contact) {
  const grid = document.querySelector('.contact-grid');
  if (!grid) return;

  const src = { ...DUMMY_DATA.contact, ...(contact || {}) };

  grid.innerHTML = `
    <div class="contact-item">
      <div class="contact-icon">✉️</div>
      <div class="contact-info">
        <div class="contact-label">이메일</div>
        <div class="contact-value">${src.email || '-'}</div>
      </div>
    </div>
    <div class="contact-item">
      <div class="contact-icon">📸</div>
      <div class="contact-info">
        <div class="contact-label">인스타그램</div>
        <div class="contact-value">${src.instagram || '-'}</div>
      </div>
    </div>
    <div class="contact-item">
      <div class="contact-icon">🌐</div>
      <div class="contact-info">
        <div class="contact-label">웹사이트</div>
        <div class="contact-value">${src.website || '-'}</div>
      </div>
    </div>
    <div class="contact-item">
      <div class="contact-icon">💬</div>
      <div class="contact-info">
        <div class="contact-label">카카오톡</div>
        <div class="contact-value">${src.kakao || '-'}</div>
      </div>
    </div>
  `;
}

function renderEmptyClub() {
  const main = document.querySelector('.detail-main');
  if (main) main.innerHTML = `<div class="empty-state"><div class="empty-state-text">동아리 정보를 찾을 수 없습니다</div></div>`;
}

function renderErrorState() {
  const main = document.querySelector('.detail-main');
  if (main) main.innerHTML = `<div class="empty-state"><div class="empty-state-text">오류가 발생했습니다</div><button class="btn btn-primary" onclick="location.reload()">다시 시도</button></div>`;
}

function updateJoinButton() {
  const joinBtn = document.getElementById('joinBtn');
  if (!joinBtn) return;

  joinBtn.classList.remove('btn-outline', 'retry-btn');

  if (!joinStatus) {
    joinBtn.textContent = '가입 신청';
    joinBtn.disabled = false;
    joinBtn.onclick = () => handleApply(currentClub.clubId);
    return;
  }

  switch (joinStatus.status) {
    case 'PENDING':
      joinBtn.textContent = '신청 취소';
      joinBtn.classList.add('btn-outline');
      joinBtn.onclick = () => handleCancelApplication(currentClub.clubId);
      break;
    case 'ACTIVE':
      joinBtn.textContent = '탈퇴하기';
      joinBtn.classList.add('btn-outline');
      joinBtn.onclick = () => handleLeave(currentClub.clubId);
      break;
    case 'REJECTED':
      joinBtn.textContent = '재신청';
      joinBtn.classList.add('retry-btn');
      joinBtn.onclick = () => handleReapply(currentClub.clubId);
      break;
    default:
      joinBtn.textContent = '가입 신청';
      joinBtn.onclick = () => handleApply(currentClub.clubId);
  }
}

// ✅ [수정] 관리자 버튼 업데이트 로직
function updateAdminButtons() {
  const adminActions = document.getElementById('adminActions');
  if (!adminActions) return;

  // LEADER 또는 MANAGER 권한 확인
  const isAdmin = 
    joinStatus && 
    joinStatus.status === 'ACTIVE' &&
    (joinStatus.role === 'LEADER' || joinStatus.role === 'MANAGER');
  
  adminActions.style.display = isAdmin ? 'flex' : 'none';
}

// ==================== 이벤트 핸들러 ====================

async function handleApply(clubId) {
  showModal('동아리 가입', '가입 신청을 하시겠습니까?', async () => {
    try {
      await applyToClub(clubId);
      showToast('가입 신청이 완료되었습니다');
      await loadJoinStatus(clubId);
      updateJoinButton();
      updateAdminButtons();
    } catch (error) {
      if (error.status === 401) {
        showToast('로그인이 필요합니다');
        setTimeout(() => navigateTo('login.html'), 1500);
      } else {
        showToast(error.message || '오류가 발생했습니다', 2000, 'error');
      }
    }
  });
}

async function handleLeave(clubId) {
  showModal('동아리 탈퇴', '정말 탈퇴하시겠습니까?', async () => {
    try {
      await leaveClub(clubId);
      showToast('탈퇴되었습니다');
      joinStatus = null;
      updateJoinButton();
      updateAdminButtons();
      await loadClubDetail(clubId);
    } catch (error) {
      showToast('오류가 발생했습니다', 2000, 'error');
    }
  });
}

async function handleReapply(clubId) {
  showModal('동아리 재신청', '다시 신청하시겠습니까?', async () => {
    try {
      await applyToClub(clubId);
      showToast('재신청이 완료되었습니다');
      await loadJoinStatus(clubId);
      updateJoinButton();
      updateAdminButtons();
    } catch (error) {
      showToast('오류가 발생했습니다', 2000, 'error');
    }
  });
}

async function handleCancelApplication(clubId) {
  showModal('신청 취소', '가입 신청을 취소하시겠습니까?', async () => {
    try {
      await cancelApplication(clubId);
      showToast('신청이 취소되었습니다');
      joinStatus = null;
      updateJoinButton();
      updateAdminButtons();
    } catch (error) {
      showToast('오류가 발생했습니다', 2000, 'error');
    }
  });
}

function setupShareButton() {
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast('링크가 복사되었습니다'))
        .catch(() => showToast('복사 실패', 2000, 'error'));
    });
  }
}

function setupActivityClick() {
  const list = document.getElementById('activityList');
  if (list) {
    list.addEventListener('click', (e) => {
      const item = e.target.closest('.activity-item');
      if (item) navigateTo(`post_detail.html?id=${item.dataset.postId}`);
    });
  }
}

function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) backBtn.onclick = () => smartBack('club_list.html');
}

// ✅ [수정] 관리자 버튼 이벤트 핸들러
function setupAdminButtons() {
  const manageMembersBtn = document.getElementById('manageMembersBtn');
  const editClubBtn = document.getElementById('editClubBtn');

  // 멤버 및 신청 관리 (통합 페이지로 이동)
  if (manageMembersBtn) {
    manageMembersBtn.addEventListener('click', () => {
      navigateTo(`club_members.html?id=${currentClub.clubId}`);
    });
  }

  // 동아리 정보 수정 (추후 구현될 페이지)
  if (editClubBtn) {
    editClubBtn.addEventListener('click', () => {
      navigateTo(`club_edit.html?id=${currentClub.clubId}`);
    });
  }
}

// ==================== 데이터 로드 ====================

async function loadClubDetail(clubId) {
  try {
    const response = await getClub(clubId);
    const club = response.data;
    if (!club) {
      renderEmptyClub();
      return;
    }
    currentClub = club;
    renderClubDetail(club);
  } catch (error) {
    if (error.status === 404) renderEmptyClub();
    else renderErrorState();
  }
}

async function loadJoinStatus(clubId) {
  try {
    const response = await getMyJoinStatus(clubId);
    joinStatus = response.data;
  } catch (error) {
    joinStatus = null;
  }
}

// ==================== 초기화 ====================

async function init() {
  console.log('클럽 상세 페이지 초기화');
  await initHeader();

  setupBackButton();
  setupShareButton();
  setupActivityClick();
  setupAdminButtons(); // 이벤트 리스너 등록

  const clubId = getClubIdFromUrl();
  if (!clubId) {
    showToast('잘못된 접근입니다', 2000, 'error');
    smartBack('club_list.html');
    return;
  }

  await loadClubDetail(clubId);
  await loadJoinStatus(clubId);
  
  updateJoinButton();
  updateAdminButtons(); // 상태에 따라 버튼 표시 여부 결정
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('clubs/detail.js 로드 완료');