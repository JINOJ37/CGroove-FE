// 게시물 목록 메인 로직

// 상태
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;
let allPosts = [];

// 게시글 카드 HTML 생성
function createPostCardHTML(post) {
  return `
    <article class="post-card" data-id="${post.id}">
      <h3 class="post-title">${truncateTitle(post.title)}</h3>
      <div class="post-stats">
        <div class="stat-item">
          <span class="stat-text">좋아요 ${formatNumber(post.likes || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-text">댓글 ${formatNumber(post.comments || 0)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-text">조회수 ${formatNumber(post.views || 0)}</span>
        </div>
        <span class="post-date">${formatDate(post.createdAt)}</span>
      </div>
      <div class="post-footer">
        <div class="post-author">
          <span class="author-avatar">👤</span>
          <span class="author-name">${post.author || post.authorName || '익명'}</span>
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
      console.log('게시글 클릭:', postId);
      
      localStorage.setItem('selectedPostId', postId);
      
      setTimeout(() => {
        navigateTo('post_detail.html');
      }, 0);
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

// 무한 스크롤 이벤트
function setupInfinityScroll() {
  console.log('게시물 목록 : 게시물 무한 스크롤 처리 중');
  
  window.addEventListener('scroll', function() {
    if (isLoading || !hasMorePosts) return;
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // 하단에 100px 남았을 때 다음 페이지 로드
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
async function loadInitialPosts() {
  console.log('📋 초기 게시글 로드 중...');
  
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  
  showLoading();
  
  try {
    const response = await getPosts();
    
    console.log('✅ 게시글 목록 조회 성공:', response);
    
    // 전체 게시글 저장
    allPosts = response.data || [];
    
    // 게시글이 없으면
    if (allPosts.length === 0) {
      hideLoading();
      container.innerHTML = `
        <div style="text-align: center; padding: 80px 20px; color: #999;">
          <p style="font-size: 18px; margin-bottom: 20px;">아직 게시글이 없습니다</p>
          <p>첫 번째 게시글을 작성해보세요!</p>
        </div>
      `;
      hasMorePosts = false;
      return;
    }
    
    // 최신순 정렬 (createdAt 기준)
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 첫 페이지 데이터 (10개)
    const firstPagePosts = allPosts.slice(0, 10);
    
    hideLoading();
    renderPosts(firstPagePosts);
    
    // 10개 이하면 더 이상 로드할 게시글 없음
    if (allPosts.length <= 10) {
      hasMorePosts = false;
    }
    
    console.log(`✅ 초기 로드 완료 (전체: ${allPosts.length}개, 표시: ${firstPagePosts.length}개)`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 게시글 목록 로드 실패:', error);
    
    hideLoading();
    
    if (error.status === 401) {
      showToast('로그인이 필요합니다');
      setTimeout(() => navigateTo('login.html'), 1500);
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 80px 20px; color: #999;">
          <p style="font-size: 18px; margin-bottom: 20px;">게시글을 불러오는데 실패했습니다</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background: #7F6AEE; color: white; border: none; border-radius: 8px; cursor: pointer;">
            다시 시도
          </button>
        </div>
      `;
    }
  }
}

// 모든 이벤트 초기화
function initAllEvents() {  
  setupWriteButtonEvent();
  setupCardClickEvents();
  setupInfinityScroll();
}

// 초기화
async function init() {
  console.log('게시글 목록 페이지 초기화 중...');
  
  initAllEvents();
  await loadInitialPosts();
  
  console.log('게시글 목록 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/list.js 로드 완료');