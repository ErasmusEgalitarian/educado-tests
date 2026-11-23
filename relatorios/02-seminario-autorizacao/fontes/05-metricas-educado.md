# Métricas e proposta de aplicação

## 1. Objetivo e fronteira

Avaliar se a API REST do Educado restringe funções, objetos e campos conforme a identidade, o papel e a relação do solicitante com cada recurso.
O recorte cobre autorização horizontal, vertical e por campo, com controles de autenticação nos endpoints protegidos.
A interface Web é fonte complementar; a decisão de acesso deve ser verificada diretamente na API, na camada confiável [@rel02-asvs-5].

A definição da issue #25 usa a API no commit [399131a](https://github.com/ErasmusEgalitarian/educado-api/tree/399131a808ed76b3910f9fc1ab3db34ddc0f0d56) e o Web em [1131060](https://github.com/ErasmusEgalitarian/educado-web/tree/1131060f370f2c57eaeed2cd541f8af6fae8376c).
A documentação do produto foi consultada em [1bfc8d2](https://github.com/ErasmusEgalitarian/educado-docs/tree/1bfc8d23177a171669cf3e491a4996cee21e3310).
Essas versões identificam a leitura estática; a preparação deve registrar o commit e as dependências realmente executados.
Havia alterações locais somente nas dependências da API, que não foram incorporadas à definição.

O enunciado `26-2-Seminario.pdf` admite planejamento no seminário e prevê resultados no relatório final; a data/horário e a rubrica final específica devem ser confirmados no Aprender.
O registro `planejamento/escopo-e-decisoes.md`, na pasta deste relatório, identifica a cópia consultada por hash, páginas, fontes permanentes, fixtures e decisões.
O arquivo `planejamento/casos-autorizacao.csv` detalha as requisições.
Esta seção define o planejamento e os critérios; `05-resultados-metricas.md` consolida os resultados observados de #27.

### Atores e dados

| Ator | Identificação | Finalidade |
|---|---|---|
| Anônimo | Sem token | Distinguir acesso público de acesso protegido |
| Criadores | U1 e U2, papel USER | Administrar conteúdo próprio e tentar acesso entre proprietários |
| Administrador | ADM1, papel ADMIN | Controlar funções administrativas explicitamente previstas |
| Estudantes | A e B, papel STUDENT | Testar isolamento entre contas do mesmo papel |

C1/S1/Q1 e C2/S2/Q2 são cursos, seções e atividades de U1/U2.
A e B têm matrícula/progresso/certificado em cursos diferentes CA/CB.
Imagens e vídeos possuem objetos sintéticos próprios no armazenamento.
IDs inexistentes devem ter formato válido e ausência conferida no setup.
Nenhum caso deve usar dado real; escritas e exclusões usam cópias restauráveis.

## 2. Política e matriz de autorização

A matriz distingue regras documentadas no recorte de propostas que precisam de validação.
Uma função administrativa existente não concede automaticamente todas as operações sobre dados de estudantes.
Os requisitos ASVS selecionados orientam a restrição por função, objeto e campo; as regras específicas do produto e os contratos da versão precisam ser explicitados [@rel02-asvs-5].

### Legenda

- **Próprio:** recurso associado à identidade do token; não à identidade enviada no corpo.
- **Autoria:** curso/seção/atividade administrados pelo criador.
- **Público limitado:** somente campos e estados aprovados para divulgação.
- **Pendente:** regra ou resposta ainda não validada; casos dependentes não são liberados para classificação.
- **Documentada:** regra apoiada nas fontes do registro; não significa teste executado ou aprovado.

| Recurso | Anônimo | USER U1/U2 | ADMIN | STUDENT A/B |
|---|---|---|---|---|
| Perfil | Negado nas rotas protegidas | Ler/alterar perfil próprio | Perfil próprio; usuários pelas funções admin previstas | Perfil próprio, sem assumir a outra identidade |
| Cursos | Catálogo de cursos publicados/ativos | Autoria própria; outro autor negado | Consulta/desativação administrativa documentadas; demais poderes transversais a confirmar | Catálogo/conteúdo elegível; sem autoria presumida |
| Atividades | Leitura privada e escrita: contrato pendente P06 | Operações próprias; negações e associação de seção a validar em P06 | CRUD em curso alheio depende de P06 | Conteúdo elegível; política de gabarito depende de P10 |
| Metadados/exclusão de mídia | Negado nas rotas protegidas | Somente mídias próprias | Acesso previsto no contrato inventariado | Sem acesso às mídias privadas de outros proprietários |
| Stream | Proposta pública depende de P07 | Acesso público/privado depende de P07 | Prévia e exceções dependem de P07 | Estados e condições dependem de P07 |
| Instituições | Negado | Negado | CRUD administrativo | Negado; fronteiras institucionais dependem de P11 |
| Usuários/papéis | Negado | Sem administração de papéis/terceiros | Funções admin explícitas; própria troca de papel é recusada | Sem administração de papéis/terceiros |
| Matrícula/progresso | Negado | Sem acesso pessoal de estudante presumido | Operações sobre dados de estudantes não concedidas por esta matriz; P08 | Somente registros da própria identidade |
| Certificados | Verificação/listagem/emissão pública dependem de P08 | Sem acesso pessoal de estudante presumido | Administração de templates não implica acesso irrestrito; P08 | Listar/baixar próprios; terceiros negados |

As fontes de produto descrevem autoria, matrículas, certificados e governança.
Detalhes e links fixados por commit estão no registro de decisões.
A leitura de um endpoint como público é evidência da implementação, não aprovação da divulgação.

### Campos e regras identificadas

| Regra | Restrição ou decisão | Casos |
|---|---|---|
| P01/P02 | Identidade válida e permissão explícita para funções administrativas | AT-01–05, AT-19/20 |
| P03 | Propriedade na autoria; curso alheio 403 e inexistente 404 no contrato da versão | AT-06–09, AT-21/23 |
| P04 | Matrícula/progresso/certificado do próprio estudante; ocultação com 404 nos recursos definidos | AT-12–16 |
| P05 | ownerId, userId e role não podem transferir propriedade/identidade/privilégio | AT-08/12/14 |
| P12 | Metadados/exclusão e listagens de mídia restritos à relação prevista | AT-17/21 |
| P13 | Mídia ou código de certificado confirmado como inexistente: 404 sem dados privados | AT-18-N7 e AT-22-N1 definidos; não concede acesso a recursos existentes |
| P06 | Decidir negações de atividade e alcance transversal do ADMIN | AT-09–11 bloqueados quando dependentes |
| P07 | Definir publicação, stream público/privado e prévia do autor | AT-18 de mídia existente bloqueado |
| P08 | Aprovar campos públicos/rotas legadas de certificado e poderes sobre dados de estudantes | AT-22 bloqueado quando dependente |
| P09 | Definir efeito das mudanças de papel sobre token antigo e nova sessão | Subcasos de sessão de AT-20 bloqueados |
| P10 | Aprovar exposição/ocultação do gabarito e feedback após submissão | Subcasos de campos de AT-23 bloqueados |
| P11 | Confirmar modelo institucional e suas fronteiras de autorização | Subcaso institucional de AT-19 bloqueado |

A equipe informou nesta revisão que não havia decisões aprovadas adicionais para essas pendências.
Campos internos e credenciais não devem aparecer nas respostas.
Campos extras podem ser ignorados com sucesso legítimo ou rejeitados sem mutação; os dois ramos de avaliação estão definidos no CSV, sem permitir sucesso com identidade/privilégio alheios.

## 3. Contrato esperado de respostas HTTP

| Situação | Contrato selecionado | Verificação adicional |
|---|---|---|
| Rota protegida sem token, assinatura inválida, expirada ou sem sub | 401 | Sem dado privado nem efeito de negócio |
| Identidade válida com papel insuficiente em função admin | 403 | Sem consulta/mutação administrativa indevida |
| Curso de autoria alheio em /courses | 403 | Sem conteúdo privado ou mutação |
| Curso inexistente com ID válido | 404 | Ausência do objeto não demonstra autorização |
| Certificado PDF alheio ou inexistente na rota do estudante | 404 | Sem bytes de PDF, attachment ou campos do certificado |
| Stream de mídia ou verificação de certificado com identificador válido confirmado como inexistente | 404 (P13) | Sem conteúdo da mídia nem dados de certificado; independente de P07/P08 |
| Progresso de curso sem matrícula do solicitante | 404 | Sem progresso de outro estudante nem alteração |
| Autoalteração de papel pelo próprio ADMIN | 409 | Papel persistido permanece inalterado |
| Atividade, mídia pública ou divulgação ainda sem política | Pendente conforme P06–P11 | Não aceitar 403/404 ou 200 por conveniência após observar a resposta |

Os códigos são contratos selecionados com apoio na documentação de segurança e no código da versão; precisam ser comparados ao comportamento real.
Nos endpoints com ocultação, comparar objeto alheio e inexistente quanto à estrutura relevante, ignorando valores de requestId/timestamp.
Não há escolha automática entre 403 e 404 para todos os recursos.
Um código de erro isolado não prova bloqueio: comparar resposta, estado no banco e objeto armazenado, quando aplicável.

## 4. Catálogo de casos planejados

O catálogo contém **149 subcasos: 117 definidos e 32 bloqueados**, associados aos **23 IDs originais**.
Esses números descrevem a preparação; não são cobertura executada nem taxa de aprovação.
A definição pode avançar antes do ambiente, mas cada execução ainda depende de setup, credenciais sintéticas e autorização do ambiente.

| ID | Recorte do catálogo | Subcasos | Bloqueados |
|--------|----------------------------------------------|--------|----------|
| AT-01 | Perfil: controles U1/A e requisições sem token | 4 | 0 |
| AT-02 | Criação de curso e consulta administrativa sem token | 4 | 0 |
| AT-03 | Token ausente, inválido, expirado e sem sub | 5 | 0 |
| AT-04 | Funções administrativas com USER e STUDENT | 5 | 0 |
| AT-05 | Alteração de papel por USER e controle ADMIN | 3 | 0 |
| AT-06 | Curso próprio, alheio e inexistente | 3 | 0 |
| AT-07 | PUT/DELETE de curso próprio, alheio e inexistente | 6 | 0 |
| AT-08 | Criação e edição com campos privilegiados adulterados | 5 | 0 |
| AT-09 | Atividade em seção própria, alheia e troca de seção | 5 | 3 |
| AT-10 | Atividade privada: anônimo, outro autor e controles do dono | 12 | 8 |
| AT-11 | CRUD de atividades por ADMIN em curso alheio | 3 | 3 |
| AT-12 | Perfil do estudante com userId/role adulterados | 4 | 0 |
| AT-13 | Matrículas próprias sem registros de B | 3 | 0 |
| AT-14 | Progresso: consulta, gravação, conclusão e identidade | 9 | 0 |
| AT-15 | PDF próprio, alheio e inexistente nas duas direções | 6 | 0 |
| AT-16 | Listas de certificados/progresso com tentativa de trocar identidade | 11 | 0 |
| AT-17 | Metadados/exclusão de imagem e vídeo próprios, alheios e inexistentes | 16 | 0 |
| AT-18 | Stream ativo/publicado, inativo, não publicado e inexistente | 11 | 10 |
| AT-19 | CRUD institucional por papel e lacuna de isolamento | 9 | 1 |
| AT-20 | Consulta, toggle/persistência de papel, autoalteração e sessões | 10 | 4 |
| AT-21 | Listas de autoria/mídia: U1/U2, páginas e filtros | 8 | 0 |
| AT-22 | Verificação de certificado: código válido e inexistente | 2 | 1 |
| AT-23 | Catálogo público/privado/inexistente e proposta de ocultar gabarito | 5 | 2 |

### Formato e procedimento

Cada linha registra ID/subcaso, regra, estado de definição, precondições, ator, token, recurso, método/endpoint, payload, HTTP esperado, dados/efeitos esperados, controle positivo, fontes, ASVS e bloqueio.
O registro de decisões define os símbolos das fixtures e a substituição dos IDs.
Payloads de criação têm campos obrigatórios; um 422 por entrada inválida não deve ser confundido com bloqueio de autorização.
Restaurar as fixtures entre controles positivos e tentativas negativas.

Executar o controle positivo antes da tentativa correspondente.
Após a requisição, verificar dados retornados e o estado antes/depois por consulta autorizada.
Percorrer todas as páginas das listas, guardar evidências saneadas e restaurar as cópias após escritas.
Estados de definição (definido/bloqueado) são diferentes dos estados de execução (aprovado, reprovado, bloqueado, não executado, não aplicável).
A issue #27 registrou a suíte executada; o mapeamento teste→subcaso está em `metricas/registro-execucao.csv`. Uma linha bloqueada ou ignorada não pode contar como teste aprovado.

AT-18-N7 e AT-22-N1 têm o contrato de inexistência definido por P13, sem depender da política de acesso a recursos existentes.
Seus controles positivos AT-18-C1 e AT-22-C1 continuam pendentes de P07/P08.
Enquanto esses controles não puderem ser validados e executados, registrar bloqueio operacional em #27; a definição de 404 não autoriza divulgar dados nem comprova autorização por si só.

### AT-15: PDF próprio, alheio e inexistente

A e B devem baixar os próprios PDFs sintéticos (200 e conteúdo correto).
Em ambas as direções, tentar o PDF alheio e um ID inexistente de formato válido: esperar 404, sem bytes de PDF, attachment ou dados do certificado.
Conferir que os registros/objetos dos dois certificados não foram alterados ou gerados pela tentativa negada.
O PDF próprio deve estar preparado para separar erro de armazenamento/geração de autorização.

### AT-20: persistência e mudança de sessão

ADM1 consulta/lista usuários e alterna o papel de U2 descartável com PATCH sem corpo; o endpoint da versão faz toggle, não recebe o papel desejado no JSON.
Confirmar no banco USER → ADMIN e ADMIN → USER, usando ADM1 distinto do alvo.
A tentativa de ADM1 alterar o próprio papel tem contrato 409.
Guardar tokens anteriores e obter novas sessões após cada alteração; os resultados das requisições com essas sessões dependem da decisão P09.
O ASVS 8.3.2 exige efeito imediato ou mitigação específica quando isso não for possível; expirar um token no futuro, isoladamente, não demonstra atendimento [@rel02-asvs-5].

### AT-19: função administrativa e fronteira institucional

POST de instituição usa /institutions; PUT/DELETE usam /institutions/{id}.
Esses subcasos medem restrição por papel.
Eles não demonstram isolamento entre I1/I2.
O subcaso institucional permanece bloqueado até confirmar entidades, vínculos, endpoint e política P11; não declarar 8.4.1 coberto nem excluí-lo silenciosamente.

## 5. Métricas e critérios de sucesso

As metas abaixo foram propostas no planejamento; os resultados observados com #25 e #27 estão na seção `05-resultados-metricas.md`.
Os denominadores vêm dos inventários acordados; excluídos, bloqueados e não executados são justificados na seção de resultados.

| Métrica | Fórmula | Meta proposta |
|---|---|---|
| Cobertura de regras | Regras com teste positivo e negativo executados ÷ regras aplicáveis inventariadas × 100 | 100% |
| Cobertura de funções | Pares método–endpoint sensíveis testados ÷ pares sensíveis inventariados × 100 | 100% |
| Cobertura de objetos | Combinações próprias, alheias e inexistentes exercitadas ÷ combinações planejadas aplicáveis × 100 | 100% |
| Cobertura de campos | Campos sensíveis com leitura/escrita permitida e negada testadas ÷ campos sensíveis aplicáveis × 100 | 100% |
| Tentativas negadas bloqueadas | Tentativas indevidas sem dado/efeito indevido ÷ tentativas indevidas executadas × 100 | 100% |
| Bypasses confirmados | Quantidade de operações/dados indevidos obtidos ou alterados | 0 |
| Falsos positivos | Operações legítimas negadas ÷ controles legítimos executados × 100 | 0% |
| Integridade após negação | Negações sem mutação ÷ negações com estado verificado × 100 | 100% |
| Rastreabilidade planejada ASVS | Requisitos selecionados com caso documentado ÷ requisitos selecionados aplicáveis × 100 | 100% |
| Rastreabilidade executada ASVS | Requisitos com requisição executada e evidência ÷ requisitos selecionados aplicáveis × 100 | Informativa; não substitui a planejada |
| Severidade | Falhas confirmadas por classe de impacto | Registrar todas; meta de zero críticas/altas abertas |

Rastreabilidade planejada não é conformidade nem validação executada.
A seção de resultados liga requisito, caso/subcaso, evidência e resultado por execução.
Denominador zero deve ser reportado como não mensurável/não aplicável conforme o contexto, sem inventar percentual.
Metas não atingidas devem ser informadas; não é necessário ocultar falhas para concluir o registro experimental.

### Severidade proposta

Classificar apenas desvios reproduzidos contra uma política definida: crítica para poder administrativo amplo; alta para leitura/alteração indevida de dados pessoais ou de múltiplos usuários; média para impacto limitado; baixa para efeito restrito.
Justificar a severidade com impacto e evidência.
Hipóteses estáticas não recebem severidade como se fossem achados confirmados.

## 6. Rastreabilidade ao OWASP ASVS

Usar **ASVS 5.0.0**, capítulo V8 [@rel02-asvs-5].
O campo asvs do CSV liga cada subcaso aos requisitos planejados.

| Requisito | Planejamento e limite |
|---|---|
| 8.1.1 | Matriz, P01–P13 e decisões de função/objeto documentadas |
| 8.1.2 | Regras de campo, allowlists e AT-05/08/12/14/22/23; parte depende de decisão |
| 8.2.1 | AT-01–05, AT-10/11, AT-19/20 |
| 8.2.2 | AT-06/07/09/10, AT-13–18, AT-21; negações aplicáveis e controles |
| 8.2.3 | AT-08/12/14 e AT-22/23; campo privilegiado não pode conceder acesso |
| 8.3.1 | Chamadas diretas à API; a sessão/visibilidade do Web não prova autorização |
| 8.3.2 | Subcasos de sessão de AT-20 planejados; P09 bloqueia definição final |
| 8.4.1 | Subcaso institucional de AT-19 bloqueado por P11; CRUD por papel não o substitui |

8.1.3, 8.1.4, 8.2.4 e 8.4.2 ficam fora do recorte inicial, salvo requisito que os torne aplicáveis.
A seleção não verifica integralmente nenhum nível ASVS.
A cobertura executada e suas evidências são consolidadas em `05-resultados-metricas.md`; 8.1.1 e 8.1.2 permanecem documentais.

## 7. Observações estáticas e pendências

A leitura dos middlewares e serviços descreve pontos de verificação, sem provar seu resultado via HTTP.
O registro de decisões separa fontes do produto, código e propostas da equipe.

- O stream da versão exige token e distingue papéis; a proposta pública original permanece pendente P07.
- O CRUD de atividades precisa ser verificado no contexto de montagem das rotas e política; não concluir vulnerabilidade apenas por ausência local de middleware.
- A projeção de catálogo e a verificação pública de certificado motivam comparação dos campos com allowlists ainda a aprovar.
- O PATCH administrativo alterna papel; persistência e validade das sessões são verificações diferentes.
- O inventário das entidades consultadas não mostrou vínculo institucional de User/Course; isso não permite declarar isolamento demonstrado ou requisito não aplicável.

As decisões P06–P11 exigem fonte, pessoa/data de validação e atualização do catálogo.
O restante do planejamento pode ser revisado enquanto esses pontos são esclarecidos.

## 8. Pré-requisitos e limites

Executar apenas em ambiente local/homologação autorizado, com banco/storage isolados e dados descartáveis.
A issue #26 registrou setup, dependências efetivas, contas, tokens e restauração.
Usar IDs/credenciais sintéticos; não publicar tokens, segredos ou dados reais.
A issue #27 registrou resultados; a comunicação de achados confirmados pelo canal privado do produto permanece responsabilidade da equipe.

O enunciado exige declaração de uso de IA; a equipe deve incluir ferramentas, finalidades e consultas representativas no relatório final.
O registro de planejamento documenta assistência do Codex na preparação dos artefatos.
Interpretação de resultados, análise crítica, justificativas acadêmicas e conclusões devem ser elaboradas/revisadas pela equipe conforme o enunciado.
Esta seção define os critérios; os resultados observados e as limitações da execução estão em `05-resultados-metricas.md`.

## Fontes consultadas nesta seção

- [OWASP ASVS 5.0.0, V8](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md).
- [Autoria e ciclo de cursos](https://github.com/ErasmusEgalitarian/educado-docs/blob/1bfc8d23177a171669cf3e491a4996cee21e3310/docs/backlog/ep_02/fe_04.md).
- [Fontes da API analisada](https://github.com/ErasmusEgalitarian/educado-api/tree/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src).
- [Sessão do Web](https://github.com/ErasmusEgalitarian/educado-web/blob/1131060f370f2c57eaeed2cd541f8af6fae8376c/src/shared/api/auth-session.ts).
- Enunciado local e links por arquivo: registro de escopo e decisões junto ao CSV, na pasta planejamento deste relatório.
