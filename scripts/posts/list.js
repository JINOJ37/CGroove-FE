// 게시물 목록 메인 로직

const mockPosts = [
  {
    id: 1,
    title: '첫 번째 게시글입니다',
    author: '홍길동',
    likes: 1234,
    comments: 56,
    views: 9876,
    createdAt: '2025-11-11T10:30:00Z'
  },
  {
    id: 2,
    title: '이것은 매우 긴 제목을 가진 게시글인데 26자를 넘어가면 잘려야 합니다 테스트',
    author: '김철수',
    likes: 500,
    comments: 12,
    views: 3450,
    createdAt: '2025-11-10T15:20:00Z'
  },
  {
    id: 3,
    title: '인기 게시글',
    author: '이영희',
    likes: 15000,
    comments: 234,
    views: 120000,
    createdAt: '2025-11-09T09:10:00Z'
  },
  {
    id: 4,
    title: '일반 게시글',
    author: '박민수',
    likes: 100,
    comments: 5,
    views: 800,
    createdAt: '2025-11-08T14:50:00Z'
  },
  {
    id: 5,
    title: 'JavaScript 꿀팁 공유',
    author: '배기',
    likes: 2500,
    comments: 45,
    views: 18000,
    createdAt: '2025-11-07T11:30:00Z'
  }
];

// 상태
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;

// 게시글 카드 HTML 생성
function createPostCardHTML(post) {
  return `
    <article class="post-card" data-id="${post.id}">
      <h3 class="post-title">${truncateTitle(post.title)}</h3>
      <div class="post-stats">
        <div class="stat-item">
          <span class="stat-text">좋아요 ${formatNumber(post.likes)}</span>
        </span>
        <span class="stat-item">
          <span class="stat-text">댓글 ${formatNumber(post.comments)}</span>
        </span>
        <span class="stat-item">
          <span class="stat-text">조회수 ${formatNumber(post.views)}</span>
        </div>
        <span class="post-date">${formatDate(post.createdAt)}</span>
      </div>
      <div class="post-footer">
        <div class="post-author">
          <span class="author-avatar">👤</span>
          <span class="author-name">${post.author}</span>
        </div>
      </div>
    </article>
  `;
}

// 게시글 목록 렌더링
function renderPosts(posts) {
  console.log('게시글 목록 : 렌더링 중 -', posts.length, '개');
  
  posts.forEach(post => {
    const cardHTML = createPostCardHTML(post);
    document.getElementById('postsContainer').insertAdjacentHTML('beforeend', cardHTML);
  });
  
  setupCardClickEvents();
}

// 게시글 카드 클릭 이벤트
function setupCardClickEvents() {
  console.log('게시물 목록 : 카드 클릭 처리 중');
  const container = document.getElementById('postsContainer');
  
  if (container.dataset.eventAttached) return;
  
  container.addEventListener('click', function(e) {
    const card = e.target.closest('.post-card');
    if (card) {
      const postId = card.dataset.id;      
      alert(`게시글 ${postId}번 클릭!\n\nPhase 2에서 상세 페이지로 이동합니다.`);
    }
  });
  
  container.dataset.eventAttached = 'true';
}

// 게시글 작성 버튼 클릭 이벤트
function setupWriteButtonEvent() {
  console.log('게시물 목록 : 게시물 작성 버튼 클릭 처리 중');
  
  const writeBtn = document.querySelector('.btn-write');
  if (writeBtn) {
    writeBtn.addEventListener('click', function() {      
      setTimeout(() => {
        navigateTo('post_create.html');
      }, 0);
    });
  }
}

// 무함 스크롤 이벤트
function setupInfinityScroll() {
  console.log('게시물 목록 : 게시물 무한 스크롤 처리 중');
  
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

// 추가 게시글 로드
function loadMorePosts() {
  if (isLoading) return;
  
  isLoading = true;
  showLoading();
  
  console.log(`게시물 목록 : 페이지 ${currentPage + 1} 로드 중`);
  
  setTimeout(() => {
    currentPage++;
    
    if (currentPage > 3) {
      console.log('더 이상 게시글이 없습니다');
      hasMorePosts = false;
      hideLoading();
      isLoading = false;
      
      const container = document.getElementById('postsContainer');
      const endMessage = document.createElement('div');
      endMessage.style.textAlign = 'center';
      endMessage.style.padding = '40px';
      endMessage.style.color = '#999';
      endMessage.textContent = '모든 게시글을 불러왔습니다';
      container.appendChild(endMessage);
      return;
    }
    
    const newPosts = [
      {
        id: currentPage * 10 + 1,
        title: `${currentPage}페이지 게시글 1`,
        author: '사용자' + (currentPage * 10 + 1),
        likes: Math.floor(Math.random() * 5000),
        comments: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 10000),
        createdAt: new Date().toISOString()
      },
      {
        id: currentPage * 10 + 2,
        title: `${currentPage}페이지 게시글 2`,
        author: '사용자' + (currentPage * 10 + 2),
        likes: Math.floor(Math.random() * 5000),
        comments: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 10000),
        createdAt: new Date().toISOString()
      }
    ];
    
    hideLoading();
    renderPosts(newPosts);
    isLoading = false;
  }, 1000);
}

// 초기 게시글 로드
function loadInitialPosts() {  
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  
  renderPosts(mockPosts);
  
  console.log('='.repeat(50));
  console.log('');
}

// 모든 이벤트 초기화
function initAllEvents() {  
  setupWriteButtonEvent();
  setupCardClickEvents();
  setupInfinityScroll();
}

// 초기화
function init() {  
  initAllEvents();
  loadInitialPosts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/list.js 로드 완료');