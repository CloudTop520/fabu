(function () {
  'use strict';

  /* ---------- 1. 主题切换（白天 / 夜晚） ---------- */
  var htmlEl = document.documentElement;
  var bodyEl = document.body;

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#eef1f7' : '#0b0f17');
  }

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
    });
  }

  /* ---------- 2. 访问验证（密码门 + 蜜罐机器人识别） ---------- */
  var GATE_PASSWORD = '666';   // ← 访问密码，按需修改（同时改 index.html 提示框）
  var gate = document.getElementById('gate');
  var gateForm = document.getElementById('gateForm');
  var gatePwd = document.getElementById('gatePwd');
  var gateError = document.getElementById('gateError');
  var gateTrap = document.getElementById('gateTrap');
  var appShell = document.getElementById('app-shell');
  var pageAuthed = false;

  function setLocked(locked) {
    if (locked) {
      htmlEl.classList.add('is-locked');
      bodyEl.classList.add('is-locked');
      gate.hidden = false;
      appShell.hidden = true;
    } else {
      htmlEl.classList.remove('is-locked');
      bodyEl.classList.remove('is-locked');
      gate.hidden = true;
      appShell.hidden = false;
    }
  }

  function deny(msg) {
    gateError.textContent = msg || '密码错误，请重试';
    gatePwd.classList.add('is-error');
    gatePwd.value = '';
    gatePwd.focus();
    setTimeout(function () { gatePwd.classList.remove('is-error'); }, 500);
  }

  function verify(val) {
    if (gateTrap && gateTrap.value) return false;   // 蜜罐被填 = 机器人
    return val === GATE_PASSWORD;
  }

  function unlockApp() {
    if (pageAuthed) return;
    pageAuthed = true;
    setLocked(false);
    try { sessionStorage.setItem('gate', 'ok'); } catch (e) {}
    bootApp();
  }

  function lockApp() {
    pageAuthed = false;
    setLocked(true);
    gatePwd.value = '';
    gateError.textContent = '';
    setTimeout(function () { gatePwd.focus(); }, 100);
  }

  if (gateForm) {
    gateForm.addEventListener('submit', function (e) {
      e.preventDefault();
      gateError.textContent = '';
      var val = (gatePwd.value || '').trim();
      if (!val) { deny('请输入密码'); return; }
      if (verify(val)) { unlockApp(); } else { deny('密码错误，请重试'); }
    });
  }

  // 同一标签页内已验证过则直接放行，否则显示密码门
  var alreadyAuthed = false;
  try { alreadyAuthed = sessionStorage.getItem('gate') === 'ok'; } catch (e) {}
  if (alreadyAuthed) { unlockApp(); } else { setLocked(true); setTimeout(function () { if (gatePwd) gatePwd.focus(); }, 120); }

  /* ---------- 3. 应用逻辑：选择卡片 + 弹窗 ---------- */
  // ⚠️ 这里设置「点击进入」弹窗里的两条线路链接：
  //    primary = 主线路，backup = 备用线路（都必须是完整 http(s):// 开头，注意冒号!）
  //    把下面 4 个值换成你自己的真实地址即可，HTML 不用动。
  var LINKS = {
    a: { primary: 'https://001.yunding.lat', backup: 'https://v3e51426181d1e600.yunding.sbs', title: '进入免流版', sub: '独立 App 一键连接 · 28元/月', cls: 'is-a' },
    b: { primary: 'https://002.cloudtop.sbs', backup: 'https://v03dy.cloudtop.sbs', title: '进入标准版', sub: '支持 Clash / 小火箭订阅 · 18元/月', cls: 'is-b' }
  };

  var booted = false;
  function bootApp() {
    if (booted) return;
    booted = true;

    var planA = document.getElementById('plan-a');
    var planB = document.getElementById('plan-b');
    var choiceModal = document.getElementById('choiceModal');
    var linkModal = document.getElementById('linkModal');
    var linkPrimary = document.getElementById('linkPrimary');
    var linkBackup = document.getElementById('linkBackup');
    var linkModalTitle = document.getElementById('linkModalTitle');
    var linkModalSub = document.getElementById('linkModalSub');
    var linkSwitch = document.getElementById('linkSwitch');
    var lockBtn = document.getElementById('lockBtn');
    var currentPick = null;

    function setModalLock(locked) { bodyEl.classList.toggle('is-modal-open', locked); }

    function highlightPick(pick) {
      currentPick = pick;
      var isA = pick === 'a';
      planA.classList.toggle('is-highlight', isA);
      planA.classList.toggle('is-dimmed', !isA);
      planA.setAttribute('aria-pressed', isA ? 'true' : 'false');
      planB.classList.toggle('is-highlight', !isA);
      planB.classList.toggle('is-dimmed', isA);
      planB.setAttribute('aria-pressed', !isA ? 'true' : 'false');
    }

    function openLinkModal(pick) {
      var cfg = LINKS[pick];
      if (!cfg) return;
      highlightPick(pick);
      linkPrimary.href = cfg.primary;
      linkBackup.href = cfg.backup;
      linkModalTitle.textContent = cfg.title;
      linkModalSub.textContent = cfg.sub;
      linkPrimary.className = 'link-modal__btn ' + cfg.cls;
      linkModal.classList.remove('is-hidden');
      setModalLock(true);
    }
    function closeLinkModal() { linkModal.classList.add('is-hidden'); setModalLock(false); }

    function openChoiceModal() {
      linkModal.classList.add('is-hidden');
      choiceModal.classList.remove('is-hidden');
      setModalLock(true);
    }
    function closeChoiceModal() { choiceModal.classList.add('is-hidden'); setModalLock(false); }

    function selectPlan(pick) {
      highlightPick(pick);
      closeChoiceModal();
      var target = pick === 'a' ? planA : planB;
      setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 120);
    }

    // 点击“点击进入”→ 线路弹窗
    document.querySelectorAll('.plan__enter').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openLinkModal(btn.getAttribute('data-pick'));
      });
    });

    // 点击卡片（除“进入”和“详情”）→ 选中
    function bindPlanSelect(el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('.plan__enter') || e.target.closest('.plan__details')) return;
        highlightPick(el.getAttribute('data-pick'));
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); highlightPick(el.getAttribute('data-pick')); }
      });
    }
    bindPlanSelect(planA);
    bindPlanSelect(planB);

    // 开场弹窗里的两个方案按钮
    document.querySelectorAll('.modal__opt').forEach(function (btn) {
      btn.addEventListener('click', function () { selectPlan(btn.getAttribute('data-pick')); });
    });

    // 重新选择方案 → 再开开场弹窗
    var reselect = document.getElementById('reselect-btn');
    if (reselect) reselect.addEventListener('click', openChoiceModal);

    // 重新输入密码 → 回到密码门
    if (lockBtn) lockBtn.addEventListener('click', lockApp);

    // 弹窗关闭（点背景）
    if (choiceModal) {
      var cBack = choiceModal.querySelector('[data-close-choice]');
      if (cBack) cBack.addEventListener('click', closeChoiceModal);
    }
    if (linkModal) {
      var lBack = linkModal.querySelector('[data-close-link]');
      if (lBack) lBack.addEventListener('click', closeLinkModal);
      if (linkSwitch) linkSwitch.addEventListener('click', openChoiceModal);
    }

    // 进入后先弹“你想要哪种方案？”
    openChoiceModal();
  }
})();
