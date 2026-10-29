/* Acura Escolar — arranque, sessão, navegação e estrutura da aplicação */
(function () {
  const A = window.App;
  const esc = A.esc;
  const KEY = 'acura-escolar-db-v3';
  const store = {
    get: (s, k) => { try { return window[s].getItem(k); } catch (e) { return null; } },
    set: (s, k, v) => { try { window[s].setItem(k, v); } catch (e) { /* armazenamento indisponível */ } },
    del: (s, k) => { try { window[s].removeItem(k); } catch (e) { /* idem */ } }
  };
  A.state = { tab: null, sub: 0, kid: store.get('sessionStorage', 'acura-kid') };
  A.dirty = false;

  /* ---------- Dados ---------- */
  const loadDB = () => {
    const raw = store.get('localStorage', KEY);
    if (raw) { try { const d = JSON.parse(raw); if (d && d.version === 3) return d; } catch (e) { /* dados corrompidos */ } }
    return A.buildDB();
  };
  A.saveDB = () => store.set('localStorage', KEY, JSON.stringify(A.db));
  A.resetDB = () => { store.del('localStorage', KEY); A.db = A.buildDB(); A.saveDB(); A.toast('Dados de demonstração repostos.'); if (A.role) { A.initRole(A.role.id); A.renderShell(); } };

  /* ---------- Tema ---------- */
  A.theme = () => store.get('localStorage', 'acura-theme') || 'Sistema';
  A.setTheme = (t) => {
    store.set('localStorage', 'acura-theme', t);
    const r = document.documentElement;
    if (t === 'Escuro') r.dataset.theme = 'dark'; else if (t === 'Claro') r.dataset.theme = 'light'; else delete r.dataset.theme;
  };
  const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

  A.logo = (s = 28) => `<svg width="${s}" height="${s}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="var(--accent)"/><path d="M9 23 16 8l7 15" fill="none" stroke="var(--on-accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.8 17.5h8.4" stroke="var(--on-accent)" stroke-width="2.6" stroke-linecap="round"/></svg>`;

  /* ---------- Contexto do perfil ---------- */
  A.initRole = function (id) {
    const role = A.ROLES.find((r) => r.id === id);
    if (!role) return false;
    A.role = role;
    const db = A.db;
    db.contas = db.contas || {};
    db.contas[id] = db.contas[id] || role.user(db);
    A.user = db.contas[id];
    A.ctx = A.makeCtx();
    return true;
  };
  A.makeCtx = function () {
    const role = A.role, db = A.db;
    const ctx = {
      db, role, user: A.user, ro: !!role.ro,
      can: (p) => role.perms.includes(p) || (p === 'fin' && role.perms.includes('fin-view')),
      save: A.saveDB,
      log: (modulo, acao, detalhe, critico) => db.auditoria.unshift({ id: A.uid('LG'), data: A.now(), utilizador: A.user.nome, modulo: modulo || role.mod, acao, detalhe: detalhe || '', ip: '41.63.12.80', critico: critico ? 'Sim' : 'Não' })
    };
    if (role.prof) ctx.prof = db.professores.find((p) => p.id === db.demo[role.prof]);
    if (role.student) ctx.student = role.student(db);
    if (role.multi) { ctx.students = role.students(db); ctx.student = ctx.students.find((s) => s.id === A.state.kid) || ctx.students[0]; }
    return ctx;
  };
  A.setStudent = (id) => { A.state.kid = id; store.set('sessionStorage', 'acura-kid', id); A.ctx = A.makeCtx(); A.renderShell(); };

  /* ---------- Navegação ---------- */
  const parse = () => { const p = location.hash.replace(/^#\/?/, '').split('/'); return { role: p[0], tab: p[1], sub: +p[2] || 0 }; };
  A.go = (tab, sub = 0) => { location.hash = `#/${A.role.id}/${tab}/${sub}`; };
  const goPath = (path) => { const [t, s] = path.split('/'); A.go(t, +s || 0); };
  const apply = (r) => {
    if (!A.role || r.role !== A.role.id) { if (!A.initRole(r.role)) return renderLogin(); store.set('sessionStorage', 'acura-role', r.role); A.renderShell(r); return; }
    A.state.tab = A.role.tabs.some((t) => t.id === r.tab) ? r.tab : A.role.tabs[0].id;
    A.state.sub = r.sub;
    closeMenus();
    A.renderNav(); A.rerender();
    document.querySelector('.side').classList.remove('open');
    document.querySelector('.scrim').classList.remove('on');
    window.scrollTo(0, 0);
  };
  let lastHash = location.hash;
  window.addEventListener('hashchange', () => {
    const target = location.hash;
    if (target === lastHash) return;
    if (A.dirty) {
      history.replaceState(null, '', lastHash);
      A.confirm('Alterações por gravar', 'Existem alterações que ainda não foram gravadas. Sair desta página sem gravar?', () => { A.dirty = false; location.hash = target; }, 'danger', 'Sair sem gravar');
      return;
    }
    lastHash = target;
    const r = parse();
    if (!r.role) return renderLogin();
    apply(r);
  });
  window.addEventListener('beforeunload', (e) => { if (A.dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- Ecrã de entrada ---------- */
  function renderLogin() {
    A.role = null; A.dirty = false;
    document.body.className = 'is-login';
    const groups = A.ROLE_GROUPS.map(([g, ids]) => `<div class="rg"><h4>${g}</h4><div class="rg-list">${ids.map((id) => { const r = A.ROLES.find((x) => x.id === id); const u = r.user(A.db); return `<button class="role-card" data-role="${id}"><span class="avatar sm">${A.initials(u.nome)}</span><span><b>${esc(r.nome)}</b><small>${esc(u.nome)}</small></span>${A.icon('chevron')}</button>`; }).join('')}</div></div>`).join('');
    document.getElementById('app').innerHTML = `<div class="login">
      <section class="login-brand"><div class="lb-top">${A.logo(36)}<div><b>Acura Escolar</b><small>Sistema de gestão escolar</small></div></div>
        <div class="lb-mid"><h1>Toda a escola,<br>num só lugar.</h1><p>Secretaria, pedagogia, tesouraria, recursos humanos, stock, biblioteca e portais para alunos e encarregados — com perfis e permissões por função.</p>
        <ul><li>${A.icon('shield')}Acesso por perfil e registo de auditoria</li><li>${A.icon('checkCircle')}Fluxos de aprovação com responsável e motivo</li><li>${A.icon('grid')}Módulos ativados conforme a licença</li></ul></div>
        <div class="lb-foot">${esc(A.db.escola.nome)} · ${esc(A.db.escola.cidade)} · Ano letivo ${A.YEAR}</div></section>
      <section class="login-form"><div class="lf-inner">
        <h2>Iniciar sessão</h2><p class="muted">Utilize as credenciais institucionais.</p>
        <form class="form-grid one" data-login><label class="field"><span>Email ou n.º de processo</span><input name="u" autocomplete="username" placeholder="nome@acura.ao"></label><label class="field"><span>Palavra-passe</span><input name="p" type="password" autocomplete="current-password" placeholder="••••••••"></label><button class="btn primary block" type="submit">Entrar</button></form>
        <div class="divider"><span>Acesso de demonstração — escolha um perfil</span></div>
        <div class="roles">${groups}</div>
        <p class="muted xs mt">Os dados são fictícios e ficam guardados apenas neste navegador. <button class="link" data-reset>Repor dados</button></p>
      </div></section></div>`;
    document.querySelectorAll('[data-role]').forEach((b) => { b.onclick = () => login(b.dataset.role); });
    document.querySelector('[data-reset]').onclick = () => { A.resetDB(); renderLogin(); };
    document.querySelector('[data-login]').onsubmit = (e) => {
      e.preventDefault();
      const u = A.norm(e.target.u.value.trim());
      if (!u) return A.toast('Indique o email ou escolha um perfil de demonstração.', 'warn');
      const acc = A.db.utilizadores.find((x) => A.norm(x.email) === u);
      if (acc && acc.estado === 'Bloqueado') return A.toast('Conta bloqueada. Contacte o administrador.', 'bad');
      const role = acc ? acc.perfilId : A.db.alunos.some((a) => a.processo === u) ? 'aluno' : null;
      if (!role || !A.ROLES.some((r) => r.id === role)) return A.toast('Credenciais inválidas.', 'bad');
      login(role);
    };
  }
  function login(id) {
    if (!A.initRole(id)) return;
    store.set('sessionStorage', 'acura-role', id);
    A.ctx.log('Sessão', 'Início de sessão', `Perfil ${A.role.nome}`);
    A.saveDB();
    A.state.tab = null;
    location.hash = `#/${id}/${A.role.tabs[0].id}/0`;
    lastHash = location.hash;
    A.renderShell(parse());
  }
  function logout() {
    const go = () => { A.dirty = false; store.del('sessionStorage', 'acura-role'); store.del('sessionStorage', 'acura-kid'); A.state.kid = null; history.replaceState(null, '', location.pathname); lastHash = ''; renderLogin(); };
    if (A.dirty) A.confirm('Alterações por gravar', 'Terminar sessão sem gravar as alterações?', go, 'danger', 'Terminar sessão'); else go();
  }

  /* ---------- Estrutura principal ---------- */
  A.renderShell = function (r) {
    const role = A.role, db = A.db, u = A.user;
    if (r) { A.state.tab = role.tabs.some((t) => t.id === r.tab) ? r.tab : role.tabs[0].id; A.state.sub = r.sub || 0; }
    if (!A.state.tab) A.state.tab = role.tabs[0].id;
    A.ctx = A.makeCtx();
    document.body.className = `${role.portal ? 'is-portal' : ''} ${role.ro ? 'is-ro' : ''}`;
    const searchable = role.perms.includes('search') || role.perms.includes('search-own');
    document.getElementById('app').innerHTML = `<div class="shell">
      <aside class="side" aria-label="Navegação principal">
        <div class="brand">${A.logo(30)}<div><b>${esc(db.escola.nome)}</b><small>${esc(role.short)}</small></div><button class="icon-btn only-sm" data-close aria-label="Fechar menu">${A.icon('x')}</button></div>
        <nav class="nav" data-nav></nav>
        <div class="side-foot"><div class="avatar sm">${A.initials(u.nome)}</div><div class="sf-txt"><b>${esc(u.nome)}</b><small>${esc(role.nome)}</small></div><button class="icon-btn" data-logout title="Terminar sessão" aria-label="Terminar sessão">${A.icon('logout')}</button></div>
      </aside>
      <div class="scrim"></div>
      <div class="main">
        <header class="top">
          <button class="icon-btn only-sm" data-menu aria-label="Abrir menu">${A.icon('menu')}</button>
          ${searchable ? `<div class="gsearch">${A.icon('search')}<input type="search" data-gs placeholder="Pesquisar alunos por nome ou n.º de processo…" aria-label="Pesquisa global"><div class="gs-res" data-gsr></div></div>` : '<div class="grow"></div>'}
          ${role.multi && A.ctx.students.length > 1 ? `<label class="kid-sel">${A.icon('users')}<select data-kid aria-label="Educando">${A.ctx.students.map((s) => `<option value="${s.id}" ${s.id === A.ctx.student.id ? 'selected' : ''}>${esc(s.nome.split(' ')[0])} · ${esc(s.turma)}</option>`).join('')}</select></label>` : ''}
          <span class="date-chip hide-sm">${A.icon('calendar')}${A.date(A.TODAY)}</span>
          <button class="icon-btn" data-theme-t title="Alternar tema" aria-label="Alternar tema">${A.icon(isDark() ? 'sun' : 'moon')}</button>
          <div class="pop-wrap"><button class="icon-btn" data-bell aria-label="Notificações">${A.icon('bell')}<i class="dot-n" data-bn></i></button><div class="pop" data-bellp></div></div>
          <div class="pop-wrap"><button class="avatar-btn" data-um aria-label="Menu do utilizador"><span class="avatar sm">${A.initials(u.nome)}</span></button><div class="pop" data-ump>
            <div class="pop-h"><b>${esc(u.nome)}</b><small>${esc(u.email || '')}</small><small>${esc(role.nome)}</small></div>
            <button data-goprof>${A.icon('user')}Meu perfil</button><button data-switch>${A.icon('swap')}Mudar de perfil (demo)</button><button data-resetdb>${A.icon('refresh')}Repor dados de demonstração</button><button data-logout2>${A.icon('logout')}Terminar sessão</button></div></div>
        </header>
        ${role.ro ? `<div class="ro-banner">${A.icon('eye')}<span>Modo de leitura — este perfil consulta e exporta registos, mas não pode alterá-los.</span></div>` : ''}
        <div class="page" id="page"></div>
      </div>
      ${role.portal ? `<nav class="bottom-nav" data-bnav></nav>` : ''}
    </div>`;
    const q = (s) => document.querySelector(s);
    q('[data-logout]').onclick = logout; q('[data-logout2]').onclick = logout;
    q('[data-switch]').onclick = logout;
    q('[data-resetdb]').onclick = () => A.confirm('Repor dados', 'Todos os dados alterados nesta demonstração serão substituídos pelos dados iniciais.', () => A.resetDB(), 'danger', 'Repor');
    q('[data-goprof]').onclick = () => { closeMenus(); const t = role.tabs.find((x) => x.id === 'perfil' || x.id === 'seguranca') || role.tabs[role.tabs.length - 1]; A.go(t.id, 0); };
    q('[data-menu]').onclick = () => { q('.side').classList.add('open'); q('.scrim').classList.add('on'); };
    q('[data-close]').onclick = q('.scrim').onclick = () => { q('.side').classList.remove('open'); q('.scrim').classList.remove('on'); };
    q('[data-theme-t]').onclick = () => { A.setTheme(isDark() ? 'Claro' : 'Escuro'); q('[data-theme-t]').innerHTML = A.icon(isDark() ? 'sun' : 'moon'); };
    q('[data-um]').onclick = (e) => { e.stopPropagation(); const p = q('[data-ump]'); const on = !p.classList.contains('on'); closeMenus(); p.classList.toggle('on', on); };
    q('[data-bell]').onclick = (e) => { e.stopPropagation(); const p = q('[data-bellp]'); const on = !p.classList.contains('on'); closeMenus(); if (on) renderBell(); p.classList.toggle('on', on); };
    const ks = q('[data-kid]'); if (ks) ks.onchange = () => A.setStudent(ks.value);
    const gs = q('[data-gs]'); if (gs) bindSearch(gs);
    document.getElementById('page').addEventListener('click', (e) => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); goPath(g.dataset.go); } });
    A.renderNav(); A.rerender();
  };
  const closeMenus = () => document.querySelectorAll('.pop.on, .gs-res.on').forEach((p) => p.classList.remove('on'));
  document.addEventListener('click', (e) => { if (!e.target.closest('.pop') && !e.target.closest('.gsearch')) closeMenus(); });

  A.renderNav = function () {
    const role = A.role;
    const nav = document.querySelector('[data-nav]');
    if (!nav) return;
    nav.innerHTML = role.tabs.map((t) => `<a href="#/${role.id}/${t.id}/0" class="${t.id === A.state.tab ? 'on' : ''}" ${t.id === A.state.tab ? 'aria-current="page"' : ''}>${A.icon(t.ic)}<span>${esc(t.l)}</span><em class="nb" data-nb="${t.id}"></em></a>`).join('');
    const bn = document.querySelector('[data-bnav]');
    if (bn) {
      const main = (role.bottom || role.tabs.slice(0, 4).map((t) => [t.id, t.l.split(' ')[0]])).map(([id, l]) => [role.tabs.find((t) => t.id === id), l]);
      bn.innerHTML = main.map(([t, l]) => `<a href="#/${role.id}/${t.id}/0" class="${t.id === A.state.tab ? 'on' : ''}">${A.icon(t.ic)}<span>${esc(l)}</span></a>`).join('') + `<button data-more>${A.icon('menu')}<span>Mais</span></button>`;
      bn.querySelector('[data-more]').onclick = () => { document.querySelector('.side').classList.add('open'); document.querySelector('.scrim').classList.add('on'); };
    }
    A.refreshBadges();
  };
  A.refreshBadges = function () {
    if (!A.role) return;
    let total = 0;
    Object.entries(A.role.badges || {}).forEach(([tab, fn]) => {
      const n = fn(A.ctx); total += n;
      const el = document.querySelector(`[data-nb="${tab}"]`);
      if (el) { el.textContent = n || ''; el.classList.toggle('on', n > 0); }
    });
    const d = document.querySelector('[data-bn]'); if (d) d.classList.toggle('on', total > 0);
  };
  function renderBell() {
    const role = A.role, ctx = A.ctx;
    const items = Object.entries(role.badges || {}).map(([tab, fn]) => [role.tabs.find((t) => t.id === tab), fn(ctx)]).filter(([t, n]) => t && n);
    const feed = ctx.db.comunicados.filter((c) => c.estado === 'Publicado').slice(0, 3);
    document.querySelector('[data-bellp]').innerHTML = `<div class="pop-h"><b>Notificações</b></div>${items.map(([t, n]) => `<button data-go-b="${t.id}">${A.icon(t.ic)}<span>${esc(t.l)}</span><em class="nb on">${n}</em></button>`).join('')}${feed.map((c) => `<div class="pop-i">${A.icon('bell')}<div><p>${esc(c.titulo)}</p><small>${A.date(c.data)}</small></div></div>`).join('')}`;
    document.querySelectorAll('[data-go-b]').forEach((b) => { b.onclick = () => { closeMenus(); A.go(b.dataset.goB, 0); }; });
  }
  function bindSearch(inp) {
    const res = document.querySelector('[data-gsr]');
    let items = [];
    const draw = () => {
      const q = A.norm(inp.value.trim());
      if (q.length < 2) { res.classList.remove('on'); return; }
      const ctx = A.ctx, db = ctx.db;
      let al = db.alunos.filter((a) => A.norm(a.nome).includes(q) || a.processo.includes(q));
      if (A.role.perms.includes('search-own') && ctx.prof) { const ids = db.turmas.filter((t) => t.dtId === ctx.prof.id).map((t) => t.id); al = al.filter((a) => ids.includes(a.turmaId)); }
      al = al.slice(0, 7);
      // Processos disciplinares só aparecem para perfis autorizados
      const pd = ctx.can('disciplina') ? db.disciplinares.filter((p) => A.norm(p.id).includes(q) || A.norm(p.aluno).includes(q)).slice(0, 4) : [];
      items = [...al.map((a) => ({ k: 'a', a })), ...pd.map((p) => ({ k: 'p', p }))];
      res.innerHTML = (al.length ? `<h5>Alunos</h5>${al.map((a, i) => `<button data-i="${i}"><span class="avatar xs">${A.initials(a.nome)}</span><span><b>${esc(a.nome)}</b><small>${a.processo} · ${esc(a.turma)} · ${esc(a.estado)}</small></span></button>`).join('')}` : '') +
        (pd.length ? `<h5>${A.icon('lock')}Processos disciplinares · acesso restrito</h5>${pd.map((p, i) => `<button data-i="${al.length + i}"><span class="avatar xs warn">PD</span><span><b>${esc(p.id)} — ${esc(p.aluno)}</b><small>${esc(p.tipo)} · ${esc(p.estado)}</small></span></button>`).join('')}` : '') +
        (!al.length && !pd.length ? '<p class="muted pad">Sem resultados.</p>' : '');
      res.classList.add('on');
      res.querySelectorAll('[data-i]').forEach((b) => { b.onclick = () => { const it = items[+b.dataset.i]; res.classList.remove('on'); inp.value = ''; if (it.k === 'a') A.ficha(ctx, it.a); else { const t = A.role.tabs.find((x) => x.id === 'processos') ? 'processos' : 'ocorrencias'; A.go(t, A.role.id === 'disc' ? 1 : 1); } }; });
    };
    inp.addEventListener('input', draw);
    inp.addEventListener('focus', draw);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Escape') { res.classList.remove('on'); inp.blur(); } if (e.key === 'Enter') { const b = res.querySelector('[data-i]'); if (b) b.click(); } });
  }

  /* ---------- Conteúdo da subaba ---------- */
  A.rerender = function () {
    const role = A.role, ctx = (A.ctx = A.makeCtx());
    const t = role.tabs.find((x) => x.id === A.state.tab) || role.tabs[0];
    const si = Math.min(A.state.sub, t.subs.length - 1);
    const [label, cfg] = t.subs[si];
    A.dirty = false;
    const page = document.getElementById('page');
    page.innerHTML = `<div class="page-head"><div><p class="crumb">${esc(role.short)} ${A.icon('chevron')} ${esc(t.l)}</p><h1>${esc(t.subs.length > 1 ? label : t.l)}</h1></div>${role.multi ? `<div class="kid-tag">${A.icon('user')}${esc(ctx.student.nome)} · ${esc(ctx.student.turma)}</div>` : ''}</div>
      ${t.subs.length > 1 ? `<div class="subtabs" role="tablist">${t.subs.map((s, i) => `<a role="tab" href="#/${role.id}/${t.id}/${i}" class="${i === si ? 'on' : ''}" aria-selected="${i === si}">${esc(s[0])}</a>`).join('')}</div>` : ''}
      <div class="content" id="content"></div>`;
    const host = page.querySelector('#content');
    const st = page.querySelector('.subtabs .on'); if (st) st.scrollIntoView({ block: 'nearest', inline: 'center' });
    document.title = `${t.subs.length > 1 ? label + ' · ' : ''}${t.l} — Acura Escolar`;
    if (cfg.requires && !A.modActive(cfg.requires)) {
      const m = ctx.db.licenca.modulos.find((x) => x.id === cfg.requires);
      host.innerHTML = `<div class="card"><div class="empty">${A.icon('lock')}<h4>Módulo “${esc(m.nome)}” ${m.contratado ? 'inativo' : 'não contratado'}</h4><p>${m.contratado ? 'O módulo está incluído na licença mas foi desativado. O administrador da instituição pode ativá-lo em Módulos e licenças.' : 'Esta funcionalidade não faz parte do plano contratado. Pode ser ativada pelo fornecedor da plataforma conforme as necessidades da escola e as obrigações legais aplicáveis.'}</p></div></div>`;
      return;
    }
    try { A.V[cfg.v](host, cfg, ctx); } catch (err) {
      console.error(err);
      host.innerHTML = `<div class="card"><div class="empty">${A.icon('alert')}<h4>Não foi possível apresentar esta página</h4><p class="muted">${esc(err.message)}</p></div></div>`;
    }
    A.refreshBadges();
  };

  /* ---------- Arranque ---------- */
  A.setTheme(A.theme());
  A.db = loadDB();
  A.saveDB();
  const r = parse();
  const saved = store.get('sessionStorage', 'acura-role');
  if (r.role && A.initRole(r.role)) { lastHash = location.hash; A.renderShell(r); }
  else if (saved && A.initRole(saved)) { location.replace(`#/${saved}/${A.role.tabs[0].id}/0`); lastHash = location.hash; A.renderShell(parse()); }
  else renderLogin();
})();
