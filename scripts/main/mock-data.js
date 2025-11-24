// Mock 데이터 (메인 페이지용)

export const mockPosts = [
  {
    id: 1,
    title: '오늘 연습 대박이었다',
    content: '새로운 안무 배웠는데 진짜 어려워요ㅠㅠ 그래도 재밌었어요!',
    clubId: 1,
    clubName: '힙합 댄스 클럽',
    author: '김댄서',
    authorId: 1,
    imageUrl: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Dance',
    createdAt: '2025-11-18T14:30:00',
    isMyClub: true,
    likeCount: 15,
    commentCount: 3
  },
  {
    id: 2,
    title: '이번 주 금요일 합동 연습 어때요?',
    content: '시간 되시는 분들 댓글 달아주세요~ 저녁 7시 예정입니다',
    clubId: 1,
    clubName: '힙합 댄스 클럽',
    author: '이매니저',
    authorId: 2,
    createdAt: '2025-11-18T11:00:00',
    isMyClub: true,
    likeCount: 8,
    commentCount: 12
  },
  {
    id: 3,
    title: '신입 환영합니다!',
    content: '안녕하세요! 이번에 새로 들어온 박신입입니다. 잘 부탁드려요!',
    clubId: 2,
    clubName: '왁킹 클럽',
    author: '박신입',
    authorId: 5,
    imageUrl: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Welcome',
    createdAt: '2025-11-18T09:15:00',
    isMyClub: true,
    likeCount: 20,
    commentCount: 5
  },
  
  // 다른 클럽 게시글
  {
    id: 4,
    title: '브레이킹 기초 영상 공유',
    content: '유튜브에서 좋은 기초 강의 찾았어요. 링크 남깁니다!',
    clubId: 3,
    clubName: '브레이킹 클럽',
    author: '최브레이커',
    authorId: 8,
    createdAt: '2025-11-18T08:00:00',
    isMyClub: false,
    likeCount: 45,
    commentCount: 7
  },
  {
    id: 5,
    title: '팝핀 배우고 싶은데 추천 부탁드려요',
    content: '팝핀 처음 시작하려고 하는데 어떤 영상부터 봐야 할까요?',
    clubId: 4,
    clubName: '팝핀 클럽',
    author: '정초보',
    authorId: 10,
    createdAt: '2025-11-17T20:30:00',
    isMyClub: false,
    likeCount: 12,
    commentCount: 15
  },
  {
    id: 6,
    title: '오늘 공연 보러 가실 분?',
    content: '홍대에서 댄스 공연 있는데 같이 가실 분 구해요!',
    clubId: 5,
    clubName: '하우스 댄스 클럽',
    author: '강공연',
    authorId: 12,
    imageUrl: 'https://via.placeholder.com/300x200/FFE66D/FFFFFF?text=Performance',
    createdAt: '2025-11-17T18:00:00',
    isMyClub: false,
    likeCount: 8,
    commentCount: 4
  },
  {
    id: 7,
    title: '스트레칭 루틴 공유',
    content: '부상 방지를 위한 필수 스트레칭 정리했어요. 다들 꼭 하세요!',
    clubId: 3,
    clubName: '브레이킹 클럽',
    author: '윤트레이너',
    authorId: 14,
    createdAt: '2025-11-17T15:00:00',
    isMyClub: false,
    likeCount: 67,
    commentCount: 10
  },
  {
    id: 8,
    title: '댄스 신발 추천해주세요',
    content: '힙합 댄스용 신발 뭐가 좋을까요? 편하고 미끄럽지 않은 걸로요',
    clubId: 6,
    clubName: '댄스 장비 클럽',
    author: '신발왕',
    authorId: 16,
    createdAt: '2025-11-17T12:00:00',
    isMyClub: false,
    likeCount: 23,
    commentCount: 18
  },
  {
    id: 9,
    title: '이번 주말 홍대 버스킹 갑니다',
    content: '토요일 오후 3시 홍대 9번 출구에서 버스킹해요. 놀러오세요!',
    clubId: 7,
    clubName: '버스킹 크루',
    author: '홍대킹',
    authorId: 18,
    imageUrl: 'https://via.placeholder.com/300x200/A8E6CF/FFFFFF?text=Busking',
    createdAt: '2025-11-17T10:00:00',
    isMyClub: false,
    likeCount: 34,
    commentCount: 6
  },
  {
    id: 10,
    title: '댄스와 다이어트',
    content: '댄스로 3개월에 5kg 뺐어요! 후기 공유합니다',
    clubId: 8,
    clubName: '건강 댄스 클럽',
    author: '다이어터',
    authorId: 20,
    createdAt: '2025-11-16T19:00:00',
    isMyClub: false,
    likeCount: 89,
    commentCount: 25
  }
];

console.log('main/mock-data.js 로드 완료');