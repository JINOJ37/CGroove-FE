// ==================== Import ====================

import { initHeader } from '../common/component/header.js';
import { showLoading, hideLoading } from '../common/util/utils.js';
import { showToast } from '../common/util/utils.js';
import { navigateTo, smartBack } from '../common/util/utils.js';
import { showModal } from '../common/util/utils.js';
import { formatDate } from '../common/util/format.js';
import { formatNumber } from '../common/util/format.js';
import { escapeHtml } from '../common/util/format.js';
import { getEvent, deleteEvent, toggleEventLike, applyEvent, cancelEventJoin, getMyJoinStatus } from '../common/api/event.js';
import { getMyInfo } from '../common/api/user.js';
import { API_BASE_URL } from '../common/api/core.js';

// ==================== 상수 ====================

const EVENT_TYPE_LABELS = {
  WORKSHOP: '워크샵',
  BATTLE: '배틀',
  JAM: '잼',
  PERFORMANCE: '공연'
};

// Mock 댓글 데이터 (TODO: 백엔드 API 완성 시 제거)
const MOCK_COMMENTS = [
  {
    id: 1,
    content: '기대되는 행사네요! 꼭 참여하고 싶습니다 🔥',
    host: '김철수',
    hostId: 999,
    createdAt: '2025-11-17T10:30:00Z'
  },
  {
    id: 2,
    content: '언제 신청 시작하나요?',
    host: '이영희',
    hostId: 998,
    createdAt: '2025-11-17T11:00:00Z'
  }
];

// ==================== 상태 관리 ====================

let eventData = null;
let currentUserId = null;
let isJoined = false;
let isEditingComment = false;
let editingCommentId = null;
let mockComments = [...MOCK_COMMENTS];
let nextCommentId = 3;

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
    loadComments();
    
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
    isJoined = response.data.status == 'CONFIRMED' || false;
    console.log('신청 상태:', isJoined ? '신청됨' : '미신청');
  } catch (error) {
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
    
    console.log('좋아요 상태:', eventData.isLiked ? '활성' : '비활성');
    
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
    updateEventInfo();
    updateEventStats();
    
  } catch (error) {
    hideLoading();
    console.error('신청 처리 실패:', error);
    
    if (error.status === 401) {
      showToast('로그인이 필요합니다', 2000, 'error');
    } else if (error.status === 400) {
      showToast(error.message || '신청 처리 중 오류가 발생했습니다', 2000, 'error');
    } else {
      showToast('신청 처리 중 오류가 발생했습니다', 2000, 'error');
    }
  }
}

// ==================== UI 렌더링 ====================

function updateEventUI() {
  console.log('행사 UI 업데이트');
  
  document.querySelector('.detail-title').textContent = eventData.title;
  document.querySelector('.author-name').textContent = eventData.hostNickname || '익명';
  document.querySelector('.post-date').textContent = formatDate(eventData.createdAt);
  document.querySelector('.detail-text').textContent = eventData.content;

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
  updateJoinButton();
  updateEventActions();
}

function updateEventTypeBadge() {
  const badge = document.getElementById('eventTypeBadge');
  const eventType = eventData.eventType || eventData.type;
  badge.textContent = EVENT_TYPE_LABELS[eventType] || eventType;
  badge.className = `event-type-badge ${eventType.toLowerCase()}`;
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
  document.getElementById('currentParticipants').textContent = eventData.currentParticipants || 0;
  document.getElementById('maxCapacity').textContent = eventData.capacity || 0;
}

function updateEventImage() {
  const imageElement = document.querySelector('.detail-image');
  
  if (eventData.images && eventData.images.length > 0) {
    imageElement.src = `${API_BASE_URL}${eventData.images[0]}`;
    imageElement.style.display = 'block';
    
    imageElement.onerror = function() {
      console.warn('이미지 로드 실패:', this.src);
      this.style.display = 'none';
    };
  } else {
    imageElement.style.display = 'none';
  }
}

function updateEventStats() {
  document.getElementById('likeCount').textContent = formatNumber(eventData.likeCount || 0);
  document.getElementById('viewCount').textContent = formatNumber((eventData.viewCount || 0) + 1);
  document.getElementById('participantCount').textContent = formatNumber(eventData.currentParticipants || 0);
}

function updateLikeButton() {
  const likeButton = document.getElementById('likeButton');
  
  if (eventData.isLiked) {
    likeButton.className = 'stat-item like-button active';
  } else {
    likeButton.className = 'stat-item like-button inactive';
  }
}

function updateJoinButton() {
  const joinButton = document.getElementById('joinButton');
  const currentParticipants = eventData.currentParticipants || 0;
  const capacity = eventData.capacity || 0;
  const isFull = currentParticipants >= capacity;
  const isPastEvent = new Date(eventData.endsAt) < new Date();
  
  // 주최자는 신청 불가
  const isOrganizer = Number(eventData.hostId) === Number(currentUserId);
  
  if (isOrganizer) {
    joinButton.textContent = '주최자입니다';
    joinButton.disabled = true;
    joinButton.className = 'btn btn-secondary btn-large';
  } else if (isPastEvent) {
    joinButton.textContent = '종료된 행사';
    joinButton.disabled = true;
    joinButton.className = 'btn btn-secondary btn-large';
  } else if (isJoined) {
    joinButton.textContent = '신청 취소';
    joinButton.disabled = false;
    joinButton.className = 'btn btn-danger btn-large';
  } else if (isFull) {
    joinButton.textContent = '마감';
    joinButton.disabled = true;
    joinButton.className = 'btn btn-secondary btn-large';
  } else {
    joinButton.textContent = '신청하기';
    joinButton.disabled = false;
    joinButton.className = 'btn btn-primary btn-large';
  }
}

function updateEventActions() {
  const actionsDiv = document.querySelector('.detail-actions');
  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const manageBtn = document.getElementById('manageParticipantsBtn');
  
  const isOwner = Number(eventData.hostId) === Number(currentUserId);
  
  if (isOwner) {
    editBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'inline-block';
    manageBtn.style.display = 'inline-block';
  } else {
    editBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
    manageBtn.style.display = 'none';
  }
}

function loadComments() {
  console.log('댓글 로드:', mockComments.length, '개');
  
  const commentsList = document.querySelector('.comments-list');
  commentsList.innerHTML = '';
  
  if (mockComments.length === 0) {
    commentsList.innerHTML = `
      <div class="empty-comments">
        <p>첫 번째 댓글을 작성해보세요!</p>
      </div>
    `;
  } else {
    mockComments.forEach(comment => {
      const commentElement = createCommentElement(comment);
      commentsList.appendChild(commentElement);
    });
  }
}

function createCommentElement(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment-item';
  commentDiv.dataset.commentId = comment.id;
  
  const isOwnComment = Number(comment.hostId) === Number(currentUserId);
  
  commentDiv.innerHTML = `
    <div class="comment-header">
      <div class="comment-author-wrapper">
        <span class="author-avatar">👤</span>
        <div>
          <div class="author-name">${escapeHtml(comment.host || '익명')}</div>
          <span class="post-date">${formatDate(comment.createdAt)}</span>
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
    setupCommentActions(commentDiv, comment.id);
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

// ==================== 댓글 처리 (Mock) ====================

function handleAddComment(content) {
  console.log('댓글 추가:', content);
  
  const newComment = {
    id: nextCommentId++,
    content: content,
    host: '나',
    hostId: currentUserId,
    createdAt: new Date().toISOString()
  };
  
  mockComments.push(newComment);
  
  loadComments();
  showToast('댓글이 등록되었습니다', 1500);
}

function handleUpdateComment(commentId, newContent) {
  console.log('댓글 수정:', commentId);
  
  const comment = mockComments.find(c => c.id === commentId);
  if (comment) {
    comment.content = newContent;
  }
  
  loadComments();
  showToast('댓글이 수정되었습니다', 1500);
}

function handleDeleteComment(commentId) {
  showModal(
    '댓글을 삭제하시겠습니까?',
    '삭제한 내용은 복구할 수 없습니다.',
    function() {
      console.log('댓글 삭제 확인');
      
      const index = mockComments.findIndex(c => c.id === commentId);
      if (index !== -1) {
        mockComments.splice(index, 1);
      }
      
      loadComments();
      showToast('댓글이 삭제되었습니다', 1500);
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

function setupJoinButton() {
  const joinButton = document.getElementById('joinButton');
  
  joinButton.addEventListener('click', () => {
    handleJoinToggle();
  });
  
  console.log('신청 버튼 이벤트 등록 완료');
}

function setupEventActions() {
  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const manageBtn = document.getElementById('manageParticipantsBtn');
  
  editBtn.addEventListener('click', () => {
    console.log('행사 수정으로 이동');
    navigateTo(`event_edit.html?id=${eventData.eventId}`);
  });
  
  deleteBtn.addEventListener('click', () => {
    handleDeleteEvent();
  });
  
  manageBtn.addEventListener('click', () => {
    console.log('참여자 관리로 이동');
    navigateTo(`event_participants.html?id=${eventData.eventId}`);
  });
  
  console.log('행사 수정/삭제/관리 버튼 이벤트 등록 완료');
}

function handleDeleteEvent() {
  showModal(
    '행사를 삭제하시겠습니까?',
    '삭제한 내용은 복구할 수 없습니다.',
    function() {
      console.log('행사 삭제 확인');
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
  
  console.log('댓글 입력 이벤트 등록 완료');
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