// 게시글 상세 페이지

let postData = null;
let currentUserId = null;
let isEditingComment = false;
let editingCommentId = null;

// Mock 댓글 데이터 (TODO: 백엔드 API 완성 시 제거)
let mockComments = [
  {
    id: 1,
    content: '좋은 게시글이네요! 도움이 많이 되었습니다.',
    author: '김철수',
    authorId: 999,
    createdAt: '2025-11-17T10:30:00Z'
  },
  {
    id: 2,
    content: '유익한 정보 감사합니다 😊',
    author: '이영희',
    authorId: 998,
    createdAt: '2025-11-17T11:00:00Z'
  },
  {
    id: 3,
    content: '저도 같은 생각입니다!',
    author: '박민수',
    authorId: 997,
    createdAt: '2025-11-17T12:15:00Z'
  }
];
let nextCommentId = 4;

// 현재 사용자 정보 로드
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

// 게시글 데이터 로드
async function loadPostData() {
  console.log('게시글 데이터 로드 중');
  
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  
  if (!postId) {
    showToast('게시글을 찾을 수 없습니다');
    setTimeout(() => navigateTo('main.html'), 1500);
    return;
  }
  
  showLoading('게시글을 불러오는 중...');
  
  try {
    const response = await getPost(postId);
    postData = response.data;
    
    // Mock 데이터 추가 (TODO: 백엔드 API 완성 시 제거)
    postData.isLiked = false;
    postData.likes = postData.likes || Math.floor(Math.random() * 1000);
    postData.views = postData.views || Math.floor(Math.random() * 5000);
    postData.commentCount = mockComments.length;
    
    console.log('게시글 로드 완료:', postData.postId);
    
    hideLoading();
    
    updatePostUI();
    loadComments();
    
  } catch (error) {
    console.error('게시글 로드 실패:', error);
    hideLoading();
    
    if (error.status === 404) {
      showToast('존재하지 않는 게시글입니다');
    } else if (error.status === 401) {
      showToast('로그인이 필요합니다');
    } else {
      showToast('게시글을 불러오는데 실패했습니다');
    }
    
    setTimeout(() => navigateTo('main.html'), 1500);
  }
}

// 게시글 삭제
async function deletePostData() {
  try {
    await deletePost(postData.postId);
    showToast('게시글이 삭제되었습니다');
    setTimeout(() => navigateTo('main.html'), 1500);
    
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    
    if (error.status === 403) {
      showToast('삭제 권한이 없습니다');
    } else if (error.status === 401) {
      showToast('로그인이 필요합니다');
    } else {
      showToast('게시글 삭제 중 오류가 발생했습니다');
    }
  }
}

// 게시글 UI 업데이트
function updatePostUI() {
  console.log('게시글 UI 업데이트');
  
  document.querySelector('.detail-title').textContent = postData.title;
  document.querySelector('.author-name').textContent = postData.authorName || '익명';
  document.querySelector('.post-date').textContent = formatDate(postData.createdAt);
  document.querySelector('.detail-text').textContent = postData.content;
  
  updatePostImage();
  updatePostStats();
  updateLikeButton();
  updatePostActions();
}

// 게시글 이미지 업데이트
function updatePostImage() {
  const imageElement = document.querySelector('.detail-image');
  
  if (postData.images && postData.images.length > 0) {
    imageElement.src = `${API_BASE_URL}${postData.images[0]}`;
    imageElement.style.display = 'block';
    
    imageElement.onerror = function() {
      console.warn('이미지 로드 실패:', this.src);
      this.style.display = 'none';
    };
  } else {
    imageElement.style.display = 'none';
  }
}

// 게시글 통계 업데이트
function updatePostStats() {
  document.getElementById('likeCount').textContent = formatNumber(postData.likes);
  document.querySelector('.detail-stats .stat-item:nth-child(2) .stat-value').textContent = formatNumber(postData.views);
  document.querySelector('.detail-stats .stat-item:nth-child(3) .stat-value').textContent = formatNumber(postData.commentCount);
}

// 좋아요 버튼 상태 업데이트
function updateLikeButton() {
  const likeButton = document.getElementById('likeButton');
  
  if (postData.isLiked) {
    likeButton.className = 'stat-item like-button active';
  } else {
    likeButton.className = 'stat-item like-button inactive';
  }
}

// 수정/삭제 버튼 표시 여부
function updatePostActions() {
  const actionsDiv = document.querySelector('.detail-actions');
  
  if (Number(postData.authorId) === Number(currentUserId)) {
    actionsDiv.style.display = 'flex';
  } else {
    actionsDiv.style.display = 'none';
  }
}

// 댓글 목록 로드 (Mock)
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
  
  // TODO: 실제 API 연동
  // const response = await getComments(postData.postId);
  // renderComments(response.data);
}

// 댓글 DOM 요소 생성
function createCommentElement(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment-item';
  commentDiv.dataset.commentId = comment.id;
  
  const isOwnComment = Number(comment.authorId) === Number(currentUserId);
  
  commentDiv.innerHTML = `
    <div class="comment-header">
      <div class="comment-author-wrapper">
        <span class="author-avatar">👤</span>
        <div>
          <div class="author-name">${comment.author || '익명'}</div>
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
    <p class="comment-content">${comment.content}</p>
  `;
  
  if (isOwnComment) {
    setupCommentActions(commentDiv, comment.id);
  }
  
  return commentDiv;
}

// 댓글 입력 폼 초기화
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

// 뒤로가기 버튼
function setupBackButton() {
  const backBtn = document.querySelector('.header-back');
  if (backBtn) {
    backBtn.onclick = () => smartBack('main.html');
  }
}

// 좋아요 버튼
function setupLikeButton() {
  const likeButton = document.getElementById('likeButton');
  
  likeButton.addEventListener('click', function() {
    // Mock: 클라이언트에서만 처리
    if (postData.isLiked) {
      postData.isLiked = false;
      postData.likes -= 1;
    } else {
      postData.isLiked = true;
      postData.likes += 1;
    }
    
    updateLikeButton();
    updatePostStats();
    console.log('좋아요 상태:', postData.isLiked ? '활성' : '비활성');
    
    // TODO: 실제 API 연동
    // await likePost(postData.postId) or unlikePost(postData.postId)
  });
}

// 게시글 수정/삭제 버튼
function setupPostActions() {
  const editBtn = document.querySelector('.detail-actions .btn:first-child');
  const deleteBtn = document.querySelector('.detail-actions .btn:last-child');
  
  editBtn.addEventListener('click', function() {
    console.log('게시글 수정으로 이동');
    navigateTo(`post_edit.html?id=${postData.postId}`);
  });
  
  deleteBtn.addEventListener('click', function() {
    handleDeletePost();
  });
}

// 게시글 삭제 처리
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

// 댓글 입력 폼 설정
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

// 댓글 추가 (Mock)
function handleAddComment(content) {
  console.log('댓글 추가:', content);
  
  const newComment = {
    id: nextCommentId++,
    content: content,
    author: '나',
    authorId: currentUserId,
    createdAt: new Date().toISOString()
  };
  
  mockComments.push(newComment);
  postData.commentCount += 1;
  
  updatePostStats();
  loadComments();
  
  showToast('댓글이 등록되었습니다');
  
  // TODO: 실제 API 연동
  // await createComment(postData.postId, content);
}

// 댓글 수정 (Mock)
function handleUpdateComment(commentId, newContent) {
  console.log('댓글 수정:', commentId);
  
  const comment = mockComments.find(c => c.id === commentId);
  if (comment) {
    comment.content = newContent;
  }
  
  loadComments();
  showToast('댓글이 수정되었습니다');
  
  // TODO: 실제 API 연동
  // await updateComment(postData.postId, commentId, newContent);
}

// 댓글 수정 모드 시작
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

// 댓글 삭제 (Mock)
function handleDeleteComment(commentId) {
  showModal(
    '댓글을 삭제하시겠습니까?',
    '삭제한 내용은 복구할 수 없습니다.',
    function() {
      console.log('댓글 삭제 확인');
      
      const index = mockComments.findIndex(c => c.id === commentId);
      if (index !== -1) {
        mockComments.splice(index, 1);
        postData.commentCount -= 1;
      }
      
      updatePostStats();
      loadComments();
      
      showToast('댓글이 삭제되었습니다');
      
      // TODO: 실제 API 연동
      // await deleteComment(postData.postId, commentId);
    },
    function() {
      console.log('댓글 삭제 취소');
    }
  );
}

// 댓글 수정/삭제 버튼 설정
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

async function initPostDetailPage() {
  console.log('게시글 상세 페이지 초기화');
  
  await loadCurrentUser();
  await loadPostData();
  
  setupBackButton();
  setupLikeButton();
  setupPostActions();
  setupCommentInput();
  
  console.log('게시글 상세 페이지 로딩 완료');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPostDetailPage);
} else {
  initPostDetailPage();
}

console.log('posts/detail.js 로드 완료');