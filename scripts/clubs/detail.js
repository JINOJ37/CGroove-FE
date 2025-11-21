// scripts/clubs/detail.js

// ============================================
// 더미 데이터 (백엔드가 아직 안 주는 부분용)
// ============================================

const dummyClubDetail = {
  // 통계
  totalMembers: 45,
  newMembers: 12,
  performances: 15,

  // 갤러리
  gallery: [
    { id: 1, placeholder: '📸' },
    { id: 2, placeholder: '🎬' },
    { id: 3, placeholder: '🎤' },
    { id: 4, placeholder: '🎭' },
    { id: 5, placeholder: '💃' },
    { id: 6, placeholder: '🕺' },
    { id: 7, placeholder: '🎵' },
    { id: 8, placeholder: '⚡' }
  ],

  // 운영진
  leaders: [
    { name: '김동아', role: '회장', avatar: '👤' },
    { name: '이댄스', role: '부회장', avatar: '👤' },
    { name: '박리듬', role: '총무',  avatar: '👤' }
  ],

  // 최근 활동
  recentActivities: [
    {
      id: 1,
      title: '2024 가을 정기공연 성황리 종료',
      description: '지난 11월 15일, 학생회관 대강당에서 진행된 가을 정기공연이 성황리에 종료되었습니다. 200명 이상의 관객이 참석해주셨습니다.',
      date: '2024-11-16',
      image: '🎉'
    },
    {
      id: 2,
      title: '신입생 오리엔테이션 진행',
      description: '2024년 하반기 신입생 12명을 대상으로 오리엔테이션을 진행했습니다. 앞으로의 활동이 기대됩니다!',
      date: '2024-11-10',
      image: '👋'
    },
    {
      id: 3,
      title: '전국 대학 댄스 페스티벌 2위 수상',
      description: '10월 말에 진행된 전국 대학 댄스 페스티벌에서 우수한 성적으로 2위를 차지했습니다.',
      date: '2024-10-28',
      image: '🏆'
    }
  ],

  // 연락처
  contact: {
    email: 'club@univ.ac.kr',
    instagram: '@club_official',
    website: 'https://club.example.com',
    kakao: '카카오톡 오픈채팅'
  }
};

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('동아리 상세 페이지 초기화');
  initClubDetailPage();
});

async function initClubDetailPage() {
  setupBackButton();
  setupButtons();

  const clubId = getClubIdFromUrl();
  if (!clubId) {
    console.error('clubId 없음');
    showToast('잘못된 접근입니다.');
    smartBack('club_list.html');
    return;
  }

  await loadClubDetail(clubId);
}

// ============================================
// URL에서 clubId 추출
// ============================================

function getClubIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('id');
  return clubId ? Number(clubId) : null;
}

// ============================================
// 동아리 상세 로드 (실제 API 사용)
// ============================================

async function loadClubDetail(clubId) {
  const loading = document.getElementById('loadingIndicator');

  try {
    if (loading) loading.style.display = 'block';

    console.log('동아리 상세 조회:', clubId);
    const response = await getClub(clubId); // 🔥 GET /clubs/{clubId}
    const club = response.data;

    if (!club) {
      console.warn('클럽 데이터 없음');
      renderEmptyClub();
      return;
    }

    renderClubDetail(club);

  } catch (error) {
    console.error('동아리 상세 로드 실패:', error);
    renderErrorState();
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

// ============================================
// 상세 정보 렌더링
// ============================================

function renderClubDetail(club) {
  // club: ClubResponse
  // { clubId, clubName, intro, description, clubImage, locationName, tags, memberCount, isMine }

  const nameEl = document.getElementById('clubName');
  const subtitleEl = document.getElementById('clubSubtitle');
  const descEl = document.getElementById('clubDescription');
  const logoEl = document.getElementById('clubLogoLarge');
  const badgeEl = document.getElementById('clubBadge');

  // 1) 이름 / 한줄소개 / 설명
  if (nameEl) nameEl.textContent = club.clubName || '동아리 이름';
  if (subtitleEl) subtitleEl.textContent = club.intro || '';
  if (descEl) {
    const text = club.description || '';
    descEl.innerHTML = text.replace(/\n/g, '<br>');
  }

  // 2) 로고 / 이미지
  if (logoEl) {
    if (club.clubImage) {
      const imgUrl = `${API_BASE_URL}${club.clubImage}`;
      logoEl.innerHTML = `<img src="${imgUrl}" alt="${club.clubName}">`;
    } else {
      // 이미지 없으면 이니셜
      const initial =
        (club.clubName && club.clubName.trim().charAt(0)) ||
        (club.intro && club.intro.trim().charAt(0)) ||
        'C';
      logoEl.textContent = initial;
      logoEl.classList.add('club-logo-initial');
    }
  }

  // 3) "내 동아리" 뱃지
  const isMine = club.isMine === true;
  if (badgeEl) {
    badgeEl.style.display = isMine ? 'inline-block' : 'none';
  }

  // 4) 메타 정보 (멤버 수, 위치)
  const metaEl = document.querySelector('.club-meta');
  if (metaEl) {
    const members = club.memberCount ?? dummyClubDetail.totalMembers;
    const location = club.locationName || '위치 미등록';

    metaEl.innerHTML = `
      <span class="meta-item">👥 ${members}명</span>
      <span class="meta-divider">|</span>
      <span class="meta-item">📍 ${location}</span>
    `;
  }

  // 5) 태그
  const tagsEl = document.querySelector('.club-tags-large');
  if (tagsEl) {
    const tags = club.tags || [];
    if (tags.length === 0) {
      tagsEl.innerHTML = `<span class="tag-large tag-empty">태그 없음</span>`;
    } else {
      tagsEl.innerHTML = tags
        .map((tag) => `<span class="tag-large">${tag}</span>`)
        .join('');
    }
  }

  // 6) 멤버 통계 (totalMembers는 실제값, 나머지는 dummy)
  const statsEl = document.querySelector('.members-stats');
  if (statsEl) {
    const totalMembers = club.memberCount ?? dummyClubDetail.totalMembers;
    const newMembers = dummyClubDetail.newMembers;
    const performances = dummyClubDetail.performances;

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

  // 7) 갤러리 / 운영진 / 최근 활동 / 연락처 – 아직 백엔드 없으니 dummy + 나중에 확장
  renderGallery(club.gallery);
  renderLeadership(club.leaders);
  renderActivities(club.recentActivities);
  renderContact(club.contact);

  // 8) 가입 버튼 상태
  updateJoinButtonText(isMine);
}

// ============================================
// 갤러리 렌더링 (실데이터가 있으면 사용, 없으면 dummy)
// ============================================

function renderGallery(gallery) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const source =
    gallery && Array.isArray(gallery) && gallery.length > 0
      ? gallery
      : dummyClubDetail.gallery;

  grid.innerHTML = source
    .map(
      (item) => `
      <div class="gallery-item">
        ${
          item.imageUrl
            ? `<img src="${API_BASE_URL}${item.imageUrl}" alt="gallery">`
            : `<div class="gallery-placeholder">${item.placeholder || '📸'}</div>`
        }
      </div>
    `
    )
    .join('');
}

// ============================================
// 운영진 렌더링
// ============================================

function renderLeadership(leaders) {
  const grid = document.querySelector('.leadership-grid');
  if (!grid) return;

  const source =
    leaders && Array.isArray(leaders) && leaders.length > 0
      ? leaders
      : dummyClubDetail.leaders;

  grid.innerHTML = source
    .map(
      (leader) => `
      <div class="leader-card">
        <div class="leader-avatar">${leader.avatar || '👤'}</div>
        <div class="leader-info">
          <div class="leader-name">${leader.name || '운영진'}</div>
          <div class="leader-role">${leader.role || ''}</div>
        </div>
      </div>
    `
    )
    .join('');
}

// ============================================
// 최근 활동 렌더링
// ============================================

function renderActivities(activities) {
  const list = document.getElementById('activityList');
  if (!list) return;

  const source =
    activities && Array.isArray(activities) && activities.length > 0
      ? activities
      : dummyClubDetail.recentActivities;

  list.innerHTML = source
    .map(
      (activity) => `
      <div class="activity-item" onclick="goToPost(${activity.id})">
        <div class="activity-image">
          ${
            activity.imageUrl
              ? `<img src="${API_BASE_URL}${activity.imageUrl}" alt="${activity.title}">`
              : `<div class="gallery-placeholder">${activity.image || '📝'}</div>`
          }
        </div>
        <div class="activity-info">
          <h3 class="activity-title">${activity.title}</h3>
          <p class="activity-description">${activity.description}</p>
          <span class="activity-date">${
            typeof formatDate === 'function'
              ? formatDate(activity.date)
              : activity.date
          }</span>
        </div>
      </div>
    `
    )
    .join('');
}

// ============================================
// 연락처 렌더링
// ============================================

function renderContact(contact) {
  const grid = document.querySelector('.contact-grid');
  if (!grid) return;

  const src = { ...dummyClubDetail.contact, ...(contact || {}) };

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

// ============================================
// 가입 버튼 상태 업데이트
// ============================================

function updateJoinButtonText(isMine) {
  const joinBtn = document.getElementById('joinBtn');
  if (!joinBtn) return;

  if (isMine) {
    joinBtn.textContent = '탈퇴하기';
    joinBtn.classList.add('btn-outline');
  } else {
    joinBtn.textContent = '가입 신청';
    joinBtn.classList.remove('btn-outline');
  }
}

// ============================================
// 에러 / 빈 상태
// ============================================

function renderEmptyClub() {
  const container = document.querySelector('.detail-container');
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🎭</div>
      <div class="empty-state-text">동아리 정보를 찾을 수 없습니다</div>
    </div>
  `;
}

function renderErrorState() {
  const container = document.querySelector('.detail-container');
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-text">동아리 정보를 불러오는 중 오류가 발생했습니다</div>
      <button class="btn btn-primary" style="margin-top: 20px; width: auto;" onclick="location.reload()">
        다시 시도
      </button>
    </div>
  `;
}

// ============================================
// 버튼 이벤트
// ============================================

function setupButtons() {
  const joinBtn = document.getElementById('joinBtn');
  const shareBtn = document.getElementById('shareBtn');

  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      // 실제 가입/탈퇴 API 연동은 추후
      showModal(
        '동아리 가입',
        '가입 신청을 하시겠습니까?',
        () => {
          showToast('가입 신청이 완료되었습니다');
        }
      );
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(url)
          .then(() => showToast('링크가 복사되었습니다'))
          .catch(() => showToast('링크 복사에 실패했습니다'));
      } else {
        showToast('링크 복사 기능을 사용할 수 없습니다');
      }
    });
  }
}

// ============================================
// 뒤로가기 버튼
// ============================================

function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) {
    backBtn.onclick = () => smartBack('club_list.html');
  }
}

function goToPost(postId) {
  console.log('게시글 이동:', postId);
  navigateTo(`post_detail.html?id=${postId}`);
}

console.log('clubs/detail.js 로드 완료');
