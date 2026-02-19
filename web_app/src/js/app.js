const API_BASE = '';

const routes = [
  { path: /^#\/?$/, handler: () => go('#/spices') },

  { path: /^#\/login\/?$/, handler: renderLogin },
  { path: /^#\/register\/?$/, handler: renderRegister },
  { path: /^#\/profile\/?$/, handler: renderProfile },
  { path: /^#\/logout\/?$/, handler: doLogout },

  { path: /^#\/spices\/?$/, handler: renderSpices },
  { path: /^#\/spices\/add\/?$/, handler: () => renderSpiceForm({ mode: 'create' }) },
  { path: /^#\/spices\/edit\/(\d+)\/?$/, handler: (m) => renderSpiceForm({ mode: 'edit', id: Number(m[1]) }) },

  { path: /^#\/cards\/?$/, handler: renderCards },
  { path: /^#\/cards\/new\/?$/, handler: () => renderCardForm({ mode: 'create' }) },
  { path: /^#\/cards\/(\d+)\/edit\/?$/, handler: (m) => renderCardForm({ mode: 'edit', id: Number(m[1]) }) },

  { path: /^#\/outlets\/?$/, handler: renderOutlets },
  { path: /^#\/outlets\/new\/?$/, handler: () => renderOutletForm({ mode: 'create' }) },
  { path: /^#\/outlets\/(\d+)\/edit\/?$/, handler: (m) => renderOutletForm({ mode: 'edit', id: Number(m[1]) }) },

  { path: /^#\/employees\/?$/, handler: renderEmployees },
  { path: /^#\/employees\/new\/?$/, handler: () => renderEmployeeForm({ mode: 'create' }) },
  { path: /^#\/employees\/(\d+)\/edit\/?$/, handler: (m) => renderEmployeeForm({ mode: 'edit', id: Number(m[1]) }) },

  { path: /^#\/clients\/?$/, handler: renderClients },

  { path: /^#\/suppliers\/?$/, handler: renderSuppliers },
  { path: /^#\/suppliers\/new\/?$/, handler: () => renderSupplierForm({ mode: 'create' }) },
  { path: /^#\/suppliers\/(\d+)\/edit\/?$/, handler: (m) => renderSupplierForm({ mode: 'edit', id: Number(m[1]) }) },
  { path: /^#\/suppliers\/(\d+)\/spices\/?$/, handler: (m) => renderSupplierSpices({ id: Number(m[1]) }) },
];

const state = {
  auth: {
    isAdmin: false,
    isAuthenticated: false,
    hasClientSession: false,
  },
};

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function cloneTpl(id) {
  const tpl = qs(`#${id}`);
  if (!tpl) throw new Error(`Template not found: ${id}`);
  return tpl.content.cloneNode(true);
}

function setMain(contentNode) {
  const main = qs('#main-content');
  main.innerHTML = '';
  main.appendChild(contentNode);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function go(hash) {
  if (window.location.hash === hash) {
    onRoute();
    return;
  }
  window.location.hash = hash;
}

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function apiFetch(path, { method = 'GET', body = null } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  const init = {
    method,
    headers,
    credentials: 'include',
  };

  if (body !== null) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(apiUrl(path), init);
  const text = await res.text();

  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const message = (data && data.error) ? data.error : `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function loadSession() {
  try {
    const s = await apiFetch('/session/', { method: 'GET' });
    state.auth.isAdmin = Boolean(s.is_admin);
    state.auth.isAuthenticated = Boolean(s.is_authenticated);
    state.auth.hasClientSession = Boolean(s.has_client_session);
  } catch {
    state.auth.isAdmin = false;
    state.auth.isAuthenticated = false;
    state.auth.hasClientSession = false;
  }
}

function applyAuthToUI() {
  const adminOnly = qsa('[data-admin-only]');
  adminOnly.forEach((el) => {
    el.style.display = state.auth.isAdmin ? '' : 'none';
  });

  const favBtn = qs('[data-fav-open]');
  const showFav = !state.auth.isAdmin;
  favBtn.style.display = showFav ? '' : 'none';

  const profileLink = qs('#profile-link');
  const avatar = qs('#profile-avatar');
  const mobileAvatar = qs('#mobile-profile-avatar');

  if (state.auth.isAdmin) {
    profileLink.href = '#/logout';
    avatar.src = '/static/images/admin_icon.jpg';
    mobileAvatar.src = '/static/images/admin_icon.jpg';
    avatar.alt = 'Адмін';
    mobileAvatar.alt = 'Адмін';
    return;
  }

  if (state.auth.hasClientSession) {
    profileLink.href = '#/profile';
    avatar.src = '/static/images/user_avatar.jpg';
    mobileAvatar.src = '/static/images/user_avatar.jpg';
    avatar.alt = 'Профіль';
    mobileAvatar.alt = 'Профіль';
    return;
  }

  profileLink.href = '#/login';
  avatar.src = '/static/images/default_user.jpg';
  mobileAvatar.src = '/static/images/default_user.jpg';
  avatar.alt = 'User';
  mobileAvatar.alt = 'Профіль';
}

async function onRoute () {
  await loadSession();

  const hash = window.location.hash || '#/';
  const match = routes.find((r) => r.path.test(hash));
  if (!match) {
    go('#/spices');
    return;
  }

  const m = hash.match(match.path);
  await match.handler(m);

  applyAuthToUI();
};

function showError(root, message) {
  const box = qs('[data-error-box]', root);
  const text = qs('[data-error-text]', root);
  if (!box || !text) return;
  text.textContent = message;
  box.hidden = false;
}

function clearError(root) {
  const box = qs('[data-error-box]', root);
  if (box) box.hidden = true;
}

function pickCardImage(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('pro')) return '/static/images/pro_card.jpg';
  if (t.includes('advanced')) return '/static/images/adv_card.jpg';
  return '/static/images/new_card.jpg';
}

window.addEventListener('hashchange', onRoute);

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-route]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (!href.startsWith('#/')) return;
  e.preventDefault();
  go(href);
});

async function renderFavoritesPanel() {
  const content = qs('#fav-content');
  const guest = qs('#fav-guest');
  content.querySelectorAll('.fav-item, .empty-msg').forEach((n) => n.remove());

  if (!state.auth.hasClientSession || state.auth.isAdmin) {
    guest.hidden = false;
    return;
  }

  guest.hidden = true;

  let data;
  try {
    data = await apiFetch('/favorites/', { method: 'GET' });
  } catch {
    const p = document.createElement('p');
    p.className = 'empty-msg';
    p.textContent = 'Не вдалося завантажити улюблені.';
    content.appendChild(p);
    return;
  }

  const favorites = Array.isArray(data.favorites) ? data.favorites : [];
  if (favorites.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty-msg';
    p.textContent = 'У списку ще немає спецій';
    content.appendChild(p);
    return;
  }

  favorites.forEach((fav) => {
    const article = document.createElement('article');
    article.className = 'fav-item';

    const name = document.createElement('span');
    name.className = 'fav-name';
    name.textContent = `${fav.name}, `;

    const price = document.createElement('p');
    price.className = 'fav-price';
    price.textContent = `${fav.price} грн / 100 гр`;

    const del = document.createElement('a');
    del.href = '#';
    del.className = 'fav-delete-heart';
    del.title = 'Видалити з улюблених';
    del.textContent = '❤';
    del.dataset.favDelete = String(fav.spice_id);

    article.appendChild(name);
    article.appendChild(price);
    article.appendChild(del);
    content.appendChild(article);
  });
}

document.addEventListener('change', async (e) => {
  if (e.target && e.target.id === 'fav-toggle' && e.target.checked) {
    await renderFavoritesPanel();
  }
});

document.addEventListener('click', async (e) => {
  const del = e.target.closest('[data-fav-delete]');
  if (!del) return;
  e.preventDefault();

  const spiceId = Number(del.dataset.favDelete);
  if (!Number.isFinite(spiceId)) return;

  try {
    await apiFetch(`/favorites/add_del/${spiceId}/`, { method: 'POST', body: {} });
    await renderFavoritesPanel();
    if (window.location.hash.startsWith('#/spices')) await renderSpices();
  } catch (err) {
    alert(err.message);
  }
});

async function renderLogin() {
  const frag = cloneTpl('tpl-login');
  const root = frag.firstElementChild;

  const form = qs('[data-form="login"]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(root);

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      await apiFetch('/login/', { method: 'POST', body: payload });
      await loadSession();
      go('#/spices');
    } catch (err) {
      showError(root, err.message || 'Помилка входу');
    }
  });

  setMain(root);
}

async function renderRegister() {
  const frag = cloneTpl('tpl-register');
  const root = frag.firstElementChild;

  const form = qs('[data-form="register"]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(root);

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      await apiFetch('/register/', { method: 'POST', body: payload });
      await loadSession();
      go('#/profile');
    } catch (err) {
      showError(root, err.message || 'Помилка реєстрації');
    }
  });

  setMain(root);
}

async function doLogout() {
  try {
    await apiFetch('/logout/', { method: 'POST', body: {} });
  } catch {
  }
  await loadSession();
  go('#/login');
}

async function renderProfile() {
  const frag = cloneTpl('tpl-profile');
  const root = frag.firstElementChild;

  if (!state.auth.hasClientSession || state.auth.isAdmin) {
    go('#/login');
    return;
  }

  let data;
  try {
    data = await apiFetch('/profile/', { method: 'GET' });
  } catch (err) {
    showError(root, err.message);
    setMain(root);
    return;
  }

  qs('#id_ln', root).value = data.last_name || '';
  qs('#id_fn', root).value = data.first_name || '';
  qs('#id_mn', root).value = data.fathers_name || '';
  qs('#id_phone', root).value = data.phone_number || '';

  qs('[data-bonus-type]', root).textContent = data.bonus_card_type || '';
  qs('[data-bonus-count]', root).textContent = String(data.bonus_count ?? '');

  const form = qs('[data-form="profile"]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(root);

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      await apiFetch('/profile/', { method: 'POST', body: payload });
      go('#/profile');
    } catch (err) {
      showError(root, err.message || 'Не вдалося зберегти');
    }
  });

  const logoutLink = qs('[data-action="logout"]', root);
  logoutLink.addEventListener('click', async (e) => {
    e.preventDefault();
    await doLogout();
  });

  setMain(root);
}

async function renderSpices() {
  const frag = cloneTpl('tpl-spices');
  const root = frag.firstElementChild;
  const grid = qs('#spice-grid', root);

  let data;
  try {
    data = await apiFetch('/spices/', { method: 'GET' });
  } catch (err) {
    showError(root, err.message);
    setMain(root);
    return;
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];
  const favIds = new Set(Array.isArray(data.fav_ids) ? data.fav_ids : []);

  rows.forEach((row) => {
    const itemFrag = cloneTpl('tpl-spice-card');
    const card = itemFrag.firstElementChild;

    const values = Array.isArray(row.values) ? row.values : [];
    const spiceId = row.id;

    const img = qs('img.spice-img', card);
    img.alt = values[1] || '';

    qs('.spice-title', card).textContent = values[1] || '';
    qs('[data-type]', card).textContent = values[2] || '';
    qs('[data-purpose]', card).textContent = values[3] || '';
    qs('[data-price]', card).textContent = values[4] || '';

    const heart = qs('[data-fav-toggle]', card);
    if (state.auth.isAdmin) {
      heart.style.display = 'none';
    } else {
      heart.dataset.spiceId = String(spiceId);
      heart.classList.toggle('active', favIds.has(spiceId));
    }

    if (state.auth.isAdmin) {
      card.addEventListener('click', () => go(`#/spices/edit/${spiceId}`));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') go(`#/spices/edit/${spiceId}`);
      });
    }

    grid.appendChild(card);
  });

  setMain(root);
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-fav-toggle]');
  if (!btn) return;

  e.preventDefault();
  if (state.auth.isAdmin) return;

  if (!state.auth.hasClientSession) {
    go('#/login');
    return;
  }

  const spiceId = Number(btn.dataset.spiceId);
  if (!Number.isFinite(spiceId)) return;

  try {
    await apiFetch(`/favorites/add_del/${spiceId}/`, { method: 'POST', body: {} });
    btn.classList.toggle('active');
  } catch (err) {
    alert(err.message);
  }
});

async function renderSpiceForm({ mode, id }) {
  if (!state.auth.isAdmin) {
    go('#/spices');
    return;
  }

  const frag = cloneTpl('tpl-spice-form');
  const root = frag.firstElementChild;

  const title = qs('[data-title]', root);
  const danger = qs('[data-danger-zone]', root);

  let obj = null;
  if (mode === 'edit') {
    title.textContent = 'Редагування спеції';
    danger.hidden = false;

    try {
      obj = await apiFetch(`/spices/${id}/`, { method: 'GET' });
    } catch (err) {
      showError(root, err.message);
      setMain(root);
      return;
    }

    qs('#id_name', root).value = obj.name || '';
    qs('#id_type', root).value = obj.type || '';
    qs('#id_purpose', root).value = obj.purpose || '';
    qs('#id_price', root).value = obj.price ?? '';
    qs('#id_supplier', root).value = obj.current_supplier || '';
  } else {
    title.textContent = 'Створення спеції';
    danger.hidden = true;
  }

  const form = qs('[data-form="spice"]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(root);

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      if (mode === 'edit') {
        await apiFetch(`/spices/edit/${id}/`, { method: 'POST', body: payload });
      } else {
        await apiFetch('/spices/add/', { method: 'POST', body: payload });
      }
      go('#/spices');
    } catch (err) {
      showError(root, err.message || 'Не вдалося зберегти');
    }
  });

  const delBtn = qs('[data-action="spice-delete"]', root);
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm('Видалити спецію?')) return;
      try {
        await apiFetch(`/spices/delete/${id}/`, { method: 'POST', body: {} });
        go('#/spices');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  setMain(root);
}

async function renderCards() {
  const frag = cloneTpl('tpl-cards');
  const root = frag.firstElementChild;
  const list = qs('#cards-list', root);

  let data;
  try {
    data = await apiFetch('/cards/', { method: 'GET' });
  } catch (err) {
    showError(root, err.message);
    setMain(root);
    return;
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];
  rows.forEach((row) => {
    const itemFrag = cloneTpl('tpl-card-item');
    const card = itemFrag.firstElementChild;

    const values = Array.isArray(row.values) ? row.values : [];
    const { id } = row;

    const type = values[1] || '';
    const img = qs('img', card);
    img.src = pickCardImage(type);
    img.alt = `Візуалізація картки ${type}`;

    qs('[data-type-title]', card).textContent = String(type).toUpperCase();
    qs('[data-bonus]', card).textContent = `${values[2] || ''}%`;
    qs('[data-discount]', card).textContent = `${values[3] || ''}%`;

    if (state.auth.isAdmin) {
      card.addEventListener('click', () => go(`#/cards/${id}/edit`));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') go(`#/cards/${id}/edit`);
      });
    }

    list.appendChild(card);
  });

  setMain(root);
}

async function renderCardForm({ mode, id }) {
  if (!state.auth.isAdmin) {
    go('#/cards');
    return;
  }

  const frag = cloneTpl('tpl-bonus-card-form');
  const root = frag.firstElementChild;

  const title = qs('[data-title]', root);
  const danger = qs('[data-danger-zone]', root);

  if (mode === 'edit') {
    title.textContent = 'Редагувати бонусну картку';
    danger.hidden = false;

    try {
      const obj = await apiFetch(`/cards/${id}/`, { method: 'GET' });
      qs('#id_type', root).value = obj.type || '';
      qs('#id_bonus', root).value = obj.bonus_percent ?? '';
      qs('#id_discount', root).value = obj.discount ?? '';
    } catch (err) {
      showError(root, err.message);
      setMain(root);
      return;
    }
  } else {
    title.textContent = 'Додати бонусну картку';
    danger.hidden = true;
  }

  const form = qs('[data-form="card"]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(root);

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      if (mode === 'edit') {
        await apiFetch(`/cards/${id}/edit/`, { method: 'POST', body: payload });
      } else {
        await apiFetch('/cards/new/', { method: 'POST', body: payload });
      }
      go('#/cards');
    } catch (err) {
      showError(root, err.message || 'Не вдалося зберегти');
    }
  });

  const delBtn = qs('[data-action="card-delete"]', root);
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm('Видалити картку?')) return;
      try {
        await apiFetch(`/cards/${id}/delete/`, { method: 'POST', body: {} });
        go('#/cards');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  setMain(root);
}

async function renderOutlets() {
  const frag = cloneTpl('tpl-outlets');
  const root = frag.firstElementChild;
  const list = qs('#outlets-list', root);

  let data;
  try {
    data = await apiFetch('/outlets/', { method: 'GET' });
  } catch (err) {
    showError(root, err.message);
    setMain(root);
    return;
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];
  rows.forEach((row) => {
    const itemFrag = cloneTpl('tpl-outlet-item');
    const card = itemFrag.firstElementChild;

    const values = Array.isArray(row.values) ? row.values : [];
    const { id } = row;

    const img = qs('img', card);
    img.alt = `Торгова точка ${values[1] || ''}`;

    qs('[data-name]', card).textContent = values[1] || '';
    qs('[data-address]', card).textContent = values[2] || '';

    if (state.auth.isAdmin) {
      card.addEventListener('click', () => go(`#/outlets/${id}/edit`));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') go(`#/outlets/${id}/edit`);
      });
    }

    list.appendChild(card);
  });

  setMain(root);
}

async function renderOutletForm({ mode, id }) {
  if (!state.auth.isAdmin) {
    go('#/outlets');
    return;
  }

  const frag = cloneTpl('tpl-outlet-form');
  const root = frag.firstElementChild;

  const title = qs('[data-title]', root);
  const danger = qs('[data-danger-zone]', root);

  if (mode === 'edit') {
    title.textContent = 'Редагувати торгову точку';
    danger.hidden = false;

    try {
      const obj = await apiFetch(`/outlets/${id}/`, { method: 'GET' });
      qs('#id_name', root).value = obj.name || '';
      qs('#id_address', root).value = obj.address || '';
    } catch (err) {
      showError(root, err.message);
      setMain(root);
      return;
    }
  } else {
    title.textContent = 'Додати торгову точку';
    danger.hidden = true;
  }

  const form = qs('[data-form="outlet"]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(root);

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      if (mode === 'edit') {
        await apiFetch(`/outlets/${id}/edit/`, { method: 'POST', body: payload });
      } else {
        await apiFetch('/outlets/new/', { method: 'POST', body: payload });
      }
      go('#/outlets');
    } catch (err) {
      showError(root, err.message || 'Не вдалося зберегти');
    }
  });

  const delBtn = qs('[data-action="outlet-delete"]', root);
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm('Видалити торгову точку?')) return;
      try {
        await apiFetch(`/outlets/${id}/delete/`, { method: 'POST', body: {} });
        go('#/outlets');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  setMain(root);
}

async function renderEmployees() {
  if (!state.auth.isAdmin) {
    go('#/spices');
    return;
  }

  const frag = cloneTpl('tpl-employees');
  const root = frag.firstElementChild;
  const list = qs('#employees-list', root);

  let data;
  try {
    data = await apiFetch('/employees/', { method: 'GET' });
  } catch (err) {
    showError(root, err.message);
    setMain(root);
    return;
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];
  rows.forEach((row) => {
    const itemFrag = cloneTpl('tpl-employee-item');
    const card = itemFrag.firstElementChild;

    const values = Array.isArray(row.values) ? row.values : [];
    const { id } = row;

    qs('[data-fullname]', card).textContent = `${values[1] || ''} ${values[2] || ''} ${values[3] || ''}`.trim();
    qs('[data-position]', card).textContent = values[4] || '';
    qs('[data-shift]', card).textContent = `(Зміна: ${values[5] || ''})`;
    qs('[data-outlet]', card).textContent = values[6] || '';
    qs('[data-phone]', card).textContent = values[7] || '';

    card.addEventListener('click', () => go(`#/employees/${id}/edit`));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') go(`#/employees/${id}/edit`);
    });

    list.appendChild(card);
  });

  setMain(root);
}

async function renderEmployeeForm({ mode, id }) {
  if (!state.auth.isAdmin) {
    go('#/spices');
    return;
  }

  const frag = cloneTpl('tpl-employee-form');
  const root = frag.firstElementChild;

  const title = qs('[data-title]', root);
  const danger = qs('[data-danger-zone]', root);

  let outletsData = null;
  try {
    outletsData = await apiFetch('/outlets/', { method: 'GET' });
  } catch {
    outletsData = { rows: [] };
  }

  const outlets = Array.isArray(outletsData.rows) ? outletsData.rows : [];
  const select = qs('#id_outlet', root);
  outlets.forEach((r) => {
    const values = Array.isArray(r.values) ? r.values : [];
    const opt = document.createElement('option');
    opt.value = String(r.id);
    opt.textContent = `${values[1] || ''} (${values[2] || ''})`;
    select.appendChild(opt);
  });

  if (mode === 'edit') {
    title.textContent = 'Редагувати дані працівника';
    danger.hidden = false;

    try {
      const obj = await apiFetch(`/employees/${id}/`, { method: 'GET' });
      qs('#id_last_name', root).value = obj.last_name || '';
      qs('#id_first_name', root).value = obj.first_name || '';
      qs('#id_fathers_name', root).value = obj.fathers_name || '';
      qs('#id_position', root).value = obj.position || '';
      qs('#id_shift', root).value = obj.shift ?? '';
      qs('#id_phone', root).value = obj.phone_number || '';
      qs('#id_outlet', root).value = obj.outlet_id ? String(obj.outlet_id) : '';
    } catch (err) {
      showError(root, err.message);
      setMain(root);
      return;
    }
  } else {
    title.textContent = 'Додати працівника';
    danger.hidden = true;
  }

  const form = qs('[data-form="employee"]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(root);

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      if (mode === 'edit') {
        await apiFetch(`/employees/${id}/edit/`, { method: 'POST', body: payload });
      } else {
        await apiFetch('/employees/new/', { method: 'POST', body: payload });
      }
      go('#/employees');
    } catch (err) {
      showError(root, err.message || 'Не вдалося зберегти');
    }
  });

  const delBtn = qs('[data-action="employee-delete"]', root);
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm('Видалити працівника?')) return;
      try {
        await apiFetch(`/employees/${id}/delete/`, { method: 'POST', body: {} });
        go('#/employees');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  setMain(root);
}

async function renderClients() {
  if (!state.auth.isAdmin) {
    go('#/spices');
    return;
  }

  const frag = cloneTpl('tpl-clients');
  const root = frag.firstElementChild;
  const list = qs('#clients-list', root);

  let data;
  try {
    data = await apiFetch('/clients/', { method: 'GET' });
  } catch (err) {
    showError(root, err.message);
    setMain(root);
    return;
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];
  rows.forEach((row) => {
    const itemFrag = cloneTpl('tpl-client-item');
    const card = itemFrag.firstElementChild;

    const values = Array.isArray(row.values) ? row.values : [];
    const { id } = row;

    qs('[data-fullname]', card).textContent = `${values[1] || ''} ${values[2] || ''} ${values[3] || ''}`.trim();
    qs('[data-card-type]', card).textContent = values[4] || '';
    qs('[data-bonus-count]', card).textContent = String(values[5] ?? '');
    qs('[data-phone]', card).textContent = values[6] || '';

    const delBtn = qs('[data-action="client-delete"]', card);
    delBtn.addEventListener('click', async () => {
      if (!confirm('Видалити клієнта?')) return;
      try {
        await apiFetch(`/clients/${id}/delete/`, { method: 'POST', body: {} });
        await renderClients();
      } catch (err) {
        alert(err.message);
      }
    });

    list.appendChild(card);
  });

  setMain(root);
}

async function renderSuppliers() {
  if (!state.auth.isAdmin) {
    go('#/spices');
    return;
  }

  const frag = cloneTpl('tpl-suppliers');
  const root = frag.firstElementChild;
  const list = qs('#suppliers-list', root);

  let data;
  try {
    data = await apiFetch('/suppliers/', { method: 'GET' });
  } catch (err) {
    showError(root, err.message);
    setMain(root);
    return;
  }

  const rows = Array.isArray(data.rows) ? data.rows : [];
  rows.forEach((row) => {
    const itemFrag = cloneTpl('tpl-supplier-item');
    const card = itemFrag.firstElementChild;

    const values = Array.isArray(row.values) ? row.values : [];
    const { id } = row;

    qs('[data-name]', card).textContent = values[1] || '';
    qs('[data-address]', card).textContent = values[2] || '';
    qs('[data-phone]', card).textContent = values[3] || '';

    card.addEventListener('click', () => go(`#/suppliers/${id}/edit`));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') go(`#/suppliers/${id}/edit`);
    });

    const spicesLink = qs('[data-action="supplier-spices"]', card);
    spicesLink.addEventListener('click', (e) => {
      e.preventDefault();
      go(`#/suppliers/${id}/spices`);
    });

    list.appendChild(card);
  });

  setMain(root);
}

async function renderSupplierForm({ mode, id }) {
  if (!state.auth.isAdmin) {
    go('#/spices');
    return;
  }

  const frag = cloneTpl('tpl-supplier-form');
  const root = frag.firstElementChild;

  const title = qs('[data-title]', root);
  const danger = qs('[data-danger-zone]', root);
  const inventory = qs('[data-supplier-inventory]', root);
  const spicesList = qs('[data-spices-list]', root);
  const spicesEmpty = qs('[data-spices-empty]', root);

  if (mode === 'edit') {
    title.textContent = 'Редагування постачальника';
    danger.hidden = false;
    inventory.hidden = false;

    try {
      const obj = await apiFetch(`/suppliers/${id}/`, { method: 'GET' });
      qs('#id_name', root).value = obj.name || '';
      qs('#id_address', root).value = obj.address || '';
      qs('#id_phone', root).value = obj.phone_number || '';

      const spices = Array.isArray(obj.spices) ? obj.spices : [];
      spicesList.innerHTML = '';
      if (spices.length === 0) {
        spicesEmpty.hidden = false;
      } else {
        spicesEmpty.hidden = true;
        spices.forEach((s) => {
          const li = document.createElement('li');
          li.className = 'inline-list__item';
          li.textContent = String(s);
          spicesList.appendChild(li);
        });
      }
    } catch (err) {
      showError(root, err.message);
      setMain(root);
      return;
    }
  } else {
    title.textContent = 'Створення постачальника';
    danger.hidden = true;
    inventory.hidden = true;
  }

  const form = qs('[data-form="supplier"]', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError(root);

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      if (mode === 'edit') {
        await apiFetch(`/suppliers/${id}/edit/`, { method: 'POST', body: payload });
      } else {
        await apiFetch('/suppliers/new/', { method: 'POST', body: payload });
      }
      go('#/suppliers');
    } catch (err) {
      showError(root, err.message || 'Не вдалося зберегти');
    }
  });

  const delBtn = qs('[data-action="supplier-delete"]', root);
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm('Видалити постачальника?')) return;
      try {
        await apiFetch(`/suppliers/${id}/delete/`, { method: 'POST', body: {} });
        go('#/suppliers');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  setMain(root);
}

async function renderSupplierSpices({ id }) {
  if (!state.auth.isAdmin) {
    go('#/spices');
    return;
  }

  const frag = cloneTpl('tpl-supplier-spices');
  const root = frag.firstElementChild;

  let data;
  try {
    data = await apiFetch(`/suppliers/${id}/spices/`, { method: 'GET' });
  } catch (err) {
    showError(root, err.message);
    setMain(root);
    return;
  }

  qs('[data-supplier-name]', root).textContent = data.supplier_name || 'Постачальник';

  const list = qs('[data-spices-list]', root);
  const empty = qs('[data-empty]', root);

  const spices = Array.isArray(data.spices) ? data.spices : [];
  list.innerHTML = '';

  if (spices.length === 0) {
    empty.hidden = false;
  } else {
    empty.hidden = true;
    spices.forEach((s) => {
      const li = document.createElement('li');
      li.className = 'inline-list__item';
      li.textContent = String(s);
      list.appendChild(li);
    });
  }

  setMain(root);
}

(async function init() {
  if (!window.location.hash) window.location.hash = '#/spices';
  await onRoute();
}());
