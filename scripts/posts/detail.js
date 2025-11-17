// 게시글 상세 메인 로직

// 상태
let postData = null;
let currentUserId = null;
let isEditingComment = false;
let editingCommentId = null;

// 더미 댓글 데이터
const mockComments = [
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

// 댓글 카운터 (새 댓글 추가용)
let nextCommentId = 4;

// 게시글 데이터 로드
async function loadPostData() {
  console.log('📄 게시글 데이터 로드 중...');
  
  // URL 파라미터에서 postId 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  
  if (!postId) {
    showToast('게시글을 찾을 수 없습니다');
    setTimeout(() => navigateTo('main.html'), 1500);
    return;
  }
  
  console.log('게시글 ID:', postId);
  
  // 로딩 표시
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }
  
  try {
    const response = await getPost(postId);
    postData = response.data;
    
    // 좋아요/댓글 더미 데이터 추가
    postData.isLiked = false;
    postData.likes = postData.likes || Math.floor(Math.random() * 1000);
    postData.views = postData.views || Math.floor(Math.random() * 5000);
    postData.commentCount = mockComments.length;
    
    console.log('✅ 게시글 로드 완료:', postData);
    
    // 로딩 숨김
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // UI 업데이트
    updatePostUI();
    
    // 댓글 로드 (더미)
    loadComments();
    
  } catch (error) {
    console.error('❌ 게시글 로드 실패:', error);
    
    // 로딩 숨김
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
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

/**
 * 게시글 UI 업데이트
 */
function updatePostUI() {
  console.log('📝 게시글 UI 업데이트 중...');
  
  // 제목
  document.querySelector('.detail-title').textContent = postData.title;
  
  // 작성자
  document.querySelector('.author-name').textContent = postData.authorName || '익명';
  
  // 날짜
  document.querySelector('.post-date').textContent = formatDate(postData.createdAt);
  
  // 내용
  document.querySelector('.detail-text').textContent = postData.content;
  
  // 이미지 (있을 경우)
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
  
  // 통계
  document.getElementById('likeCount').textContent = formatNumber(postData.likes);
  document.querySelector('.detail-stats .stat-item:nth-child(2) .stat-value').textContent = formatNumber(postData.views);
  document.querySelector('.detail-stats .stat-item:nth-child(3) .stat-value').textContent = formatNumber(postData.commentCount);
  
  // 좋아요 상태
  updateLikeButton();
  
  // 수정/삭제 버튼 표시 여부 (본인 게시글만)
  const actionsDiv = document.querySelector('.detail-actions');
  if (postData.authorId === currentUserId) {
    actionsDiv.style.display = 'flex';
  } else {
    actionsDiv.style.display = 'none';
  }
}

/**
 * 좋아요 버튼 업데이트
 */
function updateLikeButton() {
  const likeButton = document.getElementById('likeButton');
  const likeCount = document.getElementById('likeCount');
  
  if (postData.isLiked) {
    likeButton.className = 'stat-item like-button active';
  } else {
    likeButton.className = 'stat-item like-button inactive';
  }
  
  likeCount.textContent = formatNumber(postData.likes);
}

/**
 * 좋아요 버튼 설정 (Mock)
 */
function setupLikeButton() {
  console.log('게시글 상세 : 좋아요 버튼 설정 중');
  
  const likeButton = document.getElementById('likeButton');
  
  likeButton.addEventListener('click', function() {
    // ✅ Mock: 클라이언트에서만 처리
    if (postData.isLiked) {
      postData.isLiked = false;
      postData.likes -= 1;
    } else {
      postData.isLiked = true;
      postData.likes += 1;
    }
    
    updateLikeButton();
    console.log('✅ 좋아요 상태 변경 (Mock):', postData.isLiked);
    
    // Phase 2: 실제 API 호출
    // if (postData.isLiked) {
    //   await likePost(postData.id);
    // } else {
    //   await unlikePost(postData.id);
    // }
  });
}

/**
 * 게시글 수정/삭제 버튼
 */
function setupPostActions() {
  console.log('게시글 상세 : 수정/삭제 버튼 설정 중');
  
  const editBtn = document.querySelector('.detail-actions .btn:first-child');
  const deleteBtn = document.querySelector('.detail-actions .btn:last-child');
  
  // 수정 버튼
  editBtn.addEventListener('click', function() {
    console.log('게시글 수정으로 이동');
    
    // ✅ postId 사용
    navigateTo(`post_edit.html?id=${postData.postId}`);
  });
  
  // 삭제 버튼
  deleteBtn.addEventListener('click', function() {
    console.log('게시글 삭제 모달');
    
    showModal(
      '게시글을 삭제하시겠습니까?',
      '삭제한 내용은 복구 할 수 없습니다.',
      async function() {
        console.log('✅ 게시글 삭제 확인');
        
        try {
          // ✅ postId 사용
          await deletePost(postData.postId);
          
          showToast('게시글이 삭제되었습니다');
          
          setTimeout(() => {
            navigateTo('main.html');
          }, 2000);
          
        } catch (error) {
          console.error('❌ 게시글 삭제 실패:', error);
          
          if (error.status === 403) {
            showToast('삭제 권한이 없습니다');
          } else if (error.status === 401) {
            showToast('로그인이 필요합니다');
          } else {
            showToast('게시글 삭제 중 오류가 발생했습니다');
          }
        }
      },
      function() {
        console.log('❌ 게시글 삭제 취소');
      }
    );
  });
}

/**
 * 댓글 목록 로드 (Mock)
 */
function loadComments() {
  console.log('💬 댓글 목록 로드 중 (Mock)...');
  
  const commentsList = document.querySelector('.comments-list');
  commentsList.innerHTML = '';
  
  if (mockComments.length === 0) {
    commentsList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        첫 번째 댓글을 작성해보세요!
      </div>
    `;
  } else {
    mockComments.forEach(comment => {
      const commentElement = createCommentElement(comment);
      commentsList.appendChild(commentElement);
    });
  }
  
  console.log('✅ 댓글 로드 완료 (Mock):', mockComments.length, '개');
  
  // Phase 2: 실제 API 호출
  // const response = await getComments(postData.id);
  // const comments = response.data || [];
}

/**
 * 댓글 입력 이벤트
 */
function setupCommentInput() {
  console.log('게시글 상세 : 댓글 입력 설정 중');
  
  const commentInput = document.getElementById('commentInput');
  const commentSubmit = document.getElementById('commentSubmit');
  const commentForm = document.getElementById('commentForm');
  
  // 입력 시 버튼 상태 변경
  commentInput.addEventListener('input', function() {
    const hasContent = this.value.trim() !== '';
    
    if (hasContent) {
      commentSubmit.disabled = false;
      commentSubmit.className = 'btn btn-primary comment-submit active';
    } else {
      commentSubmit.disabled = true;
      commentSubmit.className = 'btn btn-primary comment-submit';
    }
  });
  
  // 폼 제출
  commentForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const content = commentInput.value.trim();
    if (!content) return;
    
    if (isEditingComment) {
      // 댓글 수정
      handleUpdateComment(editingCommentId, content);
    } else {
      // 댓글 등록
      handleAddComment(content);
    }
    
    // 초기화
    commentInput.value = '';
    commentSubmit.disabled = true;
    commentSubmit.className = 'btn btn-primary comment-submit';
    commentSubmit.textContent = '댓글 등록';
    isEditingComment = false;
    editingCommentId = null;
  });
}

/**
 * 댓글 추가 (Mock)
 */
function handleAddComment(content) {
  console.log('댓글 추가 (Mock):', content);
  
  // ✅ 더미 데이터 추가
  const newComment = {
    id: nextCommentId++,
    content: content,
    author: '나',  // 현재 사용자
    authorId: currentUserId,
    createdAt: new Date().toISOString()
  };
  
  mockComments.push(newComment);
  
  // 댓글 수 증가
  postData.commentCount += 1;
  document.querySelector('.detail-stats .stat-item:nth-child(3) .stat-value').textContent = formatNumber(postData.commentCount);
  
  // 댓글 목록 새로고침
  loadComments();
  
  showToast('댓글이 등록되었습니다');
  
  // Phase 2: 실제 API 호출
  // await createComment(postData.id, content);
}

/**
 * 댓글 수정 (Mock)
 */
function handleUpdateComment(commentId, newContent) {
  console.log('댓글 수정 (Mock):', commentId, newContent);
  
  // ✅ 더미 데이터 수정
  const comment = mockComments.find(c => c.id === commentId);
  if (comment) {
    comment.content = newContent;
  }
  
  // 댓글 목록 새로고침
  loadComments();
  
  showToast('댓글이 수정되었습니다');
  
  // Phase 2: 실제 API 호출
  // await updateComment(postData.id, commentId, newContent);
}

/**
 * 댓글 DOM 요소 생성
 */
function createCommentElement(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment-item';
  commentDiv.dataset.commentId = comment.id;
  
  const isOwnComment = comment.authorId === currentUserId;
  
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
  
  // 이벤트 연결
  if (isOwnComment) {
    setupCommentActions(commentDiv, comment.id);
  }
  
  return commentDiv;
}

/**
 * 댓글 수정/삭제 액션 설정
 */
function setupCommentActions(commentElement, commentId) {
  const editBtn = commentElement.querySelector('.comment-edit-btn');
  const deleteBtn = commentElement.querySelector('.comment-delete-btn');
  
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      console.log('댓글 수정 모드:', commentId);
      
      // 수정 모드 활성화
      isEditingComment = true;
      editingCommentId = commentId;
      
      // 댓글 입력창에 기존 내용 넣기
      const commentInput = document.getElementById('commentInput');
      const commentSubmit = document.getElementById('commentSubmit');
      const currentContent = commentElement.querySelector('.comment-content').textContent;
      
      commentInput.value = currentContent;
      commentSubmit.disabled = false;
      commentSubmit.className = 'btn btn-primary comment-submit active';
      commentSubmit.textContent = '댓글 수정';
      
      // 포커스
      commentInput.focus();
      commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', function() {
      console.log('댓글 삭제 모달:', commentId);
      
      showModal(
        '댓글을 삭제하시겠습니까?',
        '삭제한 내용은 복구 할 수 없습니다.',
        function() {
          console.log('✅ 댓글 삭제 확인 (Mock)');
          
          // ✅ 더미 데이터에서 삭제
          const index = mockComments.findIndex(c => c.id === commentId);
          if (index !== -1) {
            mockComments.splice(index, 1);
          }
          
          // 댓글 수 감소
          postData.commentCount -= 1;
          document.querySelector('.detail-stats .stat-item:nth-child(3) .stat-value').textContent = formatNumber(postData.commentCount);
          
          // 댓글 목록 새로고침
          loadComments();
          
          showToast('댓글이 삭제되었습니다');
          
          // Phase 2: 실제 API 호출
          // await deleteComment(postData.id, commentId);
        },
        function() {
          console.log('❌ 댓글 삭제 취소');
        }
      );
    });
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
async function loadCurrentUser() {
  try {
    const response = await getMyInfo();
    currentUserId = response.data.userId;
    console.log('현재 사용자 ID:', currentUserId);
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
    // 더미 ID 사용
    currentUserId = 1;
  }
}

/**
 * 초기화
 */
async function init() {
  console.log('게시글 상세 페이지 불러오는 중');
  
  // 사용자 정보 로드
  await loadCurrentUser();
  
  // 게시글 데이터 로드
  await loadPostData();
  
  // 이벤트 설정
  setupLikeButton();
  setupPostActions();
  setupCommentInput();
  
  console.log('게시글 상세 페이지 로딩 완료!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('post/detail.js 로드 완료');