// ============================================
// 더미 데이터
// ============================================

const dummyClubDetail = {
  id: 1,
  name: 'TIPSSY',
  subtitle: '스트릿댄스 동아리',
  logo: '🎭',
  description: `Drink the Rhythm, TIPSSY!

스트릿 댄스의 모든 장르를 즐기는 댄스 동아리입니다. 
힙합, 팝핀, 락킹, 왁킹, 하우스 등 다양한 장르의 댄스를 배우고, 
공연과 대회를 통해 실력을 발전시킵니다.

매주 정기 연습과 월별 공연을 통해 함께 성장하는 댄스 크루입니다.`,
  tags: ['힙합', '댄스', '공연', '대회'],
  university: '고려대학교',
  totalMembers: 45,
  newMembers: 12,
  performances: 15,
  isMine: true,
  
  leaders: [
    { name: '김동아', role: '회장', avatar: '👤' },
    { name: '이댄스', role: '부회장', avatar: '👤' },
    { name: '박리듬', role: '총무', avatar: '👤' }
  ],
  
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
  
  contact: {
    email: 'tipssy@korea.ac.kr',
    instagram: '@tipssy_official',
    website: 'www.tipssy.com',
    kakao: '카카오톡 오픈채팅'
  }
};

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('동아리 상세 페이지 초기화');
  
  loadClubDetail();
  setupButtons();
  setupBackButton();
});

// ============================================
// 동아리 상세 로드
// ============================================

function loadClubDetail() {
  // URL에서 ID 추출
  const urlParams = new URLSearchParams(window.location.search);
  const clubId = urlParams.get('id');
  
  console.log('동아리 ID:', clubId);
  
  // 더미 데이터 사용
  const club = dummyClubDetail;
  
  // 기본 정보
  document.getElementById('clubLogoLarge').textContent = club.logo;
  document.getElementById('clubName').textContent = club.name;
  document.getElementById('clubSubtitle').textContent = club.subtitle;
  document.getElementById('clubDescription').innerHTML = club.description.replace(/\n/g, '<br>');
  
  // 뱃지 표시
  const badge = document.getElementById('clubBadge');
  if (club.isMine) {
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
  
  // 메타 정보
  document.querySelector('.club-meta').innerHTML = `
    <span class="meta-item">👥 ${club.totalMembers}명</span>
    <span class="meta-divider">|</span>
    <span class="meta-item">📍 ${club.university}</span>
  `;
  
  // 태그
  document.querySelector('.club-tags-large').innerHTML = club.tags
    .map(tag => `<span class="tag-large">${tag}</span>`)
    .join('');
  
  // 통계
  document.querySelector('.members-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${club.totalMembers}</div>
      <div class="stat-label">전체 멤버</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${club.newMembers}</div>
      <div class="stat-label">신입 멤버</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${club.performances}</div>
      <div class="stat-label">공연 횟수</div>
    </div>
  `;
  
  // 갤러리
  renderGallery(club.gallery);
  
  // 운영진
  renderLeadership(club.leaders);
  
  // 최근 활동
  renderActivities(club.recentActivities);
}

// ============================================
// 갤러리 렌더링
// ============================================

function renderGallery(gallery) {
  const grid = document.getElementById('galleryGrid');
  
  grid.innerHTML = gallery.map(item => `
    <div class="gallery-item">
      <div class="gallery-placeholder">${item.placeholder}</div>
    </div>
  `).join('');
}

// ============================================
// 운영진 렌더링
// ============================================

function renderLeadership(leaders) {
  const grid = document.querySelector('.leadership-grid');
  
  grid.innerHTML = leaders.map(leader => `
    <div class="leader-card">
      <div class="leader-avatar">${leader.avatar}</div>
      <div class="leader-info">
        <div class="leader-name">${leader.name}</div>
        <div class="leader-role">${leader.role}</div>
      </div>
    </div>
  `).join('');
}

// ============================================
// 최근 활동 렌더링
// ============================================

function renderActivities(activities) {
  const list = document.getElementById('activityList');
  
  list.innerHTML = activities.map(activity => `
    <div class="activity-item" onclick="goToPost(${activity.id})">
      <div class="activity-image">
        <div class="gallery-placeholder">${activity.image}</div>
      </div>
      <div class="activity-info">
        <h3 class="activity-title">${activity.title}</h3>
        <p class="activity-description">${activity.description}</p>
        <span class="activity-date">${formatDate(activity.date)}</span>
      </div>
    </div>
  `).join('');
}

// ============================================
// 버튼 이벤트
// ============================================

function setupButtons() {
  // 가입 신청
  document.getElementById('joinBtn').addEventListener('click', () => {
    showModal(
      '동아리 가입',
      '가입 신청을 하시겠습니까?',
      () => {
        showToast('가입 신청이 완료되었습니다');
      }
    );
  });
  
  // 공유하기
  document.getElementById('shareBtn').addEventListener('click', () => {
    showToast('링크가 복사되었습니다');
  });
}

// 뒤로가기 버튼 업데이트
function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) {
    backBtn.onclick = () => smartBack('club_list.html');
  }
}

// ============================================
// 유틸리티
// ============================================

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function goToPost(postId) {
  console.log('게시글 이동:', postId);
  navigateTo(`detail.html?id=${postId}`);
}

console.log('clubs/detail.js 로드 완료');