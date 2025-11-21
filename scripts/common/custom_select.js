// scripts/common/customSelect.js

function initCustomSelects() {
  const allSelects = document.querySelectorAll('.custom-select');

  allSelects.forEach((wrapper) => {
    const targetId = wrapper.dataset.target;
    const hiddenSelect = document.getElementById(targetId);
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const menu = wrapper.querySelector('.custom-select-menu');

    if (!hiddenSelect || !trigger || !menu) return;

    // 초기 값 동기화 (hidden select에 값이 있을 때)
    syncFromHiddenSelect(wrapper, hiddenSelect, trigger, menu);

    // 트리거 클릭 → 열기/닫기
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('open');

      // 다른 셀렉트 닫기
      closeAllCustomSelects(wrapper);

      if (!isOpen) {
        wrapper.classList.add('open');
      } else {
        wrapper.classList.remove('open');
      }
    });

    // 옵션 클릭
    menu.addEventListener('click', (e) => {
      const optionEl = e.target.closest('.custom-select-option');
      if (!optionEl) return;

      const value = optionEl.dataset.value ?? '';
      const label = optionEl.textContent.trim();

      // hidden select 값 업데이트
      hiddenSelect.value = value;

      // 선택된 옵션 스타일
      menu.querySelectorAll('.custom-select-option').forEach((opt) => {
        opt.classList.toggle('is-selected', opt === optionEl);
      });

      // 🔹 트리거 텍스트만 업데이트 (화살표 span 안 붙임)
      trigger.textContent = label;
      wrapper.classList.toggle('has-value', value !== '');

      // change 이벤트 발생시켜서 기존 검증/로직 재사용
      hiddenSelect.dispatchEvent(new Event('change', { bubbles: true }));

      // 닫기
      wrapper.classList.remove('open');
    });
  });

  // 바깥 클릭 시 모든 드롭다운 닫기
  document.addEventListener('click', () => {
    closeAllCustomSelects();
  });
}

function closeAllCustomSelects(except) {
  document.querySelectorAll('.custom-select.open').forEach((el) => {
    if (el !== except) {
      el.classList.remove('open');
    }
  });
}

// 🔻 더 이상 화살표 span은 만들지 않으므로 이 함수는 제거
// function createArrowElement() { ... }  ← 삭제

function syncFromHiddenSelect(wrapper, hiddenSelect, trigger, menu) {
  if (!wrapper || !hiddenSelect || !trigger || !menu) return;

  const currentValue = hiddenSelect.value;
  const options = menu.querySelectorAll('.custom-select-option');

  if (!options.length) return;

  let matched = null;

  options.forEach((opt) => {
    const v = opt.dataset.value ?? '';
    if (v === currentValue) {
      matched = opt;
    }
  });

  options.forEach((opt) => {
    opt.classList.toggle('is-selected', opt === matched);
  });

  if (matched) {
    // 🔹 기존: textContent + arrow span
    trigger.textContent = matched.textContent.trim();
    wrapper.classList.add('has-value');
  } else {
    const first = options[0];
    trigger.textContent = first.textContent.trim();
    wrapper.classList.remove('has-value');
  }
}

function resetCustomSelectPlaceholder(wrapper, label) {
  const trigger = wrapper.querySelector('.custom-select-trigger');
  if (!trigger) return;

  // 🔹 placeholder도 텍스트만
  trigger.textContent = label;
  wrapper.classList.remove('has-value');
}

// 전역에서 쓸 수 있게 export 비슷하게
window.initCustomSelects = initCustomSelects;