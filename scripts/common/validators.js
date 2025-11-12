/**
 * 검증 로직
 */

//=========auth/users=========
// 이메일 검증 (회원가입/로그인)
function validateEmail(email, validation, isLogin = false) {
  if (!email || email.trim() === '') {
    showError('emailInput', '*이메일을 입력해주세요.');
    validation.email = false;
    return false;
  }

  if (isLogin) { // 로그인 : @ 포함 여부만 검증
    if (!email.includes('@')) {
      showError('emailInput', '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)');
      validation.email = false;
      return false;
    }
  } else { // 회원가입 : 영문, 숫자, @, . 만 허용
    const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/;
    if (!emailRegex.test(email)) {
      showError('emailInput', '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)');
      validation.email = false;
      return false;
    }
  }
  
  clearError('emailInput');
  validation.email = true;
  return true;
}

// 비밀번호 검증 (회원가입/로그인/비밀번호 변경)
function validatePassword(password, validation, isLogin = false) {
  if (!password) {
    showError('passwordInput', '*비밀번호를 입력해주세요');
    validation.password = false;
    return false;
  }

  if (!isLogin) {
    // 회원가입 & 비밀번호 변경 : 8-20자, 대문자, 소문자, 숫자, 특수문자 각 1개 이상 체크
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if ((password.length < 8 || password.length > 20) || (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar)) {
      showError('passwordInput', '*비밀번호는 8자 이상 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.');
      validation.password = false;
      return false;
    }
    
    // 비밀번호 확인 다시 검증
    const passwordConfirmInput = document.getElementById('passwordConfirmInput');
    if (passwordConfirmInput && passwordConfirmInput.value) {
      validatePasswordConfirm(passwordConfirmInput.value, validation);
    }
  }
  
  clearError('passwordInput');
  validation.password = true;
  return true;
}

// 비밀번호 확인 검증 (회원가입/비밀번호 변경)
function validatePasswordConfirm(passwordConfirm, validation) {
  const passwordInput = document.getElementById('passwordInput').value;
  
  if (!passwordConfirm) {
    showError('passwordConfirmInput', '*비밀번호를 한번더 입력해주세요');
    validation.passwordConfirm = false;
    return false;
  }
  
  if (passwordInput !== passwordConfirm) {
    showError('passwordConfirmInput', '*비밀번호가 다릅니다.');
    validation.passwordConfirm = false;
    return false;
  }
  
  clearError('passwordConfirmInput');
  validation.passwordConfirm = true;
  return true;
}

// 닉네임 검증 (회원가입/프로필 수정)
function validateNickname(nickname, validation) {
  if (!nickname || nickname.trim() === '') {
    showError('nicknameInput', '*닉네임을 입력해주세요.');
    validation.nickname = false;
    return false;
  }
  
  if (nickname.includes(' ')) { // 띄어쓰기 불가
    showError('nicknameInput', '*띄어쓰기를 없애주세요');
    validation.nickname = false;
    return false;
  }
  
  if (nickname.length > 10) { // 10글자 이내
    showError('nicknameInput', '*닉네임은 최대 10자 까지 작성 가능합니다.');
    validation.nickname = false;
    return false;
  }
  
  clearError('nicknameInput');
  validation.nickname = true;
  return true;
}

//=========posts=========
// 제목 검증 (게시물 생성)
function validateTitle(title, validation) {
  if (!title || title.trim() === '') {
    showError('titleInput', '*제목을 입력해주세요');
    validation.title = false;
    return false;
  }
  
  if (title.length > 26) { // 최대 26자
    showError('titleInput', '*제목은 최대 26자까지 작성 가능합니다');
    validation.title = false;
    return false;
  }
  
  clearError('titleInput');
  validation.title = true;
  return true;
}

// 내용 검증 (게시물 생성)
function validateContent(content, validation) {
  if (!content || content.trim() === '') { // 비어있지 않으면 OK
    showError('contentInput', '*내용을 입력해주세요');
    validation.content = false;
    return false;
  }
  
  clearError('contentInput');
  validation.content = true;
  return true;
}