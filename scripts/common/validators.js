// 회원가입, 로그인 검증 로직

// 이메일 검증 (영문, 숫자, @, . 만 허용) - 회원가입/로그인
function validateEmail(email, validation, isSignin = true) {
  if (!email || email.trim() === '') {
    showError('emailInput', '*이메일을 입력해주세요.');
    validation.email = false;
    return false;
  }

  if (isSignin) {
    // 회원가입: 영문, 숫자, @, . 만 허용
    const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/;
    if (!emailRegex.test(email)) {
      showError('emailInput', '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)');
      validation.email = false;
      return false;
    }
  } else {
    // 로그인: @ 포함 여부만 검증
    if (!email.includes('@')) {
      showError('emailInput', '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)');
      validation.email = false;
      return false;
    }
  }
  
  clearError('emailInput');
  validation.email = true;
  return true;
}

// 비밀번호 검증 (8-20자, 대문자, 소문자, 숫자, 특수문자 각 1개 이상 체크) - 회원가입, 로그인
function validatePassword(password, validation, isSignin = true) {
  if (!password) {
    showError('passwordInput', '*비밀번호를 입력해주세요');
    validation.password = false;
    return false;
  }

  if (isSignin) {
    // 회원가입: 복잡한 검증
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if ((password.length < 8 || password.length > 20) && (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar)) {
      showError('passwordInput', '*비밀번호는 8자 이상 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.');
      formVavalidationlidation.password = false;
      return false;
    }
    
    // 비밀번호 확인도 다시 검증 (회원가입만)
    const passwordConfirmInput = document.getElementById('passwordConfirmInput');
    if (passwordConfirmInput && passwordConfirmInput.value) {
      validatePasswordConfirm(passwordConfirmInput.value, validation);
    }
  }
  
  clearError('passwordInput');
  validation.password = true;
  return true;
}

// 비밀번호 확인 검증
function validatePasswordConfirm(passwordConfirm, validation) {
  const password = document.getElementById('passwordInput').value;
  
  if (!passwordConfirm) {
    showError('passwordConfirmInput', '*비밀번호를 한번더 입력해주세요');
    validation.passwordConfirm = false;
    return false;
  }
  
  if (password !== passwordConfirm) {
    showError('passwordConfirmInput', '*비밀번호가 다릅니다.');
    validation.passwordConfirm = false;
    return false;
  }
  
  clearError('passwordConfirmInput');
  validation.passwordConfirm = true;
  return true;
}

// 닉네임 검증 (띄어쓰기 불가, 10글자 이내)
function validateNickname(nickname, validation) {
  if (!nickname || nickname.trim() === '') {
    showError('nicknameInput', '*닉네임을 입력해주세요.');
    validation.nickname = false;
    return false;
  }
  
  if (nickname.includes(' ')) {
    showError('nicknameInput', '*띄어쓰기를 없애주세요');
    validation.nickname = false;
    return false;
  }
  
  if (nickname.length > 10) {
    showError('nicknameInput', '*닉네임은 최대 10자 까지 작성 가능합니다.');
    validation.nickname = false;
    return false;
  }
  
  clearError('nicknameInput');
  validation.nickname = true;
  return true;
}