/* Acura Escolar — vistas reutilizáveis (cada subaba aponta para uma destas vistas) */
(function () {
  const A = (window.App = window.App || {});
  const V = (A.V = {});
  const esc = A.esc;

  /* ================= Cálculo académico ================= */
  const COMPS = (A.COMPS = ['MAC', 'NPP', 'NPT']);
  A.grade = function (alunoId, discId, periodo, comp) {
    const k = `${alunoId}|${discId}|${periodo}|${comp}`;
    if (A.db.notas[k] != null) return A.db.notas[k];
    if (periodo !== '1º Trimestre') return null;
    const a = A.db.alunos.find((x) => x.id === alunoId);
    if (!a) return null;
    const v = a.apt + (A.hash(alunoId + discId) - 0.5) * 7 + (A.hash(k) - 0.5) * 4;
    return Math.max(0, Math.min(20, Math.round(v)));
  };
  A.mt = function (alunoId, discId, periodo) {
    const g = COMPS.map((c) => A.grade(alunoId, discId, periodo, c));
    if (g.some((x) => x == null || x === '')) return null;
    return Math.round(g.reduce((s, x) => s + Number(x), 0) / 3);
  };
  A.stats = function (a, periodo = '1º Trimestre') {
    const t = A.db.turmas.find((x) => x.id === a.turmaId);
    const mts = (t ? t.disciplinas : []).map((d) => A.mt(a.id, d, periodo)).filter((x) => x != null);
    const media = mts.length ? mts.reduce((s, x) => s + x, 0) / mts.length : null;
    const f = A.db.faltas.filter((x) => x.alunoId === a.id);
    return { media, negativas: mts.filter((x) => x < 10).length, faltas: f.filter((x) => x.tipo === 'Falta').length, injust: f.filter((x) => x.tipo === 'Falta' && x.justificada === 'Não').length, atrasos: f.filter((x) => x.tipo === 'Atraso').length };
  };
  A.risk = (s) => s.media != null && (s.media < 10 || s.negativas >= 3 || s.injust >= 6);
  A.gtone = (v) => (v == null ? '' : v < 10 ? 'neg' : v >= 14 ? 'pos' : '');
  A.f1 = (n) => (n == null ? '—' : n.toFixed(1).replace('.', ','));
  A.debt = (alunoId) => A.sum(A.db.cobrancas.filter((c) => c.alunoId === alunoId && c.estado !== 'Pago' && c.vencimento <= A.TODAY), 'divida');

  /* ================= Layout de dashboard ================= */
  A.dashLayout = function (kpis, blocks) {
    return `<div class="kpis">${kpis.map((k) => A.kpi(...k)).join('')}</div>
      <div class="grid2">${blocks.filter(Boolean).map(([t, html, o = {}]) => `<section class="card ${o.span ? 'span2' : ''}"><div class="card-head"><h3>${esc(t)}</h3>${o.go ? `<button class="link" data-go="${o.go}">${o.goL || 'Ver tudo'} ${A.icon('chevron')}</button>` : ''}</div>${html}</section>`).join('')}</div>`;
  };
  V.dash = function (el, cfg, ctx) {
    el.innerHTML = A.dashLayout(cfg.kpis(ctx), cfg.blocks(ctx));
  };
  V.html = function (el, cfg, ctx) {
    el.innerHTML = cfg.render(ctx);
    if (cfg.bind) cfg.bind(el, ctx);
  };
  V.alerts = function (el, cfg, ctx) {
    const items = cfg.items(ctx);
    el.innerHTML = A.section(cfg.title || 'Alertas', items.length ? `<ul class="alerts">${items.map((i) => `<li class="${i.tone || 'warn'}">${A.icon(i.tone === 'bad' ? 'alert' : i.tone === 'ok' ? 'checkCircle' : 'info')}<div><b>${esc(i.t)}</b>${i.m ? `<small>${esc(i.m)}</small>` : ''}</div>${i.go ? `<button class="btn xs ghost" data-go="${i.go}">Abrir</button>` : ''}</li>`).join('')}</ul>` : '<div class="empty sm"><p>Sem alertas de momento.</p></div>');
  };

  /* ================= Tabela genérica com CRUD e ações ================= */
  V.table = function (el, cfg, ctx) {
    const s = A.SCHEMA[cfg.ds];
    const ro = (ctx.ro && !cfg.own) || cfg.ro;
    const all = () => (cfg.rows ? cfg.rows(ctx) : ctx.db[cfg.ds]);
    const rows = () => all().filter((r) => !cfg.where || cfg.where(r, ctx));
    const cols = (cfg.cols || s.cols).map((k) => (typeof k === 'object' ? k : { k, l: (s.f[k] || {}).l || k, t: (s.f[k] || {}).t }));
    const mod = cfg.mod || ctx.role.mod;
    const title = (r) => r.nome || r.aluno || r.titulo || r.colaborador || r.artigo || r.utilizador || r.assunto || r.id || '';
    const acts = (r) => (cfg.actions || []).map((a) => (typeof a === 'string' ? STD[a] : a)).filter((a) => a && (!ro || a.read) && (!a.when || a.when(r, ctx)));
    const STD = {
      edit: { l: '', icon: 'edit', title: 'Editar', open: (r) => editRow(r) },
      del: { l: '', icon: 'x', title: 'Eliminar', cls: 'ghost danger', confirm: 'Eliminar este registo? A operação fica registada na auditoria.', fn: (r) => { const arr = ctx.db[cfg.ds]; arr.splice(arr.indexOf(r), 1); }, log: 'Eliminação', crit: 1 }
    };
    const run = (a, r) => {
      if (a.open) return a.open(r, ctx, () => api.refresh());
      const go = (reason) => {
        if (a.check) { const err = a.check(r, ctx); if (err) return A.toast(err, 'bad'); }
        if (a.set) Object.assign(r, typeof a.set === 'function' ? a.set(r, ctx, reason) : a.set);
        if (a.fn) a.fn(r, ctx, reason);
        ctx.log(mod, a.log || a.l || a.title, `${s.t}: ${title(r)}${reason ? ' — ' + reason : ''}`, a.crit);
        ctx.save();
        A.toast(a.done || `${a.l || a.title}: operação registada.`);
        api.refresh();
        if (cfg.after) cfg.after(ctx);
      };
      if (a.reason) A.askReason(a.l || a.title, a.reason === true ? 'Motivo' : a.reason, go, a.cls && a.cls.includes('danger') ? 'danger' : 'primary');
      else if (a.confirm) A.confirm(a.l || a.title, typeof a.confirm === 'function' ? a.confirm(r) : a.confirm, () => go(), a.cls && a.cls.includes('danger') ? 'danger' : 'primary');
      else go();
    };
    const detail = (r) => {
      const keys = (cfg.detail || Object.keys(s.f)).filter((k) => s.f[k] && (!s.f[k].priv || ctx.can('priv')));
      const obj = {}; keys.forEach((k) => { obj[s.f[k].l] = A.fmt(r[k], s.f[k].t); });
      const extra = cfg.detailExtra ? cfg.detailExtra(r, ctx) : '';
      const list = acts(r);
      A.modal({ title: `${s.t}`, sub: esc(title(r)), size: 'md', body: A.kv(obj) + extra, actions: [{ l: 'Fechar' }, ...list.map((a) => ({ l: a.l || a.title, cls: a.cls === 'ghost danger' ? 'danger' : a.cls === 'primary' ? 'primary' : '', icon: a.icon, fn: () => { setTimeout(() => run(a, r), 160); } }))] });
    };
    const editRow = (r) => {
      const fields = A.fieldsFrom(cfg.ds, cfg.form).filter((f) => !f.priv || ctx.can('priv'));
      A.modal({ title: `Editar ${s.t.toLowerCase()}`, sub: esc(title(r)), size: 'md', body: A.formHtml(fields, r), actions: [{ l: 'Cancelar' }, { l: 'Guardar alterações', cls: 'primary', fn: (b) => {
        const v = A.readForm(b, fields); if (!v) return false;
        if (cfg.validate) { const e = cfg.validate(v, ctx, r); if (e) { A.toast(e, 'bad'); return false; } }
        Object.assign(r, v); if (cfg.onSave) cfg.onSave(r, ctx);
        ctx.log(mod, 'Edição', `${s.t}: ${title(r)}`, cfg.critEdit); ctx.save(); A.toast('Alterações guardadas.'); api.refresh();
      } }] });
    };
    const create = () => {
      if (cfg.createCheck) { const e = cfg.createCheck(ctx); if (e) return A.modal({ title: 'Operação indisponível', size: 'sm', body: `<div class="note bad">${A.icon('lock')}<div>${esc(e)}</div></div>`, actions: [{ l: 'Fechar' }] }); }
      const fields = A.fieldsFrom(cfg.ds, cfg.form).filter((f) => !f.ro && (!f.priv || ctx.can('priv')));
      const defs = cfg.defaults ? cfg.defaults(ctx) : {};
      A.modal({ title: typeof cfg.create === 'string' ? cfg.create : `Novo: ${s.t.toLowerCase()}`, size: 'md', body: A.formHtml(fields, defs), actions: [{ l: 'Cancelar' }, { l: 'Guardar', cls: 'primary', fn: (b) => {
        const v = A.readForm(b, fields); if (!v) return false;
        if (cfg.validate) { const e = cfg.validate(v, ctx); if (e) { A.toast(e, 'bad'); return false; } }
        const rec = { ...defs, ...v };
        if (s.f.id && !rec.id) rec.id = A.uid('N');
        if (cfg.onCreate) cfg.onCreate(rec, ctx);
        ctx.db[cfg.ds].unshift(rec);
        ctx.log(mod, cfg.createLog || 'Criação', `${s.t}: ${title(rec)}`, cfg.critCreate); ctx.save();
        A.toast(cfg.createDone || `${s.t} registado(a) com sucesso.`); api.refresh();
        if (cfg.after) cfg.after(ctx);
      } }] });
    };
    let toolbar = '';
    if (cfg.create && !ro) toolbar += `<button class="btn primary sm" data-new>${A.icon('plus')}<span>${esc(typeof cfg.create === 'string' ? cfg.create : 'Novo')}</span></button>`;
    (cfg.tools || []).filter((t) => !ro || t.read).forEach((t, i) => { toolbar += `<button class="btn sm ${t.cls || ''}" data-tool="${i}">${t.icon ? A.icon(t.icon) : ''}<span>${esc(t.l)}</span></button>`; });
    el.innerHTML = `${cfg.note ? `<div class="note ${cfg.noteTone || ''}">${A.icon(cfg.noteIcon || 'info')}<div>${typeof cfg.note === 'function' ? cfg.note(ctx) : cfg.note}</div></div>` : ''}${cfg.top ? cfg.top(ctx) : ''}<div class="t-host"></div>`;
    const api = A.dataTable(el.querySelector('.t-host'), {
      rows, cols, filters: cfg.filters || ['q'], search: cfg.search || s.search, toolbar, labels: { ...Object.fromEntries(Object.entries(s.f).map(([k, f]) => [k, f.l])), ...(cfg.labels || {}) }, exportName: cfg.ds, pageSize: cfg.pageSize, sort: cfg.sort, dir: cfg.dir,
      actions: cfg.actions && (!ro || cfg.actions.some((a) => a.read)) ? (r) => acts(r).map((a) => ({ ...a, fn: () => run(a, r) })) : null, onRow: cfg.onRowFicha ? (r) => A.ficha(ctx, r) : cfg.noDetail ? null : detail, empty: cfg.empty, rowCls: cfg.rowCls, footNote: cfg.footNote, check: cfg.bulk && !ro
    });
    const nb = el.querySelector('[data-new]');
    if (nb) nb.onclick = create;
    el.querySelectorAll('[data-tool]').forEach((b) => { b.onclick = () => (cfg.tools.filter((t) => !ro || t.read)[+b.dataset.tool]).fn(ctx, api); });
    return api;
  };

  /* ================= Formulários de configuração ================= */
  V.form = function (el, cfg, ctx) {
    const ro = (ctx.ro && !cfg.own) || cfg.ro;
    const data = cfg.get(ctx);
    const secs = cfg.sections || [{ title: cfg.title || 'Dados', fields: cfg.fields }];
    el.innerHTML = `${cfg.note ? `<div class="note ${cfg.noteTone || ''}">${A.icon(cfg.noteIcon || 'info')}<div>${cfg.note}</div></div>` : ''}<div class="stack">${secs.map((s, i) => A.section(s.title, (s.desc ? `<p class="muted mb">${esc(s.desc)}</p>` : '') + A.formHtml(s.fields, data, ctx.db, ro || s.ro), '', `fs-${i}`)).join('')}
      ${cfg.locked ? A.section('Restrições da plataforma', `<p class="muted mb">Definidas pelo fornecedor da plataforma. O administrador da instituição não as pode alterar.</p><ul class="locked">${cfg.locked.map((x) => `<li>${A.icon('lock')}<span>${esc(x[0])}</span><b>${esc(x[1])}</b></li>`).join('')}</ul>`) : ''}
      ${cfg.extra ? cfg.extra(ctx) : ''}
      ${ro ? '' : `<div class="form-actions"><button class="btn ghost" data-reset>Repor</button><button class="btn primary" data-save>${A.icon('check')}Guardar alterações</button></div>`}</div>`;
    const fields = secs.filter((s) => !s.ro).flatMap((s) => s.fields);
    const sv = el.querySelector('[data-save]');
    if (sv) sv.onclick = () => {
      const v = A.readForm(el, fields); if (!v) return;
      if (cfg.validate) { const e = cfg.validate(v, ctx); if (e) return A.toast(e, 'bad'); }
      cfg.set(ctx, v); ctx.log(cfg.mod || ctx.role.mod, cfg.logAction || 'Alteração de configuração', cfg.title || secs[0].title, cfg.crit); ctx.save();
      A.toast(cfg.done || 'Alterações guardadas.');
      if (cfg.after) cfg.after(ctx);
    };
    const rs = el.querySelector('[data-reset]');
    if (rs) rs.onclick = () => V.form(el, cfg, ctx);
    if (cfg.bind) cfg.bind(el, ctx);
  };

  /* ================= Aprovações ================= */
  V.approvals = function (el, cfg, ctx) {
    const st = { tab: 'Pendente', tipo: cfg.tipo || '' };
    const base = () => ctx.db.aprovacoes.filter((a) => (!cfg.filter || cfg.filter(a, ctx)));
    const draw = () => {
      const list = base().filter((a) => (st.tab === 'Histórico' ? ['Aprovado', 'Rejeitado'].includes(a.estado) : a.estado === st.tab) && (!st.tipo || a.tipo === st.tipo));
      const tipos = A.uniq(base().map((a) => a.tipo));
      const count = (t) => base().filter((a) => (t === 'Histórico' ? ['Aprovado', 'Rejeitado'].includes(a.estado) : a.estado === t)).length;
      el.innerHTML = `<div class="toolbar"><div class="seg">${['Pendente', 'Devolvido', 'Histórico'].map((t) => `<button class="${st.tab === t ? 'on' : ''}" data-tab="${t}">${t === 'Pendente' ? 'Pendentes' : t === 'Devolvido' ? 'Devolvidos para correção' : 'Histórico'} <em>${count(t)}</em></button>`).join('')}</div>
        ${cfg.tipo ? '' : `<select data-tipo aria-label="Tipo"><option value="">Todos os tipos</option>${tipos.map((t) => `<option ${st.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select>`}</div>
        ${list.length ? `<div class="ap-list">${list.map((a) => `<article class="card ap" data-id="${a.id}">
          <header><span class="badge info">${esc(a.tipo)}</span><h4>${esc(a.titulo)}</h4>${A.badge(a.estado)}</header>
          <div class="ap-meta"><div><small>Responsável</small><b>${esc(a.responsavel)}</b></div><div><small>Data</small><b>${A.date(a.data)}</b></div><div class="wide"><small>Motivo</small><b>${esc(a.motivo)}</b></div></div>
          ${A.kv(Object.fromEntries(Object.entries(a.dados || {}).map(([k, v]) => [k, esc(v)])))}
          ${a.historico.length ? `<ul class="hist">${a.historico.map((h) => `<li>${A.date(h.data)} · <b>${esc(h.por)}</b> — ${esc(h.acao)}${h.nota ? `: “${esc(h.nota)}”` : ''}</li>`).join('')}</ul>` : ''}
          ${a.estado === 'Pendente' && !ctx.ro ? `<footer><button class="btn primary sm" data-do="Aprovado">${A.icon('check')}Aprovar</button><button class="btn sm" data-do="Devolvido">${A.icon('undo')}Devolver para correção</button><button class="btn sm danger-ghost" data-do="Rejeitado">${A.icon('x')}Rejeitar</button>${a.tipo === 'Pauta' && a.ref ? `<button class="btn sm ghost" data-pauta="${a.ref}">${A.icon('eye')}Ver pauta</button>` : ''}</footer>` : a.tipo === 'Pauta' && a.ref ? `<footer><button class="btn sm ghost" data-pauta="${a.ref}">${A.icon('eye')}Ver pauta</button></footer>` : ''}
        </article>`).join('')}</div>` : `<div class="card"><div class="empty">${A.icon('checkCircle')}<p>${st.tab === 'Pendente' ? 'Não há pedidos pendentes.' : 'Sem registos.'}</p></div></div>`}`;
      el.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { st.tab = b.dataset.tab; draw(); }; });
      const ts = el.querySelector('[data-tipo]'); if (ts) ts.onchange = () => { st.tipo = ts.value; draw(); };
      el.querySelectorAll('[data-pauta]').forEach((b) => { b.onclick = () => A.showPauta(ctx.db.pautas.find((p) => p.id === b.dataset.pauta)); });
      el.querySelectorAll('[data-do]').forEach((b) => {
        b.onclick = () => {
          const ap = ctx.db.aprovacoes.find((x) => x.id === b.closest('[data-id]').dataset.id);
          const act = b.dataset.do;
          const done = (nota = '') => {
            ap.estado = act; ap.historico.push({ data: A.now(), por: ctx.user.nome, acao: act === 'Devolvido' ? 'Devolvido para correção' : act, nota });
            A.applyApproval(ap, act, nota, ctx);
            ctx.log(ctx.role.mod, `${act === 'Aprovado' ? 'Aprovação' : act === 'Rejeitado' ? 'Rejeição' : 'Devolução'} — ${ap.tipo}`, ap.titulo, 1);
            ctx.save(); A.toast(`Pedido ${act === 'Devolvido' ? 'devolvido para correção' : act.toLowerCase()}.`, act === 'Rejeitado' ? 'warn' : 'ok'); draw(); A.refreshBadges();
          };
          if (act === 'Aprovado') A.confirm('Aprovar pedido', `Confirma a aprovação de <b>${esc(ap.titulo)}</b>?`, () => done());
          else A.askReason(act === 'Rejeitado' ? 'Rejeitar pedido' : 'Devolver para correção', act === 'Rejeitado' ? 'Motivo da rejeição' : 'O que deve ser corrigido?', done, act === 'Rejeitado' ? 'danger' : 'primary');
        };
      });
    };
    draw();
  };
  A.applyApproval = function (ap, act, nota, ctx) {
    const db = ctx.db;
    if (ap.tipo === 'Pauta') { const p = db.pautas.find((x) => x.id === ap.ref); if (p) { p.estado = act === 'Aprovado' ? 'Aprovada' : 'Devolvida'; p.obs = nota; p.atualizada = A.TODAY; } }
    if (ap.tipo === 'Certificado') { const p = db.pedidosCert.find((x) => x.id === ap.ref); if (p) p.estado = act === 'Aprovado' ? 'Aprovado' : act === 'Rejeitado' ? 'Indeferido' : 'Em verificação'; }
    if (ap.tipo === 'Anulação') {
      const e = db.estornos.find((x) => x.id === ap.ref);
      if (e) { e.estado = act === 'Aprovado' ? 'Aprovado' : act === 'Rejeitado' ? 'Rejeitado' : 'Pendente'; if (act === 'Aprovado') { const p = db.pagamentos.find((x) => x.recibo === e.recibo); if (p) p.estado = 'Anulado'; } }
      const a = db.alunos.find((x) => x.id === ap.ref); if (a && act === 'Aprovado') a.estado = 'Anulada';
    }
    if (ap.tipo === 'Desconto' && act === 'Aprovado') { const a = db.alunos.find((x) => x.id === ap.ref); if (a) db.beneficios.unshift({ id: A.uid('BF'), aluno: a.nome, processo: a.processo, turma: a.turma, tipo: 'Apoio social', percentagem: ap.dados.Percentagem, validade: '2027-07-30', estado: 'Ativo' }); }
    if (ap.tipo === 'Pedido') { const ac = db.acordos.find((x) => x.id === ap.ref); if (ac) ac.estado = act === 'Aprovado' ? 'Ativo' : 'Rejeitado'; }
  };

  /* ================= Pauta (visualização) ================= */
  A.showPauta = function (p) {
    if (!p) return;
    const db = A.db;
    const al = db.alunos.filter((a) => a.turmaId === p.turmaId && a.estado === 'Ativa');
    A.modal({ title: `Pauta — ${p.turma} · ${p.disciplina}`, sub: `${p.periodo} · ${esc(p.professor)} · ${A.badge(p.estado)}`, size: 'lg', body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>N.º</th><th>Aluno</th>${COMPS.map((c) => `<th class="r">${c}</th>`).join('')}<th class="r">MT</th></tr></thead><tbody>${al.map((a) => `<tr><td>${a.numero}</td><td>${esc(a.nome)}</td>${COMPS.map((c) => `<td class="r">${A.grade(a.id, p.discId, p.periodo, c) ?? '—'}</td>`).join('')}<td class="r"><b class="g ${A.gtone(A.mt(a.id, p.discId, p.periodo))}">${A.mt(a.id, p.discId, p.periodo) ?? '—'}</b></td></tr>`).join('')}</tbody></table></div>`,
      actions: [{ l: 'Imprimir', icon: 'printer', fn: () => { A.print(`Pauta ${p.turma} ${p.disciplina}`, A.docs.pauta(p)); return false; } }, { l: 'Fechar' }] });
  };

  /* ================= Lançamento de notas (professor) ================= */
  V.grades = function (el, cfg, ctx) {
    const db = ctx.db;
    const pairs = db.distribuicao.filter((d) => d.profId === ctx.prof.id);
    db.rascunhos = db.rascunhos || {};
    const st = { pair: A.state.gpair || pairs[0].id, periodo: '1º Trimestre' };
    let edits = {};
    const setDirty = () => { A.dirty = Object.keys(edits).length > 0; };
    const draw = () => {
      const d = pairs.find((x) => x.id === st.pair);
      let pauta = db.pautas.find((p) => p.turmaId === d.turmaId && p.discId === d.discId && p.periodo === st.periodo);
      if (!pauta) { pauta = { id: A.uid('PT'), turmaId: d.turmaId, turma: d.turma, discId: d.discId, disciplina: d.disciplina, profId: d.profId, professor: d.professor, periodo: st.periodo, estado: 'Rascunho', atualizada: A.TODAY, obs: '' }; db.pautas.push(pauta); }
      const draft = db.rascunhos[pauta.id] || {};
      const locked = ['Submetida', 'Aprovada'].includes(pauta.estado);
      const al = db.alunos.filter((a) => a.turmaId === d.turmaId && a.estado === 'Ativa');
      const val = (a, c) => { const k = `${a.id}|${c}`; if (k in edits) return edits[k]; if (k in draft) return draft[k]; return A.grade(a.id, d.discId, st.periodo, c); };
      const nDraft = Object.keys(draft).length, nEdit = Object.keys(edits).length;
      el.innerHTML = `<div class="toolbar">
          <label class="inline"><span>Turma e disciplina</span><select data-pair>${pairs.map((p) => `<option value="${p.id}" ${p.id === st.pair ? 'selected' : ''}>${esc(p.turma)} · ${esc(p.disciplina)}</option>`).join('')}</select></label>
          <label class="inline"><span>Período</span><select data-per>${A.PERIODS.map((p) => `<option ${p === st.periodo ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
          <div class="grow"></div><span class="muted">Estado da pauta:</span> ${A.badge(pauta.estado)}
        </div>
        ${pauta.estado === 'Devolvida' ? `<div class="note warn">${A.icon('undo')}<div><b>Pauta devolvida para correção.</b> ${esc(pauta.obs || '')}</div></div>` : ''}
        ${locked ? `<div class="note">${A.icon('lock')}<div>Pauta ${pauta.estado.toLowerCase()} — não é possível editar. ${pauta.estado === 'Submetida' ? 'Aguarda aprovação da direção pedagógica.' : ''}</div></div>` : ''}
        <div class="unsaved ${nEdit ? 'on' : ''}" data-unsaved>${A.icon('alert')}<span><b data-n>${nEdit}</b> alteração(ões) por gravar</span></div>
        ${nDraft && !locked ? `<div class="note info">${A.icon('info')}<div>Existem <b>${nDraft}</b> alteração(ões) gravadas em rascunho e ainda <b>não submetidas</b> (assinaladas a amarelo).</div></div>` : ''}
        <div class="card"><div class="tbl-wrap"><table class="tbl grid-edit"><thead><tr><th>N.º</th><th>Aluno</th>${COMPS.map((c) => `<th class="c" title="${c === 'MAC' ? 'Média das avaliações contínuas' : c === 'NPP' ? 'Nota da prova do professor' : 'Nota da prova trimestral'}">${c}</th>`).join('')}<th class="c">MT</th><th class="c">Situação</th></tr></thead>
        <tbody>${al.map((a, ri) => {
          const vs = COMPS.map((c) => val(a, c));
          const mt = vs.every((x) => x !== '' && x != null) ? Math.round(vs.reduce((s, x) => s + Number(x), 0) / 3) : null;
          return `<tr data-a="${a.id}"><td>${a.numero}</td><td class="nm">${esc(a.nome)}</td>${COMPS.map((c, ci) => { const k = `${a.id}|${c}`; return `<td class="c"><input class="gin ${k in edits ? 'dirty' : k in draft ? 'draft' : ''}" inputmode="numeric" data-k="${k}" data-r="${ri}" data-c="${ci}" value="${vs[ci] ?? ''}" ${locked || ctx.ro ? 'disabled' : ''} aria-label="${c} de ${esc(a.nome)}"></td>`; }).join('')}<td class="c"><b class="g ${A.gtone(mt)}" data-mt>${mt ?? '—'}</b></td><td class="c" data-sit>${mt == null ? '<span class="muted">—</span>' : mt >= 10 ? A.badge('Aprovado') : A.badge('Negativa')}</td></tr>`;
        }).join('')}</tbody></table></div>
        <div class="tbl-foot"><span class="muted">${al.length} alunos · escala 0–20 · MT = (MAC + NPP + NPT) / 3 · Enter avança para o aluno seguinte</span></div></div>
        ${locked || ctx.ro ? '' : `<div class="form-actions sticky"><button class="btn ghost" data-discard ${nEdit ? '' : 'disabled'}>Descartar alterações</button><button class="btn" data-draft>${A.icon('archive')}Gravar rascunho</button><button class="btn primary" data-submit>${A.icon('send')}Submeter pauta</button></div>`}`;
      const updRow = (tr) => {
        const ins = [...tr.querySelectorAll('.gin')];
        const vs = ins.map((i) => i.value.trim());
        const ok = vs.every((v) => v !== '' && !isNaN(v));
        const mt = ok ? Math.round(vs.reduce((s, x) => s + Number(x), 0) / 3) : null;
        const m = tr.querySelector('[data-mt]'); m.textContent = mt ?? '—'; m.className = `g ${A.gtone(mt)}`;
        tr.querySelector('[data-sit]').innerHTML = mt == null ? '<span class="muted">—</span>' : mt >= 10 ? A.badge('Aprovado') : A.badge('Negativa');
      };
      el.querySelectorAll('.gin').forEach((inp) => {
        inp.addEventListener('input', () => {
          const v = inp.value.trim();
          const bad = v !== '' && (isNaN(v) || Number(v) < 0 || Number(v) > 20 || !Number.isInteger(Number(v)));
          inp.classList.toggle('invalid', bad);
          const [aid, c] = inp.dataset.k.split('|');
          const orig = inp.dataset.k in draft ? draft[inp.dataset.k] : A.grade(aid, d.discId, st.periodo, c);
          if (String(orig ?? '') === v) delete edits[inp.dataset.k]; else edits[inp.dataset.k] = v === '' ? '' : Number(v);
          inp.classList.toggle('dirty', inp.dataset.k in edits);
          const n = Object.keys(edits).length;
          const u = el.querySelector('[data-unsaved]'); u.classList.toggle('on', n > 0); u.querySelector('[data-n]').textContent = n;
          const dc = el.querySelector('[data-discard]'); if (dc) dc.disabled = !n;
          setDirty(); updRow(inp.closest('tr'));
        });
        inp.addEventListener('keydown', (e) => {
          const r = +inp.dataset.r, c = +inp.dataset.c;
          const mv = { Enter: [1, 0], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
          if (mv) { e.preventDefault(); const n = el.querySelector(`.gin[data-r="${r + mv[0]}"][data-c="${c + mv[1]}"]`); if (n) { n.focus(); n.select(); } }
        });
        inp.addEventListener('focus', () => inp.select());
      });
      const guard = (fn) => { if (Object.keys(edits).length) A.confirm('Alterações por gravar', 'Tem alterações por gravar nesta pauta. Deseja descartá-las?', () => { edits = {}; setDirty(); fn(); }, 'danger', 'Descartar'); else fn(); };
      el.querySelector('[data-pair]').onchange = (e) => { const v = e.target.value; e.target.value = st.pair; guard(() => { st.pair = v; A.state.gpair = v; draw(); }); };
      el.querySelector('[data-per]').onchange = (e) => { const v = e.target.value; e.target.value = st.periodo; guard(() => { st.periodo = v; draw(); }); };
      const hasInvalid = () => el.querySelector('.gin.invalid');
      const dc = el.querySelector('[data-discard]'); if (dc) dc.onclick = () => A.confirm('Descartar alterações', 'As alterações não gravadas serão perdidas.', () => { edits = {}; setDirty(); draw(); }, 'danger', 'Descartar');
      const dr = el.querySelector('[data-draft]');
      if (dr) dr.onclick = () => {
        if (hasInvalid()) return A.toast('Corrija as notas inválidas (0 a 20).', 'bad');
        if (!Object.keys(edits).length) return A.toast('Não há alterações novas para gravar.', 'warn');
        db.rascunhos[pauta.id] = { ...draft, ...edits };
        pauta.estado = 'Rascunho'; pauta.atualizada = A.TODAY;
        ctx.log('Académico', 'Rascunho de pauta', `${pauta.turma} · ${pauta.disciplina}: ${Object.keys(edits).length} alteração(ões)`);
        edits = {}; setDirty(); ctx.save(); A.toast('Rascunho gravado. As alterações ainda não foram submetidas.'); draw();
      };
      const sb = el.querySelector('[data-submit]');
      if (sb) sb.onclick = () => {
        if (hasInvalid()) return A.toast('Corrija as notas inválidas (0 a 20).', 'bad');
        const empty = [...el.querySelectorAll('.gin')].filter((i) => i.value.trim() === '').length;
        if (empty) return A.toast(`Existem ${empty} classificações por preencher.`, 'bad');
        A.confirm('Submeter pauta', `Submeter a pauta de <b>${esc(d.turma)} · ${esc(d.disciplina)}</b> (${st.periodo}) para aprovação? Após a submissão não poderá editar as notas.`, () => {
          const all = { ...draft, ...edits };
          Object.entries(all).forEach(([k, v]) => { const [aid, c] = k.split('|'); db.notas[`${aid}|${d.discId}|${st.periodo}|${c}`] = v; });
          delete db.rascunhos[pauta.id];
          pauta.estado = 'Submetida'; pauta.atualizada = A.TODAY; pauta.obs = '';
          db.aprovacoes.unshift({ id: A.uid('AP'), tipo: 'Pauta', titulo: `Pauta ${st.periodo} — ${d.turma} · ${d.disciplina}`, responsavel: ctx.user.nome, data: A.now(), motivo: 'Submissão da pauta trimestral para aprovação.', dados: { Turma: d.turma, Disciplina: d.disciplina, Período: st.periodo, Alunos: String(al.length), 'Alterações nesta submissão': String(Object.keys(all).length) }, destino: 'pedagogico', ref: pauta.id, estado: 'Pendente', historico: [] });
          ctx.log('Académico', 'Submissão de pauta', `${d.turma} · ${d.disciplina} · ${st.periodo}`);
          edits = {}; setDirty(); ctx.save(); A.toast('Pauta submetida para aprovação.'); draw();
        });
      };
    };
    draw();
  };

  /* ================= Consulta de notas (DT, direção, aluno) ================= */
  V.results = function (el, cfg, ctx) {
    const db = ctx.db;
    const turmas = cfg.turmas ? cfg.turmas(ctx) : db.turmas;
    const st = { t: turmas[0] && turmas[0].id, d: '', p: '1º Trimestre' };
    const draw = () => {
      const t = db.turmas.find((x) => x.id === st.t);
      const al = db.alunos.filter((a) => a.turmaId === st.t && a.estado === 'Ativa');
      const discs = t.disciplinas;
      let head, body;
      if (!st.d) {
        head = `<th>N.º</th><th>Aluno</th>${discs.map((d) => `<th class="c" title="${esc(db.disciplinas.find((x) => x.id === d).nome)}">${d}</th>`).join('')}<th class="c">Média</th><th class="c">Neg.</th>`;
        body = al.map((a) => { const mts = discs.map((d) => A.mt(a.id, d, st.p)); const v = mts.filter((x) => x != null); const m = v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; return `<tr><td>${a.numero}</td><td class="nm">${esc(a.nome)}</td>${mts.map((x) => `<td class="c"><span class="g ${A.gtone(x)}">${x ?? '—'}</span></td>`).join('')}<td class="c"><b class="g ${A.gtone(m)}">${A.f1(m)}</b></td><td class="c">${v.filter((x) => x < 10).length || '—'}</td></tr>`; }).join('');
      } else {
        head = `<th>N.º</th><th>Aluno</th>${COMPS.map((c) => `<th class="c">${c}</th>`).join('')}<th class="c">MT</th>`;
        body = al.map((a) => `<tr><td>${a.numero}</td><td class="nm">${esc(a.nome)}</td>${COMPS.map((c) => `<td class="c">${A.grade(a.id, st.d, st.p, c) ?? '—'}</td>`).join('')}<td class="c"><b class="g ${A.gtone(A.mt(a.id, st.d, st.p))}">${A.mt(a.id, st.d, st.p) ?? '—'}</b></td></tr>`).join('');
      }
      const pautas = db.pautas.filter((p) => p.turmaId === st.t && p.periodo === st.p);
      el.innerHTML = `<div class="toolbar"><label class="inline"><span>Turma</span><select data-t>${turmas.map((x) => `<option value="${x.id}" ${x.id === st.t ? 'selected' : ''}>${esc(x.nome)}</option>`).join('')}</select></label>
        <label class="inline"><span>Disciplina</span><select data-d><option value="">Todas (MT)</option>${discs.map((d) => `<option value="${d}" ${d === st.d ? 'selected' : ''}>${esc(db.disciplinas.find((x) => x.id === d).nome)}</option>`).join('')}</select></label>
        <label class="inline"><span>Período</span><select data-p>${A.PERIODS.map((p) => `<option ${p === st.p ? 'selected' : ''}>${p}</option>`).join('')}</select></label><div class="grow"></div>
        <button class="btn sm ghost" data-csv>${A.icon('download')}Exportar</button></div>
        <div class="chips">${pautas.map((p) => `<span class="chip">${esc(p.discId)} ${A.badge(p.estado)}</span>`).join('')}</div>
        <div class="card"><div class="tbl-wrap"><table class="tbl compact"><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="12"><div class="empty sm"><p>Sem classificações.</p></div></td></tr>`}</tbody></table></div>
        <div class="tbl-foot"><span class="muted">${al.length} alunos · notas abaixo de 10 assinaladas a vermelho · pautas não aprovadas são provisórias</span></div></div>`;
      el.querySelector('[data-t]').onchange = (e) => { st.t = e.target.value; st.d = ''; draw(); };
      el.querySelector('[data-d]').onchange = (e) => { st.d = e.target.value; draw(); };
      el.querySelector('[data-p]').onchange = (e) => { st.p = e.target.value; draw(); };
      el.querySelector('[data-csv]').onclick = () => {
        const cols = [{ k: 'numero', l: 'N.º' }, { k: 'nome', l: 'Aluno' }, ...(st.d ? [...COMPS, 'MT'].map((c) => ({ l: c, csv: (a) => (c === 'MT' ? A.mt(a.id, st.d, st.p) : A.grade(a.id, st.d, st.p, c)) })) : discs.map((d) => ({ l: d, csv: (a) => A.mt(a.id, d, st.p) })))];
        A.csv(`notas-${t.nome}`, cols, al);
      };
    };
    if (!turmas.length) { el.innerHTML = '<div class="card"><div class="empty"><p>Sem turmas atribuídas.</p></div></div>'; return; }
    draw();
  };

  /* ================= Marcação de presenças ================= */
  V.attendance = function (el, cfg, ctx) {
    const db = ctx.db;
    const pairs = cfg.pairs ? cfg.pairs(ctx) : db.distribuicao.filter((d) => d.profId === ctx.prof.id);
    const st = { pair: pairs[0].id, date: A.TODAY };
    const draw = () => {
      const d = pairs.find((x) => x.id === st.pair);
      const al = db.alunos.filter((a) => a.turmaId === d.turmaId && a.estado === 'Ativa');
      const ex = db.faltas.filter((f) => f.turmaId === d.turmaId && f.discId === d.discId && f.data === st.date);
      const mark = {}; al.forEach((a) => { const f = ex.find((x) => x.alunoId === a.id); mark[a.id] = f ? f.tipo : 'Presente'; });
      const cnt = () => ({ P: Object.values(mark).filter((v) => v === 'Presente').length, F: Object.values(mark).filter((v) => v === 'Falta').length, A: Object.values(mark).filter((v) => v === 'Atraso').length });
      el.innerHTML = `<div class="toolbar"><label class="inline"><span>Aula</span><select data-pair>${pairs.map((p) => `<option value="${p.id}" ${p.id === st.pair ? 'selected' : ''}>${esc(p.turma)} · ${esc(p.disciplina)}</option>`).join('')}</select></label>
        <label class="inline"><span>Data</span><input type="date" data-date value="${st.date}" max="${A.TODAY}"></label><div class="grow"></div>
        ${ctx.ro ? '' : `<button class="btn sm ghost" data-allp>${A.icon('check')}Todos presentes</button>`}</div>
        <div class="kpis mini" data-sum></div>
        <div class="card"><ul class="att">${al.map((a) => `<li data-a="${a.id}"><span class="n">${a.numero}</span><span class="nm">${esc(a.nome)}</span><div class="seg sm">${['Presente', 'Falta', 'Atraso'].map((v) => `<button data-v="${v}" class="${mark[a.id] === v ? 'on ' + (v === 'Falta' ? 'bad' : v === 'Atraso' ? 'warn' : 'ok') : ''}" ${ctx.ro ? 'disabled' : ''}>${v === 'Presente' ? 'P' : v === 'Falta' ? 'F' : 'A'}<span class="hide-sm"> ${v}</span></button>`).join('')}</div></li>`).join('')}</ul></div>
        ${ctx.ro ? '' : `<div class="form-actions sticky"><button class="btn primary" data-save>${A.icon('check')}Gravar presenças</button></div>`}`;
      const sum = () => { const c = cnt(); el.querySelector('[data-sum]').innerHTML = A.kpi('Presentes', c.P, '', '', 'checkCircle') + A.kpi('Faltas', c.F, '', '', 'x') + A.kpi('Atrasos', c.A, '', '', 'clock'); };
      sum();
      el.querySelectorAll('.att li').forEach((li) => li.querySelectorAll('[data-v]').forEach((b) => { b.onclick = () => { mark[li.dataset.a] = b.dataset.v; li.querySelectorAll('[data-v]').forEach((x) => { x.className = x === b ? 'on ' + (b.dataset.v === 'Falta' ? 'bad' : b.dataset.v === 'Atraso' ? 'warn' : 'ok') : ''; }); A.dirty = true; sum(); }; }));
      el.querySelector('[data-pair]').onchange = (e) => { st.pair = e.target.value; draw(); };
      el.querySelector('[data-date]').onchange = (e) => { st.date = e.target.value || A.TODAY; draw(); };
      const ap = el.querySelector('[data-allp]'); if (ap) ap.onclick = () => { al.forEach((a) => { mark[a.id] = 'Presente'; }); A.dirty = true; el.querySelectorAll('.att li').forEach((li) => li.querySelectorAll('[data-v]').forEach((x) => { x.className = x.dataset.v === 'Presente' ? 'on ok' : ''; })); sum(); };
      const sv = el.querySelector('[data-save]');
      if (sv) sv.onclick = () => {
        db.faltas = db.faltas.filter((f) => !(f.turmaId === d.turmaId && f.discId === d.discId && f.data === st.date));
        al.forEach((a) => { if (mark[a.id] !== 'Presente') db.faltas.unshift({ id: A.uid('FT'), alunoId: a.id, aluno: a.nome, processo: a.processo, turmaId: d.turmaId, turma: d.turma, discId: d.discId, disciplina: d.disciplina, data: st.date, tipo: mark[a.id], justificada: 'Não', motivo: '' }); });
        const c = cnt();
        ctx.log('Académico', 'Registo de presenças', `${d.turma} · ${d.disciplina} · ${A.date(st.date)}: ${c.F} faltas, ${c.A} atrasos`);
        A.dirty = false; ctx.save(); A.toast('Presenças gravadas.');
      };
    };
    draw();
  };

  /* ================= Horários ================= */
  V.timetable = function (el, cfg, ctx) {
    const db = ctx.db;
    const mode = cfg.mode || 'turma';
    const options = mode === 'turma' ? (cfg.turmas ? cfg.turmas(ctx) : db.turmas).map((t) => [t.id, t.nome]) : mode === 'prof' ? db.professores.map((p) => [p.id, p.nome]) : db.salas.map((s) => [s.nome, s.nome]);
    const fixed = cfg.fixed ? cfg.fixed(ctx) : null;
    const st = { id: fixed || (options[0] && options[0][0]) };
    const draw = () => {
      const entries = db.horarios.filter((h) => (mode === 'turma' ? h.turmaId === st.id : mode === 'prof' ? h.profId === st.id : h.sala === st.id));
      const hours = A.uniq(entries.map((h) => h.hora)).sort();
      const hoursAll = hours.length ? hours : db.HORAS.Manhã;
      const todayIdx = new Date(A.TODAY + 'T12:00:00').getDay() - 1;
      el.innerHTML = `${fixed ? '' : `<div class="toolbar"><label class="inline"><span>${mode === 'turma' ? 'Turma' : mode === 'prof' ? 'Professor' : 'Sala'}</span><select data-id>${options.map(([v, l]) => `<option value="${esc(v)}" ${v === st.id ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label><div class="grow"></div><button class="btn sm ghost" data-print>${A.icon('printer')}Imprimir</button></div>`}
        <div class="card"><div class="tt-wrap"><table class="tt"><thead><tr><th></th>${db.DIAS.map((d, i) => `<th class="${i === todayIdx ? 'today' : ''}">${d}</th>`).join('')}</tr></thead><tbody>
        ${hoursAll.map((h) => `<tr><th>${h}</th>${db.DIAS.map((_, di) => { const e = entries.filter((x) => x.dia === di && x.hora === h); return `<td class="${di === todayIdx ? 'today' : ''}">${e.map((x) => `<div class="slot s-${x.discId}"><b>${esc(x.disciplina)}</b><small>${esc(mode === 'prof' ? x.turma : mode === 'sala' ? x.turma + ' · ' + x.professor : x.professor)}</small><small>${esc(x.sala)}</small></div>`).join('')}</td>`; }).join('')}</tr>`).join('')}
        </tbody></table></div><div class="tbl-foot"><span class="muted">${entries.length} tempos letivos semanais · cada tempo tem 45 minutos</span></div></div>`;
      const s = el.querySelector('[data-id]'); if (s) s.onchange = () => { st.id = s.value; draw(); };
      const p = el.querySelector('[data-print]'); if (p) p.onclick = () => A.print('Horário', `<h2>Horário — ${esc(options.find((o) => o[0] === st.id)[1])}</h2>` + el.querySelector('.tt-wrap').innerHTML);
    };
    draw();
  };

  /* ================= Calendário ================= */
  V.calendar = function (el, cfg, ctx) {
    const st = { y: 2026, m: 9 };
    const evs = () => cfg.events(ctx);
    const draw = () => {
      const list = evs();
      const first = new Date(st.y, st.m, 1);
      const start = (first.getDay() + 6) % 7;
      const days = new Date(st.y, st.m + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < start; i++) cells.push(null);
      for (let d = 1; d <= days; d++) cells.push(d);
      while (cells.length % 7) cells.push(null);
      const iso = (d) => `${st.y}-${String(st.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const up = list.filter((e) => e.data >= A.TODAY).sort((a, b) => (a.data > b.data ? 1 : -1)).slice(0, 10);
      el.innerHTML = `<div class="grid2 cal-layout"><section class="card span-cal"><div class="card-head"><h3>${A.MONTHS[st.m]} ${st.y}</h3><div class="row"><button class="btn xs ghost" data-m="-1" aria-label="Mês anterior">‹</button><button class="btn xs ghost" data-m="0">Hoje</button><button class="btn xs ghost" data-m="1" aria-label="Mês seguinte">›</button></div></div>
        <div class="cal"><div class="cal-h">${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => `<span>${d}</span>`).join('')}</div><div class="cal-g">${cells.map((d) => { if (!d) return '<div class="cd off"></div>'; const e = list.filter((x) => x.data === iso(d)); return `<div class="cd ${iso(d) === A.TODAY ? 'today' : ''}"><span class="dn">${d}</span>${e.slice(0, 3).map((x) => `<i class="ev ${A.evTone(x.tipo)}" title="${esc(x.titulo)}">${esc(x.titulo)}</i>`).join('')}${e.length > 3 ? `<i class="more">+${e.length - 3}</i>` : ''}</div>`; }).join('')}</div></div></section>
        <section class="card"><div class="card-head"><h3>Próximos</h3></div>${A.list(up.map((e) => ({ tone: A.evTone(e.tipo), t: e.titulo, m: `${A.date(e.data)} · ${e.tipo}` })), 'Sem eventos agendados.')}</section></div>`;
      el.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => { const v = +b.dataset.m; if (!v) { st.y = 2026; st.m = 9; } else { st.m += v; if (st.m < 0) { st.m = 11; st.y--; } if (st.m > 11) { st.m = 0; st.y++; } } draw(); }; });
    };
    draw();
  };
  A.evTone = (t) => ({ Feriado: 'bad', Avaliação: 'warn', 'Prova trimestral': 'warn', Teste: 'warn', Reunião: 'info', Prazo: 'bad', Período: 'ok', Atividade: 'ok' }[t] || 'info');

  /* ================= Perfis e permissões ================= */
  V.perms = function (el, cfg, ctx) {
    const db = ctx.db;
    const ACT = [['v', 'Ver'], ['c', 'Criar'], ['e', 'Editar'], ['r', 'Eliminar'], ['a', 'Aprovar']];
    const st = { p: 'prof' };
    const LOCK = { admin: 'O perfil de administrador é gerido pela plataforma.', aluno: 'Perfil de portal: acesso limitado à própria informação.', enc: 'Perfil de portal: acesso limitado aos educandos associados.' };
    const draw = () => {
      const p = db.perfis.find((x) => x.id === st.p);
      const perm = db.permissoes[st.p];
      const lock = LOCK[st.p];
      const audit = st.p === 'aud';
      el.innerHTML = `<div class="split"><aside class="card plist"><div class="card-head"><h3>Perfis</h3>${ctx.ro ? '' : `<button class="btn xs" data-newp>${A.icon('plus')}Novo</button>`}</div><ul>${db.perfis.map((x) => `<li class="${x.id === st.p ? 'on' : ''}" data-p="${x.id}"><span>${esc(x.nome)}</span><small>${x.tipo} · ${x.utilizadores}</small></li>`).join('')}</ul></aside>
        <section class="card"><div class="card-head"><div><h3>${esc(p.nome)}</h3><p class="muted">${p.tipo === 'Sistema' ? 'Perfil base do sistema' : 'Perfil personalizado'} · ${p.utilizadores} utilizador(es)</p></div>${A.badge(p.tipo)}</div>
        ${lock ? `<div class="note">${A.icon('lock')}<div>${lock}</div></div>` : ''}${audit ? `<div class="note">${A.icon('lock')}<div>Restrição da plataforma: o perfil de auditor é exclusivamente de leitura.</div></div>` : ''}
        <div class="tbl-wrap"><table class="tbl perm"><thead><tr><th>Módulo</th>${ACT.map(([, l]) => `<th class="c">${l}</th>`).join('')}</tr></thead><tbody>
        ${db.MODS.map((m) => { const lic = A.modLicensed(m); return `<tr class="${lic ? '' : 'dim'}"><td>${esc(m)}${lic ? '' : ' <small class="muted">· módulo não ativo</small>'}</td>${ACT.map(([k]) => `<td class="c"><input type="checkbox" data-m="${esc(m)}" data-k="${k}" ${perm[m].includes(k) ? 'checked' : ''} ${ctx.ro || lock || !lic || (audit && k !== 'v') || (m === 'Configurações' && st.p !== 'admin' && k !== 'v') ? 'disabled' : ''} aria-label="${esc(m)} ${k}"></td>`).join('')}</tr>`; }).join('')}
        </tbody></table></div>
        ${ctx.ro || lock ? '' : `<div class="form-actions"><button class="btn primary" data-savep>${A.icon('check')}Guardar permissões</button></div>`}</section></div>`;
      el.querySelectorAll('[data-p]').forEach((li) => { li.onclick = () => { st.p = li.dataset.p; draw(); }; });
      const sv = el.querySelector('[data-savep]');
      if (sv) sv.onclick = () => {
        const changes = [];
        db.MODS.forEach((m) => { const nv = ACT.map(([k]) => k).filter((k) => el.querySelector(`[data-m="${m}"][data-k="${k}"]`).checked).join(''); if (nv !== perm[m]) changes.push(`${m}: ${perm[m] || '—'} → ${nv || '—'}`); perm[m] = nv; });
        if (!changes.length) return A.toast('Sem alterações.', 'warn');
        ctx.log('Configurações', 'Alteração de permissões', `Perfil ${p.nome}: ${changes.join('; ')}`, 1); ctx.save(); A.toast('Permissões atualizadas e registadas na auditoria.');
      };
      const np = el.querySelector('[data-newp]');
      if (np) np.onclick = () => A.modal({ title: 'Novo perfil personalizado', size: 'sm', body: A.formHtml([{ k: 'nome', l: 'Nome do perfil', req: 1 }, { k: 'base', l: 'Copiar permissões de', o: db.perfis.filter((x) => !LOCK[x.id]).map((x) => x.nome) }]), actions: [{ l: 'Cancelar' }, { l: 'Criar perfil', cls: 'primary', fn: (b) => {
        const v = A.readForm(b, [{ k: 'nome', req: 1 }, { k: 'base' }]); if (!v) return false;
        const id = A.uid('p'); const base = db.perfis.find((x) => x.nome === v.base);
        db.perfis.push({ id, nome: v.nome, tipo: 'Personalizado', utilizadores: 0, estado: 'Ativo' });
        db.permissoes[id] = base ? { ...db.permissoes[base.id] } : Object.fromEntries(db.MODS.map((m) => [m, '']));
        ctx.log('Configurações', 'Criação de perfil', v.nome, 1); ctx.save(); st.p = id; draw(); A.toast('Perfil criado.');
      } }] });
    };
    draw();
  };
  A.modLicensed = (m) => {
    const map = { Académico: 'academico', Secretaria: 'secretaria', Tesouraria: 'financeiro', Contabilidade: 'contabilidade', Stock: 'stock', RH: 'rh', Biblioteca: 'biblioteca', Comunicação: 'comunicacao' };
    const id = map[m]; if (!id) return true;
    const x = A.db.licenca.modulos.find((y) => y.id === id); return x && x.ativo;
  };
  A.modActive = (id) => { const x = A.db.licenca.modulos.find((y) => y.id === id); return !!(x && x.ativo); };

  /* ================= Módulos e licenças ================= */
  V.modules = function (el, cfg, ctx) {
    const db = ctx.db, L = db.licenca;
    const part = cfg.part || 'all';
    const daysLeft = Math.round((new Date(L.validade) - new Date(A.TODAY)) / 864e5);
    const nAl = db.alunos.filter((a) => a.estado === 'Ativa' || a.estado === 'Pendente').length;
    const nU = db.utilizadores.filter((u) => u.estado === 'Ativo').length;
    const lim = [['Alunos matriculados', nAl, L.limites.alunos, ''], ['Utilizadores ativos (staff)', nU, L.limites.utilizadores, ''], ['Armazenamento', L.uso.armazenamento, L.limites.armazenamento, ' GB'], ['SMS (ano letivo)', L.uso.sms, L.limites.sms, '']];
    const draw = () => {
      el.innerHTML = `${part === 'all' || part === 'validade' ? `<div class="kpis">${A.kpi('Plano', L.plano, 'Licença institucional', '', 'key')}${A.kpi('Validade', A.date(L.validade), `${daysLeft} dias restantes`, daysLeft < 60 ? 'bad' : 'ok', 'calendar')}${A.kpi('Módulos ativos', L.modulos.filter((m) => m.ativo).length + ' / ' + L.modulos.filter((m) => m.contratado).length, 'contratados', '', 'grid')}${A.kpi('Início da licença', A.date(L.inicio), '', '', 'clock')}</div>` : ''}
      ${part === 'all' || part === 'limites' ? A.section('Limites da licença', `<div class="limits">${lim.map(([l, v, m, s]) => `<div><div class="row sb"><span>${l}</span><b>${A.num(v)}${s} <span class="muted">/ ${A.num(m)}${s}</span></b></div>${A.progress(v, m)}</div>`).join('')}</div><p class="muted mt">Ao atingir um limite, as operações de criação ficam bloqueadas até à revisão da licença.</p>`) : ''}
      ${part === 'all' || part === 'modulos' || part === 'estado' ? A.section(part === 'estado' ? 'Estado dos módulos' : 'Módulos', `<div class="mods">${L.modulos.map((m) => `<div class="mod ${m.contratado ? '' : 'off'}"><div><b>${esc(m.nome)}</b><small>${esc(m.desc)}</small></div><div class="mod-r">${m.contratado ? A.badge(m.ativo ? 'Ativo' : 'Inativo') : A.badge('Não contratado', 'muted')}${m.contratado && !ctx.ro ? `<label class="switch" title="${m.ativo ? 'Desativar' : 'Ativar'}"><input type="checkbox" data-mod="${m.id}" ${m.ativo ? 'checked' : ''}><i></i></label>` : m.contratado ? '' : `<span class="muted xs">${A.icon('lock')}</span>`}</div></div>`).join('')}</div><p class="muted mt">Módulos não contratados só podem ser ativados pelo fornecedor da plataforma mediante revisão do plano.</p>`) : ''}`;
      el.querySelectorAll('[data-mod]').forEach((c) => { c.onchange = () => { const m = L.modulos.find((x) => x.id === c.dataset.mod); m.ativo = c.checked; ctx.log('Configurações', m.ativo ? 'Ativação de módulo' : 'Desativação de módulo', m.nome, 1); ctx.save(); A.toast(`${m.nome} ${m.ativo ? 'ativado' : 'desativado'}.`); draw(); }; });
    };
    draw();
  };

  /* ================= Pagamentos: registo ================= */
  A.payModal = function (ctx, alunoId, after) {
    const db = ctx.db;
    const body = `<label class="field full"><span>Aluno (nome ou n.º de processo)</span><input list="dl-al" data-al placeholder="Pesquisar aluno…" value="${alunoId ? esc((db.alunos.find((a) => a.id === alunoId) || {}).processo + ' — ' + (db.alunos.find((a) => a.id === alunoId) || {}).nome) : ''}"><datalist id="dl-al">${db.alunos.map((a) => `<option value="${a.processo} — ${esc(a.nome)}">`).join('')}</datalist></label><div data-ch class="mt"></div>
      <div class="form-grid mt"><label class="field"><span>Método de pagamento</span><select data-met>${['Numerário', 'Transferência', 'Multicaixa Express', 'TPA', ...(A.modActive('pagdigitais') ? ['Referência'] : [])].map((m) => `<option>${m}</option>`).join('')}</select></label><label class="field"><span>Total a receber</span><input data-tot readonly value="0 Kz"></label></div>`;
    let sel = null;
    A.modal({ title: 'Registar pagamento', size: 'md', body, onOpen: (b) => {
      const inp = b.querySelector('[data-al]');
      const load = () => {
        const proc = inp.value.split(' — ')[0].trim();
        sel = db.alunos.find((a) => a.processo === proc);
        const host = b.querySelector('[data-ch]');
        if (!sel) { host.innerHTML = '<p class="muted">Selecione um aluno para ver as cobranças em aberto.</p>'; return; }
        const open = db.cobrancas.filter((c) => c.alunoId === sel.id && c.estado !== 'Pago');
        host.innerHTML = open.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="chk"></th><th>Descrição</th><th>Vencimento</th><th class="r">Em dívida</th></tr></thead><tbody>${open.map((c) => `<tr><td class="chk"><input type="checkbox" data-c="${c.id}" ${c.vencimento <= A.TODAY ? 'checked' : ''}></td><td>${esc(c.descricao)} ${A.badge(c.estado)}</td><td>${A.date(c.vencimento)}</td><td class="r">${A.money(c.divida)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="note ok">${A.icon('checkCircle')}<div>Sem cobranças em aberto para ${esc(sel.nome)}.</div></div>`;
        const tot = () => { b.querySelector('[data-tot]').value = A.money(A.sum([...host.querySelectorAll('[data-c]:checked')].map((x) => db.cobrancas.find((c) => c.id === x.dataset.c)), 'divida')); };
        host.querySelectorAll('[data-c]').forEach((x) => { x.onchange = tot; }); tot();
      };
      inp.addEventListener('change', load); inp.addEventListener('input', () => { if (inp.value.includes(' — ')) load(); }); load();
    }, actions: [{ l: 'Cancelar' }, { l: 'Confirmar e emitir recibo', cls: 'primary', icon: 'check', fn: (b) => {
      if (!sel) { A.toast('Selecione o aluno.', 'warn'); return false; }
      const ids = [...b.querySelectorAll('[data-c]:checked')].map((x) => x.dataset.c);
      if (!ids.length) { A.toast('Selecione pelo menos uma cobrança.', 'warn'); return false; }
      const met = b.querySelector('[data-met]').value;
      const n = db.pagamentos.length + 1;
      const recs = ids.map((id, i) => {
        const c = db.cobrancas.find((x) => x.id === id);
        const p = { id: A.uid('PG'), recibo: `RC 2026/${String(n + i).padStart(5, '0')}`, alunoId: sel.id, aluno: sel.nome, processo: sel.processo, turma: sel.turma, cobrancaId: c.id, descricao: c.descricao, valor: c.divida, metodo: met, data: A.TODAY, hora: A.now().slice(11), operador: ctx.user.nome, estado: met === 'Transferência' ? 'Por confirmar' : 'Confirmado' };
        c.pago = c.valor; c.divida = 0; c.estado = 'Pago';
        db.pagamentos.unshift(p); return p;
      });
      ctx.log('Tesouraria', 'Emissão de recibo', `${recs.map((r) => r.recibo).join(', ')} — ${sel.nome} — ${A.money(A.sum(recs, 'valor'))}`);
      ctx.save(); A.toast('Pagamento registado e recibo emitido.');
      setTimeout(() => A.print('Recibo', A.docs.recibo(recs)), 180);
      if (after) after();
    } }] });
  };

  /* ================= Contas correntes ================= */
  V.ledger = function (el, cfg, ctx) {
    const db = ctx.db;
    const st = { q: '', per: '', sel: cfg.fixed ? cfg.fixed(ctx) : null };
    const draw = () => {
      let res = [];
      const q = A.norm(st.q);
      if (q.length >= 2) {
        const byRec = db.pagamentos.filter((p) => A.norm(p.recibo).includes(q)).map((p) => p.alunoId);
        res = db.alunos.filter((a) => A.norm(a.nome).includes(q) || a.processo.includes(q) || byRec.includes(a.id));
        if (st.per) res = res.filter((a) => db.cobrancas.some((c) => c.alunoId === a.id && c.periodo === st.per));
        res = res.slice(0, 30);
      }
      const a = st.sel && db.alunos.find((x) => x.id === st.sel);
      let stmt = '';
      if (a) {
        const ch = db.cobrancas.filter((c) => c.alunoId === a.id && (!st.per || c.periodo === st.per));
        const pg = db.pagamentos.filter((p) => p.alunoId === a.id && (!st.per || ch.some((c) => c.id === p.cobrancaId)));
        const mov = [...ch.map((c) => ({ d: c.vencimento, t: c.descricao, deb: c.valor, cred: 0, ref: c.id, e: c.estado })), ...pg.map((p) => ({ d: p.data, t: `Pagamento — ${p.descricao} (${p.metodo})`, deb: 0, cred: p.estado === 'Anulado' ? 0 : p.valor, ref: p.recibo, e: p.estado }))].sort((x, y) => (x.d > y.d ? 1 : x.d < y.d ? -1 : x.deb ? -1 : 1));
        let bal = 0;
        const deb = A.sum(ch, 'valor'), cred = A.sum(pg.filter((p) => p.estado !== 'Anulado'), 'valor');
        stmt = `<section class="card"><div class="card-head"><div><h3>${esc(a.nome)}</h3><p class="muted">Processo ${a.processo} · ${esc(a.turma)} · Encarregado: ${esc(a.encarregado)}${a.bolsa !== '—' ? ' · ' + esc(a.bolsa) : ''}</p></div><div class="row">${cfg.fixed ? '' : `<button class="btn xs ghost" data-clear>${A.icon('x')}</button>`}</div></div>
          <div class="kpis mini">${A.kpi('Total cobrado', A.money(deb))}${A.kpi('Total pago', A.money(cred), '', 'ok')}${A.kpi('Saldo em dívida', A.money(deb - cred), deb - cred > 0 ? 'Regularização necessária' : 'Conta regularizada', deb - cred > 0 ? 'bad' : 'ok')}</div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Descrição</th><th>Referência</th><th class="r">Débito</th><th class="r">Crédito</th><th class="r">Saldo</th></tr></thead><tbody>${mov.map((m) => { bal += m.deb - m.cred; return `<tr><td>${A.date(m.d)}</td><td>${esc(m.t)} ${m.e === 'Anulado' || m.e === 'Por confirmar' ? A.badge(m.e) : ''}</td><td class="muted">${esc(m.ref)}</td><td class="r">${m.deb ? A.money(m.deb) : ''}</td><td class="r">${m.cred ? A.money(m.cred) : ''}</td><td class="r"><b>${A.money(bal)}</b></td></tr>`; }).join('')}</tbody></table></div>
          ${ctx.ro || cfg.noPay ? '' : `<div class="form-actions"><button class="btn ghost" data-pstmt>${A.icon('printer')}Imprimir extrato</button><button class="btn primary" data-pay>${A.icon('cash')}Registar pagamento</button></div>`}</section>`;
      }
      el.innerHTML = `${cfg.fixed ? '' : `<div class="card"><div class="tbl-tools"><div class="search-in grow2">${A.icon('search')}<input type="search" data-q value="${esc(st.q)}" placeholder="Nome do aluno, n.º de processo ou referência do recibo (ex.: RC 2026/00123)"></div>
        <select data-per aria-label="Período de cobrança"><option value="">Período: todos</option>${A.uniq(db.cobrancas.map((c) => c.periodo)).sort().map((p) => `<option value="${p}" ${st.per === p ? 'selected' : ''}>${A.MONTHS[+p.slice(5) - 1]} ${p.slice(0, 4)}</option>`).join('')}</select></div>
        ${q.length >= 2 ? (res.length ? `<ul class="res">${res.map((x) => `<li data-s="${x.id}" class="${x.id === st.sel ? 'on' : ''}"><b>${esc(x.nome)}</b><span>${x.processo} · ${esc(x.turma)}</span><span class="${A.debt(x.id) ? 'neg' : 'muted'}">${A.debt(x.id) ? 'Dívida ' + A.money(A.debt(x.id)) : 'Regularizado'}</span></li>`).join('')}</ul>` : '<div class="empty sm"><p>Nenhuma conta encontrada.</p></div>') : '<p class="muted pad">Escreva pelo menos 2 caracteres para pesquisar.</p>'}</div>`}${stmt}`;
      const qi = el.querySelector('[data-q]');
      if (qi) { qi.oninput = () => { st.q = qi.value; const pos = qi.selectionStart; draw(); const n = el.querySelector('[data-q]'); n.focus(); n.setSelectionRange(pos, pos); }; }
      const ps = el.querySelector('[data-per]'); if (ps) ps.onchange = () => { st.per = ps.value; draw(); };
      el.querySelectorAll('[data-s]').forEach((li) => { li.onclick = () => { st.sel = li.dataset.s; draw(); }; });
      const cl = el.querySelector('[data-clear]'); if (cl) cl.onclick = () => { st.sel = null; draw(); };
      const pay = el.querySelector('[data-pay]'); if (pay) pay.onclick = () => A.payModal(ctx, st.sel, draw);
      const pr = el.querySelector('[data-pstmt]'); if (pr) pr.onclick = () => A.print('Extrato', `<h2>Extrato de conta corrente</h2>` + el.querySelector('section.card:last-child').innerHTML);
    };
    draw();
  };

  /* ================= Caixa ================= */
  V.cashbox = function (el, cfg, ctx) {
    const db = ctx.db, C = db.caixa;
    const draw = () => {
      const today = db.pagamentos.filter((p) => p.data === A.TODAY && p.metodo === 'Numerário' && p.estado !== 'Anulado');
      const ent = A.sum(today, 'valor'), sai = A.sum(C.saidas, 'valor');
      const esperado = C.fundo + ent - sai;
      el.innerHTML = `<div class="kpis">${A.kpi('Estado do caixa', C.aberto ? 'Aberto' : 'Fechado', C.aberto ? `Desde ${A.date(C.abertura)} · ${esc(C.operador)}` : 'Abra o caixa para iniciar o dia', C.aberto ? 'ok' : 'bad', 'cash')}${A.kpi('Fundo de maneio', A.money(C.fundo))}${A.kpi('Entradas em numerário', A.money(ent), `${today.length} recibos hoje`, 'ok', 'trend')}${A.kpi('Saldo esperado', A.money(esperado), `Saídas: ${A.money(sai)}`)}</div>
        ${ctx.ro ? '' : `<div class="toolbar">${C.aberto ? `<button class="btn" data-out>${A.icon('trendDown')}Registar saída</button><button class="btn primary" data-close>${A.icon('lock')}Fechar caixa</button>` : `<button class="btn primary" data-open>${A.icon('key')}Abrir caixa</button>`}</div>`}
        <div class="grid2">${A.section('Movimentos do dia', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Hora</th><th>Descrição</th><th class="r">Entrada</th><th class="r">Saída</th></tr></thead><tbody>
          <tr><td>${C.abertura.slice(11) || '—'}</td><td>Abertura — fundo de maneio</td><td class="r">${A.money(C.fundo)}</td><td></td></tr>
          ${[...today.map((p) => ({ h: p.hora, t: `${p.recibo} · ${p.aluno}`, e: p.valor })), ...C.saidas.map((s) => ({ h: s.hora, t: s.descricao, s: s.valor }))].sort((a, b) => (a.h > b.h ? 1 : -1)).map((m) => `<tr><td>${m.h}</td><td>${esc(m.t)}</td><td class="r">${m.e ? A.money(m.e) : ''}</td><td class="r">${m.s ? A.money(m.s) : ''}</td></tr>`).join('')}
          </tbody></table></div>`, '', 'span2')}
          ${A.section('Histórico de fechos', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Operador</th><th class="r">Entradas</th><th class="r">Contado</th><th class="r">Diferença</th><th>Estado</th></tr></thead><tbody>${C.historico.map((h) => `<tr><td>${A.date(h.data)}</td><td>${esc(h.operador)}</td><td class="r">${A.money(h.entradas)}</td><td class="r">${A.money(h.contado)}</td><td class="r ${h.diferenca ? 'neg' : ''}">${A.money(h.diferenca)}</td><td>${A.badge(h.estado)}</td></tr>`).join('')}</tbody></table></div>`, '', 'span2')}</div>`;
      const o = el.querySelector('[data-out]');
      if (o) o.onclick = () => A.modal({ title: 'Registar saída de caixa', size: 'sm', body: A.formHtml([{ k: 'descricao', l: 'Descrição', req: 1, full: 1 }, { k: 'valor', l: 'Valor (Kz)', t: 'money', req: 1 }]), actions: [{ l: 'Cancelar' }, { l: 'Registar', cls: 'primary', fn: (b) => { const v = A.readForm(b, [{ k: 'descricao', req: 1 }, { k: 'valor', t: 'money', req: 1 }]); if (!v) return false; C.saidas.push({ hora: A.now().slice(11), ...v }); ctx.log('Tesouraria', 'Saída de caixa', `${v.descricao} — ${A.money(v.valor)}`); ctx.save(); draw(); A.toast('Saída registada.'); } }] });
      const c = el.querySelector('[data-close]');
      if (c) c.onclick = () => A.modal({ title: 'Fecho de caixa', size: 'sm', body: `${A.kv({ 'Saldo esperado': A.money(esperado) })}<label class="field full mt"><span>Valor contado (Kz)</span><input type="number" data-cont value="${esperado}"></label><p class="muted" data-dif>Diferença: 0 Kz</p>`, onOpen: (b) => { const i = b.querySelector('[data-cont]'); i.oninput = () => { const d = Number(i.value) - esperado; b.querySelector('[data-dif]').innerHTML = `Diferença: <b class="${d ? 'neg' : ''}">${A.money(d)}</b>`; }; }, actions: [{ l: 'Cancelar' }, { l: 'Confirmar fecho', cls: 'primary', fn: (b) => {
        const cont = Number(b.querySelector('[data-cont]').value); const d = cont - esperado;
        C.historico.unshift({ data: A.TODAY, operador: ctx.user.nome, fundo: C.fundo, entradas: ent, saidas: sai, contado: cont, diferenca: d, estado: d ? 'Fechado com diferença' : 'Fechado' });
        C.aberto = false; C.saidas = [];
        ctx.log('Tesouraria', 'Fecho de caixa', `Contado ${A.money(cont)} · diferença ${A.money(d)}`, 1); ctx.save(); draw(); A.toast(d ? 'Caixa fechado com diferença — registado para análise.' : 'Caixa fechado sem diferenças.', d ? 'warn' : 'ok');
      } }] });
      const op = el.querySelector('[data-open]');
      if (op) op.onclick = () => A.modal({ title: 'Abertura de caixa', size: 'sm', body: A.formHtml([{ k: 'fundo', l: 'Fundo de maneio (Kz)', t: 'money', def: 50000, req: 1 }]), actions: [{ l: 'Cancelar' }, { l: 'Abrir caixa', cls: 'primary', fn: (b) => { const v = A.readForm(b, [{ k: 'fundo', t: 'money', req: 1 }]); if (!v) return false; Object.assign(C, { aberto: true, fundo: v.fundo, abertura: A.now(), operador: ctx.user.nome }); ctx.log('Tesouraria', 'Abertura de caixa', A.money(v.fundo)); ctx.save(); draw(); A.toast('Caixa aberto.'); } }] });
    };
    draw();
  };

  /* ================= Emissão de documentos ================= */
  A.pickAluno = (db, list) => `<input list="dl-pick" data-pick placeholder="Nome ou n.º de processo"><datalist id="dl-pick">${(list || db.alunos).map((a) => `<option value="${a.processo} — ${esc(a.nome)}">`).join('')}</datalist>`;
  A.resolveAluno = (db, v) => db.alunos.find((a) => a.processo === String(v || '').split(' — ')[0].trim());
  V.issue = function (el, cfg, ctx) {
    const db = ctx.db;
    const kind = cfg.kind;
    const TIPOS = { boletim: ['Boletim trimestral'], declaracao: db.modelos.filter((m) => m.tipo === 'Declaração').map((m) => m.nome + (m.estado === 'Inativo' ? ' (modelo inativo)' : '')) };
    el.innerHTML = `<div class="grid2"><section class="card"><div class="card-head"><h3>${kind === 'boletim' ? 'Emissão de boletins' : 'Emissão de declarações'}</h3></div>
      <div class="form-grid">
        ${kind === 'boletim' ? `<div class="field full"><span>Modo de emissão</span><div class="seg" data-mode><button class="on" data-v="ind">Individual</button><button data-v="lote">Em lote (turma)</button></div></div>
          <label class="field"><span>Turma</span><select data-t>${db.turmas.map((t) => `<option value="${t.id}">${esc(t.nome)}</option>`).join('')}</select></label>
          <label class="field"><span>Período</span><select data-p>${A.PERIODS.map((p) => `<option>${p}</option>`).join('')}</select></label>
          <label class="field full" data-indf><span>Aluno</span><select data-a></select></label>` : `
          <label class="field full"><span>Tipo de declaração</span><select data-tipo>${TIPOS.declaracao.map((t) => `<option ${t.includes('inativo') ? 'disabled' : ''}>${esc(t)}</option>`).join('')}</select></label>
          <label class="field full"><span>Aluno</span>${A.pickAluno(db)}</label>
          <label class="field full"><span>Finalidade</span><input data-fin placeholder="Ex.: efeitos de abono de família"></label>`}
      </div>
      <div class="form-actions"><button class="btn" data-prev>${A.icon('eye')}Pré-visualizar</button>${ctx.ro ? '' : `<button class="btn primary" data-emit>${A.icon('printer')}Emitir e imprimir</button>`}</div></section>
      ${A.section('Emitidos recentemente', `<div data-recent></div>`)}</div>`;
    const recent = () => { el.querySelector('[data-recent]').innerHTML = A.list(db.documentos.filter((d) => (kind === 'boletim' ? d.tipo.startsWith('Boletim') : d.tipo.startsWith('Declaração'))).slice(0, 8).map((d) => ({ icon: 'file', t: `${d.tipo} — ${d.aluno}`, m: `${d.id} · ${A.date(d.data)} · ${d.emitidoPor}`, r: A.badge(d.estado) }))); };
    recent();
    let mode = 'ind';
    const fillAl = () => { const s = el.querySelector('[data-a]'); if (s) s.innerHTML = db.alunos.filter((a) => a.turmaId === el.querySelector('[data-t]').value && a.estado === 'Ativa').map((a) => `<option value="${a.id}">${a.numero}. ${esc(a.nome)}</option>`).join(''); };
    if (kind === 'boletim') {
      fillAl(); el.querySelector('[data-t]').onchange = fillAl;
      el.querySelectorAll('[data-mode] button').forEach((b) => { b.onclick = () => { mode = b.dataset.v; el.querySelectorAll('[data-mode] button').forEach((x) => x.classList.toggle('on', x === b)); el.querySelector('[data-indf]').style.display = mode === 'ind' ? '' : 'none'; }; });
    }
    const targets = () => {
      if (kind === 'boletim') return mode === 'ind' ? [db.alunos.find((a) => a.id === el.querySelector('[data-a]').value)].filter(Boolean) : db.alunos.filter((a) => a.turmaId === el.querySelector('[data-t]').value && a.estado === 'Ativa');
      const a = A.resolveAluno(db, el.querySelector('[data-pick]').value); return a ? [a] : [];
    };
    const render = (list) => kind === 'boletim' ? list.map((a) => A.docs.boletim(a, el.querySelector('[data-p]').value)).join('<div class="pb"></div>') : A.docs.declaracao(list[0], el.querySelector('[data-tipo]').value, el.querySelector('[data-fin]').value);
    el.querySelector('[data-prev]').onclick = () => { const l = targets(); if (!l.length) return A.toast('Selecione o aluno.', 'warn'); A.preview(kind === 'boletim' ? `Boletim${l.length > 1 ? 's (' + l.length + ')' : ''}` : 'Declaração', render(l.slice(0, kind === 'boletim' && l.length > 1 ? 3 : 1)) + (l.length > 3 ? `<p class="muted c">… e mais ${l.length - 3} boletins no lote.</p>` : '')); };
    const em = el.querySelector('[data-emit]');
    if (em) em.onclick = () => {
      const l = targets(); if (!l.length) return A.toast('Selecione o aluno.', 'warn');
      if (kind === 'declaracao' && A.debt(l[0].id) > 0 && !confirm('O aluno tem dívidas vencidas. Pretende emitir a declaração mesmo assim?')) return;
      const tipo = kind === 'boletim' ? `Boletim trimestral — ${el.querySelector('[data-p]').value}` : el.querySelector('[data-tipo]').value;
      l.forEach((a) => db.documentos.unshift({ id: `DOC-2026/${String(db.documentos.length + 1).padStart(4, '0')}`, tipo, alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, data: A.TODAY, emitidoPor: ctx.user.nome, estado: 'Emitido', via: '1.ª via' }));
      ctx.log('Secretaria', kind === 'boletim' ? 'Emissão de boletim' : 'Emissão de declaração', `${tipo} — ${l.length > 1 ? l.length + ' alunos (' + l[0].turma + ')' : l[0].nome}`, kind !== 'boletim');
      ctx.save(); recent(); A.toast(`${l.length} documento(s) emitido(s).`);
      A.print(tipo, render(l));
    };
  };

  /* ================= Relatórios ================= */
  V.reports = function (el, cfg, ctx) {
    const items = cfg.items(ctx);
    el.innerHTML = `<div class="rep-grid">${items.map((it, i) => `<article class="card rep"><div>${A.icon(it.icon || 'chart')}<h4>${esc(it.t)}</h4><p class="muted">${esc(it.d || '')}</p></div><div class="row"><button class="btn sm" data-r="${i}">${A.icon('eye')}Gerar</button><button class="btn sm ghost" data-x="${i}" title="Exportar CSV">${A.icon('download')}CSV</button></div></article>`).join('')}</div>`;
    const build = (it) => {
      let rows = typeof it.rows === 'function' ? it.rows(ctx) : ctx.db[it.ds].filter((r) => !it.where || it.where(r, ctx));
      let cols = it.cols ? it.cols.map((k) => (typeof k === 'object' ? k : { k, l: ((A.SCHEMA[it.ds] || { f: {} }).f[k] || {}).l || k, t: ((A.SCHEMA[it.ds] || { f: {} }).f[k] || {}).t })) : null;
      if (it.group) {
        const g = {};
        rows.forEach((r) => { const key = typeof it.group === 'function' ? it.group(r) : r[it.group]; g[key] = g[key] || { grupo: key, registos: 0, total: 0 }; g[key].registos++; if (it.sum) g[key].total += Number(r[it.sum]) || 0; });
        rows = Object.values(g).sort((a, b) => String(a.grupo).localeCompare(String(b.grupo), 'pt', { numeric: true }));
        cols = [{ k: 'grupo', l: it.gl || 'Grupo' }, { k: 'registos', l: 'Registos', t: 'num' }, ...(it.sum ? [{ k: 'total', l: it.sl || 'Total', t: it.st || 'money' }] : [])];
      }
      return { rows, cols };
    };
    el.querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => { const it = items[+b.dataset.r]; const { rows, cols } = build(it); A.modal({ title: it.t, sub: `${rows.length} linha(s) · gerado em ${A.date(A.now())} por ${esc(ctx.user.nome)}`, size: 'lg', body: '<div data-h></div>', onOpen: (body) => A.dataTable(body.querySelector('[data-h]'), { rows, cols, filters: ['q'], exportName: it.t, pageSize: 10 }), actions: [{ l: 'Imprimir / PDF', icon: 'printer', fn: () => { A.print(it.t, `<h2>${esc(it.t)}</h2><p>${esc(ctx.db.escola.nome)} · ${A.date(A.TODAY)}</p><table class="tbl"><thead><tr>${cols.map((c) => `<th>${esc(c.l)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${A.fmt(r[c.k], c.t)}</td>`).join('')}</tr>`).join('')}</tbody></table>`); return false; } }, { l: 'Fechar' }] }); ctx.log(ctx.role.mod, 'Geração de relatório', it.t); ctx.save(); }; });
    el.querySelectorAll('[data-x]').forEach((b) => { b.onclick = () => { const it = items[+b.dataset.x]; const { rows, cols } = build(it); A.csv(it.t.toLowerCase().replace(/\s+/g, '-'), cols, rows); }; });
  };

  /* ================= Avisos / comunicados ================= */
  V.feed = function (el, cfg, ctx) {
    const db = ctx.db;
    db.lidos = db.lidos || {};
    const list = db.comunicados.filter((c) => c.estado === 'Publicado' && (!cfg.to || cfg.to.includes(c.destinatarios)));
    el.innerHTML = list.length ? `<div class="feed-cards">${list.map((c) => `<article class="card notice ${db.lidos[ctx.role.id + c.id] ? 'read' : ''}" data-id="${c.id}"><header><span class="badge info">${esc(c.tipo)}</span><small class="muted">${A.date(c.data)} · ${esc(c.autor)}</small>${db.lidos[ctx.role.id + c.id] ? '' : '<i class="dot info" title="Não lido"></i>'}</header><h4>${esc(c.titulo)}</h4><p>${esc(c.texto)}</p><footer><small class="muted">Destinatários: ${esc(c.destinatarios)}</small>${db.lidos[ctx.role.id + c.id] ? '' : '<button class="btn xs ghost" data-read>Marcar como lido</button>'}</footer></article>`).join('')}</div>` : '<div class="card"><div class="empty"><p>Sem avisos.</p></div></div>';
    el.querySelectorAll('[data-read]').forEach((b) => { b.onclick = () => { db.lidos[ctx.role.id + b.closest('[data-id]').dataset.id] = 1; ctx.save(); V.feed(el, cfg, ctx); A.refreshBadges(); }; });
  };

  /* ================= Desempenho escolar ================= */
  V.performance = function (el, cfg, ctx) {
    const db = ctx.db;
    const scope = cfg.scope ? cfg.scope(ctx) : db.alunos.filter((a) => a.estado === 'Ativa');
    const by = cfg.by || 'turma';
    const S = scope.map((a) => ({ a, s: A.stats(a) }));
    const withM = S.filter((x) => x.s.media != null);
    const avg = withM.length ? A.sum(withM, (x) => x.s.media) / withM.length : 0;
    const apr = withM.length ? (withM.filter((x) => x.s.negativas <= 2 && x.s.media >= 10).length / withM.length) * 100 : 0;
    const risk = S.filter((x) => A.risk(x.s));
    let groups;
    if (by === 'disciplina') {
      const ds = A.uniq(scope.flatMap((a) => (db.turmas.find((t) => t.id === a.turmaId) || { disciplinas: [] }).disciplinas)).filter((d) => !cfg.discs || cfg.discs(ctx).includes(d));
      groups = ds.map((d) => { const v = scope.filter((a) => (db.turmas.find((t) => t.id === a.turmaId) || { disciplinas: [] }).disciplinas.includes(d)).map((a) => A.mt(a.id, d, '1º Trimestre')).filter((x) => x != null); return [db.disciplinas.find((x) => x.id === d).nome, v.length ? A.sum(v, (x) => x) / v.length : 0, v.length ? (v.filter((x) => x >= 10).length / v.length) * 100 : 0]; });
    } else {
      const keys = A.uniq(scope.map((a) => a[by])).sort((x, y) => String(x).localeCompare(String(y), 'pt', { numeric: true }));
      groups = keys.map((k) => { const v = withM.filter((x) => x.a[by] === k); return [k, v.length ? A.sum(v, (x) => x.s.media) / v.length : 0, v.length ? (v.filter((x) => x.s.negativas <= 2 && x.s.media >= 10).length / v.length) * 100 : 0]; });
    }
    const tone = (v) => (v < 10 ? 'bad' : v < 12 ? 'warn' : 'ok');
    el.innerHTML = `<div class="kpis">${A.kpi('Média geral', A.f1(avg), '1º Trimestre (provisório)', '', 'chart')}${A.kpi('Taxa de aproveitamento', A.pct(apr), 'alunos com ≤ 2 negativas', apr >= 75 ? 'ok' : 'warn', 'trend')}${A.kpi('Alunos em risco', risk.length, `de ${scope.length} alunos`, risk.length ? 'bad' : 'ok', 'alert')}${A.kpi('Reprovação prevista', A.pct(100 - apr), '', '', 'trendDown')}</div>
      <div class="grid2">${A.section(`Média por ${by === 'disciplina' ? 'disciplina' : by}`, A.bars(groups.map(([l, v]) => [l, Math.round(v * 10) / 10, tone(v)]), { max: 20 }))}${A.section(`Aproveitamento por ${by === 'disciplina' ? 'disciplina' : by}`, A.bars(groups.map(([l, , p]) => [l, Math.round(p), p < 60 ? 'bad' : p < 75 ? 'warn' : 'ok']), { max: 100, suffix: '%' }))}
      ${cfg.noRisk ? '' : A.section('Alunos em risco', `<div data-risk></div>`, '', 'span2')}</div>`;
    const h = el.querySelector('[data-risk]');
    if (h) A.dataTable(h, { rows: risk.map((x) => ({ processo: x.a.processo, nome: x.a.nome, turma: x.a.turma, media: x.s.media, negativas: x.s.negativas, faltas: x.s.injust })), cols: [{ k: 'processo', l: 'Nº processo' }, { k: 'nome', l: 'Aluno' }, { k: 'turma', l: 'Turma' }, { k: 'media', l: 'Média', t: 'num', render: (r) => `<b class="g ${A.gtone(r.media)}">${A.f1(r.media)}</b>` }, { k: 'negativas', l: 'Negativas', t: 'num' }, { k: 'faltas', l: 'Faltas injust.', t: 'num' }], filters: ['q', 'turma'], sort: 'media', pageSize: 8, exportName: 'alunos-em-risco', empty: 'Sem alunos em risco.' });
  };

  /* ================= Perfil ================= */
  V.profile = function (el, cfg, ctx) {
    const db = ctx.db; const u = ctx.user;
    db.preferencias[ctx.role.id] = db.preferencias[ctx.role.id] || { tema: A.theme(), idioma: 'Português', email: true, sms: true, push: true, resumo: false };
    const pf = db.preferencias[ctx.role.id];
    const part = cfg.part || 'all';
    const PF = [{ k: 'tema', l: 'Aparência', o: ['Claro', 'Escuro', 'Sistema'], req: 1 }, { k: 'idioma', l: 'Idioma', o: ['Português'], req: 1 }, { k: 'email', l: 'Notificações por email', t: 'bool', hint: 'Avisos, aprovações e alertas' }, { k: 'sms', l: 'Notificações por SMS', t: 'bool', hint: 'Apenas alertas urgentes' }, { k: 'push', l: 'Notificações no portal', t: 'bool', hint: 'Centro de notificações' }, { k: 'resumo', l: 'Resumo semanal', t: 'bool', hint: 'Enviado à segunda-feira' }];
    const prefFields = part === 'notif' ? PF.slice(2) : part === 'aparencia' ? PF.slice(0, 2) : PF;
    el.innerHTML = `<div class="stack">
      ${['all', 'dados', 'conta'].includes(part) ? A.section('Dados pessoais', `<div class="prof-head"><div class="avatar lg">${A.initials(u.nome)}</div><div><h3>${esc(u.nome)}</h3><p class="muted">${esc(ctx.role.nome)} · ${esc(db.escola.nome)}</p></div></div>${A.formHtml([{ k: 'nome', l: 'Nome', ro: 1 }, { k: 'email', l: 'Email', t: 'email' }, { k: 'telefone', l: 'Telefone' }, { k: 'morada', l: 'Morada', ro: !cfg.editAddr }], u)}<div class="form-actions"><button class="btn primary" data-sd>Guardar dados</button></div>`) : ''}
      ${['all', 'senha', 'conta'].includes(part) ? A.section('Palavra-passe', `<p class="muted mb">Mínimo de ${db.seguranca.minimo} caracteres, com letras e números. A palavra-passe expira a cada ${db.seguranca.expiracao} dias.</p>${A.formHtml([{ k: 'atual', l: 'Palavra-passe atual', t: 'password', req: 1 }, { k: 'nova', l: 'Nova palavra-passe', t: 'password', req: 1 }, { k: 'conf', l: 'Confirmar nova palavra-passe', t: 'password', req: 1 }])}<div class="form-actions"><button class="btn primary" data-sp>Alterar palavra-passe</button></div>`) : ''}
      ${['all', 'pref', 'notif', 'aparencia'].includes(part) ? A.section(part === 'notif' ? 'Notificações' : part === 'aparencia' ? 'Preferências' : 'Preferências e notificações', `${A.formHtml(prefFields, pf)}<div class="form-actions"><button class="btn primary" data-spf>Guardar preferências</button></div>`) : ''}
      ${part === 'sessoes' ? A.section('Sessões ativas', A.list([{ icon: 'globe', t: 'Este dispositivo — sessão atual', m: `${navigator.userAgent.includes('Mobile') ? 'Telemóvel' : 'Computador'} · iniciada ${A.date(A.now())}`, r: A.badge('Ativa') }, { icon: 'globe', t: 'Chrome · Android', m: 'Luanda · 27/10/2026 19:42', r: '<button class="btn xs ghost" data-end>Terminar</button>' }])) : ''}</div>`;
    const sd = el.querySelector('[data-sd]');
    if (sd) sd.onclick = () => { const v = A.readForm(el, [{ k: 'email' }, { k: 'telefone' }, ...(cfg.editAddr ? [{ k: 'morada' }] : [])]); Object.assign(u, v); if (cfg.onSave) cfg.onSave(v, ctx); ctx.log('Conta', 'Atualização de dados pessoais', u.nome); ctx.save(); A.toast('Dados atualizados.'); };
    const sp = el.querySelector('[data-sp]');
    if (sp) sp.onclick = () => {
      const f = [{ k: 'atual', req: 1 }, { k: 'nova', req: 1 }, { k: 'conf', req: 1 }];
      const v = A.readForm(el, f); if (!v) return;
      if (v.nova.length < db.seguranca.minimo || !/\d/.test(v.nova) || !/[a-z]/i.test(v.nova)) return A.toast(`A nova palavra-passe deve ter pelo menos ${db.seguranca.minimo} caracteres, letras e números.`, 'bad');
      if (v.nova !== v.conf) return A.toast('A confirmação não coincide.', 'bad');
      ctx.log('Conta', 'Alteração de palavra-passe', u.nome); ctx.save(); el.querySelectorAll('input[type=password]').forEach((i) => { i.value = ''; }); A.toast('Palavra-passe alterada com sucesso.');
    };
    const spf = el.querySelector('[data-spf]');
    if (spf) spf.onclick = () => { const v = A.readForm(el, prefFields); Object.assign(pf, v); if (v.tema) A.setTheme(v.tema); ctx.save(); A.toast('Preferências guardadas.'); };
    const en = el.querySelector('[data-end]'); if (en) en.onclick = () => { en.closest('li').remove(); A.toast('Sessão terminada.'); };
  };

  /* ================= Portal: notas do aluno ================= */
  V.myGrades = function (el, cfg, ctx) {
    const db = ctx.db; const a = ctx.student;
    const t = db.turmas.find((x) => x.id === a.turmaId);
    const st = { p: '1º Trimestre' };
    const draw = () => {
      const rows = t.disciplinas.map((d) => { const p = db.pautas.find((x) => x.turmaId === t.id && x.discId === d && x.periodo === st.p); return { d, nome: db.disciplinas.find((x) => x.id === d).nome, g: COMPS.map((c) => A.grade(a.id, d, st.p, c)), mt: A.mt(a.id, d, st.p), pub: p && p.estado === 'Aprovada' }; });
      const v = rows.map((r) => r.mt).filter((x) => x != null);
      const m = v.length ? A.sum(v, (x) => x) / v.length : null;
      el.innerHTML = `<div class="toolbar"><div class="seg">${A.PERIODS.map((p) => `<button class="${p === st.p ? 'on' : ''}" data-p="${p}">${p.replace(' Trimestre', 'º T').replace('ºº', 'º')}</button>`).join('')}</div></div>
        <div class="kpis mini">${A.kpi('Média do período', A.f1(m), '', m != null && m < 10 ? 'bad' : 'ok')}${A.kpi('Disciplinas positivas', v.filter((x) => x >= 10).length + ' / ' + rows.length)}${A.kpi('Negativas', v.filter((x) => x < 10).length, '', v.some((x) => x < 10) ? 'bad' : 'ok')}</div>
        ${v.length ? `<div class="card"><ul class="grades-m">${rows.map((r) => `<li><div><b>${esc(r.nome)}</b><small>${COMPS.map((c, i) => `${c} ${r.g[i] ?? '—'}`).join(' · ')}</small></div><div class="r"><b class="g big ${A.gtone(r.mt)}">${r.mt ?? '—'}</b>${r.pub ? '<small class="ok">Publicada</small>' : '<small class="muted">Provisória</small>'}</div></li>`).join('')}</ul></div>
        <p class="muted mt">As notas provisórias podem ser alteradas até à aprovação da pauta pela direção pedagógica.</p>` : `<div class="card"><div class="empty">${A.icon('clock')}<p>Ainda não existem classificações para o ${st.p}.</p></div></div>`}`;
      el.querySelectorAll('[data-p]').forEach((b) => { b.onclick = () => { st.p = b.dataset.p; draw(); }; });
    };
    draw();
  };
  V.boletins = function (el, cfg, ctx) {
    const a = ctx.student;
    const list = [['Boletim — 3º Trimestre 2025/2026', '2026-07-10', 'Final'], ['Boletim — 2º Trimestre 2025/2026', '2026-04-08', ''], ['Boletim — 1º Trimestre 2025/2026', '2025-12-17', '']];
    el.innerHTML = `<div class="note">${A.icon('info')}<div>O boletim do 1º Trimestre de 2026/2027 será publicado após a aprovação das pautas (previsão: ${A.date('2026-12-15')}).</div></div>
      <div class="card"><ul class="feed">${list.map(([t, d, f], i) => `<li>${A.icon('file')}<div><p>${t}</p><small>Publicado em ${A.date(d)}${f ? ' · Classificação final' : ''}</small></div><span class="fr"><button class="btn xs" data-b="${i}">${A.icon('download')}Descarregar</button></span></li>`).join('')}</ul></div>`;
    el.querySelectorAll('[data-b]').forEach((b) => { b.onclick = () => A.print('Boletim', A.docs.boletim(a, A.PERIODS[2 - +b.dataset.b], '2025/2026')); });
  };
  V.myFinance = function (el, cfg, ctx) {
    const db = ctx.db; const a = ctx.student;
    const ch = db.cobrancas.filter((c) => c.alunoId === a.id);
    const pg = db.pagamentos.filter((p) => p.alunoId === a.id && p.estado !== 'Anulado');
    const div = A.sum(ch.filter((c) => c.estado !== 'Pago'), 'divida');
    const venc = A.sum(ch.filter((c) => c.estado === 'Vencido' || (c.estado === 'Parcial' && c.vencimento < A.TODAY)), 'divida');
    const part = cfg.part || 'all';
    el.innerHTML = `<div class="kpis mini">${A.kpi('Em aberto', A.money(div), '', div ? 'warn' : 'ok')}${A.kpi('Vencido', A.money(venc), venc ? 'Regularize para evitar penalizações' : 'Sem valores vencidos', venc ? 'bad' : 'ok')}${A.kpi('Pago este ano', A.money(A.sum(pg, 'valor')), '', 'ok')}</div>
      ${part !== 'recibos' ? A.section(part === 'dividas' ? 'Dívidas e valores em aberto' : 'Propinas e cobranças', `<ul class="feed">${ch.filter((c) => part !== 'dividas' || c.estado !== 'Pago').map((c) => `<li><i class="dot ${A.tone(c.estado)}"></i><div><p>${esc(c.descricao)}</p><small>Vence a ${A.date(c.vencimento)}${c.estado === 'Parcial' ? ` · pago ${A.money(c.pago)}` : ''}</small></div><span class="fr"><b>${A.money(c.estado === 'Pago' ? c.valor : c.divida)}</b> ${A.badge(c.estado)}</span></li>`).join('') || '<li><div><p class="muted">Sem valores em aberto.</p></div></li>'}</ul>${div && !cfg.noRef ? `<div class="note mt">${A.icon('info')}<div>${A.modActive('pagdigitais') ? 'Pague por referência: Entidade 01234 · Referência ' + a.processo + '0' : 'Pagamentos na tesouraria da escola (numerário, TPA) ou por transferência para BAI AO06 0040 0000 4571 2201 1018 3, indicando o n.º de processo ' + a.processo + '.'}</div></div>` : ''}`) : ''}
      ${part === 'all' || part === 'recibos' || part === 'pagamentos' ? A.section('Recibos', `<ul class="feed">${pg.map((p) => `<li>${A.icon('file')}<div><p>${p.recibo} — ${esc(p.descricao)}</p><small>${A.date(p.data)} · ${p.metodo} · ${A.money(p.valor)}</small></div><span class="fr"><button class="btn xs ghost" data-r="${p.id}">${A.icon('download')}</button></span></li>`).join('') || '<li><div><p class="muted">Sem recibos.</p></div></li>'}</ul>`) : ''}`;
    el.querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => A.print('Recibo', A.docs.recibo([db.pagamentos.find((p) => p.id === b.dataset.r)])); });
  };

  /* ================= Documentos impressos ================= */
  const head = (db, title, sub) => `<div class="doc-h"><div class="logo-doc">${A.logo(36)}</div><div><b>${esc(db.escola.nome)}</b><small>${esc(db.escola.endereco)}, ${esc(db.escola.bairro)} — ${esc(db.escola.cidade)} · NIF ${db.escola.nif}</small><small>${esc(db.escola.decreto)} · ${esc(db.escola.telefone)} · ${esc(db.escola.email)}</small></div></div><h2 class="doc-t">${esc(title)}</h2>${sub ? `<p class="doc-s">${sub}</p>` : ''}`;
  const sign = (names) => `<div class="signs">${names.map(([n, c]) => `<div><i></i><b>${esc(n)}</b><small>${esc(c)}</small></div>`).join('')}</div>`;
  A.docs = {
    boletim(a, periodo, ano) {
      const db = A.db; const t = db.turmas.find((x) => x.id === a.turmaId);
      const per = ano ? '1º Trimestre' : periodo;
      const st = A.stats(a, per);
      return `<div class="doc">${head(db, 'Boletim de Avaliação', `${esc(periodo)} · Ano letivo ${ano || A.YEAR}`)}
        ${A.kv({ Aluno: esc(a.nome), 'N.º processo': a.processo, Turma: esc(a.turma), Classe: esc(a.classe), Curso: esc(a.curso), 'N.º': a.numero })}
        <table class="tbl doc-tbl"><thead><tr><th>Disciplina</th>${COMPS.map((c) => `<th class="c">${c}</th>`).join('')}<th class="c">MT</th></tr></thead><tbody>${t.disciplinas.map((d) => `<tr><td>${esc(db.disciplinas.find((x) => x.id === d).nome)}</td>${COMPS.map((c) => `<td class="c">${A.grade(a.id, d, per, c) ?? '—'}</td>`).join('')}<td class="c"><b>${A.mt(a.id, d, per) ?? '—'}</b></td></tr>`).join('')}</tbody></table>
        ${A.kv({ 'Média': A.f1(st.media), Faltas: `${st.faltas} (${st.injust} injustificadas)`, Atrasos: st.atrasos, Observação: st.media == null ? '—' : st.negativas > 2 ? 'Aproveitamento insuficiente' : 'Aproveitamento satisfatório' })}
        ${sign([[t.dt, 'Diretor(a) de turma'], ['Dra. Teresa Neto', 'Diretora pedagógica']])}</div>`;
    },
    declaracao(a, tipo, fin) {
      const db = A.db;
      const txt = tipo.includes('matrícula') ? `se encontra matriculado(a) neste estabelecimento de ensino no ano letivo ${A.YEAR}, na ${esc(a.classe)}, turma ${esc(a.turma)}, turno da ${esc(a.turno.toLowerCase())}, curso de ${esc(a.curso)}, sob o processo n.º ${a.processo}`
        : tipo.includes('conclusão') ? `concluiu com aproveitamento a ${esc(a.classe)} no ano letivo 2025/2026, no curso de ${esc(a.curso)}`
          : `frequenta regularmente a ${esc(a.classe)}, turma ${esc(a.turma)}, no ano letivo ${A.YEAR}, sob o processo n.º ${a.processo}`;
      return `<div class="doc">${head(db, tipo.replace(' (modelo inativo)', ''), '')}<p class="doc-p">Para os devidos efeitos, declara-se que <b>${esc(a.nome)}</b>, nascido(a) a ${A.date(a.nascimento)}, portador(a) do BI n.º ${a.bi}, ${txt}.</p>${fin ? `<p class="doc-p">A presente declaração destina-se a ${esc(fin)}.</p>` : ''}<p class="doc-p">Por ser verdade e me ter sido solicitada, passa-se a presente declaração, que vai assinada e autenticada com o carimbo em uso nesta instituição.</p><p class="doc-p r">${esc(db.escola.cidade)}, ${+A.TODAY.slice(8)} de ${A.MONTHS[+A.TODAY.slice(5, 7) - 1].toLowerCase()} de ${A.TODAY.slice(0, 4)}</p>${sign([['Helena Bastos', 'Secretária escolar'], [db.escola.diretor, 'Diretor-geral']])}</div>`;
    },
    certificado(p) {
      const db = A.db; const a = db.alunos.find((x) => x.id === p.alunoId);
      return `<div class="doc">${head(db, p.tipo, `${esc(p.classes)}`)}<p class="doc-p">${esc(db.escola.diretor)}, Diretor-geral do ${esc(db.escola.nome)}, certifica que <b>${esc(a.nome)}</b>, filho(a) de ${esc(a.encarregado)}, nascido(a) a ${A.date(a.nascimento)}, portador(a) do BI n.º ${a.bi}, concluiu a ${esc(p.classes)} no curso de ${esc(a.curso)}, com as seguintes classificações finais:</p>
        <table class="tbl doc-tbl"><thead><tr><th>Disciplina</th><th class="c">Classificação</th></tr></thead><tbody>${db.turmas.find((t) => t.id === a.turmaId).disciplinas.map((d) => `<tr><td>${esc(db.disciplinas.find((x) => x.id === d).nome)}</td><td class="c">${Math.max(10, A.mt(a.id, d, '1º Trimestre') || 10)} valores</td></tr>`).join('')}</tbody></table>
        <p class="doc-p">Certificado n.º ${esc(p.id)}/${A.TODAY.slice(0, 4)}. ${esc(db.escola.cidade)}, ${A.date(A.TODAY)}.</p>${sign([['Helena Bastos', 'Secretária escolar'], [db.escola.diretor, 'Diretor-geral']])}</div>`;
    },
    recibo(recs) {
      const db = A.db; const p = recs[0];
      return `<div class="doc">${head(db, `Recibo ${recs.length > 1 ? recs.map((r) => r.recibo).join(', ') : p.recibo}`, `Emitido a ${A.date(p.data)} ${p.hora || ''}`)}${A.kv({ Aluno: esc(p.aluno), 'N.º processo': p.processo, Turma: esc(p.turma), 'Método': p.metodo, Operador: esc(p.operador) })}
        <table class="tbl doc-tbl"><thead><tr><th>Descrição</th><th class="r">Valor</th></tr></thead><tbody>${recs.map((r) => `<tr><td>${esc(r.descricao)}</td><td class="r">${A.money(r.valor)}</td></tr>`).join('')}<tr><td><b>Total</b></td><td class="r"><b>${A.money(A.sum(recs, 'valor'))}</b></td></tr></tbody></table>
        <p class="doc-p muted">Documento processado por computador. ${p.estado === 'Anulado' ? '<b>RECIBO ANULADO</b>' : ''}</p>${sign([[p.operador, 'Tesouraria']])}</div>`;
    },
    cartao(a) {
      const db = A.db;
      return `<div class="sid"><div class="sid-h">${A.logo(22)}<b>${esc(db.escola.nome)}</b><small>Cartão de estudante · ${A.YEAR}</small></div><div class="sid-b"><div class="sid-photo">${A.initials(a.nome)}</div><div><b>${esc(a.nome)}</b><small>Processo ${a.processo}</small><small>${esc(a.turma)} · ${esc(a.turno)}</small><small>${esc(a.curso)}</small><small>Válido até 30/07/2027</small></div></div><div class="sid-bar">${Array.from({ length: 38 }, (_, i) => `<i style="width:${1 + Math.round(A.hash(a.processo + i) * 3)}px"></i>`).join('')}</div></div>`;
    },
    pauta(p) {
      const db = A.db; const al = db.alunos.filter((a) => a.turmaId === p.turmaId && a.estado === 'Ativa');
      return `<div class="doc">${head(db, `Pauta — ${p.periodo}`, `${esc(p.turma)} · ${esc(p.disciplina)} · ${esc(p.professor)} · Estado: ${esc(p.estado)}`)}<table class="tbl doc-tbl"><thead><tr><th>N.º</th><th>Aluno</th>${COMPS.map((c) => `<th class="c">${c}</th>`).join('')}<th class="c">MT</th></tr></thead><tbody>${al.map((a) => `<tr><td>${a.numero}</td><td>${esc(a.nome)}</td>${COMPS.map((c) => `<td class="c">${A.grade(a.id, p.discId, p.periodo, c) ?? '—'}</td>`).join('')}<td class="c"><b>${A.mt(a.id, p.discId, p.periodo) ?? '—'}</b></td></tr>`).join('')}</tbody></table>${sign([[p.professor, 'Professor(a)'], ['Dra. Teresa Neto', 'Diretora pedagógica']])}</div>`;
    }
  };
  A.preview = (title, html) => A.modal({ title: `Pré-visualização — ${title}`, size: 'lg', body: `<div class="paper">${html}</div>`, actions: [{ l: 'Fechar' }, { l: 'Imprimir', cls: 'primary', icon: 'printer', fn: () => { A.print(title, html); return false; } }] });
  A.print = function (title, html) {
    let root = document.getElementById('print-root');
    if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
    root.innerHTML = html;
    const t = document.title; document.title = title;
    document.body.classList.add('printing');
    setTimeout(() => { window.print(); document.body.classList.remove('printing'); document.title = t; }, 60);
  };
})();
