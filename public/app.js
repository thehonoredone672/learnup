/* LearnUp — shared frontend helpers.
 * - token/user storage in localStorage
 * - api() wrapper that attaches the bearer token
 * - renderTopbar() shared header
 * - tiny markdown for topic content and bubble text
 */
const LU = {
  get token() { try { return localStorage.getItem('lu_token'); } catch { return null; } },
  set token(v){ try { v ? localStorage.setItem('lu_token', v) : localStorage.removeItem('lu_token'); } catch{} },
  get user()  { try { return JSON.parse(localStorage.getItem('lu_user') || 'null'); } catch { return null; } },
  set user(v) { try { v ? localStorage.setItem('lu_user', JSON.stringify(v)) : localStorage.removeItem('lu_user'); } catch{} },

  clear(){ this.token = null; this.user = null; },

  async api(path, opts = {}){
    const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    const res = await fetch(path, Object.assign({}, opts, {
      headers,
      body: opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined,
    }));
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok){
      const err = new Error((data && data.error) || `HTTP ${res.status}`);
      err.status = res.status;
      if (res.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/register'){
        this.clear();
        location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search);
      }
      throw err;
    }
    return data;
  },

  requireAuth(){
    if (!this.token || !this.user){
      location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search);
      return false;
    }
    return true;
  },

  logout(){
    this.clear();
    location.href = '/login.html';
  },

  initials(name){
    return (name || '?').trim().split(/\s+/).slice(0,2).map(s => s[0]).join('').toUpperCase();
  },

  esc(s){
    const div = document.createElement('div');
    div.textContent = s == null ? '' : String(s);
    return div.innerHTML;
  },

  // Very small markdown: **bold**, `code`, - lists, blank-line paragraphs.
  md(text){
    if (!text) return '';
    const blocks = String(text).split(/\n\s*\n/);
    return blocks.map(block => {
      const lines = block.split('\n');
      if (lines.every(l => /^\s*-\s+/.test(l))){
        const items = lines.map(l => l.replace(/^\s*-\s+/, ''));
        return '<ul>' + items.map(i => '<li>' + this.inline(i) + '</li>').join('') + '</ul>';
      }
      return '<p>' + lines.map(l => this.inline(l)).join('<br>') + '</p>';
    }).join('');
  },
  inline(s){
    return this.esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  },

  renderTopbar(container, opts = {}){
    const u = this.user || { name: 'Guest', role: '' };
    const roleLabel = u.role ? (u.role[0].toUpperCase() + u.role.slice(1)) : '';
    container.innerHTML = `
      <div class="topbar-left">
        <a href="/dashboard.html" class="topbar-logo">L</a>
        <div>
          <div class="topbar-org">LearnUp</div>
          <div class="topbar-sub">${opts.subtitle || 'Digital Learning Platform'}</div>
        </div>
      </div>
      <div class="topbar-right">
        <a class="btn btn-sm" href="/dashboard.html">Courses</a>
        <a class="btn btn-sm" href="/progress.html">My progress</a>
        <div class="topbar-user">
          <div style="text-align:right;">
            <div class="topbar-user-name">${this.esc(u.name)}</div>
            <div class="topbar-user-role">${this.esc(roleLabel)}</div>
          </div>
          <div class="avatar">${this.initials(u.name)}</div>
        </div>
        <button class="btn btn-sm" id="lu-logout" type="button">
          <svg class="icon" style="width:14px;height:14px" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
          Log out
        </button>
      </div>`;
    document.getElementById('lu-logout').addEventListener('click', () => this.logout());
  },

  qs(name){
    return new URLSearchParams(location.search).get(name);
  },
};
