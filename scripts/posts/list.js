// 게시글 목록 페이지

const DEFAULT_POST_IMAGE = '📄';
const DEFAULT_EVENT_IMAGE = '🎉';
const POSTS_PER_PAGE = 10;

let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;
let allPosts = [];
let displayedPosts = [];
let myClubs = [];
let currentClubFilter = 'all';
let currentTypeFilter = 'all';
let currentSort = 'latest';

// 초기 데이터 로드
async function loadInitialData() {
  showLoading();

  try {
    const postsResp = await getPosts();
    allPosts = postsResp.data || [];
  } catch (err) {
    console.error('게시글 로드 실패:', err);
    allPosts = [];
  }

  try {
    await loadMyClubs();
  } catch (err) {
    console.warn('동아리 로드 실패:', err);
  }

  hideLoading();
  applyFiltersAndSortAndRender(true);
}

// 동아리 목록 로드
async function loadMyClubs() {
  const wrapper = document.querySelector('.custom-select[data-target="clubFilter"]');
  const hiddenSelect = document.getElementById('clubFilter');

  if (!hiddenSelect) {
    const sel = document.createElement('select');
    sel.id = 'clubFilter';
    sel.style.display = 'none';
    document.body.appendChild(sel);
  }

  const hidden = document.getElementById('clubFilter');
  const menu = wrapper ? wrapper.querySelector('.custom-select-menu') : null;

  hidden.innerHTML = `<option value="all">전체</option>`;
  if (menu) menu.innerHTML = `<div class="custom-select-option" data-value="all">전체</div>`;

  try {
    const resp = await getMyClubs();
    myClubs = resp.data || [];

    console.log('동아리 목록 로드:', myClubs.length, '개');

    if (myClubs.length > 0) {
      myClubs.forEach((c) => {
        const id = c.clubId ?? c.id;
        const name = c.clubName || c.name || c.title || `클럽 ${id}`;

        const opt = document.createElement('option');
        opt.value = String(id);
        opt.textContent = name;
        hidden.appendChild(opt);

        if (menu) {
          const div = document.createElement('div');
          div.className = 'custom-select-option';
          div.dataset.value = String(id);
          div.textContent = name;
          menu.appendChild(div);
        }
      });
    }

    if (window.initCustomSelects) {
      console.log('커스텀 셀렉트 초기화');
      window.initCustomSelects();
    }

    setupClubCustomSelectBehavior();

  } catch (err) {
    console.error('동아리 로드 실패:', err);
    if (window.initCustomSelects) window.initCustomSelects();
    setupClubCustomSelectBehavior();
  }
}

// 좋아요 토글
async function toggleLike(postId) {
  try {
    const response = await apiRequest(`/posts/${postId}/like`, {
      method: 'POST'
    });
    
    console.log('좋아요 토글 성공');
    
    const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
    if (!likeBtn) return;
    
    const isLiked = response.data.isLiked;
    const likeCount = response.data.likeCount;
    
    const icon = likeBtn.querySelector('.like-icon');
    icon.textContent = isLiked ? '❤️' : '🤍';
    
    const count = likeBtn.querySelector('.like-count');
    count.textContent = likeCount;
    
    if (isLiked) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
    
  } catch (error) {
    console.error('좋아요 실패:', error);
    
    if (error.status === 401) {
      showToast('로그인이 필요합니다', 2000, 'error');
    } else {
      showToast('좋아요 처리 중 오류가 발생했습니다', 2000, 'error');
    }
  }
}

// 게시글 카드 HTML 생성
function createPostCardHTML(post) {
  const isEvent = post.eventId || post.type === 'event';
  const typeBadge = isEvent
    ? `<div class="post-type-badge event">행사</div>`
    : '';

  let imageHTML = '';
  if (post.images && post.images.length > 0) {
    const imageUrl = getImageUrl(post.images[0]);
    const fallbackIcon = isEvent ? DEFAULT_EVENT_IMAGE : DEFAULT_POST_IMAGE;
    imageHTML = `<img src="${imageUrl}" alt="${escapeHtml(post.title)}" onerror="this.parentElement.innerHTML='<div class=\\'post-image-placeholder\\'>${fallbackIcon}</div>'">`;
  } else {
    const defaultIcon = isEvent ? DEFAULT_EVENT_IMAGE : DEFAULT_POST_IMAGE;
    imageHTML = `<div class="post-image-placeholder">${defaultIcon}</div>`;
  }

  const authorName = post.author?.username || post.authorName || '익명';
  let authorAvatarHTML = '👤';
  
  if (post.author?.profileImage) {
    const profileUrl = `${API_BASE_URL}${post.author.profileImage}`;
    authorAvatarHTML = `<img src="${profileUrl}" alt="${escapeHtml(authorName)}" class="author-avatar-img" onerror="this.outerHTML='👤'">`;
  }

  const isLiked = post.isLiked || false;
  const likeClass = isLiked ? 'liked' : '';
  const likeIcon = isLiked ? '❤️' : '🤍';

  const dateStr = formatRelativeTime(post.createdAt);

  return `
    <div class="post-card" data-id="${post.postId || post.id}" data-event-id="${post.eventId || ''}">
      ${typeBadge}
      <div class="post-image">${imageHTML}</div>
      <div class="post-divider"></div>
      <div class="post-content">
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <p class="post-excerpt">${escapeHtml(post.content || '')}</p>
        <div class="post-meta">
          <div class="post-author">
            <span class="author-avatar">${authorAvatarHTML}</span>
            <span>${escapeHtml(authorName)}</span>
          </div>
          <div class="post-stats">
            <button class="stat-item like-btn ${likeClass}" data-post-id="${post.postId || post.id}">
              <span class="like-icon">${likeIcon}</span>
              <span class="like-count">${post.likeCount || post.likes || 0}</span>
            </button>
            <span class="stat-item right">💬 ${post.commentCount || post.comments || 0}</span>
            <span class="stat-item right">👁️ ${post.viewCount || post.views || 0}</span>
          </div>
          <span class="post-date">${dateStr}</span>
        </div>
      </div>
      <div class="post-arrow">
        <span class="post-arrow-icon">→</span>
      </div>
    </div>
  `;
}

// 게시글 목록 렌더링
function renderPosts(posts, replace = false) {
  const container = document.getElementById('postsContainer');
  if (replace) container.innerHTML = '';

  if (!posts || posts.length === 0) {
    if (replace) renderEmptyState();
    return;
  }

  posts.forEach(p => {
    container.insertAdjacentHTML('beforeend', createPostCardHTML(p));
  });

  setupCardClickEvents();
}

// 빈 상태 렌더링
function renderEmptyState() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📝</div>
      <div class="empty-state-text">아직 게시글이 없습니다</div>
    </div>
  `;
}

// 끝 메시지 렌더링
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

// 히어로 메시지 업데이트
function updateHeroMessage() {
  const subtitle = document.getElementById('heroSubtitle');
  if (!subtitle) return;
  
  const clubName = getSelectedClubName();
  subtitle.innerHTML = `${clubName} <span class="highlight">게시판</span>입니다.`;
}

// 이미지 URL 생성
function getImageUrl(imageData) {
  if (!imageData) return null;
  
  let imagePath = imageData.url || imageData.imageUrl || imageData;
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${API_BASE_URL}${imagePath}`;
}

// 필터 및 정렬 적용
function applyFiltersAndSortAndRender(replace = true) {
  console.log('필터/정렬 적용:', { currentClubFilter, currentTypeFilter, currentSort });
  
  updateHeroMessage();
  
  let filtered = [...allPosts];

  // 클럽 필터
  if (currentClubFilter && currentClubFilter !== 'all') {
    filtered = filtered.filter(p => String(p.clubId) === String(currentClubFilter));
  }

  // 타입 필터
  if (currentTypeFilter && currentTypeFilter !== 'all') {
    if (currentTypeFilter === 'event') {
      filtered = filtered.filter(p => p.type === 'event');
    } else if (currentTypeFilter === 'post') {
      filtered = filtered.filter(p => p.type !== 'event');
    }
  }

  // 정렬
  if (currentSort === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (currentSort === 'popular') {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else if (currentSort === 'views') {
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  // 페이지네이션 초기화
  currentPage = 1;
  hasMorePosts = filtered.length > POSTS_PER_PAGE;
  displayedPosts = filtered.slice(0, POSTS_PER_PAGE);

  // 렌더링
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';
  
  if (displayedPosts.length === 0) {
    renderEmptyState();
    return;
  }
  
  renderPosts(displayedPosts, true);
}

// 더 보기 (무한 스크롤)
function loadMorePosts() {
  if (isLoading || !hasMorePosts) return;

  isLoading = true;
  showLoading();

  const start = currentPage * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;

  setTimeout(() => {
    let source = [...allPosts];

    // 필터 적용
    if (currentClubFilter && currentClubFilter !== 'all') {
      source = source.filter(p => String(p.clubId) === String(currentClubFilter));
    }
    if (currentTypeFilter && currentTypeFilter !== 'all') {
      if (currentTypeFilter === 'event') {
        source = source.filter(p => p.type === 'event');
      } else {
        source = source.filter(p => p.type !== 'event');
      }
    }

    // 정렬 적용
    if (currentSort === 'latest') {
      source.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentSort === 'popular') {
      source.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (currentSort === 'views') {
      source.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    const next = source.slice(start, end);
    
    if (next.length === 0) {
      hasMorePosts = false;
      renderEndMessage();
      hideLoading();
      isLoading = false;
      return;
    }

    renderPosts(next);
    currentPage++;
    hideLoading();
    isLoading = false;
  }, 400);
}

// 타입 필터 탭
function setupFilterTabs() {
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      currentTypeFilter = tab.dataset.filter || 'all';
      applyFiltersAndSortAndRender();
    });
  });
}

// 정렬 버튼
function setupSortButtons() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentSort = btn.dataset.sort || 'latest';
      applyFiltersAndSortAndRender();
    });
  });
}

// 카드 클릭 이벤트 (이벤트 위임)
function setupCardClickEvents() {
  const container = document.getElementById('postsContainer');
  if (!container) return;
  if (container.dataset.attach === 'true') return;

  container.addEventListener('click', function(e) {
    // 좋아요 버튼 클릭
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
      e.stopPropagation();
      const postId = likeBtn.dataset.postId;
      toggleLike(postId);
      return;
    }
    
    // 카드 클릭 (상세 페이지 이동)
    const card = e.target.closest('.post-card');
    if (card) {
      const postId = card.dataset.id;
      const eventId = card.dataset.eventId;
      
      if (eventId) {
        navigateTo(`event_detail.html?id=${eventId}`);
      } else {
        navigateTo(`post_detail.html?id=${postId}`);
      }
    }
  });

  container.dataset.attach = 'true';
}

// 무한 스크롤
function setupInfinityScroll() {
  window.addEventListener('scroll', function() {
    if (isLoading || !hasMorePosts) return;
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - 120) {
      loadMorePosts();
    }
  });
}

// 동아리 커스텀 셀렉트 이벤트
function setupClubCustomSelectBehavior() {
  const hidden = document.getElementById('clubFilter');
  if (!hidden) {
    console.warn('clubFilter 요소를 찾을 수 없음');
    return;
  }
  
  hidden.removeEventListener('change', handleClubChange);
  hidden.addEventListener('change', handleClubChange);
  
  console.log('동아리 필터 이벤트 핸들러 등록 완료');
}

// 동아리 필터 변경 핸들러
function handleClubChange(e) {
  const newValue = e.target.value || 'all';
  console.log('동아리 필터 변경:', newValue);
  
  currentClubFilter = newValue;
  applyFiltersAndSortAndRender();
}

async function initPostListPage() {
  console.log('게시글 목록 페이지 초기화');

  setupFilterTabs();
  setupSortButtons();
  setupInfinityScroll();
  setupCardClickEvents();

  await loadInitialData();

  console.log('게시글 목록 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPostListPage);
} else {
  initPostListPage();
}

console.log('posts/list.js 로드 완료');