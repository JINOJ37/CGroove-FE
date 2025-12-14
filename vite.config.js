import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // 1. 메인 및 인증
        main: resolve(__dirname, 'main.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        
        // 2. 게시글 (Post)
        postList: resolve(__dirname, 'post_list.html'),
        postCreate: resolve(__dirname, 'post_create.html'),
        postDetail: resolve(__dirname, 'post_detail.html'),
        postEdit: resolve(__dirname, 'post_edit.html'),

        // 3. 클럽 (Club)
        clubList: resolve(__dirname, 'club_list.html'),
        clubCreate: resolve(__dirname, 'club_create.html'),
        clubDetail: resolve(__dirname, 'club_detail.html'),
        clubEdit: resolve(__dirname, 'club_edit.html'),
        clubMembers: resolve(__dirname, 'club_members.html'),

        // 4. 행사 (Event)
        eventCreate: resolve(__dirname, 'event_create.html'),
        eventDetail: resolve(__dirname, 'event_detail.html'),
        eventEdit: resolve(__dirname, 'event_edit.html'),
        eventParticipants: resolve(__dirname, 'event_participants.html'),

        // 5. 기타 (캘린더, 장르, 프로필 등)
        calendar: resolve(__dirname, 'calendar.html'),
        genre: resolve(__dirname, 'genre.html'),
        passwordEdit: resolve(__dirname, 'password_edit.html'),
        profileEdit: resolve(__dirname, 'profile_edit.html'),
      },
    },
  },
});