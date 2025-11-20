// ============================================
// 더미 데이터
// ============================================

const dummyClubs = [
  {
    id: 1,
    name: 'TIPSSY',
    subtitle: '스트릿댄스 동아리',
    description: 'Drink the Rhythm, TIPSSY! 스트릿 댄스의 모든 장르를 즐기는 댄스 동아리입니다.',
    logo: '🎭',
    tags: ['힙합', '댄스', '공연'],
    university: '고려대학교',
    genre: 'dance',
    members: 45,
    isMine: true // 내 동아리
  },
  {
    id: 2,
    name: 'DANCE P0.ZZ',
    subtitle: '팝핀댄스 동아리',
    description: 'We Love You Just the Way You Are. 팝핀댄스 전문 동아리입니다. 우리만의 춤으로 스토리를 담습니다.',
    logo: '💃',
    tags: ['팝핀', '댄스', '대회'],
    university: '서울대학교',
    genre: 'dance',
    members: 38
  },
  {
    id: 3,
    name: 'KUDT',
    subtitle: '고려대 댄스팀',
    description: 'KOREA UNIVERSITY DANCE TEAM. 고려대의 대표 댄스팀입니다. 올장르 스트릿 댄스 활동.',
    logo: '🕺',
    tags: ['스트릿', '댄스', '고려대'],
    university: '고려대학교',
    genre: 'dance',
    members: 52
  },
  {
    id: 4,
    name: 'RAH',
    subtitle: '서울대 힙합동아리',
    description: 'rah_yahofseoul. 서울대 힙합 동아리. 춤으로 소통하는 댄스 탱탱볼 집합소.',
    logo: '🎵',
    tags: ['힙합', '댄스', '서울대'],
    university: '서울대학교',
    genre: 'dance',
    members: 41
  },
  {
    id: 5,
    name: 'H.I.S',
    subtitle: '스트릿 댄스',
    description: "Street 'til you can't. 스트릿 댄스의 자유로운 움직임을 즐기는 스트릿 댄스 동아리.",
    logo: '⚡',
    tags: ['스트릿', '댄스', '자유'],
    university: '연세대학교',
    genre: 'dance',
    members: 35
  },
  {
    id: 6,
    name: 'BEAT SQUAD',
    subtitle: '비트박스 크루',
    description: '입으로 만드는 음악, 비트박스. 함께 리듬을 만들어가는 크루입니다.',
    logo: '🎤',
    tags: ['비트박스', '음악', '공연'],
    university: '고려대학교',
    genre: 'music',
    members: 28
  }
];

// ============================================
// 전역 변수
// ============================================

let currentFilter = 'all';
let currentSort = 'name';
let clubs = [];

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('동아리 페이지 초기화');
  
  loadClubs();
  setupFilters();
  setupTopButton();
});

// ============================================
// 동아리 로드
// ============================================

function loadClubs() {
  console.log('동아리 데이터 로드');
  
  // 더미 데이터 복사
  clubs = [...dummyClubs];
  
  // 내 동아리를 맨 앞으로
  clubs.sort((a, b) => {
    if (a.isMine) return -1;
    if (b.isMine) return 1;
    return 0;
  });
  
  renderClubs();
}

// ============================================
// 동아리 렌더링
// ============================================

function renderClubs() {
  const grid = document.getElementById('clubsGrid');
  
  if (clubs.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎭</div>
        <div class="empty-state-text">등록된 동아리가 없습니다</div>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = clubs.map(club => `
    <div class="club-card ${club.isMine ? 'my-club' : ''}" onclick="goToDetail(${club.id})">
      <div class="club-logo">
        ${club.logo ? `<span class="club-logo-placeholder">${club.logo}</span>` : ''}
      </div>
      
      <div class="club-divider"></div>
      
      <div class="club-info">
        <h3 class="club-name">${club.name}</h3>
        <p class="club-subtitle">${club.subtitle}</p>
        <p class="club-description">${club.description}</p>
        <div class="club-tags">
          ${club.tags.map(tag => `<span class="club-tag">${tag}</span>`).join('')}
        </div>
      </div>
      
      <div class="club-arrow">
        <span class="club-arrow-icon">→</span>
      </div>
    </div>
  `).join('');
}

// ============================================
// 필터링
// ============================================

function setupFilters() {
  // 필터 탭
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      currentFilter = tab.dataset.filter;
      applyFilters();
    });
  });
  
  // 정렬 버튼
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentSort = btn.dataset.sort;
      applySort();
    });
  });
}

function applyFilters() {
  // TODO: 실제 필터링 로직
  console.log('필터 적용:', currentFilter);
  
  // 지금은 모든 동아리 표시
  renderClubs();
}

function applySort() {
  console.log('정렬 적용:', currentSort);
  
  const myClub = clubs.find(c => c.isMine);
  const otherClubs = clubs.filter(c => !c.isMine);
  
  // 정렬
  if (currentSort === 'name') {
    otherClubs.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  } else if (currentSort === 'name-desc') {
    otherClubs.sort((a, b) => b.name.localeCompare(a.name, 'ko'));
  } else if (currentSort === 'members') {
    otherClubs.sort((a, b) => b.members - a.members);
  }
  
  // 내 동아리 + 정렬된 동아리
  clubs = myClub ? [myClub, ...otherClubs] : otherClubs;
  
  renderClubs();
}

// ============================================
// 상세 페이지 이동
// ============================================

function goToDetail(clubId) {
  console.log('동아리 상세 페이지 이동:', clubId);
  navigateTo(`club_detail.html?id=${clubId}`);
}

// ============================================
// TOP 버튼
// ============================================

function setupTopButton() {
  const topButton = document.getElementById('topButton');
  
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

console.log('clubs/list.js 로드 완료');