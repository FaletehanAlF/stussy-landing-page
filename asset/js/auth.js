// STUSSY Auth — login & register (frontend only, localStorage)
(function () {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const tabsWrap = document.querySelector('.auth-tabs');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTitle = document.getElementById('authTitle');
  const authDesc = document.getElementById('authDesc');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');

  let toastTimer;
  function showToast(msg, isError = false) {
    toastMsg.textContent = msg;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function switchMode(mode) {
    const isLogin = mode === 'login';
    tabLogin.classList.toggle('active', isLogin);
    tabRegister.classList.toggle('active', !isLogin);
    tabLogin.setAttribute('aria-selected', isLogin);
    tabRegister.setAttribute('aria-selected', !isLogin);
    tabsWrap.classList.toggle('register', !isLogin);
    loginForm.classList.toggle('active', isLogin);
    registerForm.classList.toggle('active', !isLogin);
    authTitle.textContent = isLogin ? 'LOGIN' : 'REGISTER';
    authDesc.textContent = isLogin
      ? 'Masuk ke akunmu untuk lanjut belanja drop terbaru.'
      : 'Buat akun Tribe gratis — cuma butuh 30 detik.';
    // dukung ?mode=register
    const url = new URL(window.location.href);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', url);
  }

  tabLogin.addEventListener('click', () => switchMode('login'));
  tabRegister.addEventListener('click', () => switchMode('register'));
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.goto));
  });

  // baca ?mode= dari link (mis. auth.html?mode=register)
  const initialMode = new URLSearchParams(window.location.search).get('mode');
  if (initialMode === 'register') switchMode('register');

  // show / hide password
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? '🙈' : '👁';
    });
  });

  // helpers validasi
  function setError(inputId, errId, msg) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errId);
    const wrap = input.closest('.input-wrap');
    if (msg) {
      err.textContent = msg;
      err.classList.add('show');
      wrap.classList.add('invalid');
      return false;
    }
    err.textContent = '';
    err.classList.remove('show');
    wrap.classList.remove('invalid');
    return true;
  }

  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const getUsers = () => {
    try { return JSON.parse(localStorage.getItem('stussy_users') || '[]'); }
    catch { return []; }
  };
  const saveUsers = users => localStorage.setItem('stussy_users', JSON.stringify(users));

  // strength meter
  const regPassword = document.getElementById('regPassword');
  const strengthBar = document.getElementById('strengthBar');
  regPassword.addEventListener('input', () => {
    const v = regPassword.value;
    let score = 0;
    if (v.length >= 6) score++;
    if (v.length >= 10) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) score++;
    strengthBar.className = 'strength' + (score ? ' l' + Math.min(score, 4) : '');
  });

  function withLoading(btn, fn, doneMsg) {
    btn.classList.add('loading');
    setTimeout(() => {
      btn.classList.remove('loading');
      fn();
    }, 900);
  }

  // LOGIN
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    let ok = true;
    ok = setError('loginEmail', 'err-loginEmail',
      !email.trim() ? 'Email wajib diisi.' : !emailOk(email) ? 'Format email tidak valid.' : '') && ok;
    ok = setError('loginPassword', 'err-loginPassword',
      !pass ? 'Password wajib diisi.' : pass.length < 6 ? 'Password minimal 6 karakter.' : '') && ok;
    if (!ok) return;

    const btn = document.getElementById('loginBtn');
    withLoading(btn, () => {
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user) {
        showToast('Akun tidak ditemukan. Daftar dulu yuk!', true);
        switchMode('register');
        document.getElementById('regEmail').value = email.trim();
        return;
      }
      if (user.password !== pass) {
        setError('loginPassword', 'err-loginPassword', 'Password salah. Coba lagi.');
        showToast('Password salah.', true);
        return;
      }
      const remember = document.getElementById('rememberMe').checked;
      const store = remember ? localStorage : sessionStorage;
      store.setItem('stussy_session', JSON.stringify({ name: user.name, email: user.email, loginAt: Date.now() }));
      showToast(`Welcome back, ${user.name}! 🎉`);
      setTimeout(() => { window.location.href = '../index.html'; }, 1100);
    });
  });

  // REGISTER
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    const agree = document.getElementById('agreeTerms').checked;

    let ok = true;
    ok = setError('regName', 'err-regName',
      !name.trim() ? 'Username wajib diisi.' : name.trim().length < 3 ? 'Username minimal 3 karakter.' : '') && ok;
    ok = setError('regEmail', 'err-regEmail',
      !email.trim() ? 'Email wajib diisi.' : !emailOk(email) ? 'Format email tidak valid.' : '') && ok;
    ok = setError('regPassword', 'err-regPassword',
      !pass ? 'Password wajib diisi.' : pass.length < 6 ? 'Password minimal 6 karakter.' : '') && ok;
    ok = setError('regConfirm', 'err-regConfirm',
      !confirm ? 'Konfirmasi password wajib diisi.' : confirm !== pass ? 'Konfirmasi tidak sama dengan password.' : '') && ok;

    const agreeErr = document.getElementById('err-agreeTerms');
    if (!agree) {
      agreeErr.textContent = 'Kamu harus menyetujui Syarat & Ketentuan.';
      agreeErr.classList.add('show');
      ok = false;
    } else {
      agreeErr.textContent = '';
      agreeErr.classList.remove('show');
    }
    if (!ok) return;

    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      setError('regEmail', 'err-regEmail', 'Email sudah terdaftar. Silakan login.');
      showToast('Email sudah terdaftar.', true);
      return;
    }

    const btn = document.getElementById('registerBtn');
    withLoading(btn, () => {
      users.push({ name: name.trim(), email: email.trim(), password: pass, createdAt: Date.now() });
      saveUsers(users);
      localStorage.setItem('stussy_session', JSON.stringify({ name: name.trim(), email: email.trim(), loginAt: Date.now() }));
      showToast(`Akun ${name.trim()} berhasil dibuat! 🎉`);
      registerForm.reset();
      strengthBar.className = 'strength';
      setTimeout(() => { window.location.href = '../index.html'; }, 1100);
    });
  });

  // live clear error saat mengetik
  ['loginEmail', 'loginPassword', 'regName', 'regEmail', 'regPassword', 'regConfirm'].forEach(id => {
    document.getElementById(id).addEventListener('input', e => {
      e.target.closest('.input-wrap').classList.remove('invalid');
      const err = document.getElementById('err-' + id);
      if (err) { err.textContent = ''; err.classList.remove('show'); }
    });
  });

  // tombol demo
  document.getElementById('forgotLink').addEventListener('click', e => {
    e.preventDefault();
    showToast('Link reset dikirim ke email kamu (demo).');
  });
  document.getElementById('googleLogin').addEventListener('click', () => {
    showToast('Login Google segera hadir (demo).');
  });
})();
