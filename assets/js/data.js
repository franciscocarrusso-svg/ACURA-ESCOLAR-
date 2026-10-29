/* Acura Escolar — dados de demonstração e esquema dos conjuntos de dados */
(function () {
  const A = (window.App = window.App || {});

  A.TODAY = '2026-10-29';
  A.YEAR = '2026/2027';
  A.PERIODS = ['1º Trimestre', '2º Trimestre', '3º Trimestre'];

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  A.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 100000) / 100000;
  };

  const FIRST_M = ['João', 'Pedro', 'Manuel', 'António', 'Miguel', 'Paulo', 'Domingos', 'Francisco', 'Carlos', 'José', 'Mateus', 'Adilson', 'Edson', 'Hélder', 'Nelson', 'Bruno', 'Ricardo', 'Lucas', 'Daniel', 'Kelson', 'Valter', 'Osvaldo'];
  const FIRST_F = ['Ana', 'Maria', 'Joana', 'Teresa', 'Isabel', 'Luísa', 'Esperança', 'Graça', 'Rosa', 'Beatriz', 'Marta', 'Sofia', 'Inês', 'Celeste', 'Yolanda', 'Djamila', 'Neusa', 'Carla', 'Patrícia', 'Wilma', 'Elsa', 'Mirian'];
  const LAST = ['Silva', 'Santos', 'Fernandes', 'Kiala', 'Neto', 'Cardoso', 'Mendes', 'Gomes', 'Lopes', 'Baptista', 'Sebastião', 'Domingos', 'Cristóvão', 'Tavares', 'Pereira', 'Mateus', 'Lourenço', 'Bastos', 'Matos', 'Correia', 'Quintas', 'Nzinga', 'Cassule', 'Muanza', 'Dala', 'Capita', 'Manuel'];
  const BAIRROS = ['Maianga', 'Alvalade', 'Talatona', 'Kilamba', 'Viana', 'Cazenga', 'Rangel', 'Ingombota', 'Benfica', 'Morro Bento', 'Patriota'];

  A.buildDB = function () {
    const r = mulberry(20261029);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const int = (a, b) => a + Math.floor(r() * (b - a + 1));
    const pad = (n, l = 4) => String(n).padStart(l, '0');
    const day = (a, b) => {
      const t = new Date(a + 'T12:00:00').getTime() + r() * (new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00'));
      return new Date(t).toISOString().slice(0, 10);
    };
    const person = (s) => `${pick(s === 'F' ? FIRST_F : FIRST_M)} ${pick(LAST)} ${pick(LAST)}`;
    const phone = () => `+244 9${int(1, 5)}${int(0, 9)} ${int(100, 999)} ${int(100, 999)}`;
    const mail = (n, dom = 'acura.ao') => {
      const p = n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(dr|dra|prof)\.?\s+/, '').split(' ');
      return `${p[0]}.${p[p.length - 1]}@${dom}`;
    };
    const time = () => `${pad(int(7, 18), 2)}:${pad(int(0, 59), 2)}`;
    const T = A.TODAY, Y = A.YEAR;
    const db = { version: 3 };

    db.escola = {
      nome: 'Colégio Acura', sigla: 'CA', nif: '5417239011', codigo: 'MED-LDA-0457',
      decreto: 'Decreto Executivo n.º 128/2014', natureza: 'Privada', niveis: 'I e II Ciclo do Ensino Secundário',
      endereco: 'Rua Comandante Gika, n.º 214', bairro: 'Maianga', cidade: 'Luanda', provincia: 'Luanda', pais: 'Angola',
      telefone: '+244 222 000 457', telemovel: '+244 923 457 000', email: 'geral@acura.ao', site: 'www.acura.ao',
      diretor: 'Dr. Manuel Kiala', anoLetivo: Y, lema: 'Educar com rigor, formar com valores.'
    };

    db.licenca = {
      plano: 'Profissional', inicio: '2025-09-01', validade: '2027-08-31',
      limites: { alunos: 300, utilizadores: 45, armazenamento: 20, sms: 5000 },
      uso: { armazenamento: 6.4, sms: 3120 },
      modulos: [
        { id: 'academico', nome: 'Gestão académica', desc: 'Estrutura, notas, pautas, assiduidade', contratado: true, ativo: true },
        { id: 'secretaria', nome: 'Secretaria', desc: 'Matrículas, processos e documentos', contratado: true, ativo: true },
        { id: 'financeiro', nome: 'Tesouraria', desc: 'Cobranças, pagamentos, recibos e caixa', contratado: true, ativo: true },
        { id: 'contabilidade', nome: 'Contabilidade', desc: 'Diário, razão e balancetes', contratado: true, ativo: true },
        { id: 'fiscal', nome: 'Fiscalidade avançada', desc: 'Mapas fiscais e obrigações', contratado: false, ativo: false },
        { id: 'stock', nome: 'Stock e vendas', desc: 'Artigos, inventário e vendas', contratado: true, ativo: true },
        { id: 'rh', nome: 'Recursos humanos', desc: 'Funcionários, contratos e assiduidade', contratado: true, ativo: true },
        { id: 'biblioteca', nome: 'Biblioteca', desc: 'Catálogo, empréstimos e reservas', contratado: true, ativo: true },
        { id: 'portal', nome: 'Portal aluno / encarregado', desc: 'Acesso web e móvel', contratado: true, ativo: true },
        { id: 'comunicacao', nome: 'Comunicação e SMS', desc: 'Avisos, circulares e notificações', contratado: true, ativo: true },
        { id: 'pagdigitais', nome: 'Pagamentos digitais', desc: 'Referências e Multicaixa Express', contratado: true, ativo: false },
        { id: 'recrutamento', nome: 'Recrutamento', desc: 'Candidatos e seleção', contratado: false, ativo: false }
      ]
    };

    db.disciplinas = [
      ['MAT', 'Matemática', 5], ['POR', 'Língua Portuguesa', 4], ['ING', 'Língua Inglesa', 3], ['HIS', 'História', 2],
      ['GEO', 'Geografia', 2], ['BIO', 'Biologia', 3], ['FIS', 'Física', 3], ['QUI', 'Química', 3], ['EDF', 'Educação Física', 2],
      ['FIL', 'Filosofia', 2], ['ECO', 'Economia', 3], ['INF', 'Informática', 3]
    ].map(([id, nome, carga]) => ({ id, codigo: id, nome, carga, area: ['MAT', 'FIS', 'QUI', 'INF'].includes(id) ? 'Ciências exatas' : ['BIO', 'GEO'].includes(id) ? 'Ciências naturais' : 'Humanidades', estado: 'Ativa' }));
    const DN = Object.fromEntries(db.disciplinas.map((d) => [d.id, d.nome]));

    db.cursos = [
      { codigo: 'EG', nome: 'Ensino Geral', ciclo: 'I Ciclo', duracao: '3 anos', coordenador: 'Dra. Teresa Neto', estado: 'Ativo' },
      { codigo: 'CFB', nome: 'Ciências Físicas e Biológicas', ciclo: 'II Ciclo', duracao: '3 anos', coordenador: 'Domingos Cassule', estado: 'Ativo' },
      { codigo: 'CEJ', nome: 'Ciências Económicas e Jurídicas', ciclo: 'II Ciclo', duracao: '3 anos', coordenador: 'Rosa Quintas', estado: 'Ativo' },
      { codigo: 'INF', nome: 'Informática', ciclo: 'II Ciclo', duracao: '3 anos', coordenador: 'Edson Lourenço', estado: 'Ativo' }
    ];
    const PLANO = {
      EG: ['MAT', 'POR', 'ING', 'HIS', 'GEO', 'BIO', 'FIS', 'EDF'],
      CFB: ['MAT', 'POR', 'ING', 'FIS', 'QUI', 'BIO', 'FIL', 'EDF'],
      CEJ: ['MAT', 'POR', 'ING', 'ECO', 'HIS', 'GEO', 'FIL', 'EDF'],
      INF: ['MAT', 'POR', 'ING', 'FIS', 'INF', 'QUI', 'FIL', 'EDF']
    };

    db.anos = [
      { ano: '2025/2026', inicio: '2025-09-01', fim: '2026-07-31', estado: 'Encerrado' },
      { ano: '2026/2027', inicio: '2026-09-01', fim: '2027-07-30', estado: 'Em curso' },
      { ano: '2027/2028', inicio: '2027-09-01', fim: '2028-07-28', estado: 'Planeado' }
    ];
    db.periodos = [
      { nome: '1º Trimestre', ano: Y, inicio: '2026-09-01', fim: '2026-12-11', estado: 'Em curso', lancamento: '2026-12-04' },
      { nome: '2º Trimestre', ano: Y, inicio: '2027-01-06', fim: '2027-04-02', estado: 'Planeado', lancamento: '2027-03-26' },
      { nome: '3º Trimestre', ano: Y, inicio: '2027-04-12', fim: '2027-07-02', estado: 'Planeado', lancamento: '2027-06-25' }
    ];
    db.turnos = [
      { nome: 'Manhã', inicio: '07:30', fim: '12:40', estado: 'Ativo' },
      { nome: 'Tarde', inicio: '13:00', fim: '18:10', estado: 'Ativo' },
      { nome: 'Noite', inicio: '18:30', fim: '22:00', estado: 'Inativo' }
    ];
    db.salas = [];
    for (let i = 1; i <= 8; i++) db.salas.push({ nome: `Sala ${pad(i, 2)}`, tipo: 'Sala de aula', capacidade: 35, bloco: i <= 4 ? 'Bloco A' : 'Bloco B', estado: 'Disponível' });
    db.salas.push(
      { nome: 'Laboratório', tipo: 'Laboratório de ciências', capacidade: 28, bloco: 'Bloco C', estado: 'Disponível' },
      { nome: 'Lab. Informática', tipo: 'Laboratório', capacidade: 30, bloco: 'Bloco C', estado: 'Disponível' },
      { nome: 'Pavilhão', tipo: 'Desportivo', capacidade: 80, bloco: 'Exterior', estado: 'Disponível' },
      { nome: 'Biblioteca', tipo: 'Biblioteca', capacidade: 40, bloco: 'Bloco A', estado: 'Disponível' },
      { nome: 'Sala de reuniões', tipo: 'Reuniões', capacidade: 16, bloco: 'Administração', estado: 'Em manutenção' }
    );

    // Professores
    const TD = [['MAT', 'FIS'], ['MAT'], ['POR'], ['POR', 'FIL'], ['ING'], ['HIS', 'GEO'], ['GEO'], ['BIO', 'QUI'], ['FIS'], ['QUI'], ['EDF'], ['FIL'], ['ECO'], ['INF'], ['ING'], ['BIO']];
    const FIXED_T = { 0: 'Domingos Cassule', 2: 'Rosa Quintas', 13: 'Edson Lourenço' };
    db.professores = TD.map((ds, i) => {
      const s = i % 3 === 2 ? 'F' : 'M';
      const nome = FIXED_T[i] || person(i === 2 ? 'F' : s);
      return {
        id: `PR${pad(i + 1, 2)}`, nome, sexo: i === 2 ? 'F' : s, disciplinas: ds.map((d) => DN[d]).join(', '), discIds: ds,
        categoria: pick(['Licenciado', 'Licenciado', 'Mestre', 'Bacharel']), contrato: i < 11 ? 'Efetivo' : 'Colaborador',
        admissao: day('2012-01-10', '2025-08-30'), telefone: phone(), email: mail(nome), estado: i === 15 ? 'De licença' : 'Ativo', carga: 0
      };
    });

    // Turmas
    const TURMAS = [
      ['7ª A', '7ª Classe', 'EG', 'Manhã'], ['7ª B', '7ª Classe', 'EG', 'Manhã'], ['8ª A', '8ª Classe', 'EG', 'Manhã'], ['8ª B', '8ª Classe', 'EG', 'Manhã'],
      ['9ª A', '9ª Classe', 'EG', 'Manhã'], ['9ª B', '9ª Classe', 'EG', 'Manhã'], ['10ª CFB', '10ª Classe', 'CFB', 'Tarde'], ['10ª CEJ', '10ª Classe', 'CEJ', 'Tarde'],
      ['11ª CFB', '11ª Classe', 'CFB', 'Tarde'], ['11ª INF', '11ª Classe', 'INF', 'Tarde'], ['12ª CFB', '12ª Classe', 'CFB', 'Tarde'], ['12ª CEJ', '12ª Classe', 'CEJ', 'Tarde']
    ];
    const DT_OF = [5, 8, 2, 2, 6, 0, 1, 12, 7, 13, 9, 3];
    db.turmas = TURMAS.map(([nome, classe, c, turno], i) => ({
      id: `T${pad(i + 1, 2)}`, nome, classe, curso: db.cursos.find((x) => x.codigo === c).nome, cursoId: c, turno,
      sala: `Sala ${pad((i % 6) + 1, 2)}`, capacidade: 30, alunos: 0, dt: db.professores[DT_OF[i]].nome, dtId: db.professores[DT_OF[i]].id, ano: Y, disciplinas: PLANO[c]
    }));
    db.classes = ['7ª', '8ª', '9ª', '10ª', '11ª', '12ª'].map((c, i) => ({
      nome: `${c} Classe`, ciclo: i < 3 ? 'I Ciclo' : 'II Ciclo', exame: c === '9ª' || c === '12ª' ? 'Sim' : 'Não',
      propina: i < 3 ? 25000 : 35000, turmas: db.turmas.filter((t) => t.classe === `${c} Classe`).length, alunos: 0
    }));

    // Distribuição de serviço docente
    db.distribuicao = [];
    const rr = {};
    db.turmas.forEach((t) => {
      t.disciplinas.forEach((d) => {
        const cands = db.professores.filter((p) => p.discIds.includes(d) && p.estado === 'Ativo');
        rr[d] = (rr[d] || 0) + 1;
        let p = cands[rr[d] % cands.length];
        if (d === 'MAT' && ['T03', 'T05', 'T07', 'T09'].includes(t.id)) p = db.professores[0];
        if (d === 'MAT' && t.id === 'T01') p = db.professores[1];
        const disc = db.disciplinas.find((x) => x.id === d);
        db.distribuicao.push({ id: `${t.id}-${d}`, turmaId: t.id, turma: t.nome, discId: d, disciplina: DN[d], profId: p.id, professor: p.nome, carga: disc.carga, turno: t.turno, estado: 'Atribuída' });
        p.carga += disc.carga;
      });
    });
    // Professor Domingos Cassule ensina Física numa turma do II ciclo
    const fis = db.distribuicao.find((x) => x.turmaId === 'T11' && x.discId === 'FIS');
    if (fis) { const old = db.professores.find((p) => p.id === fis.profId); old.carga -= fis.carga; fis.profId = 'PR01'; fis.professor = db.professores[0].nome; db.professores[0].carga += fis.carga; }

    // Horários
    const HM = ['07:30', '08:20', '09:10', '10:10', '11:00', '11:50'];
    const HT = ['13:00', '13:50', '14:40', '15:40', '16:30', '17:20'];
    db.DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    db.HORAS = { Manhã: HM, Tarde: HT };
    db.horarios = [];
    const busy = {};
    db.turmas.forEach((t, ti) => {
      const need = [];
      t.disciplinas.forEach((d) => { const c = db.disciplinas.find((x) => x.id === d).carga; for (let k = 0; k < c; k++) need.push(d); });
      for (let s = 0; s < (ti * 3) % need.length; s++) need.push(need.shift());
      for (let di = 0; di < 5; di++) {
        for (let si = 0; si < 6; si++) {
          if (!need.length) break;
          let idx = need.findIndex((d, j) => {
            const dist = db.distribuicao.find((x) => x.turmaId === t.id && x.discId === d);
            const sameDay = db.horarios.filter((h) => h.turmaId === t.id && h.dia === di && h.discId === d).length;
            return !busy[`${dist.profId}|${t.turno}|${di}|${si}`] && sameDay < 2 && j < 12;
          });
          if (idx < 0) continue;
          const d = need.splice(idx, 1)[0];
          const dist = db.distribuicao.find((x) => x.turmaId === t.id && x.discId === d);
          busy[`${dist.profId}|${t.turno}|${di}|${si}`] = 1;
          const sala = d === 'EDF' ? 'Pavilhão' : d === 'INF' ? 'Lab. Informática' : (d === 'QUI' || d === 'BIO') && t.turno === 'Tarde' ? 'Laboratório' : t.sala;
          db.horarios.push({ turmaId: t.id, turma: t.nome, turno: t.turno, dia: di, slot: si, hora: (t.turno === 'Manhã' ? HM : HT)[si], discId: d, disciplina: DN[d], profId: dist.profId, professor: dist.professor, sala });
        }
      }
    });

    // Encarregados e alunos
    db.encarregados = [];
    db.alunos = [];
    let nA = 0;
    db.turmas.forEach((t, ti) => {
      const n = int(16, 24);
      const ageBase = 12 + Math.floor(ti / 2);
      for (let k = 0; k < n; k++) {
        nA++;
        const sexo = r() < 0.52 ? 'F' : 'M';
        const nome = person(sexo);
        let enc;
        if (db.encarregados.length && r() < 0.18) enc = pick(db.encarregados.slice(-25));
        else {
          const es = r() < 0.55 ? 'F' : 'M';
          const en = `${pick(es === 'F' ? FIRST_F : FIRST_M)} ${pick(LAST)} ${nome.split(' ').pop()}`;
          enc = { id: `E${pad(db.encarregados.length + 1, 3)}`, nome: en, parentesco: es === 'F' ? pick(['Mãe', 'Mãe', 'Tia', 'Avó']) : pick(['Pai', 'Pai', 'Tio', 'Avô']), telefone: phone(), email: mail(en, 'gmail.com'), profissao: pick(['Professor(a)', 'Enfermeiro(a)', 'Engenheiro(a)', 'Comerciante', 'Funcionário(a) público(a)', 'Empresário(a)', 'Contabilista', 'Motorista']), morada: `${pick(BAIRROS)}, Luanda`, educandos: '', ids: [], estado: 'Ativo' };
          db.encarregados.push(enc);
        }
        const roll = r();
        const estado = roll < 0.88 ? 'Ativa' : roll < 0.94 ? 'Pendente' : roll < 0.97 ? 'Transferida' : 'Anulada';
        const a = {
          id: `A${pad(nA)}`, processo: `${2026}${pad(nA)}`, nome, sexo, nascimento: day(`${2026 - ageBase - 1}-01-01`, `${2026 - ageBase}-12-31`),
          classe: t.classe, curso: t.curso, turma: t.nome, turmaId: t.id, turno: t.turno, ano: Y, estado,
          dataMatricula: day('2026-07-15', '2026-09-25'), encarregado: enc.nome, encId: enc.id, telefone: enc.telefone,
          bi: `00${int(1000000, 9999999)}LA0${int(10, 99)}`, morada: enc.morada, apt: 7 + r() * 10, bolsa: r() < 0.06 ? 'Bolsa de mérito 50%' : r() < 0.05 ? 'Desconto irmãos 10%' : '—',
          numero: k + 1
        };
        db.alunos.push(a);
        enc.ids.push(a.id);
      }
    });
    db.encarregados.forEach((e) => { e.educandos = e.ids.map((id) => db.alunos.find((a) => a.id === id).nome.split(' ')[0]).join(', '); e.nEducandos = e.ids.length; });
    // garantir um encarregado demo com 2 educandos em turmas diferentes
    let demoEnc = db.encarregados.find((e) => e.ids.length >= 2 && new Set(e.ids.map((id) => db.alunos.find((a) => a.id === id).turmaId)).size > 1) || db.encarregados.find((e) => e.ids.length >= 2);
    db.demo = { encId: demoEnc.id, alunoId: db.alunos.find((a) => a.turmaId === 'T03' && a.estado === 'Ativa').id, profId: 'PR01', dtId: 'PR03' };
    demoEnc.nome = 'Graça Mendes Neto'; demoEnc.parentesco = 'Mãe';
    demoEnc.ids.forEach((id) => { const a = db.alunos.find((x) => x.id === id); a.encarregado = demoEnc.nome; a.estado = 'Ativa'; });
    const demoAluno = db.alunos.find((a) => a.id === db.demo.alunoId);
    demoAluno.nome = 'Beatriz Kiala Santos'; demoAluno.sexo = 'F'; demoAluno.apt = 14.6;

    db.turmas.forEach((t) => { t.alunos = db.alunos.filter((a) => a.turmaId === t.id && a.estado !== 'Anulada' && a.estado !== 'Transferida').length; t.vagas = t.capacidade - t.alunos; });
    db.classes.forEach((c) => { c.alunos = db.alunos.filter((a) => a.classe === c.nome && a.estado === 'Ativa').length; });

    // Notas (alterações guardadas em db.notas; restantes calculadas)
    db.notas = {};
    db.pautas = db.distribuicao.map((d, i) => {
      const est = d.profId === 'PR01' ? (['T03', 'T05'].includes(d.turmaId) ? 'Submetida' : d.turmaId === 'T07' ? 'Devolvida' : 'Rascunho') : pick(['Rascunho', 'Rascunho', 'Submetida', 'Aprovada']);
      return { id: `PT${pad(i + 1, 3)}`, turmaId: d.turmaId, turma: d.turma, discId: d.discId, disciplina: d.disciplina, profId: d.profId, professor: d.professor, periodo: '1º Trimestre', estado: est, atualizada: day('2026-10-10', T), obs: est === 'Devolvida' ? 'Verificar NPT de 3 alunos sem classificação.' : '' };
    });

    // Assiduidade
    db.faltas = [];
    const ativos = db.alunos.filter((a) => a.estado === 'Ativa');
    for (let i = 0; i < 520; i++) {
      const a = r() < 0.3 ? pick(ativos.slice(0, 40)) : pick(ativos);
      const t = db.turmas.find((x) => x.id === a.turmaId);
      const d = pick(t.disciplinas);
      let dt = day('2026-09-14', T);
      const wd = new Date(dt + 'T12:00:00').getDay(); if (wd === 0 || wd === 6) dt = day('2026-10-19', '2026-10-23');
      const tipo = r() < 0.72 ? 'Falta' : 'Atraso';
      db.faltas.push({ id: `FT${pad(i + 1)}`, alunoId: a.id, aluno: a.nome, processo: a.processo, turmaId: t.id, turma: t.nome, discId: d, disciplina: DN[d], data: dt, tipo, justificada: r() < 0.38 ? 'Sim' : 'Não', motivo: '' });
    }
    db.faltas.forEach((f) => { if (f.justificada === 'Sim') f.motivo = pick(['Doença', 'Consulta médica', 'Motivos familiares', 'Transporte']); });
    db.faltas.sort((a, b) => (a.data < b.data ? 1 : -1));
    db.faltasProf = [];
    for (let i = 0; i < 25; i++) { const p = pick(db.professores); db.faltasProf.push({ id: `FP${i}`, nome: p.nome, tipo: pick(['Presença', 'Falta', 'Atraso', 'Presença']), data: day('2026-10-01', T), justificada: pick(['Sim', 'Não', '—']), obs: '' }); }

    // Financeiro
    const PROP = (a) => (['7ª Classe', '8ª Classe', '9ª Classe'].includes(a.classe) ? 25000 : 35000);
    db.cobrancas = []; db.pagamentos = [];
    const OPS = ['Carlos Mendes', 'Carlos Mendes', 'Lúcia Dala'];
    const METH = ['Numerário', 'Transferência', 'Multicaixa Express', 'TPA', 'Numerário'];
    let nC = 0, nR = 0;
    const addCharge = (a, tipo, descricao, valor, venc, pPay, payFrom, payTo) => {
      nC++;
      let pago = 0;
      const x = r();
      if (x < pPay) pago = valor; else if (x < pPay + 0.05) pago = Math.round(valor / 2 / 500) * 500;
      if (a.bolsa.includes('50%') && tipo === 'Propina') valor = valor / 2, pago = Math.min(pago, valor);
      const est = pago >= valor ? 'Pago' : pago > 0 ? 'Parcial' : venc < T ? 'Vencido' : 'Pendente';
      const c = { id: `CB${pad(nC, 5)}`, alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, tipo, descricao, valor, pago, divida: valor - pago, vencimento: venc, estado: est, periodo: venc.slice(0, 7) };
      db.cobrancas.push(c);
      if (pago > 0) {
        nR++;
        const dt = r() < 0.06 && payTo >= T ? T : day(payFrom, payTo < T ? payTo : T);
        const m = pick(METH);
        db.pagamentos.push({ id: `PG${pad(nR, 5)}`, recibo: `RC 2026/${pad(nR, 5)}`, alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, cobrancaId: c.id, descricao, valor: pago, metodo: m, data: dt, hora: time(), operador: pick(OPS), estado: m === 'Transferência' && dt >= '2026-10-26' ? 'Por confirmar' : 'Confirmado' });
      }
    };
    db.alunos.filter((a) => a.estado === 'Ativa' || a.estado === 'Pendente').forEach((a) => {
      addCharge(a, 'Matrícula', `Matrícula ${Y}`, 15000, '2026-09-05', a.estado === 'Pendente' ? 0.3 : 0.97, '2026-07-15', '2026-09-05');
      addCharge(a, 'Propina', 'Propina — Setembro 2026', PROP(a), '2026-09-10', 0.9, '2026-09-01', '2026-09-30');
      addCharge(a, 'Propina', 'Propina — Outubro 2026', PROP(a), '2026-10-10', 0.74, '2026-10-01', T);
      addCharge(a, 'Propina', 'Propina — Novembro 2026', PROP(a), '2026-11-10', 0.18, '2026-10-20', T);
      if (['9ª Classe', '12ª Classe'].includes(a.classe)) addCharge(a, 'Taxa', 'Taxa de exame nacional', 8000, '2026-11-30', 0.25, '2026-10-01', T);
      if (r() < 0.12) addCharge(a, 'Extraordinária', 'Visita de estudo — Museu da Moeda', 5000, '2026-10-20', 0.6, '2026-10-05', '2026-10-20');
    });
    db.pagamentos.sort((a, b) => (a.data + a.hora < b.data + b.hora ? 1 : -1));
    db.pagamentos.forEach((p, i) => { p.recibo = `RC 2026/${pad(db.pagamentos.length - i, 5)}`; });

    db.acordos = db.cobrancas.filter((c) => c.estado === 'Vencido').slice(0, 5).map((c, i) => ({ id: `AC${i + 1}`, aluno: c.aluno, processo: c.processo, divida: c.divida * 2, prestacoes: pick([2, 3, 4]), inicio: '2026-11-05', estado: pick(['Ativo', 'Ativo', 'Por aprovar']), autorizado: 'Dr. Manuel Kiala' }));
    db.beneficios = db.alunos.filter((a) => a.bolsa !== '—').map((a, i) => ({ id: `BF${i + 1}`, aluno: a.nome, processo: a.processo, turma: a.turma, tipo: a.bolsa.replace(/ \d+%/, ''), percentagem: a.bolsa.match(/\d+%/)[0], validade: '2027-07-30', estado: 'Ativo' }));

    db.estornos = db.pagamentos.slice(10, 16).map((p, i) => ({ id: `ES${i + 1}`, recibo: p.recibo, aluno: p.aluno, valor: p.valor, motivo: pick(['Pagamento em duplicado', 'Erro no valor registado', 'Aluno transferido', 'Recibo emitido ao aluno errado']), solicitante: 'Carlos Mendes', data: day('2026-10-01', T), tipo: pick(['Anulação', 'Estorno']), estado: ['Pendente', 'Aprovado', 'Rejeitado', 'Pendente', 'Aprovado', 'Aprovado'][i] }));

    db.fornecedores = [
      ['Papelaria Kianda, Lda', 'Material de escritório'], ['Texteis Muxima', 'Fardamento'], ['Plural Editores', 'Livros'], ['EPAL', 'Água'],
      ['ENDE', 'Energia'], ['Unitel', 'Comunicações'], ['Limpa Mais, Lda', 'Limpeza'], ['TecnoLuanda', 'Informática']
    ].map(([nome, cat], i) => ({ id: `FN${i + 1}`, nome, nif: `54${int(10000000, 99999999)}`, categoria: cat, contacto: person(pick(['M', 'F'])), telefone: phone(), email: `geral@${nome.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}.ao`, compras: 0, estado: 'Ativo' }));

    db.despesas = [];
    for (let i = 0; i < 34; i++) {
      const f = pick(db.fornecedores);
      const cat = { 'Água': 'Água e energia', 'Energia': 'Água e energia', 'Comunicações': 'Comunicações', 'Limpeza': 'Limpeza', 'Livros': 'Material didático', 'Fardamento': 'Compras de stock', 'Material de escritório': 'Material de escritório', 'Informática': 'Equipamento' }[f.categoria];
      const v = int(20, 450) * 1000;
      f.compras += v;
      db.despesas.push({ id: `DP${pad(i + 1, 3)}`, data: day('2026-09-01', T), fornecedor: f.nome, categoria: cat, descricao: `${cat} — ${f.nome}`, valor: v, documento: `FT ${2026}/${int(100, 999)}`, estado: r() < 0.8 ? 'Pago' : 'Pendente', conta: '62' });
    }
    db.despesas.push({ id: 'DP900', data: '2026-09-30', fornecedor: 'Processamento salarial', categoria: 'Salários', descricao: 'Salários — Setembro 2026', valor: 8950000, documento: 'FS 2026/09', estado: 'Pago', conta: '72' });
    db.despesas.sort((a, b) => (a.data < b.data ? 1 : -1));

    db.planoContas = [
      ['11', 'Imobilizações corpóreas', 'Ativo', 'Devedora'], ['26', 'Existências — mercadorias', 'Ativo', 'Devedora'], ['31', 'Clientes — alunos', 'Ativo', 'Devedora'],
      ['32', 'Fornecedores', 'Passivo', 'Credora'], ['34', 'Estado — impostos', 'Passivo', 'Credora'], ['36', 'Pessoal', 'Passivo', 'Credora'],
      ['43', 'Depósitos à ordem', 'Ativo', 'Devedora'], ['45', 'Caixa', 'Ativo', 'Devedora'], ['51', 'Capital', 'Capital próprio', 'Credora'],
      ['61', 'Vendas', 'Proveito', 'Credora'], ['62', 'Prestações de serviços — propinas', 'Proveito', 'Credora'], ['63', 'Outros proveitos operacionais', 'Proveito', 'Credora'],
      ['71', 'Custo das mercadorias vendidas', 'Custo', 'Devedora'], ['72', 'Custos com o pessoal', 'Custo', 'Devedora'], ['75', 'Fornecimentos e serviços de terceiros', 'Custo', 'Devedora'], ['76', 'Amortizações', 'Custo', 'Devedora']
    ].map(([codigo, nome, tipo, natureza]) => ({ codigo, nome, tipo, natureza, estado: 'Ativa' }));

    db.lancamentos = [];
    const byDay = {};
    db.pagamentos.forEach((p) => { byDay[p.data] = (byDay[p.data] || 0) + p.valor; });
    Object.keys(byDay).sort().slice(-22).forEach((d, i) => db.lancamentos.push({ id: `LC${pad(i + 1)}`, data: d, diario: 'Receitas', debito: '45 Caixa', credito: '62 Propinas', descricao: `Receitas do dia ${d.split('-').reverse().join('/')}`, valor: byDay[d], documento: 'Resumo de recibos', estado: d < '2026-10-01' ? 'Fechado' : 'Lançado' }));
    db.despesas.slice(0, 18).forEach((d, i) => db.lancamentos.push({ id: `LC${pad(100 + i)}`, data: d.data, diario: 'Despesas', debito: d.categoria === 'Salários' ? '72 Custos com pessoal' : '75 FST', credito: '43 Depósitos à ordem', descricao: d.descricao, valor: d.valor, documento: d.documento, estado: d.data < '2026-10-01' ? 'Fechado' : 'Lançado' }));
    db.lancamentos.sort((a, b) => (a.data < b.data ? 1 : -1));

    db.bancos = [
      { banco: 'BAI', conta: '0040 0000 4571 2201 1018 3', moeda: 'AOA', saldo: 48250000, ultimo: '2026-10-28' },
      { banco: 'BFA', conta: '0006 0000 1182 5530 3011 9', moeda: 'AOA', saldo: 17830500, ultimo: '2026-10-28' },
      { banco: 'Caixa geral', conta: 'Caixa principal', moeda: 'AOA', saldo: 1240000, ultimo: T }
    ];
    db.extratos = db.pagamentos.filter((p) => p.metodo !== 'Numerário').slice(0, 26).map((p, i) => ({ id: `EX${i + 1}`, data: p.data, banco: i % 3 ? 'BAI' : 'BFA', descricao: `${p.metodo === 'Transferência' ? 'TRF' : 'MCX'} ${p.aluno.split(' ')[0].toUpperCase()} ${p.processo}`, valor: p.valor, recibo: p.recibo, reconciliado: p.estado === 'Confirmado' && i % 5 ? 'Sim' : 'Não' }));

    db.caixa = { aberto: true, abertura: `${T} 07:42`, fundo: 50000, operador: 'Carlos Mendes', historico: [
      { data: '2026-10-28', operador: 'Carlos Mendes', fundo: 50000, entradas: 412000, saidas: 15000, contado: 447000, diferenca: 0, estado: 'Fechado' },
      { data: '2026-10-27', operador: 'Lúcia Dala', fundo: 50000, entradas: 286500, saidas: 0, contado: 335500, diferenca: -1000, estado: 'Fechado com diferença' },
      { data: '2026-10-26', operador: 'Carlos Mendes', fundo: 50000, entradas: 518000, saidas: 22000, contado: 546000, diferenca: 0, estado: 'Fechado' }
    ], saidas: [{ hora: '10:15', descricao: 'Compra de resmas de papel', valor: 12000 }] };

    // Funcionários / RH
    const CARGOS = [['Ana Ferreira', 'Administradora de sistemas', 'Administração'], ['Helena Bastos', 'Secretária escolar', 'Secretaria'], ['Lúcia Dala', 'Assistente administrativa', 'Secretaria'],
      ['Carlos Mendes', 'Tesoureiro', 'Finanças'], ['Rui Fortunato', 'Contabilista', 'Finanças'], ['Paulo Sebastião', 'Responsável de stock', 'Logística'],
      ['Marta Lopes', 'Técnica de RH', 'Recursos humanos'], ['Isabel Gomes', 'Bibliotecária', 'Biblioteca'], ['Sofia Matos', 'Rececionista', 'Atendimento'],
      ['António Cristóvão', 'Responsável disciplinar', 'Direção pedagógica'], ['Dr. Manuel Kiala', 'Diretor-geral', 'Direção'], ['Dra. Teresa Neto', 'Diretora pedagógica', 'Direção'],
      ['Valter Capita', 'Segurança', 'Serviços gerais'], ['Rosa Manuel', 'Auxiliar de limpeza', 'Serviços gerais'], ['Osvaldo Correia', 'Motorista', 'Serviços gerais'], ['Neusa Tavares', 'Auxiliar de ação educativa', 'Serviços gerais']];
    db.funcionarios = CARGOS.map(([nome, cargo, dep], i) => ({ id: `F${pad(i + 1, 3)}`, nome, cargo, departamento: dep, contrato: i < 12 ? 'Efetivo' : pick(['Termo certo', 'Efetivo']), admissao: day('2010-02-01', '2025-06-30'), salario: [420, 380, 220, 360, 400, 260, 300, 240, 180, 320, 900, 750, 120, 95, 140, 110][i] * 1000, telefone: phone(), email: mail(nome), estado: i === 13 ? 'De férias' : 'Ativo', tipo: 'Não docente' }));
    db.professores.forEach((p, i) => db.funcionarios.push({ id: `F${pad(100 + i)}`, nome: p.nome, cargo: `Professor de ${p.disciplinas}`, departamento: 'Corpo docente', contrato: p.contrato, admissao: p.admissao, salario: (p.contrato === 'Efetivo' ? 340 : 0) * 1000 + p.carga * 6000, telefone: p.telefone, email: p.email, estado: p.estado, tipo: 'Docente' }));
    db.contratos = db.funcionarios.map((f, i) => {
      const tipo = f.contrato === 'Colaborador' ? 'Prestação de serviços' : f.contrato;
      const fim = tipo === 'Efetivo' ? '—' : pick(['2026-11-30', '2026-12-31', '2027-07-31', '2026-10-31']);
      return { id: `CT${pad(i + 1, 3)}`, colaborador: f.nome, cargo: f.cargo, tipo, inicio: f.admissao, fim, estado: fim === '—' ? 'Vigente' : fim <= '2026-11-30' ? 'A renovar' : 'Vigente' };
    });
    db.assidRH = [];
    for (let i = 0; i < 40; i++) { const f = pick(db.funcionarios); db.assidRH.push({ id: `AR${i}`, colaborador: f.nome, departamento: f.departamento, data: day('2026-10-01', T), entrada: pick(['07:25', '07:31', '07:58', '08:15', '07:20', '—']), saida: pick(['16:30', '17:05', '15:40', '—']), registo: pick(['Presença', 'Presença', 'Presença', 'Atraso', 'Falta']), justificacao: pick(['—', '—', 'Consulta médica', 'Pendente']) }); }
    db.assidRH.sort((a, b) => (a.data < b.data ? 1 : -1));
    db.ausencias = [];
    for (let i = 0; i < 12; i++) { const f = pick(db.funcionarios); const ini = day('2026-10-15', '2027-01-20'); db.ausencias.push({ id: `AU${i + 1}`, colaborador: f.nome, tipo: pick(['Férias', 'Férias', 'Licença médica', 'Formação', 'Assuntos pessoais']), inicio: ini, fim: ini, dias: int(1, 15), estado: pick(['Pendente', 'Aprovado', 'Aprovado', 'Rejeitado']), submetido: day('2026-10-01', T) }); }
    db.remuneracoes = db.funcionarios.filter((f) => f.salario > 0).map((f) => {
      const sub = Math.round(f.salario * 0.1);
      const inss = Math.round((f.salario + sub) * 0.03);
      const irt = Math.round(Math.max(0, f.salario - 100000) * 0.16);
      return { colaborador: f.nome, cargo: f.cargo, base: f.salario, subsidios: sub, inss, irt, liquido: f.salario + sub - inss - irt, mes: 'Outubro 2026', estado: 'Por processar' };
    });
    db.recrutamento = [
      ['Lourdes Pascoal', 'Professor(a) de Química', 'Entrevista agendada'], ['Kelson Muanza', 'Professor(a) de Química', 'Em análise'],
      ['Wilma Fernandes', 'Assistente administrativa', 'Selecionado'], ['Mateus Dala', 'Professor(a) de Informática', 'Não selecionado'],
      ['Yolanda Nzinga', 'Professor(a) de Inglês', 'Em análise'], ['Hélder Santos', 'Segurança', 'Entrevista agendada']
    ].map(([nome, vaga, estado], i) => ({ id: `RC${i + 1}`, nome, vaga, data: day('2026-10-01', T), telefone: phone(), estado }));

    // Stock
    const ART = [['BAT-S', 'Bata escolar', 'Fardamento', 'S', 3500, 5500], ['BAT-M', 'Bata escolar', 'Fardamento', 'M', 3500, 5500], ['BAT-L', 'Bata escolar', 'Fardamento', 'L', 3800, 6000], ['BAT-XL', 'Bata escolar', 'Fardamento', 'XL', 3800, 6000],
      ['POL-M', 'Pólo institucional', 'Fardamento', 'M', 4200, 7000], ['POL-L', 'Pólo institucional', 'Fardamento', 'L', 4200, 7000], ['CAL-38', 'Calção de Ed. Física', 'Fardamento', '38', 2500, 4000],
      ['LMAT7', 'Manual de Matemática 7ª', 'Livros', '—', 5200, 8500], ['LMAT8', 'Manual de Matemática 8ª', 'Livros', '—', 5200, 8500], ['LPOR7', 'Manual de Português 7ª', 'Livros', '—', 4800, 8000],
      ['LPOR10', 'Manual de Português 10ª', 'Livros', '—', 6100, 9500], ['LFIS10', 'Manual de Física 10ª', 'Livros', '—', 6500, 10000], ['LING9', 'Manual de Inglês 9ª', 'Livros', '—', 5000, 8200],
      ['CAD-96', 'Caderno A4 96 folhas', 'Papelaria', '—', 350, 700], ['CAD-200', 'Caderno A4 200 folhas', 'Papelaria', '—', 700, 1200], ['ESF-AZ', 'Esferográfica azul (cx 50)', 'Papelaria', '—', 2500, 4000],
      ['CALC', 'Calculadora científica', 'Material', '—', 6500, 11000], ['GEOM', 'Kit de geometria', 'Material', '—', 900, 1800], ['MOCH', 'Mochila institucional', 'Material', '—', 7000, 12500], ['CART', 'Cartão de estudante (PVC)', 'Consumíveis', '—', 300, 0]];
    db.artigos = ART.map(([codigo, nome, categoria, variante, custo, preco], i) => {
      const minimo = categoria === 'Livros' ? 15 : categoria === 'Fardamento' ? 20 : 30;
      const qtd = [4, 32, 0, 18, 25, 12, 40, 22, 9, 30, 14, 0, 26, 180, 95, 8, 11, 60, 7, 350][i];
      return { id: `AR${pad(i + 1, 3)}`, codigo, nome, categoria, variante, unidade: 'Un.', qtd, minimo, custo, preco, estado: qtd === 0 ? 'Esgotado' : qtd < minimo ? 'Crítico' : 'Normal' };
    });
    db.movStock = [];
    for (let i = 0; i < 60; i++) {
      const a = pick(db.artigos);
      const tipo = pick(['Entrada', 'Saída', 'Saída', 'Venda', 'Venda', 'Venda', 'Devolução', 'Ajuste', 'Consumo interno']);
      db.movStock.push({ id: `MV${pad(i + 1)}`, data: day('2026-09-01', T), tipo, artigo: `${a.nome}${a.variante !== '—' ? ' ' + a.variante : ''}`, codigo: a.codigo, qtd: tipo === 'Entrada' ? int(20, 80) : int(1, 6), documento: tipo === 'Entrada' ? `GR ${int(100, 999)}` : tipo === 'Venda' ? `VD ${int(1000, 1999)}` : `MI ${int(10, 99)}`, operador: 'Paulo Sebastião', origem: tipo === 'Entrada' ? pick(db.fornecedores.slice(0, 3)).nome : tipo === 'Venda' ? pick(db.alunos).nome : 'Interno' });
    }
    db.movStock.sort((a, b) => (a.data < b.data ? 1 : -1));
    db.vendas = db.movStock.filter((m) => m.tipo === 'Venda').map((m, i) => { const a = db.artigos.find((x) => x.codigo === m.codigo); return { id: `VD${pad(i + 1)}`, documento: m.documento, data: m.data, cliente: m.origem, artigo: m.artigo, qtd: m.qtd, total: m.qtd * a.preco, metodo: pick(['Numerário', 'Multicaixa Express', 'TPA']), estado: 'Concluída' }; });
    db.devolucoes = db.movStock.filter((m) => m.tipo === 'Devolução').map((m, i) => ({ id: `DV${i + 1}`, data: m.data, cliente: pick(db.alunos).nome, artigo: m.artigo, qtd: m.qtd, motivo: pick(['Tamanho errado', 'Defeito de fabrico', 'Duplicado']), tratamento: pick(['Troca', 'Reembolso', 'Pendente']), estado: pick(['Concluída', 'Pendente']) }));
    db.inventario = db.artigos.map((a) => { const contado = a.qtd + (r() < 0.25 ? int(-3, 2) : 0); return { codigo: a.codigo, artigo: `${a.nome}${a.variante !== '—' ? ' ' + a.variante : ''}`, sistema: a.qtd, contado: Math.max(0, contado), diferenca: Math.max(0, contado) - a.qtd, estado: Math.max(0, contado) - a.qtd === 0 ? 'Conferido' : 'Com diferença' }; });
    db.compras = db.movStock.filter((m) => m.tipo === 'Entrada').map((m, i) => ({ id: `CP${i + 1}`, data: m.data, fornecedor: m.origem, artigo: m.artigo, qtd: m.qtd, documento: m.documento, estado: pick(['Recebida', 'Recebida', 'Parcial']) }));
    db.precos = db.artigos.map((a) => ({ codigo: a.codigo, artigo: `${a.nome}${a.variante !== '—' ? ' ' + a.variante : ''}`, custo: a.custo, preco: a.preco, margem: a.preco ? Math.round(((a.preco - a.custo) / a.preco) * 100) + '%' : '—', atualizado: day('2026-08-01', '2026-10-10') }));

    // Biblioteca
    const LIV = [['Mayombe', 'Pepetela', 'Literatura angolana'], ['A Gloriosa Família', 'Pepetela', 'Literatura angolana'], ['Luuanda', 'Luandino Vieira', 'Literatura angolana'],
      ['O Vendedor de Passados', 'José Eduardo Agualusa', 'Literatura angolana'], ['Terra Sonâmbula', 'Mia Couto', 'Literatura lusófona'], ['Os Lusíadas', 'Luís de Camões', 'Clássicos'],
      ['Mensagem', 'Fernando Pessoa', 'Clássicos'], ['Memorial do Convento', 'José Saramago', 'Literatura lusófona'], ['Sagrada Esperança', 'Agostinho Neto', 'Poesia'],
      ['Quem me dera ser onda', 'Manuel Rui', 'Literatura angolana'], ['Bom dia camaradas', 'Ondjaki', 'Literatura angolana'], ['Os da minha rua', 'Ondjaki', 'Literatura angolana'],
      ['Matemática 10ª Classe', 'Equipa INIDE', 'Manuais escolares'], ['Física 11ª Classe', 'Equipa INIDE', 'Manuais escolares'], ['Química Geral', 'Peter Atkins', 'Ciências'],
      ['Breve História do Tempo', 'Stephen Hawking', 'Ciências'], ['Atlas Geográfico de Angola', 'Ed. Escolar', 'Referência'], ['Dicionário da Língua Portuguesa', 'Porto Editora', 'Referência'],
      ['O Principezinho', 'Antoine de Saint-Exupéry', 'Juvenil'], ['A Ilha do Tesouro', 'R. L. Stevenson', 'Juvenil'], ['Economia para Todos', 'M. Silva', 'Economia'],
      ['Introdução à Programação', 'A. Vasconcelos', 'Informática'], ['História de Angola', 'Alberto Oliveira Pinto', 'História'], ['Filosofia 11ª Classe', 'Equipa INIDE', 'Manuais escolares']];
    db.livros = LIV.map(([titulo, autor, categoria], i) => { const ex = int(1, 6); return { id: `LV${pad(i + 1)}`, codigo: `LIV-${pad(i + 1)}`, titulo, autor, categoria, editora: pick(['Mayamba', 'Texto Editores', 'Caminho', 'Porto Editora', 'INIDE', 'Chá de Caxinde']), ano: int(1972, 2024), isbn: `978-${int(100, 999)}-${int(10, 99)}-${int(1000, 9999)}-${int(0, 9)}`, exemplares: ex, disponiveis: ex, estante: `Estante ${pick('ABCD')}${int(1, 6)}` }; });
    db.exemplares = [];
    db.livros.forEach((l) => { for (let k = 1; k <= l.exemplares; k++) db.exemplares.push({ codigo: `${l.codigo}-${k}`, titulo: l.titulo, localizacao: l.estante, conservacao: pick(['Bom', 'Bom', 'Bom', 'Razoável', 'Danificado']), situacao: 'Disponível' }); });
    db.emprestimos = [];
    for (let i = 0; i < 28; i++) {
      const ex = pick(db.exemplares.filter((e) => e.situacao === 'Disponível'));
      ex.situacao = 'Emprestado';
      const a = pick(ativos);
      const data = day('2026-09-20', T);
      const prev = new Date(new Date(data + 'T12:00:00').getTime() + 14 * 864e5).toISOString().slice(0, 10);
      const dev = r() < 0.35;
      if (dev) ex.situacao = 'Disponível';
      db.emprestimos.push({ id: `EM${pad(i + 1)}`, exemplar: ex.codigo, titulo: ex.titulo, leitor: a.nome, tipoLeitor: 'Aluno', turma: a.turma, data, prevista: prev, devolucao: dev ? prev : '', estado: dev ? 'Devolvido' : prev < T ? 'Atrasado' : 'Ativo' });
    }
    db.livros.forEach((l) => { l.disponiveis = db.exemplares.filter((e) => e.titulo === l.titulo && e.situacao === 'Disponível').length; });
    db.reservas = db.livros.slice(0, 7).map((l, i) => ({ id: `RS${i + 1}`, titulo: l.titulo, leitor: pick(ativos).nome, data: day('2026-10-10', T), disponibilidade: l.disponiveis > 0 ? 'Disponível' : 'Aguarda devolução', estado: pick(['Ativa', 'Ativa', 'Satisfeita']) }));
    db.leitores = ativos.slice(0, 45).map((a) => ({ nome: a.nome, tipo: 'Aluno', turma: a.turma, cartao: `BIB-${a.processo}`, emprestimos: db.emprestimos.filter((e) => e.leitor === a.nome).length, estado: 'Ativo' }));
    db.multas = db.emprestimos.filter((e) => e.estado === 'Atrasado').map((e, i) => { const d = Math.max(1, Math.round((new Date(A.TODAY) - new Date(e.prevista)) / 864e5)); return { id: `ML${i + 1}`, leitor: e.leitor, titulo: e.titulo, diasAtraso: d, valor: d * 100, estado: pick(['Por pagar', 'Por pagar', 'Isenta']) }; });

    // Pré-inscrições, atendimento
    db.preinscricoes = [];
    for (let i = 0; i < 26; i++) {
      const s = pick(['M', 'F']); const cl = pick(['7ª Classe', '7ª Classe', '10ª Classe', '10ª Classe', '8ª Classe', '11ª Classe']);
      db.preinscricoes.push({ id: `PI-${pad(i + 1)}`, nome: person(s), sexo: s, nascimento: day('2009-01-01', '2014-12-31'), classe: cl, curso: cl === '10ª Classe' || cl === '11ª Classe' ? pick(['Ciências Físicas e Biológicas', 'Ciências Económicas e Jurídicas', 'Informática']) : 'Ensino Geral', turno: cl.startsWith('1') ? 'Tarde' : 'Manhã', encarregado: person(pick(['M', 'F'])), telefone: phone(), data: day('2026-09-15', T), origem: pick(['Presencial', 'Online', 'Telefone']), estado: pick(['Nova', 'Nova', 'Em análise', 'Documentos em falta', 'Aprovada', 'Encaminhada', 'Rejeitada']) });
    }
    db.preinscricoes.sort((a, b) => (a.data < b.data ? 1 : -1));
    db.atendimentos = [];
    for (let i = 0; i < 18; i++) db.atendimentos.push({ id: `AT${pad(i + 1)}`, data: day('2026-10-15', T), hora: time(), nome: person(pick(['M', 'F'])), assunto: pick(['Informação sobre propinas', 'Pedido de declaração', 'Vagas disponíveis', 'Horários', 'Transferência', 'Reclamação', 'Matrícula']), canal: pick(['Presencial', 'Telefone', 'Email', 'WhatsApp']), encaminhado: pick(['Secretaria', 'Tesouraria', '—', 'Direção', '—']), estado: pick(['Resolvido', 'Resolvido', 'Encaminhado', 'Pendente']) });
    db.atendimentos.sort((a, b) => (a.data + a.hora < b.data + b.hora ? 1 : -1));
    db.agendamentos = [];
    for (let i = 0; i < 12; i++) db.agendamentos.push({ id: `AG${i + 1}`, data: day(T, '2026-11-20'), hora: pick(['09:00', '10:30', '11:00', '14:00', '15:30']), nome: person(pick(['M', 'F'])), tipo: pick(['Visita às instalações', 'Reunião com a direção', 'Atendimento na secretaria', 'Entrevista']), com: pick(['Secretaria', 'Direção pedagógica', 'Diretor-geral', 'Receção']), estado: pick(['Confirmado', 'Por confirmar', 'Confirmado']) });
    db.agendamentos.sort((a, b) => (a.data > b.data ? 1 : -1));

    // Ocorrências e processos disciplinares (acesso restrito)
    db.ocorrencias = [];
    for (let i = 0; i < 22; i++) {
      const a = pick(ativos);
      db.ocorrencias.push({ id: `OC${pad(i + 1)}`, data: day('2026-09-15', T), alunoId: a.id, aluno: a.nome, turmaId: a.turmaId, turma: a.turma, tipo: pick(['Comportamento', 'Material em falta', 'Pontualidade', 'Pedagógica', 'Saúde']), descricao: pick(['Perturbação da aula', 'Sem material didático pela 3.ª vez', 'Atrasos frequentes no 1.º tempo', 'Baixo empenho nos trabalhos', 'Indisposição durante a aula']), registadoPor: pick(db.professores).nome, estado: pick(['Aberta', 'Em acompanhamento', 'Encaminhada', 'Fechada', 'Fechada']), comunicavel: pick(['Sim', 'Sim', 'Não']) });
    }
    // Garantir ocorrências nas turmas do DT demo e no educando
    [['T03', 'Atrasos frequentes no 1.º tempo', 'Pontualidade'], ['T04', 'Perturbação da aula de Matemática', 'Comportamento']].forEach(([tid, desc, tipo], i) => {
      const a = ativos.find((x) => x.turmaId === tid);
      db.ocorrencias.push({ id: `OC${pad(90 + i)}`, data: day('2026-10-15', T), alunoId: a.id, aluno: a.nome, turmaId: tid, turma: a.turma, tipo, descricao: desc, registadoPor: 'Domingos Cassule', estado: 'Aberta', comunicavel: 'Sim' });
    });
    db.ocorrencias.sort((a, b) => (a.data < b.data ? 1 : -1));
    db.disciplinares = [];
    for (let i = 0; i < 11; i++) {
      const a = pick(ativos);
      const est = pick(['Em instrução', 'Em instrução', 'Encaminhado à direção', 'Concluído', 'Arquivado']);
      db.disciplinares.push({ id: `PD-2026/${pad(i + 1, 3)}`, data: day('2026-09-10', T), alunoId: a.id, aluno: a.nome, processo: a.processo, turmaId: a.turmaId, turma: a.turma, tipo: pick(['Agressão física', 'Indisciplina grave', 'Fraude em avaliação', 'Danos materiais', 'Faltas injustificadas reiteradas', 'Desrespeito a docente']), descricao: 'Ocorrência registada e participada pelo docente responsável. Aguarda audição dos intervenientes.', intervenientes: `${a.nome}; ${pick(db.professores).nome}`, medida: est === 'Concluído' ? pick(['Repreensão registada', 'Suspensão de 3 dias', 'Atividades de integração']) : '—', responsavel: 'António Cristóvão', estado: est, gravidade: pick(['Leve', 'Grave', 'Muito grave']) });
    }
    db.disciplinares.sort((a, b) => (a.data < b.data ? 1 : -1));
    db.acompanhamentos = db.disciplinares.slice(0, 8).map((p, i) => ({ id: `AP${i + 1}`, processoId: p.id, aluno: p.aluno, data: day(p.data, T), medida: pick(['Conversa com o aluno', 'Contacto com encarregado', 'Encaminhamento psicológico', 'Plano de comportamento']), observacao: pick(['Aluno colaborante', 'Encarregado informado por telefone', 'Melhoria observada', 'Requer novo acompanhamento']), evolucao: pick(['Positiva', 'Estável', 'Negativa']) }));
    db.notifDisc = db.disciplinares.slice(0, 6).map((p, i) => ({ id: `ND${i + 1}`, processoId: p.id, aluno: p.aluno, encarregado: (db.alunos.find((a) => a.id === p.alunoId) || {}).encarregado, data: day(p.data, T), canal: pick(['SMS', 'Email', 'Carta', 'Portal']), assunto: 'Convocatória para reunião disciplinar', estado: pick(['Enviada', 'Lida', 'Pendente']) }));

    // Utilizadores, perfis, auditoria
    db.perfis = [
      ['admin', 'Administrador da instituição'], ['dg', 'Diretor-geral'], ['dp', 'Diretor pedagógico'], ['dt', 'Diretor de turma'], ['sec', 'Secretário escolar'], ['prof', 'Professor'],
      ['tes', 'Tesoureiro'], ['cont', 'Contabilista'], ['stock', 'Responsável de stock'], ['rh', 'Recursos humanos'], ['bib', 'Bibliotecário'], ['aud', 'Inspetor / auditor'],
      ['aluno', 'Aluno'], ['enc', 'Encarregado de educação'], ['rec', 'Rececionista'], ['disc', 'Responsável disciplinar']
    ].map(([id, nome]) => ({ id, nome, tipo: 'Sistema', utilizadores: 0, estado: 'Ativo' }));
    db.perfis.push({ id: 'coord', nome: 'Coordenador de curso', tipo: 'Personalizado', utilizadores: 0, estado: 'Ativo' });
    const MODS = ['Académico', 'Secretaria', 'Tesouraria', 'Contabilidade', 'Stock', 'RH', 'Biblioteca', 'Disciplina', 'Comunicação', 'Configurações'];
    db.MODS = MODS;
    const PM = {
      admin: { Configurações: 'vcear', Académico: 'vce', Comunicação: 'vce', Secretaria: 'v', RH: 'v' },
      dg: { Académico: 'va', Secretaria: 'va', Tesouraria: 'va', Contabilidade: 'v', Stock: 'v', RH: 'va', Biblioteca: 'v', Disciplina: 'va', Comunicação: 'vcea' },
      dp: { Académico: 'vcea', Secretaria: 'v', Disciplina: 'v', Comunicação: 'vc' }, dt: { Académico: 'v', Disciplina: 'v', Comunicação: 'vc' },
      sec: { Secretaria: 'vce', Académico: 'v', Comunicação: 'v' }, prof: { Académico: 'vc', Comunicação: 'v' }, tes: { Tesouraria: 'vce', Secretaria: 'v' },
      cont: { Contabilidade: 'vcea', Tesouraria: 'v' }, stock: { Stock: 'vce' }, rh: { RH: 'vce' }, bib: { Biblioteca: 'vce' },
      aud: Object.fromEntries(MODS.map((m) => [m, 'v'])), aluno: {}, enc: {}, rec: { Secretaria: 'vc', Comunicação: 'v' }, disc: { Disciplina: 'vcea', Comunicação: 'vc' },
      coord: { Académico: 'vce', Comunicação: 'vc' }
    };
    db.permissoes = {};
    db.perfis.forEach((p) => { db.permissoes[p.id] = {}; MODS.forEach((m) => { db.permissoes[p.id][m] = (PM[p.id] || {})[m] || ''; }); });

    db.utilizadores = [];
    const addU = (nome, perfil, extra = {}) => db.utilizadores.push({ id: `U${pad(db.utilizadores.length + 1, 3)}`, nome, email: mail(nome), perfil: db.perfis.find((p) => p.id === perfil).nome, perfilId: perfil, estado: 'Ativo', ultimoAcesso: `${day('2026-10-20', T)} ${time()}`, criado: day('2025-08-20', '2026-09-10'), mfa: ['admin', 'dg', 'tes', 'cont'].includes(perfil) ? 'Sim' : 'Não', ...extra });
    [['Ana Ferreira', 'admin'], ['Dr. Manuel Kiala', 'dg'], ['Dra. Teresa Neto', 'dp'], ['Helena Bastos', 'sec'], ['Lúcia Dala', 'sec'], ['Carlos Mendes', 'tes'], ['Rui Fortunato', 'cont'],
      ['Paulo Sebastião', 'stock'], ['Marta Lopes', 'rh'], ['Isabel Gomes', 'bib'], ['Jorge Cardoso', 'aud'], ['Sofia Matos', 'rec'], ['António Cristóvão', 'disc']].forEach(([n, p]) => addU(n, p));
    db.professores.forEach((p) => addU(p.nome, db.turmas.some((t) => t.dtId === p.id) ? 'dt' : 'prof'));
    addU('Rosa Quintas', 'coord');
    db.utilizadores.find((u) => u.nome === db.professores[15].nome).estado = 'Bloqueado';
    db.utilizadores.find((u) => u.nome === 'Lúcia Dala').ultimoAcesso = '2026-09-02 08:11';
    db.perfis.forEach((p) => { p.utilizadores = db.utilizadores.filter((u) => u.perfilId === p.id).length; });
    db.perfis.find((p) => p.id === 'aluno').utilizadores = db.alunos.filter((a) => a.estado === 'Ativa').length;
    db.perfis.find((p) => p.id === 'enc').utilizadores = db.encarregados.length;

    db.sessoes = db.utilizadores.slice(0, 9).map((u, i) => ({ id: `SS${i + 1}`, utilizador: u.nome, perfil: u.perfil, dispositivo: pick(['Chrome · Windows', 'Safari · iPhone', 'Edge · Windows', 'Chrome · Android', 'Firefox · Ubuntu']), ip: `41.63.${int(1, 254)}.${int(1, 254)}`, inicio: `${T} ${pad(int(7, 11), 2)}:${pad(int(0, 59), 2)}`, estado: 'Ativa' }));

    const AUD = [
      ['Académico', 'Correção de nota', 'Nota NPT alterada de 8 para 11 — 9ª A, Matemática', 1], ['Tesouraria', 'Emissão de recibo', 'Recibo emitido', 0], ['Configurações', 'Alteração de permissões', 'Perfil Professor: módulo Comunicação → criar', 1],
      ['Secretaria', 'Nova matrícula', 'Matrícula registada', 0], ['Tesouraria', 'Anulação de recibo', 'Pedido de anulação submetido', 1], ['Secretaria', 'Emissão de certificado', 'Certificado de habilitações emitido', 1],
      ['Tesouraria', 'Fecho de caixa', 'Caixa fechado com diferença de -1 000 Kz', 1], ['Configurações', 'Criação de utilizador', 'Conta criada', 1], ['Académico', 'Submissão de pauta', 'Pauta submetida para aprovação', 0],
      ['Stock', 'Ajuste de inventário', 'Ajuste de -2 unidades', 1], ['Secretaria', 'Transferência', 'Transferência de saída registada', 0], ['Sessão', 'Início de sessão', 'Login com sucesso', 0],
      ['Sessão', 'Tentativa falhada', '3 tentativas de login falhadas', 1], ['Académico', 'Aprovação de pauta', 'Pauta aprovada', 1], ['Configurações', 'Bloqueio de utilizador', 'Conta bloqueada', 1], ['Secretaria', 'Edição de processo', 'Dados de contacto atualizados', 0]
    ];
    db.auditoria = [];
    for (let i = 0; i < 90; i++) {
      const [mod, acao, det, crit] = pick(AUD);
      const u = mod === 'Tesouraria' ? 'Carlos Mendes' : mod === 'Secretaria' ? pick(['Helena Bastos', 'Lúcia Dala']) : mod === 'Configurações' ? 'Ana Ferreira' : mod === 'Stock' ? 'Paulo Sebastião' : mod === 'Académico' ? pick([db.professores[0].nome, 'Dra. Teresa Neto', db.professores[4].nome]) : pick(db.utilizadores).nome;
      db.auditoria.push({ id: `LG${pad(i + 1, 5)}`, data: `${day('2026-09-25', T)} ${time()}`, utilizador: u, modulo: mod, acao, detalhe: det, ip: `41.63.${int(1, 254)}.${int(1, 254)}`, critico: crit ? 'Sim' : 'Não' });
    }
    db.auditoria.sort((a, b) => (a.data < b.data ? 1 : -1));
    db.incidentes = [
      ['Tentativas de login falhadas repetidas', 'Segurança', 'Alta', 'Em análise'], ['Recibo anulado após fecho de caixa', 'Financeiro', 'Média', 'Aberto'],
      ['Nota alterada após aprovação da pauta', 'Académico', 'Alta', 'Aberto'], ['Acesso fora do horário laboral', 'Segurança', 'Baixa', 'Fechado'],
      ['Diferença de inventário em batas L', 'Stock', 'Média', 'Em análise'], ['Falha de sincronização de SMS', 'Técnico', 'Baixa', 'Fechado']
    ].map(([titulo, area, gravidade, estado], i) => ({ id: `IN${i + 1}`, data: day('2026-10-01', T), titulo, area, gravidade, estado, responsavel: 'Jorge Cardoso' }));
    db.inconformidades = [
      { id: 'NC1', area: 'Financeiro', descricao: 'Estornos sem documento de suporte anexado', evidencia: 'ES2, ES5', recomendacao: 'Anexar comprovativo em todos os estornos', estado: 'Aberta' },
      { id: 'NC2', area: 'Académico', descricao: 'Correções de notas sem justificação', evidencia: '4 registos de auditoria', recomendacao: 'Tornar o motivo obrigatório', estado: 'Em correção' },
      { id: 'NC3', area: 'Acessos', descricao: 'Conta inativa há mais de 45 dias', evidencia: 'Lúcia Dala', recomendacao: 'Rever contas inativas mensalmente', estado: 'Aberta' }
    ];

    // Documentos
    const DOCT = ['Declaração de frequência', 'Declaração de matrícula', 'Certificado de habilitações', 'Boletim trimestral', 'Cartão de estudante', 'Declaração de conclusão'];
    db.documentos = [];
    for (let i = 0; i < 46; i++) { const a = pick(db.alunos); const tipo = pick(DOCT); db.documentos.push({ id: `DOC-2026/${pad(i + 1)}`, tipo, alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, data: day('2026-09-10', T), emitidoPor: pick(['Helena Bastos', 'Lúcia Dala']), estado: tipo.startsWith('Certificado') ? pick(['Por aprovar', 'Emitido']) : pick(['Emitido', 'Emitido', 'Emitido', 'Anulado']), via: pick(['1.ª via', '1.ª via', '2.ª via']) }); }
    db.documentos.sort((a, b) => (a.data < b.data ? 1 : -1));
    db.modelos = [
      ['Boletim trimestral', 'Boletim', '2026-08-28', 'Ativo'], ['Certificado de habilitações', 'Certificado', '2026-08-28', 'Ativo'], ['Certificado de conclusão do I Ciclo', 'Certificado', '2026-08-28', 'Ativo'],
      ['Declaração de frequência', 'Declaração', '2026-09-02', 'Ativo'], ['Declaração de matrícula', 'Declaração', '2026-09-02', 'Ativo'], ['Declaração com notas', 'Declaração', '2026-06-10', 'Inativo'],
      ['Cartão de estudante', 'Cartão', '2026-08-15', 'Ativo'], ['Recibo de pagamento', 'Financeiro', '2026-08-01', 'Ativo'], ['Pauta trimestral', 'Pauta', '2026-08-28', 'Ativo']
    ].map(([nome, tipo, atualizado, estado], i) => ({ id: `MD${i + 1}`, nome, tipo, formato: tipo === 'Cartão' ? 'CR80' : 'A4', atualizado, estado }));
    db.assinaturas = [
      { id: 'AS1', nome: 'Dr. Manuel Kiala', cargo: 'Diretor-geral', documentos: 'Certificados, declarações', estado: 'Ativa', validade: '2027-08-31' },
      { id: 'AS2', nome: 'Dra. Teresa Neto', cargo: 'Diretora pedagógica', documentos: 'Boletins, pautas', estado: 'Ativa', validade: '2027-08-31' },
      { id: 'AS3', nome: 'Helena Bastos', cargo: 'Secretária escolar', documentos: 'Declarações', estado: 'Ativa', validade: '2027-08-31' },
      { id: 'AS4', nome: 'Carlos Mendes', cargo: 'Tesoureiro', documentos: 'Recibos', estado: 'Ativa', validade: '2027-08-31' }
    ];
    db.pedidosCert = [];
    for (let i = 0; i < 12; i++) { const a = pick(db.alunos.filter((x) => ['9ª Classe', '12ª Classe', '10ª Classe', '11ª Classe'].includes(x.classe))); db.pedidosCert.push({ id: `PC${pad(i + 1, 3)}`, alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, tipo: pick(['Certificado de habilitações', 'Certificado de conclusão']), classes: a.classe.startsWith('9') ? '7ª a 9ª Classe' : '10ª a 12ª Classe', data: day('2026-10-01', T), finalidade: pick(['Candidatura ao ensino superior', 'Transferência', 'Emprego', 'Bolsa de estudos']), estado: pick(['Pendente', 'Pendente', 'Em verificação', 'Por aprovar', 'Emitido']) }); }
    db.cartoes = db.alunos.filter((a) => a.estado === 'Ativa').map((a, i) => ({ alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, emissao: i % 12 === 0 ? '—' : day('2026-09-15', '2026-10-10'), validade: '2027-07-30', estado: i % 12 === 0 ? 'Por emitir' : i % 31 === 0 ? 'Reimpressão pedida' : 'Ativo' }));
    db.docsPendentes = [];
    db.alunos.filter((a) => a.estado === 'Pendente' || r() < 0.08).forEach((a, i) => db.docsPendentes.push({ id: `DPd${i + 1}`, alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, documento: pick(['Cópia do BI', 'Certificado da classe anterior', 'Atestado médico', '2 fotografias tipo passe', 'Cartão de vacinas']), prazo: day('2026-10-15', '2026-11-30'), estado: pick(['Em falta', 'Em falta', 'Entregue — por validar', 'Validado']), notificado: pick(['Sim', 'Não']) }));
    db.transferencias = db.alunos.filter((a) => a.estado === 'Transferida').map((a, i) => ({ id: `TR${i + 1}`, aluno: a.nome, processo: a.processo, tipo: 'Saída', escola: pick(['Colégio Elizângela Filomena', 'Escola Mutu-ya-Kevela', 'Liceu Salvador Correia', 'Colégio Pitruca']), classe: a.classe, data: day('2026-09-15', T), motivo: pick(['Mudança de residência', 'Motivos financeiros', 'Opção da família']), estado: pick(['Concluída', 'Concluída', 'Em análise']) }));
    for (let i = 0; i < 4; i++) { const s = pick(['M', 'F']); db.transferencias.push({ id: `TR${20 + i}`, aluno: person(s), processo: '—', tipo: 'Entrada', escola: pick(['Escola n.º 1104 do Kilamba', 'Colégio São José de Cluny', 'Complexo Escolar Kifangondo']), classe: pick(['8ª Classe', '10ª Classe', '11ª Classe']), data: day('2026-09-15', T), motivo: 'Mudança de residência', estado: pick(['Pendente', 'Em análise', 'Concluída']) }); }
    db.processosInd = db.alunos.slice(0, 120).map((a) => ({ alunoId: a.id, aluno: a.nome, processo: a.processo, turma: a.turma, documentos: `${int(3, 6)}/6`, historico: a.classe.startsWith('7') ? 'Novo ingresso' : `${int(1, Number(a.classe.slice(0, -8)) - 6)} anos letivos`, estado: db.docsPendentes.some((d) => d.alunoId === a.id && d.estado === 'Em falta') ? 'Incompleto' : 'Completo' }));

    // Aprovações
    db.aprovacoes = [];
    const addAp = (tipo, titulo, resp, motivo, dados, destino, ref) => db.aprovacoes.push({ id: `AP${pad(db.aprovacoes.length + 1, 3)}`, tipo, titulo, responsavel: resp, data: `${day('2026-10-18', T)} ${time()}`, motivo, dados, destino, ref, estado: 'Pendente', historico: [] });
    db.pautas.filter((p) => p.estado === 'Submetida').slice(0, 7).forEach((p) => addAp('Pauta', `Pauta ${p.periodo} — ${p.turma} · ${p.disciplina}`, p.professor, 'Submissão da pauta trimestral para aprovação.', { Turma: p.turma, Disciplina: p.disciplina, Período: p.periodo, Alunos: String(db.turmas.find((t) => t.id === p.turmaId).alunos) }, 'pedagogico', p.id));
    db.pedidosCert.filter((p) => p.estado === 'Por aprovar').forEach((p) => addAp('Certificado', `${p.tipo} — ${p.aluno}`, 'Helena Bastos', `Pedido para ${p.finalidade.toLowerCase()}.`, { Aluno: p.aluno, 'Nº processo': p.processo, Classes: p.classes, Requisitos: 'Verificados' }, 'direcao', p.id));
    db.alunos.filter((a) => a.bolsa === '—').slice(5, 8).forEach((a, i) => addAp('Desconto', `Desconto de ${[25, 10, 50][i]}% — ${a.nome}`, 'Carlos Mendes', ['Dificuldades financeiras comprovadas', 'Terceiro irmão matriculado', 'Bolsa de mérito — média 17,4'][i], { Aluno: a.nome, Turma: a.turma, Percentagem: `${[25, 10, 50][i]}%`, Validade: '2026/2027' }, 'direcao', a.id));
    db.estornos.filter((e) => e.estado === 'Pendente').forEach((e) => addAp('Anulação', `${e.tipo} do recibo ${e.recibo}`, e.solicitante, e.motivo, { Recibo: e.recibo, Aluno: e.aluno, Valor: A.money ? A.money(e.valor) : String(e.valor) }, 'direcao', e.id));
    db.alunos.filter((a) => a.estado === 'Ativa').slice(30, 31).forEach((a) => addAp('Anulação', `Anulação de matrícula — ${a.nome}`, 'Helena Bastos', 'Pedido do encarregado por mudança de país.', { Aluno: a.nome, Turma: a.turma, 'Data do pedido': A.TODAY }, 'direcao', a.id));
    addAp('Pedido', 'Visita de estudo à Fortaleza de São Miguel', 'Dra. Teresa Neto', 'Atividade extracurricular de História para as turmas da 8ª classe.', { Turmas: '8ª A, 8ª B', Data: '2026-11-18', Custo: '5 000 Kz por aluno' }, 'direcao');
    addAp('Pedido', 'Aquisição de 30 computadores para o Lab. Informática', 'Edson Lourenço', 'Substituição de equipamento obsoleto.', { Fornecedor: 'TecnoLuanda', Valor: '9 600 000 Kz', Orçamento: 'Investimento 2026' }, 'direcao');
    db.acordos.filter((a) => a.estado === 'Por aprovar').forEach((a) => addAp('Pedido', `Acordo de pagamento — ${a.aluno}`, 'Carlos Mendes', 'Plano de regularização de dívida em prestações.', { Aluno: a.aluno, Dívida: String(a.divida), Prestações: String(a.prestacoes) }, 'direcao', a.id));
    db.aprovacoes.push({ id: 'AP900', tipo: 'Pauta', titulo: 'Pauta 1º Trimestre — 8ª A · Geografia', responsavel: db.professores[6].nome, data: '2026-10-21 10:12', motivo: 'Submissão da pauta trimestral.', dados: { Turma: '8ª A', Disciplina: 'Geografia' }, destino: 'pedagogico', estado: 'Aprovado', historico: [{ data: '2026-10-22 09:30', por: 'Dra. Teresa Neto', acao: 'Aprovado', nota: '' }] });

    // Comunicação, calendário
    db.comunicados = [
      ['Circular n.º 14/2026 — Calendário das provas do 1º Trimestre', 'Circular', 'Todos', 'Dra. Teresa Neto', '2026-10-27', 'Publicado'],
      ['Reunião geral de encarregados de educação', 'Convocatória', 'Encarregados', 'Dr. Manuel Kiala', '2026-10-24', 'Publicado'],
      ['Pagamento de propinas de Novembro até dia 10', 'Aviso', 'Encarregados', 'Carlos Mendes', '2026-10-28', 'Publicado'],
      ['Feriado — Dia da Independência (11 de Novembro)', 'Comunicado', 'Todos', 'Dr. Manuel Kiala', '2026-10-29', 'Agendado'],
      ['Conselho pedagógico — 1º Trimestre', 'Convocatória', 'Professores', 'Dra. Teresa Neto', '2026-10-20', 'Publicado'],
      ['Uso obrigatório da bata nas aulas laboratoriais', 'Aviso', 'Alunos', 'Dra. Teresa Neto', '2026-10-14', 'Publicado'],
      ['Atualização dos dados no portal do encarregado', 'Comunicado', 'Encarregados', 'Ana Ferreira', '2026-10-08', 'Publicado'],
      ['Formação interna: lançamento de notas na plataforma', 'Aviso', 'Professores', 'Ana Ferreira', '2026-09-22', 'Publicado'],
      ['Plano anual de atividades 2026/2027', 'Circular', 'Funcionários', 'Dr. Manuel Kiala', '2026-09-05', 'Publicado'],
      ['Semana cultural — proposta de programa', 'Circular', 'Professores', 'Dra. Teresa Neto', '2026-10-29', 'Rascunho']
    ].map(([titulo, tipo, destinatarios, autor, data, estado], i) => ({ id: `CM${i + 1}`, titulo, tipo, destinatarios, autor, data, estado, texto: 'Informamos a comunidade escolar sobre o assunto em epígrafe. Para mais esclarecimentos, contacte a secretaria.' }));
    db.reunioes = [
      ['Reunião geral de encarregados', '2026-11-07', '10:00', 'Pavilhão', 'Encarregados de educação', '', 'Agendada'],
      ['Conselho de turma — 8ª A', '2026-11-04', '14:00', 'Sala de reuniões', 'Professores da turma', 'T03', 'Agendada'],
      ['Conselho de turma — 8ª B', '2026-11-04', '15:30', 'Sala de reuniões', 'Professores da turma', 'T04', 'Agendada'],
      ['Reunião de encarregados — 8ª A', '2026-11-12', '17:30', 'Sala 03', 'Encarregados da turma', 'T03', 'Agendada'],
      ['Conselho pedagógico', '2026-11-02', '09:00', 'Sala de reuniões', 'Coordenadores e direção', '', 'Agendada'],
      ['Conselho de direção', '2026-10-26', '09:00', 'Gabinete do diretor', 'Direção', '', 'Realizada'],
      ['Reunião de departamento — Ciências exatas', '2026-10-21', '14:00', 'Sala 05', 'Professores de exatas', '', 'Realizada']
    ].map(([assunto, data, hora, local, participantes, turmaId, estado], i) => ({ id: `RN${i + 1}`, assunto, data, hora, local, participantes, turmaId, estado, confirmacao: turmaId || assunto.includes('encarregados') ? pick(['Confirmada', 'Por confirmar']) : '—' }));
    db.eventos = [
      ['2026-11-02', 'Dia dos Finados — sem aulas', 'Feriado'], ['2026-11-11', 'Dia da Independência — sem aulas', 'Feriado'], ['2026-11-23', 'Início das provas trimestrais', 'Avaliação'],
      ['2026-12-04', 'Fim das provas e prazo de lançamento de notas', 'Prazo'], ['2026-12-11', 'Fim do 1º Trimestre', 'Período'], ['2026-12-15', 'Entrega de boletins', 'Atividade'],
      ['2026-11-07', 'Reunião geral de encarregados', 'Reunião'], ['2026-11-18', 'Visita de estudo — 8ª classe', 'Atividade'], ['2026-11-02', 'Conselho pedagógico', 'Reunião'],
      ['2026-11-04', 'Conselhos de turma (8ª classe)', 'Reunião'], ['2026-11-10', 'Prazo de pagamento de propinas', 'Prazo'], ['2026-10-30', 'Feira de ciências', 'Atividade'], ['2026-12-25', 'Natal', 'Feriado']
    ].map(([data, titulo, tipo]) => ({ data, titulo, tipo }));
    db.avaliacoes = [];
    db.distribuicao.forEach((d) => {
      if (r() < 0.35 || d.profId === 'PR01') {
        db.avaliacoes.push({ id: `AV${pad(db.avaliacoes.length + 1)}`, data: day('2026-10-05', '2026-11-30'), turmaId: d.turmaId, turma: d.turma, discId: d.discId, disciplina: d.disciplina, profId: d.profId, professor: d.professor, tipo: pick(['Teste', 'Trabalho', 'Prova do professor', 'Mini-teste']), estado: '' });
      }
    });
    db.distribuicao.filter((d) => r() < 0.2).forEach((d) => db.avaliacoes.push({ id: `AV${pad(db.avaliacoes.length + 1)}`, data: day('2026-11-23', '2026-12-04'), turmaId: d.turmaId, turma: d.turma, discId: d.discId, disciplina: d.disciplina, profId: d.profId, professor: d.professor, tipo: 'Prova trimestral', estado: '' }));
    db.avaliacoes.forEach((a) => { a.estado = a.data < T ? pick(['Realizada', 'Lançada']) : 'Agendada'; });
    db.avaliacoes.sort((a, b) => (a.data > b.data ? 1 : -1));
    db.tiposAvaliacao = [
      { nome: 'MAC — Média das avaliações contínuas', sigla: 'MAC', peso: '1/3', descricao: 'Testes, trabalhos, participação e TPC ao longo do trimestre', estado: 'Ativo' },
      { nome: 'NPP — Nota da prova do professor', sigla: 'NPP', peso: '1/3', descricao: 'Prova escrita elaborada pelo professor', estado: 'Ativo' },
      { nome: 'NPT — Nota da prova trimestral', sigla: 'NPT', peso: '1/3', descricao: 'Prova comum no final do trimestre', estado: 'Ativo' },
      { nome: 'Exame nacional', sigla: 'EX', peso: '40% da CF', descricao: 'Aplicável à 9ª e 12ª classes', estado: 'Ativo' },
      { nome: 'Recurso', sigla: 'REC', peso: 'Substitui a CF', descricao: 'Para alunos com até 2 disciplinas negativas', estado: 'Ativo' }
    ];
    db.criterios = [
      { criterio: 'Aprovação na disciplina', regra: 'Classificação final ≥ 10 valores' }, { criterio: 'Transição de classe', regra: 'Máximo de 2 negativas, nenhuma inferior a 7 valores' },
      { criterio: 'Exclusão por faltas', regra: 'Faltas injustificadas > 1/3 das aulas previstas' }, { criterio: 'Arredondamento', regra: 'Médias arredondadas às unidades (≥ 0,5 sobe)' },
      { criterio: 'Escala', regra: '0 a 20 valores' }
    ];
    db.materiais = [];
    db.distribuicao.filter((d) => d.profId === 'PR01' || r() < 0.08).forEach((d, i) => db.materiais.push({ id: `MT${i + 1}`, titulo: pick(['Ficha de exercícios — Equações', 'Resumo — Funções', 'Apresentação — Movimento retilíneo', 'Ficha formativa', 'Guia de estudo para a prova', 'Exercícios resolvidos']), disciplina: d.disciplina, turma: d.turma, turmaId: d.turmaId, profId: d.profId, autor: d.professor, tipo: pick(['PDF', 'Apresentação', 'Ficha de exercícios', 'Link']), data: day('2026-09-15', T), estado: 'Publicado' }));
    db.sumarios = [];
    db.horarios.filter((h) => h.profId === 'PR01').forEach((h) => {
      const base = new Date('2026-10-19T12:00:00'); base.setDate(base.getDate() + h.dia);
      [base, new Date(base.getTime() - 7 * 864e5)].forEach((d) => db.sumarios.push({ id: `SM${db.sumarios.length + 1}`, data: d.toISOString().slice(0, 10), hora: h.hora, turma: h.turma, turmaId: h.turmaId, disciplina: h.disciplina, licao: 0, sumario: pick(['Resolução de equações do 1.º grau', 'Correção do TPC e exercícios', 'Funções: domínio e contradomínio', 'Movimento retilíneo uniforme', 'Revisões para o teste', 'Teste de avaliação']), observacoes: pick(['—', '—', '2 alunos sem material', 'Turma participativa']), profId: 'PR01' }));
    });
    db.sumarios.sort((a, b) => (a.data + a.hora < b.data + b.hora ? 1 : -1));
    const lc = {}; [...db.sumarios].reverse().forEach((s) => { const k = s.turma + s.disciplina; lc[k] = (lc[k] || 20) + 1; s.licao = lc[k]; });

    db.notificacoes = [];
    db.integracoes = [
      { id: 'smtp', nome: 'Email (SMTP)', categoria: 'Email', detalhe: 'smtp.acura.ao · porta 587 · TLS', estado: 'Ligado', ultima: '2026-10-29 08:01' },
      { id: 'sms', nome: 'Gateway SMS', categoria: 'Notificações', detalhe: 'Remetente: ACURA · saldo 1 880 SMS', estado: 'Ligado', ultima: '2026-10-29 07:55' },
      { id: 'push', nome: 'Notificações push (portal)', categoria: 'Notificações', detalhe: 'Aplicação móvel do encarregado', estado: 'Ligado', ultima: '2026-10-28 18:30' },
      { id: 'mcx', nome: 'Multicaixa Express', categoria: 'Pagamentos', detalhe: 'Requer o módulo Pagamentos digitais', estado: 'Desligado', ultima: '—', modulo: 'pagdigitais' },
      { id: 'ref', nome: 'Pagamento por referência (EMIS)', categoria: 'Pagamentos', detalhe: 'Requer o módulo Pagamentos digitais', estado: 'Desligado', ultima: '—', modulo: 'pagdigitais' },
      { id: 'bank', nome: 'Extratos bancários (BAI, BFA)', categoria: 'Serviços externos', detalhe: 'Importação de ficheiros CSV/OFX', estado: 'Ligado', ultima: '2026-10-28 17:00' },
      { id: 'agt', nome: 'Faturação eletrónica AGT', categoria: 'Serviços externos', detalhe: 'Requer o módulo Fiscalidade avançada', estado: 'Indisponível', ultima: '—', modulo: 'fiscal' },
      { id: 'gws', nome: 'Google Workspace (SSO)', categoria: 'Serviços externos', detalhe: 'Login com contas @acura.ao', estado: 'Desligado', ultima: '—' }
    ];
    db.seguranca = { minimo: 10, expiracao: 90, tentativas: 5, sessao: 30, mfaAdmin: true, mfaFin: true, horario: false, ipRestrito: false, historico: 5 };
    db.preferencias = {};
    db.impostos = [
      { obrigacao: 'IRT — Imposto sobre os Rendimentos do Trabalho', periodicidade: 'Mensal', prazo: '2026-11-10', valor: 1162000, estado: 'Por submeter' },
      { obrigacao: 'Segurança social (INSS)', periodicidade: 'Mensal', prazo: '2026-11-10', valor: 614000, estado: 'Por submeter' },
      { obrigacao: 'IVA — declaração periódica', periodicidade: 'Mensal', prazo: '2026-11-30', valor: 0, estado: 'Isento' },
      { obrigacao: 'Imposto industrial — pagamento provisório', periodicidade: 'Semestral', prazo: '2027-02-28', valor: 0, estado: 'Planeado' }
    ];
    db.fechos = [
      { periodo: 'Setembro 2026', receitas: 0, despesas: 0, estado: 'Fechado', fechadoPor: 'Rui Fortunato', data: '2026-10-07' },
      { periodo: 'Outubro 2026', receitas: 0, despesas: 0, estado: 'Em conferência', fechadoPor: '—', data: '—' }
    ];
    ['2026-09', '2026-10'].forEach((m, i) => { db.fechos[i].receitas = db.pagamentos.filter((p) => p.data.startsWith(m)).reduce((s, p) => s + p.valor, 0); db.fechos[i].despesas = db.despesas.filter((p) => p.data.startsWith(m)).reduce((s, p) => s + p.valor, 0); });

    return db;
  };

  /* ---------- Esquema: rótulos, tipos e opções de cada conjunto de dados ---------- */
  const T = (db) => db.turmas.map((t) => t.nome);
  A.SCHEMA = {
    alunos: { t: 'Aluno', search: ['nome', 'processo', 'encarregado'], cols: ['processo', 'nome', 'classe', 'turma', 'turno', 'estado', 'dataMatricula'], f: {
      processo: { l: 'Nº processo', ro: 1 }, nome: { l: 'Nome completo', req: 1 }, sexo: { l: 'Sexo', o: ['F', 'M'] }, nascimento: { l: 'Data de nascimento', t: 'date' }, bi: { l: 'Nº BI' },
      classe: { l: 'Classe', o: (db) => db.classes.map((c) => c.nome) }, curso: { l: 'Curso', o: (db) => db.cursos.map((c) => c.nome) }, turma: { l: 'Turma', o: T }, turno: { l: 'Turno', o: ['Manhã', 'Tarde'] },
      ano: { l: 'Ano letivo', o: ['2026/2027', '2025/2026'] }, estado: { l: 'Estado da matrícula', t: 'badge', o: ['Ativa', 'Pendente', 'Transferida', 'Anulada'] }, dataMatricula: { l: 'Data de matrícula', t: 'date' },
      encarregado: { l: 'Encarregado' }, telefone: { l: 'Contacto' }, morada: { l: 'Morada' }, bolsa: { l: 'Benefício' } } },
    encarregados: { t: 'Encarregado', search: ['nome', 'telefone', 'email', 'educandos'], cols: ['nome', 'parentesco', 'telefone', 'email', 'educandos', 'estado'], f: {
      nome: { l: 'Nome', req: 1 }, parentesco: { l: 'Parentesco', o: ['Pai', 'Mãe', 'Tio', 'Tia', 'Avô', 'Avó', 'Outro'] }, telefone: { l: 'Telefone', req: 1 }, email: { l: 'Email' }, profissao: { l: 'Profissão' }, morada: { l: 'Morada' }, educandos: { l: 'Educandos', ro: 1 }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Inativo'] } } },
    professores: { t: 'Professor', search: ['nome', 'disciplinas', 'email'], cols: ['nome', 'disciplinas', 'categoria', 'contrato', 'carga', 'estado'], f: {
      nome: { l: 'Nome', req: 1 }, disciplinas: { l: 'Disciplinas' }, categoria: { l: 'Habilitação', o: ['Bacharel', 'Licenciado', 'Mestre', 'Doutor'] }, contrato: { l: 'Vínculo', o: ['Efetivo', 'Colaborador'] }, carga: { l: 'Carga horária (h/sem.)', t: 'num' }, admissao: { l: 'Admissão', t: 'date' }, telefone: { l: 'Telefone' }, email: { l: 'Email' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'De licença', 'Inativo'] } } },
    funcionarios: { t: 'Funcionário', search: ['nome', 'cargo', 'departamento'], cols: ['nome', 'cargo', 'departamento', 'tipo', 'contrato', 'admissao', 'estado'], f: {
      nome: { l: 'Nome', req: 1 }, cargo: { l: 'Cargo', req: 1 }, departamento: { l: 'Departamento', o: ['Administração', 'Secretaria', 'Finanças', 'Logística', 'Recursos humanos', 'Biblioteca', 'Atendimento', 'Direção', 'Direção pedagógica', 'Corpo docente', 'Serviços gerais'] }, tipo: { l: 'Tipo', o: ['Docente', 'Não docente'] }, contrato: { l: 'Contrato', o: ['Efetivo', 'Termo certo', 'Colaborador'] }, admissao: { l: 'Admissão', t: 'date' }, salario: { l: 'Salário base', t: 'money', priv: 1 }, telefone: { l: 'Telefone' }, email: { l: 'Email' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'De férias', 'De licença', 'Inativo'] } } },
    utilizadores: { t: 'Utilizador', search: ['nome', 'email', 'perfil'], cols: ['nome', 'email', 'perfil', 'mfa', 'ultimoAcesso', 'estado'], f: {
      nome: { l: 'Nome', req: 1 }, email: { l: 'Email', req: 1 }, perfil: { l: 'Perfil', o: (db) => db.perfis.map((p) => p.nome), req: 1 }, mfa: { l: '2FA', o: ['Sim', 'Não'] }, ultimoAcesso: { l: 'Último acesso', ro: 1 }, criado: { l: 'Criado em', t: 'date', ro: 1 }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Bloqueado'] } } },
    perfis: { t: 'Perfil', search: ['nome'], cols: ['nome', 'tipo', 'utilizadores', 'estado'], f: { nome: { l: 'Nome do perfil', req: 1 }, tipo: { l: 'Tipo', o: ['Personalizado'], ro: 1 }, utilizadores: { l: 'Utilizadores', t: 'num', ro: 1 }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Inativo'] } } },
    turmas: { t: 'Turma', search: ['nome', 'classe', 'curso', 'dt'], cols: ['nome', 'classe', 'curso', 'turno', 'sala', 'alunos', 'vagas', 'dt'], f: {
      nome: { l: 'Turma', req: 1 }, classe: { l: 'Classe', o: (db) => db.classes.map((c) => c.nome) }, curso: { l: 'Curso', o: (db) => db.cursos.map((c) => c.nome) }, turno: { l: 'Turno', o: ['Manhã', 'Tarde', 'Noite'] }, sala: { l: 'Sala', o: (db) => db.salas.map((s) => s.nome) }, capacidade: { l: 'Capacidade', t: 'num' }, alunos: { l: 'Alunos', t: 'num', ro: 1 }, vagas: { l: 'Vagas', t: 'num', ro: 1 }, dt: { l: 'Diretor de turma', o: (db) => db.professores.map((p) => p.nome) }, ano: { l: 'Ano letivo', ro: 1 } } },
    classes: { t: 'Classe', search: ['nome'], cols: ['nome', 'ciclo', 'turmas', 'alunos', 'exame', 'propina'], f: { nome: { l: 'Classe', req: 1 }, ciclo: { l: 'Ciclo', o: ['I Ciclo', 'II Ciclo'] }, turmas: { l: 'Turmas', t: 'num', ro: 1 }, alunos: { l: 'Alunos ativos', t: 'num', ro: 1 }, exame: { l: 'Classe de exame', o: ['Sim', 'Não'] }, propina: { l: 'Propina mensal', t: 'money' } } },
    cursos: { t: 'Curso', search: ['nome', 'codigo'], cols: ['codigo', 'nome', 'ciclo', 'duracao', 'coordenador', 'estado'], f: { codigo: { l: 'Código', req: 1 }, nome: { l: 'Nome', req: 1 }, ciclo: { l: 'Ciclo', o: ['I Ciclo', 'II Ciclo'] }, duracao: { l: 'Duração' }, coordenador: { l: 'Coordenador' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Inativo'] } } },
    disciplinas: { t: 'Disciplina', search: ['nome', 'codigo'], cols: ['codigo', 'nome', 'area', 'carga', 'estado'], f: { codigo: { l: 'Código', req: 1 }, nome: { l: 'Nome', req: 1 }, area: { l: 'Área', o: ['Ciências exatas', 'Ciências naturais', 'Humanidades'] }, carga: { l: 'Tempos semanais', t: 'num' }, estado: { l: 'Estado', t: 'badge', o: ['Ativa', 'Inativa'] } } },
    anos: { t: 'Ano letivo', search: ['ano'], cols: ['ano', 'inicio', 'fim', 'estado'], f: { ano: { l: 'Ano letivo', req: 1 }, inicio: { l: 'Início', t: 'date' }, fim: { l: 'Fim', t: 'date' }, estado: { l: 'Estado', t: 'badge', o: ['Planeado', 'Em curso', 'Encerrado'] } } },
    periodos: { t: 'Período letivo', search: ['nome'], cols: ['nome', 'ano', 'inicio', 'fim', 'lancamento', 'estado'], f: { nome: { l: 'Período', req: 1 }, ano: { l: 'Ano letivo' }, inicio: { l: 'Início', t: 'date' }, fim: { l: 'Fim', t: 'date' }, lancamento: { l: 'Prazo de lançamento', t: 'date' }, estado: { l: 'Estado', t: 'badge', o: ['Planeado', 'Em curso', 'Encerrado'] } } },
    turnos: { t: 'Turno', search: ['nome'], cols: ['nome', 'inicio', 'fim', 'estado'], f: { nome: { l: 'Turno', req: 1 }, inicio: { l: 'Início' }, fim: { l: 'Fim' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Inativo'] } } },
    salas: { t: 'Sala', search: ['nome', 'tipo', 'bloco'], cols: ['nome', 'tipo', 'bloco', 'capacidade', 'estado'], f: { nome: { l: 'Sala', req: 1 }, tipo: { l: 'Tipo', o: ['Sala de aula', 'Laboratório', 'Laboratório de ciências', 'Desportivo', 'Biblioteca', 'Reuniões'] }, bloco: { l: 'Bloco' }, capacidade: { l: 'Capacidade', t: 'num' }, estado: { l: 'Estado', t: 'badge', o: ['Disponível', 'Em manutenção', 'Indisponível'] } } },
    distribuicao: { t: 'Atribuição', search: ['turma', 'disciplina', 'professor'], cols: ['turma', 'disciplina', 'professor', 'carga', 'turno', 'estado'], f: { turma: { l: 'Turma', o: T, req: 1 }, disciplina: { l: 'Disciplina', o: (db) => db.disciplinas.map((d) => d.nome), req: 1 }, professor: { l: 'Professor', o: (db) => db.professores.map((p) => p.nome), req: 1 }, carga: { l: 'Tempos/semana', t: 'num' }, turno: { l: 'Turno', o: ['Manhã', 'Tarde'] }, estado: { l: 'Estado', t: 'badge', o: ['Atribuída', 'Por atribuir'] } } },
    pautas: { t: 'Pauta', search: ['turma', 'disciplina', 'professor'], cols: ['turma', 'disciplina', 'professor', 'periodo', 'atualizada', 'estado'], f: { turma: { l: 'Turma' }, disciplina: { l: 'Disciplina' }, professor: { l: 'Professor' }, periodo: { l: 'Período' }, atualizada: { l: 'Última alteração', t: 'date' }, estado: { l: 'Estado', t: 'badge', o: ['Rascunho', 'Submetida', 'Devolvida', 'Aprovada'] }, obs: { l: 'Observações' } } },
    faltas: { t: 'Registo de assiduidade', search: ['aluno', 'processo', 'disciplina'], cols: ['data', 'aluno', 'turma', 'disciplina', 'tipo', 'justificada'], f: { data: { l: 'Data', t: 'date' }, aluno: { l: 'Aluno' }, processo: { l: 'Nº processo' }, turma: { l: 'Turma', o: T }, disciplina: { l: 'Disciplina' }, tipo: { l: 'Tipo', t: 'badge', o: ['Falta', 'Atraso'] }, justificada: { l: 'Justificada', o: ['Sim', 'Não'] }, motivo: { l: 'Justificação' } } },
    cobrancas: { t: 'Cobrança', search: ['aluno', 'processo', 'descricao'], cols: ['processo', 'aluno', 'turma', 'descricao', 'valor', 'divida', 'vencimento', 'estado'], f: { processo: { l: 'Nº processo' }, aluno: { l: 'Aluno' }, turma: { l: 'Turma', o: T }, tipo: { l: 'Tipo', o: ['Propina', 'Matrícula', 'Taxa', 'Extraordinária'] }, descricao: { l: 'Descrição', req: 1 }, valor: { l: 'Valor', t: 'money', req: 1 }, pago: { l: 'Pago', t: 'money' }, divida: { l: 'Em dívida', t: 'money' }, vencimento: { l: 'Vencimento', t: 'date' }, periodo: { l: 'Período' }, estado: { l: 'Estado', t: 'badge', o: ['Pago', 'Parcial', 'Pendente', 'Vencido'] } } },
    pagamentos: { t: 'Pagamento', search: ['aluno', 'processo', 'recibo'], cols: ['recibo', 'data', 'aluno', 'processo', 'descricao', 'valor', 'metodo', 'estado'], f: { recibo: { l: 'Recibo', ro: 1 }, data: { l: 'Data', t: 'date' }, hora: { l: 'Hora' }, aluno: { l: 'Aluno' }, processo: { l: 'Nº processo' }, turma: { l: 'Turma' }, descricao: { l: 'Descrição' }, valor: { l: 'Valor', t: 'money' }, metodo: { l: 'Método', o: ['Numerário', 'Transferência', 'Multicaixa Express', 'TPA', 'Referência'] }, operador: { l: 'Operador' }, estado: { l: 'Estado', t: 'badge', o: ['Confirmado', 'Por confirmar', 'Anulado'] } } },
    acordos: { t: 'Acordo', search: ['aluno', 'processo'], cols: ['aluno', 'processo', 'divida', 'prestacoes', 'inicio', 'estado'], f: { aluno: { l: 'Aluno' }, processo: { l: 'Nº processo' }, divida: { l: 'Dívida total', t: 'money' }, prestacoes: { l: 'Prestações', t: 'num' }, inicio: { l: 'Início', t: 'date' }, autorizado: { l: 'Autorizado por' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Por aprovar', 'Cumprido'] } } },
    beneficios: { t: 'Benefício', search: ['aluno', 'processo', 'tipo'], cols: ['aluno', 'processo', 'turma', 'tipo', 'percentagem', 'validade', 'estado'], f: { aluno: { l: 'Aluno', req: 1 }, processo: { l: 'Nº processo' }, turma: { l: 'Turma' }, tipo: { l: 'Tipo', o: ['Bolsa de mérito', 'Desconto irmãos', 'Desconto funcionário', 'Apoio social'] }, percentagem: { l: 'Percentagem' }, validade: { l: 'Validade', t: 'date' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Por aprovar', 'Expirado'] } } },
    estornos: { t: 'Pedido de anulação/estorno', search: ['recibo', 'aluno', 'motivo'], cols: ['data', 'tipo', 'recibo', 'aluno', 'valor', 'motivo', 'estado'], f: { data: { l: 'Data', t: 'date' }, tipo: { l: 'Tipo', o: ['Anulação', 'Estorno'] }, recibo: { l: 'Recibo', req: 1 }, aluno: { l: 'Aluno' }, valor: { l: 'Valor', t: 'money' }, motivo: { l: 'Motivo', req: 1 }, solicitante: { l: 'Solicitante' }, estado: { l: 'Estado', t: 'badge', o: ['Pendente', 'Aprovado', 'Rejeitado'] } } },
    despesas: { t: 'Despesa', search: ['fornecedor', 'descricao', 'documento'], cols: ['data', 'documento', 'fornecedor', 'categoria', 'valor', 'estado'], f: { data: { l: 'Data', t: 'date' }, documento: { l: 'Documento' }, fornecedor: { l: 'Fornecedor', o: (db) => db.fornecedores.map((f) => f.nome).concat(['Processamento salarial']) }, categoria: { l: 'Categoria', o: ['Salários', 'Água e energia', 'Material didático', 'Material de escritório', 'Comunicações', 'Limpeza', 'Equipamento', 'Compras de stock', 'Manutenção'] }, descricao: { l: 'Descrição' }, valor: { l: 'Valor', t: 'money', req: 1 }, estado: { l: 'Estado', t: 'badge', o: ['Pago', 'Pendente'] } } },
    fornecedores: { t: 'Fornecedor', search: ['nome', 'nif', 'categoria'], cols: ['nome', 'nif', 'categoria', 'contacto', 'telefone', 'compras', 'estado'], f: { nome: { l: 'Nome', req: 1 }, nif: { l: 'NIF' }, categoria: { l: 'Categoria' }, contacto: { l: 'Pessoa de contacto' }, telefone: { l: 'Telefone' }, email: { l: 'Email' }, compras: { l: 'Compras (ano)', t: 'money', ro: 1 }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Inativo'] } } },
    planoContas: { t: 'Conta', search: ['codigo', 'nome'], cols: ['codigo', 'nome', 'tipo', 'natureza', 'estado'], f: { codigo: { l: 'Código', req: 1 }, nome: { l: 'Designação', req: 1 }, tipo: { l: 'Classe', o: ['Ativo', 'Passivo', 'Capital próprio', 'Proveito', 'Custo'] }, natureza: { l: 'Natureza', o: ['Devedora', 'Credora'] }, estado: { l: 'Estado', t: 'badge', o: ['Ativa', 'Inativa'] } } },
    lancamentos: { t: 'Lançamento', search: ['descricao', 'documento', 'debito', 'credito'], cols: ['data', 'diario', 'debito', 'credito', 'descricao', 'valor', 'estado'], f: { data: { l: 'Data', t: 'date' }, diario: { l: 'Diário', o: ['Receitas', 'Despesas', 'Bancos', 'Operações diversas'] }, debito: { l: 'Conta a débito', req: 1 }, credito: { l: 'Conta a crédito', req: 1 }, descricao: { l: 'Descrição' }, valor: { l: 'Valor', t: 'money', req: 1 }, documento: { l: 'Documento de suporte' }, estado: { l: 'Estado', t: 'badge', o: ['Lançado', 'Fechado'] } } },
    bancos: { t: 'Conta', search: ['banco'], cols: ['banco', 'conta', 'moeda', 'saldo', 'ultimo'], f: { banco: { l: 'Banco / caixa' }, conta: { l: 'Conta / IBAN' }, moeda: { l: 'Moeda' }, saldo: { l: 'Saldo', t: 'money' }, ultimo: { l: 'Último movimento', t: 'date' } } },
    extratos: { t: 'Movimento bancário', search: ['descricao', 'recibo'], cols: ['data', 'banco', 'descricao', 'valor', 'recibo', 'reconciliado'], f: { data: { l: 'Data', t: 'date' }, banco: { l: 'Banco' }, descricao: { l: 'Descrição' }, valor: { l: 'Valor', t: 'money' }, recibo: { l: 'Recibo associado' }, reconciliado: { l: 'Reconciliado', t: 'badge', o: ['Sim', 'Não'] } } },
    contratos: { t: 'Contrato', search: ['colaborador', 'cargo'], cols: ['colaborador', 'cargo', 'tipo', 'inicio', 'fim', 'estado'], f: { colaborador: { l: 'Colaborador', req: 1 }, cargo: { l: 'Cargo' }, tipo: { l: 'Tipo', o: ['Efetivo', 'Termo certo', 'Prestação de serviços'] }, inicio: { l: 'Início', t: 'date' }, fim: { l: 'Fim' }, estado: { l: 'Estado', t: 'badge', o: ['Vigente', 'A renovar', 'Expirado'] } } },
    assidRH: { t: 'Registo', search: ['colaborador', 'departamento'], cols: ['data', 'colaborador', 'departamento', 'entrada', 'saida', 'registo', 'justificacao'], f: { data: { l: 'Data', t: 'date' }, colaborador: { l: 'Colaborador' }, departamento: { l: 'Departamento' }, entrada: { l: 'Entrada' }, saida: { l: 'Saída' }, registo: { l: 'Registo', t: 'badge', o: ['Presença', 'Atraso', 'Falta'] }, justificacao: { l: 'Justificação' } } },
    ausencias: { t: 'Pedido de ausência', search: ['colaborador', 'tipo'], cols: ['colaborador', 'tipo', 'inicio', 'dias', 'submetido', 'estado'], f: { colaborador: { l: 'Colaborador', req: 1 }, tipo: { l: 'Tipo', o: ['Férias', 'Licença médica', 'Formação', 'Assuntos pessoais'] }, inicio: { l: 'Início', t: 'date' }, dias: { l: 'Dias', t: 'num' }, submetido: { l: 'Submetido em', t: 'date' }, estado: { l: 'Estado', t: 'badge', o: ['Pendente', 'Aprovado', 'Rejeitado'] } } },
    remuneracoes: { t: 'Remuneração', search: ['colaborador', 'cargo'], cols: ['colaborador', 'cargo', 'base', 'subsidios', 'inss', 'irt', 'liquido', 'estado'], f: { colaborador: { l: 'Colaborador' }, cargo: { l: 'Cargo' }, base: { l: 'Base', t: 'money' }, subsidios: { l: 'Subsídios', t: 'money' }, inss: { l: 'INSS (3%)', t: 'money' }, irt: { l: 'IRT', t: 'money' }, liquido: { l: 'Líquido', t: 'money' }, mes: { l: 'Mês' }, estado: { l: 'Estado', t: 'badge', o: ['Por processar', 'Processado', 'Pago'] } } },
    recrutamento: { t: 'Candidato', search: ['nome', 'vaga'], cols: ['nome', 'vaga', 'data', 'telefone', 'estado'], f: { nome: { l: 'Nome', req: 1 }, vaga: { l: 'Vaga' }, data: { l: 'Candidatura', t: 'date' }, telefone: { l: 'Telefone' }, estado: { l: 'Estado', t: 'badge', o: ['Em análise', 'Entrevista agendada', 'Selecionado', 'Não selecionado'] } } },
    artigos: { t: 'Artigo', search: ['nome', 'codigo', 'categoria'], cols: ['codigo', 'nome', 'categoria', 'variante', 'qtd', 'minimo', 'preco', 'estado'], f: { codigo: { l: 'Código', req: 1 }, nome: { l: 'Designação', req: 1 }, categoria: { l: 'Categoria', o: ['Fardamento', 'Livros', 'Papelaria', 'Material', 'Consumíveis'] }, variante: { l: 'Tamanho / variante' }, unidade: { l: 'Unidade' }, qtd: { l: 'Quantidade', t: 'num' }, minimo: { l: 'Stock mínimo', t: 'num' }, custo: { l: 'Custo', t: 'money' }, preco: { l: 'Preço de venda', t: 'money' }, estado: { l: 'Situação', t: 'badge', ro: 1 } } },
    movStock: { t: 'Movimento', search: ['artigo', 'codigo', 'documento', 'origem'], cols: ['data', 'tipo', 'codigo', 'artigo', 'qtd', 'documento', 'origem'], f: { data: { l: 'Data', t: 'date' }, tipo: { l: 'Tipo', t: 'badge', o: ['Entrada', 'Saída', 'Venda', 'Devolução', 'Ajuste', 'Consumo interno', 'Perda', 'Transferência'] }, codigo: { l: 'Código' }, artigo: { l: 'Artigo' }, qtd: { l: 'Qtd.', t: 'num' }, documento: { l: 'Documento' }, origem: { l: 'Origem / destino' }, operador: { l: 'Operador' } } },
    vendas: { t: 'Venda', search: ['cliente', 'artigo', 'documento'], cols: ['documento', 'data', 'cliente', 'artigo', 'qtd', 'total', 'metodo', 'estado'], f: { documento: { l: 'Documento' }, data: { l: 'Data', t: 'date' }, cliente: { l: 'Cliente' }, artigo: { l: 'Artigo' }, qtd: { l: 'Qtd.', t: 'num' }, total: { l: 'Total', t: 'money' }, metodo: { l: 'Pagamento' }, estado: { l: 'Estado', t: 'badge', o: ['Concluída', 'Anulada'] } } },
    devolucoes: { t: 'Devolução', search: ['cliente', 'artigo'], cols: ['data', 'cliente', 'artigo', 'qtd', 'motivo', 'tratamento', 'estado'], f: { data: { l: 'Data', t: 'date' }, cliente: { l: 'Cliente' }, artigo: { l: 'Artigo' }, qtd: { l: 'Qtd.', t: 'num' }, motivo: { l: 'Motivo' }, tratamento: { l: 'Tratamento', o: ['Troca', 'Reembolso', 'Pendente'] }, estado: { l: 'Estado', t: 'badge', o: ['Pendente', 'Concluída'] } } },
    inventario: { t: 'Contagem', search: ['codigo', 'artigo'], cols: ['codigo', 'artigo', 'sistema', 'contado', 'diferenca', 'estado'], f: { codigo: { l: 'Código' }, artigo: { l: 'Artigo' }, sistema: { l: 'Qtd. sistema', t: 'num' }, contado: { l: 'Qtd. contada', t: 'num' }, diferenca: { l: 'Diferença', t: 'num' }, estado: { l: 'Estado', t: 'badge' } } },
    compras: { t: 'Compra', search: ['fornecedor', 'artigo', 'documento'], cols: ['data', 'documento', 'fornecedor', 'artigo', 'qtd', 'estado'], f: { data: { l: 'Data', t: 'date' }, documento: { l: 'Guia / fatura' }, fornecedor: { l: 'Fornecedor' }, artigo: { l: 'Artigo' }, qtd: { l: 'Qtd.', t: 'num' }, estado: { l: 'Estado', t: 'badge', o: ['Encomendada', 'Recebida', 'Parcial', 'Devolvida'] } } },
    precos: { t: 'Preço', search: ['codigo', 'artigo'], cols: ['codigo', 'artigo', 'custo', 'preco', 'margem', 'atualizado'], f: { codigo: { l: 'Código', ro: 1 }, artigo: { l: 'Artigo', ro: 1 }, custo: { l: 'Custo', t: 'money' }, preco: { l: 'Preço de venda', t: 'money' }, margem: { l: 'Margem', ro: 1 }, atualizado: { l: 'Atualizado', t: 'date', ro: 1 } } },
    livros: { t: 'Livro', search: ['titulo', 'autor', 'codigo', 'isbn'], cols: ['codigo', 'titulo', 'autor', 'categoria', 'exemplares', 'disponiveis', 'estante'], f: { codigo: { l: 'Código' }, titulo: { l: 'Título', req: 1 }, autor: { l: 'Autor', req: 1 }, categoria: { l: 'Categoria' }, editora: { l: 'Editora' }, ano: { l: 'Ano', t: 'num' }, isbn: { l: 'ISBN' }, exemplares: { l: 'Exemplares', t: 'num' }, disponiveis: { l: 'Disponíveis', t: 'num', ro: 1 }, estante: { l: 'Localização' } } },
    exemplares: { t: 'Exemplar', search: ['codigo', 'titulo'], cols: ['codigo', 'titulo', 'localizacao', 'conservacao', 'situacao'], f: { codigo: { l: 'Código' }, titulo: { l: 'Título' }, localizacao: { l: 'Localização' }, conservacao: { l: 'Estado de conservação', o: ['Bom', 'Razoável', 'Danificado'] }, situacao: { l: 'Situação', t: 'badge', o: ['Disponível', 'Emprestado', 'Reservado', 'Abatido'] } } },
    emprestimos: { t: 'Empréstimo', search: ['leitor', 'titulo', 'exemplar'], cols: ['exemplar', 'titulo', 'leitor', 'turma', 'data', 'prevista', 'estado'], f: { exemplar: { l: 'Exemplar', req: 1 }, titulo: { l: 'Título' }, leitor: { l: 'Leitor', req: 1 }, turma: { l: 'Turma' }, data: { l: 'Data', t: 'date' }, prevista: { l: 'Devolução prevista', t: 'date' }, devolucao: { l: 'Devolvido em', t: 'date' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Atrasado', 'Devolvido'] } } },
    reservas: { t: 'Reserva', search: ['titulo', 'leitor'], cols: ['titulo', 'leitor', 'data', 'disponibilidade', 'estado'], f: { titulo: { l: 'Título', req: 1 }, leitor: { l: 'Leitor', req: 1 }, data: { l: 'Data', t: 'date' }, disponibilidade: { l: 'Disponibilidade' }, estado: { l: 'Estado', t: 'badge', o: ['Ativa', 'Satisfeita', 'Cancelada'] } } },
    leitores: { t: 'Leitor', search: ['nome', 'cartao'], cols: ['cartao', 'nome', 'tipo', 'turma', 'emprestimos', 'estado'], f: { cartao: { l: 'Cartão' }, nome: { l: 'Nome', req: 1 }, tipo: { l: 'Tipo', o: ['Aluno', 'Professor', 'Funcionário'] }, turma: { l: 'Turma' }, emprestimos: { l: 'Empréstimos', t: 'num' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Suspenso'] } } },
    multas: { t: 'Multa', search: ['leitor', 'titulo'], cols: ['leitor', 'titulo', 'diasAtraso', 'valor', 'estado'], f: { leitor: { l: 'Leitor' }, titulo: { l: 'Título' }, diasAtraso: { l: 'Dias de atraso', t: 'num' }, valor: { l: 'Valor', t: 'money' }, estado: { l: 'Estado', t: 'badge', o: ['Por pagar', 'Paga', 'Isenta'] } } },
    preinscricoes: { t: 'Pré-inscrição', search: ['nome', 'id', 'encarregado', 'telefone'], cols: ['id', 'data', 'nome', 'classe', 'curso', 'turno', 'origem', 'estado'], f: { id: { l: 'Nº', ro: 1 }, data: { l: 'Data', t: 'date' }, nome: { l: 'Nome do candidato', req: 1 }, sexo: { l: 'Sexo', o: ['F', 'M'] }, nascimento: { l: 'Data de nascimento', t: 'date' }, classe: { l: 'Classe pretendida', o: (db) => db.classes.map((c) => c.nome), req: 1 }, curso: { l: 'Curso pretendido', o: (db) => db.cursos.map((c) => c.nome) }, turno: { l: 'Turno', o: ['Manhã', 'Tarde'] }, encarregado: { l: 'Encarregado' }, telefone: { l: 'Telefone', req: 1 }, origem: { l: 'Origem', o: ['Presencial', 'Online', 'Telefone'] }, estado: { l: 'Estado', t: 'badge', o: ['Nova', 'Em análise', 'Documentos em falta', 'Aprovada', 'Encaminhada', 'Rejeitada'] } } },
    atendimentos: { t: 'Atendimento', search: ['nome', 'assunto'], cols: ['data', 'hora', 'nome', 'assunto', 'canal', 'encaminhado', 'estado'], f: { data: { l: 'Data', t: 'date' }, hora: { l: 'Hora' }, nome: { l: 'Nome', req: 1 }, assunto: { l: 'Assunto / dúvida', req: 1 }, canal: { l: 'Canal', o: ['Presencial', 'Telefone', 'Email', 'WhatsApp'] }, encaminhado: { l: 'Encaminhado para', o: ['—', 'Secretaria', 'Tesouraria', 'Direção', 'Direção pedagógica'] }, estado: { l: 'Estado', t: 'badge', o: ['Pendente', 'Encaminhado', 'Resolvido'] } } },
    agendamentos: { t: 'Agendamento', search: ['nome', 'tipo', 'com'], cols: ['data', 'hora', 'nome', 'tipo', 'com', 'estado'], f: { data: { l: 'Data', t: 'date', req: 1 }, hora: { l: 'Hora', req: 1 }, nome: { l: 'Nome', req: 1 }, tipo: { l: 'Tipo', o: ['Visita às instalações', 'Reunião com a direção', 'Atendimento na secretaria', 'Entrevista'] }, com: { l: 'Com', o: ['Secretaria', 'Direção pedagógica', 'Diretor-geral', 'Receção', 'Tesouraria'] }, estado: { l: 'Estado', t: 'badge', o: ['Por confirmar', 'Confirmado', 'Realizado', 'Cancelado'] } } },
    ocorrencias: { t: 'Ocorrência', search: ['aluno', 'descricao', 'tipo'], cols: ['data', 'aluno', 'turma', 'tipo', 'descricao', 'estado'], f: { data: { l: 'Data', t: 'date' }, aluno: { l: 'Aluno', req: 1 }, turma: { l: 'Turma', o: T }, tipo: { l: 'Tipo', o: ['Comportamento', 'Material em falta', 'Pontualidade', 'Pedagógica', 'Saúde'] }, descricao: { l: 'Descrição', req: 1, t: 'area' }, registadoPor: { l: 'Registado por' }, comunicavel: { l: 'Comunicável ao encarregado', o: ['Sim', 'Não'] }, estado: { l: 'Estado', t: 'badge', o: ['Aberta', 'Em acompanhamento', 'Encaminhada', 'Fechada'] } } },
    disciplinares: { t: 'Processo disciplinar', search: ['id', 'aluno', 'processo', 'tipo'], cols: ['id', 'data', 'aluno', 'turma', 'tipo', 'gravidade', 'estado'], f: { id: { l: 'Nº processo disciplinar', ro: 1 }, data: { l: 'Data', t: 'date' }, aluno: { l: 'Aluno', req: 1 }, processo: { l: 'Nº processo do aluno' }, turma: { l: 'Turma', o: T }, tipo: { l: 'Tipo', o: ['Agressão física', 'Indisciplina grave', 'Fraude em avaliação', 'Danos materiais', 'Faltas injustificadas reiteradas', 'Desrespeito a docente'] }, gravidade: { l: 'Gravidade', t: 'badge', o: ['Leve', 'Grave', 'Muito grave'] }, descricao: { l: 'Descrição', t: 'area' }, intervenientes: { l: 'Intervenientes' }, medida: { l: 'Medida aplicada' }, responsavel: { l: 'Responsável' }, estado: { l: 'Estado', t: 'badge', o: ['Em instrução', 'Encaminhado à direção', 'Concluído', 'Arquivado'] } } },
    acompanhamentos: { t: 'Acompanhamento', search: ['aluno', 'processoId'], cols: ['data', 'processoId', 'aluno', 'medida', 'observacao', 'evolucao'], f: { data: { l: 'Data', t: 'date' }, processoId: { l: 'Processo' }, aluno: { l: 'Aluno' }, medida: { l: 'Medida adotada', req: 1 }, observacao: { l: 'Observações', t: 'area' }, evolucao: { l: 'Evolução', t: 'badge', o: ['Positiva', 'Estável', 'Negativa'] } } },
    notifDisc: { t: 'Notificação', search: ['aluno', 'encarregado'], cols: ['data', 'processoId', 'aluno', 'encarregado', 'canal', 'assunto', 'estado'], f: { data: { l: 'Data', t: 'date' }, processoId: { l: 'Processo' }, aluno: { l: 'Aluno' }, encarregado: { l: 'Encarregado' }, canal: { l: 'Canal', o: ['SMS', 'Email', 'Carta', 'Portal'] }, assunto: { l: 'Assunto', req: 1 }, estado: { l: 'Estado', t: 'badge', o: ['Pendente', 'Enviada', 'Lida'] } } },
    auditoria: { t: 'Registo de auditoria', search: ['utilizador', 'acao', 'detalhe', 'modulo'], cols: ['data', 'utilizador', 'modulo', 'acao', 'detalhe', 'critico'], f: { id: { l: 'ID' }, data: { l: 'Data/hora' }, utilizador: { l: 'Utilizador' }, modulo: { l: 'Módulo' }, acao: { l: 'Ação' }, detalhe: { l: 'Detalhe' }, ip: { l: 'Endereço IP' }, critico: { l: 'Crítico', t: 'badge' } } },
    incidentes: { t: 'Incidente', search: ['titulo', 'area'], cols: ['data', 'titulo', 'area', 'gravidade', 'estado'], f: { data: { l: 'Data', t: 'date' }, titulo: { l: 'Descrição', req: 1 }, area: { l: 'Área' }, gravidade: { l: 'Gravidade', t: 'badge', o: ['Baixa', 'Média', 'Alta'] }, responsavel: { l: 'Responsável' }, estado: { l: 'Estado', t: 'badge', o: ['Aberto', 'Em análise', 'Fechado'] } } },
    inconformidades: { t: 'Inconformidade', search: ['descricao', 'area'], cols: ['area', 'descricao', 'evidencia', 'recomendacao', 'estado'], f: { area: { l: 'Área' }, descricao: { l: 'Inconformidade' }, evidencia: { l: 'Evidência' }, recomendacao: { l: 'Recomendação' }, estado: { l: 'Estado', t: 'badge' } } },
    documentos: { t: 'Documento', search: ['id', 'aluno', 'processo', 'tipo'], cols: ['id', 'data', 'tipo', 'aluno', 'turma', 'via', 'emitidoPor', 'estado'], f: { id: { l: 'Referência', ro: 1 }, data: { l: 'Data', t: 'date' }, tipo: { l: 'Tipo' }, aluno: { l: 'Aluno' }, processo: { l: 'Nº processo' }, turma: { l: 'Turma' }, via: { l: 'Via' }, emitidoPor: { l: 'Emitido por' }, estado: { l: 'Estado', t: 'badge', o: ['Emitido', 'Por aprovar', 'Anulado'] } } },
    modelos: { t: 'Modelo', search: ['nome', 'tipo'], cols: ['nome', 'tipo', 'formato', 'atualizado', 'estado'], f: { nome: { l: 'Modelo', req: 1 }, tipo: { l: 'Tipo', o: ['Boletim', 'Certificado', 'Declaração', 'Cartão', 'Financeiro', 'Pauta'] }, formato: { l: 'Formato', o: ['A4', 'A5', 'CR80'] }, atualizado: { l: 'Atualizado', t: 'date', ro: 1 }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Inativo'] } } },
    assinaturas: { t: 'Assinatura', search: ['nome', 'cargo'], cols: ['nome', 'cargo', 'documentos', 'validade', 'estado'], f: { nome: { l: 'Signatário', req: 1 }, cargo: { l: 'Cargo' }, documentos: { l: 'Documentos que assina' }, validade: { l: 'Validade', t: 'date' }, estado: { l: 'Estado', t: 'badge', o: ['Ativa', 'Revogada'] } } },
    pedidosCert: { t: 'Pedido de certificado', search: ['aluno', 'processo', 'id'], cols: ['id', 'data', 'aluno', 'processo', 'tipo', 'finalidade', 'estado'], f: { id: { l: 'Nº', ro: 1 }, data: { l: 'Data', t: 'date' }, aluno: { l: 'Aluno', req: 1 }, processo: { l: 'Nº processo' }, turma: { l: 'Turma' }, tipo: { l: 'Tipo', o: ['Certificado de habilitações', 'Certificado de conclusão'] }, classes: { l: 'Classes' }, finalidade: { l: 'Finalidade' }, estado: { l: 'Estado', t: 'badge', o: ['Pendente', 'Em verificação', 'Por aprovar', 'Emitido', 'Indeferido'] } } },
    cartoes: { t: 'Cartão', search: ['aluno', 'processo'], cols: ['processo', 'aluno', 'turma', 'emissao', 'validade', 'estado'], f: { processo: { l: 'Nº processo' }, aluno: { l: 'Aluno' }, turma: { l: 'Turma' }, emissao: { l: 'Emissão' }, validade: { l: 'Validade', t: 'date' }, estado: { l: 'Estado', t: 'badge' } } },
    docsPendentes: { t: 'Documento pendente', search: ['aluno', 'processo', 'documento'], cols: ['processo', 'aluno', 'turma', 'documento', 'prazo', 'notificado', 'estado'], f: { processo: { l: 'Nº processo' }, aluno: { l: 'Aluno' }, turma: { l: 'Turma' }, documento: { l: 'Documento' }, prazo: { l: 'Prazo', t: 'date' }, notificado: { l: 'Notificado', o: ['Sim', 'Não'] }, estado: { l: 'Estado', t: 'badge', o: ['Em falta', 'Entregue — por validar', 'Validado'] } } },
    transferencias: { t: 'Transferência', search: ['aluno', 'processo', 'escola'], cols: ['data', 'tipo', 'aluno', 'processo', 'classe', 'escola', 'estado'], f: { data: { l: 'Data', t: 'date' }, tipo: { l: 'Tipo', t: 'badge', o: ['Entrada', 'Saída'] }, aluno: { l: 'Aluno', req: 1 }, processo: { l: 'Nº processo' }, classe: { l: 'Classe' }, escola: { l: 'Escola de origem/destino', req: 1 }, motivo: { l: 'Motivo' }, estado: { l: 'Estado', t: 'badge', o: ['Pendente', 'Em análise', 'Concluída'] } } },
    processosInd: { t: 'Processo individual', search: ['aluno', 'processo'], cols: ['processo', 'aluno', 'turma', 'documentos', 'historico', 'estado'], f: { processo: { l: 'Nº processo' }, aluno: { l: 'Aluno' }, turma: { l: 'Turma' }, documentos: { l: 'Documentos' }, historico: { l: 'Histórico académico' }, estado: { l: 'Situação', t: 'badge' } } },
    comunicados: { t: 'Comunicado', search: ['titulo', 'autor'], cols: ['data', 'titulo', 'tipo', 'destinatarios', 'autor', 'estado'], f: { data: { l: 'Data', t: 'date' }, titulo: { l: 'Título', req: 1 }, tipo: { l: 'Tipo', o: ['Circular', 'Aviso', 'Comunicado', 'Convocatória'] }, destinatarios: { l: 'Destinatários', o: ['Todos', 'Professores', 'Encarregados', 'Alunos', 'Funcionários'] }, autor: { l: 'Autor', ro: 1 }, texto: { l: 'Texto', t: 'area' }, estado: { l: 'Estado', t: 'badge', o: ['Rascunho', 'Agendado', 'Publicado'] } } },
    reunioes: { t: 'Reunião', search: ['assunto', 'local'], cols: ['data', 'hora', 'assunto', 'local', 'participantes', 'estado'], f: { data: { l: 'Data', t: 'date', req: 1 }, hora: { l: 'Hora' }, assunto: { l: 'Assunto', req: 1 }, local: { l: 'Local' }, participantes: { l: 'Participantes' }, confirmacao: { l: 'Confirmação' }, estado: { l: 'Estado', t: 'badge', o: ['Agendada', 'Realizada', 'Cancelada'] } } },
    avaliacoes: { t: 'Avaliação', search: ['turma', 'disciplina', 'professor'], cols: ['data', 'turma', 'disciplina', 'tipo', 'professor', 'estado'], f: { data: { l: 'Data', t: 'date', req: 1 }, turma: { l: 'Turma', o: T }, disciplina: { l: 'Disciplina', o: (db) => db.disciplinas.map((d) => d.nome) }, tipo: { l: 'Tipo', o: ['Mini-teste', 'Teste', 'Trabalho', 'Prova do professor', 'Prova trimestral', 'Exame'] }, professor: { l: 'Professor' }, estado: { l: 'Estado', t: 'badge', o: ['Agendada', 'Realizada', 'Lançada'] } } },
    tiposAvaliacao: { t: 'Tipo de avaliação', search: ['nome'], cols: ['sigla', 'nome', 'peso', 'descricao', 'estado'], f: { sigla: { l: 'Sigla', req: 1 }, nome: { l: 'Designação', req: 1 }, peso: { l: 'Ponderação' }, descricao: { l: 'Descrição' }, estado: { l: 'Estado', t: 'badge', o: ['Ativo', 'Inativo'] } } },
    criterios: { t: 'Critério', search: ['criterio'], cols: ['criterio', 'regra'], f: { criterio: { l: 'Critério', req: 1 }, regra: { l: 'Regra', req: 1 } } },
    materiais: { t: 'Material', search: ['titulo', 'disciplina', 'turma'], cols: ['data', 'titulo', 'disciplina', 'turma', 'tipo', 'autor', 'estado'], f: { data: { l: 'Data', t: 'date' }, titulo: { l: 'Título', req: 1 }, disciplina: { l: 'Disciplina' }, turma: { l: 'Turma' }, tipo: { l: 'Tipo', o: ['PDF', 'Apresentação', 'Ficha de exercícios', 'Link'] }, autor: { l: 'Autor', ro: 1 }, estado: { l: 'Estado', t: 'badge', o: ['Publicado', 'Rascunho'] } } },
    sumarios: { t: 'Sumário', search: ['sumario', 'turma'], cols: ['data', 'hora', 'turma', 'disciplina', 'licao', 'sumario', 'observacoes'], f: { data: { l: 'Data', t: 'date', req: 1 }, hora: { l: 'Hora' }, turma: { l: 'Turma' }, disciplina: { l: 'Disciplina' }, licao: { l: 'Lição n.º', t: 'num' }, sumario: { l: 'Conteúdos lecionados', req: 1, t: 'area' }, observacoes: { l: 'Observações', t: 'area' } } },
    sessoes: { t: 'Sessão', search: ['utilizador', 'ip'], cols: ['utilizador', 'perfil', 'dispositivo', 'ip', 'inicio', 'estado'], f: { utilizador: { l: 'Utilizador' }, perfil: { l: 'Perfil' }, dispositivo: { l: 'Dispositivo' }, ip: { l: 'IP' }, inicio: { l: 'Início' }, estado: { l: 'Estado', t: 'badge' } } },
    integracoes: { t: 'Integração', search: ['nome', 'categoria'], cols: ['nome', 'categoria', 'detalhe', 'ultima', 'estado'], f: { nome: { l: 'Serviço' }, categoria: { l: 'Categoria' }, detalhe: { l: 'Configuração' }, ultima: { l: 'Última sincronização' }, estado: { l: 'Estado', t: 'badge' } } },
    impostos: { t: 'Obrigação', search: ['obrigacao'], cols: ['obrigacao', 'periodicidade', 'prazo', 'valor', 'estado'], f: { obrigacao: { l: 'Obrigação' }, periodicidade: { l: 'Periodicidade' }, prazo: { l: 'Prazo', t: 'date' }, valor: { l: 'Valor', t: 'money' }, estado: { l: 'Estado', t: 'badge' } } },
    fechos: { t: 'Fecho', search: ['periodo'], cols: ['periodo', 'receitas', 'despesas', 'fechadoPor', 'data', 'estado'], f: { periodo: { l: 'Período' }, receitas: { l: 'Receitas', t: 'money' }, despesas: { l: 'Despesas', t: 'money' }, fechadoPor: { l: 'Fechado por' }, data: { l: 'Data' }, estado: { l: 'Estado', t: 'badge' } } },
    faltasProf: { t: 'Registo', search: ['nome'], cols: ['data', 'nome', 'tipo', 'justificada'], f: { data: { l: 'Data', t: 'date' }, nome: { l: 'Professor' }, tipo: { l: 'Registo', t: 'badge' }, justificada: { l: 'Justificada' } } }
  };
})();
