// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { showLoading, hideLoading, showToast, navigateTo, smartBack, showModal } from '../common/util/utils.js';
import { formatDate, formatNumber, escapeHtml } from '../common/util/format.js';
import { getPost, deletePost, togglePostLike } from '../common/api/post.js';
import { getMyInfo } from '../common/api/user.js';
import { createComment, getComments, updateComment, deleteComment } from '../common/api/comment.js';
import { API_BASE_URL } from '../common/api/core.js';

// ==================== 상태 관리 ====================

let postData = null;
let currentUserId = null;
let isEditingComment = false;
let editingCommentId = null;

// ==================== API 호출 ====================

async function loadCurrentUser() {
  try {
    const response = await getMyInfo();
    currentUserId = response.data.userId;
    console.log('현재 사용자 ID:', currentUserId);
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
    currentUserId = null;
  }
}

async function loadPostData() {
  console.log('게시글 데이터 로드 중');
  
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  
  if (!postId) {
    showToast('게시글을 찾을 수 없습니다', 1500);
    setTimeout(() => navigateTo('post_list.html'), 1500);
    return;
  }
  
  showLoading();
  
  try {
    const response = await getPost(postId);
    postData = response.data;
    
    console.log('게시글 로드 완료:', postData.postId);
    
    hideLoading();
    
    updatePostUI();
    loadComments();
    
  } catch (error) {
    console.error('게시글 로드 실패:', error);
    hideLoading();
    
    if (error.status === 404) {
      showToast('존재하지 않는 게시글입니다', 1500);
    } else if (error.status === 401) {
      showToast('로그인이 필요합니다', 1500);
    } else {
      showToast('게시글을 불러오는데 실패했습니다', 1500);
    }
    
    setTimeout(() => navigateTo('post_list.html'), 1500);
  }
}

async function deletePostData() {
  try {
    showLoading();
    await deletePost(postData.postId);
    hideLoading();
    
    showToast('게시글이 삭제되었습니다', 1500);
    setTimeout(() => navigateTo('post_list.html'), 1500);
    
  } catch (error) {
    hideLoading();
    console.error('게시글 삭제 실패:', error);
    
    if (error.status === 403) {
      showToast('삭제 권한이 없습니다', 2000, 'error');
    } else if (error.status === 401) {
      showToast('로그인이 필요합니다', 2000, 'error');
    } else {
      showToast('게시글 삭제 중 오류가 발생했습니다', 2000, 'error');
    }
  }
}

async function toggleLike() {
  try {
    const response = await togglePostLike(postData.postId);
    
    // 서버 응답으로 상태 업데이트
    postData.isLiked = response.data.isLiked;
    postData.likeCount = response.data.likeCount; // 백엔드 필드명 확인 필요 (likes vs likeCount)
    
    updateLikeButton();
    updatePostStats();
    
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

function updatePostUI() {
  console.log('게시글 UI 업데이트');
  
  document.querySelector('.detail-title').textContent = postData.title;
  document.querySelector('.author-name').textContent = postData.authorNickname || '익명';
  document.querySelector('.post-date').textContent = formatDate(postData.createdAt);
  document.querySelector('.detail-text').textContent = postData.content;

  const avatarEl = document.querySelector('.author-avatar');
  if (avatarEl) {
    const profilePath = postData.authorProfileImage;
    if (profilePath) {
      avatarEl.innerHTML = `
        <img src="${API_BASE_URL}${profilePath}" 
             alt="프로필" 
             style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
      `;
    } else {
      avatarEl.textContent = '👤';
      avatarEl.style.background = 'none'; 
    }
  }
  
  updatePostImage();
  updatePostStats();
  updateLikeButton();
  updatePostActions();
}

function updatePostImage() {
  const imageContainer = document.querySelector('.detail-image-container');
  
  if (!postData.images || postData.images.length === 0) {
    imageContainer.style.display = 'none';
    return;
  }
  
  imageContainer.style.display = 'block';
  
  // 이미지가 1개일 때
  if (postData.images.length === 1) {
    imageContainer.innerHTML = `
      <img src="${API_BASE_URL}${postData.images[0]}" 
           alt="게시글 이미지" 
           class="detail-image"
           onerror="this.parentElement.style.display='none'">
    `;
    return;
  }
  
  // 이미지가 여러 개일 때 - 갤러리 구조
  const thumbnailsHTML = postData.images.map((img, index) => `
    <div class="image-thumbnail ${index === 0 ? 'active' : ''}" 
         data-index="${index}">
      <img src="${API_BASE_URL}${img}" 
           alt="썸네일 ${index + 1}"
           onerror="this.parentElement.style.display='none'">
    </div>
  `).join('');
  
  imageContainer.innerHTML = `
    <div class="image-gallery">
      <div class="main-image-wrapper">
        <img src="${API_BASE_URL}${postData.images[0]}" 
             alt="게시글 이미지" 
             class="detail-image"
             id="mainImage"
             onerror="this.style.display='none'">
        <div class="image-counter">
          <span id="currentImageIndex">1</span> / ${postData.images.length}
        </div>
      </div>
      <div class="image-thumbnails">
        ${thumbnailsHTML}
      </div>
    </div>
  `;
  
  // 썸네일 클릭 이벤트
  setupThumbnailEvents();
}

function updatePostStats() {
  const likeCount = postData.likeCount || 0;
  const viewCount = postData.viewCount || 0;
  
  document.getElementById('likeCount').textContent = formatNumber(likeCount);
  document.querySelector('.detail-stats .stat-item:nth-child(2) .stat-value').textContent = formatNumber(viewCount + 1);
  const commentCountEl = document.querySelector('.detail-stats .stat-item:nth-child(3) .stat-value');
  const commentCount = postData.commentCount !== undefined ? postData.commentCount : 0;
  commentCountEl.textContent = formatNumber(commentCount);
}

function updateLikeButton() {
  const likeButton = document.getElementById('likeButton');
  
  if (postData.isLiked) {
    likeButton.className = 'stat-item like-button active';
  } else {
    likeButton.className = 'stat-item like-button inactive';
  }
}

function updatePostActions() {
  const actionsDiv = document.querySelector('.detail-actions');
  
  if (Number(postData.authorId) === Number(currentUserId)) {
    actionsDiv.style.display = 'flex';
  } else {
    actionsDiv.style.display = 'none';
  }
}

async function loadComments() {
  try {
    // 실제 API 호출
    const response = await getComments({ postId: postData.postId });
    const comments = response.data;
    
    console.log('댓글 로드 완료:', comments.length, '개');
    
    // 댓글 수 업데이트 (UI)
    const commentCountEl = document.querySelector('.detail-stats .stat-item:nth-child(3) .stat-value');
    commentCountEl.textContent = formatNumber(comments.length);
    
    renderComments(comments);
    
  } catch (error) {
    console.error('댓글 로드 실패:', error);
  }
}

function renderComments(comments) {
  const commentsList = document.querySelector('.comments-list');
  commentsList.innerHTML = '';
  
  if (!comments || comments.length === 0) {
    return;
  }
  
  comments.forEach(comment => {
    const commentElement = createCommentElement(comment);
    commentsList.appendChild(commentElement);
  });
}

function createCommentElement(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment-item';
  commentDiv.dataset.commentId = comment.commentId;
  
  const isOwnComment = comment.isMyComment; 
  
  // ✅ [추가 로직] 수정 여부 판별
  // 보통 생성 직후에는 createdAt과 updatedAt이 같으므로, 다르면 수정된 것으로 간주합니다.
  const isEdited = comment.updatedAt > comment.createdAt;
  
  // 수정되었다면 수정 시간을, 아니면 작성 시간을 표시
  const displayDate = formatDate(isEdited ? comment.updatedAt : comment.createdAt);
  
  // 수정됨 라벨 (회색 작은 글씨)
  const editLabel = isEdited ? ' <span style="font-size: 0.85em; color: #999; font-weight: normal;">(수정됨)</span>' : '';

  // 프로필 이미지 처리
  let profileHtml = '<span class="author-avatar">👤</span>';
  if (comment.profileImage) {
      profileHtml = `<span class="author-avatar"><img src="${API_BASE_URL}${comment.profileImage}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;"></span>`;
  }

  commentDiv.innerHTML = `
    <div class="comment-header">
      <div class="comment-author-wrapper">
        ${profileHtml}
        <div>
          <div class="author-name">${escapeHtml(comment.nickname || '익명')}</div>
          <span class="post-date">${displayDate}${editLabel}</span>
        </div>
      </div>
      ${isOwnComment ? `
        <div class="comment-actions">
          <button class="btn btn-secondary btn-small comment-edit-btn">수정</button>
          <button class="btn btn-secondary btn-small comment-delete-btn">삭제</button>
        </div>
      ` : ''}
    </div>
    <p class="comment-content">${escapeHtml(comment.content)}</p>
  `;
  
  if (isOwnComment) {
    setupCommentActions(commentDiv, comment.commentId);
  }
  
  return commentDiv;
}

function resetCommentForm() {
  const commentInput = document.getElementById('commentInput');
  const commentSubmit = document.getElementById('commentSubmit');
  
  commentInput.value = '';
  commentSubmit.disabled = true;
  commentSubmit.classList.remove('active');
  commentSubmit.textContent = '댓글 등록';
  
  isEditingComment = false;
  editingCommentId = null;
}

// ==================== 댓글 이벤트 핸들러 ====================

async function handleAddComment(content) {
  if (!currentUserId) {
    showToast('로그인이 필요합니다', 1500);
    return;
  }

  try {
    showLoading();
    // API 호출
    await createComment({
        content: content,
        postId: postData.postId
    });
    
    // 성공 시 댓글 목록 새로고침
    await loadComments();
    hideLoading();
    showToast('댓글이 등록되었습니다', 1500);
    
  } catch (error) {
    hideLoading();
    console.error('댓글 작성 실패:', error);
    showToast('댓글 작성에 실패했습니다', 1500);
  }
}

async function handleUpdateComment(commentId, newContent) {
  try {
    showLoading();
    // API 호출
    await updateComment(commentId, newContent);
    
    // 성공 시 댓글 목록 새로고침
    await loadComments();
    hideLoading();
    showToast('댓글이 수정되었습니다', 1500);
    
  } catch (error) {
    hideLoading();
    console.error('댓글 수정 실패:', error);
    showToast('댓글 수정에 실패했습니다', 1500);
  }
}

function handleDeleteComment(commentId) {
  showModal(
    '댓글을 삭제하시겠습니까?',
    '삭제한 내용은 복구할 수 없습니다.',
    async function() {
      try {
        showLoading();
        // API 호출
        await deleteComment(commentId);
        
        await loadComments();
        hideLoading();
        showToast('댓글이 삭제되었습니다', 1500);
        
      } catch (error) {
        hideLoading();
        console.error('댓글 삭제 실패:', error);
        showToast('댓글 삭제에 실패했습니다', 1500);
      }
    },
    function() {
      console.log('댓글 삭제 취소');
    }
  );
}

function startEditComment(commentElement, commentId) {
  console.log('댓글 수정 모드:', commentId);
  
  isEditingComment = true;
  editingCommentId = commentId;
  
  const commentInput = document.getElementById('commentInput');
  const commentSubmit = document.getElementById('commentSubmit');
  const currentContent = commentElement.querySelector('.comment-content').textContent;
  
  commentInput.value = currentContent;
  commentSubmit.disabled = false;
  commentSubmit.classList.add('active');
  commentSubmit.textContent = '댓글 수정';
  
  commentInput.focus();
  commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ==================== 이벤트 핸들러 ====================

function setupBackButton() {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      smartBack('post_list.html');
    });
  }
}

function setupLikeButton() {
  const likeButton = document.getElementById('likeButton');
  
  likeButton.addEventListener('click', () => {
    toggleLike();
  });
  
  console.log('좋아요 버튼 이벤트 등록 완료');
}

function setupPostActions() {
  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  
  editBtn.addEventListener('click', () => {
    console.log('게시글 수정으로 이동');
    navigateTo(`post_edit.html?id=${postData.postId}`);
  });
  
  deleteBtn.addEventListener('click', () => {
    handleDeletePost();
  });
  
  console.log('게시글 수정/삭제 버튼 이벤트 등록 완료');
}

function handleDeletePost() {
  showModal(
    '게시글을 삭제하시겠습니까?',
    '삭제한 내용은 복구할 수 없습니다.',
    function() {
      console.log('게시글 삭제 확인');
      deletePostData();
    },
    function() {
      console.log('게시글 삭제 취소');
    }
  );
}

function setupCommentInput() {
  const commentInput = document.getElementById('commentInput');
  const commentSubmit = document.getElementById('commentSubmit');
  const commentForm = document.getElementById('commentForm');
  
  commentInput.addEventListener('input', function() {
    const hasContent = this.value.trim() !== '';
    if (hasContent) {
      commentSubmit.disabled = false;
      commentSubmit.classList.add('active');
    } else {
      commentSubmit.disabled = true;
      commentSubmit.classList.remove('active');
    }
  });
  
  commentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const content = commentInput.value.trim();
    if (!content) return;
    
    if (isEditingComment) {
      handleUpdateComment(editingCommentId, content);
    } else {
      handleAddComment(content);
    }
    
    resetCommentForm();
  });
}

function setupCommentActions(commentElement, commentId) {
    const editBtn = commentElement.querySelector('.comment-edit-btn');
    const deleteBtn = commentElement.querySelector('.comment-delete-btn');
    
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        startEditComment(commentElement, commentId);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        handleDeleteComment(commentId);
      });
    }
}

function setupThumbnailEvents() {
  const thumbnails = document.querySelectorAll('.image-thumbnail');
  const mainImage = document.getElementById('mainImage');
  const counter = document.getElementById('currentImageIndex');
  
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener('click', () => {
      // 모든 썸네일 비활성화
      thumbnails.forEach(t => t.classList.remove('active'));
      
      // 클릭한 썸네일 활성화
      thumbnail.classList.add('active');
      
      // 메인 이미지 변경
      mainImage.src = `${API_BASE_URL}${postData.images[index]}`;
      
      // 카운터 업데이트
      if (counter) {
        counter.textContent = index + 1;
      }
      
      console.log('이미지 전환:', index + 1);
    });
  });
  
  console.log('이미지 갤러리 이벤트 등록 완료');
}

// ==================== 초기화 ====================

async function init() {
    console.log('게시글 상세 페이지 초기화');
    await initHeader();
    await loadCurrentUser();
    await loadPostData();
    setupBackButton();
    setupLikeButton();
    setupPostActions();
    setupCommentInput();
    console.log('게시글 상세 페이지 로딩 완료');
}

window.addEventListener('pageshow', async (event) => {
  const isBackNavigation = event.persisted || 
                           (performance.getEntriesByType("navigation")[0]?.type === 'back_forward');

  if (isBackNavigation) {
    showLoading();
    await loadPostData();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('posts/detail.js 로드 완료');