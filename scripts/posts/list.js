// 게시물 목록 메인 로직

//=========상태 관리=========
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;
let allPosts = [];
let currentFilter = 'all';
let currentSort = 'latest';

//=========상수=========
const POSTS_PER_PAGE = 10;

//=========더미 데이터 (API 실패 시 fallback)=========
const dummyPosts = [
  {
    postId: 1,
    title: '안녕하세요 시진 포함입니다.',
    content: '시진 포함 게시글입니다. 테스트 중입니다.',
    image: '📸',
    type: 'general',
    authorName: '배기배기',
    authorAvatar: '👤',
    likes: 15,
    comments: 3,
    views: 42,
    createdAt: '2025-11-19T15:35:11',
  },
  {
    postId: 2,
    title: '안녕하세요',
    content: '일반 게시글입니다. 이미지가 없는 게시글 예시입니다.',
    image: null,
    type: 'general',
    authorName: '배기배기',
    authorAvatar: '👤',
    likes: 8,
    comments: 1,
    views: 28,
    createdAt: '2025-11-19T15:34:30',
  },
  {
    postId: 3,
    title: '[공지] 2024 겨울 정기공연 안내',
    content: '12월 20일 학생회관 대강당에서 2024 겨울 정기공연이 열립니다. 많은 관심 부탁드립니다!',
    image: '🎭',
    type: 'notice',
    authorName: '운영진',
    authorAvatar: '⭐',
    likes: 45,
    comments: 12,
    views: 230,
    createdAt: '2025-11-18T10:00:00',
  },
  {
    postId: 4,
    title: '[행사] 전국 대학 댄스 페스티벌 참가 모집',
    content: '2024년 전국 대학 댄스 페스티벌에 참가할 멤버를 모집합니다. 관심 있으신 분들은 신청해주세요!',
    image: '🏆',
    type: 'event',
    authorName: 'TIPSSY',
    authorAvatar: '🎭',
    likes: 67,
    comments: 23,
    views: 456,
    createdAt: '2025-11-17T14:20:00',
  },
  {
    postId: 5,
    title: '첫 공연 후기',
    content: '지난 주말에 있었던 신입생 환영 공연 정말 재미있었어요! 다음 공연도 기대됩니다.',
    image: '🎤',
    type: 'general',
    authorName: '신입생A',
    authorAvatar: '👤',
    likes: 23,
    comments: 8,
    views: 134,
    createdAt: '2025-11-16T18:45:00',
  },
  {
    postId: 6,
    title: '[행사] 합동 연습 공지',
    content: '이번 주 토요일 오후 2시, 연습실에서 합동 연습이 있습니다. 모든 멤버 참석 부탁드립니다.',
    image: '💃',
    type: 'event',
    authorName: '부회장',
    authorAvatar: '⭐',
    likes: 34,
    comments: 15,
    views: 189,
    createdAt: '2025-11-15T09:30:00',
  },
  {
    postId: 7,
    title: '춤 연습 팁 공유합니다',
    content: '5년차 댄서가 알려주는 기초 스텝 마스터하기! 초보자분들께 도움이 되었으면 좋겠습니다.',
    image: '🕺',
    type: 'general',
    authorName: '베테랑댄서',
    authorAvatar: '👤',
    likes: 56,
    comments: 19,
    views: 312,
    createdAt: '2025-11-14T16:20:00',
  },
  {
    postId: 8,
    title: '[공지] 동아리 회비 납부 안내',
    content: '2024년 하반기 회비 납부 기한이 11월 30일까지입니다. 기한 내 납부 부탁드립니다.',
    image: '💰',
    type: 'notice',
    authorName: '총무',
    authorAvatar: '⭐',
    likes: 12,
    comments: 5,
    views: 167,
    createdAt: '2025-11-13T11:00:00',
  },
  {
    postId: 9,
    title: '저번 주 공연 사진 공유',
    content: '지난주 공연 현장 사진입니다! 다들 너무 멋있었어요 🔥',
    image: '📷',
    type: 'general',
    authorName: '사진부',
    authorAvatar: '📸',
    likes: 89,
    comments: 27,
    views: 402,
    createdAt: '2025-11-12T20:15:00',
  },
  {
    postId: 10,
    title: '[행사] 신입생 오디션 안내',
    content: '2025년 상반기 신입생 오디션을 진행합니다. 1월 10일 오후 3시, 연습실에서 뵙겠습니다!',
    image: '🎯',
    type: 'event',
    authorName: '회장',
    authorAvatar: '⭐',
    likes: 78,
    comments: 31,
    views: 521,
    createdAt: '2025-11-11T14:00:00',
  },
  {
    postId: 11,
    title: '오늘 연습 너무 즐거웠어요!',
    content: '오늘 배운 새로운 안무 너무 멋있네요. 다음주가 벌써 기대됩니다 ㅎㅎ',
    image: '✨',
    type: 'general',
    authorName: '신입생B',
    authorAvatar: '👤',
    likes: 18,
    comments: 6,
    views: 93,
    createdAt: '2025-11-10T21:30:00',
  },
  {
    postId: 12,
    title: '[공지] 정기 총회 일정 공지',
    content: '12월 5일 저녁 7시, 학생회관 소강당에서 정기 총회가 진행됩니다. 전 회원 참석 바랍니다.',
    image: '📋',
    type: 'notice',
    authorName: '운영진',
    authorAvatar: '⭐',
    likes: 25,
    comments: 8,
    views: 145,
    createdAt: '2025-11-09T10:30:00',
  }
];

//=========렌더링=========
// 게시물 카드 HTML 생성 (새 스타일)
function createPostCardHTML(post) {
  const typeBadge = post.type && post.type !== 'general' 
    ? `<div class="post-type-badge ${post.type}">
         ${post.type === 'notice' ? '공지' : '행사'}
       </div>`
    : '';
  
  const image = post.image 
    ? `<div class="post-image-placeholder">${post.image}</div>`
    : '<div class="post-image-placeholder">📄</div>';
  
  return `
    <div class="post-card" data-id="${post.postId}">
      ${typeBadge}
      
      <div class="post-image">
        ${image}
      </div>
      
      <div class="post-divider"></div>
      
      <div class="post-content">
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${post.content || ''}</p>
        
        <div class="post-meta">
          <div class="post-author">
            <span class="author-avatar">${post.authorAvatar || '👤'}</span>
            <span>${post.authorName || '익명'}</span>
          </div>
          
          <div class="post-stats">
            <span class="stat-item">❤️ ${post.likes || 0}</span>
            <span class="stat-item">💬 ${post.comments || 0}</span>
            <span class="stat-item">👁️ ${post.views || 0}</span>
          </div>
          
          <span class="post-date">${formatDate(post.createdAt)}</span>
        </div>
      </div>
      
      <div class="post-arrow">
        <span class="post-arrow-icon">→</span>
      </div>
    </div>
  `;
}

// 게시물 목록 렌더링
function renderPosts(posts) {
  console.log('게시글 렌더링:', posts.length, '개');
  
  const container = document.getElementById('postsContainer');
  
  posts.forEach(post => {
    const cardHTML = createPostCardHTML(post);
    container.insertAdjacentHTML('beforeend', cardHTML);
  });
}

// 빈 게시물 UI 렌더링
function renderEmptyState() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📝</div>
      <div class="empty-state-text">아직 게시글이 없습니다</div>
    </div>
  `;
}

// 에러 UI 렌더링
function renderErrorState() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-text">게시글을 불러오는데 실패했습니다</div>
      <button class="btn btn-primary" onclick="location.reload()" style="width: auto; margin-top: 20px;">
        다시 시도
      </button>
    </div>
  `;
}

// 추가 게시물 없는 상태의 UI 렌더링
function renderEndMessage() {
  const container = document.getElementById('postsContainer');
  const endMessage = document.createElement('div');
  endMessage.className = 'end-message';
  endMessage.style.textAlign = 'center';
  endMessage.style.padding = '40px';
  endMessage.style.color = '#999';
  endMessage.textContent = '모든 게시글을 불러왔습니다';
  container.appendChild(endMessage);
}

//=========필터링 & 정렬=========
function setupFilters() {
  // 필터 탭
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      currentFilter = tab.dataset.filter;
      applyFiltersAndSort();
    });
  });
  
  // 정렬 버튼
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentSort = btn.dataset.sort;
      applyFiltersAndSort();
    });
  });
}

function applyFiltersAndSort() {
  console.log('필터/정렬 적용:', currentFilter, currentSort);
  
  // 필터링
  let filteredPosts = [...allPosts];
  
  if (currentFilter !== 'all') {
    filteredPosts = filteredPosts.filter(post => post.type === currentFilter);
  }
  
  // 정렬
  if (currentSort === 'latest') {
    filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (currentSort === 'popular') {
    filteredPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (currentSort === 'views') {
    filteredPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
  }
  
  // 컨테이너 초기화 후 재렌더링
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  
  if (filteredPosts.length === 0) {
    renderEmptyState();
    return;
  }
  
  // 첫 페이지만 표시
  currentPage = 1;
  hasMorePosts = filteredPosts.length > POSTS_PER_PAGE;
  
  const firstPagePosts = filteredPosts.slice(0, POSTS_PER_PAGE);
  renderPosts(firstPagePosts);
}

//=========이벤트 핸들러=========
// 게시글 작성 버튼 클릭 이벤트
function setupWriteButtonEvent() {
  const writeBtn = document.querySelector('.btn-post');
  if (!writeBtn) return;
  
  writeBtn.addEventListener('click', function() {
    navigateTo('post_create.html');
  });
}

// 행사작성 버튼 클릭 이벤트
function setupWriteButtonEvent() {
  const writeBtn = document.querySelector('.btn-event');
  if (!writeBtn) return;
  
  writeBtn.addEventListener('click', function() {
    navigateTo('event_create.html');
  });
}

// 게시글 카드 클릭 이벤트
function setupCardClickEvents() {
  const container = document.getElementById('postsContainer');
  
  if (container.dataset.eventAttached) return;
  
  container.addEventListener('click', function(e) {
    const card = e.target.closest('.post-card');
    if (card) {
      const postId = card.dataset.id;
      console.log('게시글 클릭:', postId);
      navigateTo(`post_detail.html?id=${postId}`);
    }
  });
  
  container.dataset.eventAttached = 'true';
}

// 무한 스크롤 이벤트
function setupInfinityScroll() {
  window.addEventListener('scroll', function() {
    if (isLoading || !hasMorePosts) return;
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - 100) {
      loadMorePosts();
    }
  });
}

// 초기 게시글 로드
function loadMorePosts() {
  if (isLoading || !hasMorePosts) return;
  
  isLoading = true;
  showLoading();
  
  console.log(`페이지 ${currentPage + 1} 로드 중`);
  
  const startIndex = currentPage * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  
  if (startIndex >= allPosts.length) {
    console.log('더 이상 게시글이 없습니다');
    hasMorePosts = false;
    hideLoading();
    isLoading = false;
    renderEndMessage();
    return;
  }
  
  setTimeout(() => {
    const nextPagePosts = allPosts.slice(startIndex, endIndex);
    
    currentPage++;
    hideLoading();
    renderPosts(nextPagePosts);
    isLoading = false;
    
    console.log(`페이지 ${currentPage} 로드 완료 (${nextPagePosts.length}개)`);
  }, 500);
}

//=========데이터 로드=========
async function loadInitialPosts() {
  console.log('초기 게시글 로드 중...');
  
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  
  showLoading();
  
  try {
    const response = await getPosts();
    allPosts = response.data || [];
    
    // API 데이터가 비어있으면 더미 데이터 사용
    if (allPosts.length === 0) {
      console.log('⚠️ API 데이터 없음 - 더미 데이터 사용');
      allPosts = [...dummyPosts];
    }
    
    console.log('게시글 로드 완료:', allPosts.length, '개');
    
    if (allPosts.length === 0) {
      hideLoading();
      renderEmptyState();
      hasMorePosts = false;
      return;
    }
    
    // 최신순 정렬
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const firstPagePosts = allPosts.slice(0, POSTS_PER_PAGE);
    
    hideLoading();
    renderPosts(firstPagePosts);
    
    if (allPosts.length <= POSTS_PER_PAGE) {
      hasMorePosts = false;
    }
    
    console.log(`초기 로드 완료 (전체: ${allPosts.length}개, 표시: ${firstPagePosts.length}개)`);
    
  } catch (error) {
    console.error('게시글 로드 실패:', error);
    
    // API 실패 시 더미 데이터로 fallback
    console.log('⚠️ API 실패 - 더미 데이터로 대체');
    allPosts = [...dummyPosts];
    
    hideLoading();
    
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const firstPagePosts = allPosts.slice(0, POSTS_PER_PAGE);
    renderPosts(firstPagePosts);
    
    if (allPosts.length <= POSTS_PER_PAGE) {
      hasMorePosts = false;
    }
  }
}

//=========초기화=========
async function init() {
  console.log('게시글 목록 페이지 초기화 중');
  
  setupWriteButtonEvent();
  setupCardClickEvents();
  setupInfinityScroll();
  setupFilters(); // 필터 추가
  
  await loadInitialPosts();
  
  console.log('✅ 게시글 목록 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/list.js 로드 완료');