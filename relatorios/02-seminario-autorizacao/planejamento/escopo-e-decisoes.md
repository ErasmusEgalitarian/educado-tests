# Escopo, versões e decisões de autorização — issue #25

Registro técnico em 22/11/2026, por Gustavo (@guxvr), com assistência do Codex.
Estado: definição de testes para revisão; nenhuma requisição de teste foi executada.
Revisão humana prevista: Hugo (@HugoFreitass).
As decisões de produto pendentes precisam de validação da equipe responsável pelo Educado; não há aprovação presumida.

## 1. Enunciado e alcance

Fonte local consultada: `26-2-Seminario.pdf`, cinco páginas.
SHA-256: `2f58969a88b83155b1ad2ada746f69af5e7c375868220a7e75499c13aa5c9543`.
A cópia consultada estava em Downloads; não foi incorporada ao repositório nem reproduzida integralmente.

- Página 1: o seminário admite planejamento sem execução; o relatório final deve apresentar resultados.
- Páginas 3–4: selecionar parte do OSS, técnicas/ferramentas, ambiente, dados, procedimentos, resultados esperados, métricas e limitações; apresentar exemplos concretos e preparação para execução.
- Página 5: o planejamento é contemplado no PTOSS-3; há exigência de declaração do uso de IA, com ferramentas, finalidades e exemplos de consultas.
- Prazo final informado pelo usuário nesta sessão: 22/11/2026. O enunciado consultado não fornece data/horário da entrega final.
- Formato, canal e rubrica específicos do relatório final/PTOSS-3: confirmar no Aprender. O PDF do seminário não substitui essas instruções.

Objeto: autorização da API REST do Educado, usando Web como fonte complementar de integração.
O recorte preserva AT-01 a AT-23 do PDF enviado e detalha seus subcasos; não pretende cobrir todas as rotas da aplicação.
A API deve decidir o acesso mesmo quando o cliente contorna a interface.
Condições de autenticação são pré-requisitos e controles de acesso, não uma avaliação completa de login/sessão.

Entregas desta issue: registro das fontes/decisões, matriz coerente, CSV de definição, correções de AT-15/AT-20 e rastreabilidade planejada.
Ambiente/dados concretos e execução pertencem a #26/#27; métricas/resultados a #28/#29; revisão editorial/PDF a #30/#31.
A declaração de IA deve ser incorporada pela equipe na revisão final, sem atribuir à IA autoria da interpretação dos resultados ou conclusão acadêmica.

## 2. Versões congeladas para esta definição

| Repositório | Commit analisado | Estado local observado |
|---|---|---|
| educado-tests | `f3a673a57de72c29747faf053d0486d3fbeaa433` | Base de dev para a branch docs/rel02-validar-politicas-authz |
| educado-api | `399131a808ed76b3910f9fc1ab3db34ddc0f0d56` | package.json e package-lock.json modificados; fontes citadas sem diff em relação ao commit |
| educado-web | `1131060f370f2c57eaeed2cd541f8af6fae8376c` | Sem alterações rastreadas; documentos locais não rastreados fora do recorte |
| educado-docs | `1bfc8d23177a171669cf3e491a4996cee21e3310` | Sem alterações locais observadas |

Esses commits identificam a leitura estática, não um ambiente executado.
A issue #26 deve escolher um checkout reproduzível para execução, registrar dependências/configuração efetivas e revalidar o catálogo se usar outra versão.
Nenhuma alteração local dos outros repositórios foi revertida ou incorporada.

## 3. Fontes permanentes

Os identificadores abaixo são usados no CSV.
Os intervalos podem ser localizados pelas funções citadas; links fixam o conteúdo integral do arquivo ao commit.

| ID | Fonte e finalidade |
|---|---|
| N01 | [OWASP ASVS 5.0.0, V8](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md): requisitos selecionados pela equipe para função, objeto, campo e camada confiável |
| D01 | [FE-04, ciclo do curso](https://github.com/ErasmusEgalitarian/educado-docs/blob/1bfc8d23177a171669cf3e491a4996cee21e3310/docs/backlog/ep_02/fe_04.md): rascunho visível apenas ao criador e operações de autoria |
| D02 | [FE-05, lições](https://github.com/ErasmusEgalitarian/educado-docs/blob/1bfc8d23177a171669cf3e491a4996cee21e3310/docs/backlog/ep_02/fe_05.md): autoria e publicação |
| D03 | [FE-13, matrículas](https://github.com/ErasmusEgalitarian/educado-docs/blob/1bfc8d23177a171669cf3e491a4996cee21e3310/docs/backlog/ep_06/fe_13.md): recursos do estudante |
| D04 | [FE-18, conclusão/certificado](https://github.com/ErasmusEgalitarian/educado-docs/blob/1bfc8d23177a171669cf3e491a4996cee21e3310/docs/backlog/ep_09/fe_18.md): conclusão e PDF no perfil do estudante |
| D05 | [FE-19, templates](https://github.com/ErasmusEgalitarian/educado-docs/blob/1bfc8d23177a171669cf3e491a4996cee21e3310/docs/backlog/ep_09/fe_19.md): administração de templates não implica acesso irrestrito aos dados de estudantes |
| D06 | [FE-22, governança de cursos](https://github.com/ErasmusEgalitarian/educado-docs/blob/1bfc8d23177a171669cf3e491a4996cee21e3310/docs/backlog/ep_11/fe_22.md): consulta e desativação administrativa |
| S01 | [auth-jwt.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/interface/http/middlewares/auth-jwt.ts): token, sub e contexto |
| S02 | [require-role.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/interface/http/middlewares/require-role.ts): negação por papel |
| S03 | [course-access-service.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/application/courses/course-access-service.ts): objeto inexistente 404, alheio 403; proprietário/ADMIN |
| S04 | [courses-create.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/courses/courses-create.ts): métodos, escrita e associação ao proprietário |
| S05 | [me.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/me/me.ts): perfil e listagens por identidade |
| S06 | [activities.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/activities/activities.ts): métodos/payloads de autoria; ausência local de middleware não prova comportamento em execução |
| S07 | [student/profile.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/student/profile.ts): perfil por identidade STUDENT |
| S08 | [student/progress.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/student/progress.ts): consultas e gravação de progresso |
| S09 | [student-progress-service.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/application/student-progress/student-progress-service.ts): matrícula/progresso do solicitante |
| S10 | [student/certificates.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/student/certificates.ts): certificado próprio e 404 para objeto fora da identidade |
| S11 | [media/update-metadata.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/media/update-metadata.ts): metadados, propriedade e exclusão |
| S12 | [media/stream.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/media/stream.ts): mecanismo de stream a comparar à política |
| S13 | [admin/registrations.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/admin/registrations.ts): consultas e PATCH de papel |
| S14 | [registration-service.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/application/registration/registration-service.ts): toggle USER/ADMIN; alteração do próprio papel retorna 409 |
| S15 | [catalog-service.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/application/catalog/catalog-service.ts): conteúdo/estado público e campos |
| S16 | [certificate-pdf-service.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/application/certificates/certificate-pdf-service.ts): listagem própria e verificação pública |
| S17 | [institutions-crud.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/institutions/institutions-crud.ts): CRUD administrativo |
| S18 | [modelos](https://github.com/ErasmusEgalitarian/educado-api/tree/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/models): User e Course sem vínculo institucional encontrado no inventário desta revisão |
| S19 | [auth-session.ts (Web)](https://github.com/ErasmusEgalitarian/educado-web/blob/1131060f370f2c57eaeed2cd541f8af6fae8376c/src/shared/api/auth-session.ts): sessão no cliente; não serve como prova de autorização na API |
| S20 | [course-validation.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/application/courses/course-validation.ts): payload válido para evitar falso bloqueio por validação |
| S21 | [activity-validation-db.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/application/activities/activity-validation-db.ts): ID, sectionId, type e order |
| S22 | [enrollment-service.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/application/enrollment/enrollment-service.ts): matrícula por identidade e ocultação com 404 |
| S23 | [certificates.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/routes/certificates/certificates.ts): rotas legadas de criação/listagem a delimitar |
| S24 | [index.ts](https://github.com/ErasmusEgalitarian/educado-api/blob/399131a808ed76b3910f9fc1ab3db34ddc0f0d56/src/index.ts): montagem das rotas HTTP |

Os arquivos da API/Web citados não tinham modificações rastreadas além das dependências já anotadas.
A evidência estática descreve contratos e pontos de verificação; não confirma sucesso, bypass ou vulnerabilidade.

## 4. Registro de regras e decisões

Data de todos os registros: 22/11/2026.
Responsável pelo registro: Gustavo; validação pendente de produto: responsável a indicar pela equipe.
`documentada` significa regra apoiada nas fontes indicadas e no recorte ASVS já selecionado; não significa teste aprovado.
Contratos HTTP observados no código são candidatos a contrato de teste da versão, e não certificação de aderência à regra de negócio.

| ID | Regra e fonte do oráculo | Estado / impacto |
|---|---|---|
| P01 | Rotas protegidas exigem identidade válida; avaliar no servidor (N01, S01, S02, S24). Sem token/assinatura inválida/expiração/sub ausente: 401. Papel insuficiente: 403. | documentada; AT-01–05 e controles |
| P02 | Funções administrativas somente com permissão explícita (N01, D06, S13, S17). ADMIN lê usuários e administra instituições nos endpoints inventariados. | documentada; AT-04/05/19/20; não estender a todos os dados de estudantes |
| P03 | Autor acessa seus cursos de autoria e rascunhos (D01, N01). Contrato S03: próprio permitido; alheio 403; inexistente 404. | documentada; AT-06–09/21; 404 não é alternativa automática para curso alheio |
| P04 | Recursos pessoais do estudante limitados à identidade do token (D03, D04, N01). Progresso sem matrícula: 404 (S09); certificado alheio/inexistente: 404 (S10). | documentada; AT-12–16; aplicar simetria A/B |
| P05 | Cliente não pode escolher outra identidade, propriedade ou papel (N01, P03/P04). Contrato de massa extra: ignorar campos privilegiados com sucesso legítimo ou rejeitar sem mutação; não aceitar sucesso com elevação. | documentada como invariante de segurança; AT-08/12/14; resultados condicionais explicitados no CSV |
| P06 | CRUD de atividades de curso próprio por USER (D01/D02, N01); alcance de ADMIN sobre atividades/cursos privados e status das negações de atividade precisam de decisão específica. | pendente; bloqueia AT-09 negativos, AT-10 e AT-11; D06 não concede automaticamente CRUD irrestrito |
| P07 | Proposta original: stream de mídia ativa/publicada para qualquer pessoa. S12 exige token e distingue papéis; ACTIVE não comprova publicação em curso. Definir publicação, acesso privado, prévia do autor e status das negações. | pendente; bloqueia AT-18; preservar proposta como proposta, sem adaptá-la silenciosamente ao código |
| P08 | Definir campos públicos e política de emissão/listagem legada de certificado (D04/D05, S16, S23). Template administrativo não implica leitura de certificados individuais. | pendente; AT-22 válido; acesso administrativo a matrículas/progresso/certificados e rotas legadas ficam sem concessão presumida |
| P09 | Mudança de permissão: N01 8.3.2 pede aplicação imediata ou controles mitigadores de alerta/reversão quando não possível; expiração isolada não demonstra atendimento. Definir instante de efeito, tratamento do token antigo e nova sessão. | pendente; AT-20 de sessão bloqueado; o PATCH e a persistência podem ser testados separadamente |
| P10 | Proposta original: ocultar correctAnswer antes da submissão; definir feedback após resposta e a classificação de cada campo público (N01, S15). | pendente; AT-23 de campos bloqueado; consulta pública de curso ativo pode ser testada independentemente |
| P11 | Definir se instituições são tenants e quais relações restringem cada ator. S18 não mostrou vínculo institucional em User/Course; ausência no recorte não prova não aplicabilidade. | pendente; AT-19 de fronteira institucional bloqueado; CRUD por papel não cobre ASVS 8.4.1 |
| P12 | Mídia: operações de metadados/exclusão limitadas ao proprietário ou ADMIN (N01, S11); consulta de /me/media limitada à identidade (S05). | documentada no contrato selecionado; AT-17/21; não implica liberação do stream |

O usuário confirmou nesta sessão, em 22/11/2026, que não há decisões adicionais aprovadas para esses pontos; P06–P11 permanecem pendentes.
Ao receber decisão: registrar texto, fonte, pessoa/data, atualizar esta tabela e `status_definicao`/`bloqueio` dos subcasos afetados.
Não liberar uma política porque a requisição retornou determinado status.

## 5. Dados e procedimento comum para o CSV

`casos-autorizacao.csv` contém definição, não resultados.
Cada linha é um subcaso: um ator, um estado de token, um método e uma rota.
Os IDs originais são preservados em `caso_pai`.
Sufixos P identificam controles positivos, N negativos e C decisões condicionais.
`status_definicao` admite `definido` ou `bloqueado`; nenhum deles significa executado/aprovado.

### Dados de teste a preparar em #26

| Símbolo | Estado requerido |
|---|---|
| F0 | Ambiente local/homologação isolado; banco/storage acessíveis; snapshot; sem dados reais; relógio e assinatura de tokens controlados |
| U1/U2/ADM1 | Contas independentes USER/USER/ADMIN; perfis válidos; ADM1 nunca é alvo de alteração do próprio papel |
| A/B | Contas STUDENT distintas; dados pessoais, matrículas/progresso/certificados identificáveis separadamente |
| C1/C2 | Cursos de U1/U2, respectivamente; cada um com seção S1/S2 e atividade Q1/Q2; criar cópias descartáveis antes de escritas |
| CP/CD | Curso ativo/publicado e curso de autoria privada/inativo; a definição de publicação para mídia depende de P07 |
| CA/CB | Cursos diferentes com matrícula/progresso exclusivos de A/B; respectivas seções SA/SB |
| CertA/CertB | Certificados de A/B, conclusão satisfeita; PDF sintético já disponível para não confundir erro de S3/geração com autorização |
| Img1/Img2/Vid1/Vid2 | Mídias reais sintéticas em storage de U1/U2; tipo image/video correto; registro e objeto armazenado verificáveis |
| MP/MI/MNP | Mídia ACTIVE/publicada; INACTIVE; ACTIVE/não publicada; associação da publicação aguardando P07 |
| I1/I2 | Instituições sintéticas com domínios únicos; relações institucionais de atores/recursos dependem de P11 |
| X | ID com formato válido, previamente confirmado como inexistente para a entidade da linha; não usar string malformada |
| NOVO | ID novo e válido, gerado para cada criação de atividade; confirmar ausência antes da tentativa e restaurar a fixture depois |
| codigoA/codigoX | Código de verificação sintético válido e código de mesmo formato inexistente |
| ROLE_TARGET | U2 descartável; nunca ADM1; guardar papel e token anteriores; após promoção obter nova sessão; reduzir e restaurar ao final |

Substituir `{SIMBOLO}` em endpoint e payload pelos IDs concretos da fixture.
`token_estado=valido` usa Bearer do ator; `ausente` omite Authorization; `malformado` usa assinatura/token inválido; `expirado` usa token corretamente assinado já expirado; `sem_sub` usa token assinado pelo ambiente de teste sem sub.
Nunca usar segredo de produção para fabricar token.
`papel_anterior` e `nova_sessao` referenciam as etapas ordenadas de AT-20.

Procedimento para toda linha:

1. Restaurar a fixture indicada e verificar precondições por consulta autorizada. Em falha de setup, registrar bloqueio operacional.
2. Executar o `controle_positivo` correspondente para comprovar a requisição legítima. Em escritas/exclusões, usar réplica ou restaurar antes da tentativa negativa.
3. Fazer a requisição isolada contra a BASE_URL isolada definida em #26, com método, rota, token e JSON previstos; usar Content-Type: application/json quando houver corpo. Não seguir redirects silenciosamente nem confiar na tela.
4. Conferir HTTP, campos/corpo e efeitos persistidos. Listagens devem ser percorridas até o fim para detectar vazamento em outras páginas.
5. Para negação, comparar estado antes/depois por ator autorizado: linha, associação, papéis, curso, matrícula, progresso, certificado e objeto em storage quando aplicável. Eventos de auditoria são admitidos; efeitos de negócio indevidos não.
6. Guardar versão, timestamp, requisição/resposta saneadas e evidência de estado em #27. Restaurar a fixture após cada tentativa.
7. Usar os estados de execução de #27 separadamente dos estados de definição deste catálogo.

`payload=-` indica corpo ausente; `{...}` dentro do JSON representa substituição de fixture, não omissão de campos.
Cursos usam todos os campos obrigatórios de S20; atividades incluem ID novo (S21); metadados usam title/altText/description; PATCH de papel é toggle sem payload (S13/S14).
Negação por 422 causada por payload inválido não comprova autorização.
Quando o CSV aceita sucesso legítimo OU rejeição de campos extras, a linha explicita os dois ramos: sucesso só com campos permitidos e rejeição sem mudança de negócio.

### AT-15

Comparar PDF próprio (200 e conteúdo sintético correto), alheio e inexistente (404, sem bytes de PDF, cabeçalho attachment ou campos do certificado).
Comparar a estrutura relevante das duas negações; não exigir igualdade de requestId/timestamp nem de tempo de rede.
Testar A contra B e B contra A; ler depois ambos os registros/objetos por ator autorizado para provar que a negação não causou geração/alteração.
A implementação filtra por identidade (S10), mas somente a execução demonstrará o resultado.

### AT-20

Usar ADM1 para consultar/listar e alternar ROLE_TARGET entre USER e ADMIN (PATCH sem body); verificar o papel persistido a cada etapa.
Controle de identidade: autoalteração de ADM1 deve retornar 409 no contrato S14.
A leitura após alteração não é prova de revogação de sessão.
Os subcasos de token anterior/nova sessão requerem P09 antes de definir status e janela de efeito.
Manter controles de promoção e redução distintos, comparar acesso a /admin/users com a permissão antes/depois e verificar ausência de efeitos em tentativas negadas.

### Isolamento institucional

AT-19 de CRUD mede papel, não tenant.
O subcaso AT-19-C1 registra a lacuna de fronteira I1/I2: endpoint e relações concretas só podem ser fixados depois de P11.
Não há execução segura nem exclusão automática por “não aplicável” enquanto esse contrato não existir.
Se o produto não tiver tenants, registrar fonte/validação dessa conclusão e retirar 8.4.1 do denominador aplicável; caso contrário, especificar e executar os acessos cruzados.

## 6. Entrega e validação

- Cada ID original AT-01–AT-23 precisa de pelo menos uma linha; IDs de subcasos são únicos.
- Regras, fontes, fixtures e controles positivos referidos devem existir.
- Nenhum `definido` pode depender de P06–P11; todo `bloqueado` deve indicar decisão e efeito esperado ainda a fixar.
- Endpoints não inventariados só entram após confirmação. O único placeholder de endpoint desta definição é o caso institucional bloqueado.
- Matriz/seção 6 resumem o CSV; números de cobertura só serão calculados a partir da execução e dos inventários de #28.
- 8.1.1/8.1.2 tratam a documentação; 8.2.1/8.2.2/8.2.3 e 8.3.1 têm casos planejados; 8.3.2 e 8.4.1 permanecem condicionados a P09/P11.
- Não há alegação de atendimento integral a nível ASVS ou cobertura executada.

Conferir o contrato documental com `python planejamento/validar.py` a partir da pasta do relatório.
O validador verifica estrutura, IDs, controles, fontes, fixtures, payloads, bloqueios e consistência dos totais com a seção 6; ele não executa os testes da API.
Regenerar pela pasta do relatório com `./gerar.sh`, compilar na raiz com `./build.sh 02-seminario-autorizacao`, conferir `git diff --check` e PDF.
A revisão humana e o merge são pendentes até registro no PR; a issue não é encerrada somente pela criação destes artefatos.

## 7. Uso de IA nesta preparação

Ferramenta: OpenAI Codex.
Finalidades: localizar requisitos/fontes, organizar o inventário, propor subcasos/payloads, editar Markdown/CSV e conferir estrutura/geração.
Consultas representativas: “planeje a implementação da issue 25 com branch a partir de dev” e “prossiga com a implementação”.
Os artefatos são proposta técnica para revisão da equipe; não constituem análise crítica, interpretação de resultados ou conclusão acadêmica.
A equipe deve validar as regras/payloads, corrigir o que for necessário e registrar a declaração exigida no relatório final.
