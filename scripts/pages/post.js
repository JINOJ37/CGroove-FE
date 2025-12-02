// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { initCustomSelects } from '../common/component/customSelect.js';
import { navigateTo } from '../common/util/utils.js';
import { showLoading, hideLoading } from '../common/util/utils.js';
import { showToast } from '../common/util/utils.js';
import { formatRelativeTime } from '../common/util/format.js';
import { escapeHtml } from '../common/util/format.js';
import { getImageUrl } from '../common/util/image_util.js';
import { getPosts, togglePostLike } from '../common/api/post.js';
import { getEvents, toggleEventLike } from '../common/api/event.js';
import { getMyClubs } from '../common/api/club.js';
import { API_BASE_URL } from '../common/api/core.js';

// ==================== 상수 ====================

const DEFAULT_POST_IMAGE = '📄';
const DEFAULT_EVENT_IMAGE = '🎉';
const POSTS_PER_PAGE = 10;

// ==================== 상태 관리 ====================

let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;
let allPosts = [];
let displayedPosts = [];
let myClubs = [];
let currentClubFilter = 'all';
let currentTypeFilter = 'all';
let currentSort = 'latest';

// ==================== API 호출 ====================

async function loadInitialData() {
  showLoading();

  try {
    const [postsResp, eventsResp] = await Promise.all([
      getPosts(),
      getEvents()
    ]);
    
    const posts = (postsResp.data || []).map(p => ({
      ...p,
      type: 'post',
      id: p.postId || p.id,
      displayId: p.postId || p.id
    }));
    
    const events = (eventsResp.data || []).map(e => ({
      ...e,
      type: 'event',
      id: e.eventId || e.id,
      displayId: e.eventId || e.id,
      postId: null,
      eventId: e.eventId || e.id,
      likes: e.likeCount || 0,
      comments: e.participantCount || 0,
      views: e.viewCount || 0
    }));
    
    allPosts = [...posts, ...events];
    
    console.log('데이터 로드:', posts.length, '개 포스트,', events.length, '개 행사');
    
  } catch (err) {
    console.error('데이터 로드 실패:', err);
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

    initCustomSelects();
    setupClubCustomSelectBehavior();

  } catch (err) {
    console.error('동아리 로드 실패:', err);
    initCustomSelects();
    setupClubCustomSelectBehavior();
  }
}

async function toggleLike(itemId, itemType) {
  try {
    let response;
    
    if (itemType === 'event') {
      response = await toggleEventLike(itemId);
    } else {
      response = await togglePostLike(itemId);
    }
    
    console.log('좋아요 토글 성공');
    
    const likeBtn = document.querySelector(`.like-btn[data-id="${itemId}"][data-type="${itemType}"]`);
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

// ==================== UI 렌더링 ====================

function createPostCardHTML(item) {
  const isEvent = item.type === 'event';
  const typeBadge = isEvent
    ? `<div class="post-type-badge event">행사</div>`
    : '';

  // 1. 대표 이미지 처리
  let imageHTML = '';
  if (item.images && item.images.length > 0) {
    const imageUrl = getImageUrl(item.images[0]);
    const fallbackIcon = isEvent ? DEFAULT_EVENT_IMAGE : DEFAULT_POST_IMAGE;
    imageHTML = `<img src="${imageUrl}" alt="${escapeHtml(item.title)}" onerror="this.parentElement.innerHTML='<div class=\\'post-image-placeholder\\'>${fallbackIcon}</div>'">`;
  } else {
    const defaultIcon = isEvent ? DEFAULT_EVENT_IMAGE : DEFAULT_POST_IMAGE;
    imageHTML = `<div class="post-image-placeholder">${defaultIcon}</div>`;
  }

  let authorName = '익명';
  let profileImage = null;

  if (isEvent) {
    authorName = item.hostNickname || '익명';
    profileImage = item.hostProfileImage;
  } else {
    authorName = item.authorNickname || '익명';
    profileImage = item.authorProfileImage;
  }

  // 프로필 이미지 HTML 생성
  let authorAvatarHTML = '👤';
  if (profileImage) {
    const profileUrl = `${API_BASE_URL}${profileImage}`;
    authorAvatarHTML = `<img src="${profileUrl}" alt="${escapeHtml(authorName)}" class="author-avatar-img" onerror="this.outerHTML='👤'">`;
  }
  // ==========================================

  const isLiked = item.isLiked || false;
  const likeClass = isLiked ? 'liked' : '';
  const likeIcon = isLiked ? '❤️' : '🤍';

  const dateStr = formatRelativeTime(item.createdAt);
  
  // Event일 경우 참여자 수 표시
  const commentLabel = isEvent ? '참여' : '댓글';
  const commentCount = isEvent ? (item.participantCount || 0) : (item.commentCount || item.comments || 0);

  return `
    <div class="post-card" 
         data-id="${item.displayId}" 
         data-type="${item.type}">
      ${typeBadge}
      <div class="post-image">${imageHTML}</div>
      <div class="post-divider"></div>
      <div class="post-content">
        <h3 class="post-title">${escapeHtml(item.title)}</h3>
        <p class="post-excerpt">${escapeHtml(item.content || '')}</p>
        <div class="post-meta">
          <div class="post-author">
            <span class="author-avatar">${authorAvatarHTML}</span>
            <span>${escapeHtml(authorName)}</span>
          </div>
          <div class="post-stats">
            <button class="stat-item like-btn ${likeClass}" 
                    data-id="${item.displayId}" 
                    data-type="${item.type}">
              <span class="like-icon">${likeIcon}</span>
              <span class="like-count">${item.likeCount || item.likes || 0}</span>
            </button>
            <span class="stat-item right">${isEvent ? '👥' : '💬'} ${commentCount}</span>
            <span class="stat-item right">👁️ ${item.viewCount || item.views || 0}</span>
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
}

function renderEmptyState() {
  const container = document.getElementById('postsContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📝</div>
      <div class="empty-state-text">아직 게시글이 없습니다</div>
    </div>
  `;
}

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

function updateHeroMessage() {
  const subtitle = document.getElementById('heroSubtitle');
  if (!subtitle) return;
  
  const clubName = getSelectedClubName();
  subtitle.innerHTML = `${clubName} <span class="highlight">게시판</span>입니다.`;
}

function getSelectedClubName() {
  if (currentClubFilter === 'all') {
    return 'C.Groove';
  }
  
  const club = myClubs.find(c => String(c.clubId) === String(currentClubFilter));
  return club ? club.clubName : 'C.Groove';
}

// ==================== 필터 & 정렬 ====================

function applyFiltersAndSortAndRender(replace = true) {
  console.log('필터/정렬 적용:', { currentClubFilter, currentTypeFilter, currentSort });
  
  updateHeroMessage();
  
  let filtered = [...allPosts];

  // ✅ 클럽 필터
  if (currentClubFilter && currentClubFilter !== 'all') {
    filtered = filtered.filter(p => String(p.clubId) === String(currentClubFilter));
  }

  // ✅ 타입 필터
  if (currentTypeFilter && currentTypeFilter !== 'all') {
    filtered = filtered.filter(p => p.type === currentTypeFilter);
  }

  // ✅ 정렬
  if (currentSort === 'latest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (currentSort === 'popular') {
    filtered.sort((a, b) => {
      const aLikes = a.likeCount || a.likes || 0;
      const bLikes = b.likeCount || b.likes || 0;
      return bLikes - aLikes;
    });
  } else if (currentSort === 'views') {
    filtered.sort((a, b) => {
      const aViews = a.viewCount || a.views || 0;
      const bViews = b.viewCount || b.views || 0;
      return bViews - aViews;
    });
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
      source = source.filter(p => p.type === currentTypeFilter);
    }

    // 정렬 적용
    if (currentSort === 'latest') {
      source.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (currentSort === 'popular') {
      source.sort((a, b) => {
        const aLikes = a.likeCount || a.likes || 0;
        const bLikes = b.likeCount || b.likes || 0;
        return bLikes - aLikes;
      });
    } else if (currentSort === 'views') {
      source.sort((a, b) => {
        const aViews = a.viewCount || a.views || 0;
        const bViews = b.viewCount || b.views || 0;
        return bViews - aViews;
      });
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

// ==================== 이벤트 핸들러 ====================

function setupLogoClick() {
  const logoBtn = document.getElementById('logoBtn');
  if (logoBtn) {
    logoBtn.style.cursor = 'pointer';
    logoBtn.addEventListener('click', () => {
      navigateTo('main.html');
    });
  }
}

function setupActionButtons() {
  const createPostBtn = document.getElementById('createPostBtn');
  const createEventBtn = document.getElementById('createEventBtn');

  if (createPostBtn) {
    createPostBtn.addEventListener('click', () => {
      navigateTo('post_create.html');
    });
  }

  if (createEventBtn) {
    createEventBtn.addEventListener('click', () => {
      navigateTo('event_create.html');
    });
  }
}

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

function setupCardClickEvents() {
  const container = document.getElementById('postsContainer');
  if (!container) return;
  if (container.dataset.attached === 'true') return;

  container.addEventListener('click', function(e) {
    // ✅ 좋아요 버튼 클릭
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
      e.stopPropagation();
      const itemId = likeBtn.dataset.id;
      const itemType = likeBtn.dataset.type;
      toggleLike(itemId, itemType);
      return;
    }
    
    // ✅ 카드 클릭 (상세 페이지 이동)
    const card = e.target.closest('.post-card');
    if (card) {
      const itemId = card.dataset.id;
      const itemType = card.dataset.type;
      
      if (itemType === 'event') {
        navigateTo(`event_detail.html?id=${itemId}`);
      } else {
        navigateTo(`post_detail.html?id=${itemId}`);
      }
    }
  });

  container.dataset.attached = 'true';
  console.log('카드 클릭 이벤트 등록 완료');
}

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

function handleClubChange(e) {
  const newValue = e.target.value || 'all';
  console.log('동아리 필터 변경:', newValue);
  
  currentClubFilter = newValue;
  applyFiltersAndSortAndRender();
}

// ==================== 초기화 ====================

async function init() {
  console.log('게시글 목록 페이지 초기화');

  await initHeader();

  setupLogoClick();
  setupActionButtons();
  setupFilterTabs();
  setupSortButtons();
  setupInfinityScroll();
  setupCardClickEvents();

  await loadInitialData();

  console.log('게시글 목록 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/list.js 로드 완료');