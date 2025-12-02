// ==================== Import ====================

import { API_BASE_URL } from '../common/api/core.js';
import { getClubs, getMyClubs } from '../common/api/club.js';

import { 
  navigateTo,
  hideLoading
} from '../common/util/utils.js';

import { initHeader } from '../common/component/header.js';

// ==================== 상태 관리 ====================

let currentFilter = 'all';
let currentSort = 'name';
let clubs = [];
let myClubIds = [];
let pendingClubIds = [];

// ==================== 데이터 로드 ====================

async function loadClubs() {
  const grid = document.getElementById('clubsGrid');
  if (!grid) {
    console.warn('#clubsGrid 요소를 찾을 수 없습니다');
    return;
  }

  grid.innerHTML = '<div class="loading-message">로딩 중...</div>';

  try {
    const [allRes, myRes] = await Promise.allSettled([
      getClubs(),
      getMyClubs()
    ]);

    let apiClubs = [];

    // 전체 클럽 목록
    if (allRes.status === 'fulfilled') {
      apiClubs = allRes.value.data || [];
    } else {
      console.warn('전체 클럽 조회 실패:', allRes.reason);
    }

    // ✅ 내 클럽 목록 (ACTIVE + PENDING 분리)
    if (myRes.status === 'fulfilled' && myRes.value.data) {
      const joins = myRes.value.data;
      
      myClubIds = joins
        .filter(j => j.status === 'ACTIVE')
        .map(j => j.clubId);
      
      pendingClubIds = joins
        .filter(j => j.status === 'PENDING')
        .map(j => j.clubId);
      
      console.log('내 동아리 ID:', myClubIds);
      console.log('신청 중인 동아리 ID:', pendingClubIds);
      
    } else {
      console.warn('내 클럽 조회 실패 또는 없음:', myRes.reason);
      myClubIds = [];
      pendingClubIds = [];
    }

    // ✅ isMine, isPending 플래그 추가
    clubs = (apiClubs || []).map(c => ({
      ...c,
      isMine: myClubIds.includes(c.clubId),
      isPending: pendingClubIds.includes(c.clubId)
    }));

    applySort();

  } catch (error) {
    console.error('클럽 목록 로드 실패:', error);
    renderClubs([]);
  }
}

// ==================== 렌더링 ====================

function renderClubs(list) {
  const grid = document.getElementById('clubsGrid');
  if (!grid) return;

  if (!list || list.length === 0) {
    showEmptyState();
    return;
  }

  // ✅ 내 동아리 / 신청 중 / 일반 순으로 정렬
  const sorted = [...list].sort((a, b) => {
    if (a.isMine && !b.isMine) return -1;
    if (!a.isMine && b.isMine) return 1;
    if (a.isPending && !b.isPending) return -1;
    if (!a.isPending && b.isPending) return 1;
    return 0;
  });

  grid.innerHTML = sorted.map(club => createClubCard(club)).join('');
}

function createClubCard(club) {
  const imgSrc = club.clubImage
    ? `${API_BASE_URL}${club.clubImage}`
    : null;
    
  const cardClass = club.isMine ? 'club-card my-club' : 
                    club.isPending ? 'club-card pending-club' : 
                    'club-card';

  return `
    <div class="${cardClass}" data-club-id="${club.clubId}">
      
      <div class="club-logo">
        ${
          imgSrc
            ? `<img src="${imgSrc}" alt="${club.clubName}">`
            : `<span class="club-logo-placeholder">C</span>`
        }
      </div>
      
      <div class="club-divider"></div>
      
      <div class="club-info">
        <h3 class="club-name">${club.clubName}</h3>
        <p class="club-subtitle">${club.intro || ''}</p>
        <p class="club-description">${club.description || ''}</p>
        <div class="club-tags">
          ${
            (club.tags || [])
              .map(tag => `<span class="club-tag">${tag}</span>`)
              .join('') || ''
          }
        </div>
      </div>
      
      <div class="club-arrow">
        <span class="club-arrow-icon">→</span>
      </div>
    </div>
  `;
}

function showEmptyState(message = '등록된 동아리가 없습니다') {
  const grid = document.getElementById('clubsGrid');
  if (!grid) return;
  
  grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🎭</div>
      <div class="empty-state-text">${message}</div>
    </div>
  `;
}

// ==================== 필터/정렬 ====================

function applySort() {
  if (!clubs || clubs.length === 0) {
    renderClubs([]);
    return;
  }

  // ✅ 내 클럽과 신청 중 클럽은 항상 최상단
  const myClubList = clubs.filter(c => c.isMine);
  const pendingList = clubs.filter(c => !c.isMine && c.isPending);
  const otherClubs = clubs.filter(c => !c.isMine && !c.isPending);

  // 나머지 클럽 정렬
  if (currentSort === 'name') {
    otherClubs.sort((a, b) => a.clubName.localeCompare(b.clubName, 'ko'));
  } else if (currentSort === 'name-desc') {
    otherClubs.sort((a, b) => b.clubName.localeCompare(a.clubName, 'ko'));
  } else if (currentSort === 'members') {
    otherClubs.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
  }

  // ✅ 순서: 내 동아리 → 신청 중 → 나머지
  clubs = [...myClubList, ...pendingList, ...otherClubs];

  applyFilters();
}

function applyFilters() {
  if (!clubs || clubs.length === 0) {
    renderClubs([]);
    return;
  }

  let filtered = [...clubs];

  if (currentFilter === 'club') {
    filtered = filtered.filter(c => c.clubType === 'CLUB');
  } else if (currentFilter === 'crew') {
    filtered = filtered.filter(c => c.clubType === 'CREW');
  } else if (currentFilter === 'my') {
    filtered = filtered.filter(c => c.isMine);
  }

  if (filtered.length === 0) {
    showEmptyState("조건에 맞는 동아리가 없습니다");
    return;
  }

  renderClubs(filtered);
}

// ==================== 이벤트 핸들러 ====================

function setupFilters() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      currentFilter = tab.dataset.filter;
      applyFilters();
    });
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentSort = btn.dataset.sort;
      applySort();
    });
  });
}

function setupCreateClubButton() {
  const btn = document.getElementById('createClubBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    navigateTo('club_create.html');
  });
}

function setupClubCardClick() {
  const grid = document.getElementById('clubsGrid');
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.club-card');
    if (!card) return;

    const clubId = card.dataset.clubId;
    if (clubId) {
      console.log('클럽 상세 이동:', clubId);
      navigateTo(`club_detail.html?id=${clubId}`);
    }
  });
}

function setupTopButton() {
  const topButton = document.getElementById('topButton');
  if (!topButton) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      topButton.classList.add('show');
    } else {
      topButton.classList.remove('show');
    }
  });

  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function setupLogoClick() {
  const logoBtn = document.getElementById('logoBtn');
  if (logoBtn) {
    logoBtn.style.cursor = 'pointer';
    logoBtn.addEventListener('click', () => {
      navigateTo('main.html');
    });
  }
}

// ==================== 초기화 ====================

async function initClubsPage() {
  hideLoading();

  await initHeader();

  setupLogoClick();

  await loadClubs();

  setupFilters();
  setupClubCardClick();
  setupTopButton();
  setupCreateClubButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClubsPage);
} else {
  initClubsPage();
}

console.log('pages/club.js 로드 완료');