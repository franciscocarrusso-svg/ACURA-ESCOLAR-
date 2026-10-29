/* Acura Escolar — componentes de interface reutilizáveis */
(function () {
  const A = (window.App = window.App || {});

  /* ---------- Formatação ---------- */
  const esc = (A.esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const nf = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 0 });
  A.num = (n) => nf.format(Math.round(n || 0));
  A.money = (n) => `${nf.format(Math.round(n || 0))} Kz`;
  A.date = (d) => (d && /^\d{4}-\d{2}-\d{2}/.test(d) ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}${d.length > 10 ? ' ' + d.slice(11) : ''}` : d || '—');
  A.pct = (n) => `${Math.round(n)}%`;
  A.norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  A.initials = (n) => n.replace(/^(Dr|Dra|Prof)\.?\s+/, '').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  A.uid = (p) => `${p}${Date.now().toString(36).slice(-5)}${Math.floor(Math.random() * 99)}`;
  A.now = () => { const d = new Date(); return `${A.TODAY} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  A.sum = (arr, k) => arr.reduce((s, x) => s + ((typeof k === 'function' ? k(x) : x[k]) || 0), 0);
  A.uniq = (arr) => [...new Set(arr.filter((x) => x != null && x !== ''))];
  A.MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const TONE = {
    ok: ['ativo', 'ativa', 'pago', 'aprovado', 'aprovada', 'emitido', 'disponivel', 'concluido', 'concluida', 'confirmado', 'confirmada', 'publicado', 'resolvido', 'vigente', 'normal', 'conferido', 'presenca', 'ligado', 'validado', 'completo', 'recebida', 'satisfeita', 'lida', 'enviada', 'devolvido', 'selecionado', 'fechado', 'positiva', 'em curso', 'atribuida', 'processado', 'realizada', 'lancada', 'lancado', 'sim', 'paga', 'cumprido', 'reconciliado', 'atual'],
    warn: ['pendente', 'rascunho', 'parcial', 'em analise', 'submetida', 'reservado', 'agendada', 'agendado', 'por confirmar', 'em verificacao', 'por aprovar', 'a renovar', 'critico', 'atraso', 'em instrucao', 'em acompanhamento', 'nova', 'documentos em falta', 'entregue — por validar', 'por emitir', 'entrevista agendada', 'por processar', 'por submeter', 'em conferencia', 'media', 'grave', 'estavel', 'em correcao', 'reimpressao pedida', 'de ferias', 'de licenca', 'planeado', 'por pagar', 'aberta', 'aberto', 'emprestado', 'em manutencao', 'fechado com diferenca', 'com diferenca', 'encomendada', 'ativo — aguarda'],
    bad: ['bloqueado', 'vencido', 'anulada', 'anulado', 'rejeitado', 'rejeitada', 'esgotado', 'atrasado', 'falta', 'expirado', 'nao selecionado', 'em falta', 'muito grave', 'alta', 'negativa', 'indeferido', 'incompleto', 'danificado', 'desligado', 'indisponivel', 'suspenso', 'cancelada', 'cancelado', 'nao'],
    info: ['transferida', 'devolvida', 'encaminhada', 'encaminhado', 'encaminhado a direcao', 'entrada', 'saida', 'venda', 'em curso', 'isento', 'isenta', 'arquivado', 'leve', 'baixa', 'satisfeita', 'personalizado', 'sistema', 'inativo', 'inativa', 'encerrado']
  };
  A.tone = (v) => { const n = A.norm(v); for (const k of ['ok', 'bad', 'warn', 'info']) if (TONE[k].includes(n)) return k; return 'muted'; };
  A.badge = (v, tone) => (v == null || v === '' ? '—' : `<span class="badge ${tone || A.tone(v)}">${esc(v)}</span>`);

  A.fmt = (v, t) => {
    if (v == null || v === '') return '<span class="muted">—</span>';
    if (t === 'money') return `<span class="nowrap num">${A.money(v)}</span>`;
    if (t === 'date') return `<span class="nowrap">${A.date(v)}</span>`;
    if (t === 'badge') return A.badge(v);
    if (t === 'num') return `<span class="num">${esc(v)}</span>`;
    if (Array.isArray(v)) return esc(v.join(', '));
    return esc(v);
  };

  /* ---------- Ícones (traço 1.75, 24×24) ---------- */
  const P = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
    layers: 'm12 2 10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5',
    building: 'M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2',
    calendar: 'M4 5h16v16H4zM16 3v4M8 3v4M4 10h16',
    file: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
    box: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
    plug: 'M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4',
    history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
    chart: 'M3 3v18h18M7 15v2M11 10v7M15 6v11M19 12v5',
    check: 'M20 6 9 17l-5-5',
    checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3',
    wallet: 'M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14h.01',
    book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
    clipboard: 'M9 3h6v4H9zM9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3M9 13l2 2 4-4',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
    mail: 'M4 4h16v16H4zM4 6l8 7 8-7',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
    plus: 'M12 5v14M5 12h14',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    menu: 'M3 6h18M3 12h18M3 18h18',
    x: 'M18 6 6 18M6 6l12 12',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
    edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    cash: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 12h.01M18 12h.01',
    bank: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3',
    tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01',
    truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    archive: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
    grad: 'M22 10 12 5 2 10l10 5zM6 12v5c3 3 9 3 12 0v-5',
    message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
    star: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
    trend: 'M23 6 13.5 15.5l-5-5L1 18M17 6h6v6',
    trendDown: 'M23 18 13.5 8.5l-5 5L1 6M17 18h6v-6',
    chevron: 'm9 18 6-6-6-6',
    chevronDown: 'm6 9 6 6 6-6',
    moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
    card: 'M2 5h20v14H2zM2 10h20M6 15h4',
    swap: 'M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16',
    undo: 'M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    pie: 'M21.2 15.9A10 10 0 1 1 8 2.8M22 12A10 10 0 0 0 12 2v10z',
    key: 'M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4',
    globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20'
  };
  A.icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || P.grid}"/></svg>`;

  /* ---------- Toast ---------- */
  A.toast = function (msg, type = 'ok') {
    let host = document.getElementById('toasts');
    if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${A.icon(type === 'bad' ? 'alert' : type === 'warn' ? 'info' : 'checkCircle')}<span>${esc(msg)}</span>`;
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3600);
  };

  /* ---------- Modal ---------- */
  A.modal = function ({ title, sub, body, actions = [], size = '', onOpen }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><div><h3>${esc(title)}</h3>${sub ? `<p class="muted">${sub}</p>` : ''}</div><button class="icon-btn" data-x aria-label="Fechar">${A.icon('x')}</button></div>
      <div class="modal-body">${body || ''}</div>
      ${actions.length ? `<div class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-a="${i}" ${a.disabled ? 'disabled' : ''}>${a.icon ? A.icon(a.icon) : ''}${esc(a.l)}</button>`).join('')}</div>` : ''}
    </div>`;
    const close = () => { wrap.classList.add('out'); setTimeout(() => wrap.remove(), 150); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('[data-x]').onclick = close;
    wrap.querySelectorAll('[data-a]').forEach((b) => { b.onclick = () => { const a = actions[+b.dataset.a]; if (!a.fn || a.fn(wrap.querySelector('.modal-body'), close) !== false) close(); }; });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    const first = wrap.querySelector('.modal-body input:not([readonly]), .modal-body select, .modal-body textarea');
    if (first) setTimeout(() => first.focus(), 30);
    if (onOpen) onOpen(wrap.querySelector('.modal-body'), close);
    return close;
  };
  A.confirm = (title, text, fn, cls = 'primary', label = 'Confirmar') => A.modal({ title, body: `<p>${text}</p>`, size: 'sm', actions: [{ l: 'Cancelar' }, { l: label, cls, fn }] });
  A.askReason = (title, label, fn, cls = 'primary', btn = 'Confirmar') => A.modal({
    title, size: 'sm', body: `<label class="field full"><span>${esc(label)}</span><textarea rows="3" name="reason" placeholder="Obrigatório"></textarea></label>`,
    actions: [{ l: 'Cancelar' }, { l: btn, cls, fn: (b) => { const v = b.querySelector('textarea').value.trim(); if (!v) { b.querySelector('textarea').classList.add('invalid'); A.toast('Indique o motivo.', 'warn'); return false; } fn(v); } }]
  });

  /* ---------- Formulários ---------- */
  A.opts = (o, db) => (typeof o === 'function' ? o(db) : o || []);
  A.formHtml = function (fields, v = {}, db = A.db, ro = false) {
    return `<div class="form-grid">${fields.map((f) => {
      const val = v[f.k] != null ? v[f.k] : f.def != null ? f.def : '';
      const dis = ro || f.ro ? 'disabled' : '';
      const req = f.req ? '<b class="req">*</b>' : '';
      let input;
      if (f.o) {
        const o = A.opts(f.o, db);
        input = `<select name="${f.k}" ${dis}>${f.req ? '' : '<option value="">—</option>'}${o.map((x) => `<option ${String(x) === String(val) ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`;
      } else if (f.t === 'area') input = `<textarea name="${f.k}" rows="3" ${dis}>${esc(val)}</textarea>`;
      else if (f.t === 'bool') input = `<label class="switch"><input type="checkbox" name="${f.k}" ${val ? 'checked' : ''} ${dis}><i></i><em>${esc(f.hint || '')}</em></label>`;
      else {
        const type = f.t === 'date' ? 'date' : f.t === 'num' || f.t === 'money' ? 'number' : f.t === 'password' ? 'password' : f.t === 'email' ? 'email' : f.t === 'time' ? 'time' : 'text';
        input = `<input type="${type}" name="${f.k}" value="${esc(val)}" ${dis} ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} ${type === 'number' ? 'step="any"' : ''}>`;
      }
      return `<label class="field ${f.full || f.t === 'area' ? 'full' : ''}"><span>${esc(f.l)}${req}</span>${input}${f.hint && f.t !== 'bool' ? `<small>${esc(f.hint)}</small>` : ''}</label>`;
    }).join('')}</div>`;
  };
  A.readForm = function (root, fields) {
    const out = {}; let ok = true;
    fields.forEach((f) => {
      const el = root.querySelector(`[name="${f.k}"]`);
      if (!el || el.disabled) return;
      let v = el.type === 'checkbox' ? el.checked : el.value.trim();
      if ((f.t === 'num' || f.t === 'money') && v !== '') v = Number(v);
      el.classList.remove('invalid');
      if (f.req && (v === '' || v == null)) { el.classList.add('invalid'); ok = false; }
      out[f.k] = v;
    });
    if (!ok) { A.toast('Preencha os campos obrigatórios.', 'warn'); return null; }
    return out;
  };
  A.fieldsFrom = function (ds, keys) {
    const s = A.SCHEMA[ds];
    return (keys || Object.keys(s.f)).filter((k) => s.f[k]).map((k) => ({ k, ...s.f[k], o: s.f[k].o }));
  };

  /* ---------- Tabela de dados com filtros, ordenação, paginação e exportação ---------- */
  A.dataTable = function (host, o) {
    const st = { f: {}, sort: o.sort || null, dir: o.dir || 1, page: 0 };
    const ps = o.pageSize || 12;
    const cols = o.cols;
    const getRows = () => (typeof o.rows === 'function' ? o.rows() : o.rows);
    const filters = (o.filters || []).map((f) => (typeof f === 'string' ? (f === 'q' ? { k: 'q', t: 'q' } : f[0] === '~' ? { k: f.slice(1), t: 'range' } : { k: f, t: 'sel' }) : f));
    const label = (k) => (cols.find((c) => c.k === k) || {}).l || (o.labels || {})[k] || k;
    const fHtml = filters.map((f) => {
      if (f.t === 'q') return `<div class="search-in">${A.icon('search')}<input type="search" data-f="q" placeholder="${esc(f.ph || o.searchPh || 'Pesquisar…')}"></div>`;
      if (f.t === 'range') return `<div class="range"><span>${esc(f.l || label(f.k))}</span><input type="date" data-f="${f.k}:from" aria-label="De"><i>a</i><input type="date" data-f="${f.k}:to" aria-label="Até"></div>`;
      const vals = f.o || A.uniq(getRows().map((r) => r[f.k])).sort((a, b) => String(a).localeCompare(String(b), 'pt', { numeric: true }));
      return `<select data-f="${f.k}" aria-label="${esc(f.l || label(f.k))}"><option value="">${esc(f.l || label(f.k))}: todos</option>${vals.map((v) => `<option>${esc(v)}</option>`).join('')}</select>`;
    }).join('');
    host.innerHTML = `<div class="card tcard">
      ${fHtml || o.toolbar || o.exportable !== false ? `<div class="tbl-tools">${fHtml}<div class="grow"></div>${o.toolbar || ''}${o.exportable !== false ? `<button class="btn ghost sm" data-exp title="Exportar CSV">${A.icon('download')}<span>Exportar</span></button>` : ''}</div>` : ''}
      <div class="tbl-wrap"></div><div class="tbl-foot"></div></div>`;
    const wrap = host.querySelector('.tbl-wrap');
    const foot = host.querySelector('.tbl-foot');
    const filtered = () => {
      let rows = getRows();
      const q = A.norm(st.f.q || '');
      if (q) rows = rows.filter((r) => (o.search || cols.map((c) => c.k)).some((k) => A.norm(r[k]).includes(q)));
      filters.forEach((f) => {
        if (f.t === 'sel' && st.f[f.k]) rows = rows.filter((r) => String(r[f.k]) === st.f[f.k]);
        if (f.t === 'range') {
          const a = st.f[f.k + ':from'], b = st.f[f.k + ':to'];
          if (a) rows = rows.filter((r) => String(r[f.k]).slice(0, 10) >= a);
          if (b) rows = rows.filter((r) => String(r[f.k]).slice(0, 10) <= b);
        }
      });
      if (st.sort) {
        const k = st.sort;
        rows = [...rows].sort((x, y) => { const a = x[k], b = y[k]; return (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'pt', { numeric: true })) * st.dir; });
      }
      return rows;
    };
    const draw = () => {
      const rows = filtered();
      const pages = Math.max(1, Math.ceil(rows.length / ps));
      if (st.page >= pages) st.page = pages - 1;
      const slice = rows.slice(st.page * ps, st.page * ps + ps);
      if (!rows.length) {
        wrap.innerHTML = `<div class="empty">${A.icon('search')}<p>${esc(o.empty || 'Sem registos para os critérios indicados.')}</p></div>`;
      } else {
        wrap.innerHTML = `<table class="tbl"><thead><tr>${o.check ? '<th class="chk"><input type="checkbox" data-all aria-label="Selecionar todos"></th>' : ''}${cols.map((c) => `<th data-s="${c.k}" class="${c.t === 'money' || c.t === 'num' ? 'r' : ''} ${st.sort === c.k ? 'sorted' : ''}">${esc(c.l)}${st.sort === c.k ? (st.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}${o.actions ? '<th class="r"></th>' : ''}</tr></thead>
        <tbody>${slice.map((r, i) => {
          const acts = o.actions ? o.actions(r).filter(Boolean) : [];
          return `<tr data-i="${i}" class="${o.onRow ? 'click' : ''} ${o.rowCls ? o.rowCls(r) : ''}">${o.check ? `<td class="chk"><input type="checkbox" data-c="${i}" aria-label="Selecionar"></td>` : ''}${cols.map((c) => `<td class="${c.t === 'money' || c.t === 'num' ? 'r' : ''} ${c.cls || ''}" data-l="${esc(c.l)}">${c.render ? c.render(r) : A.fmt(r[c.k], c.t)}</td>`).join('')}${o.actions ? `<td class="r acts">${acts.map((a, j) => `<button class="btn xs ${a.cls || 'ghost'}" data-act="${j}" ${a.disabled ? 'disabled' : ''} title="${esc(a.title || a.l)}">${a.icon ? A.icon(a.icon) : ''}${a.l ? `<span>${esc(a.l)}</span>` : ''}</button>`).join('')}</td>` : ''}</tr>`;
        }).join('')}</tbody></table>`;
      }
      foot.innerHTML = `<span class="muted">${rows.length} registo${rows.length === 1 ? '' : 's'}${o.footNote ? ' · ' + o.footNote(rows) : ''}</span>${pages > 1 ? `<div class="pager"><button class="btn xs ghost" data-p="-1" ${st.page === 0 ? 'disabled' : ''} aria-label="Anterior">‹</button><span>${st.page + 1} / ${pages}</span><button class="btn xs ghost" data-p="1" ${st.page >= pages - 1 ? 'disabled' : ''} aria-label="Seguinte">›</button></div>` : ''}`;
      wrap.querySelectorAll('th[data-s]').forEach((th) => { th.onclick = () => { const k = th.dataset.s; if (st.sort === k) st.dir *= -1; else { st.sort = k; st.dir = 1; } draw(); }; });
      wrap.querySelectorAll('tbody tr').forEach((tr) => {
        const r = slice[+tr.dataset.i];
        tr.querySelectorAll('[data-act]').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); o.actions(r).filter(Boolean)[+b.dataset.act].fn(r); }; });
        tr.querySelectorAll('.chk input').forEach((c) => { c.onclick = (e) => e.stopPropagation(); });
        if (o.onRow) tr.onclick = () => o.onRow(r);
      });
      const all = wrap.querySelector('[data-all]');
      if (all) all.onchange = () => wrap.querySelectorAll('[data-c]').forEach((c) => { c.checked = all.checked; });
      foot.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { st.page += +b.dataset.p; draw(); }; });
      api.current = slice;
    };
    host.querySelectorAll('[data-f]').forEach((el) => { el.addEventListener('input', () => { st.f[el.dataset.f] = el.value; st.page = 0; draw(); }); });
    const exp = host.querySelector('[data-exp]');
    if (exp) exp.onclick = () => A.csv(o.exportName || 'exportacao', cols, filtered());
    const api = { refresh: draw, filtered, selected: () => [...wrap.querySelectorAll('[data-c]')].filter((c) => c.checked).map((c) => api.current[+c.dataset.c]), setFilter: (k, v) => { st.f[k] = v; const el = host.querySelector(`[data-f="${k}"]`); if (el) el.value = v; draw(); } };
    draw();
    return api;
  };

  A.csv = function (name, cols, rows) {
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const txt = [cols.map((c) => q(c.l)).join(';'), ...rows.map((r) => cols.map((c) => q(c.csv ? c.csv(r) : r[c.k])).join(';'))].join('\r\n');
    A.download(`${name}.csv`, '﻿' + txt, 'text/csv;charset=utf-8');
    A.toast(`Exportados ${rows.length} registos (CSV).`);
  };
  A.download = function (filename, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /* ---------- Blocos visuais ---------- */
  A.kpi = (l, v, sub, tone, ic) => `<div class="kpi"><div class="kpi-top"><span>${esc(l)}</span>${ic ? A.icon(ic) : ''}</div><b>${v}</b>${sub ? `<small class="${tone || ''}">${sub}</small>` : ''}</div>`;
  A.bars = function (data, { money, max, suffix = '', h } = {}) {
    const m = max || Math.max(1, ...data.map((d) => d[1]));
    return `<div class="bars">${data.map(([l, v, tone]) => `<div class="bar-row"><span class="bl" title="${esc(l)}">${esc(l)}</span><div class="bt"><i class="${tone || ''}" style="width:${Math.max(1.5, (v / m) * 100)}%"></i></div><span class="bv">${money ? A.money(v) : A.num(v) + suffix}</span></div>`).join('')}</div>`;
  };
  A.columns = function (data, { money } = {}) {
    const m = Math.max(1, ...data.map((d) => d[1]));
    return `<div class="cols">${data.map(([l, v, tone]) => `<div class="col" title="${esc(l)}: ${money ? A.money(v) : A.num(v)}"><div class="cv">${money ? (v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + 'M' : Math.round(v / 1e3) + 'k') : A.num(v)}</div><div class="cb"><i class="${tone || ''}" style="height:${Math.max(2, (v / m) * 100)}%"></i></div><span>${esc(l)}</span></div>`).join('')}</div>`;
  };
  A.progress = (v, max, tone) => `<div class="prog"><i class="${tone || (v / max > 0.9 ? 'bad' : v / max > 0.75 ? 'warn' : '')}" style="width:${Math.min(100, (v / Math.max(1, max)) * 100)}%"></i></div>`;
  A.donut = function (parts, center) {
    const total = parts.reduce((s, p) => s + p[1], 0) || 1;
    let acc = 0;
    const segs = parts.map(([l, v, c]) => { const a = acc / total * 100; acc += v; return `${c} ${a}% ${acc / total * 100}%`; }).join(',');
    return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${segs})"><div><b>${center || ''}</b></div></div><ul class="legend">${parts.map(([l, v, c]) => `<li><i style="background:${c}"></i>${esc(l)}<b>${A.num(v)}</b></li>`).join('')}</ul></div>`;
  };
  A.list = (items, empty = 'Sem itens.') => (items.length ? `<ul class="feed">${items.map((it) => `<li>${it.tone ? `<i class="dot ${it.tone}"></i>` : it.icon ? A.icon(it.icon) : ''}<div><p>${it.html || esc(it.t)}</p>${it.m ? `<small>${esc(it.m)}</small>` : ''}</div>${it.r ? `<span class="fr">${it.r}</span>` : ''}</li>`).join('')}</ul>` : `<div class="empty sm"><p>${esc(empty)}</p></div>`);
  A.kv = (obj) => `<dl class="kv">${Object.entries(obj).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v == null || v === '' ? '—' : v}</dd></div>`).join('')}</dl>`;
  A.section = (title, inner, extra = '', cls = '') => `<section class="card ${cls}"><div class="card-head"><h3>${esc(title)}</h3>${extra}</div>${inner}</section>`;
})();
