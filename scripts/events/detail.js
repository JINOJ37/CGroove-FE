// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { showLoading, hideLoading, showToast, navigateTo, smartBack, showModal } from '../common/util/utils.js';
import { formatDate, formatNumber, escapeHtml } from '../common/util/format.js';
import { getEvent, deleteEvent, toggleEventLike, applyEvent, cancelEventJoin, getMyJoinStatus } from '../common/api/event.js';
import { getMyInfo } from '../common/api/user.js';
import { createComment, getComments, updateComment, deleteComment } from '../common/api/comment.js'; // ✅ 댓글 API 추가
import { API_BASE_URL } from '../common/api/core.js';

// ==================== 상수 ====================

const EVENT_TYPE_LABELS = {
  WORKSHOP: '워크샵',
  BATTLE: '배틀',
  JAM: '잼',
  PERFORMANCE: '공연'
};

// ==================== 상태 관리 ====================

let eventData = null;
let currentUserId = null;
let isJoined = false;
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

async function loadEventData() {
  console.log('행사 데이터 로드 중');
  
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  
  if (!eventId) {
    showToast('행사를 찾을 수 없습니다', 1500);
    setTimeout(() => navigateTo('post_list.html'), 1500);
    return;
  }
  
  showLoading();
  
  try {
    const response = await getEvent(eventId);
    eventData = response.data;
    
    console.log('행사 로드 완료:', eventData.eventId);
    
    // 신청 상태 로드
    await loadJoinStatus();
    
    hideLoading();
    
    updateEventUI();
    loadComments(); // ✅ 실제 댓글 로드 호출
    
  } catch (error) {
    console.error('행사 로드 실패:', error);
    hideLoading();
    
    if (error.status === 404) {
      showToast('존재하지 않는 행사입니다', 1500);
    } else if (error.status === 401) {
      showToast('로그인이 필요합니다', 1500);
    } else {
      showToast('행사를 불러오는데 실패했습니다', 1500);
    }
    
    setTimeout(() => navigateTo('post_list.html'), 1500);
  }
}

async function loadJoinStatus() {
  try {
    const response = await getMyJoinStatus(eventData.eventId);
    // status가 CONFIRMED(승인됨) 또는 PENDING(대기중)일 때 가입된 것으로 간주
    isJoined = (response.data.status === 'CONFIRMED' || response.data.status === 'PENDING');
    console.log('신청 상태:', isJoined ? '신청됨' : '미신청');
  } catch (error) {
    // 404는 신청 내역이 없는 것이므로 에러 아님
    if (error.status === 404) {
      isJoined = false;
    } else {
      console.error('신청 상태 로드 실패:', error);
      isJoined = false;
    }
  }
}

async function deleteEventData() {
  try {
    showLoading();
    await deleteEvent(eventData.eventId);
    hideLoading();
    
    showToast('행사가 삭제되었습니다', 1500);
    setTimeout(() => navigateTo('post_list.html'), 1500);
    
  } catch (error) {
    hideLoading();
    console.error('행사 삭제 실패:', error);
    
    if (error.status === 403) {
      showToast('삭제 권한이 없습니다', 2000, 'error');
    } else if (error.status === 401) {
      showToast('로그인이 필요합니다', 2000, 'error');
    } else {
      showToast('행사 삭제 중 오류가 발생했습니다', 2000, 'error');
    }
  }
}

async function toggleLike() {
  try {
    const response = await toggleEventLike(eventData.eventId);
    
    eventData.isLiked = response.data.isLiked;
    eventData.likeCount = response.data.likeCount;
    
    updateLikeButton();
    updateEventStats();
    
  } catch (error) {
    console.error('좋아요 실패:', error);
    
    if (error.status === 401) {
      showToast('로그인이 필요합니다', 2000, 'error');
    } else {
      showToast('좋아요 처리 중 오류가 발생했습니다', 2000, 'error');
    }
  }
}

async function handleJoinToggle() {
  try {
    showLoading();
    
    if (isJoined) {
      // 신청 취소
      await cancelEventJoin(eventData.eventId);
      isJoined = false;
      eventData.currentParticipants = Math.max(0, (eventData.currentParticipants || 0) - 1);
      showToast('신청이 취소되었습니다', 1500);
    } else {
      // 신청
      await applyEvent(eventData.eventId);
      isJoined = true;
      eventData.currentParticipants = (eventData.currentParticipants || 0) + 1;
      showToast('신청이 완료되었습니다', 1500);
    }
    
    hideLoading();
    updateJoinButton();
    updateEventInfo(); // 인원수 갱신
    
  } catch (error) {
    hideLoading();
    console.error('신청 처리 실패:', error);
    
    if (error.status === 401) {
      showToast('로그인이 필요합니다', 2000, 'error');
    } else if (error.status === 400) {
      showToast(error.data?.detail || '신청 처리 중 오류가 발생했습니다', 2000, 'error');
    } else {
      showToast('신청 처리 중 오류가 발생했습니다', 2000, 'error');
    }
  }
}

// ==================== UI 렌더링 ====================

function updateEventUI() {
  console.log('행사 UI 업데이트');
  
  // 텍스트 정보 업데이트
  document.querySelector('.detail-title').textContent = eventData.title;
  document.querySelector('.author-name').textContent = eventData.hostNickname || '익명';
  document.querySelector('.post-date').textContent = formatDate(eventData.createdAt);
  document.querySelector('.detail-text').textContent = eventData.content;
  
  // 작성자 프로필 이미지 처리
  const avatarEl = document.querySelector('.author-avatar');
  if (avatarEl) {
    const profilePath = eventData.hostProfileImage;
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
  
  updateEventTypeBadge();
  updateEventInfo();
  updateEventImage();
  updateEventStats();
  updateLikeButton();
  updateJoinButton(); // 버튼 상태 업데이트
}

function updateEventTypeBadge() {
  const badge = document.getElementById('eventTypeBadge');
  const eventType = eventData.eventType || eventData.type;
  
  if (badge) {
    badge.textContent = EVENT_TYPE_LABELS[eventType] || eventType;
    badge.className = `event-type-badge ${eventType ? eventType.toLowerCase() : ''}`;
  }
}

function updateEventInfo() {
  // 일시
  const dateTimeEl = document.getElementById('eventDateTime');
  const startsAt = new Date(eventData.startsAt);
  const endsAt = new Date(eventData.endsAt);
  dateTimeEl.textContent = `${formatDate(startsAt)} ~ ${formatDate(endsAt)}`;
  
  // 장소
  const locationEl = document.getElementById('eventLocation');
  let locationText = '';
  
  if (eventData.locationName) {
    locationText = eventData.locationName;
    if (eventData.locationAddress) {
      locationText += ` (${eventData.locationAddress})`;
    }
  } else if (eventData.locationAddress) {
    locationText = eventData.locationAddress;
  } else {
    locationText = '장소 미정';
  }
  
  if (eventData.locationLink) {
    locationEl.innerHTML = `${escapeHtml(locationText)} <a href="${escapeHtml(eventData.locationLink)}" target="_blank" class="location-link">🔗</a>`;
  } else {
    locationEl.textContent = locationText;
  }
  
  // 모집 인원
  document.getElementById('currentParticipants').textContent = formatNumber(eventData.currentParticipants || 0);
  document.getElementById('maxCapacity').textContent = formatNumber(eventData.capacity || 0);
}

function updateEventImage() {
  const imageContainer = document.querySelector('.detail-image-container');
  
  if (!eventData.images || eventData.images.length === 0) {
    imageContainer.style.display = 'none';
    return;
  }
  
  imageContainer.style.display = 'block';
  
  // 이미지가 1개일 때
  if (eventData.images.length === 1) {
    imageContainer.innerHTML = `
      <img src="${API_BASE_URL}${eventData.images[0]}" 
           alt="행사 이미지" 
           class="detail-image"
           onerror="this.parentElement.style.display='none'">
    `;
    return;
  }
  
  // 이미지가 여러 개일 때 - 갤러리 구조
  const thumbnailsHTML = eventData.images.map((img, index) => `
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
        <img src="${API_BASE_URL}${eventData.images[0]}" 
             alt="행사 이미지" 
             class="detail-image"
             id="mainImage"
             onerror="this.style.display='none'">
        <div class="image-counter">
          <span id="currentImageIndex">1</span> / ${eventData.images.length}
        </div>
      </div>
      <div class="image-thumbnails">
        ${thumbnailsHTML}
      </div>
    </div>
  `;
  
  setupThumbnailEvents();
}

function updateEventStats() {
  document.getElementById('likeCount').textContent = formatNumber(eventData.likeCount || 0);
  document.getElementById('viewCount').textContent = formatNumber((eventData.viewCount || 0) + 1);
  
  // 댓글 수는 loadComments()에서 업데이트되므로 여기서는 eventData에 값이 있을 때만 표시
  const commentCountEl = document.getElementById('commentCount');
  if (eventData.commentCount !== undefined) {
      commentCountEl.textContent = formatNumber(eventData.commentCount);
  }
}

function updateLikeButton() {
  const likeButton = document.getElementById('likeButton');
  if (eventData.isLiked) {
    likeButton.className = 'stat-item like-button active';
  } else {
    likeButton.className = 'stat-item like-button inactive';
  }
}

// 상단 버튼 그룹 제어 (주최자 vs 참가자)
function updateJoinButton() {
  const joinButton = document.getElementById('joinButton');
  const ownerActions = document.getElementById('ownerActions');
  const participantActions = document.getElementById('participantActions');
  
  const currentParticipants = eventData.currentParticipants || 0;
  const capacity = eventData.capacity || 0;
  const isFull = currentParticipants >= capacity;
  const isPastEvent = new Date(eventData.endsAt) < new Date();
  
  // 주최자 여부 확인 (Number 변환으로 안전하게 비교)
  const isOrganizer = Number(eventData.hostId) === Number(currentUserId);
  
  if (isOrganizer) {
    // 주최자: 수정/삭제/관리 버튼 표시
    ownerActions.style.display = 'flex';
    participantActions.style.display = 'none';
  } else {
    // 일반 사용자: 신청 버튼 표시
    ownerActions.style.display = 'none';
    participantActions.style.display = 'flex';
    
    // 버튼 초기화
    joinButton.classList.remove('btn-secondary', 'btn-danger', 'btn-primary');
    
    // 버튼 상태 설정
    if (isPastEvent) {
      joinButton.textContent = '종료된 행사';
      joinButton.disabled = true;
      joinButton.classList.add('btn-secondary');
    } else if (isJoined) {
      joinButton.textContent = '신청 취소';
      joinButton.disabled = false;
      joinButton.classList.add('btn-danger');
    } else if (isFull) {
      joinButton.textContent = '마감';
      joinButton.disabled = true;
      joinButton.classList.add('btn-secondary');
    } else {
      joinButton.textContent = '신청하기';
      joinButton.disabled = false;
      joinButton.classList.add('btn-primary');
    }
  }
}

// ==================== 댓글 기능 (실제 API) ====================

async function loadComments() {
  try {
    // ✅ [변경] eventId로 댓글 조회
    const response = await getComments({ eventId: eventData.eventId });
    const comments = response.data;
    
    console.log('댓글 로드 완료:', comments.length, '개');
    
    // UI 업데이트
    const commentsList = document.querySelector('.comments-list');
    commentsList.innerHTML = '';
    
    // 댓글 수 업데이트
    document.getElementById('commentCount').textContent = formatNumber(comments.length);
    
    if (!comments || comments.length === 0) {
      return;
    } 
    
    comments.forEach(comment => {
      const commentElement = createCommentElement(comment);
      commentsList.appendChild(commentElement);
    });
    
  } catch (error) {
    console.error('댓글 로드 실패:', error);
  }
}

function createCommentElement(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment-item';
  commentDiv.dataset.commentId = comment.commentId;
  
  // DTO의 isMyComment 필드 활용
  const isOwnComment = comment.isMyComment;
  
  // ✅ [변경] 수정됨 표시 로직
  const isEdited = comment.updatedAt > comment.createdAt;
  const displayDate = formatDate(isEdited ? comment.updatedAt : comment.createdAt);
  const editLabel = isEdited ? ' <span style="font-size: 0.85em; color: #999; font-weight: normal;">(수정됨)</span>' : '';
  
  // 프로필 이미지 처리
  let profileHtml = '<span class="author-avatar">👤</span>';
  if (comment.profileImage) {
      profileHtml = `<span class="author-avatar"><img src="${API_BASE_URL}${comment.profileImage}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;"></span>`;
  }
  
  // ✅ [변경] DTO 필드명 (nickname 등) 사용
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
    // ✅ [변경] eventId 사용
    await createComment({
      content: content,
      eventId: eventData.eventId
    });
    
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
    await updateComment(commentId, newContent);
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

// ==================== 이벤트 핸들러 (UI) ====================

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
}

function setupJoinButton() {
  const joinButton = document.getElementById('joinButton');
  if (joinButton) {
    joinButton.addEventListener('click', () => {
      handleJoinToggle();
    });
  }
}

function setupEventActions() {
  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const manageBtn = document.getElementById('manageParticipantsBtn');
  
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      navigateTo(`event_edit.html?id=${eventData.eventId}`);
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      handleDeleteEvent();
    });
  }
  
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      navigateTo(`event_participants.html?id=${eventData.eventId}`);
    });
  }
}

function handleDeleteEvent() {
  showModal(
    '행사를 삭제하시겠습니까?',
    '삭제한 내용은 복구할 수 없습니다.',
    function() {
      deleteEventData();
    },
    function() {
      console.log('행사 삭제 취소');
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
      thumbnails.forEach(t => t.classList.remove('active'));
      thumbnail.classList.add('active');
      mainImage.src = `${API_BASE_URL}${eventData.images[index]}`;
      if (counter) {
        counter.textContent = index + 1;
      }
    });
  });
}

// ==================== 초기화 ====================

async function init() {
  console.log('행사 상세 페이지 초기화');
  
  await initHeader();
  await loadCurrentUser();
  await loadEventData();
  
  setupBackButton();
  setupLikeButton();
  setupJoinButton();
  setupEventActions();
  setupCommentInput();
  
  console.log('행사 상세 페이지 로딩 완료');
}

// 뒤로가기로 돌아왔을 때 데이터 새로고침
window.addEventListener('pageshow', async (event) => {
  const isBackNavigation = event.persisted || 
                           (performance.getEntriesByType("navigation")[0]?.type === 'back_forward');

  if (isBackNavigation) {
    showLoading();
    await loadEventData();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('events/detail.js 로드 완료');