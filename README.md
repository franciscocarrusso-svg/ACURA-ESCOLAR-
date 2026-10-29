# Acura Escolar

Sistema web de gestão escolar com um painel próprio para cada função, design minimalista e profissional, tema claro/escuro e interface adaptada a telemóveis.

## Como executar

Não há dependências nem passo de compilação. Basta abrir `index.html` no navegador, ou servir a pasta:

```bash
python3 -m http.server 8080
```

e abrir `http://localhost:8080`. No ecrã de entrada, escolha um perfil de demonstração. Também pode iniciar sessão com o email de um utilizador (por exemplo `helena.bastos@acura.ao`) ou com o n.º de processo de um aluno.

Os dados são fictícios e ficam guardados no `localStorage` do navegador. Para os repor, use **Repor dados de demonstração** no menu do utilizador.

## Painéis por perfil

| Perfil | Âmbito |
| --- | --- |
| Administrador da instituição | Utilizadores, perfis e permissões, estrutura académica, organização escolar, dados da instituição, modelos de documentos, módulos e licenças, integrações, auditoria e segurança. Não pode ultrapassar os limites da licença nem as restrições da plataforma. |
| Diretor-geral | Dashboard executivo, gestão escolar, aprovações (aprovar, rejeitar ou devolver para correção), área pedagógica, financeiro, documentos oficiais, RH, ocorrências, relatórios, comunicação e auditoria. |
| Diretor pedagógico | Dashboard pedagógico, organização pedagógica, professores, distribuição de aulas, avaliações, notas e pautas (aprovação), assiduidade, horários, desempenho, relatórios e documentos académicos. |
| Diretor de turma | Painel centrado nas turmas atribuídas: alunos, notas, assiduidade e justificações, ocorrências e encaminhamento, encarregados, desempenho, relatórios e calendário. |
| Secretário escolar | Pré-inscrições, pesquisa de alunos com filtros (nome, n.º de processo, classe, turma, ano letivo, estado e intervalo de datas), matrículas, encarregados, turmas e vagas, processos individuais, boletins (individuais ou em lote), certificados, declarações, cartões, documentos pendentes, transferências e relatórios. |
| Professor | Aulas do dia, turmas e disciplinas, sumários, grelha de lançamento de notas editável com gravação de rascunho e indicação de alterações não submetidas, pautas, presenças, horários, avaliações, desempenho, materiais e comunicação. |
| Tesoureiro | Cobranças, registo e confirmação de pagamentos, contas correntes (pesquisa por nome, n.º de processo, referência do recibo ou período), recibos, dívidas e acordos, descontos e bolsas, caixa, bancos e reconciliação, anulações e estornos, relatórios. |
| Contabilista | Plano de contas, lançamentos, receitas, despesas, caixa e bancos, documentos, diário, razão e balancete (com o módulo de contabilidade ativo), impostos, fecho, exportações e auditoria financeira. |
| Responsável de stock | Artigos e variantes, entradas, saídas, vendas, devoluções, inventário e ajustes autorizados, stock mínimo, fornecedores, preços, movimentos e relatórios. |
| Recursos humanos | Funcionários, professores, contratos e renovações, assiduidade, férias e ausências, remunerações, documentos laborais, recrutamento (módulo opcional) e relatórios. |
| Bibliotecário | Catálogo, exemplares, empréstimos, devoluções (com multas por atraso), reservas, leitores, inventário e relatórios. |
| Inspetor / auditor | Painel de leitura: acessos, auditoria académica, financeira, documental, de stock e administrativa, incidentes, inconformidades e exportações. Não altera os registos que verifica. |
| Aluno | Portal simples e otimizado para telemóvel, só com a própria informação: notas, boletins, horários, presenças, avaliações, materiais, financeiro, documentos e avisos. |
| Encarregado de educação | Resumo dos educandos, com um seletor para alternar entre eles, desempenho, assiduidade (com justificação de faltas), horários, financeiro, documentos, ocorrências comunicáveis, reuniões, comunicação e notificações. |
| Rececionista / atendente | Pré-inscrições, candidatos, oferta formativa, atendimento, documentos pendentes, agendamentos e encaminhamentos para a secretaria. |
| Responsável disciplinar | Nova ocorrência, processos disciplinares, acompanhamento, notificações, encaminhamentos à direção, histórico e relatórios. Os processos disciplinares têm acesso restrito e não aparecem na pesquisa geral de alunos para utilizadores sem autorização. |

## Regras transversais

- **Licença:** limites de alunos e utilizadores bloqueiam novas contas e matrículas; módulos não contratados ou inativos ficam bloqueados nos painéis que deles dependem.
- **Aprovações:** cada pedido mostra o responsável, a data, o motivo e os dados relevantes. A rejeição e a devolução exigem justificação, e as decisões atualizam o registo de origem (pauta, certificado, estorno, desconto, acordo).
- **Auditoria:** as operações relevantes ficam registadas com utilizador, módulo, ação e marcação de operação crítica.
- **Proteção de alterações:** sair de uma grelha de notas ou de presenças com alterações por gravar pede confirmação.
- **Documentos:** boletins, declarações, certificados, recibos, cartões e pautas têm pré-visualização e impressão (ou PDF através do navegador). As tabelas exportam para CSV.

## Estrutura

```
index.html
assets/css/app.css     estilos, temas e regras responsivas
assets/js/data.js      dados de demonstração e esquema dos conjuntos de dados
assets/js/ui.js        componentes: tabela, formulários, modal, gráficos, ícones
assets/js/views.js     vistas reutilizáveis (tabela, aprovações, notas, horários, caixa…)
assets/js/roles.js     perfis, abas principais e subabas de cada painel
assets/js/app.js       sessão, navegação, pesquisa global e estrutura da aplicação
```

Esta versão é uma aplicação de front-end com persistência local. Para produção, as operações de `ctx.save()` e `ctx.log()` devem passar a chamar uma API com autenticação e as mesmas regras de permissão aplicadas no servidor.
