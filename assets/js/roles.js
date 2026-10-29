/* Acura Escolar — perfis, abas principais e subabas de cada painel */
(function () {
  const A = (window.App = window.App || {});
  const esc = A.esc;

  /* ---------- Construtores ---------- */
  const tab = (id, l, ic, subs, o = {}) => ({ id, l, ic, subs, ...o });
  const T = (ds, o = {}) => ({ v: 'table', ds, ...o });
  const H = (render, bind) => ({ v: 'html', render, bind });
  const D = (kpis, blocks) => ({ v: 'dash', kpis, blocks });
  const AL = (items, title) => ({ v: 'alerts', items, title });
  const R = (items) => ({ v: 'reports', items });
  const need = (mod, cfg) => ({ ...cfg, requires: mod });
  const PROFILE = (subs) => tab('perfil', 'Meu perfil', 'user', subs || [['Conta', { v: 'profile', part: 'dados' }], ['Palavra-passe', { v: 'profile', part: 'senha' }], ['Preferências', { v: 'profile', part: 'pref' }]]);
  const PROFILE_N = () => tab('perfil', 'Meu perfil', 'user', [['Conta', { v: 'profile', part: 'dados' }], ['Palavra-passe', { v: 'profile', part: 'senha' }], ['Notificações', { v: 'profile', part: 'pref' }]]);

  /* ---------- Consultas comuns ---------- */
  const Q = (A.Q = {
    ativos: (db) => db.alunos.filter((a) => a.estado === 'Ativa'),
    rec: (db, pref) => A.sum(db.pagamentos.filter((p) => p.estado !== 'Anulado' && p.data.startsWith(pref)), 'valor'),
    vencidas: (db) => db.cobrancas.filter((c) => c.estado === 'Vencido' || (c.estado === 'Parcial' && c.vencimento < A.TODAY)),
    divVenc: (db) => A.sum(Q.vencidas(db), 'divida'),
    dtTurmas: (ctx) => ctx.db.turmas.filter((t) => t.dtId === ctx.prof.id),
    profPairs: (ctx) => ctx.db.distribuicao.filter((d) => d.profId === ctx.prof.id),
    profTurmas: (ctx) => { const ids = A.uniq(Q.profPairs(ctx).map((d) => d.turmaId)); return ctx.db.turmas.filter((t) => ids.includes(t.id)); },
    inT: (ts) => { const ids = ts.map((t) => t.id); return (r) => ids.includes(r.turmaId); },
    stu: (ctx) => ctx.student,
    pendAp: (db, destino, tipo) => db.aprovacoes.filter((a) => a.estado === 'Pendente' && (!destino || a.destino === destino) && (!tipo || a.tipo === tipo))
  });
  const pctOf = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const monthBars = (db) => [['Jul', '2026-07'], ['Ago', '2026-08'], ['Set', '2026-09'], ['Out', '2026-10']].map(([l, m]) => [l, Q.rec(db, m), m === '2026-10' ? '' : 'soft']);
  const byKey = (rows, k, sumK) => { const g = {}; rows.forEach((r) => { g[r[k]] = (g[r[k]] || 0) + (sumK ? r[sumK] : 1); }); return Object.entries(g).sort((a, b) => b[1] - a[1]); };
  const go = (path, label = 'Abrir') => `<button class="btn xs ghost" data-go="${path}">${label}</button>`;
  const auditFeed = (rows, n = 7) => A.list(rows.slice(0, n).map((l) => ({ tone: l.critico === 'Sim' ? 'warn' : 'muted', t: `${l.acao} — ${l.detalhe}`, m: `${l.utilizador} · ${A.date(l.data)}` })));
  const approvalsFeed = (rows) => A.list(rows.slice(0, 6).map((a) => ({ tone: 'warn', t: a.titulo, m: `${a.tipo} · ${a.responsavel} · ${A.date(a.data)}` })), 'Sem pedidos pendentes.');
  const lockView = (msg) => H(() => `<div class="card"><div class="empty">${A.icon('lock')}<h4>Funcionalidade indisponível</h4><p>${msg}</p></div></div>`);
  const today = () => new Date(A.TODAY + 'T12:00:00').getDay() - 1;

  /* ---------- Ficha do aluno (respeita restrições de acesso) ---------- */
  A.ficha = function (ctx, a) {
    const db = ctx.db; const s = A.stats(a);
    const enc = db.encarregados.find((e) => e.id === a.encId) || {};
    const disc = ctx.can('disciplina') ? db.disciplinares.filter((p) => p.alunoId === a.id) : null;
    const body = `<div class="prof-head"><div class="avatar lg">${A.initials(a.nome)}</div><div><h3>${esc(a.nome)}</h3><p class="muted">Processo ${a.processo} · ${esc(a.turma)} · ${esc(a.curso)}</p></div>${A.badge(a.estado)}</div>
      <div class="kpis mini">${A.kpi('Média (1º T)', A.f1(s.media), '', s.media != null && s.media < 10 ? 'bad' : '')}${A.kpi('Negativas', s.negativas)}${A.kpi('Faltas', s.faltas, `${s.injust} injustificadas`)}${ctx.can('fin') ? A.kpi('Dívida vencida', A.money(A.debt(a.id)), '', A.debt(a.id) ? 'bad' : 'ok') : ''}</div>
      ${A.kv({ 'Data de nascimento': A.date(a.nascimento), Sexo: a.sexo, 'Nº BI': a.bi, Classe: esc(a.classe), Turno: a.turno, 'Ano letivo': a.ano, 'Data de matrícula': A.date(a.dataMatricula), Benefício: esc(a.bolsa), Encarregado: `${esc(enc.nome || a.encarregado)} (${esc(enc.parentesco || '')})`, Contacto: esc(a.telefone), Morada: esc(a.morada) })}
      ${disc ? `<h4 class="mt">Processos disciplinares <span class="badge muted">acesso restrito</span></h4>${A.list(disc.map((p) => ({ tone: A.tone(p.estado), t: `${p.id} — ${p.tipo}`, m: `${A.date(p.data)} · ${p.estado}` })), 'Sem processos disciplinares.')}` : ''}`;
    A.modal({ title: 'Ficha do aluno', size: 'md', body, actions: [{ l: 'Fechar' }] });
  };

  /* =====================================================================
     2. ADMINISTRADOR DA INSTITUIÇÃO
     ===================================================================== */
  const userActs = (kind) => [
    'edit',
    kind !== 'reset' && { l: 'Bloquear', icon: 'lock', cls: 'ghost danger', when: (r) => r.estado === 'Ativo' && r.perfilId !== 'admin', reason: 'Motivo do bloqueio', set: { estado: 'Bloqueado' }, log: 'Bloqueio de utilizador', crit: 1, done: 'Utilizador bloqueado.' },
    kind !== 'reset' && { l: 'Desbloquear', icon: 'key', when: (r) => r.estado === 'Bloqueado', check: (r, ctx) => (ctx.db.utilizadores.filter((u) => u.estado === 'Ativo').length >= ctx.db.licenca.limites.utilizadores ? 'Limite de utilizadores da licença atingido.' : null), set: { estado: 'Ativo' }, log: 'Desbloqueio de utilizador', crit: 1 },
    kind === 'reset' && { l: 'Redefinir palavra-passe', icon: 'key', confirm: (r) => `Enviar link de redefinição para <b>${esc(r.email)}</b>? As sessões ativas serão terminadas.`, log: 'Redefinição de acesso', crit: 1, done: 'Link de redefinição enviado por email.' },
    kind === 'reset' && { l: 'Repor 2FA', icon: 'shield', when: (r) => r.mfa === 'Sim', confirm: 'O utilizador terá de configurar novamente a autenticação em dois fatores.', log: 'Reposição de 2FA', crit: 1 }
  ].filter(Boolean);
  const userCheck = (ctx) => { const L = ctx.db.licenca.limites.utilizadores; const n = ctx.db.utilizadores.filter((u) => u.estado === 'Ativo').length; return n >= L ? `Limite de ${L} utilizadores ativos da licença ${ctx.db.licenca.plano} atingido. Bloqueie contas inativas ou solicite a revisão da licença ao fornecedor da plataforma.` : null; };
  const userValidate = (v, ctx, cur) => (ctx.db.utilizadores.some((u) => u.email === v.email && u !== cur) ? 'Já existe uma conta com este email.' : v.perfil === 'Administrador da instituição' && !cur ? 'Contas de administrador só podem ser criadas pelo fornecedor da plataforma.' : null);
  const userOnCreate = (r, ctx) => { const p = ctx.db.perfis.find((x) => x.nome === r.perfil); r.perfilId = p ? p.id : ''; r.estado = 'Ativo'; r.ultimoAcesso = '—'; r.criado = A.TODAY; r.id = A.uid('U'); if (p) p.utilizadores++; };
  const instForm = (title, fields) => ({ v: 'form', title, mod: 'Configurações', fields, get: (ctx) => ctx.db.escola, set: (ctx, v) => Object.assign(ctx.db.escola, v), after: () => A.renderShell() });
  const modelTab = (tipo) => T('modelos', { where: (r) => !tipo || r.tipo === tipo, create: 'Novo modelo', defaults: () => ({ tipo, formato: 'A4', atualizado: A.TODAY, estado: 'Ativo' }), actions: ['edit', { l: '', icon: 'eye', title: 'Pré-visualizar', read: 1, open: (r, ctx) => { const a = Q.ativos(ctx.db)[0]; A.preview(r.nome, r.tipo === 'Boletim' ? A.docs.boletim(a, '1º Trimestre') : r.tipo === 'Cartão' ? A.docs.cartao(a) : r.tipo === 'Certificado' ? A.docs.certificado({ id: 'MODELO', alunoId: a.id, tipo: r.nome, classes: '7ª a 9ª Classe' }) : r.tipo === 'Pauta' ? A.docs.pauta(ctx.db.pautas[0]) : r.tipo === 'Financeiro' ? A.docs.recibo([ctx.db.pagamentos[0]]) : A.docs.declaracao(a, r.nome, 'efeitos de demonstração')); } }, { l: '', icon: 'x', title: 'Desativar', when: (r) => r.estado === 'Ativo', set: { estado: 'Inativo' }, log: 'Desativação de modelo' }], onSave: (r) => { r.atualizado = A.TODAY; } });
  const integ = (cat) => T('integracoes', { where: (r) => !cat || r.categoria === cat, actions: [
    { l: 'Ligar', icon: 'plug', when: (r) => r.estado === 'Desligado', check: (r) => (r.modulo && !A.modActive(r.modulo) ? `Requer o módulo “${A.db.licenca.modulos.find((m) => m.id === r.modulo).nome}” ativo na licença.` : null), set: { estado: 'Ligado', ultima: '—' }, log: 'Ativação de integração', crit: 1 },
    { l: 'Desligar', icon: 'x', when: (r) => r.estado === 'Ligado', confirm: 'Desligar esta integração? Os envios automáticos serão suspensos.', set: { estado: 'Desligado' }, log: 'Desativação de integração', crit: 1 },
    { l: 'Testar', icon: 'refresh', when: (r) => r.estado === 'Ligado', open: (r, ctx, refresh) => { r.ultima = A.now(); ctx.save(); refresh(); A.toast(`Ligação a “${r.nome}” testada com sucesso.`); } }
  ], noDetail: 1, note: 'Integrações dependentes de módulos não contratados ou inativos não podem ser ligadas — restrição da licença.' });

  const ADMIN = {
    id: 'admin', nome: 'Administrador da instituição', short: 'Administração', mod: 'Configurações', perms: ['users'],
    user: (db) => ({ nome: 'Ana Ferreira', email: 'ana.ferreira@acura.ao', telefone: '+244 923 111 201', morada: 'Luanda' }),
    badges: { dashboard: (ctx) => ctx.db.utilizadores.filter((u) => u.estado === 'Bloqueado').length },
    tabs: [
      tab('dashboard', 'Dashboard', 'home', [
        ['Resumo da escola', D((ctx) => { const db = ctx.db; const L = db.licenca.limites; const nAl = db.alunos.filter((a) => a.estado === 'Ativa' || a.estado === 'Pendente').length; return [
          ['Alunos matriculados', A.num(nAl), `${pctOf(nAl, L.alunos)}% do limite da licença (${L.alunos})`, '', 'grad'], ['Utilizadores ativos', db.utilizadores.filter((u) => u.estado === 'Ativo').length, `limite ${L.utilizadores}`, '', 'users'],
          ['Turmas', db.turmas.length, `${db.classes.length} classes · ${db.cursos.length} cursos`, '', 'layers'], ['Módulos ativos', db.licenca.modulos.filter((m) => m.ativo).length, `licença válida até ${A.date(db.licenca.validade)}`, '', 'grid']]; },
        (ctx) => { const db = ctx.db; return [
          ['Alunos por classe', A.bars(db.classes.map((c) => [c.nome, c.alunos]))],
          ['Utilização da licença', `<div class="limits">${[['Alunos', db.alunos.filter((a) => a.estado === 'Ativa' || a.estado === 'Pendente').length, db.licenca.limites.alunos], ['Utilizadores', db.utilizadores.filter((u) => u.estado === 'Ativo').length, db.licenca.limites.utilizadores], ['Armazenamento (GB)', db.licenca.uso.armazenamento, db.licenca.limites.armazenamento], ['SMS', db.licenca.uso.sms, db.licenca.limites.sms]].map(([l, v, m]) => `<div><div class="row sb"><span>${l}</span><b>${A.num(v)} <span class="muted">/ ${A.num(m)}</span></b></div>${A.progress(v, m)}</div>`).join('')}</div>`, { go: 'licencas/2', goL: 'Ver limites' }],
          ['Atividade recente', auditFeed(db.auditoria), { go: 'auditoria/0' }],
          ['Estrutura do ano letivo', A.kv({ 'Ano letivo': db.escola.anoLetivo, 'Período em curso': '1º Trimestre (01/09 – 11/12)', 'Turnos ativos': db.turnos.filter((t) => t.estado === 'Ativo').map((t) => t.nome).join(', '), Salas: db.salas.length, Disciplinas: db.disciplinas.length, Professores: db.professores.length })]]; })],
        ['Alertas', AL((ctx) => { const db = ctx.db; const out = []; const L = db.licenca;
          const d = Math.round((new Date(L.validade) - new Date(A.TODAY)) / 864e5); out.push({ t: `Licença válida por mais ${d} dias`, m: `Plano ${L.plano} · expira a ${A.date(L.validade)}`, tone: d < 60 ? 'bad' : 'ok', go: 'licencas/3' });
          const nAl = db.alunos.filter((a) => a.estado === 'Ativa' || a.estado === 'Pendente').length; if (nAl / L.limites.alunos > 0.75) out.push({ t: `Alunos matriculados a ${pctOf(nAl, L.limites.alunos)}% do limite`, m: `${nAl} de ${L.limites.alunos}`, tone: 'warn', go: 'licencas/2' });
          db.utilizadores.filter((u) => u.ultimoAcesso < '2026-09-30').forEach((u) => out.push({ t: `Conta sem acesso há mais de 30 dias: ${u.nome}`, m: `Último acesso ${A.date(u.ultimoAcesso)}`, tone: 'warn', go: 'utilizadores/3' }));
          db.integracoes.filter((i) => i.estado === 'Desligado' && i.modulo).forEach((i) => out.push({ t: `${i.nome} indisponível`, m: i.detalhe, tone: 'muted', go: 'integracoes/2' }));
          out.push({ t: '3 tentativas de login falhadas registadas', m: 'Consulte a auditoria de sessões', tone: 'bad', go: 'auditoria/0' });
          return out; })],
        ['Atividades', T('auditoria', { cols: ['data', 'utilizador', 'modulo', 'acao', 'detalhe'], filters: ['q', 'modulo', '~data'] })],
        ['Pendências', AL((ctx) => { const db = ctx.db; return [
          ...db.utilizadores.filter((u) => u.estado === 'Bloqueado').map((u) => ({ t: `Conta bloqueada: ${u.nome}`, m: 'Rever bloqueio ou desativar definitivamente', tone: 'bad', go: 'utilizadores/3' })),
          ...db.utilizadores.filter((u) => ['admin', 'dg', 'tes', 'cont'].includes(u.perfilId) && u.mfa !== 'Sim').map((u) => ({ t: `2FA obrigatório em falta: ${u.nome}`, tone: 'warn', go: 'utilizadores/4' })),
          ...db.modelos.filter((m) => m.estado === 'Inativo').map((m) => ({ t: `Modelo inativo: ${m.nome}`, m: 'Ative ou atualize o modelo de impressão', tone: 'muted', go: 'documentos/4' })),
          { t: 'Período 2º Trimestre sem prazo de lançamento confirmado', m: 'Organização escolar › Períodos letivos', tone: 'warn', go: 'organizacao/3' }]; }, 'Pendências')]
      ]),
      tab('utilizadores', 'Utilizadores', 'users', [
        ['Lista', T('utilizadores', { filters: ['q', 'perfil', 'estado'], actions: userActs(), validate: userValidate, critEdit: 1 })],
        ['Criar conta', { v: 'form', title: 'Nova conta de utilizador', mod: 'Configurações', note: 'A conta é criada com uma palavra-passe temporária enviada por email. Contas de administrador só podem ser criadas pelo fornecedor da plataforma.', fields: [{ k: 'nome', l: 'Nome completo', req: 1 }, { k: 'email', l: 'Email institucional', t: 'email', req: 1 }, { k: 'perfil', l: 'Perfil', req: 1, o: (db) => db.perfis.filter((p) => !['admin', 'aluno', 'enc'].includes(p.id)).map((p) => p.nome) }, { k: 'telefone', l: 'Telefone' }, { k: 'mfa', l: '2FA', o: ['Sim', 'Não'], req: 1 }, { k: 'enviar', l: 'Enviar credenciais por email', t: 'bool', hint: 'Recomendado' }], get: () => ({ mfa: 'Não', enviar: true }),
          validate: (v, ctx) => userCheck(ctx) || userValidate(v, ctx), set: (ctx, v) => { const r = { nome: v.nome, email: v.email, perfil: v.perfil, mfa: v.mfa }; userOnCreate(r, ctx); ctx.db.utilizadores.unshift(r); }, logAction: 'Criação de utilizador', crit: 1, done: 'Conta criada. Credenciais enviadas por email.', after: () => A.go('utilizadores', 0) }],
        ['Editar', T('utilizadores', { filters: ['q', 'perfil'], actions: ['edit'], validate: userValidate, critEdit: 1, note: 'Selecione uma conta para editar o perfil, o email ou a obrigatoriedade de 2FA. Alterações de perfil ficam registadas na auditoria.' })],
        ['Bloquear', T('utilizadores', { filters: ['q', 'estado', 'perfil'], actions: userActs().slice(1), sort: 'estado', noteTone: 'warn', note: 'Contas bloqueadas não podem iniciar sessão. O bloqueio é imediato e termina as sessões ativas.' })],
        ['Redefinir acesso', T('utilizadores', { filters: ['q', 'perfil'], cols: ['nome', 'email', 'perfil', 'mfa', 'ultimoAcesso', 'estado'], actions: userActs('reset') })]
      ]),
      tab('perfis', 'Perfis e permissões', 'shield', [
        ['Perfis existentes', T('perfis', { filters: ['q', 'tipo'], noDetail: 0 })],
        ['Permissões por módulo', { v: 'perms' }],
        ['Perfis personalizados', T('perfis', { where: (r) => r.tipo === 'Personalizado', create: 'Novo perfil personalizado', defaults: () => ({ tipo: 'Personalizado', utilizadores: 0, estado: 'Ativo' }), onCreate: (r, ctx) => { r.id = A.uid('p'); ctx.db.permissoes[r.id] = Object.fromEntries(ctx.db.MODS.map((m) => [m, 'v'])); }, critCreate: 1, actions: ['edit', { l: 'Permissões', icon: 'shield', open: () => A.go('perfis', 1) }], note: 'Perfis personalizados herdam apenas permissões de leitura. Configure-os em “Permissões por módulo”.' })]
      ]),
      tab('estrutura', 'Estrutura académica', 'layers', [
        ['Anos letivos', T('anos', { create: 'Novo ano letivo', actions: ['edit'], defaults: () => ({ estado: 'Planeado' }) })],
        ['Classes', T('classes', { create: 'Nova classe', actions: ['edit'] })],
        ['Cursos', T('cursos', { create: 'Novo curso', actions: ['edit'] })],
        ['Disciplinas', T('disciplinas', { create: 'Nova disciplina', actions: ['edit'], filters: ['q', 'area', 'estado'] })],
        ['Turmas', T('turmas', { create: 'Nova turma', actions: ['edit'], filters: ['q', 'classe', 'turno'], defaults: () => ({ ano: A.YEAR, alunos: 0, capacidade: 30, vagas: 30, disciplinas: ['MAT', 'POR', 'ING', 'EDF'] }), onSave: (r) => { r.vagas = r.capacidade - r.alunos; }, validate: (v) => (v.capacidade && (v.capacidade < 10 || v.capacidade > 45) ? 'Capacidade fora dos limites da plataforma (10 a 45 alunos).' : null) })],
        ['Turnos', T('turnos', { create: 'Novo turno', actions: ['edit'] })]
      ]),
      tab('organizacao', 'Organização escolar', 'building', [
        ['Salas', T('salas', { create: 'Nova sala', actions: ['edit'], filters: ['q', 'tipo', 'estado'] })],
        ['Calendário', { v: 'calendar', events: (ctx) => [...ctx.db.eventos, ...ctx.db.reunioes.map((r) => ({ data: r.data, titulo: r.assunto, tipo: 'Reunião' }))] }],
        ['Horários', { v: 'timetable', mode: 'turma' }],
        ['Períodos letivos', T('periodos', { create: 'Novo período', actions: ['edit'] })]
      ]),
      tab('instituicao', 'Dados da instituição', 'globe', [
        ['Nome e logótipo', { ...instForm('Identificação', [{ k: 'nome', l: 'Nome da instituição', req: 1 }, { k: 'sigla', l: 'Sigla' }, { k: 'lema', l: 'Lema', full: 1 }]), extra: (ctx) => A.section('Logótipo', `<div class="logo-up"><div class="logo-prev">${A.logo(56)}</div><div><p>Formato PNG ou SVG, fundo transparente, mínimo 256×256 px.</p><button class="btn sm" onclick="App.toast('Carregamento de logótipo disponível na versão com servidor.','warn')">${A.icon('upload')}Carregar novo logótipo</button></div></div>`) }],
        ['Contactos', instForm('Contactos', [{ k: 'telefone', l: 'Telefone fixo' }, { k: 'telemovel', l: 'Telemóvel' }, { k: 'email', l: 'Email geral', t: 'email' }, { k: 'site', l: 'Website' }])],
        ['Endereço', instForm('Endereço', [{ k: 'endereco', l: 'Rua e número', full: 1 }, { k: 'bairro', l: 'Bairro' }, { k: 'cidade', l: 'Município / cidade' }, { k: 'provincia', l: 'Província' }, { k: 'pais', l: 'País', ro: 1 }])],
        ['Dados oficiais', { ...instForm('Dados oficiais', [{ k: 'nif', l: 'NIF', ro: 1 }, { k: 'codigo', l: 'Código do estabelecimento (MED)', ro: 1 }, { k: 'decreto', l: 'Diploma de criação', ro: 1 }, { k: 'natureza', l: 'Natureza', ro: 1 }, { k: 'niveis', l: 'Níveis de ensino', ro: 1 }, { k: 'diretor', l: 'Diretor-geral' }]), note: 'NIF, código e diploma legal estão associados à licença e só podem ser alterados pelo fornecedor da plataforma mediante documento comprovativo.' }]
      ]),
      tab('documentos', 'Documentos e modelos', 'file', [
        ['Boletins', modelTab('Boletim')], ['Certificados', modelTab('Certificado')], ['Declarações', modelTab('Declaração')],
        ['Assinaturas', T('assinaturas', { create: 'Nova assinatura', actions: ['edit', { l: 'Revogar', icon: 'x', cls: 'ghost danger', when: (r) => r.estado === 'Ativa', reason: 1, set: { estado: 'Revogada' }, log: 'Revogação de assinatura', crit: 1 }], defaults: () => ({ estado: 'Ativa', validade: '2027-08-31' }) })],
        ['Modelos de impressão', modelTab('')]
      ]),
      tab('licencas', 'Módulos e licenças', 'key', [
        ['Módulos contratados', { v: 'modules', part: 'modulos' }], ['Estado', { v: 'modules', part: 'estado' }], ['Limites', { v: 'modules', part: 'limites' }], ['Validade', { v: 'modules', part: 'validade' }]
      ]),
      tab('integracoes', 'Integrações', 'plug', [
        ['Email', { v: 'form', title: 'Servidor de email (SMTP)', mod: 'Configurações', fields: [{ k: 'host', l: 'Servidor', req: 1 }, { k: 'porta', l: 'Porta', t: 'num', req: 1 }, { k: 'seguranca', l: 'Segurança', o: ['TLS', 'SSL', 'Nenhuma'], req: 1 }, { k: 'remetente', l: 'Remetente', t: 'email' }, { k: 'user', l: 'Utilizador' }, { k: 'pass', l: 'Palavra-passe', t: 'password' }], get: (ctx) => (ctx.db.smtp = ctx.db.smtp || { host: 'smtp.acura.ao', porta: 587, seguranca: 'TLS', remetente: 'nao-responder@acura.ao', user: 'nao-responder@acura.ao', pass: '' }), set: (ctx, v) => Object.assign(ctx.db.smtp, v), crit: 1, extra: () => `<div class="row"><button class="btn sm" onclick="App.toast('Email de teste enviado para ana.ferreira@acura.ao.')">${A.icon('send')}Enviar email de teste</button></div>` }],
        ['Notificações', integ('Notificações')], ['Pagamentos', integ('Pagamentos')], ['Serviços externos', integ('Serviços externos')]
      ]),
      tab('auditoria', 'Auditoria', 'history', [
        ['Histórico de ações', T('auditoria', { filters: ['q', 'modulo', 'utilizador', 'critico', '~data'] })],
        ['Alterações autorizadas', T('auditoria', { where: (r) => r.critico === 'Sim', filters: ['q', 'modulo', 'acao', '~data'] })]
      ]),
      tab('seguranca', 'Segurança', 'lock', [
        ['Políticas de acesso', { v: 'form', title: 'Políticas de acesso', mod: 'Configurações', crit: 1, logAction: 'Alteração de política de segurança', fields: [{ k: 'minimo', l: 'Comprimento mínimo da palavra-passe', t: 'num', req: 1, hint: 'Mínimo da plataforma: 8' }, { k: 'expiracao', l: 'Expiração da palavra-passe (dias)', t: 'num', req: 1, hint: 'Máximo da plataforma: 180' }, { k: 'tentativas', l: 'Bloqueio após tentativas falhadas', t: 'num', req: 1, hint: 'Entre 3 e 10' }, { k: 'historico', l: 'Palavras-passe anteriores não reutilizáveis', t: 'num' }, { k: 'mfaAdmin', l: '2FA obrigatório para direção e administração', t: 'bool', hint: 'Obrigatório' }, { k: 'mfaFin', l: '2FA obrigatório para perfis financeiros', t: 'bool', hint: 'Tesouraria e contabilidade' }],
          get: (ctx) => ctx.db.seguranca, set: (ctx, v) => Object.assign(ctx.db.seguranca, v), validate: (v) => (v.minimo < 8 ? 'O comprimento mínimo não pode ser inferior a 8 (restrição da plataforma).' : v.expiracao > 180 ? 'A expiração não pode exceder 180 dias (restrição da plataforma).' : v.tentativas < 3 || v.tentativas > 10 ? 'O bloqueio deve ocorrer entre 3 e 10 tentativas.' : !v.mfaAdmin ? 'O 2FA para a administração é obrigatório pela plataforma.' : null),
          locked: [['Encriptação de dados em repouso e em trânsito', 'AES-256 / TLS 1.3'], ['Retenção mínima dos registos de auditoria', '5 anos'], ['Comprimento mínimo absoluto da palavra-passe', '8 caracteres'], ['Eliminação de registos de auditoria', 'Não permitida'], ['Cópias de segurança', 'Diárias, 30 dias']] }],
        ['Sessões', T('sessoes', { actions: [{ l: 'Terminar', icon: 'x', cls: 'ghost danger', when: (r) => r.estado === 'Ativa', confirm: 'Terminar esta sessão? O utilizador terá de iniciar sessão novamente.', set: { estado: 'Terminada' }, log: 'Término de sessão', crit: 1 }], tools: [{ l: 'Terminar todas', icon: 'logout', cls: 'ghost', fn: (ctx, api) => A.confirm('Terminar todas as sessões', 'Todas as sessões, exceto a sua, serão terminadas.', () => { ctx.db.sessoes.forEach((s) => { if (s.utilizador !== ctx.user.nome) s.estado = 'Terminada'; }); ctx.log('Configurações', 'Término de todas as sessões', '', 1); ctx.save(); api.refresh(); A.toast('Sessões terminadas.'); }, 'danger') }] })],
        ['Configurações disponíveis', { v: 'form', title: 'Configurações de sessão', mod: 'Configurações', crit: 1, fields: [{ k: 'sessao', l: 'Expiração por inatividade (minutos)', t: 'num', req: 1, hint: 'Entre 5 e 120' }, { k: 'horario', l: 'Restringir acessos ao horário laboral', t: 'bool', hint: '06:00–20:00 para staff' }, { k: 'ipRestrito', l: 'Restringir a administração à rede da escola', t: 'bool', hint: 'Requer IP fixo' }], get: (ctx) => ctx.db.seguranca, set: (ctx, v) => Object.assign(ctx.db.seguranca, v), validate: (v) => (v.sessao < 5 || v.sessao > 120 ? 'A expiração deve estar entre 5 e 120 minutos.' : null) }]
      ]),
      PROFILE([['Dados pessoais', { v: 'profile', part: 'dados' }], ['Palavra-passe', { v: 'profile', part: 'senha' }], ['Preferências', { v: 'profile', part: 'pref' }]])
    ]
  };

  /* =====================================================================
     3. DIRETOR-GERAL
     ===================================================================== */
  const apTipo = (tipo) => ({ v: 'approvals', tipo, filter: (a) => a.destino === 'direcao' || (a.tipo === 'Pauta') });
  const finKpis = (db) => [['Receita de outubro', A.money(Q.rec(db, '2026-10')), `Setembro: ${A.money(Q.rec(db, '2026-09'))}`, '', 'trend'], ['Dívida vencida', A.money(Q.divVenc(db)), `${A.uniq(Q.vencidas(db).map((c) => c.alunoId)).length} alunos`, 'bad', 'alert'], ['Taxa de cobrança (out.)', A.pct(pctOf(A.sum(db.cobrancas.filter((c) => c.periodo === '2026-10'), 'pago'), A.sum(db.cobrancas.filter((c) => c.periodo === '2026-10'), 'valor'))), 'propinas de outubro', '', 'pie'], ['Despesas de outubro', A.money(A.sum(db.despesas.filter((d) => d.data.startsWith('2026-10')), 'valor')), '', '', 'trendDown']];
  const DG = {
    id: 'dg', nome: 'Diretor-geral', short: 'Direção geral', mod: 'Direção', perms: ['disciplina', 'fin', 'priv', 'search'],
    user: () => ({ nome: 'Dr. Manuel Kiala', email: 'manuel.kiala@acura.ao', telefone: '+244 923 000 100', morada: 'Talatona, Luanda' }),
    badges: { aprovacoes: (ctx) => ctx.db.aprovacoes.filter((a) => a.estado === 'Pendente' && a.destino === 'direcao').length, ocorrencias: (ctx) => ctx.db.disciplinares.filter((p) => p.estado === 'Encaminhado à direção').length },
    tabs: [
      tab('dashboard', 'Dashboard executivo', 'home', [
        ['Visão geral', D((ctx) => { const db = ctx.db; const at = Q.ativos(db); const S = at.map((a) => A.stats(a)).filter((s) => s.media != null); return [
          ['Alunos ativos', A.num(at.length), `${db.alunos.filter((a) => a.estado === 'Pendente').length} matrículas pendentes`, '', 'grad'], ['Receita de outubro', A.money(Q.rec(db, '2026-10')), 'até ' + A.date(A.TODAY), 'ok', 'trend'],
          ['Dívida vencida', A.money(Q.divVenc(db)), `${A.uniq(Q.vencidas(db).map((c) => c.alunoId)).length} alunos com atraso`, 'bad', 'alert'], ['Aproveitamento', A.pct(pctOf(S.filter((s) => s.negativas <= 2 && s.media >= 10).length, S.length)), `média geral ${A.f1(A.sum(S, 'media') / S.length)} valores`, '', 'chart']]; },
        (ctx) => { const db = ctx.db; return [
          ['Receitas mensais', A.columns(monthBars(db), { money: true }), { go: 'financeiro/0' }],
          ['Aprovações pendentes', approvalsFeed(Q.pendAp(db, 'direcao')), { go: 'aprovacoes/0' }],
          ['Alunos por classe', A.bars(db.classes.map((c) => [c.nome, c.alunos]))],
          ['Alertas', A.list([{ tone: 'bad', t: `${A.uniq(Q.vencidas(db).map((c) => c.alunoId)).length} alunos com propinas vencidas`, m: A.money(Q.divVenc(db)) }, { tone: 'warn', t: `${db.disciplinares.filter((p) => p.estado === 'Encaminhado à direção').length} processos disciplinares aguardam decisão` }, { tone: 'warn', t: `${db.contratos.filter((c) => c.estado === 'A renovar').length} contratos a renovar até 30/11` }, { tone: 'info', t: `${db.pautas.filter((p) => p.estado === 'Submetida').length} pautas aguardam aprovação pedagógica` }]), { go: 'dashboard/6' }]]; })],
        ['Alunos', D((ctx) => { const db = ctx.db; const at = Q.ativos(db); return [['Alunos ativos', at.length, '', '', 'grad'], ['Feminino', at.filter((a) => a.sexo === 'F').length, A.pct(pctOf(at.filter((a) => a.sexo === 'F').length, at.length)), '', 'user'], ['Masculino', at.filter((a) => a.sexo === 'M').length, A.pct(pctOf(at.filter((a) => a.sexo === 'M').length, at.length)), '', 'user'], ['Com benefício', at.filter((a) => a.bolsa !== '—').length, 'bolsas e descontos', '', 'star']]; },
          (ctx) => { const db = ctx.db; return [['Por classe', A.bars(db.classes.map((c) => [c.nome, c.alunos]))], ['Por curso', A.bars(byKey(Q.ativos(db), 'curso'))], ['Por turno', A.donut(byKey(Q.ativos(db), 'turno').map(([l, v], i) => [l, v, ['var(--c1)', 'var(--c2)', 'var(--c3)'][i]]), Q.ativos(db).length)], ['Ocupação das turmas', A.bars(db.turmas.map((t) => [t.nome, pctOf(t.alunos, t.capacidade), t.alunos / t.capacidade > 0.9 ? 'bad' : '']), { max: 100, suffix: '%' })]]; })],
        ['Matrículas', D((ctx) => { const db = ctx.db; const g = Object.fromEntries(byKey(db.alunos, 'estado')); return [['Ativas', g.Ativa || 0, '', 'ok', 'checkCircle'], ['Pendentes', g.Pendente || 0, 'aguardam pagamento ou documentos', 'warn', 'clock'], ['Transferidas', g.Transferida || 0, '', '', 'swap'], ['Anuladas', g.Anulada || 0, '', '', 'x']]; },
          (ctx) => { const db = ctx.db; const wk = {}; db.alunos.forEach((a) => { const k = a.dataMatricula.slice(0, 7); wk[k] = (wk[k] || 0) + 1; }); return [['Matrículas por mês', A.columns(Object.keys(wk).sort().map((k) => [A.MONTHS[+k.slice(5) - 1].slice(0, 3), wk[k]]))], ['Pré-inscrições', A.bars(byKey(db.preinscricoes, 'estado'))], ['Vagas disponíveis por turma', A.bars(db.turmas.map((t) => [t.nome, t.vagas]))], ['Transferências', A.list(db.transferencias.slice(0, 6).map((t) => ({ tone: A.tone(t.estado), t: `${t.tipo}: ${t.aluno}`, m: `${t.escola} · ${A.date(t.data)}` })))]]; })],
        ['Receitas', D((ctx) => finKpis(ctx.db), (ctx) => { const db = ctx.db; return [['Receitas mensais', A.columns(monthBars(db), { money: true })], ['Por método de pagamento', A.bars(byKey(db.pagamentos.filter((p) => p.data.startsWith('2026-10')), 'metodo', 'valor'), { money: true })], ['Por tipo de cobrança', A.bars(byKey(db.cobrancas, 'tipo', 'pago'), { money: true })], ['Receita por classe (out.)', A.bars(db.classes.map((c) => [c.nome, A.sum(db.pagamentos.filter((p) => p.data.startsWith('2026-10') && (db.alunos.find((a) => a.id === p.alunoId) || {}).classe === c.nome), 'valor')]), { money: true })]]; })],
        ['Dívidas', D((ctx) => finKpis(ctx.db), (ctx) => { const db = ctx.db; const v = Q.vencidas(db); return [['Dívida vencida por turma', A.bars(db.turmas.map((t) => [t.nome, A.sum(v.filter((c) => c.turma === t.nome), 'divida'), 'bad']), { money: true })], ['Dívida por mês de vencimento', A.bars(byKey(v, 'descricao', 'divida'), { money: true })], ['Maiores devedores', A.list(Object.entries(v.reduce((g, c) => { g[c.aluno + ' · ' + c.turma] = (g[c.aluno + ' · ' + c.turma] || 0) + c.divida; return g; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, d]) => ({ tone: 'bad', t: n, r: `<b>${A.money(d)}</b>` }))), { span: 1 }], ['Acordos de pagamento', A.list(db.acordos.map((a) => ({ tone: A.tone(a.estado), t: `${a.aluno} — ${a.prestacoes} prestações`, m: `${A.money(a.divida)} · ${a.estado}` })))]]; })],
        ['Aproveitamento', { v: 'performance', by: 'classe', noRisk: 1 }],
        ['Alertas', AL((ctx) => { const db = ctx.db; return [
          { t: `${A.uniq(Q.vencidas(db).map((c) => c.alunoId)).length} alunos com propinas vencidas`, m: `Total ${A.money(Q.divVenc(db))}`, tone: 'bad', go: 'financeiro/2' },
          ...Q.pendAp(db, 'direcao').slice(0, 4).map((a) => ({ t: `Aprovação pendente: ${a.titulo}`, m: `${a.responsavel} · ${A.date(a.data)}`, tone: 'warn', go: 'aprovacoes/0' })),
          ...db.disciplinares.filter((p) => p.estado === 'Encaminhado à direção').map((p) => ({ t: `Processo disciplinar ${p.id} aguarda decisão`, m: `${p.tipo} · ${p.turma}`, tone: 'bad', go: 'ocorrencias/0' })),
          { t: `${db.contratos.filter((c) => c.estado === 'A renovar').length} contratos de trabalho a renovar`, tone: 'warn', go: 'rh/0' },
          { t: `${db.artigos.filter((a) => a.estado !== 'Normal').length} artigos de stock abaixo do mínimo`, tone: 'muted' }]; })]
      ]),
      tab('gestao', 'Gestão escolar', 'grad', [
        ['Alunos', T('alunos', { filters: ['q', 'classe', 'turma', 'estado'], ro: 1, onRowFicha: 1 })],
        ['Professores', T('professores', { ro: 1, filters: ['q', 'contrato', 'estado'] })],
        ['Funcionários', T('funcionarios', { ro: 1, filters: ['q', 'departamento', 'tipo'] })],
        ['Turmas', T('turmas', { ro: 1, filters: ['q', 'classe', 'turno'] })],
        ['Situação das matrículas', T('alunos', { ro: 1, cols: ['processo', 'nome', 'turma', 'estado', 'dataMatricula'], filters: ['q', 'estado', 'classe', '~dataMatricula'], top: (ctx) => `<div class="kpis mini">${byKey(ctx.db.alunos, 'estado').map(([l, v]) => A.kpi(l, v)).join('')}</div>` })]
      ]),
      tab('aprovacoes', 'Aprovações', 'checkCircle', [
        ['Todas', { v: 'approvals', filter: (a) => a.destino === 'direcao' }], ['Pautas', apTipo('Pauta')], ['Certificados', apTipo('Certificado')], ['Descontos', apTipo('Desconto')], ['Anulações', apTipo('Anulação')], ['Pedidos pendentes', apTipo('Pedido')]
      ]),
      tab('pedagogica', 'Área pedagógica', 'chart', [
        ['Por classe', { v: 'performance', by: 'classe' }], ['Por curso', { v: 'performance', by: 'curso', noRisk: 1 }], ['Por turma', { v: 'performance', by: 'turma', noRisk: 1 }], ['Por disciplina', { v: 'performance', by: 'disciplina', noRisk: 1 }]
      ]),
      tab('financeiro', 'Financeiro', 'wallet', [
        ['Receitas', T('pagamentos', { ro: 1, filters: ['q', 'metodo', 'estado', '~data'], top: (ctx) => `<div class="kpis">${finKpis(ctx.db).map((k) => A.kpi(...k)).join('')}</div>`, footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}` })],
        ['Cobranças', T('cobrancas', { ro: 1, filters: ['q', 'tipo', 'estado', 'turma'], footNote: (rows) => `Em dívida: ${A.money(A.sum(rows, 'divida'))}` })],
        ['Dívidas', T('cobrancas', { ro: 1, where: (r) => r.estado === 'Vencido' || (r.estado === 'Parcial' && r.vencimento < A.TODAY), filters: ['q', 'turma', 'descricao'], footNote: (rows) => `Total vencido: ${A.money(A.sum(rows, 'divida'))}` })],
        ['Despesas', T('despesas', { ro: 1, filters: ['q', 'categoria', 'estado', '~data'], footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}` })],
        ['Fechos autorizados', T('fechos', { actions: [{ l: 'Autorizar fecho', icon: 'check', cls: 'primary', when: (r) => r.estado === 'Em conferência', confirm: 'Autorizar o fecho do período? Após o fecho não serão possíveis lançamentos no período.', set: { estado: 'Fechado', fechadoPor: 'Dr. Manuel Kiala', data: A.TODAY }, log: 'Autorização de fecho', crit: 1 }] })]
      ]),
      tab('docs', 'Documentos oficiais', 'file', [
        ['Certificados', T('pedidosCert', { ro: 1, filters: ['q', 'tipo', 'estado'] })],
        ['Declarações', T('documentos', { ro: 1, where: (r) => r.tipo.startsWith('Declaração'), filters: ['q', 'tipo', 'estado', '~data'] })],
        ['Relatórios', R(() => [{ t: 'Documentos emitidos por tipo', ds: 'documentos', group: 'tipo', gl: 'Tipo' }, { t: 'Documentos emitidos por funcionário', ds: 'documentos', group: 'emitidoPor', gl: 'Emitido por' }, { t: 'Certificados por estado', ds: 'pedidosCert', group: 'estado', gl: 'Estado' }])],
        ['Por aprovar', { v: 'approvals', tipo: 'Certificado', filter: (a) => a.destino === 'direcao' }]
      ]),
      tab('rh', 'Recursos humanos', 'users', [
        ['Funcionários', T('funcionarios', { ro: 1, filters: ['q', 'departamento', 'tipo', 'estado'] })],
        ['Assiduidade', T('assidRH', { ro: 1, filters: ['q', 'registo', 'departamento', '~data'] })],
        ['Indicadores', D((ctx) => { const db = ctx.db; const f = db.funcionarios; return [['Efetivo total', f.length, `${f.filter((x) => x.tipo === 'Docente').length} docentes`, '', 'users'], ['Contratos a renovar', db.contratos.filter((c) => c.estado === 'A renovar').length, '', 'warn', 'file'], ['Taxa de assiduidade', A.pct(pctOf(db.assidRH.filter((a) => a.registo !== 'Falta').length, db.assidRH.length)), 'outubro', '', 'clock'], ['Massa salarial', A.money(A.sum(db.remuneracoes, 'base') + A.sum(db.remuneracoes, 'subsidios')), 'mensal (bruto)', '', 'wallet']]; }, (ctx) => [['Por departamento', A.bars(byKey(ctx.db.funcionarios, 'departamento'))], ['Por tipo de contrato', A.bars(byKey(ctx.db.contratos, 'tipo'))]])]
      ]),
      tab('ocorrencias', 'Ocorrências', 'flag', [
        ['Processos encaminhados', T('disciplinares', { where: (r) => r.estado === 'Encaminhado à direção', note: 'Processos disciplinares — acesso restrito à direção e ao responsável disciplinar.', noteIcon: 'lock', actions: [{ l: 'Decidir', icon: 'check', cls: 'primary', open: (r, ctx, refresh) => A.modal({ title: `Decisão — ${r.id}`, size: 'sm', body: A.formHtml([{ k: 'medida', l: 'Medida aplicada', req: 1, o: ['Repreensão registada', 'Suspensão de 1 a 3 dias', 'Suspensão de 4 a 8 dias', 'Transferência de turma', 'Arquivamento'] }, { k: 'obs', l: 'Fundamentação', t: 'area', req: 1 }]), actions: [{ l: 'Cancelar' }, { l: 'Registar decisão', cls: 'primary', fn: (b) => { const v = A.readForm(b, [{ k: 'medida', req: 1 }, { k: 'obs', req: 1 }]); if (!v) return false; r.medida = v.medida; r.estado = v.medida === 'Arquivamento' ? 'Arquivado' : 'Concluído'; ctx.log('Direção', 'Decisão disciplinar', `${r.id}: ${v.medida}`, 1); ctx.save(); refresh(); A.toast('Decisão registada.'); A.refreshBadges(); } }] }) }] })],
        ['Estado', T('disciplinares', { ro: 1, filters: ['q', 'estado', 'gravidade', 'turma'], top: (ctx) => `<div class="kpis mini">${byKey(ctx.db.disciplinares, 'estado').map(([l, v]) => A.kpi(l, v)).join('')}</div>` })]
      ]),
      tab('relatorios', 'Relatórios', 'chart', [
        ['Académicos', R(() => [{ t: 'Alunos por turma', ds: 'alunos', group: 'turma', gl: 'Turma', where: (r) => r.estado === 'Ativa' }, { t: 'Estado das pautas', ds: 'pautas', group: 'estado', gl: 'Estado' }, { t: 'Faltas por turma', ds: 'faltas', group: 'turma', gl: 'Turma' }, { t: 'Médias por aluno', rows: (ctx) => Q.ativos(ctx.db).map((a) => ({ processo: a.processo, nome: a.nome, turma: a.turma, media: A.f1(A.stats(a).media) })), cols: [{ k: 'processo', l: 'Processo' }, { k: 'nome', l: 'Aluno' }, { k: 'turma', l: 'Turma' }, { k: 'media', l: 'Média' }] }])],
        ['Financeiros', R(() => [{ t: 'Receitas por mês', ds: 'pagamentos', group: (r) => r.data.slice(0, 7), gl: 'Mês', sum: 'valor' }, { t: 'Receitas por método', ds: 'pagamentos', group: 'metodo', gl: 'Método', sum: 'valor' }, { t: 'Dívida vencida por turma', ds: 'cobrancas', where: (r) => r.estado === 'Vencido', group: 'turma', gl: 'Turma', sum: 'divida' }, { t: 'Despesas por categoria', ds: 'despesas', group: 'categoria', gl: 'Categoria', sum: 'valor' }])],
        ['Administrativos', R(() => [{ t: 'Matrículas por estado', ds: 'alunos', group: 'estado', gl: 'Estado' }, { t: 'Documentos emitidos', ds: 'documentos', group: 'tipo', gl: 'Tipo' }, { t: 'Efetivo por departamento', ds: 'funcionarios', group: 'departamento', gl: 'Departamento' }, { t: 'Atendimentos por assunto', ds: 'atendimentos', group: 'assunto', gl: 'Assunto' }])],
        ['Comparativos', H((ctx) => { const db = ctx.db; return `<div class="grid2">${A.section('Receita: setembro vs. outubro', A.bars([['Setembro', Q.rec(db, '2026-09')], ['Outubro', Q.rec(db, '2026-10')]], { money: true }))}${A.section('Média por classe — 2025/26 (3º T) vs. 2026/27 (1º T)', `<div class="cmp">${db.classes.map((c) => { const now = A.sum(Q.ativos(db).filter((a) => a.classe === c.nome).map((a) => A.stats(a).media || 0), (x) => x) / Math.max(1, c.alunos); const prev = now + (A.hash(c.nome) - 0.4) * 1.6; return `<div><span>${c.nome}</span><div class="pair"><i class="soft" style="width:${prev * 5}%"></i><i style="width:${now * 5}%"></i></div><b>${A.f1(prev)} → ${A.f1(now)}</b></div>`; }).join('')}</div><p class="muted mt">Barra clara: ano anterior · barra escura: ano atual</p>`)}${A.section('Matrículas: 2025/26 vs. 2026/27', A.bars([['2025/2026', 231, 'soft'], ['2026/2027', db.alunos.filter((a) => a.estado !== 'Anulada').length]]))}${A.section('Taxa de cobrança por mês', A.bars(['2026-09', '2026-10'].map((m) => [A.MONTHS[+m.slice(5) - 1], pctOf(A.sum(db.cobrancas.filter((c) => c.periodo === m), 'pago'), A.sum(db.cobrancas.filter((c) => c.periodo === m), 'valor'))]), { max: 100, suffix: '%' }))}</div>`; })]
      ]),
      tab('comunicacao', 'Comunicação', 'message', [
        ['Circulares', T('comunicados', { where: (r) => r.tipo === 'Circular', create: 'Nova circular', actions: ['edit', { l: 'Publicar', icon: 'send', when: (r) => r.estado !== 'Publicado', set: { estado: 'Publicado' }, log: 'Publicação de comunicado' }], defaults: (ctx) => ({ tipo: 'Circular', autor: ctx.user.nome, data: A.TODAY, estado: 'Rascunho', destinatarios: 'Todos' }) })],
        ['Avisos', T('comunicados', { where: (r) => r.tipo === 'Aviso', create: 'Novo aviso', actions: ['edit', { l: 'Publicar', icon: 'send', when: (r) => r.estado !== 'Publicado', set: { estado: 'Publicado' } }], defaults: (ctx) => ({ tipo: 'Aviso', autor: ctx.user.nome, data: A.TODAY, estado: 'Rascunho', destinatarios: 'Todos' }) })],
        ['Reuniões', T('reunioes', { create: 'Agendar reunião', actions: ['edit', { l: 'Cancelar', icon: 'x', cls: 'ghost danger', when: (r) => r.estado === 'Agendada', reason: 1, set: { estado: 'Cancelada' } }], defaults: () => ({ estado: 'Agendada', confirmacao: '—' }) })],
        ['Comunicados', T('comunicados', { create: 'Novo comunicado', filters: ['q', 'tipo', 'destinatarios', 'estado'], actions: ['edit', { l: 'Publicar', icon: 'send', when: (r) => r.estado !== 'Publicado', set: { estado: 'Publicado' } }], defaults: (ctx) => ({ tipo: 'Comunicado', autor: ctx.user.nome, data: A.TODAY, estado: 'Rascunho', destinatarios: 'Todos' }) })]
      ]),
      tab('auditoria', 'Auditoria', 'history', [
        ['Operações críticas', T('auditoria', { where: (r) => r.critico === 'Sim', filters: ['q', 'modulo', '~data'] })],
        ['Alterações', T('auditoria', { where: (r) => /Edição|Correção|Alteração|Ajuste/.test(r.acao), filters: ['q', 'modulo', '~data'] })],
        ['Aprovações', T('auditoria', { where: (r) => /Aprovação|Rejeição|Devolução|Autorização/.test(r.acao), filters: ['q', 'modulo', '~data'], empty: 'Ainda não há decisões registadas nesta sessão.' })]
      ]),
      PROFILE([['Conta', { v: 'profile', part: 'conta' }], ['Notificações', { v: 'profile', part: 'notif' }], ['Preferências', { v: 'profile', part: 'aparencia' }]])
    ]
  };

  /* =====================================================================
     4. DIRETOR PEDAGÓGICO
     ===================================================================== */
  const DP = {
    id: 'dp', nome: 'Diretor pedagógico', short: 'Direção pedagógica', mod: 'Académico', perms: ['search', 'disciplina-view'],
    user: () => ({ nome: 'Dra. Teresa Neto', email: 'teresa.neto@acura.ao', telefone: '+244 923 000 200', morada: 'Alvalade, Luanda' }),
    badges: { notas: (ctx) => Q.pendAp(ctx.db, null, 'Pauta').length },
    tabs: [
      tab('dashboard', 'Dashboard pedagógico', 'home', [
        ['Visão geral', D((ctx) => { const db = ctx.db; const S = Q.ativos(db).map((a) => A.stats(a)).filter((s) => s.media != null); return [
          ['Média geral', A.f1(A.sum(S, 'media') / S.length), '1º Trimestre (provisória)', '', 'chart'], ['Aproveitamento', A.pct(pctOf(S.filter((s) => s.negativas <= 2 && s.media >= 10).length, S.length)), 'alunos com ≤ 2 negativas', 'ok', 'trend'],
          ['Pautas por aprovar', Q.pendAp(db, null, 'Pauta').length, `${db.pautas.filter((p) => p.estado === 'Rascunho').length} em rascunho`, 'warn', 'clipboard'], ['Alunos em risco', S.filter((s) => A.risk(s)).length, 'média < 10 ou ≥ 3 negativas', 'bad', 'alert']]; },
        (ctx) => { const db = ctx.db; return [
          ['Estado das pautas — 1º Trimestre', A.donut(byKey(db.pautas.filter((p) => p.periodo === '1º Trimestre'), 'estado').map(([l, v]) => [l, v, { Aprovada: 'var(--ok)', Submetida: 'var(--warn)', Rascunho: 'var(--c3)', Devolvida: 'var(--info)' }[l]]), db.pautas.length), { go: 'notas/1' }],
          ['Pautas submetidas', approvalsFeed(Q.pendAp(db, null, 'Pauta')), { go: 'notas/2' }],
          ['Média por classe', A.bars(db.classes.map((c) => { const v = Q.ativos(db).filter((a) => a.classe === c.nome).map((a) => A.stats(a).media).filter((x) => x != null); const m = A.sum(v, (x) => x) / Math.max(1, v.length); return [c.nome, Math.round(m * 10) / 10, m < 10 ? 'bad' : m < 12 ? 'warn' : 'ok']; }), { max: 20 })],
          ['Próximas avaliações', A.list(db.avaliacoes.filter((a) => a.data >= A.TODAY).slice(0, 6).map((a) => ({ tone: 'warn', t: `${a.tipo} — ${a.turma} · ${a.disciplina}`, m: `${A.date(a.data)} · ${a.professor}` }))), { go: 'avaliacoes/3' }]]; })],
        ['Aproveitamento', { v: 'performance', by: 'classe', noRisk: 1 }],
        ['Pautas pendentes', T('pautas', { where: (r) => r.estado !== 'Aprovada', filters: ['q', 'estado', 'turma', 'professor'], ro: 1, actions: [{ l: '', icon: 'eye', title: 'Ver pauta', read: 1, open: (r) => A.showPauta(r) }] })],
        ['Médias', { v: 'performance', by: 'disciplina', noRisk: 1 }],
        ['Alertas', AL((ctx) => { const db = ctx.db; return [
          ...db.pautas.filter((p) => p.estado === 'Devolvida').map((p) => ({ t: `Pauta devolvida aguarda correção: ${p.turma} · ${p.disciplina}`, m: p.professor, tone: 'warn', go: 'notas/3' })),
          { t: `Prazo de lançamento do 1º Trimestre: ${A.date('2026-12-04')}`, m: `${db.pautas.filter((p) => p.estado === 'Rascunho').length} pautas ainda em rascunho`, tone: 'warn', go: 'dashboard/2' },
          ...db.turmas.map((t) => { const al = Q.ativos(db).filter((a) => a.turmaId === t.id); const r = al.filter((a) => A.risk(A.stats(a))).length; return r / Math.max(1, al.length) > 0.25 ? { t: `${t.nome}: ${r} alunos em risco (${pctOf(r, al.length)}%)`, tone: 'bad', go: 'desempenho/2' } : null; }).filter(Boolean),
          { t: `${db.professores.filter((p) => p.estado !== 'Ativo').length} professor(es) de licença — verificar substituições`, tone: 'muted', go: 'professores/0' }]; })]
      ]),
      tab('organizacao', 'Organização pedagógica', 'layers', [
        ['Classes', T('classes', { actions: ['edit'] })], ['Cursos', T('cursos', { actions: ['edit'] })], ['Disciplinas', T('disciplinas', { create: 'Nova disciplina', actions: ['edit'] })],
        ['Turmas', T('turmas', { actions: ['edit'], filters: ['q', 'classe', 'turno'] })], ['Períodos', T('periodos', { actions: ['edit'] })]
      ]),
      tab('professores', 'Professores', 'users', [
        ['Lista', T('professores', { filters: ['q', 'contrato', 'estado'], actions: ['edit'] })],
        ['Atribuições', T('distribuicao', { filters: ['q', 'professor', 'turma'], ro: 1 })],
        ['Disciplinas', T('professores', { cols: ['nome', 'disciplinas', 'categoria'], filters: ['q'], ro: 1 })],
        ['Carga horária', H((ctx) => A.section('Tempos letivos semanais por professor', A.bars(ctx.db.professores.map((p) => [p.nome, p.carga, p.carga > 26 ? 'bad' : p.carga < 8 ? 'warn' : ''])) + '<p class="muted mt">Referência: 18 a 24 tempos semanais. A vermelho: acima de 26 tempos.</p>'))]
      ]),
      tab('distribuicao', 'Distribuição de aulas', 'grid', [
        ['Atribuir professores', T('distribuicao', { filters: ['q', 'turma', 'disciplina', 'professor'], create: 'Nova atribuição', actions: ['edit'], validate: (v, ctx, cur) => { const p = ctx.db.professores.find((x) => x.nome === v.professor); const d = ctx.db.disciplinas.find((x) => x.nome === v.disciplina); if (p && d && !p.discIds.includes(d.id)) return `${p.nome} não está habilitado(a) para ${d.nome}.`; if (ctx.db.distribuicao.some((x) => x !== cur && x.turma === v.turma && x.disciplina === v.disciplina)) return 'Esta disciplina já tem professor atribuído nesta turma.'; return null; }, onSave: (r, ctx) => { const p = ctx.db.professores.find((x) => x.nome === r.professor); if (p) r.profId = p.id; }, onCreate: (r, ctx) => { const p = ctx.db.professores.find((x) => x.nome === r.professor); const t = ctx.db.turmas.find((x) => x.nome === r.turma); const d = ctx.db.disciplinas.find((x) => x.nome === r.disciplina); Object.assign(r, { profId: p && p.id, turmaId: t && t.id, discId: d && d.id, estado: 'Atribuída' }); }, critEdit: 1 })],
        ['Turmas', H((ctx) => `<div class="cards3">${ctx.db.turmas.map((t) => `<article class="card"><div class="card-head"><h3>${esc(t.nome)}</h3><span class="muted">${t.turno}</span></div>${A.list(ctx.db.distribuicao.filter((d) => d.turmaId === t.id).map((d) => ({ t: d.disciplina, r: `<small>${esc(d.professor)}</small>` })))}</article>`).join('')}</div>`)],
        ['Disciplinas', H((ctx) => `<div class="cards3">${ctx.db.disciplinas.map((d) => { const l = ctx.db.distribuicao.filter((x) => x.discId === d.id); return `<article class="card"><div class="card-head"><h3>${esc(d.nome)}</h3><span class="muted">${l.length} turmas</span></div>${A.list(byKey(l, 'professor').map(([p, n]) => ({ t: p, r: `<small>${n} turma(s)</small>` })), 'Sem atribuições.')}</article>`; }).join('')}</div>`)]
      ]),
      tab('avaliacoes', 'Avaliações', 'clipboard', [
        ['Tipos de avaliação', T('tiposAvaliacao', { create: 'Novo tipo', actions: ['edit'] })],
        ['Critérios', T('criterios', { create: 'Novo critério', actions: ['edit', 'del'], noDetail: 1 })],
        ['Ponderações', H((ctx) => A.section('Fórmulas de cálculo', `${A.kv({ 'Média trimestral (MT)': 'MT = (MAC + NPP + NPT) / 3', 'Classificação anual (CA)': 'CA = (MT1 + MT2 + MT3) / 3', 'Classificação final em classes de exame': 'CF = CA × 0,6 + Exame × 0,4', 'Escala': '0 a 20 valores, arredondamento às unidades', 'Aprovação': 'CF ≥ 10' })}<p class="muted mt">As ponderações seguem o regulamento de avaliação em vigor. Alterações requerem aprovação do conselho pedagógico.</p>`))],
        ['Calendário', { v: 'calendar', events: (ctx) => [...ctx.db.avaliacoes.map((a) => ({ data: a.data, titulo: `${a.tipo} · ${a.turma} ${a.discId}`, tipo: 'Avaliação' })), ...ctx.db.eventos.filter((e) => ['Avaliação', 'Prazo', 'Feriado'].includes(e.tipo))] }]
      ]),
      tab('notas', 'Notas e pautas', 'book', [
        ['Lançamentos', { v: 'results' }],
        ['Pautas submetidas', T('pautas', { where: (r) => r.estado === 'Submetida', ro: 1, filters: ['q', 'turma', 'professor'], actions: [{ l: 'Ver pauta', icon: 'eye', read: 1, open: (r) => A.showPauta(r) }] })],
        ['Aprovação', { v: 'approvals', tipo: 'Pauta', filter: (a) => a.tipo === 'Pauta' }],
        ['Correções', T('pautas', { where: (r) => r.estado === 'Devolvida', ro: 1, cols: ['turma', 'disciplina', 'professor', 'periodo', 'obs', 'estado'], actions: [{ l: 'Ver pauta', icon: 'eye', read: 1, open: (r) => A.showPauta(r) }], empty: 'Não há pautas devolvidas para correção.' })]
      ]),
      tab('assiduidade', 'Assiduidade', 'clock', [
        ['Faltas', T('faltas', { where: (r) => r.tipo === 'Falta', filters: ['q', 'turma', 'disciplina', 'justificada', '~data'], ro: 1 })],
        ['Presenças', H((ctx) => { const db = ctx.db; return A.section('Taxa de presença por turma (estimada sobre os tempos letivos desde 14/09)', A.bars(db.turmas.map((t) => { const f = db.faltas.filter((x) => x.turmaId === t.id && x.tipo === 'Falta').length; const prev = t.alunos * 30 * 6.5; const p = 100 - (f / prev) * 100; return [t.nome, Math.round(p * 10) / 10, p < 97 ? 'warn' : 'ok']; }), { max: 100, suffix: '%' })); })],
        ['Atrasos', T('faltas', { where: (r) => r.tipo === 'Atraso', filters: ['q', 'turma', 'disciplina', '~data'], ro: 1 })],
        ['Por turma e disciplina', R(() => [{ t: 'Faltas por turma', ds: 'faltas', where: (r) => r.tipo === 'Falta', group: 'turma', gl: 'Turma' }, { t: 'Faltas por disciplina', ds: 'faltas', where: (r) => r.tipo === 'Falta', group: 'disciplina', gl: 'Disciplina' }, { t: 'Atrasos por turma', ds: 'faltas', where: (r) => r.tipo === 'Atraso', group: 'turma', gl: 'Turma' }, { t: 'Faltas injustificadas por aluno', ds: 'faltas', where: (r) => r.justificada === 'Não' && r.tipo === 'Falta', group: (r) => `${r.aluno} (${r.turma})`, gl: 'Aluno' }])]
      ]),
      tab('horarios', 'Horários', 'calendar', [['Turmas', { v: 'timetable', mode: 'turma' }], ['Professores', { v: 'timetable', mode: 'prof' }], ['Salas', { v: 'timetable', mode: 'sala' }]]),
      tab('desempenho', 'Desempenho escolar', 'trend', [
        ['Médias', { v: 'performance', by: 'turma', noRisk: 1 }], ['Aprovação', { v: 'performance', by: 'classe', noRisk: 1 }], ['Reprovação', { v: 'performance', by: 'curso' }],
        ['Evolução', H((ctx) => { const db = ctx.db; const rows = db.classes.map((c) => { const now = A.sum(Q.ativos(db).filter((a) => a.classe === c.nome).map((a) => A.stats(a).media || 0), (x) => x) / Math.max(1, c.alunos); return [c.nome, [now - 0.9 + A.hash(c.nome) * 0.6, now - 0.4 + A.hash(c.nome + 'b') * 0.5, now - 0.2 + A.hash(c.nome + 'c') * 0.6, now]]; }); return A.section('Evolução da média por classe (2025/26 T1–T3 → 2026/27 T1)', `<div class="evo">${rows.map(([l, v]) => `<div class="evo-r"><span>${l}</span><div class="evo-b">${v.map((x, i) => `<i class="${i === 3 ? '' : 'soft'}" style="height:${x * 5}%" title="${A.f1(x)}"></i>`).join('')}</div><b>${A.f1(v[3])}</b></div>`).join('')}</div><p class="muted mt">Barras: 1º, 2º e 3º trimestres de 2025/2026 (claras) e 1º trimestre de 2026/2027 (escura).</p>`); })]
      ]),
      tab('relatorios', 'Relatórios pedagógicos', 'chart', [
        ['Por aluno', H((ctx) => `<div class="card pad"><label class="field full"><span>Aluno</span>${A.pickAluno(ctx.db, Q.ativos(ctx.db))}</label><div class="form-actions"><button class="btn primary" data-rep>${A.icon('eye')}Gerar relatório individual</button></div></div>`, (el, ctx) => { el.querySelector('[data-rep]').onclick = () => { const a = A.resolveAluno(ctx.db, el.querySelector('[data-pick]').value); if (!a) return A.toast('Selecione um aluno.', 'warn'); A.preview(`Relatório — ${a.nome}`, A.docs.boletim(a, '1º Trimestre')); }; })],
        ['Por disciplina', { v: 'performance', by: 'disciplina', noRisk: 1 }],
        ['Por turma', { v: 'results' }],
        ['Por classe', { v: 'performance', by: 'classe', noRisk: 1 }],
        ['Por período', R(() => [{ t: 'Pautas por período e estado', ds: 'pautas', group: (r) => `${r.periodo} · ${r.estado}`, gl: 'Período / estado' }, { t: 'Avaliações realizadas por período', ds: 'avaliacoes', group: (r) => (r.data < '2026-12-12' ? '1º Trimestre' : '2º Trimestre') + ' · ' + r.estado, gl: 'Período / estado' }])]
      ]),
      tab('documentos', 'Documentos académicos', 'file', [
        ['Pautas', T('pautas', { ro: 1, filters: ['q', 'estado', 'turma', 'disciplina'], actions: [{ l: '', icon: 'printer', title: 'Imprimir', read: 1, open: (r) => A.print('Pauta', A.docs.pauta(r)) }, { l: '', icon: 'eye', title: 'Ver', read: 1, open: (r) => A.showPauta(r) }] })],
        ['Mapas de notas', { v: 'results' }],
        ['Relatórios autorizados', R(() => [{ t: 'Mapa de aproveitamento por turma', rows: (ctx) => ctx.db.turmas.map((t) => { const s = Q.ativos(ctx.db).filter((a) => a.turmaId === t.id).map((a) => A.stats(a)).filter((x) => x.media != null); return { turma: t.nome, alunos: s.length, media: A.f1(A.sum(s, 'media') / Math.max(1, s.length)), aprov: A.pct(pctOf(s.filter((x) => x.negativas <= 2).length, s.length)) }; }), cols: [{ k: 'turma', l: 'Turma' }, { k: 'alunos', l: 'Alunos' }, { k: 'media', l: 'Média' }, { k: 'aprov', l: 'Aproveitamento' }] }, { t: 'Lista de alunos em risco', rows: (ctx) => Q.ativos(ctx.db).map((a) => ({ a, s: A.stats(a) })).filter((x) => A.risk(x.s)).map((x) => ({ processo: x.a.processo, nome: x.a.nome, turma: x.a.turma, media: A.f1(x.s.media), neg: x.s.negativas })), cols: [{ k: 'processo', l: 'Processo' }, { k: 'nome', l: 'Aluno' }, { k: 'turma', l: 'Turma' }, { k: 'media', l: 'Média' }, { k: 'neg', l: 'Negativas' }] }])]
      ]),
      PROFILE_N()
    ]
  };

  /* =====================================================================
     5. DIRETOR DE TURMA
     ===================================================================== */
  const dtW = (ctx) => Q.inT(Q.dtTurmas(ctx));
  const DT = {
    id: 'dt', nome: 'Diretor de turma', short: 'Direção de turma', mod: 'Académico', perms: ['search-own'], prof: 'dtId',
    user: (db) => { const p = db.professores.find((x) => x.id === db.demo.dtId); return { nome: p.nome, email: p.email, telefone: p.telefone, morada: 'Luanda' }; },
    badges: { ocorrencias: (ctx) => ctx.db.ocorrencias.filter((o) => dtW(ctx)(o) && o.estado === 'Aberta').length },
    tabs: [
      tab('dashboard', 'Dashboard da turma', 'home', [
        ['Resumo', D((ctx) => { const db = ctx.db; const ts = Q.dtTurmas(ctx); const al = Q.ativos(db).filter(Q.inT(ts)); const S = al.map((a) => A.stats(a)); const v = S.filter((s) => s.media != null); return [
          ['Alunos', al.length, ts.map((t) => t.nome).join(' · '), '', 'users'], ['Faltas registadas', A.sum(S, 'faltas'), `${A.sum(S, 'injust')} injustificadas`, 'warn', 'clock'],
          ['Média das turmas', A.f1(A.sum(v, 'media') / Math.max(1, v.length)), '1º Trimestre (provisória)', '', 'chart'], ['Alunos em risco', S.filter((s) => A.risk(s)).length, '', 'bad', 'alert']]; },
        (ctx) => { const db = ctx.db; const ts = Q.dtTurmas(ctx); return [
          ...ts.map((t) => [`${t.nome} — média por disciplina`, A.bars(t.disciplinas.map((d) => { const v = Q.ativos(db).filter((a) => a.turmaId === t.id).map((a) => A.mt(a.id, d, '1º Trimestre')).filter((x) => x != null); const m = A.sum(v, (x) => x) / Math.max(1, v.length); return [db.disciplinas.find((x) => x.id === d).nome, Math.round(m * 10) / 10, m < 10 ? 'bad' : m < 12 ? 'warn' : 'ok']; }), { max: 20 })]),
          ['Ocorrências recentes', A.list(db.ocorrencias.filter(Q.inT(ts)).slice(0, 5).map((o) => ({ tone: A.tone(o.estado), t: `${o.aluno} — ${o.descricao}`, m: `${o.turma} · ${A.date(o.data)} · ${o.estado}` })), 'Sem ocorrências.'), { go: 'ocorrencias/0' }],
          ['Próximas reuniões', A.list(db.reunioes.filter((r) => ts.some((t) => t.id === r.turmaId) && r.data >= A.TODAY).map((r) => ({ tone: 'info', t: r.assunto, m: `${A.date(r.data)} ${r.hora} · ${r.local}` }))), { go: 'calendario/0' }]]; })],
        ['Alertas', AL((ctx) => { const db = ctx.db; const al = Q.ativos(db).filter(dtW(ctx)); return [
          ...al.map((a) => ({ a, s: A.stats(a) })).filter((x) => x.s.injust >= 4).map((x) => ({ t: `${x.a.nome} (${x.a.turma}): ${x.s.injust} faltas injustificadas`, m: 'Contactar o encarregado de educação', tone: 'bad', go: 'assiduidade/0' })),
          ...al.map((a) => ({ a, s: A.stats(a) })).filter((x) => x.s.negativas >= 3).map((x) => ({ t: `${x.a.nome} (${x.a.turma}): ${x.s.negativas} negativas`, tone: 'warn', go: 'desempenho/0' })),
          ...db.ocorrencias.filter(dtW(ctx)).filter((o) => o.estado === 'Aberta').map((o) => ({ t: `Ocorrência por tratar: ${o.aluno}`, m: o.descricao, tone: 'warn', go: 'ocorrencias/0' }))]; })]
      ]),
      tab('turmas', 'Minhas turmas', 'layers', [
        ['Lista', T('turmas', { where: (r, ctx) => r.dtId === ctx.prof.id, ro: 1, noDetail: 0 })],
        ['Detalhes', H((ctx) => `<div class="grid2">${Q.dtTurmas(ctx).map((t) => A.section(t.nome, A.kv({ Classe: t.classe, Curso: t.curso, Turno: t.turno, Sala: t.sala, Alunos: `${t.alunos} / ${t.capacidade}`, 'Ano letivo': t.ano }) + `<h4 class="mt">Conselho de turma</h4>` + A.list(ctx.db.distribuicao.filter((d) => d.turmaId === t.id).map((d) => ({ t: d.disciplina, r: `<small>${esc(d.professor)}</small>` }))))).join('')}</div>`)]
      ]),
      tab('alunos', 'Alunos', 'users', [
        ['Ficha resumida', T('alunos', { where: (r, ctx) => dtW(ctx)(r) && r.estado === 'Ativa', cols: ['processo', 'nome', 'turma', 'sexo', 'nascimento', 'estado'], filters: ['q', 'turma'], ro: 1, onRowFicha: 1 })],
        ['Contactos autorizados', T('encarregados', { rows: (ctx) => ctx.db.encarregados.filter((e) => e.ids.some((id) => { const a = ctx.db.alunos.find((x) => x.id === id); return a && dtW(ctx)(a); })), cols: ['nome', 'parentesco', 'telefone', 'email', 'educandos'], ro: 1, note: 'Apenas os contactos autorizados pelos encarregados para comunicação escolar.' })],
        ['Situação escolar', T('alunos', { rows: (ctx) => Q.ativos(ctx.db).filter(dtW(ctx)).map((a) => { const s = A.stats(a); return { ...a, media: s.media == null ? null : Math.round(s.media * 10) / 10, neg: s.negativas, fal: s.injust, sit: A.risk(s) ? 'Em risco' : 'Regular', fin: A.debt(a.id) ? 'Com dívida' : 'Regularizado' }; }), cols: ['processo', 'nome', 'turma', { k: 'media', l: 'Média', t: 'num' }, { k: 'neg', l: 'Negativas', t: 'num' }, { k: 'fal', l: 'Faltas injust.', t: 'num' }, { k: 'sit', l: 'Situação', t: 'badge' }], filters: ['q', 'turma', 'sit'], ro: 1, labels: { sit: 'Situação' }, noDetail: 1 })]
      ]),
      tab('notas', 'Notas', 'book', [['Por disciplina', { v: 'results', turmas: (ctx) => Q.dtTurmas(ctx) }], ['Por período', { v: 'results', turmas: (ctx) => Q.dtTurmas(ctx) }]]),
      tab('assiduidade', 'Assiduidade', 'clock', [
        ['Faltas', T('faltas', { where: (r, ctx) => dtW(ctx)(r) && r.tipo === 'Falta', filters: ['q', 'turma', 'disciplina', 'justificada', '~data'], ro: 1 })],
        ['Atrasos', T('faltas', { where: (r, ctx) => dtW(ctx)(r) && r.tipo === 'Atraso', filters: ['q', 'turma', 'disciplina', '~data'], ro: 1 })],
        ['Justificações', T('faltas', { where: (r, ctx) => dtW(ctx)(r) && r.tipo === 'Falta' && r.justificada !== 'Sim', cols: ['data', 'aluno', 'turma', 'disciplina', 'justificada', 'motivo'], filters: ['q', 'turma', 'justificada'], note: 'Justificações submetidas pelos encarregados aparecem como “Pendente”.', actions: [{ l: 'Aceitar', icon: 'check', cls: 'primary', when: (r) => r.justificada === 'Pendente', set: { justificada: 'Sim' }, log: 'Justificação aceite' }, { l: 'Justificar', icon: 'edit', when: (r) => r.justificada === 'Não', reason: 'Motivo da justificação', set: (r, c, reason) => ({ justificada: 'Sim', motivo: reason }), log: 'Justificação de falta' }, { l: 'Recusar', icon: 'x', cls: 'ghost danger', when: (r) => r.justificada === 'Pendente', reason: 1, set: { justificada: 'Não' } }] })]
      ]),
      tab('ocorrencias', 'Ocorrências', 'flag', [
        ['Registos', T('ocorrencias', { where: (r, ctx) => dtW(ctx)(r), filters: ['q', 'turma', 'tipo', 'estado'], create: 'Registar ocorrência', defaults: (ctx) => ({ data: A.TODAY, registadoPor: ctx.user.nome, estado: 'Aberta', comunicavel: 'Sim', turma: Q.dtTurmas(ctx)[0].nome }), onCreate: (r, ctx) => { const a = ctx.db.alunos.find((x) => x.nome === r.aluno); const t = ctx.db.turmas.find((x) => x.nome === r.turma); r.turmaId = t && t.id; r.alunoId = a && a.id; }, validate: (v, ctx) => (!Q.dtTurmas(ctx).some((t) => t.nome === v.turma) ? 'Só pode registar ocorrências das suas turmas.' : null), actions: ['edit'] })],
        ['Acompanhamento', T('ocorrencias', { where: (r, ctx) => dtW(ctx)(r) && ['Aberta', 'Em acompanhamento'].includes(r.estado), actions: [{ l: 'Acompanhar', icon: 'eye', when: (r) => r.estado === 'Aberta', set: { estado: 'Em acompanhamento' } }, { l: 'Fechar', icon: 'check', reason: 'Conclusão do acompanhamento', set: { estado: 'Fechada' } }] })],
        ['Encaminhamento', T('ocorrencias', { where: (r, ctx) => dtW(ctx)(r) && r.estado !== 'Fechada', cols: ['data', 'aluno', 'turma', 'tipo', 'descricao', 'estado'], note: 'Encaminhar cria um processo disciplinar de acesso restrito, tratado pelo responsável disciplinar.', noteIcon: 'lock', actions: [{ l: 'Encaminhar', icon: 'send', when: (r) => r.estado !== 'Encaminhada', reason: 'Fundamentação do encaminhamento', fn: (r, ctx, reason) => { r.estado = 'Encaminhada'; const a = ctx.db.alunos.find((x) => x.id === r.alunoId) || {}; ctx.db.disciplinares.unshift({ id: `PD-2026/${String(ctx.db.disciplinares.length + 1).padStart(3, '0')}`, data: A.TODAY, alunoId: r.alunoId, aluno: r.aluno, processo: a.processo, turmaId: r.turmaId, turma: r.turma, tipo: 'Indisciplina grave', descricao: `${r.descricao}. ${reason}`, intervenientes: r.aluno, medida: '—', responsavel: 'António Cristóvão', estado: 'Em instrução', gravidade: 'Grave' }); }, log: 'Encaminhamento disciplinar', done: 'Ocorrência encaminhada ao responsável disciplinar.' }] })]
      ]),
      tab('encarregados', 'Encarregados', 'user', [
        ['Contactos', T('encarregados', { rows: (ctx) => ctx.db.encarregados.filter((e) => e.ids.some((id) => { const a = ctx.db.alunos.find((x) => x.id === id); return a && dtW(ctx)(a); })), cols: ['nome', 'parentesco', 'telefone', 'email', 'educandos'], ro: 1 })],
        ['Reuniões', T('reunioes', { where: (r, ctx) => Q.dtTurmas(ctx).some((t) => t.id === r.turmaId), create: 'Convocar reunião', defaults: (ctx) => ({ estado: 'Agendada', turmaId: Q.dtTurmas(ctx)[0].id, participantes: 'Encarregados da turma', confirmacao: 'Por confirmar' }), actions: ['edit'] })],
        ['Comunicações', T('comunicados', { where: (r, ctx) => r.autor === ctx.user.nome || r.destinatarios === 'Encarregados', create: 'Nova comunicação', defaults: (ctx) => ({ tipo: 'Aviso', autor: ctx.user.nome, data: A.TODAY, estado: 'Publicado', destinatarios: 'Encarregados' }), actions: ['edit'] })]
      ]),
      tab('desempenho', 'Desempenho', 'trend', [
        ['Alunos em risco', { v: 'performance', by: 'turma', scope: (ctx) => Q.ativos(ctx.db).filter(dtW(ctx)) }],
        ['Evolução', H((ctx) => A.section('Evolução da média da turma por avaliação', `<div class="evo">${Q.dtTurmas(ctx).map((t) => { const al = Q.ativos(ctx.db).filter((a) => a.turmaId === t.id); const comp = A.COMPS.map((c) => A.sum(al.flatMap((a) => t.disciplinas.map((d) => A.grade(a.id, d, '1º Trimestre', c) || 0)), (x) => x) / Math.max(1, al.length * t.disciplinas.length)); return `<div class="evo-r"><span>${t.nome}</span><div class="evo-b">${comp.map((x, i) => `<i class="${i < 2 ? 'soft' : ''}" style="height:${x * 5}%" title="${A.COMPS[i]}: ${A.f1(x)}"></i>`).join('')}</div><b>${A.COMPS.map((c, i) => `${c} ${A.f1(comp[i])}`).join(' · ')}</b></div>`; }).join('')}</div>`))],
        ['Disciplinas críticas', { v: 'performance', by: 'disciplina', noRisk: 1, scope: (ctx) => Q.ativos(ctx.db).filter(dtW(ctx)) }]
      ]),
      tab('relatorios', 'Relatórios', 'chart', [
        ['Resumo da turma', R(() => [{ t: 'Resumo por aluno', rows: (ctx) => Q.ativos(ctx.db).filter(dtW(ctx)).map((a) => { const s = A.stats(a); return { processo: a.processo, nome: a.nome, turma: a.turma, media: A.f1(s.media), neg: s.negativas, faltas: s.faltas, atrasos: s.atrasos }; }), cols: [{ k: 'processo', l: 'Processo' }, { k: 'nome', l: 'Aluno' }, { k: 'turma', l: 'Turma' }, { k: 'media', l: 'Média' }, { k: 'neg', l: 'Negativas' }, { k: 'faltas', l: 'Faltas' }, { k: 'atrasos', l: 'Atrasos' }] }])],
        ['Faltas', R(() => [{ t: 'Faltas por aluno', ds: 'faltas', where: (r, ctx) => dtW(ctx)(r), group: (r) => `${r.aluno} (${r.turma})`, gl: 'Aluno' }, { t: 'Faltas por disciplina', ds: 'faltas', where: (r, ctx) => dtW(ctx)(r), group: 'disciplina', gl: 'Disciplina' }])],
        ['Aproveitamento', R(() => [{ t: 'Aproveitamento por disciplina', rows: (ctx) => Q.dtTurmas(ctx).flatMap((t) => t.disciplinas.map((d) => { const v = Q.ativos(ctx.db).filter((a) => a.turmaId === t.id).map((a) => A.mt(a.id, d, '1º Trimestre')).filter((x) => x != null); return { turma: t.nome, disc: ctx.db.disciplinas.find((x) => x.id === d).nome, media: A.f1(A.sum(v, (x) => x) / Math.max(1, v.length)), pos: A.pct(pctOf(v.filter((x) => x >= 10).length, v.length)) }; })), cols: [{ k: 'turma', l: 'Turma' }, { k: 'disc', l: 'Disciplina' }, { k: 'media', l: 'Média' }, { k: 'pos', l: '% positivas' }] }])]
      ]),
      tab('calendario', 'Calendário', 'calendar', [
        ['Reuniões, avaliações e atividades', { v: 'calendar', events: (ctx) => { const ts = Q.dtTurmas(ctx); return [...ctx.db.reunioes.filter((r) => !r.turmaId || ts.some((t) => t.id === r.turmaId)).map((r) => ({ data: r.data, titulo: r.assunto, tipo: 'Reunião' })), ...ctx.db.avaliacoes.filter(Q.inT(ts)).map((a) => ({ data: a.data, titulo: `${a.tipo} ${a.turma} · ${a.discId}`, tipo: 'Avaliação' })), ...ctx.db.eventos]; } }]
      ]),
      PROFILE_N()
    ]
  };

  /* =====================================================================
     6. SECRETÁRIO ESCOLAR
     ===================================================================== */
  const alunoLimit = (ctx) => { const L = ctx.db.licenca.limites.alunos; const n = ctx.db.alunos.filter((a) => a.estado === 'Ativa' || a.estado === 'Pendente').length; return n >= L ? `Limite de ${L} alunos da licença atingido. Contacte o administrador para rever a licença.` : null; };
  const novaMatricula = { v: 'form', title: 'Nova matrícula', mod: 'Secretaria', crit: 0, logAction: 'Nova matrícula', note: 'A matrícula fica “Pendente” até ao pagamento da taxa de matrícula e à entrega dos documentos obrigatórios.',
    sections: [
      { title: 'Dados do aluno', fields: [{ k: 'nome', l: 'Nome completo', req: 1 }, { k: 'sexo', l: 'Sexo', o: ['F', 'M'], req: 1 }, { k: 'nascimento', l: 'Data de nascimento', t: 'date', req: 1 }, { k: 'bi', l: 'N.º do BI / cédula', req: 1 }, { k: 'morada', l: 'Morada', full: 1 }] },
      { title: 'Colocação', fields: [{ k: 'turma', l: 'Turma', req: 1, o: (db) => db.turmas.map((t) => `${t.nome} — ${t.vagas} vaga(s)`) }, { k: 'ano', l: 'Ano letivo', o: [A.YEAR], req: 1 }, { k: 'origem', l: 'Escola de origem' }] },
      { title: 'Encarregado de educação', fields: [{ k: 'enc', l: 'Nome do encarregado', req: 1 }, { k: 'parentesco', l: 'Parentesco', o: ['Pai', 'Mãe', 'Tio', 'Tia', 'Avô', 'Avó', 'Outro'], req: 1 }, { k: 'telefone', l: 'Telefone', req: 1 }, { k: 'email', l: 'Email', t: 'email' }] }
    ],
    get: () => ({ ano: A.YEAR }),
    validate: (v, ctx) => { const e = alunoLimit(ctx); if (e) return e; const t = ctx.db.turmas.find((x) => v.turma.startsWith(x.nome + ' —')); if (!t) return 'Selecione a turma.'; if (t.vagas <= 0) return `A turma ${t.nome} não tem vagas.`; if (ctx.db.alunos.some((a) => a.bi === v.bi)) return 'Já existe um aluno com este n.º de BI.'; return null; },
    set: (ctx, v) => {
      const db = ctx.db; const t = db.turmas.find((x) => v.turma.startsWith(x.nome + ' —'));
      let enc = db.encarregados.find((e) => e.telefone === v.telefone);
      if (!enc) { enc = { id: A.uid('E'), nome: v.enc, parentesco: v.parentesco, telefone: v.telefone, email: v.email, profissao: '', morada: v.morada, educandos: '', ids: [], estado: 'Ativo' }; db.encarregados.unshift(enc); }
      const n = db.alunos.length + 1;
      const a = { id: A.uid('A'), processo: `2026${String(n).padStart(4, '0')}`, nome: v.nome, sexo: v.sexo, nascimento: v.nascimento, classe: t.classe, curso: t.curso, turma: t.nome, turmaId: t.id, turno: t.turno, ano: A.YEAR, estado: 'Pendente', dataMatricula: A.TODAY, encarregado: enc.nome, encId: enc.id, telefone: v.telefone, bi: v.bi, morada: v.morada, apt: 12, bolsa: '—', numero: db.alunos.filter((x) => x.turmaId === t.id).length + 1 };
      db.alunos.push(a); enc.ids.push(a.id); enc.educandos = (enc.educandos ? enc.educandos + ', ' : '') + v.nome.split(' ')[0];
      t.alunos++; t.vagas--;
      const prop = ['7ª Classe', '8ª Classe', '9ª Classe'].includes(t.classe) ? 25000 : 35000;
      [['Matrícula', `Matrícula ${A.YEAR}`, 15000, A.TODAY], ['Propina', 'Propina — Novembro 2026', prop, '2026-11-10']].forEach(([tipo, d, val, venc]) => db.cobrancas.push({ id: A.uid('CB'), alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, tipo, descricao: d, valor: val, pago: 0, divida: val, vencimento: venc, estado: 'Pendente', periodo: venc.slice(0, 7) }));
      ['Cópia do BI', 'Certificado da classe anterior', '2 fotografias tipo passe'].forEach((d) => db.docsPendentes.unshift({ id: A.uid('DP'), alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, documento: d, prazo: '2026-11-30', estado: 'Em falta', notificado: 'Não' }));
      A.toast(`Matrícula registada: processo n.º ${a.processo}.`);
    }, done: 'Matrícula guardada como pendente.', after: () => A.go('matriculas', 0) };
  const SEC = {
    id: 'sec', nome: 'Secretário escolar', short: 'Secretaria', mod: 'Secretaria', perms: ['search', 'fin-view'],
    user: () => ({ nome: 'Helena Bastos', email: 'helena.bastos@acura.ao', telefone: '+244 923 000 301', morada: 'Maianga, Luanda' }),
    badges: { preinscricoes: (ctx) => ctx.db.preinscricoes.filter((p) => p.estado === 'Nova').length, certificados: (ctx) => ctx.db.pedidosCert.filter((p) => ['Pendente', 'Aprovado'].includes(p.estado)).length },
    tabs: [
      tab('dashboard', 'Dashboard da secretaria', 'home', [
        ['Resumo', D((ctx) => { const db = ctx.db; return [
          ['Matrículas pendentes', db.alunos.filter((a) => a.estado === 'Pendente').length, 'aguardam pagamento ou documentos', 'warn', 'clock'], ['Documentos em falta', db.docsPendentes.filter((d) => d.estado === 'Em falta').length, `${db.docsPendentes.filter((d) => d.estado.startsWith('Entregue')).length} por validar`, 'bad', 'file'],
          ['Pedidos de certificado', db.pedidosCert.filter((p) => p.estado !== 'Emitido').length, `${db.pedidosCert.filter((p) => p.estado === 'Aprovado').length} aprovados por emitir`, '', 'archive'], ['Pré-inscrições novas', db.preinscricoes.filter((p) => p.estado === 'Nova').length, `${db.preinscricoes.length} no total`, '', 'plus']]; },
        (ctx) => { const db = ctx.db; return [
          ['Matrículas pendentes', A.list(db.alunos.filter((a) => a.estado === 'Pendente').slice(0, 6).map((a) => ({ tone: 'warn', t: `${a.nome} — ${a.turma}`, m: `Processo ${a.processo} · desde ${A.date(a.dataMatricula)}` }))), { go: 'dashboard/1' }],
          ['Pedidos recentes', A.list([...db.pedidosCert.slice(0, 4).map((p) => ({ tone: A.tone(p.estado), t: `${p.tipo} — ${p.aluno}`, m: `${A.date(p.data)} · ${p.estado}` })), ...db.preinscricoes.slice(0, 3).map((p) => ({ tone: 'info', t: `Pré-inscrição: ${p.nome}`, m: `${p.classe} · ${A.date(p.data)}` }))]), { go: 'dashboard/3' }],
          ['Ocupação das turmas', A.bars(db.turmas.map((t) => [t.nome, t.alunos, t.vagas <= 2 ? 'bad' : '']), { max: 30 })],
          ['Documentos emitidos esta semana', A.bars(byKey(db.documentos.filter((d) => d.data >= '2026-10-26'), 'tipo'))]]; })],
        ['Matrículas pendentes', T('alunos', { where: (r) => r.estado === 'Pendente', cols: ['processo', 'nome', 'turma', 'dataMatricula', 'encarregado', 'telefone'], filters: ['q', 'turma'], actions: [{ l: 'Confirmar matrícula', icon: 'check', cls: 'primary', confirm: (r) => `Confirmar a matrícula de <b>${esc(r.nome)}</b>? Verifique o pagamento da taxa de matrícula e os documentos.`, check: (r, ctx) => (ctx.db.cobrancas.some((c) => c.alunoId === r.id && c.tipo === 'Matrícula' && c.estado !== 'Pago') ? 'A taxa de matrícula ainda não foi paga.' : null), set: { estado: 'Ativa' }, log: 'Confirmação de matrícula' }], onRowFicha: 1 })],
        ['Documentos em falta', T('docsPendentes', { where: (r) => r.estado === 'Em falta', filters: ['q', 'documento', 'turma'], ro: 1 })],
        ['Pedidos', T('pedidosCert', { where: (r) => r.estado !== 'Emitido', filters: ['q', 'estado', 'tipo'], ro: 1 })]
      ]),
      tab('preinscricoes', 'Pré-inscrições', 'plus', [
        ['Novas inscrições', T('preinscricoes', { where: (r) => r.estado === 'Nova', create: 'Nova pré-inscrição', defaults: () => ({ data: A.TODAY, estado: 'Nova', origem: 'Presencial' }), onCreate: (r, ctx) => { r.id = `PI-${String(ctx.db.preinscricoes.length + 1).padStart(4, '0')}`; }, actions: [{ l: 'Analisar', icon: 'eye', set: { estado: 'Em análise' } }, { l: 'Rejeitar', icon: 'x', cls: 'ghost danger', reason: 1, set: { estado: 'Rejeitada' } }] })],
        ['Candidaturas', T('preinscricoes', { filters: ['q', 'classe', 'curso', 'estado', 'origem', '~data'], actions: ['edit', { l: 'Aprovar', icon: 'check', when: (r) => ['Em análise', 'Encaminhada'].includes(r.estado), check: (r, ctx) => { const t = ctx.db.turmas.filter((x) => x.classe === r.classe && x.vagas > 0); return t.length ? null : `Sem vagas na ${r.classe}.`; }, set: { estado: 'Aprovada' } }, { l: 'Matricular', icon: 'grad', cls: 'primary', when: (r) => r.estado === 'Aprovada', open: (r) => { A.toast(`Complete a matrícula de ${r.nome}.`, 'warn'); A.go('matriculas', 0); } }] })],
        ['Acompanhamento', T('preinscricoes', { where: (r) => ['Em análise', 'Documentos em falta', 'Encaminhada'].includes(r.estado), filters: ['q', 'estado', 'classe'], actions: [{ l: 'Pedir documentos', icon: 'mail', when: (r) => r.estado !== 'Documentos em falta', set: { estado: 'Documentos em falta' }, done: 'Pedido de documentos enviado ao encarregado.' }, { l: 'Aprovar', icon: 'check', set: { estado: 'Aprovada' } }] })]
      ]),
      tab('alunos', 'Alunos', 'grad', [
        ['Pesquisa', T('alunos', { filters: [{ k: 'q', t: 'q', ph: 'Nome ou n.º de processo' }, 'classe', 'turma', 'ano', 'estado', { k: 'dataMatricula', t: 'range', l: 'Matrícula' }], search: ['nome', 'processo'], onRowFicha: 1, ro: 1, note: 'Filtre por nome, n.º de processo, classe, turma, ano letivo, estado da matrícula e intervalo de datas de matrícula.' })],
        ['Cadastro', T('alunos', { create: 'Cadastrar aluno', createCheck: alunoLimit, form: ['nome', 'sexo', 'nascimento', 'bi', 'turma', 'encarregado', 'telefone', 'morada'], defaults: () => ({ ano: A.YEAR, estado: 'Pendente', dataMatricula: A.TODAY, bolsa: '—', apt: 12 }), onCreate: (r, ctx) => { const t = ctx.db.turmas.find((x) => x.nome === r.turma) || ctx.db.turmas[0]; Object.assign(r, { processo: `2026${String(ctx.db.alunos.length + 1).padStart(4, '0')}`, turmaId: t.id, classe: t.classe, curso: t.curso, turno: t.turno, numero: t.alunos + 1 }); t.alunos++; t.vagas--; }, validate: (v, ctx) => { const t = ctx.db.turmas.find((x) => x.nome === v.turma); return t && t.vagas <= 0 ? `A turma ${t.nome} não tem vagas.` : null; }, filters: ['q', 'turma', 'estado'], cols: ['processo', 'nome', 'turma', 'encarregado', 'estado', 'dataMatricula'], sort: 'dataMatricula', dir: -1, onRowFicha: 1 })],
        ['Edição autorizada', T('alunos', { filters: ['q', 'turma'], actions: ['edit'], form: ['nome', 'sexo', 'nascimento', 'bi', 'telefone', 'morada'], note: 'Campos autorizados: identificação, contactos e morada. Turma e estado da matrícula alteram-se em “Matrículas”/“Classes e turmas”.', critEdit: 0 })],
        ['Ficha individual', H((ctx) => `<div class="card pad"><label class="field full"><span>Aluno</span>${A.pickAluno(ctx.db)}</label><div class="form-actions"><button class="btn primary" data-f>${A.icon('eye')}Abrir ficha</button></div></div>`, (el, ctx) => { const op = () => { const a = A.resolveAluno(ctx.db, el.querySelector('[data-pick]').value); if (!a) return A.toast('Selecione um aluno.', 'warn'); A.ficha(ctx, a); }; el.querySelector('[data-f]').onclick = op; el.querySelector('[data-pick]').addEventListener('change', op); })]
      ]),
      tab('matriculas', 'Matrículas', 'clipboard', [
        ['Nova matrícula', novaMatricula],
        ['Renovação', T('alunos', { where: (r) => r.estado === 'Ativa' && r.classe !== '12ª Classe', cols: ['processo', 'nome', 'classe', 'turma', 'estado'], filters: ['q', 'classe', 'turma'], note: 'A renovação para 2027/2028 abre a 01/06/2027. Até lá é possível pré-registar a intenção de renovação.', actions: [{ l: 'Pré-registar renovação', icon: 'refresh', confirm: 'Registar a intenção de renovação para 2027/2028?', log: 'Pré-registo de renovação', done: 'Intenção de renovação registada.' }], bulk: 1 })],
        ['Transferência', T('transferencias', { create: 'Registar transferência', filters: ['q', 'tipo', 'estado'], defaults: () => ({ data: A.TODAY, estado: 'Pendente', tipo: 'Saída' }), actions: ['edit', { l: 'Concluir', icon: 'check', when: (r) => r.estado !== 'Concluída', fn: (r, ctx) => { r.estado = 'Concluída'; if (r.tipo === 'Saída') { const a = ctx.db.alunos.find((x) => x.processo === r.processo || x.nome === r.aluno); if (a) a.estado = 'Transferida'; } }, log: 'Transferência', crit: 1 }] })],
        ['Anulação autorizada', T('alunos', { where: (r) => ['Ativa', 'Pendente'].includes(r.estado), cols: ['processo', 'nome', 'turma', 'estado'], filters: ['q', 'turma'], noteTone: 'warn', note: 'A anulação de matrícula requer aprovação do diretor-geral. O pedido segue para “Aprovações”.', actions: [{ l: 'Pedir anulação', icon: 'x', cls: 'ghost danger', when: (r, ctx) => !ctx.db.aprovacoes.some((a) => a.ref === r.id && a.estado === 'Pendente'), reason: 'Motivo da anulação', fn: (r, ctx, reason) => ctx.db.aprovacoes.unshift({ id: A.uid('AP'), tipo: 'Anulação', titulo: `Anulação de matrícula — ${r.nome}`, responsavel: ctx.user.nome, data: A.now(), motivo: reason, dados: { Aluno: r.nome, Processo: r.processo, Turma: r.turma }, destino: 'direcao', ref: r.id, estado: 'Pendente', historico: [] }), log: 'Pedido de anulação de matrícula', crit: 1, done: 'Pedido enviado para aprovação da direção.' }] })]
      ]),
      tab('encarregados', 'Encarregados', 'user', [
        ['Cadastro', T('encarregados', { create: 'Novo encarregado', actions: ['edit'], defaults: () => ({ estado: 'Ativo', ids: [], educandos: '' }), filters: ['q', 'parentesco'] })],
        ['Contactos', T('encarregados', { cols: ['nome', 'telefone', 'email', 'morada'], filters: ['q'], ro: 1 })],
        ['Associação aos alunos', T('alunos', { cols: ['processo', 'nome', 'turma', 'encarregado', 'telefone'], filters: ['q', 'turma'], actions: [{ l: 'Alterar encarregado', icon: 'swap', open: (r, ctx, refresh) => A.modal({ title: 'Associar encarregado', sub: esc(r.nome), size: 'sm', body: `<label class="field full"><span>Encarregado</span><input list="dl-enc" data-e placeholder="Nome ou telefone"><datalist id="dl-enc">${ctx.db.encarregados.map((e) => `<option value="${esc(e.nome)} · ${esc(e.telefone)}">`).join('')}</datalist></label>`, actions: [{ l: 'Cancelar' }, { l: 'Associar', cls: 'primary', fn: (b) => { const v = b.querySelector('[data-e]').value; const e = ctx.db.encarregados.find((x) => `${x.nome} · ${x.telefone}` === v); if (!e) { A.toast('Selecione um encarregado da lista.', 'warn'); return false; } const old = ctx.db.encarregados.find((x) => x.id === r.encId); if (old) old.ids = old.ids.filter((i) => i !== r.id); e.ids.push(r.id); Object.assign(r, { encId: e.id, encarregado: e.nome, telefone: e.telefone }); ctx.log('Secretaria', 'Associação de encarregado', `${r.nome} → ${e.nome}`); ctx.save(); refresh(); A.toast('Encarregado associado.'); } }] }) }] })]
      ]),
      tab('turmas', 'Classes e turmas', 'layers', [
        ['Consulta de vagas', T('turmas', { cols: ['nome', 'classe', 'curso', 'turno', 'capacidade', 'alunos', 'vagas'], filters: ['q', 'classe', 'turno'], ro: 1, rowCls: (r) => (r.vagas <= 0 ? 'row-bad' : '') })],
        ['Distribuição de alunos', T('alunos', { where: (r) => ['Ativa', 'Pendente'].includes(r.estado), cols: ['processo', 'nome', 'classe', 'turma', 'turno'], filters: ['q', 'classe', 'turma'], actions: [{ l: 'Mudar de turma', icon: 'swap', open: (r, ctx, refresh) => { const opts = ctx.db.turmas.filter((t) => t.classe === r.classe && t.id !== r.turmaId); if (!opts.length) return A.toast('Não existe outra turma desta classe.', 'warn'); A.modal({ title: 'Mudar de turma', sub: esc(r.nome), size: 'sm', body: A.formHtml([{ k: 't', l: 'Nova turma', req: 1, o: opts.map((t) => `${t.nome} (${t.vagas} vagas)`) }]), actions: [{ l: 'Cancelar' }, { l: 'Confirmar', cls: 'primary', fn: (b) => { const v = b.querySelector('[name=t]').value; const t = opts.find((x) => v.startsWith(x.nome + ' (')); if (t.vagas <= 0) { A.toast('A turma selecionada não tem vagas.', 'bad'); return false; } const o = ctx.db.turmas.find((x) => x.id === r.turmaId); o.alunos--; o.vagas++; t.alunos++; t.vagas--; Object.assign(r, { turma: t.nome, turmaId: t.id, turno: t.turno }); ctx.log('Secretaria', 'Mudança de turma', `${r.nome}: ${o.nome} → ${t.nome}`, 1); ctx.save(); refresh(); A.toast('Aluno transferido de turma.'); } }] }); } }] })]
      ]),
      tab('processos', 'Processos individuais', 'archive', [
        ['Documentos', T('docsPendentes', { filters: ['q', 'documento', 'estado'], ro: 1 })],
        ['Histórico académico', T('processosInd', { filters: ['q', 'turma'], ro: 1, actions: [{ l: 'Ficha', icon: 'eye', read: 1, open: (r, ctx) => A.ficha(ctx, ctx.db.alunos.find((a) => a.id === r.alunoId)) }] })],
        ['Situação do processo', T('processosInd', { filters: ['q', 'estado', 'turma'], ro: 1, top: (ctx) => `<div class="kpis mini">${byKey(ctx.db.processosInd, 'estado').map(([l, v]) => A.kpi(l, v)).join('')}</div>` })]
      ]),
      tab('boletins', 'Boletins', 'book', [['Emissão individual ou em lote', { v: 'issue', kind: 'boletim' }], ['Histórico de emissões', T('documentos', { where: (r) => r.tipo.startsWith('Boletim'), filters: ['q', 'turma', '~data'], ro: 1 })]]),
      tab('certificados', 'Certificados', 'star', [
        ['Pedidos', T('pedidosCert', { create: 'Novo pedido', filters: ['q', 'tipo', 'estado'], form: ['aluno', 'tipo', 'finalidade'], defaults: () => ({ data: A.TODAY, estado: 'Pendente' }), validate: (v, ctx) => (!ctx.db.alunos.some((a) => a.nome === v.aluno) ? 'Aluno não encontrado — escreva o nome completo.' : null), onCreate: (r, ctx) => { const a = ctx.db.alunos.find((x) => x.nome === r.aluno); Object.assign(r, { id: `PC${String(ctx.db.pedidosCert.length + 1).padStart(3, '0')}`, alunoId: a.id, processo: a.processo, turma: a.turma, classes: Number(a.classe.slice(0, -8)) <= 9 ? '7ª a 9ª Classe' : '10ª a 12ª Classe' }); } })],
        ['Verificação de requisitos', T('pedidosCert', { where: (r) => ['Pendente', 'Em verificação'].includes(r.estado), actions: [{ l: 'Verificar requisitos', icon: 'checkCircle', cls: 'primary', open: (r, ctx, refresh) => {
          const db = ctx.db; const a = db.alunos.find((x) => x.id === r.alunoId); const s = A.stats(a);
          const req = [['Matrícula ativa ou concluída', ['Ativa', 'Transferida'].includes(a.estado)], ['Sem dívidas vencidas', A.debt(a.id) === 0], ['Processo individual completo', !db.docsPendentes.some((d) => d.alunoId === a.id && d.estado === 'Em falta')], ['Aproveitamento nas classes requeridas', s.negativas <= 2]];
          const ok = req.every((x) => x[1]);
          r.estado = 'Em verificação'; ctx.save(); refresh();
          A.modal({ title: 'Verificação de requisitos', sub: `${esc(r.tipo)} — ${esc(r.aluno)}`, size: 'sm', body: `<ul class="checks">${req.map(([l, v]) => `<li class="${v ? 'ok' : 'bad'}">${A.icon(v ? 'checkCircle' : 'alert')}${esc(l)}</li>`).join('')}</ul>${ok ? '' : `<div class="note warn mt">${A.icon('info')}<div>Existem requisitos por cumprir. O pedido não pode ser submetido.</div></div>`}`, actions: [{ l: 'Fechar' }, { l: 'Submeter para aprovação', cls: 'primary', disabled: !ok, fn: () => { r.estado = 'Por aprovar'; db.aprovacoes.unshift({ id: A.uid('AP'), tipo: 'Certificado', titulo: `${r.tipo} — ${r.aluno}`, responsavel: ctx.user.nome, data: A.now(), motivo: `Pedido para ${String(r.finalidade || '').toLowerCase()}.`, dados: { Aluno: r.aluno, 'Nº processo': r.processo, Classes: r.classes, Requisitos: 'Verificados' }, destino: 'direcao', ref: r.id, estado: 'Pendente', historico: [] }); ctx.log('Secretaria', 'Submissão de certificado', r.aluno); ctx.save(); refresh(); A.toast('Pedido submetido à direção para aprovação.'); } }] });
        } }] })],
        ['Emissão', T('pedidosCert', { where: (r) => ['Aprovado', 'Por aprovar'].includes(r.estado), note: 'Só é possível emitir certificados aprovados pela direção.', actions: [{ l: 'Emitir', icon: 'printer', cls: 'primary', when: (r) => r.estado === 'Aprovado', confirm: (r) => `Emitir o ${esc(r.tipo.toLowerCase())} de <b>${esc(r.aluno)}</b>? A emissão fica registada e não pode ser desfeita.`, fn: (r, ctx) => { r.estado = 'Emitido'; ctx.db.documentos.unshift({ id: `DOC-2026/${String(ctx.db.documentos.length + 1).padStart(4, '0')}`, tipo: r.tipo, alunoId: r.alunoId, aluno: r.aluno, processo: r.processo, turma: r.turma, data: A.TODAY, emitidoPor: ctx.user.nome, estado: 'Emitido', via: '1.ª via' }); setTimeout(() => A.print('Certificado', A.docs.certificado(r)), 200); }, log: 'Emissão de certificado', crit: 1, done: 'Certificado emitido e registado.' }, { l: '', icon: 'eye', title: 'Pré-visualizar', read: 1, open: (r) => A.preview('Certificado', A.docs.certificado(r)) }] })],
        ['Registo', T('documentos', { where: (r) => r.tipo.startsWith('Certificado'), filters: ['q', 'estado', '~data'], ro: 1 })]
      ]),
      tab('declaracoes', 'Declarações', 'file', [['Emitir declaração', { v: 'issue', kind: 'declaracao' }], ['Registo de declarações', T('documentos', { where: (r) => r.tipo.startsWith('Declaração'), filters: ['q', 'tipo', 'estado', '~data'], actions: [{ l: 'Anular', icon: 'x', cls: 'ghost danger', when: (r) => r.estado === 'Emitido', reason: 1, set: { estado: 'Anulado' }, log: 'Anulação de documento', crit: 1 }] })]]),
      tab('cartoes', 'Cartões', 'card', [
        ['Emissão', T('cartoes', { where: (r) => r.estado === 'Por emitir', filters: ['q', 'turma'], actions: [{ l: 'Emitir', icon: 'printer', cls: 'primary', fn: (r, ctx) => { r.estado = 'Ativo'; r.emissao = A.TODAY; setTimeout(() => A.print('Cartão', A.docs.cartao(ctx.db.alunos.find((a) => a.id === r.alunoId))), 200); }, log: 'Emissão de cartão' }], empty: 'Todos os cartões estão emitidos.' })],
        ['Reimpressão', T('cartoes', { filters: ['q', 'turma', 'estado'], actions: [{ l: 'Reimprimir', icon: 'refresh', reason: 'Motivo da reimpressão (perda, dano…)', fn: (r, ctx) => { r.estado = 'Ativo'; r.emissao = A.TODAY; setTimeout(() => A.print('Cartão', A.docs.cartao(ctx.db.alunos.find((a) => a.id === r.alunoId))), 200); }, log: 'Reimpressão de cartão' }, { l: '', icon: 'eye', title: 'Ver', read: 1, open: (r, ctx) => A.preview('Cartão de estudante', A.docs.cartao(ctx.db.alunos.find((a) => a.id === r.alunoId))) }] })]
      ]),
      tab('pendentes', 'Documentos pendentes', 'alert', [
        ['Documentação em falta', T('docsPendentes', { where: (r) => r.estado === 'Em falta', filters: ['q', 'documento', 'turma', '~prazo'], actions: [{ l: 'Registar entrega', icon: 'upload', set: { estado: 'Entregue — por validar' } }] })],
        ['Validação', T('docsPendentes', { where: (r) => r.estado === 'Entregue — por validar', actions: [{ l: 'Validar', icon: 'check', cls: 'primary', set: { estado: 'Validado' }, log: 'Validação de documento' }, { l: 'Recusar', icon: 'x', cls: 'ghost danger', reason: 1, set: { estado: 'Em falta' } }], empty: 'Sem documentos por validar.' })],
        ['Notificações', T('docsPendentes', { where: (r) => r.estado === 'Em falta', cols: ['processo', 'aluno', 'documento', 'prazo', 'notificado'], filters: ['q', 'notificado'], actions: [{ l: 'Notificar encarregado', icon: 'send', when: (r) => r.notificado !== 'Sim', set: { notificado: 'Sim' }, done: 'Notificação enviada por SMS e email.' }], tools: [{ l: 'Notificar todos', icon: 'send', fn: (ctx, api) => { const l = ctx.db.docsPendentes.filter((d) => d.estado === 'Em falta' && d.notificado !== 'Sim'); l.forEach((d) => { d.notificado = 'Sim'; }); ctx.log('Secretaria', 'Notificação em massa', `${l.length} encarregados notificados`); ctx.save(); api.refresh(); A.toast(`${l.length} notificações enviadas.`); } }] })]
      ]),
      tab('transferencias', 'Transferências', 'swap', [
        ['Entrada', T('transferencias', { where: (r) => r.tipo === 'Entrada', create: 'Registar entrada', defaults: () => ({ tipo: 'Entrada', data: A.TODAY, estado: 'Pendente', processo: '—' }), actions: ['edit', { l: 'Concluir', icon: 'check', when: (r) => r.estado !== 'Concluída', set: { estado: 'Concluída' }, log: 'Transferência de entrada' }] })],
        ['Saída', T('transferencias', { where: (r) => r.tipo === 'Saída', create: 'Registar saída', defaults: () => ({ tipo: 'Saída', data: A.TODAY, estado: 'Pendente' }), actions: ['edit', { l: 'Concluir', icon: 'check', when: (r) => r.estado !== 'Concluída', fn: (r, ctx) => { r.estado = 'Concluída'; const a = ctx.db.alunos.find((x) => x.processo === r.processo); if (a) a.estado = 'Transferida'; }, log: 'Transferência de saída', crit: 1 }] })],
        ['Histórico', T('transferencias', { filters: ['q', 'tipo', 'estado', '~data'], ro: 1 })]
      ]),
      tab('relatorios', 'Relatórios', 'chart', [
        ['Listagens', R(() => [{ t: 'Lista geral de alunos', ds: 'alunos', cols: ['processo', 'nome', 'classe', 'turma', 'estado'] }, { t: 'Lista de encarregados', ds: 'encarregados', cols: ['nome', 'telefone', 'email', 'educandos'] }, { t: 'Aniversariantes de novembro', ds: 'alunos', where: (r) => r.nascimento.slice(5, 7) === '11' && r.estado === 'Ativa', cols: ['nome', 'turma', 'nascimento'] }])],
        ['Matrículas', R(() => [{ t: 'Matrículas por estado', ds: 'alunos', group: 'estado', gl: 'Estado' }, { t: 'Matrículas por classe', ds: 'alunos', group: 'classe', gl: 'Classe' }, { t: 'Matrículas por mês', ds: 'alunos', group: (r) => r.dataMatricula.slice(0, 7), gl: 'Mês' }])],
        ['Alunos por turma', R(() => [{ t: 'Alunos por turma', ds: 'alunos', where: (r) => r.estado === 'Ativa', group: 'turma', gl: 'Turma' }, { t: 'Alunos por turno', ds: 'alunos', where: (r) => r.estado === 'Ativa', group: 'turno', gl: 'Turno' }, { t: 'Alunos por sexo e turma', ds: 'alunos', where: (r) => r.estado === 'Ativa', group: (r) => `${r.turma} · ${r.sexo}`, gl: 'Turma / sexo' }])],
        ['Mapas administrativos', R(() => [{ t: 'Mapa de documentos emitidos', ds: 'documentos', group: 'tipo', gl: 'Tipo' }, { t: 'Mapa de transferências', ds: 'transferencias', group: (r) => `${r.tipo} · ${r.estado}`, gl: 'Tipo / estado' }, { t: 'Mapa de documentos em falta', ds: 'docsPendentes', group: 'documento', gl: 'Documento' }])]
      ]),
      PROFILE([['Conta', { v: 'profile', part: 'dados' }], ['Palavra-passe', { v: 'profile', part: 'senha' }], ['Preferências', { v: 'profile', part: 'pref' }]])
    ]
  };

  /* =====================================================================
     7. PROFESSOR
     ===================================================================== */
  const prW = (ctx) => Q.inT(Q.profTurmas(ctx));
  const PROF = {
    id: 'prof', nome: 'Professor', short: 'Professor', mod: 'Académico', perms: [], prof: 'profId',
    user: (db) => { const p = db.professores.find((x) => x.id === db.demo.profId); return { nome: p.nome, email: p.email, telefone: p.telefone, morada: 'Viana, Luanda' }; },
    badges: { pautas: (ctx) => ctx.db.pautas.filter((p) => p.profId === ctx.prof.id && p.estado === 'Devolvida').length },
    tabs: [
      tab('dashboard', 'Dashboard', 'home', [
        ['Resumo', D((ctx) => { const db = ctx.db; const td = db.horarios.filter((h) => h.profId === ctx.prof.id && h.dia === today()); const pt = db.pautas.filter((p) => p.profId === ctx.prof.id && p.periodo === '1º Trimestre'); return [
          ['Aulas hoje', td.length, td.length ? `${td[0].hora} – ${td[td.length - 1].hora}` : 'Sem aulas', '', 'clock'], ['Turmas atribuídas', Q.profTurmas(ctx).length, `${Q.profPairs(ctx).length} disciplina(s)/turma`, '', 'layers'],
          ['Pautas por submeter', pt.filter((p) => ['Rascunho', 'Devolvida'].includes(p.estado)).length, `${pt.filter((p) => p.estado === 'Devolvida').length} devolvida(s)`, pt.some((p) => p.estado === 'Devolvida') ? 'bad' : 'warn', 'clipboard'], ['Próximas avaliações', db.avaliacoes.filter((a) => a.profId === ctx.prof.id && a.data >= A.TODAY).length, 'até ao fim do trimestre', '', 'calendar']]; },
        (ctx) => { const db = ctx.db; const td = db.horarios.filter((h) => h.profId === ctx.prof.id && h.dia === today()).sort((a, b) => (a.hora > b.hora ? 1 : -1)); return [
          ['Aulas do dia', A.list(td.map((h) => ({ icon: 'clock', t: `${h.hora} · ${h.disciplina} — ${h.turma}`, m: h.sala, r: go('sumarios/0', 'Sumário') })), 'Sem aulas hoje.')],
          ['Pautas', A.list(db.pautas.filter((p) => p.profId === ctx.prof.id && p.periodo === '1º Trimestre').map((p) => ({ tone: A.tone(p.estado), t: `${p.turma} · ${p.disciplina}`, r: A.badge(p.estado) }))), { go: 'pautas/3' }],
          ['Avaliações', A.list(db.avaliacoes.filter((a) => a.profId === ctx.prof.id && a.data >= A.TODAY).slice(0, 5).map((a) => ({ tone: 'warn', t: `${a.tipo} — ${a.turma}`, m: `${A.date(a.data)} · ${a.disciplina}` })), 'Sem avaliações agendadas.'), { go: 'avaliacoes/2' }],
          ['Avisos', A.list(db.comunicados.filter((c) => c.estado === 'Publicado' && ['Todos', 'Professores'].includes(c.destinatarios)).slice(0, 4).map((c) => ({ icon: 'bell', t: c.titulo, m: `${A.date(c.data)} · ${c.autor}` }))), { go: 'comunicacao/0' }]]; })],
        ['Aulas do dia', H((ctx) => { const db = ctx.db; const td = db.horarios.filter((h) => h.profId === ctx.prof.id && h.dia === today()).sort((a, b) => (a.hora > b.hora ? 1 : -1)); return `<div class="cards3">${td.map((h) => { const done = db.sumarios.some((s) => s.data === A.TODAY && s.hora === h.hora && s.profId === ctx.prof.id); return `<article class="card lesson"><div class="row sb"><b class="big">${h.hora}</b>${A.badge(done ? 'Sumário registado' : 'Por registar', done ? 'ok' : 'warn')}</div><h4>${esc(h.disciplina)}</h4><p class="muted">${esc(h.turma)} · ${esc(h.sala)}</p><div class="row">${go('presencas/0', 'Presenças')}${go('sumarios/0', 'Sumário')}</div></article>`; }).join('') || '<div class="card"><div class="empty"><p>Sem aulas hoje.</p></div></div>'}</div>`; })],
        ['Avaliações', T('avaliacoes', { where: (r, ctx) => r.profId === ctx.prof.id && r.data >= A.TODAY, ro: 1, cols: ['data', 'turma', 'disciplina', 'tipo', 'estado'] })],
        ['Pautas pendentes', T('pautas', { where: (r, ctx) => r.profId === ctx.prof.id && ['Rascunho', 'Devolvida'].includes(r.estado), ro: 1, cols: ['turma', 'disciplina', 'periodo', 'estado', 'obs'], actions: [{ l: 'Lançar notas', icon: 'edit', read: 1, open: (r) => { A.state.gpair = `${r.turmaId}-${r.discId}`; A.go('notas', 0); } }] })],
        ['Avisos', { v: 'feed', to: ['Todos', 'Professores'] }]
      ]),
      tab('turmas', 'Minhas turmas', 'layers', [
        ['Turmas atribuídas', H((ctx) => `<div class="cards3">${Q.profTurmas(ctx).map((t) => `<article class="card"><div class="card-head"><h3>${esc(t.nome)}</h3>${A.badge(t.turno, 'muted')}</div>${A.kv({ Disciplina: Q.profPairs(ctx).filter((d) => d.turmaId === t.id).map((d) => d.disciplina).join(', '), Alunos: t.alunos, Sala: t.sala, 'Diretor(a) de turma': esc(t.dt) })}</article>`).join('')}</div>`)],
        ['Alunos', T('alunos', { where: (r, ctx) => prW(ctx)(r) && r.estado === 'Ativa', cols: ['processo', 'nome', 'turma', 'sexo'], filters: ['q', 'turma'], ro: 1, detail: ['processo', 'nome', 'turma', 'classe', 'curso'] })]
      ]),
      tab('disciplinas', 'Minhas disciplinas', 'book', [
        ['Disciplinas', H((ctx) => `<div class="cards3">${A.uniq(Q.profPairs(ctx).map((d) => d.discId)).map((id) => { const d = ctx.db.disciplinas.find((x) => x.id === id); const l = Q.profPairs(ctx).filter((x) => x.discId === id); return `<article class="card"><div class="card-head"><h3>${esc(d.nome)}</h3><span class="muted">${d.carga} tempos/sem.</span></div>${A.kv({ Área: d.area, Turmas: l.map((x) => x.turma).join(', '), 'Tempos semanais': A.sum(l, 'carga') })}</article>`; }).join('')}</div>`)],
        ['Conteúdos', T('sumarios', { where: (r, ctx) => r.profId === ctx.prof.id, cols: ['data', 'turma', 'disciplina', 'licao', 'sumario'], filters: ['q', 'turma'], ro: 1 })],
        ['Distribuição de aulas', T('distribuicao', { where: (r, ctx) => r.profId === ctx.prof.id, ro: 1, footNote: (rows) => `Total: ${A.sum(rows, 'carga')} tempos semanais` })]
      ]),
      tab('sumarios', 'Sumários', 'edit', [
        ['Registar aula', { v: 'form', title: 'Registo de sumário', mod: 'Académico', logAction: 'Registo de sumário', fields: [{ k: 'aula', l: 'Aula', req: 1, o: (db) => db.horarios.filter((h) => h.profId === A.ctx.prof.id).sort((a, b) => a.dia - b.dia || (a.hora > b.hora ? 1 : -1)).map((h) => `${db.DIAS[h.dia]} ${h.hora} · ${h.turma} · ${h.disciplina}`) }, { k: 'data', l: 'Data', t: 'date', req: 1 }, { k: 'sumario', l: 'Conteúdos lecionados', t: 'area', req: 1 }, { k: 'observacoes', l: 'Observações', t: 'area' }],
          get: (ctx) => { const h = ctx.db.horarios.find((x) => x.profId === ctx.prof.id && x.dia === today()); return { data: A.TODAY, aula: h ? `${ctx.db.DIAS[h.dia]} ${h.hora} · ${h.turma} · ${h.disciplina}` : '' }; },
          set: (ctx, v) => { const [, turma, disciplina] = v.aula.split(' · '); const hora = v.aula.split(' ')[1]; const t = ctx.db.turmas.find((x) => x.nome === turma); const n = ctx.db.sumarios.filter((s) => s.turma === turma && s.disciplina === disciplina).length + 21; ctx.db.sumarios.unshift({ id: A.uid('SM'), data: v.data, hora, turma, turmaId: t && t.id, disciplina, licao: n, sumario: v.sumario, observacoes: v.observacoes || '—', profId: ctx.prof.id }); }, done: 'Sumário registado.', after: () => A.go('sumarios', 1) }],
        ['Conteúdos lecionados', T('sumarios', { where: (r, ctx) => r.profId === ctx.prof.id, filters: ['q', 'turma', 'disciplina', '~data'], actions: ['edit'] })],
        ['Observações', T('sumarios', { where: (r, ctx) => r.profId === ctx.prof.id && r.observacoes && r.observacoes !== '—', cols: ['data', 'turma', 'disciplina', 'observacoes'], actions: ['edit'] })]
      ]),
      tab('notas', 'Lançamento de notas', 'grid', [
        ['Grelha de notas', { v: 'grades' }],
        ['Testes e trabalhos', T('avaliacoes', { where: (r, ctx) => r.profId === ctx.prof.id && ['Teste', 'Trabalho', 'Mini-teste'].includes(r.tipo), filters: ['q', 'turma', 'estado'], create: 'Agendar avaliação', defaults: (ctx) => ({ professor: ctx.user.nome, profId: ctx.prof.id, estado: 'Agendada', tipo: 'Teste' }), actions: [{ l: 'Lançar resultados', icon: 'edit', when: (r) => r.estado !== 'Agendada', open: (r) => { A.state.gpair = `${r.turmaId}-${r.discId}`; A.go('notas', 0); } }, { l: 'Marcar como realizada', icon: 'check', when: (r) => r.estado === 'Agendada' && r.data <= A.TODAY, set: { estado: 'Realizada' } }] })],
        ['Provas e exames', T('avaliacoes', { where: (r, ctx) => r.profId === ctx.prof.id && /Prova|Exame/.test(r.tipo), filters: ['q', 'turma', 'tipo'], create: 'Agendar prova', defaults: (ctx) => ({ professor: ctx.user.nome, profId: ctx.prof.id, estado: 'Agendada', tipo: 'Prova do professor' }), actions: ['edit'] })]
      ]),
      tab('pautas', 'Pautas', 'clipboard', [
        ['Rascunhos', T('pautas', { where: (r, ctx) => r.profId === ctx.prof.id && r.estado === 'Rascunho', ro: 1, actions: [{ l: 'Editar notas', icon: 'edit', read: 1, open: (r) => { A.state.gpair = `${r.turmaId}-${r.discId}`; A.go('notas', 0); } }] })],
        ['Submissões', T('pautas', { where: (r, ctx) => r.profId === ctx.prof.id && r.estado === 'Submetida', ro: 1, actions: [{ l: '', icon: 'eye', title: 'Ver', read: 1, open: (r) => A.showPauta(r) }] })],
        ['Correções', T('pautas', { where: (r, ctx) => r.profId === ctx.prof.id && r.estado === 'Devolvida', ro: 1, cols: ['turma', 'disciplina', 'periodo', 'obs', 'estado'], actions: [{ l: 'Corrigir', icon: 'edit', cls: 'primary', read: 1, open: (r) => { A.state.gpair = `${r.turmaId}-${r.discId}`; A.go('notas', 0); } }], empty: 'Sem pautas devolvidas.' })],
        ['Estado de aprovação', T('pautas', { where: (r, ctx) => r.profId === ctx.prof.id, ro: 1, filters: ['q', 'estado', 'periodo'], actions: [{ l: '', icon: 'eye', title: 'Ver', read: 1, open: (r) => A.showPauta(r) }] })]
      ]),
      tab('presencas', 'Presenças e faltas', 'checkCircle', [
        ['Marcação por aula', { v: 'attendance' }],
        ['Por disciplina', T('faltas', { where: (r, ctx) => Q.profPairs(ctx).some((d) => d.turmaId === r.turmaId && d.discId === r.discId), filters: ['q', 'turma', 'disciplina', 'tipo'], ro: 1 })],
        ['Por data', T('faltas', { where: (r, ctx) => Q.profPairs(ctx).some((d) => d.turmaId === r.turmaId && d.discId === r.discId), filters: ['~data', 'turma', 'tipo'], ro: 1 })]
      ]),
      tab('horarios', 'Horários', 'calendar', [
        ['Horário semanal', { v: 'timetable', mode: 'prof', fixed: (ctx) => ctx.prof.id }],
        ['Calendário de aulas', { v: 'calendar', events: (ctx) => [...ctx.db.avaliacoes.filter((a) => a.profId === ctx.prof.id).map((a) => ({ data: a.data, titulo: `${a.tipo} ${a.turma}`, tipo: 'Avaliação' })), ...ctx.db.eventos] }]
      ]),
      tab('avaliacoes', 'Avaliações', 'clipboard', [
        ['Calendário', { v: 'calendar', events: (ctx) => ctx.db.avaliacoes.filter((a) => a.profId === ctx.prof.id).map((a) => ({ data: a.data, titulo: `${a.tipo} · ${a.turma}`, tipo: 'Avaliação' })) }],
        ['Registo de resultados', T('avaliacoes', { where: (r, ctx) => r.profId === ctx.prof.id && r.data <= A.TODAY, filters: ['q', 'turma', 'estado'], actions: [{ l: 'Lançar', icon: 'edit', open: (r) => { A.state.gpair = `${r.turmaId}-${r.discId}`; A.go('notas', 0); } }, { l: 'Marcar como lançada', icon: 'check', when: (r) => r.estado !== 'Lançada', set: { estado: 'Lançada' } }] })],
        ['Avaliações futuras', T('avaliacoes', { where: (r, ctx) => r.profId === ctx.prof.id && r.data > A.TODAY, create: 'Agendar avaliação', defaults: (ctx) => ({ professor: ctx.user.nome, profId: ctx.prof.id, estado: 'Agendada' }), validate: (v, ctx) => (v.data <= A.TODAY ? 'A data deve ser futura.' : !Q.profTurmas(ctx).some((t) => t.nome === v.turma) ? 'Só pode agendar avaliações nas suas turmas.' : null), onCreate: (r, ctx) => { const t = ctx.db.turmas.find((x) => x.nome === r.turma); const d = ctx.db.disciplinas.find((x) => x.nome === r.disciplina); r.turmaId = t && t.id; r.discId = d && d.id; }, actions: ['edit', 'del'] })]
      ]),
      tab('desempenho', 'Desempenho dos alunos', 'trend', [
        ['Médias', { v: 'performance', by: 'turma', scope: (ctx) => Q.ativos(ctx.db).filter(prW(ctx)), noRisk: 1 }],
        ['Evolução', H((ctx) => `<div class="grid2">${Q.profPairs(ctx).map((d) => { const al = Q.ativos(ctx.db).filter((a) => a.turmaId === d.turmaId); const c = A.COMPS.map((k) => A.sum(al, (a) => A.grade(a.id, d.discId, '1º Trimestre', k) || 0) / Math.max(1, al.length)); return A.section(`${d.turma} · ${d.disciplina}`, A.bars(A.COMPS.map((k, i) => [k, Math.round(c[i] * 10) / 10, c[i] < 10 ? 'bad' : ''] ), { max: 20 })); }).join('')}</div>`)]
      ]),
      tab('materiais', 'Materiais pedagógicos', 'upload', [
        ['Publicações', T('materiais', { where: (r, ctx) => r.profId === ctx.prof.id, create: 'Publicar material', createCheck: (ctx) => (ctx.db.permissoes.prof.Académico.includes('c') ? null : 'A publicação de materiais não está autorizada para o seu perfil.'), defaults: (ctx) => ({ autor: ctx.user.nome, profId: ctx.prof.id, data: A.TODAY, estado: 'Publicado' }), actions: ['edit', 'del'], note: 'Os materiais publicados ficam disponíveis no portal dos alunos da turma indicada.' })]
      ]),
      tab('comunicacao', 'Comunicação', 'message', [['Avisos', { v: 'feed', to: ['Todos', 'Professores'] }], ['Comunicação institucional', { v: 'feed' }]]),
      PROFILE([['Dados', { v: 'profile', part: 'dados' }], ['Palavra-passe', { v: 'profile', part: 'senha' }], ['Notificações', { v: 'profile', part: 'pref' }]])
    ]
  };

  /* =====================================================================
     8. TESOUREIRO
     ===================================================================== */
  const payTool = { l: 'Registar pagamento', icon: 'cash', cls: 'primary', fn: (ctx, api) => A.payModal(ctx, null, () => api.refresh()) };
  const printRec = { l: '', icon: 'printer', title: 'Imprimir recibo', read: 1, open: (r) => A.print('Recibo', A.docs.recibo([r])) };
  const cobr = (tipo, extra = {}) => T('cobrancas', { where: (r) => r.tipo === tipo, filters: ['q', 'turma', 'estado', 'descricao'], footNote: (rows) => `Cobrado: ${A.money(A.sum(rows, 'valor'))} · em dívida: ${A.money(A.sum(rows, 'divida'))}`, tools: [payTool], ...extra });
  const TES = {
    id: 'tes', nome: 'Tesoureiro', short: 'Tesouraria', mod: 'Tesouraria', perms: ['search', 'fin'],
    user: () => ({ nome: 'Carlos Mendes', email: 'carlos.mendes@acura.ao', telefone: '+244 923 000 401', morada: 'Kilamba, Luanda' }),
    badges: { pagamentos: (ctx) => ctx.db.pagamentos.filter((p) => p.estado === 'Por confirmar').length },
    tabs: [
      tab('dashboard', 'Dashboard financeiro', 'home', [
        ['Resumo', D((ctx) => { const db = ctx.db; const hoje = db.pagamentos.filter((p) => p.data === A.TODAY && p.estado !== 'Anulado'); return [
          ['Recebido hoje', A.money(A.sum(hoje, 'valor')), `${hoje.length} recibos`, 'ok', 'cash'], ['Recebido em outubro', A.money(Q.rec(db, '2026-10')), '', '', 'trend'],
          ['Dívida vencida', A.money(Q.divVenc(db)), `${Q.vencidas(db).length} cobranças`, 'bad', 'alert'], ['Por confirmar', db.pagamentos.filter((p) => p.estado === 'Por confirmar').length, 'transferências a validar', 'warn', 'clock']]; },
        (ctx) => { const db = ctx.db; const hoje = db.pagamentos.filter((p) => p.data === A.TODAY); return [
          ['Movimentos do dia', A.list(hoje.slice(0, 8).map((p) => ({ icon: 'cash', t: `${p.recibo} — ${p.aluno}`, m: `${p.hora} · ${p.metodo} · ${p.descricao}`, r: `<b>${A.money(p.valor)}</b>` })), 'Sem movimentos hoje.'), { go: 'caixa/0' }],
          ['Recebimentos por método (outubro)', A.bars(byKey(db.pagamentos.filter((p) => p.data.startsWith('2026-10')), 'metodo', 'valor'), { money: true })],
          ['Cobranças de novembro', A.donut(byKey(db.cobrancas.filter((c) => c.periodo === '2026-11'), 'estado').map(([l, v]) => [l, v, { Pago: 'var(--ok)', Pendente: 'var(--warn)', Parcial: 'var(--info)' }[l] || 'var(--c3)']), 'nov.'), { go: 'cobrancas/0' }],
          ['Receitas mensais', A.columns(monthBars(db), { money: true })]]; })],
        ['Recebimentos', T('pagamentos', { where: (r) => r.data === A.TODAY, ro: 1, actions: [printRec], footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}`, empty: 'Sem recebimentos hoje.' })],
        ['Cobranças', T('cobrancas', { where: (r) => r.estado !== 'Pago' && r.vencimento >= A.TODAY, filters: ['q', 'turma', 'descricao'], ro: 1, footNote: (rows) => `A receber: ${A.money(A.sum(rows, 'divida'))}` })],
        ['Dívidas', T('cobrancas', { where: (r) => r.estado === 'Vencido' || (r.estado === 'Parcial' && r.vencimento < A.TODAY), filters: ['q', 'turma', 'descricao'], tools: [payTool], footNote: (rows) => `Total vencido: ${A.money(A.sum(rows, 'divida'))}` })]
      ]),
      tab('cobrancas', 'Cobranças', 'tag', [
        ['Propinas', cobr('Propina')], ['Matrículas', cobr('Matrícula')], ['Taxas', cobr('Taxa')],
        ['Cobranças extraordinárias', cobr('Extraordinária', { create: 'Nova cobrança extraordinária', form: ['descricao', 'valor', 'vencimento', 'turma'], defaults: () => ({ tipo: 'Extraordinária', estado: 'Pendente', pago: 0 }), createLog: 'Criação de cobrança', createDone: 'Cobrança lançada a todos os alunos ativos da turma.', validate: (v) => (!v.turma ? 'Indique a turma a cobrar.' : null), onCreate: (r, ctx) => { const al = Q.ativos(ctx.db).filter((a) => a.turma === r.turma); al.slice(1).forEach((a) => ctx.db.cobrancas.unshift({ ...r, id: A.uid('CB'), alunoId: a.id, aluno: a.nome, processo: a.processo, divida: r.valor, periodo: r.vencimento.slice(0, 7) })); const a = al[0]; Object.assign(r, { id: A.uid('CB'), alunoId: a.id, aluno: a.nome, processo: a.processo, divida: r.valor, periodo: r.vencimento.slice(0, 7) }); } })]
      ]),
      tab('pagamentos', 'Pagamentos', 'cash', [
        ['Registar', H((ctx) => `<div class="card pad center-box">${A.icon('cash', 'xl')}<h3>Registar pagamento</h3><p class="muted">Selecione o aluno, as cobranças a liquidar e o método. O recibo é emitido automaticamente.</p><button class="btn primary" data-pay>${A.icon('plus')}Novo pagamento</button></div>${A.section('Últimos pagamentos registados', A.list(ctx.db.pagamentos.slice(0, 6).map((p) => ({ icon: 'file', t: `${p.recibo} — ${p.aluno}`, m: `${A.date(p.data)} ${p.hora} · ${p.metodo} · ${p.operador}`, r: `<b>${A.money(p.valor)}</b>` }))))}`, (el, ctx) => { el.querySelector('[data-pay]').onclick = () => A.payModal(ctx, null, () => A.rerender()); })],
        ['Consultar', T('pagamentos', { filters: ['q', 'metodo', 'estado', 'operador', '~data'], actions: [printRec], footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}` })],
        ['Confirmar', T('pagamentos', { where: (r) => r.estado === 'Por confirmar', actions: [{ l: 'Confirmar', icon: 'check', cls: 'primary', confirm: 'Confirma que o valor foi creditado na conta bancária?', set: { estado: 'Confirmado' }, log: 'Confirmação de pagamento' }], empty: 'Não há pagamentos por confirmar.', after: () => A.refreshBadges() })],
        ['Localizar', T('pagamentos', { filters: [{ k: 'q', t: 'q', ph: 'Recibo, nome ou n.º de processo' }, '~data', 'metodo'], search: ['recibo', 'aluno', 'processo'], actions: [printRec] })]
      ]),
      tab('contas', 'Contas correntes', 'user', [['Histórico financeiro por aluno', { v: 'ledger' }]]),
      tab('recibos', 'Recibos', 'file', [
        ['Emitir', H(() => `<div class="card pad center-box">${A.icon('file', 'xl')}<h3>Emitir recibo</h3><p class="muted">Os recibos são emitidos no registo do pagamento.</p><button class="btn primary" data-pay>${A.icon('cash')}Registar pagamento e emitir</button></div>`, (el, ctx) => { el.querySelector('[data-pay]').onclick = () => A.payModal(ctx); })],
        ['Pesquisar', T('pagamentos', { cols: ['recibo', 'data', 'aluno', 'processo', 'valor', 'estado'], filters: [{ k: 'q', t: 'q', ph: 'Referência do recibo, nome ou processo' }, '~data'], search: ['recibo', 'aluno', 'processo'], actions: [printRec] })],
        ['Imprimir', T('pagamentos', { where: (r) => r.data === A.TODAY, cols: ['recibo', 'hora', 'aluno', 'valor', 'metodo'], actions: [printRec], empty: 'Sem recibos emitidos hoje.' })],
        ['Reimprimir', T('pagamentos', { cols: ['recibo', 'data', 'aluno', 'valor', 'estado'], filters: ['q', '~data'], actions: [{ l: '2.ª via', icon: 'refresh', reason: 'Motivo da reimpressão', fn: (r) => setTimeout(() => A.print('Recibo (2.ª via)', A.docs.recibo([r]).replace('</h2>', ' — 2.ª via</h2>')), 200), log: 'Reimpressão de recibo', done: 'Segunda via emitida.' }] })]
      ]),
      tab('dividas', 'Dívidas', 'alert', [
        ['Vencidas', T('cobrancas', { where: (r) => r.estado === 'Vencido', filters: ['q', 'turma', 'descricao'], tools: [payTool, { l: 'Notificar devedores', icon: 'send', fn: (ctx, api) => { const n = A.uniq(api.filtered().map((r) => r.alunoId)).length; ctx.log('Tesouraria', 'Notificação de dívida', `${n} encarregados`); ctx.save(); A.toast(`Notificação enviada a ${n} encarregados (SMS e portal).`); } }], footNote: (rows) => `Total: ${A.money(A.sum(rows, 'divida'))}` })],
        ['Parciais', T('cobrancas', { where: (r) => r.estado === 'Parcial', filters: ['q', 'turma'], tools: [payTool], footNote: (rows) => `Em falta: ${A.money(A.sum(rows, 'divida'))}` })],
        ['Pendentes', T('cobrancas', { where: (r) => r.estado === 'Pendente', filters: ['q', 'turma', 'descricao'], footNote: (rows) => `A vencer: ${A.money(A.sum(rows, 'divida'))}` })],
        ['Acordos autorizados', T('acordos', { create: 'Propor acordo', defaults: () => ({ estado: 'Por aprovar', inicio: '2026-11-05', autorizado: '—' }), onCreate: (r, ctx) => ctx.db.aprovacoes.unshift({ id: A.uid('AP'), tipo: 'Pedido', titulo: `Acordo de pagamento — ${r.aluno}`, responsavel: ctx.user.nome, data: A.now(), motivo: 'Plano de regularização de dívida em prestações.', dados: { Aluno: r.aluno, Dívida: A.money(r.divida), Prestações: String(r.prestacoes) }, destino: 'direcao', ref: r.id, estado: 'Pendente', historico: [] }), createDone: 'Acordo submetido para autorização da direção.' })]
      ]),
      tab('descontos', 'Descontos e bolsas', 'star', [
        ['Benefícios', T('beneficios', { filters: ['q', 'tipo', 'estado'], ro: 1 })],
        ['Pedidos de autorização', T('alunos', { where: (r) => r.estado === 'Ativa' && r.bolsa === '—', cols: ['processo', 'nome', 'turma', 'encarregado'], filters: ['q', 'turma'], note: 'Descontos e bolsas são concedidos apenas com autorização do diretor-geral.', actions: [{ l: 'Pedir desconto', icon: 'star', open: (r, ctx) => A.modal({ title: 'Pedido de desconto', sub: esc(r.nome), size: 'sm', body: A.formHtml([{ k: 'pct', l: 'Percentagem', o: ['10%', '25%', '50%', '100%'], req: 1 }, { k: 'tipo', l: 'Tipo', o: ['Desconto irmãos', 'Apoio social', 'Bolsa de mérito', 'Desconto funcionário'], req: 1 }, { k: 'motivo', l: 'Fundamentação', t: 'area', req: 1 }]), actions: [{ l: 'Cancelar' }, { l: 'Submeter', cls: 'primary', fn: (b) => { const v = A.readForm(b, [{ k: 'pct', req: 1 }, { k: 'tipo', req: 1 }, { k: 'motivo', req: 1 }]); if (!v) return false; ctx.db.aprovacoes.unshift({ id: A.uid('AP'), tipo: 'Desconto', titulo: `${v.tipo} de ${v.pct} — ${r.nome}`, responsavel: ctx.user.nome, data: A.now(), motivo: v.motivo, dados: { Aluno: r.nome, Turma: r.turma, Percentagem: v.pct, Validade: A.YEAR }, destino: 'direcao', ref: r.id, estado: 'Pendente', historico: [] }); ctx.log('Tesouraria', 'Pedido de desconto', `${r.nome} — ${v.pct}`); ctx.save(); A.toast('Pedido submetido ao diretor-geral.'); } }] }) }] })]
      ]),
      tab('caixa', 'Caixa', 'cash', [['Abertura, movimentos e fecho', { v: 'cashbox' }], ['Diferenças', H((ctx) => A.section('Fechos com diferença', A.list(ctx.db.caixa.historico.filter((h) => h.diferenca).map((h) => ({ tone: 'bad', t: `${A.date(h.data)} — ${h.operador}`, m: `Esperado ${A.money(h.fundo + h.entradas - h.saidas)} · contado ${A.money(h.contado)}`, r: `<b class="neg">${A.money(h.diferenca)}</b>` })), 'Sem diferenças registadas.')))]]),
      tab('bancos', 'Bancos e pagamentos digitais', 'bank', [
        ['Transferências', T('pagamentos', { where: (r) => r.metodo === 'Transferência', filters: ['q', 'estado', '~data'], actions: [{ l: 'Confirmar', icon: 'check', when: (r) => r.estado === 'Por confirmar', set: { estado: 'Confirmado' } }] })],
        ['Referências', need('pagdigitais', T('pagamentos', { where: (r) => r.metodo === 'Referência' }))],
        ['Reconciliação', T('extratos', { filters: ['q', 'banco', 'reconciliado'], actions: [{ l: 'Reconciliar', icon: 'check', when: (r) => r.reconciliado === 'Não', set: { reconciliado: 'Sim' }, log: 'Reconciliação bancária' }], top: (ctx) => `<div class="kpis mini">${ctx.db.bancos.map((b) => A.kpi(b.banco, A.money(b.saldo), b.conta)).join('')}</div>` })]
      ]),
      tab('estornos', 'Anulações e estornos', 'undo', [
        ['Solicitações', T('estornos', { create: 'Nova solicitação', form: ['tipo', 'recibo', 'motivo'], defaults: (ctx) => ({ data: A.TODAY, estado: 'Pendente', solicitante: ctx.user.nome }), validate: (v, ctx) => (!ctx.db.pagamentos.some((p) => p.recibo === v.recibo) ? 'Recibo não encontrado (ex.: RC 2026/00012).' : ctx.db.estornos.some((e) => e.recibo === v.recibo && e.estado === 'Pendente') ? 'Já existe um pedido pendente para este recibo.' : null), onCreate: (r, ctx) => { const p = ctx.db.pagamentos.find((x) => x.recibo === r.recibo); r.aluno = p.aluno; r.valor = p.valor; r.id = A.uid('ES'); ctx.db.aprovacoes.unshift({ id: A.uid('AP'), tipo: 'Anulação', titulo: `${r.tipo} do recibo ${r.recibo}`, responsavel: ctx.user.nome, data: A.now(), motivo: r.motivo, dados: { Recibo: r.recibo, Aluno: r.aluno, Valor: A.money(r.valor) }, destino: 'direcao', ref: r.id, estado: 'Pendente', historico: [] }); }, critCreate: 1, createDone: 'Pedido enviado para aprovação da direção.', where: (r) => r.estado === 'Pendente' })],
        ['Histórico', T('estornos', { filters: ['q', 'tipo', 'estado'], ro: 1 })]
      ]),
      tab('relatorios', 'Relatórios', 'chart', [
        ['Por período', R(() => [{ t: 'Receitas por dia', ds: 'pagamentos', group: 'data', gl: 'Data', sum: 'valor' }, { t: 'Receitas por mês', ds: 'pagamentos', group: (r) => r.data.slice(0, 7), gl: 'Mês', sum: 'valor' }])],
        ['Por operador', R(() => [{ t: 'Receitas por operador', ds: 'pagamentos', group: 'operador', gl: 'Operador', sum: 'valor' }])],
        ['Por turma', R(() => [{ t: 'Receitas por turma', ds: 'pagamentos', group: 'turma', gl: 'Turma', sum: 'valor' }, { t: 'Dívida por turma', ds: 'cobrancas', where: (r) => r.estado !== 'Pago', group: 'turma', gl: 'Turma', sum: 'divida' }])],
        ['Por tipo de cobrança', R(() => [{ t: 'Cobrado por tipo', ds: 'cobrancas', group: 'tipo', gl: 'Tipo', sum: 'pago' }, { t: 'Receitas por método', ds: 'pagamentos', group: 'metodo', gl: 'Método', sum: 'valor' }])]
      ]),
      PROFILE()
    ]
  };

  /* =====================================================================
     9. CONTABILISTA
     ===================================================================== */
  const balancete = (db) => { const acc = {}; db.lancamentos.forEach((l) => { [[l.debito, 'd'], [l.credito, 'c']].forEach(([c, s]) => { acc[c] = acc[c] || { conta: c, debito: 0, credito: 0 }; acc[c][s === 'd' ? 'debito' : 'credito'] += l.valor; }); }); return Object.values(acc).map((a) => ({ ...a, saldo: a.debito - a.credito })).sort((a, b) => (a.conta > b.conta ? 1 : -1)); };
  const CONT = {
    id: 'cont', nome: 'Contabilista', short: 'Contabilidade', mod: 'Contabilidade', perms: ['fin'],
    user: () => ({ nome: 'Rui Fortunato', email: 'rui.fortunato@acura.ao', telefone: '+244 923 000 501', morada: 'Benfica, Luanda' }),
    tabs: [
      tab('dashboard', 'Dashboard contabilístico', 'home', [
        ['Resumo', D((ctx) => { const db = ctx.db; const rec = Q.rec(db, '2026-10'); const dep = A.sum(db.despesas.filter((d) => d.data.startsWith('2026-10')), 'valor'); return [
          ['Receitas (out.)', A.money(rec), '', 'ok', 'trend'], ['Despesas (out.)', A.money(dep), '', 'bad', 'trendDown'], ['Resultado (out.)', A.money(rec - dep), rec - dep >= 0 ? 'positivo' : 'negativo', rec - dep >= 0 ? 'ok' : 'bad', 'chart'], ['Saldo em bancos e caixa', A.money(A.sum(db.bancos, 'saldo')), `${db.bancos.length} contas`, '', 'bank']]; },
        (ctx) => { const db = ctx.db; return [
          ['Receitas vs. despesas', A.bars([['Receitas set.', Q.rec(db, '2026-09'), 'ok'], ['Despesas set.', A.sum(db.despesas.filter((d) => d.data.startsWith('2026-09')), 'valor'), 'bad'], ['Receitas out.', Q.rec(db, '2026-10'), 'ok'], ['Despesas out.', A.sum(db.despesas.filter((d) => d.data.startsWith('2026-10')), 'valor'), 'bad']], { money: true })],
          ['Despesas por categoria', A.bars(byKey(db.despesas, 'categoria', 'valor'), { money: true })],
          ['Saldos', A.list(db.bancos.map((b) => ({ icon: 'bank', t: b.banco, m: b.conta, r: `<b>${A.money(b.saldo)}</b>` })))],
          ['Pendências', A.list([{ tone: 'warn', t: `${db.extratos.filter((e) => e.reconciliado === 'Não').length} movimentos bancários por reconciliar` }, { tone: 'warn', t: `${db.despesas.filter((d) => d.estado === 'Pendente').length} despesas por pagar`, m: A.money(A.sum(db.despesas.filter((d) => d.estado === 'Pendente'), 'valor')) }, { tone: 'info', t: 'Fecho de outubro em conferência' }, { tone: 'bad', t: 'IRT e INSS de outubro: prazo 10/11/2026' }])]]; })],
        ['Pendências', AL((ctx) => { const db = ctx.db; return [{ t: `${db.extratos.filter((e) => e.reconciliado === 'Não').length} movimentos bancários por reconciliar`, tone: 'warn', go: 'caixa/2' }, { t: `${db.despesas.filter((d) => d.estado === 'Pendente').length} faturas de fornecedores por pagar`, tone: 'warn', go: 'despesas/1' }, { t: 'Fecho contabilístico de outubro em conferência', tone: 'info', go: 'fecho/1' }, ...db.impostos.filter((i) => i.estado === 'Por submeter').map((i) => ({ t: `${i.obrigacao} — prazo ${A.date(i.prazo)}`, m: A.money(i.valor), tone: 'bad', go: 'impostos/0' }))]; })]
      ]),
      tab('plano', 'Plano de contas', 'list', [
        ['Contas', T('planoContas', { create: 'Nova conta', actions: ['edit'], filters: ['q', 'tipo'], validate: (v, ctx, cur) => (ctx.db.planoContas.some((c) => c.codigo === v.codigo && c !== cur) ? 'Código de conta já existe.' : null) })],
        ['Classificações', H((ctx) => `<div class="cards3">${A.uniq(ctx.db.planoContas.map((c) => c.tipo)).map((t) => A.section(t, A.list(ctx.db.planoContas.filter((c) => c.tipo === t).map((c) => ({ t: `${c.codigo} — ${c.nome}`, m: c.natureza }))))).join('')}</div>`)]
      ]),
      tab('movimentos', 'Movimentos', 'swap', [
        ['Lançamentos', T('lancamentos', { create: 'Novo lançamento', filters: ['q', 'diario', 'estado', '~data'], defaults: () => ({ data: A.TODAY, estado: 'Lançado', diario: 'Operações diversas' }), validate: (v) => (v.debito === v.credito ? 'As contas a débito e a crédito devem ser diferentes.' : v.data < '2026-10-01' ? 'O período de setembro está fechado.' : null), actions: [{ l: '', icon: 'edit', title: 'Editar', when: (r) => r.estado !== 'Fechado', open: () => A.toast('Para corrigir lançamentos use um estorno contabilístico.', 'warn') }], footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}` })],
        ['Documentos de suporte', T('lancamentos', { cols: ['data', 'documento', 'descricao', 'valor'], filters: ['q', '~data'], ro: 1 })]
      ]),
      tab('receitas', 'Receitas', 'trend', [
        ['Propinas', T('pagamentos', { where: (r) => r.descricao.startsWith('Propina'), filters: ['q', '~data', 'metodo'], ro: 1, footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}` })],
        ['Matrículas', T('pagamentos', { where: (r) => r.descricao.startsWith('Matrícula'), filters: ['q', '~data'], ro: 1, footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}` })],
        ['Vendas', T('vendas', { filters: ['q', '~data', 'metodo'], ro: 1, footNote: (rows) => `Total: ${A.money(A.sum(rows, 'total'))}` })],
        ['Outras entradas', T('pagamentos', { where: (r) => !/^(Propina|Matrícula)/.test(r.descricao), filters: ['q', '~data'], ro: 1, footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}` })]
      ]),
      tab('despesas', 'Despesas', 'trendDown', [
        ['Fornecedores', T('fornecedores', { create: 'Novo fornecedor', actions: ['edit'], filters: ['q', 'categoria'] })],
        ['Pagamentos', T('despesas', { create: 'Registar despesa', defaults: () => ({ data: A.TODAY, estado: 'Pendente' }), filters: ['q', 'estado', 'fornecedor', '~data'], actions: [{ l: 'Marcar como paga', icon: 'check', when: (r) => r.estado === 'Pendente', confirm: 'Confirmar o pagamento desta despesa?', set: { estado: 'Pago' }, log: 'Pagamento de despesa' }], footNote: (rows) => `Total: ${A.money(A.sum(rows, 'valor'))}` })],
        ['Despesas operacionais', H((ctx) => `<div class="grid2">${A.section('Por categoria', A.bars(byKey(ctx.db.despesas, 'categoria', 'valor'), { money: true }))}${A.section('Por fornecedor', A.bars(byKey(ctx.db.despesas, 'fornecedor', 'valor'), { money: true }))}</div>`)]
      ]),
      tab('caixa', 'Caixa e bancos', 'bank', [
        ['Movimentos', T('bancos', { ro: 1, noDetail: 1, footNote: (rows) => `Saldo total: ${A.money(A.sum(rows, 'saldo'))}` })],
        ['Extratos', T('extratos', { filters: ['q', 'banco', '~data'], ro: 1 })],
        ['Reconciliação', T('extratos', { where: (r) => r.reconciliado === 'Não', actions: [{ l: 'Reconciliar', icon: 'check', set: { reconciliado: 'Sim' }, log: 'Reconciliação bancária' }], empty: 'Todos os movimentos estão reconciliados.' })]
      ]),
      tab('documentos', 'Documentos', 'file', [
        ['Faturas', T('despesas', { cols: ['documento', 'data', 'fornecedor', 'valor', 'estado'], filters: ['q', '~data'], ro: 1 })],
        ['Recibos', T('pagamentos', { cols: ['recibo', 'data', 'aluno', 'valor', 'estado'], filters: ['q', '~data'], ro: 1, actions: [printRec] })],
        ['Notas e comprovativos', T('lancamentos', { cols: ['documento', 'data', 'descricao', 'valor'], filters: ['q'], ro: 1 })]
      ]),
      tab('contabilidade', 'Contabilidade', 'book', [
        ['Diário', need('contabilidade', T('lancamentos', { filters: ['q', 'diario', '~data'], ro: 1, sort: 'data' }))],
        ['Razão', need('contabilidade', H((ctx) => { const acc = A.uniq(ctx.db.lancamentos.flatMap((l) => [l.debito, l.credito])).sort(); return `<div class="toolbar"><label class="inline"><span>Conta</span><select data-acc>${acc.map((a) => `<option>${esc(a)}</option>`).join('')}</select></label></div><div data-razao></div>`; }, (el, ctx) => { const draw = () => { const c = el.querySelector('[data-acc]').value; let s = 0; const rows = ctx.db.lancamentos.filter((l) => l.debito === c || l.credito === c).sort((a, b) => (a.data > b.data ? 1 : -1)); el.querySelector('[data-razao]').innerHTML = `<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Descrição</th><th class="r">Débito</th><th class="r">Crédito</th><th class="r">Saldo</th></tr></thead><tbody>${rows.map((l) => { const d = l.debito === c ? l.valor : 0; const cr = l.credito === c ? l.valor : 0; s += d - cr; return `<tr><td>${A.date(l.data)}</td><td>${esc(l.descricao)}</td><td class="r">${d ? A.money(d) : ''}</td><td class="r">${cr ? A.money(cr) : ''}</td><td class="r"><b>${A.money(s)}</b></td></tr>`; }).join('')}</tbody></table></div></div>`; }; el.querySelector('[data-acc]').onchange = draw; draw(); }))],
        ['Balancetes', need('contabilidade', H((ctx) => { const b = balancete(ctx.db); return A.section('Balancete — outubro 2026 (acumulado)', `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Conta</th><th class="r">Débito</th><th class="r">Crédito</th><th class="r">Saldo</th></tr></thead><tbody>${b.map((x) => `<tr><td>${esc(x.conta)}</td><td class="r">${A.money(x.debito)}</td><td class="r">${A.money(x.credito)}</td><td class="r"><b>${A.money(x.saldo)}</b></td></tr>`).join('')}<tr class="tot"><td>Total</td><td class="r">${A.money(A.sum(b, 'debito'))}</td><td class="r">${A.money(A.sum(b, 'credito'))}</td><td class="r">${A.money(A.sum(b, 'saldo'))}</td></tr></tbody></table></div>`); }))]
      ]),
      tab('impostos', 'Impostos', 'tag', [
        ['Obrigações configuradas', T('impostos', { ro: 1, noDetail: 1, note: 'Obrigações básicas calculadas a partir das remunerações. Os mapas fiscais completos requerem o módulo “Fiscalidade avançada”.' })],
        ['Mapas fiscais', need('fiscal', H(() => ''))]
      ]),
      tab('fecho', 'Fecho contabilístico', 'lock', [
        ['Conferência', H((ctx) => { const db = ctx.db; const b = balancete(db); const checks = [['Débito igual a crédito no balancete', A.sum(b, 'debito') === A.sum(b, 'credito')], ['Todos os recibos do mês lançados', true], ['Movimentos bancários reconciliados', db.extratos.every((e) => e.reconciliado === 'Sim')], ['Despesas com documento de suporte', db.despesas.every((d) => d.documento)], ['Caixa fechado sem diferenças', db.caixa.historico.every((h) => !h.diferenca)]]; return A.section('Conferência — outubro 2026', `<ul class="checks">${checks.map(([l, v]) => `<li class="${v ? 'ok' : 'bad'}">${A.icon(v ? 'checkCircle' : 'alert')}${esc(l)}</li>`).join('')}</ul><p class="muted mt">Resolva as inconformidades antes de solicitar a autorização de fecho à direção.</p>`); })],
        ['Fecho de períodos', T('fechos', { actions: [{ l: 'Solicitar autorização', icon: 'send', when: (r) => r.estado === 'Em conferência', confirm: 'Enviar o período para autorização de fecho pelo diretor-geral?', log: 'Pedido de fecho', done: 'Pedido enviado ao diretor-geral.' }] })],
        ['Relatórios', R(() => [{ t: 'Demonstração de resultados (simplificada)', rows: (ctx) => [{ rubrica: 'Proveitos — propinas e matrículas', valor: A.sum(ctx.db.pagamentos, 'valor') }, { rubrica: 'Proveitos — vendas', valor: A.sum(ctx.db.vendas, 'total') }, { rubrica: 'Custos com pessoal', valor: -A.sum(ctx.db.despesas.filter((d) => d.categoria === 'Salários'), 'valor') }, { rubrica: 'Fornecimentos e serviços', valor: -A.sum(ctx.db.despesas.filter((d) => d.categoria !== 'Salários'), 'valor') }], cols: [{ k: 'rubrica', l: 'Rubrica' }, { k: 'valor', l: 'Valor', t: 'money' }] }, { t: 'Balancete', rows: (ctx) => balancete(ctx.db), cols: [{ k: 'conta', l: 'Conta' }, { k: 'debito', l: 'Débito', t: 'money' }, { k: 'credito', l: 'Crédito', t: 'money' }, { k: 'saldo', l: 'Saldo', t: 'money' }] }])]
      ]),
      tab('exportacoes', 'Exportações', 'download', [
        ['Excel (CSV)', R(() => [{ t: 'Lançamentos contabilísticos', ds: 'lancamentos', cols: ['data', 'diario', 'debito', 'credito', 'descricao', 'valor', 'documento'] }, { t: 'Recibos emitidos', ds: 'pagamentos', cols: ['recibo', 'data', 'aluno', 'valor', 'metodo'] }, { t: 'Despesas', ds: 'despesas', cols: ['data', 'documento', 'fornecedor', 'valor', 'estado'] }])],
        ['PDF', R(() => [{ t: 'Diário (PDF)', ds: 'lancamentos', cols: ['data', 'descricao', 'debito', 'credito', 'valor'] }, { t: 'Balancete (PDF)', rows: (ctx) => balancete(ctx.db), cols: [{ k: 'conta', l: 'Conta' }, { k: 'debito', l: 'Débito', t: 'money' }, { k: 'credito', l: 'Crédito', t: 'money' }, { k: 'saldo', l: 'Saldo', t: 'money' }] }])],
        ['Formatos contabilísticos', need('fiscal', H(() => ''))]
      ]),
      tab('auditoria', 'Auditoria financeira', 'history', [
        ['Histórico de movimentos', T('auditoria', { where: (r) => ['Tesouraria', 'Contabilidade'].includes(r.modulo), filters: ['q', 'acao', '~data'] })],
        ['Ajustes', T('auditoria', { where: (r) => /Anulação|Estorno|Ajuste|Fecho/.test(r.acao), filters: ['q', '~data'] })]
      ]),
      PROFILE()
    ]
  };

  /* =====================================================================
     10. RESPONSÁVEL DE STOCK
     ===================================================================== */
  const recalc = (a) => { a.estado = a.qtd <= 0 ? 'Esgotado' : a.qtd < a.minimo ? 'Crítico' : 'Normal'; };
  const stockMove = (tipo, sign, extra = {}) => T('movStock', { where: (r) => r.tipo === tipo, filters: ['q', '~data'], create: `Registar ${tipo.toLowerCase()}`, form: ['codigo', 'qtd', 'documento', 'origem'], defaults: (ctx) => ({ tipo, data: A.TODAY, operador: ctx.user.nome }), validate: (v, ctx) => { const a = ctx.db.artigos.find((x) => x.codigo === v.codigo); if (!a) return 'Código de artigo inexistente.'; if (!(v.qtd > 0)) return 'Quantidade inválida.'; if (sign < 0 && a.qtd < v.qtd) return `Stock insuficiente (${a.qtd} disponíveis).`; return null; }, onCreate: (r, ctx) => { const a = ctx.db.artigos.find((x) => x.codigo === r.codigo); a.qtd += sign * r.qtd; recalc(a); r.artigo = `${a.nome}${a.variante !== '—' ? ' ' + a.variante : ''}`; }, ...extra });
  const STOCK = {
    id: 'stock', nome: 'Responsável de stock', short: 'Stock', mod: 'Stock', perms: [],
    user: () => ({ nome: 'Paulo Sebastião', email: 'paulo.sebastiao@acura.ao', telefone: '+244 923 000 601', morada: 'Cazenga, Luanda' }),
    badges: { minimo: (ctx) => ctx.db.artigos.filter((a) => a.estado !== 'Normal').length },
    tabs: [
      tab('dashboard', 'Dashboard de stock', 'home', [
        ['Quantidades', D((ctx) => { const db = ctx.db; return [['Artigos', db.artigos.length, `${A.uniq(db.artigos.map((a) => a.categoria)).length} categorias`, '', 'box'], ['Unidades em stock', A.num(A.sum(db.artigos, 'qtd')), '', '', 'archive'], ['Valor do stock (custo)', A.money(A.sum(db.artigos, (a) => a.qtd * a.custo)), '', '', 'wallet'], ['Artigos críticos', db.artigos.filter((a) => a.estado !== 'Normal').length, `${db.artigos.filter((a) => a.estado === 'Esgotado').length} esgotados`, 'bad', 'alert']]; },
          (ctx) => { const db = ctx.db; return [['Stock por categoria', A.bars(byKey(db.artigos, 'categoria', 'qtd'))], ['Artigos críticos', A.list(db.artigos.filter((a) => a.estado !== 'Normal').map((a) => ({ tone: a.estado === 'Esgotado' ? 'bad' : 'warn', t: `${a.nome} ${a.variante !== '—' ? a.variante : ''}`, m: `${a.qtd} un. · mínimo ${a.minimo}`, r: A.badge(a.estado) }))), { go: 'minimo/0' }], ['Movimentos recentes', A.list(db.movStock.slice(0, 7).map((m) => ({ tone: m.tipo === 'Entrada' ? 'ok' : 'info', t: `${m.tipo}: ${m.artigo} × ${m.qtd}`, m: `${A.date(m.data)} · ${m.documento}` }))), { go: 'movimentos/0' }], ['Vendas por artigo (set.–out.)', A.bars(byKey(db.vendas, 'artigo', 'total').slice(0, 8), { money: true })]]; })],
        ['Artigos críticos', T('artigos', { where: (r) => r.estado !== 'Normal', ro: 1 })],
        ['Movimentos recentes', T('movStock', { ro: 1, filters: ['tipo'] })]
      ]),
      tab('artigos', 'Artigos', 'box', [
        ['Cadastro', T('artigos', { create: 'Novo artigo', actions: ['edit'], filters: ['q', 'categoria', 'estado'], defaults: () => ({ unidade: 'Un.', qtd: 0, variante: '—' }), onCreate: (r) => { r.id = A.uid('AR'); recalc(r); }, onSave: recalc, validate: (v, ctx, cur) => (ctx.db.artigos.some((a) => a.codigo === v.codigo && a !== cur) ? 'Código já existente.' : null) })],
        ['Categorias', H((ctx) => `<div class="cards3">${A.uniq(ctx.db.artigos.map((a) => a.categoria)).map((c) => { const l = ctx.db.artigos.filter((a) => a.categoria === c); return A.section(c, A.kv({ Artigos: l.length, Unidades: A.sum(l, 'qtd'), 'Valor (custo)': A.money(A.sum(l, (a) => a.qtd * a.custo)) })); }).join('')}</div>`)],
        ['Códigos', T('artigos', { cols: ['codigo', 'nome', 'categoria', 'unidade'], ro: 1 })],
        ['Tamanhos e variantes', T('artigos', { where: (r) => r.variante !== '—', cols: ['codigo', 'nome', 'variante', 'qtd', 'estado'], filters: ['q', 'nome'], ro: 1 })]
      ]),
      tab('entradas', 'Entradas', 'download', [
        ['Compras', T('compras', { filters: ['q', 'fornecedor', 'estado'], ro: 1 })],
        ['Receção', stockMove('Entrada', 1)],
        ['Devoluções a fornecedores', stockMove('Devolução a fornecedor', -1)]
      ]),
      tab('saidas', 'Saídas', 'upload', [['Vendas', T('movStock', { where: (r) => r.tipo === 'Venda', ro: 1, filters: ['q', '~data'] })], ['Entregas', stockMove('Saída', -1)], ['Perdas', stockMove('Perda', -1, { noteTone: 'warn', note: 'As perdas ficam registadas na auditoria de stock.' })], ['Consumo interno', stockMove('Consumo interno', -1)]]),
      tab('vendas', 'Vendas', 'tag', [
        ['Nova venda', { v: 'form', title: 'Venda de batas, livros e materiais', mod: 'Stock', logAction: 'Venda', fields: [{ k: 'artigo', l: 'Artigo', req: 1, o: (db) => db.artigos.filter((a) => a.preco > 0).map((a) => `${a.codigo} — ${a.nome}${a.variante !== '—' ? ' ' + a.variante : ''} (${a.qtd} un. · ${A.money(a.preco)})`) }, { k: 'qtd', l: 'Quantidade', t: 'num', req: 1 }, { k: 'cliente', l: 'Cliente (aluno ou encarregado)', req: 1 }, { k: 'metodo', l: 'Pagamento', o: ['Numerário', 'Multicaixa Express', 'TPA'], req: 1 }], get: () => ({ qtd: 1 }),
          validate: (v, ctx) => { const a = ctx.db.artigos.find((x) => v.artigo.startsWith(x.codigo + ' —')); if (!(v.qtd > 0)) return 'Quantidade inválida.'; if (a.qtd < v.qtd) return `Stock insuficiente: ${a.qtd} unidade(s) disponível(eis).`; return null; },
          set: (ctx, v) => { const db = ctx.db; const a = db.artigos.find((x) => v.artigo.startsWith(x.codigo + ' —')); a.qtd -= v.qtd; recalc(a); const doc = `VD ${2000 + db.vendas.length}`; const nm = `${a.nome}${a.variante !== '—' ? ' ' + a.variante : ''}`; db.vendas.unshift({ id: A.uid('VD'), documento: doc, data: A.TODAY, cliente: v.cliente, artigo: nm, qtd: v.qtd, total: v.qtd * a.preco, metodo: v.metodo, estado: 'Concluída' }); db.movStock.unshift({ id: A.uid('MV'), data: A.TODAY, tipo: 'Venda', artigo: nm, codigo: a.codigo, qtd: v.qtd, documento: doc, operador: ctx.user.nome, origem: v.cliente }); A.toast(`Venda ${doc}: ${A.money(v.qtd * a.preco)}.`); }, done: 'Venda registada e stock atualizado.', after: () => A.go('vendas', 1) }],
        ['Histórico de vendas', T('vendas', { filters: ['q', 'metodo', '~data'], actions: [{ l: 'Anular', icon: 'x', cls: 'ghost danger', when: (r) => r.estado === 'Concluída', reason: 1, fn: (r, ctx) => { r.estado = 'Anulada'; const a = ctx.db.artigos.find((x) => r.artigo.startsWith(x.nome) && (x.variante === '—' || r.artigo.endsWith(x.variante))); if (a) { a.qtd += r.qtd; recalc(a); } }, log: 'Anulação de venda', crit: 1 }], footNote: (rows) => `Total: ${A.money(A.sum(rows.filter((r) => r.estado !== 'Anulada'), 'total'))}` })]
      ]),
      tab('devolucoes', 'Devoluções', 'undo', [
        ['Devoluções de clientes', T('devolucoes', { create: 'Registar devolução', defaults: () => ({ data: A.TODAY, tratamento: 'Pendente', estado: 'Pendente' }), filters: ['q', 'estado'] })],
        ['Tratamento', T('devolucoes', { where: (r) => r.estado === 'Pendente', actions: [{ l: 'Troca', icon: 'swap', set: { tratamento: 'Troca', estado: 'Concluída' } }, { l: 'Reembolso', icon: 'cash', confirm: 'Autorizar reembolso ao cliente?', set: { tratamento: 'Reembolso', estado: 'Concluída' }, crit: 1 }], empty: 'Sem devoluções pendentes.' })]
      ]),
      tab('inventario', 'Inventário', 'clipboard', [
        ['Contagem física', T('inventario', { actions: [{ l: 'Registar contagem', icon: 'edit', open: (r, ctx, refresh) => A.modal({ title: 'Contagem física', sub: esc(r.artigo), size: 'sm', body: A.formHtml([{ k: 'contado', l: 'Quantidade contada', t: 'num', req: 1 }], r), actions: [{ l: 'Cancelar' }, { l: 'Guardar', cls: 'primary', fn: (b) => { const v = A.readForm(b, [{ k: 'contado', t: 'num', req: 1 }]); if (!v) return false; r.contado = v.contado; r.diferenca = v.contado - r.sistema; r.estado = r.diferenca ? 'Com diferença' : 'Conferido'; ctx.save(); refresh(); } }] }) }], filters: ['q', 'estado'] })],
        ['Diferenças', T('inventario', { where: (r) => r.diferenca !== 0 && r.estado !== 'Ajustado', ro: 1, empty: 'Sem diferenças por tratar.' })],
        ['Ajustes autorizados', T('inventario', { where: (r) => r.diferenca !== 0, noteTone: 'warn', note: 'Os ajustes alteram o stock do sistema e ficam registados como operação crítica na auditoria.', actions: [{ l: 'Ajustar stock', icon: 'check', when: (r) => r.estado !== 'Ajustado', reason: 'Justificação do ajuste', fn: (r, ctx) => { const a = ctx.db.artigos.find((x) => x.codigo === r.codigo); a.qtd = r.contado; recalc(a); ctx.db.movStock.unshift({ id: A.uid('MV'), data: A.TODAY, tipo: 'Ajuste', artigo: r.artigo, codigo: r.codigo, qtd: r.diferenca, documento: 'Inventário', operador: ctx.user.nome, origem: 'Interno' }); r.estado = 'Ajustado'; r.sistema = r.contado; }, log: 'Ajuste de inventário', crit: 1 }] })]
      ]),
      tab('minimo', 'Stock mínimo', 'alert', [['Alertas de reposição', T('artigos', { where: (r) => r.estado === 'Crítico', cols: ['codigo', 'nome', 'variante', 'qtd', 'minimo', 'estado'], ro: 1 })], ['Artigos esgotados', T('artigos', { where: (r) => r.estado === 'Esgotado', cols: ['codigo', 'nome', 'variante', 'qtd', 'minimo', 'estado'], ro: 1 })]]),
      tab('fornecedores', 'Fornecedores', 'truck', [['Cadastro', T('fornecedores', { create: 'Novo fornecedor', actions: ['edit'] })], ['Contactos', T('fornecedores', { cols: ['nome', 'contacto', 'telefone', 'email'], ro: 1 })], ['Histórico de compras', T('compras', { filters: ['q', 'fornecedor', '~data'], ro: 1 })]]),
      tab('precos', 'Preços', 'wallet', [
        ['Custos e preços de venda', T('precos', { actions: ['edit'], form: ['custo', 'preco'], validate: (v) => (v.preco && v.preco < v.custo ? 'O preço de venda não pode ser inferior ao custo.' : null), onSave: (r, ctx) => { r.margem = r.preco ? Math.round(((r.preco - r.custo) / r.preco) * 100) + '%' : '—'; r.atualizado = A.TODAY; const a = ctx.db.artigos.find((x) => x.codigo === r.codigo); if (a) { a.custo = r.custo; a.preco = r.preco; } }, critEdit: 1 })],
        ['Alterações autorizadas', T('auditoria', { where: (r) => r.modulo === 'Stock', filters: ['q', 'acao'], empty: 'Sem alterações registadas.' })]
      ]),
      tab('movimentos', 'Movimentos', 'swap', [['Entradas, saídas e transferências', T('movStock', { filters: ['q', 'tipo', '~data'], ro: 1 })]]),
      tab('relatorios', 'Relatórios', 'chart', [['Inventário e valorização', R(() => [{ t: 'Inventário atual', ds: 'artigos', cols: ['codigo', 'nome', 'variante', 'qtd', 'estado'] }, { t: 'Valorização do stock', rows: (ctx) => ctx.db.artigos.map((a) => ({ codigo: a.codigo, nome: a.nome, qtd: a.qtd, valor: a.qtd * a.custo })), cols: [{ k: 'codigo', l: 'Código' }, { k: 'nome', l: 'Artigo' }, { k: 'qtd', l: 'Qtd.', t: 'num' }, { k: 'valor', l: 'Valor (custo)', t: 'money' }] }])], ['Vendas e rotação', R(() => [{ t: 'Vendas por artigo', ds: 'vendas', group: 'artigo', gl: 'Artigo', sum: 'total' }, { t: 'Rotação (unidades vendidas)', ds: 'vendas', group: 'artigo', gl: 'Artigo', sum: 'qtd', st: 'num', sl: 'Unidades' }, { t: 'Movimentos por tipo', ds: 'movStock', group: 'tipo', gl: 'Tipo', sum: 'qtd', st: 'num', sl: 'Unidades' }])]]),
      PROFILE()
    ]
  };

  /* =====================================================================
     11. RECURSOS HUMANOS
     ===================================================================== */
  const RH = {
    id: 'rh', nome: 'Responsável de recursos humanos', short: 'Recursos humanos', mod: 'RH', perms: ['priv'],
    user: () => ({ nome: 'Marta Lopes', email: 'marta.lopes@acura.ao', telefone: '+244 923 000 701', morada: 'Rangel, Luanda' }),
    badges: { ferias: (ctx) => ctx.db.ausencias.filter((a) => a.estado === 'Pendente').length },
    tabs: [
      tab('dashboard', 'Dashboard de RH', 'home', [
        ['Resumo', D((ctx) => { const db = ctx.db; return [['Funcionários', db.funcionarios.length, `${db.funcionarios.filter((f) => f.tipo === 'Docente').length} docentes · ${db.funcionarios.filter((f) => f.tipo !== 'Docente').length} não docentes`, '', 'users'], ['Contratos a renovar', db.contratos.filter((c) => c.estado === 'A renovar').length, 'até 30/11/2026', 'warn', 'file'], ['Pedidos de ausência', db.ausencias.filter((a) => a.estado === 'Pendente').length, 'por decidir', 'warn', 'calendar'], ['Ausentes hoje', db.funcionarios.filter((f) => f.estado !== 'Ativo').length, 'férias ou licença', '', 'clock']]; },
          (ctx) => { const db = ctx.db; return [['Efetivo por departamento', A.bars(byKey(db.funcionarios, 'departamento'))], ['Contratos a renovar', A.list(db.contratos.filter((c) => c.estado === 'A renovar').map((c) => ({ tone: 'warn', t: c.colaborador, m: `${c.tipo} · termina ${A.date(c.fim)}` }))), { go: 'contratos/1' }], ['Assiduidade (outubro)', A.donut(byKey(db.assidRH, 'registo').map(([l, v]) => [l, v, { Presença: 'var(--ok)', Atraso: 'var(--warn)', Falta: 'var(--bad)' }[l]]), db.assidRH.length)], ['Pedidos pendentes', A.list(db.ausencias.filter((a) => a.estado === 'Pendente').map((a) => ({ tone: 'warn', t: `${a.tipo} — ${a.colaborador}`, m: `${A.date(a.inicio)} · ${a.dias} dia(s)` }))), { go: 'ferias/1' }]]; })],
        ['Contratos', T('contratos', { where: (r) => r.estado !== 'Vigente', ro: 1 })],
        ['Pendências', AL((ctx) => [...ctx.db.ausencias.filter((a) => a.estado === 'Pendente').map((a) => ({ t: `Pedido de ${a.tipo.toLowerCase()}: ${a.colaborador}`, m: `${a.dias} dia(s) a partir de ${A.date(a.inicio)}`, tone: 'warn', go: 'ferias/1' })), ...ctx.db.contratos.filter((c) => c.estado === 'A renovar').map((c) => ({ t: `Contrato a renovar: ${c.colaborador}`, m: `Termina a ${A.date(c.fim)}`, tone: 'bad', go: 'contratos/1' })), { t: 'Processamento salarial de outubro por executar', tone: 'warn', go: 'remuneracoes/1' }])]
      ]),
      tab('funcionarios', 'Funcionários', 'users', [
        ['Cadastro', T('funcionarios', { create: 'Novo funcionário', actions: ['edit'], defaults: () => ({ estado: 'Ativo', admissao: A.TODAY, tipo: 'Não docente', contrato: 'Termo certo' }), filters: ['q', 'departamento', 'tipo'] })],
        ['Pesquisa', T('funcionarios', { filters: ['q', 'departamento', 'tipo', 'contrato', 'estado', '~admissao'], ro: 1 })],
        ['Fichas profissionais', T('funcionarios', { cols: ['nome', 'cargo', 'departamento', 'admissao', 'salario', 'estado'], filters: ['q', 'departamento'], ro: 1 })]
      ]),
      tab('professores', 'Professores', 'grad', [['Dados profissionais', T('professores', { cols: ['nome', 'disciplinas', 'categoria', 'admissao', 'carga', 'estado'], actions: ['edit'], filters: ['q', 'categoria', 'estado'] })], ['Situação contratual', T('contratos', { where: (r) => r.cargo.startsWith('Professor'), filters: ['q', 'tipo', 'estado'], ro: 1 })]]),
      tab('contratos', 'Contratos', 'file', [
        ['Contratos', T('contratos', { create: 'Novo contrato', actions: ['edit'], filters: ['q', 'tipo', 'estado'], defaults: () => ({ inicio: A.TODAY, estado: 'Vigente' }) })],
        ['Renovações', T('contratos', { where: (r) => r.estado === 'A renovar', actions: [{ l: 'Renovar 1 ano', icon: 'refresh', cls: 'primary', confirm: 'Renovar o contrato por mais 12 meses?', set: (r) => ({ estado: 'Vigente', fim: `${+r.fim.slice(0, 4) + 1}${r.fim.slice(4)}` }), log: 'Renovação de contrato', crit: 1 }, { l: 'Não renovar', icon: 'x', cls: 'ghost danger', reason: 1, set: { estado: 'Expirado' }, crit: 1 }], empty: 'Sem contratos a renovar.' })],
        ['Documentos', T('contratos', { cols: ['colaborador', 'tipo', 'inicio', 'fim'], ro: 1, actions: [{ l: '', icon: 'printer', title: 'Imprimir contrato', read: 1, open: (r, ctx) => A.print('Contrato', `<div class="doc"><h2 class="doc-t">Contrato de trabalho — ${esc(r.tipo)}</h2><p class="doc-p">Entre ${esc(ctx.db.escola.nome)}, NIF ${ctx.db.escola.nif}, e ${esc(r.colaborador)}, para o exercício das funções de ${esc(r.cargo)}, com início a ${A.date(r.inicio)}${r.fim !== '—' ? ' e termo a ' + A.date(r.fim) : ' por tempo indeterminado'}.</p></div>`) }] })]
      ]),
      tab('assiduidade', 'Assiduidade', 'clock', [
        ['Presenças', T('assidRH', { where: (r) => r.registo === 'Presença', filters: ['q', 'departamento', '~data'], ro: 1 })],
        ['Faltas', T('assidRH', { where: (r) => r.registo === 'Falta', filters: ['q', 'departamento', '~data'], ro: 1 })],
        ['Atrasos', T('assidRH', { where: (r) => r.registo === 'Atraso', filters: ['q', 'departamento', '~data'], ro: 1 })],
        ['Justificações', T('assidRH', { where: (r) => r.registo !== 'Presença', actions: [{ l: 'Justificar', icon: 'check', when: (r) => ['Pendente', '—'].includes(r.justificacao), reason: 'Justificação', set: (r, c, reason) => ({ justificacao: reason }) }] })]
      ]),
      tab('ferias', 'Férias e ausências', 'calendar', [
        ['Pedidos', T('ausencias', { create: 'Novo pedido', defaults: () => ({ estado: 'Pendente', submetido: A.TODAY }), filters: ['q', 'tipo', 'estado'] })],
        ['Aprovações', T('ausencias', { where: (r) => r.estado === 'Pendente', actions: [{ l: 'Aprovar', icon: 'check', cls: 'primary', set: { estado: 'Aprovado' }, log: 'Aprovação de ausência' }, { l: 'Rejeitar', icon: 'x', cls: 'ghost danger', reason: 1, set: { estado: 'Rejeitado' } }], empty: 'Sem pedidos pendentes.', after: () => A.refreshBadges() })],
        ['Calendário', { v: 'calendar', events: (ctx) => ctx.db.ausencias.filter((a) => a.estado !== 'Rejeitado').map((a) => ({ data: a.inicio, titulo: `${a.tipo}: ${a.colaborador}`, tipo: a.estado === 'Aprovado' ? 'Atividade' : 'Prazo' })) }]
      ]),
      tab('remuneracoes', 'Remunerações', 'wallet', [
        ['Componentes salariais', T('remuneracoes', { filters: ['q', 'estado'], actions: ['edit'], form: ['base', 'subsidios'], onSave: (r) => { r.inss = Math.round((r.base + r.subsidios) * 0.03); r.irt = Math.round(Math.max(0, r.base - 100000) * 0.16); r.liquido = r.base + r.subsidios - r.inss - r.irt; }, critEdit: 1, footNote: (rows) => `Líquido total: ${A.money(A.sum(rows, 'liquido'))}` })],
        ['Processamento autorizado', H((ctx) => { const r = ctx.db.remuneracoes; const st = r[0].estado; return `<div class="kpis">${A.kpi('Colaboradores', r.length)}${A.kpi('Total bruto', A.money(A.sum(r, 'base') + A.sum(r, 'subsidios')))}${A.kpi('Descontos (IRT + INSS)', A.money(A.sum(r, 'irt') + A.sum(r, 'inss')))}${A.kpi('Total líquido', A.money(A.sum(r, 'liquido')), 'Outubro 2026')}</div><div class="card pad"><div class="row sb"><div><h3>Processamento de outubro 2026</h3><p class="muted">O processamento requer autorização do diretor-geral (concedida a 27/10/2026).</p></div>${A.badge(st)}</div>${st === 'Por processar' && !ctx.ro ? `<div class="form-actions"><button class="btn primary" data-proc>${A.icon('check')}Processar salários</button></div>` : ''}</div>`; }, (el, ctx) => { const b = el.querySelector('[data-proc]'); if (b) b.onclick = () => A.confirm('Processar salários', 'Confirma o processamento salarial de outubro de 2026?', () => { ctx.db.remuneracoes.forEach((x) => { x.estado = 'Processado'; }); ctx.log('RH', 'Processamento salarial', 'Outubro 2026', 1); ctx.save(); A.toast('Salários processados.'); A.rerender(); }); })]
      ]),
      tab('documentos', 'Documentos laborais', 'file', [['Certificados e declarações', H((ctx) => `<div class="card pad"><div class="form-grid"><label class="field full"><span>Colaborador</span><select data-c>${ctx.db.funcionarios.map((f) => `<option>${esc(f.nome)}</option>`).join('')}</select></label><label class="field full"><span>Documento</span><select data-t><option>Declaração de vínculo laboral</option><option>Declaração de rendimentos</option><option>Certificado de tempo de serviço</option></select></label></div><div class="form-actions"><button class="btn primary" data-g>${A.icon('printer')}Emitir</button></div></div>`, (el, ctx) => { el.querySelector('[data-g]').onclick = () => { const f = ctx.db.funcionarios.find((x) => x.nome === el.querySelector('[data-c]').value); const t = el.querySelector('[data-t]').value; ctx.log('RH', 'Emissão de documento laboral', `${t} — ${f.nome}`); ctx.save(); A.preview(t, `<div class="doc"><h2 class="doc-t">${esc(t)}</h2><p class="doc-p">Declara-se, para os devidos efeitos, que <b>${esc(f.nome)}</b> exerce funções de ${esc(f.cargo)} no ${esc(ctx.db.escola.nome)} desde ${A.date(f.admissao)}, com contrato ${esc(f.contrato.toLowerCase())}${t.includes('rendimentos') ? `, auferindo a remuneração base mensal de ${A.money(f.salario)}` : ''}.</p><p class="doc-p r">Luanda, ${A.date(A.TODAY)}</p></div>`); }; })], ['Contratos', T('contratos', { ro: 1, cols: ['colaborador', 'tipo', 'inicio', 'fim', 'estado'] })]]),
      tab('recrutamento', 'Recrutamento', 'plus', [['Candidatos', need('recrutamento', T('recrutamento', {}))], ['Processos de seleção', need('recrutamento', T('recrutamento', {}))]]),
      tab('relatorios', 'Relatórios', 'chart', [['Efetivos', R(() => [{ t: 'Efetivo por departamento', ds: 'funcionarios', group: 'departamento', gl: 'Departamento' }, { t: 'Efetivo por tipo de contrato', ds: 'contratos', group: 'tipo', gl: 'Tipo' }])], ['Assiduidade', R(() => [{ t: 'Registos por tipo', ds: 'assidRH', group: 'registo', gl: 'Registo' }, { t: 'Faltas e atrasos por colaborador', ds: 'assidRH', where: (r) => r.registo !== 'Presença', group: 'colaborador', gl: 'Colaborador' }])], ['Custos com pessoal', R(() => [{ t: 'Custos por cargo', ds: 'remuneracoes', group: 'cargo', gl: 'Cargo', sum: 'liquido', sl: 'Líquido' }, { t: 'Folha salarial', ds: 'remuneracoes', cols: ['colaborador', 'base', 'subsidios', 'inss', 'irt', 'liquido'] }])]]),
      PROFILE()
    ]
  };

  /* =====================================================================
     12. BIBLIOTECÁRIO
     ===================================================================== */
  const devolver = { l: 'Registar devolução', icon: 'download', cls: 'primary', when: (r) => r.estado !== 'Devolvido', open: (r, ctx, refresh) => A.modal({ title: 'Receção de livro', sub: `${esc(r.titulo)} — ${esc(r.leitor)}`, size: 'sm', body: A.formHtml([{ k: 'cons', l: 'Estado do exemplar', o: ['Bom', 'Razoável', 'Danificado'], req: 1 }]), actions: [{ l: 'Cancelar' }, { l: 'Confirmar devolução', cls: 'primary', fn: (b) => { const late = r.prevista < A.TODAY; r.estado = 'Devolvido'; r.devolucao = A.TODAY; const ex = ctx.db.exemplares.find((e) => e.codigo === r.exemplar); if (ex) { ex.situacao = 'Disponível'; ex.conservacao = b.querySelector('[name=cons]').value; } const l = ctx.db.livros.find((x) => x.titulo === r.titulo); if (l) l.disponiveis++; if (late) { const d = Math.round((new Date(A.TODAY) - new Date(r.prevista)) / 864e5); ctx.db.multas.unshift({ id: A.uid('ML'), leitor: r.leitor, titulo: r.titulo, diasAtraso: d, valor: d * 100, estado: 'Por pagar' }); } ctx.log('Biblioteca', 'Devolução', `${r.titulo} — ${r.leitor}`); ctx.save(); refresh(); A.toast(late ? 'Devolução registada com atraso — multa gerada.' : 'Devolução registada.', late ? 'warn' : 'ok'); } }] }) };
  const BIB = {
    id: 'bib', nome: 'Bibliotecário', short: 'Biblioteca', mod: 'Biblioteca', perms: [],
    user: () => ({ nome: 'Isabel Gomes', email: 'isabel.gomes@acura.ao', telefone: '+244 923 000 801', morada: 'Ingombota, Luanda' }),
    badges: { devolucoes: (ctx) => ctx.db.emprestimos.filter((e) => e.estado === 'Atrasado').length },
    tabs: [
      tab('dashboard', 'Dashboard da biblioteca', 'home', [
        ['Resumo', D((ctx) => { const db = ctx.db; return [['Títulos', db.livros.length, `${db.exemplares.length} exemplares`, '', 'book'], ['Disponíveis', db.exemplares.filter((e) => e.situacao === 'Disponível').length, '', 'ok', 'checkCircle'], ['Empréstimos ativos', db.emprestimos.filter((e) => e.estado !== 'Devolvido').length, '', '', 'swap'], ['Em atraso', db.emprestimos.filter((e) => e.estado === 'Atrasado').length, '', 'bad', 'alert']]; }, (ctx) => { const db = ctx.db; return [['Empréstimos em atraso', A.list(db.emprestimos.filter((e) => e.estado === 'Atrasado').map((e) => ({ tone: 'bad', t: `${e.titulo} — ${e.leitor}`, m: `Previsto ${A.date(e.prevista)} · ${e.turma}` }))), { go: 'devolucoes/1' }], ['Mais procurados', A.bars(byKey(db.emprestimos, 'titulo').slice(0, 7))], ['Acervo por categoria', A.bars(byKey(db.livros, 'categoria', 'exemplares'))], ['Reservas ativas', A.list(db.reservas.filter((r) => r.estado === 'Ativa').map((r) => ({ tone: 'info', t: r.titulo, m: `${r.leitor} · ${r.disponibilidade}` }))), { go: 'reservas/0' }]]; })],
        ['Empréstimos', T('emprestimos', { where: (r) => r.estado !== 'Devolvido', ro: 1 })],
        ['Atrasos', T('emprestimos', { where: (r) => r.estado === 'Atrasado', ro: 1 })]
      ]),
      tab('catalogo', 'Catálogo', 'book', [
        ['Livros', T('livros', { create: 'Novo título', actions: ['edit'], filters: ['q', 'categoria'], defaults: () => ({ exemplares: 1, disponiveis: 1 }), onCreate: (r, ctx) => { r.id = A.uid('LV'); r.codigo = r.codigo || `LIV-${String(ctx.db.livros.length + 1).padStart(4, '0')}`; for (let i = 1; i <= (r.exemplares || 1); i++) ctx.db.exemplares.push({ codigo: `${r.codigo}-${i}`, titulo: r.titulo, localizacao: r.estante || '—', conservacao: 'Bom', situacao: 'Disponível' }); r.disponiveis = r.exemplares || 1; } })],
        ['Autores', H((ctx) => A.section('Autores', A.bars(byKey(ctx.db.livros, 'autor'))))],
        ['Categorias', H((ctx) => A.section('Categorias', A.bars(byKey(ctx.db.livros, 'categoria'))))],
        ['Códigos', T('livros', { cols: ['codigo', 'titulo', 'isbn', 'estante'], ro: 1 })]
      ]),
      tab('exemplares', 'Exemplares', 'archive', [['Cópias disponíveis', T('exemplares', { where: (r) => r.situacao === 'Disponível', filters: ['q', 'localizacao'], ro: 1 })], ['Localização', T('exemplares', { filters: ['q', 'localizacao', 'situacao'], actions: ['edit'] })], ['Estado', T('exemplares', { filters: ['q', 'conservacao', 'situacao'], actions: [{ l: 'Abater', icon: 'x', cls: 'ghost danger', when: (r) => r.conservacao === 'Danificado' && r.situacao === 'Disponível', reason: 1, set: { situacao: 'Abatido' }, log: 'Abate de exemplar', crit: 1 }] })]]),
      tab('emprestimos', 'Empréstimos', 'swap', [
        ['Registar', { v: 'form', title: 'Novo empréstimo', mod: 'Biblioteca', logAction: 'Empréstimo', fields: [{ k: 'exemplar', l: 'Exemplar disponível', req: 1, o: (db) => db.exemplares.filter((e) => e.situacao === 'Disponível').map((e) => `${e.codigo} — ${e.titulo}`) }, { k: 'leitor', l: 'Leitor', req: 1, o: (db) => Q.ativos(db).map((a) => `${a.nome} · ${a.turma}`) }, { k: 'dias', l: 'Prazo (dias)', t: 'num', req: 1 }], get: () => ({ dias: 14 }),
          validate: (v, ctx) => { const nm = v.leitor.split(' · ')[0]; const n = ctx.db.emprestimos.filter((e) => e.leitor === nm && e.estado !== 'Devolvido').length; if (n >= 3) return 'O leitor já tem 3 empréstimos ativos (limite).'; if (ctx.db.multas.some((m) => m.leitor === nm && m.estado === 'Por pagar')) return 'O leitor tem multas por regularizar.'; if (v.dias > 30) return 'O prazo máximo é de 30 dias.'; return null; },
          set: (ctx, v) => { const [cod] = v.exemplar.split(' — '); const ex = ctx.db.exemplares.find((e) => e.codigo === cod); const [nm, turma] = v.leitor.split(' · '); ex.situacao = 'Emprestado'; const l = ctx.db.livros.find((x) => x.titulo === ex.titulo); if (l) l.disponiveis--; const prev = new Date(new Date(A.TODAY).getTime() + v.dias * 864e5).toISOString().slice(0, 10); ctx.db.emprestimos.unshift({ id: A.uid('EM'), exemplar: cod, titulo: ex.titulo, leitor: nm, tipoLeitor: 'Aluno', turma, data: A.TODAY, prevista: prev, devolucao: '', estado: 'Ativo' }); }, done: 'Empréstimo registado.', after: () => A.go('emprestimos', 1) }],
        ['Consultar', T('emprestimos', { filters: ['q', 'estado', 'turma', '~data'], actions: [devolver] })]
      ]),
      tab('devolucoes', 'Devoluções', 'download', [['Receção', T('emprestimos', { where: (r) => r.estado !== 'Devolvido', actions: [devolver] })], ['Atrasos', T('emprestimos', { where: (r) => r.estado === 'Atrasado', actions: [devolver, { l: 'Notificar', icon: 'send', open: (r) => A.toast(`Lembrete enviado a ${r.leitor}.`) }] })], ['Estado', T('emprestimos', { where: (r) => r.estado === 'Devolvido', ro: 1 })]]),
      tab('reservas', 'Reservas', 'star', [['Pedidos', T('reservas', { create: 'Nova reserva', defaults: () => ({ data: A.TODAY, estado: 'Ativa', disponibilidade: 'Aguarda devolução' }), actions: [{ l: 'Satisfazer', icon: 'check', when: (r) => r.estado === 'Ativa', set: { estado: 'Satisfeita' } }, { l: 'Cancelar', icon: 'x', cls: 'ghost danger', when: (r) => r.estado === 'Ativa', set: { estado: 'Cancelada' } }] })], ['Disponibilidade', T('livros', { cols: ['titulo', 'autor', 'exemplares', 'disponiveis'], filters: ['q', 'categoria'], ro: 1 })]]),
      tab('leitores', 'Alunos e leitores', 'users', [['Registo', T('leitores', { create: 'Novo leitor', actions: ['edit'], defaults: () => ({ estado: 'Ativo', emprestimos: 0, tipo: 'Aluno' }) })], ['Histórico de utilização', T('emprestimos', { cols: ['leitor', 'turma', 'titulo', 'data', 'estado'], filters: ['q', 'turma'], ro: 1 })]]),
      tab('multas', 'Multas', 'tag', [['Consulta', T('multas', { ro: 1, footNote: (rows) => `Por cobrar: ${A.money(A.sum(rows.filter((r) => r.estado === 'Por pagar'), 'valor'))}` })], ['Tratamento', T('multas', { where: (r) => r.estado === 'Por pagar', actions: [{ l: 'Registar pagamento', icon: 'cash', set: { estado: 'Paga' } }, { l: 'Isentar', icon: 'x', reason: 1, set: { estado: 'Isenta' }, crit: 1 }], empty: 'Sem multas por regularizar.' })]]),
      tab('inventario', 'Inventário', 'clipboard', [['Contagem', T('exemplares', { filters: ['q', 'localizacao'], actions: [{ l: 'Conferido', icon: 'check', open: (r) => A.toast(`${r.codigo} conferido.`) }] })], ['Estado do acervo', H((ctx) => `<div class="grid2">${A.section('Conservação', A.donut(byKey(ctx.db.exemplares, 'conservacao').map(([l, v]) => [l, v, { Bom: 'var(--ok)', Razoável: 'var(--warn)', Danificado: 'var(--bad)' }[l]]), ctx.db.exemplares.length))}${A.section('Situação', A.donut(byKey(ctx.db.exemplares, 'situacao').map(([l, v], i) => [l, v, ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)'][i]]), ''))}</div>`)]]),
      tab('relatorios', 'Relatórios', 'chart', [['Empréstimos, atrasos e procura', R(() => [{ t: 'Empréstimos por estado', ds: 'emprestimos', group: 'estado', gl: 'Estado' }, { t: 'Livros mais procurados', ds: 'emprestimos', group: 'titulo', gl: 'Título' }, { t: 'Empréstimos por turma', ds: 'emprestimos', group: 'turma', gl: 'Turma' }, { t: 'Atrasos', ds: 'emprestimos', where: (r) => r.estado === 'Atrasado', cols: ['titulo', 'leitor', 'turma', 'prevista'] }])]]),
      PROFILE()
    ]
  };

  /* =====================================================================
     13. INSPETOR / AUDITOR (apenas leitura)
     ===================================================================== */
  const AUD = {
    id: 'aud', nome: 'Inspetor / auditor', short: 'Auditoria', mod: 'Auditoria', perms: ['search', 'fin'], ro: true,
    user: () => ({ nome: 'Jorge Cardoso', email: 'jorge.cardoso@acura.ao', telefone: '+244 923 000 901', morada: 'Luanda' }),
    tabs: [
      tab('dashboard', 'Dashboard de auditoria', 'home', [
        ['Pendências', D((ctx) => { const db = ctx.db; return [['Operações críticas (30 dias)', db.auditoria.filter((l) => l.critico === 'Sim').length, '', 'warn', 'alert'], ['Incidentes abertos', db.incidentes.filter((i) => i.estado !== 'Fechado').length, '', 'bad', 'flag'], ['Inconformidades', db.inconformidades.filter((i) => i.estado !== 'Fechada').length, '', 'warn', 'clipboard'], ['Estornos e anulações', db.estornos.length, `${db.estornos.filter((e) => e.estado === 'Pendente').length} pendentes`, '', 'undo']]; },
          (ctx) => { const db = ctx.db; return [['Operações críticas recentes', auditFeed(db.auditoria.filter((l) => l.critico === 'Sim'), 8), { go: 'dashboard/2' }], ['Operações por módulo', A.bars(byKey(db.auditoria, 'modulo'))], ['Incidentes', A.list(db.incidentes.map((i) => ({ tone: A.tone(i.gravidade), t: i.titulo, m: `${i.area} · ${A.date(i.data)}`, r: A.badge(i.estado) }))), { go: 'incidentes/0' }], ['Inconformidades', A.list(db.inconformidades.map((i) => ({ tone: 'warn', t: i.descricao, m: i.area, r: A.badge(i.estado) }))), { go: 'relatorios/1' }]]; })],
        ['Alertas', AL((ctx) => [{ t: 'Nota alterada após aprovação da pauta', m: 'Auditoria académica', tone: 'bad', go: 'academica/3' }, { t: 'Recibo anulado após fecho de caixa', m: 'Auditoria financeira', tone: 'bad', go: 'financeira/2' }, { t: `${ctx.db.auditoria.filter((l) => l.acao === 'Tentativa falhada').length} registos de tentativas de login falhadas`, tone: 'warn', go: 'acessos/1' }, { t: 'Diferença de inventário em batas L', tone: 'warn', go: 'stock/2' }])],
        ['Operações críticas', T('auditoria', { where: (r) => r.critico === 'Sim', filters: ['q', 'modulo', 'utilizador', '~data'] })]
      ]),
      tab('acessos', 'Utilizadores e acessos', 'shield', [['Perfis', { v: 'perms' }], ['Alterações de permissões', T('auditoria', { where: (r) => /permiss|perfil|Bloqueio|Criação de utilizador|Redefinição/i.test(r.acao) || r.acao === 'Tentativa falhada', filters: ['q', 'acao', '~data'] })], ['Acessos privilegiados', T('utilizadores', { where: (r) => ['admin', 'dg', 'tes', 'cont', 'aud'].includes(r.perfilId), filters: ['q', 'perfil'] })], ['Sessões', T('sessoes', {})]]),
      tab('academica', 'Auditoria académica', 'book', [['Notas', T('auditoria', { where: (r) => r.modulo === 'Académico', filters: ['q', 'acao', 'utilizador', '~data'] })], ['Pautas', T('pautas', { filters: ['q', 'estado', 'professor'], actions: [{ l: '', icon: 'eye', title: 'Ver', read: 1, open: (r) => A.showPauta(r) }] })], ['Aprovações', { v: 'approvals' }], ['Correções', T('auditoria', { where: (r) => r.acao === 'Correção de nota', filters: ['q', 'utilizador', '~data'] })]]),
      tab('financeira', 'Auditoria financeira', 'wallet', [['Pagamentos', T('pagamentos', { filters: ['q', 'metodo', 'estado', 'operador', '~data'], actions: [printRec] })], ['Recibos', T('auditoria', { where: (r) => /recibo/i.test(r.acao), filters: ['q', '~data'] })], ['Estornos', T('estornos', { filters: ['q', 'tipo', 'estado'] })], ['Fechos', H((ctx) => `<div class="grid2">${A.section('Fechos de caixa', A.list(ctx.db.caixa.historico.map((h) => ({ tone: h.diferenca ? 'bad' : 'ok', t: `${A.date(h.data)} — ${h.operador}`, m: `Entradas ${A.money(h.entradas)} · contado ${A.money(h.contado)}`, r: A.badge(h.estado) }))))}${A.section('Fechos contabilísticos', A.list(ctx.db.fechos.map((f) => ({ tone: A.tone(f.estado), t: f.periodo, m: `Receitas ${A.money(f.receitas)} · despesas ${A.money(f.despesas)}`, r: A.badge(f.estado) }))))}</div>`)]]),
      tab('documental', 'Auditoria documental', 'file', [['Certificados', T('pedidosCert', { filters: ['q', 'estado'] })], ['Declarações', T('documentos', { where: (r) => r.tipo.startsWith('Declaração'), filters: ['q', 'estado', '~data'] })], ['Histórico de emissão', T('documentos', { filters: ['q', 'tipo', 'emitidoPor', 'estado', '~data'] })]]),
      tab('stock', 'Auditoria de stock', 'box', [['Entradas', T('movStock', { where: (r) => r.tipo === 'Entrada', filters: ['q', '~data'] })], ['Saídas', T('movStock', { where: (r) => r.tipo !== 'Entrada', filters: ['q', 'tipo', '~data'] })], ['Ajustes', T('inventario', { where: (r) => r.diferenca !== 0 })]]),
      tab('administrativa', 'Auditoria administrativa', 'archive', [['Matrículas', T('alunos', { cols: ['processo', 'nome', 'turma', 'estado', 'dataMatricula'], filters: ['q', 'estado', '~dataMatricula'] })], ['Transferências', T('transferencias', { filters: ['q', 'tipo', 'estado'] })], ['Alterações de processos', T('auditoria', { where: (r) => r.modulo === 'Secretaria', filters: ['q', 'acao', 'utilizador', '~data'] })]]),
      tab('incidentes', 'Incidentes', 'flag', [['Registos suspeitos', T('incidentes', { own: 1, where: (r) => r.area !== 'Técnico', create: 'Registar incidente', defaults: (ctx) => ({ data: A.TODAY, estado: 'Aberto', responsavel: ctx.user.nome }), note: 'O auditor pode registar incidentes e conclusões próprias, mas não altera os registos verificados.' })], ['Ocorrências técnicas', T('incidentes', { where: (r) => r.area === 'Técnico' || r.area === 'Segurança' })]]),
      tab('relatorios', 'Relatórios', 'chart', [['Evidências', T('auditoria', { where: (r) => r.critico === 'Sim', cols: ['id', 'data', 'utilizador', 'modulo', 'acao', 'ip'], filters: ['q', 'modulo', '~data'] })], ['Inconformidades', T('inconformidades', { own: 1, create: 'Nova inconformidade', defaults: () => ({ estado: 'Aberta' }), actions: [{ l: '', icon: 'edit', title: 'Editar', read: 1, open: (r, ctx, refresh) => A.modal({ title: 'Atualizar inconformidade', size: 'md', body: A.formHtml(A.fieldsFrom('inconformidades'), r), actions: [{ l: 'Cancelar' }, { l: 'Guardar', cls: 'primary', fn: (b) => { Object.assign(r, A.readForm(b, A.fieldsFrom('inconformidades'))); ctx.save(); refresh(); } }] }) }] })], ['Conclusões', { v: 'form', own: 1, title: 'Conclusões da auditoria — 1º Trimestre 2026/2027', mod: 'Auditoria', fields: [{ k: 'ambito', l: 'Âmbito', t: 'area' }, { k: 'conclusoes', l: 'Conclusões', t: 'area' }, { k: 'recomendacoes', l: 'Recomendações', t: 'area' }, { k: 'estado', l: 'Estado do relatório', o: ['Em elaboração', 'Concluído'] }], get: (ctx) => (ctx.db.conclusoes = ctx.db.conclusoes || { ambito: 'Operações financeiras, académicas e de acesso entre 01/09/2026 e 29/10/2026.', conclusoes: '', recomendacoes: '', estado: 'Em elaboração' }), set: (ctx, v) => Object.assign(ctx.db.conclusoes, v) }]]),
      tab('exportacoes', 'Exportações', 'download', [['Relatórios autorizados', R(() => [{ t: 'Registo de auditoria completo', ds: 'auditoria', cols: ['id', 'data', 'utilizador', 'modulo', 'acao', 'detalhe', 'ip', 'critico'] }, { t: 'Operações críticas por utilizador', ds: 'auditoria', where: (r) => r.critico === 'Sim', group: 'utilizador', gl: 'Utilizador' }, { t: 'Pagamentos e recibos', ds: 'pagamentos', cols: ['recibo', 'data', 'aluno', 'valor', 'metodo', 'operador', 'estado'] }, { t: 'Estornos e anulações', ds: 'estornos', cols: ['data', 'tipo', 'recibo', 'aluno', 'valor', 'motivo', 'estado'] }])]]),
      PROFILE()
    ]
  };

  /* =====================================================================
     14. ALUNO (portal)
     ===================================================================== */
  const ALUNO = {
    id: 'aluno', nome: 'Aluno', short: 'Portal do aluno', mod: 'Portal', perms: [], portal: true, bottom: [['inicio', 'Início'], ['notas', 'Notas'], ['horarios', 'Horário'], ['financeiro', 'Propinas']],
    user: (db) => { const a = db.alunos.find((x) => x.id === db.demo.alunoId); return { nome: a.nome, email: `${a.processo}@aluno.acura.ao`, telefone: '+244 931 222 333', morada: a.morada }; },
    student: (db) => db.alunos.find((x) => x.id === db.demo.alunoId),
    badges: { avisos: (ctx) => ctx.db.comunicados.filter((c) => c.estado === 'Publicado' && ['Todos', 'Alunos'].includes(c.destinatarios) && !(ctx.db.lidos || {})['aluno' + c.id]).length },
    tabs: [
      tab('inicio', 'Início', 'home', [['Resumo', H((ctx) => {
        const db = ctx.db; const a = ctx.student; const s = A.stats(a);
        const td = db.horarios.filter((h) => h.turmaId === a.turmaId && h.dia === today()).sort((x, y) => (x.hora > y.hora ? 1 : -1));
        const next = db.avaliacoes.filter((v) => v.turmaId === a.turmaId && v.data >= A.TODAY).slice(0, 4);
        return `<div class="hello"><h2>Olá, ${esc(a.nome.split(' ')[0])}</h2><p class="muted">${esc(a.turma)} · ${esc(a.turno)} · ${A.YEAR}</p></div>
          <div class="kpis mini">${A.kpi('Média (1º T)', A.f1(s.media), s.media < 10 ? 'abaixo de 10 · provisória' : 'provisória', s.media < 10 ? 'bad' : '')}${A.kpi('Faltas', s.faltas, `${s.injust} injustificadas`)}${A.kpi('Pagamentos', A.debt(a.id) ? 'Em atraso' : 'Em dia', '', A.debt(a.id) ? 'bad' : 'ok')}</div>
          <div class="grid2">${A.section('Aulas de hoje', A.list(td.map((h) => ({ icon: 'clock', t: `${h.hora} · ${h.disciplina}`, m: `${h.sala} · ${h.professor}` })), 'Sem aulas hoje.'), go('horarios/0', 'Horário'))}
          ${A.section('Próximas avaliações', A.list(next.map((v) => ({ tone: 'warn', t: `${v.tipo} de ${v.disciplina}`, m: A.date(v.data) })), 'Sem avaliações marcadas.'), go('avaliacoes/0', 'Ver'))}
          ${A.section('Avisos', A.list(db.comunicados.filter((c) => c.estado === 'Publicado' && ['Todos', 'Alunos'].includes(c.destinatarios)).slice(0, 3).map((c) => ({ icon: 'bell', t: c.titulo, m: A.date(c.data) }))), go('avisos/0', 'Todos'))}
          ${A.section('Resumo académico', A.bars(db.turmas.find((t) => t.id === a.turmaId).disciplinas.map((d) => { const m = A.mt(a.id, d, '1º Trimestre'); return [db.disciplinas.find((x) => x.id === d).nome, m || 0, m < 10 ? 'bad' : 'ok']; }), { max: 20 }), go('notas/0', 'Notas'))}</div>`;
      })]]),
      tab('perfil', 'Meu perfil', 'user', [['Dados pessoais', H((ctx) => { const a = ctx.student; return A.section('Dados pessoais', `<div class="prof-head"><div class="avatar lg">${A.initials(a.nome)}</div><div><h3>${esc(a.nome)}</h3><p class="muted">Processo ${a.processo}</p></div></div>${A.kv({ 'Data de nascimento': A.date(a.nascimento), Sexo: a.sexo, 'Nº BI': a.bi, Encarregado: esc(a.encarregado) })}<p class="muted mt">Para corrigir dados de identificação dirija-se à secretaria.</p>`); })], ['Contactos editáveis', { v: 'profile', part: 'dados', editAddr: 1 }]]),
      tab('academica', 'Minha vida académica', 'grad', [['Classe, curso e turma', H((ctx) => { const a = ctx.student; const t = ctx.db.turmas.find((x) => x.id === a.turmaId); return `<div class="grid2">${A.section('Situação académica', A.kv({ 'Ano letivo': a.ano, Classe: esc(a.classe), Curso: esc(a.curso), Turma: esc(a.turma), Turno: a.turno, 'N.º na turma': a.numero, 'Estado da matrícula': A.badge(a.estado) }))}${A.section('Turma', A.kv({ Sala: t.sala, 'Diretor(a) de turma': esc(t.dt), 'Disciplinas': t.disciplinas.length }) + `<h4 class="mt">Professores</h4>` + A.list(ctx.db.distribuicao.filter((d) => d.turmaId === t.id).map((d) => ({ t: d.disciplina, r: `<small>${esc(d.professor)}</small>` }))))}</div>`; })]]),
      tab('notas', 'Notas', 'book', [['Resultados por disciplina e período', { v: 'myGrades' }]]),
      tab('boletins', 'Boletins', 'file', [['Boletins publicados', { v: 'boletins' }]]),
      tab('horarios', 'Horários', 'calendar', [['Aulas e salas', { v: 'timetable', mode: 'turma', fixed: (ctx) => ctx.student.turmaId }], ['Calendário semanal', { v: 'calendar', events: (ctx) => [...ctx.db.avaliacoes.filter((a) => a.turmaId === ctx.student.turmaId).map((a) => ({ data: a.data, titulo: `${a.tipo} ${a.disciplina}`, tipo: 'Avaliação' })), ...ctx.db.eventos] }]]),
      tab('presencas', 'Presenças', 'clock', [['Faltas e atrasos', T('faltas', { where: (r, ctx) => r.alunoId === ctx.student.id, cols: ['data', 'disciplina', 'tipo', 'justificada', 'motivo'], filters: ['tipo', 'disciplina'], ro: 1, noDetail: 1, exportable: false, top: (ctx) => { const s = A.stats(ctx.student); return `<div class="kpis mini">${A.kpi('Faltas', s.faltas)}${A.kpi('Injustificadas', s.injust, '', s.injust ? 'bad' : 'ok')}${A.kpi('Atrasos', s.atrasos)}</div>`; } })], ['Justificações registadas', T('faltas', { where: (r, ctx) => r.alunoId === ctx.student.id && r.justificada !== 'Não', cols: ['data', 'disciplina', 'tipo', 'justificada', 'motivo'], ro: 1, noDetail: 1, exportable: false, empty: 'Sem justificações registadas.' })]]),
      tab('avaliacoes', 'Avaliações', 'clipboard', [['Próximos testes, provas e exames', T('avaliacoes', { where: (r, ctx) => r.turmaId === ctx.student.turmaId && r.data >= A.TODAY, cols: ['data', 'disciplina', 'tipo', 'estado'], ro: 1, noDetail: 1, exportable: false, empty: 'Sem avaliações marcadas.' })]]),
      tab('materiais', 'Materiais', 'upload', [['Documentos e materiais', T('materiais', { where: (r, ctx) => r.turmaId === ctx.student.turmaId && r.estado === 'Publicado', cols: ['data', 'titulo', 'disciplina', 'tipo', 'autor'], ro: 1, noDetail: 1, exportable: false, actions: [{ l: 'Abrir', icon: 'download', read: 1, open: (r) => A.toast(`A descarregar “${r.titulo}”…`) }], empty: 'Ainda não há materiais publicados para a sua turma.' })]]),
      tab('financeiro', 'Financeiro', 'wallet', [['Propinas e cobranças', { v: 'myFinance', part: 'cobrancas' }], ['Recibos', { v: 'myFinance', part: 'recibos' }]]),
      tab('documentos', 'Documentos', 'file', [['Documentos disponíveis', T('documentos', { where: (r, ctx) => r.alunoId === ctx.student.id && r.estado === 'Emitido', cols: ['data', 'tipo', 'id'], ro: 1, noDetail: 1, exportable: false, empty: 'Sem documentos disponibilizados pela escola.' })], ['Pedir declaração', { v: 'form', title: 'Pedido de declaração', mod: 'Portal', logAction: 'Pedido de declaração', note: 'O pedido é enviado à secretaria. Será notificado quando o documento estiver disponível.', fields: [{ k: 'tipo', l: 'Tipo de declaração', o: ['Declaração de frequência', 'Declaração de matrícula'], req: 1 }, { k: 'fin', l: 'Finalidade', req: 1, full: 1 }], get: () => ({}), set: (ctx, v) => ctx.db.atendimentos.unshift({ id: A.uid('AT'), data: A.TODAY, hora: A.now().slice(11), nome: ctx.student.nome, assunto: `Pedido de ${v.tipo.toLowerCase()} — ${v.fin}`, canal: 'Portal', encaminhado: 'Secretaria', estado: 'Pendente' }), done: 'Pedido enviado à secretaria.', after: () => A.rerender() }]]),
      tab('avisos', 'Avisos', 'bell', [['Comunicados e notificações', { v: 'feed', to: ['Todos', 'Alunos'] }]]),
      tab('seguranca', 'Meu perfil e segurança', 'lock', [['Palavra-passe', { v: 'profile', part: 'senha' }], ['Sessões', { v: 'profile', part: 'sessoes' }], ['Preferências', { v: 'profile', part: 'pref' }]])
    ]
  };

  /* =====================================================================
     15. ENCARREGADO DE EDUCAÇÃO (portal, com seletor de educando)
     ===================================================================== */
  const ENC = {
    id: 'enc', nome: 'Encarregado de educação', short: 'Portal do encarregado', mod: 'Portal', perms: [], portal: true, multi: true, bottom: [['dashboard', 'Início'], ['desempenho', 'Notas'], ['assiduidade', 'Faltas'], ['financeiro', 'Propinas']],
    user: (db) => { const e = db.encarregados.find((x) => x.id === db.demo.encId); return { nome: e.nome, email: e.email, telefone: e.telefone, morada: e.morada }; },
    students: (db) => db.encarregados.find((x) => x.id === db.demo.encId).ids.map((id) => db.alunos.find((a) => a.id === id)),
    badges: { notificacoes: (ctx) => A.encAlerts(ctx).filter((x) => x.tone === 'bad').length },
    tabs: [
      tab('dashboard', 'Dashboard', 'home', [
        ['Resumo dos educandos', H((ctx) => { const db = ctx.db; return `<div class="hello"><h2>Olá, ${esc(ctx.user.nome.split(' ')[0])}</h2><p class="muted">${ctx.students.length} educando(s) associado(s) à sua conta</p></div><div class="cards2">${ctx.students.map((a) => { const s = A.stats(a); const d = A.debt(a.id); return `<article class="card kid ${a.id === ctx.student.id ? 'on' : ''}"><div class="row"><div class="avatar">${A.initials(a.nome)}</div><div><h3>${esc(a.nome)}</h3><p class="muted">${esc(a.turma)} · ${a.turno}</p></div></div><div class="kpis mini">${A.kpi('Média', A.f1(s.media), '', s.media < 10 ? 'bad' : '')}${A.kpi('Faltas', s.faltas, `${s.injust} injust.`)}${A.kpi('Propinas', d ? A.money(d) : 'Em dia', '', d ? 'bad' : 'ok')}</div><button class="btn sm" data-kid="${a.id}">Ver detalhes</button></article>`; }).join('')}</div>${A.section('Avisos recentes', A.list(db.comunicados.filter((c) => c.estado === 'Publicado' && ['Todos', 'Encarregados'].includes(c.destinatarios)).slice(0, 3).map((c) => ({ icon: 'bell', t: c.titulo, m: A.date(c.data) }))), go('comunicacao/0', 'Todos'))}`; }, (el) => { el.querySelectorAll('[data-kid]').forEach((b) => { b.onclick = () => { A.setStudent(b.dataset.kid); A.go('desempenho', 0); }; }); })],
        ['Avisos', { v: 'feed', to: ['Todos', 'Encarregados'] }],
        ['Pendências', AL((ctx) => A.encAlerts(ctx).filter((x) => x.tone !== 'ok'), 'Pendências')]
      ]),
      tab('educandos', 'Meus educandos', 'users', [['Lista de alunos associados', H((ctx) => `<div class="cards2">${ctx.students.map((a) => `<article class="card"><div class="prof-head"><div class="avatar lg">${A.initials(a.nome)}</div><div><h3>${esc(a.nome)}</h3><p class="muted">Processo ${a.processo}</p></div>${A.badge(a.estado)}</div>${A.kv({ Classe: esc(a.classe), Turma: esc(a.turma), Turno: a.turno, Curso: esc(a.curso), 'Diretor(a) de turma': esc(ctx.db.turmas.find((t) => t.id === a.turmaId).dt) })}<div class="form-actions"><button class="btn sm ${a.id === ctx.student.id ? 'primary' : ''}" data-kid="${a.id}">${a.id === ctx.student.id ? 'Selecionado' : 'Selecionar'}</button></div></article>`).join('')}</div>`, (el) => { el.querySelectorAll('[data-kid]').forEach((b) => { b.onclick = () => A.setStudent(b.dataset.kid); }); })]]),
      tab('desempenho', 'Desempenho académico', 'book', [['Notas', { v: 'myGrades' }], ['Médias', H((ctx) => { const a = ctx.student; const t = ctx.db.turmas.find((x) => x.id === a.turmaId); return A.section(`Médias por disciplina — ${a.nome}`, A.bars(t.disciplinas.map((d) => { const m = A.mt(a.id, d, '1º Trimestre'); const al = Q.ativos(ctx.db).filter((x) => x.turmaId === t.id).map((x) => A.mt(x.id, d, '1º Trimestre')).filter((x) => x != null); return [`${ctx.db.disciplinas.find((x) => x.id === d).nome} (turma ${A.f1(A.sum(al, (x) => x) / al.length)})`, m || 0, m < 10 ? 'bad' : 'ok']; }), { max: 20 })); })], ['Boletins', { v: 'boletins' }]]),
      tab('assiduidade', 'Assiduidade', 'clock', [
        ['Faltas', T('faltas', { where: (r, ctx) => r.alunoId === ctx.student.id && r.tipo === 'Falta', cols: ['data', 'disciplina', 'justificada', 'motivo'], ro: 1, noDetail: 1, exportable: false, empty: 'Sem faltas registadas.' })],
        ['Atrasos', T('faltas', { where: (r, ctx) => r.alunoId === ctx.student.id && r.tipo === 'Atraso', cols: ['data', 'disciplina'], ro: 1, noDetail: 1, exportable: false, empty: 'Sem atrasos registados.' })],
        ['Justificações', T('faltas', { where: (r, ctx) => r.alunoId === ctx.student.id && r.tipo === 'Falta', cols: ['data', 'disciplina', 'justificada', 'motivo'], noDetail: 1, exportable: false, note: 'Submeta a justificação; o diretor de turma valida-a.', actions: [{ l: 'Justificar', icon: 'edit', when: (r) => r.justificada === 'Não', reason: 'Motivo da falta', set: (r, c, reason) => ({ justificada: 'Pendente', motivo: reason }), log: 'Justificação submetida', done: 'Justificação enviada ao diretor de turma.' }], empty: 'Sem faltas registadas.' })]
      ]),
      tab('horarios', 'Horários', 'calendar', [['Horário', { v: 'timetable', mode: 'turma', fixed: (ctx) => ctx.student.turmaId }], ['Calendário escolar', { v: 'calendar', events: (ctx) => [...ctx.db.eventos, ...ctx.db.avaliacoes.filter((a) => a.turmaId === ctx.student.turmaId).map((a) => ({ data: a.data, titulo: `${a.tipo} ${a.disciplina}`, tipo: 'Avaliação' }))] }]]),
      tab('financeiro', 'Financeiro', 'wallet', [['Propinas', { v: 'myFinance', part: 'cobrancas' }], ['Dívidas', { v: 'myFinance', part: 'dividas' }], ['Pagamentos e recibos', { v: 'myFinance', part: 'recibos' }]]),
      tab('documentos', 'Documentos', 'file', [['Documentos disponibilizados', T('documentos', { where: (r, ctx) => r.alunoId === ctx.student.id && r.estado === 'Emitido', cols: ['data', 'tipo', 'id'], ro: 1, noDetail: 1, exportable: false, empty: 'A escola ainda não disponibilizou documentos para este educando.' })]]),
      tab('ocorrencias', 'Ocorrências', 'flag', [['Informações comunicáveis', T('ocorrencias', { where: (r, ctx) => r.alunoId === ctx.student.id && r.comunicavel === 'Sim', cols: ['data', 'tipo', 'descricao', 'estado'], ro: 1, noDetail: 1, exportable: false, empty: 'Sem ocorrências comunicadas.' })], ['Notificações recebidas', T('notifDisc', { where: (r, ctx) => r.aluno === ctx.student.nome, cols: ['data', 'assunto', 'canal', 'estado'], ro: 1, noDetail: 1, exportable: false, empty: 'Sem notificações.' })]]),
      tab('reunioes', 'Reuniões', 'users', [['Convocatórias', T('reunioes', { where: (r, ctx) => (r.turmaId === ctx.student.turmaId && /encarregad/i.test(r.participantes)) || r.participantes === 'Encarregados de educação', cols: ['data', 'hora', 'assunto', 'local', 'confirmacao'], noDetail: 1, exportable: false, actions: [{ l: 'Confirmar presença', icon: 'check', cls: 'primary', when: (r) => r.confirmacao !== 'Confirmada' && r.estado === 'Agendada', set: { confirmacao: 'Confirmada' }, done: 'Presença confirmada.' }, { l: 'Não posso ir', icon: 'x', when: (r) => r.confirmacao === 'Confirmada', set: { confirmacao: 'Por confirmar' } }] })], ['Calendário', { v: 'calendar', events: (ctx) => ctx.db.reunioes.filter((r) => r.turmaId === ctx.student.turmaId || r.participantes === 'Encarregados de educação').map((r) => ({ data: r.data, titulo: r.assunto, tipo: 'Reunião' })) }]]),
      tab('comunicacao', 'Comunicação', 'message', [['Avisos', { v: 'feed', to: ['Todos', 'Encarregados'] }], ['Mensagens institucionais', { v: 'form', title: 'Enviar mensagem à escola', mod: 'Portal', logAction: 'Mensagem do encarregado', fields: [{ k: 'para', l: 'Destinatário', o: ['Secretaria', 'Tesouraria', 'Diretor(a) de turma', 'Direção pedagógica'], req: 1 }, { k: 'assunto', l: 'Assunto', req: 1, full: 1 }, { k: 'msg', l: 'Mensagem', t: 'area', req: 1 }], get: () => ({}), set: (ctx, v) => ctx.db.atendimentos.unshift({ id: A.uid('AT'), data: A.TODAY, hora: A.now().slice(11), nome: ctx.user.nome, assunto: `${v.assunto} (${ctx.student.nome})`, canal: 'Portal', encaminhado: v.para, estado: 'Pendente' }), done: 'Mensagem enviada. Receberá resposta por email.', after: () => A.rerender() }]]),
      tab('notificacoes', 'Notificações', 'bell', [['Alertas de faltas, notas e cobranças', AL((ctx) => A.encAlerts(ctx), 'Notificações')]]),
      tab('perfil', 'Meu perfil', 'user', [['Contactos', { v: 'profile', part: 'dados', editAddr: 1, onSave: (v, ctx) => { const e = ctx.db.encarregados.find((x) => x.id === ctx.db.demo.encId); Object.assign(e, v); } }], ['Palavra-passe', { v: 'profile', part: 'senha' }], ['Preferências', { v: 'profile', part: 'pref' }]])
    ]
  };
  A.encAlerts = (ctx) => {
    const out = [];
    ctx.students.forEach((a) => {
      const s = A.stats(a); const d = A.debt(a.id);
      if (d) out.push({ t: `${a.nome.split(' ')[0]}: propinas em atraso`, m: A.money(d), tone: 'bad', go: 'financeiro/1' });
      if (s.injust) out.push({ t: `${a.nome.split(' ')[0]}: ${s.injust} falta(s) injustificada(s)`, m: 'Pode submeter justificação', tone: 'warn', go: 'assiduidade/2' });
      if (s.negativas) out.push({ t: `${a.nome.split(' ')[0]}: ${s.negativas} nota(s) negativa(s) no 1º Trimestre`, m: 'Notas provisórias', tone: 'warn', go: 'desempenho/0' });
      const c = ctx.db.cobrancas.find((x) => x.alunoId === a.id && x.estado === 'Pendente' && x.vencimento > A.TODAY);
      if (c) out.push({ t: `${a.nome.split(' ')[0]}: ${c.descricao} vence a ${A.date(c.vencimento)}`, m: A.money(c.divida), tone: 'muted', go: 'financeiro/0' });
    });
    ctx.db.reunioes.filter((r) => r.estado === 'Agendada' && r.confirmacao === 'Por confirmar' && (r.participantes === 'Encarregados de educação' || ctx.students.some((a) => a.turmaId === r.turmaId))).forEach((r) => out.push({ t: `Convocatória: ${r.assunto}`, m: `${A.date(r.data)} ${r.hora} — confirme a presença`, tone: 'warn', go: 'reunioes/0' }));
    return out;
  };

  /* =====================================================================
     16. RECECIONISTA / ATENDENTE
     ===================================================================== */
  const REC = {
    id: 'rec', nome: 'Rececionista / atendente', short: 'Receção', mod: 'Atendimento', perms: [],
    user: () => ({ nome: 'Sofia Matos', email: 'sofia.matos@acura.ao', telefone: '+244 923 001 001', morada: 'Patriota, Luanda' }),
    badges: { atendimento: (ctx) => ctx.db.atendimentos.filter((a) => a.estado === 'Pendente').length },
    tabs: [
      tab('dashboard', 'Dashboard', 'home', [
        ['Pedidos recebidos', D((ctx) => { const db = ctx.db; return [['Atendimentos hoje', db.atendimentos.filter((a) => a.data === A.TODAY).length, '', '', 'message'], ['Pendentes', db.atendimentos.filter((a) => a.estado === 'Pendente').length, '', 'warn', 'clock'], ['Pré-inscrições (mês)', db.preinscricoes.filter((p) => p.data.startsWith('2026-10')).length, '', '', 'plus'], ['Agendamentos próximos', db.agendamentos.filter((a) => a.data >= A.TODAY).length, '', '', 'calendar']]; }, (ctx) => { const db = ctx.db; return [['Últimos atendimentos', A.list(db.atendimentos.slice(0, 6).map((a) => ({ tone: A.tone(a.estado), t: `${a.nome} — ${a.assunto}`, m: `${A.date(a.data)} ${a.hora} · ${a.canal}` }))), { go: 'atendimento/0' }], ['Agenda', A.list(db.agendamentos.filter((a) => a.data >= A.TODAY).slice(0, 6).map((a) => ({ tone: A.tone(a.estado), t: `${a.tipo} — ${a.nome}`, m: `${A.date(a.data)} ${a.hora} · ${a.com}` }))), { go: 'agendamentos/0' }], ['Pedidos por assunto', A.bars(byKey(db.atendimentos, 'assunto'))], ['Pré-inscrições por estado', A.bars(byKey(db.preinscricoes, 'estado'))]]; })],
        ['Atendimentos', T('atendimentos', { where: (r) => r.data >= '2026-10-26', ro: 1 })],
        ['Pendências', T('atendimentos', { where: (r) => r.estado === 'Pendente', actions: [{ l: 'Resolver', icon: 'check', set: { estado: 'Resolvido' } }] })]
      ]),
      tab('preinscricoes', 'Pré-inscrições', 'plus', [
        ['Registar', { v: 'form', title: 'Nova pré-inscrição', mod: 'Atendimento', logAction: 'Pré-inscrição', fields: A.fieldsFrom('preinscricoes', ['nome', 'sexo', 'nascimento', 'classe', 'curso', 'turno', 'encarregado', 'telefone', 'origem']), get: () => ({ origem: 'Presencial', turno: 'Manhã' }), set: (ctx, v) => ctx.db.preinscricoes.unshift({ ...v, id: `PI-${String(ctx.db.preinscricoes.length + 1).padStart(4, '0')}`, data: A.TODAY, estado: 'Nova' }), done: 'Pré-inscrição registada.', after: () => A.go('preinscricoes', 1) }],
        ['Pesquisar', T('preinscricoes', { filters: ['q', 'classe', 'estado', '~data'], ro: 1 })],
        ['Acompanhar', T('preinscricoes', { where: (r) => !['Rejeitada'].includes(r.estado), filters: ['q', 'estado'], ro: 1 })]
      ]),
      tab('candidatos', 'Candidatos', 'users', [['Contactos', T('preinscricoes', { cols: ['nome', 'encarregado', 'telefone', 'data'], ro: 1 })], ['Curso pretendido', T('preinscricoes', { cols: ['nome', 'classe', 'curso', 'turno'], filters: ['q', 'curso', 'classe'], ro: 1 })], ['Estado do pedido', T('preinscricoes', { cols: ['id', 'nome', 'classe', 'estado'], filters: ['q', 'estado'], ro: 1 })]]),
      tab('oferta', 'Oferta formativa', 'grad', [['Cursos', T('cursos', { ro: 1 })], ['Classes', T('classes', { ro: 1 })], ['Turnos', T('turnos', { ro: 1 })], ['Vagas autorizadas', T('turmas', { cols: ['nome', 'classe', 'curso', 'turno', 'vagas'], filters: ['classe', 'turno'], ro: 1 })]]),
      tab('atendimento', 'Atendimento', 'message', [
        ['Registar pedidos', T('atendimentos', { create: 'Novo atendimento', defaults: () => ({ data: A.TODAY, hora: A.now().slice(11), estado: 'Pendente', encaminhado: '—', canal: 'Presencial' }), filters: ['q', 'canal', 'estado', '~data'], actions: [{ l: 'Resolver', icon: 'check', when: (r) => r.estado === 'Pendente', set: { estado: 'Resolvido' } }] })],
        ['Dúvidas', T('atendimentos', { where: (r) => /Informação|Horários|Vagas/.test(r.assunto), filters: ['q', 'estado'], ro: 1 })],
        ['Encaminhamentos', T('atendimentos', { where: (r) => r.estado !== 'Resolvido', actions: [{ l: 'Encaminhar', icon: 'send', open: (r, ctx, refresh) => A.modal({ title: 'Encaminhar pedido', sub: esc(r.assunto), size: 'sm', body: A.formHtml([{ k: 'p', l: 'Encaminhar para', o: ['Secretaria', 'Tesouraria', 'Direção', 'Direção pedagógica'], req: 1 }]), actions: [{ l: 'Cancelar' }, { l: 'Encaminhar', cls: 'primary', fn: (b) => { r.encaminhado = b.querySelector('[name=p]').value; r.estado = 'Encaminhado'; ctx.log('Atendimento', 'Encaminhamento', `${r.assunto} → ${r.encaminhado}`); ctx.save(); refresh(); A.toast('Pedido encaminhado.'); } }] }) }] })]
      ]),
      tab('pendentes', 'Documentos pendentes', 'alert', [['Documentos em falta', T('docsPendentes', { where: (r) => r.estado === 'Em falta', cols: ['processo', 'aluno', 'turma', 'documento', 'prazo'], filters: ['q', 'documento'], ro: 1 })]]),
      tab('agendamentos', 'Agendamentos', 'calendar', [
        ['Visitas', T('agendamentos', { where: (r) => r.tipo === 'Visita às instalações', create: 'Agendar visita', defaults: () => ({ tipo: 'Visita às instalações', com: 'Receção', estado: 'Por confirmar' }), actions: [{ l: 'Confirmar', icon: 'check', when: (r) => r.estado === 'Por confirmar', set: { estado: 'Confirmado' } }] })],
        ['Reuniões', T('agendamentos', { where: (r) => r.tipo === 'Reunião com a direção', create: 'Agendar reunião', defaults: () => ({ tipo: 'Reunião com a direção', estado: 'Por confirmar' }), actions: [{ l: 'Confirmar', icon: 'check', when: (r) => r.estado === 'Por confirmar', set: { estado: 'Confirmado' } }] })],
        ['Atendimentos', T('agendamentos', { where: (r) => !['Visita às instalações', 'Reunião com a direção'].includes(r.tipo), create: 'Agendar atendimento', defaults: () => ({ tipo: 'Atendimento na secretaria', estado: 'Por confirmar' }), actions: ['edit'] })]
      ]),
      tab('encaminhamentos', 'Encaminhamentos', 'send', [['Enviar processos para a secretaria', T('preinscricoes', { where: (r) => ['Nova', 'Em análise', 'Documentos em falta', 'Encaminhada'].includes(r.estado), filters: ['q', 'estado'], actions: [{ l: 'Encaminhar à secretaria', icon: 'send', cls: 'primary', when: (r) => r.estado !== 'Encaminhada', confirm: 'Enviar este processo de pré-inscrição para a secretaria?', set: { estado: 'Encaminhada' }, log: 'Encaminhamento à secretaria' }] })]]),
      tab('relatorios', 'Relatórios', 'chart', [['Pedidos por período e estado', R(() => [{ t: 'Atendimentos por estado', ds: 'atendimentos', group: 'estado', gl: 'Estado' }, { t: 'Atendimentos por dia', ds: 'atendimentos', group: 'data', gl: 'Data' }, { t: 'Pré-inscrições por estado', ds: 'preinscricoes', group: 'estado', gl: 'Estado' }, { t: 'Pré-inscrições por mês', ds: 'preinscricoes', group: (r) => r.data.slice(0, 7), gl: 'Mês' }])]]),
      PROFILE()
    ]
  };

  /* =====================================================================
     17. RESPONSÁVEL DISCIPLINAR
     ===================================================================== */
  const DISC = {
    id: 'disc', nome: 'Responsável disciplinar', short: 'Disciplina', mod: 'Disciplina', perms: ['disciplina', 'search'],
    user: () => ({ nome: 'António Cristóvão', email: 'antonio.cristovao@acura.ao', telefone: '+244 923 001 101', morada: 'Morro Bento, Luanda' }),
    badges: { processos: (ctx) => ctx.db.disciplinares.filter((p) => p.estado === 'Em instrução').length },
    tabs: [
      tab('dashboard', 'Dashboard disciplinar', 'home', [
        ['Ocorrências abertas', D((ctx) => { const db = ctx.db; const d = db.disciplinares; return [['Processos em instrução', d.filter((p) => p.estado === 'Em instrução').length, '', 'warn', 'flag'], ['Encaminhados à direção', d.filter((p) => p.estado === 'Encaminhado à direção').length, '', 'info', 'send'], ['Concluídos', d.filter((p) => p.estado === 'Concluído').length, '', 'ok', 'checkCircle'], ['Muito graves', d.filter((p) => p.gravidade === 'Muito grave').length, '', 'bad', 'alert']]; }, (ctx) => { const db = ctx.db; return [['Processos em instrução', A.list(db.disciplinares.filter((p) => p.estado === 'Em instrução').map((p) => ({ tone: A.tone(p.gravidade), t: `${p.id} — ${p.aluno}`, m: `${p.tipo} · ${p.turma} · ${A.date(p.data)}` }))), { go: 'processos/0' }], ['Por tipo', A.bars(byKey(db.disciplinares, 'tipo'))], ['Ocorrências encaminhadas pelos DT', A.list(db.ocorrencias.filter((o) => o.estado === 'Encaminhada').slice(0, 5).map((o) => ({ tone: 'info', t: `${o.aluno} — ${o.descricao}`, m: `${o.turma} · ${o.registadoPor}` })), 'Sem encaminhamentos.')], ['Acompanhamentos recentes', A.list(db.acompanhamentos.slice(0, 5).map((a) => ({ tone: A.tone(a.evolucao), t: `${a.aluno} — ${a.medida}`, m: `${a.processoId} · ${A.date(a.data)}` }))), { go: 'acompanhamento/0' }]]; })],
        ['Pendências', AL((ctx) => [...ctx.db.disciplinares.filter((p) => p.estado === 'Em instrução').map((p) => ({ t: `Concluir instrução: ${p.id} (${p.aluno})`, m: p.tipo, tone: p.gravidade === 'Muito grave' ? 'bad' : 'warn', go: 'processos/0' })), ...ctx.db.notifDisc.filter((n) => n.estado === 'Pendente').map((n) => ({ t: `Notificação por enviar: ${n.encarregado}`, m: n.processoId, tone: 'warn', go: 'notificacoes/0' }))])],
        ['Acompanhamentos', T('acompanhamentos', { ro: 1 })]
      ]),
      tab('nova', 'Nova ocorrência', 'plus', [['Registar ocorrência', { v: 'form', title: 'Nova ocorrência disciplinar', mod: 'Disciplina', logAction: 'Abertura de processo disciplinar', crit: 1, note: 'O processo é criado com acesso restrito: não aparece em pesquisas gerais de alunos para utilizadores sem autorização.', noteIcon: 'lock',
        fields: [{ k: 'data', l: 'Data', t: 'date', req: 1 }, { k: 'aluno', l: 'Aluno', req: 1, o: (db) => Q.ativos(db).map((a) => `${a.processo} — ${a.nome} (${a.turma})`) }, { k: 'tipo', l: 'Tipo', req: 1, o: A.SCHEMA.disciplinares.f.tipo.o }, { k: 'gravidade', l: 'Gravidade', req: 1, o: ['Leve', 'Grave', 'Muito grave'] }, { k: 'descricao', l: 'Descrição dos factos', t: 'area', req: 1 }, { k: 'intervenientes', l: 'Intervenientes e testemunhas', full: 1 }],
        get: () => ({ data: A.TODAY }), set: (ctx, v) => { const a = A.resolveAluno(ctx.db, v.aluno); const id = `PD-2026/${String(ctx.db.disciplinares.length + 1).padStart(3, '0')}`; ctx.db.disciplinares.unshift({ id, data: v.data, alunoId: a.id, aluno: a.nome, processo: a.processo, turmaId: a.turmaId, turma: a.turma, tipo: v.tipo, gravidade: v.gravidade, descricao: v.descricao, intervenientes: v.intervenientes || a.nome, medida: '—', responsavel: ctx.user.nome, estado: 'Em instrução' }); A.toast(`Processo ${id} aberto.`); }, done: 'Ocorrência registada.', after: () => A.go('processos', 0) }]]),
      tab('processos', 'Processos disciplinares', 'flag', [
        ['Lista', T('disciplinares', { filters: ['q', 'estado', 'gravidade', 'turma'], actions: ['edit', { l: 'Concluir', icon: 'check', when: (r) => r.estado === 'Em instrução', open: (r, ctx, refresh) => A.modal({ title: `Concluir ${r.id}`, size: 'sm', body: A.formHtml([{ k: 'medida', l: 'Medida aplicada', req: 1, o: ['Advertência', 'Repreensão registada', 'Atividades de integração', 'Arquivamento'] }]), actions: [{ l: 'Cancelar' }, { l: 'Concluir', cls: 'primary', fn: (b) => { r.medida = b.querySelector('[name=medida]').value; r.estado = r.medida === 'Arquivamento' ? 'Arquivado' : 'Concluído'; ctx.log('Disciplina', 'Conclusão de processo', `${r.id}: ${r.medida}`, 1); ctx.save(); refresh(); A.toast('Processo concluído.'); } }] }) }] })],
        ['Pesquisa', T('disciplinares', { filters: [{ k: 'q', t: 'q', ph: 'N.º do processo, aluno ou tipo' }, 'tipo', 'turma', '~data'], ro: 1 })],
        ['Detalhes autorizados', T('disciplinares', { cols: ['id', 'aluno', 'tipo', 'intervenientes', 'medida', 'responsavel', 'estado'], ro: 1, note: 'Acesso restrito: os detalhes só são visíveis para o responsável disciplinar e a direção. Cada consulta fica registada.', noteIcon: 'lock' })]
      ]),
      tab('acompanhamento', 'Acompanhamento', 'eye', [
        ['Medidas adotadas', T('acompanhamentos', { create: 'Registar acompanhamento', defaults: () => ({ data: A.TODAY, evolucao: 'Estável' }), filters: ['q', 'evolucao'] })],
        ['Observações', T('acompanhamentos', { cols: ['data', 'aluno', 'observacao'], ro: 1 })],
        ['Evolução', H((ctx) => A.section('Evolução dos acompanhamentos', A.donut(byKey(ctx.db.acompanhamentos, 'evolucao').map(([l, v]) => [l, v, { Positiva: 'var(--ok)', Estável: 'var(--warn)', Negativa: 'var(--bad)' }[l]]), ctx.db.acompanhamentos.length)))]
      ]),
      tab('notificacoes', 'Notificações', 'send', [['Comunicações aos encarregados', T('notifDisc', { create: 'Nova notificação', defaults: () => ({ data: A.TODAY, estado: 'Pendente', canal: 'SMS' }), actions: [{ l: 'Enviar', icon: 'send', cls: 'primary', when: (r) => r.estado === 'Pendente', set: { estado: 'Enviada' }, log: 'Notificação disciplinar' }], note: 'Só são comunicadas aos encarregados as informações autorizadas. Os detalhes do processo não são partilhados.' })]]),
      tab('encaminhamentos', 'Encaminhamentos', 'send', [['Processos enviados à direção', T('disciplinares', { where: (r) => ['Em instrução', 'Encaminhado à direção'].includes(r.estado), cols: ['id', 'data', 'aluno', 'tipo', 'gravidade', 'estado'], actions: [{ l: 'Encaminhar à direção', icon: 'send', cls: 'primary', when: (r) => r.estado === 'Em instrução', reason: 'Proposta de medida e fundamentação', set: { estado: 'Encaminhado à direção' }, log: 'Encaminhamento à direção', crit: 1 }] })]]),
      tab('historico', 'Histórico', 'history', [['Ocorrências anteriores', T('disciplinares', { where: (r) => ['Concluído', 'Arquivado'].includes(r.estado), filters: ['q', 'tipo', '~data'], ro: 1 })]]),
      tab('relatorios', 'Relatórios', 'chart', [['Estatísticas', H((ctx) => `<div class="grid2">${A.section('Por tipo', A.bars(byKey(ctx.db.disciplinares, 'tipo')))}${A.section('Por gravidade', A.bars(byKey(ctx.db.disciplinares, 'gravidade')))}${A.section('Por turma', A.bars(byKey(ctx.db.disciplinares, 'turma')))}${A.section('Por estado', A.bars(byKey(ctx.db.disciplinares, 'estado')))}</div>`)], ['Relatórios autorizados', R(() => [{ t: 'Processos por turma', ds: 'disciplinares', group: 'turma', gl: 'Turma' }, { t: 'Processos por tipo e gravidade', ds: 'disciplinares', group: (r) => `${r.tipo} · ${r.gravidade}`, gl: 'Tipo / gravidade' }])]]),
      PROFILE()
    ]
  };

  A.ROLES = [ADMIN, DG, DP, DT, SEC, PROF, TES, CONT, STOCK, RH, BIB, AUD, ALUNO, ENC, REC, DISC];
  A.ROLE_GROUPS = [['Gestão', ['admin', 'dg', 'dp', 'aud']], ['Académico', ['dt', 'prof', 'disc']], ['Serviços', ['sec', 'rec', 'tes', 'cont', 'stock', 'rh', 'bib']], ['Portal', ['aluno', 'enc']]];
})();
