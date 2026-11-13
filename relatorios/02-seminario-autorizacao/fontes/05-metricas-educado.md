# Métricas e Proposta de aplicação

## 1. Objetivo e fronteira

Avaliar se a API REST do Educado permite que cada ator execute somente as operações e acesse somente os dados autorizados para seu papel e sua relação com cada objeto. O foco é autorização horizontal (um usuário acessando dados de outro), vertical (um papel de menor privilégio executando funções administrativas), adulteração de identificadores e de campos sensíveis.

A autorização efetiva deve ser validada na **`educado-api`**, diretamente nos endpoints HTTP.

### Atores de teste

| Ator | Identificação de teste | Papel/token | Uso |
|---|---|---|---|
| Anônimo | -- | Sem token | Verificar recursos protegidos e recursos públicos limitados |
| `USER` | U1, criador de conteúdo | `USER` | Acessar perfil e conteúdo que possui; tentar ações de outro proprietário e administrativas |
| `ADMIN` | ADM1 | `ADMIN` | Verificar funções administrativas e acesso transversal explicitamente autorizado |
| Estudante A | A | `STUDENT` | Consultar/alterar somente perfil, matrícula, progresso e certificados próprios |
| Estudante B | B | `STUDENT` | Identidade diferente de A com o mesmo papel; fornecer objetos de B para testes de isolamento |

## 2. Política inicial e matriz de autorização

### Legenda

- **Público limitado:** leitura de catálogo ou verificação pública, sem dados privados nem operações de escrita.
- **Próprio:** somente o próprio perfil/objeto do ator autenticado.
- **Próprio curso:** autor `USER` pode atuar nos cursos, seções, atividades e mídias que possui; `ADMIN` pode atuar em qualquer um.
- **Elegível:** estudante pode consultar conteúdo disponibilizado para estudantes e responder atividades permitidas.
- **Admin:** somente funções administrativas explicitamente previstas.
- **Negado:** a operação não deve ser autorizada.

| Recurso | Anônimo | `USER` U1 | `ADMIN` | Estudante A | Estudante B |
|---|---|---|---|---|---|
| Perfil | Negado | Ler/alterar o próprio perfil em `/me/profile` | Ler/alterar o próprio perfil; consultar usuários apenas por funções admin autorizadas | Ler/alterar apenas o perfil A | Ler/alterar apenas o perfil B |
| Cursos | Público limitado pelo catálogo (`/catalog`); sem rotas de autoria | Ler/criar/alterar/ativar/desativar/excluir somente cursos próprios | Operar cursos de qualquer autor nas funções admin previstas | Ler catálogo e conteúdo elegível; sem autoria | Igual a A, sem acesso ao estado privado de A |
| Atividades | Leitura pública de atividades publicadas no catálogo, sem expor o gabarito antes da resposta; escrita negada | Criar/ler/alterar/excluir somente em curso próprio | Criar/ler/alterar/excluir em qualquer curso | Consumir e responder atividades elegíveis; sem CRUD nem acesso ao gabarito antes da resposta | Igual a A; sem alterar respostas/progresso de A |
| Mídias | Fazer stream de mídia ativa e publicada; sem acesso a metadados privados | Gerenciar metadados e excluir mídia própria; fazer stream de qualquer mídia ativa e publicada | Administrar mídias conforme endpoint admin; fazer stream de mídia ativa e publicada | Fazer stream de mídia ativa e publicada; sem alterar/excluir | Igual a A; não acessar metadados privados de outros autores |
| Instituições | Negado | Negado | Listar, consultar, criar, alterar e excluir | Negado | Negado |
| Usuários | Negado; exceção para cadastro/login/verificação pública previstos | Consultar/alterar somente os campos próprios; não administrar papéis ou outros usuários | Listar/consultar e executar ações admin previstas, como alterar papel ou excluir usuário | Somente dados próprios permitidos | Somente dados próprios permitidos |
| Matrículas | Negado | Negado | `ADMIN`: acesso administrativo a matrículas; discutir com a equipe quais operações e dados são permitidos | Listar, criar, consultar e cancelar somente matrículas de A | Somente matrículas de B |
| Progresso | Negado | Negado | `ADMIN`: acesso administrativo ao progresso; discutir com a equipe o escopo e as operações permitidas | Consultar/gravar/concluir somente progresso de A | Somente progresso de B |
| Certificados | No código atual, sem autenticação: `GET /certificates/{username}` lista certificados, `POST /certificates` cria certificado e `GET /certificates/verify/{code}` retorna dados limitados. Discutir com a equipe se listagem e criação devem ser públicas | Sem listagem/download de certificados de terceiros | `ADMIN`: acesso administrativo a certificados; discutir com a equipe se inclui listagem, PDF e dados pessoais | Listar/baixar somente certificados de A | Somente certificados de B |

### Regras de campos e objetos a validar

1. `ownerId`, `userId` e `role` não podem ser escolhidos livremente pelo cliente para mudar a propriedade do recurso, assumir identidade alheia ou elevar privilégios. A identidade deve vir do token validado; a propriedade deve ser aplicada ou conferida no servidor.
2. No cadastro/edição de curso, uma tentativa de enviar `ownerId` de U2 não deve transferir o curso. Na criação, o proprietário esperado é o ator autenticado; na edição, o proprietário não deve ser alterável por `USER`.
3. Na criação de atividade, `sectionId` precisa pertencer a um curso que o autor pode editar. Não basta validar que a seção existe.
4. `institutionId`, `courseId`, `mediaId`, IDs de matrícula, progresso e certificado devem ser revalidados no contexto do ator e da operação; UUIDs difíceis de adivinhar não substituem autorização.
5. A resposta de perfil deve conter apenas campos previstos para o próprio ator ou para a função admin autorizada. Campos internos, credenciais e hashes nunca devem ser retornados.
6. `correctAnswer` de atividade é campo de autorização/leitura: não deve ser enviado a anônimos/estudantes antes da submissão. O tratamento após a submissão deve seguir a regra de feedback da atividade.
7. Qualquer pessoa, inclusive anônimos e estudantes sem matrícula, pode fazer stream de mídia ativa e publicada. Mídias inativas ou não publicadas não devem ser transmitidas; metadados e operações de escrita continuam restritos ao proprietário ou `ADMIN`.

| Objeto/campo | Regra inicial para verificar |
|---|---|
| Usuário: `role`, `status` | Somente funções admin autorizadas; ignorar/rejeitar tentativa de alteração por `/me` ou endpoint de estudante |
| Curso: `ownerId` | Derivar do ator na criação e preservar na edição por `USER`; não aceitar troca via corpo |
| Atividade: `sectionId` | `USER` só pode associar a seção de curso próprio; `ADMIN` pode associar conforme regra do produto |
| Atividade: `correctAnswer` | Escrita somente por criador/admin; não expor a estudante/anônimo antes da submissão |
| Mídia: `ownerId`, chave de armazenamento e `status` | Não controláveis por usuário comum; metadados editáveis pelo proprietário/admin; acesso de leitura separado da edição |
| Matrícula/progresso/certificado: `userId` | Derivar do token/registro no servidor; não aceitar ID de outro estudante vindo do cliente |
| Instituição: nome, domínios e `isActive` | Escrita somente por `ADMIN` |

## 3. Contrato esperado de respostas HTTP

| Situação | Resposta esperada | Critério de interpretação |
|---|---|---|
| Endpoint protegido sem token, com token inválido/expirado ou identidade inválida | **401 Unauthorized** | Não autenticado. Não revelar dados nem executar a operação. |
| Token válido, mas papel sem permissão para a função | **403 Forbidden** | Autenticado, porém sem autorização para a função (por exemplo, `USER` chamando função exclusiva de `ADMIN`). |
| Token válido, mas objeto pertence a outro ator | **403** por padrão. | O contrato deve ser documentado por endpoint. Se 404 for escolhido para ocultação, objeto alheio e inexistente devem ser indistinguíveis na resposta relevante. |
| Recurso realmente inexistente | **404 Not Found** | Não confundir ausência do objeto com autorização bem-sucedida. |
| Recurso alheio deliberadamente ocultado | **404 Not Found**  | Aceitável somente se for política intencional e consistente, sem conteúdo ou efeito colateral. |

Para todo resultado negado, conferir também o **estado antes/depois**: nenhum perfil, papel, curso, atividade, mídia, matrícula, progresso ou certificado pode ter sido alterado. Um código 403/404 isolado não prova que a operação foi bloqueada.

## 4. Catálogo de casos de teste futuros

Os casos são testes de integração HTTP orientados pela matriz. `U1` possui C1/M1; `U2` possui C2/M2; A e B têm matrículas, progresso e certificados separados. O status entre parênteses é alternativa somente quando a política de ocultação de existência for formalmente escolhida.

| ID | Ator e cenário / chamada representativa | Resultado e verificação de segurança |
|---|---|---|
| AT-01 | Anônimo: `GET /me/profile` e `GET /student/profile` sem `Authorization` | `401`; não retornar perfil. |
| AT-02 | Anônimo: `POST /courses` e `GET /admin/users` | `401`; nenhum curso/consulta administrativa executada. |
| AT-03 | Token ausente, malformado, expirado ou sem `sub`: `GET /student/enrollments` | `401`; nenhum dado de matrícula retornado. |
| AT-04 | `USER` U1: `GET /admin/users` e `GET /institutions` | `403`; não retornar usuários/instituições. Repetir com estudante A. |
| AT-05 | `USER` U1: `PATCH /admin/users/{U1-ou-U2}/role` com tentativa de se tornar `ADMIN` | `403`; papel persistido de U1 e de U2 permanece inalterado. |
| AT-06 | `USER` U1: `GET /courses/{C2}` (curso de U2) | `403` ; não retornar conteúdo/ownerId privado de C2. |
| AT-07 | `USER` U1: `PUT /courses/{C2}` e `DELETE /courses/{C2}` | `403`; Nega, deve comparar C2 antes/depois e comprovar que título, estado e existência não mudaram. |
| AT-08 | `USER` U1 cria curso enviando no corpo `ownerId=U2` e `role=ADMIN` | A operação autorizada cria curso com `ownerId=U1`; campos privilegiados são ignorados/rejeitados e o papel de U1 não muda. |
| AT-09 | `USER` U1 cria/edita atividade em seção de C1 e tenta criar/editar em seção de C2 | Próprio curso: permitir. Outro curso: negar e não alterar C2. Confirmar pertencimento da seção ao curso no servidor `403`. |
| AT-10 | Anônimo: `GET /activities/{id}` e `GET /activities/section/{sectionId}` para conteúdo não publicado, além de `POST /activities`; `USER` U1 não proprietário: `GET/PUT/DELETE /activities/{id}` de C2 | Restringir conteúdo privado e escrita: anônimo recebe `401` na escrita e não lê atividade não publicada; U1 não lê/edita/exclui a atividade de U2.**Hipótese:** as rotas consultadas não mostram middleware de autorização; confirmar contrato e resposta diretamente na API. |
| AT-11 | `ADMIN`: criar/alterar/excluir atividade de curso de U2; comparar com AT-09 | Permite as ações ao `ADMIN`; verificar que `USER` não obtém o mesmo resultado; **Hipótese:** as rotas consultadas não mostram checagem de papel/propriedade e podem aceitar as operações de qualquer ator; confirmar via requisições HTTP. Isso não é uma vulnerabilidade confirmada.. |
| AT-12 | Estudante A: `PUT /student/profile` enviando campos extras `userId=B` e `role=ADMIN` | Atualizar, no máximo, campos permitidos de A; B e os papéis de A/B permanecem inalterados. |
| AT-13 | Estudante A: `GET /student/enrollments` quando B possui outra matrícula | `200` com dados de A apenas; matrícula exclusiva de B não aparece. Usar curso diferente para detectar mistura de registros. |
| AT-14 | Estudante A solicita progresso de curso matriculado somente por B em `GET /student/progress/courses/{courseId}` e tenta `userId=B` em query/body nos endpoints de progresso | `404` conforme contrato aprovado ; em nenhuma resposta aparecem progresso, pontuação ou conclusão de B. `userId` deve vir do token. |
| AT-15 | Estudante A: `GET /student/certificates/{certificateB}/pdf` | `404` Não encontrará por usar o id do userID passado e do token em uma comparação. |
| AT-16 | Estudante B lista certificados e progresso; testar também identificador de A | Listas contêm somente objetos de B. Um ID de A é negado/ocultado, sem campos, PDF ou mudança de estado de A. |
| AT-17 | `USER` U1: alterar metadados ou excluir M2 em `/media/images/{id}/metadata` e `/media/videos/{id}` | `403` para objeto alheio; metadados, registro e objeto de armazenamento permanecem inalterados. Repetir como A contra mídia privada de U1/U2. |
| AT-18 | Anônimo, A e B: `GET /media/{id}/stream` para mídia ativa/publicada e para mídia inativa/não publicada | Mídia ativa/publicada: `200` para todos, sem exigir autenticação ou matrícula. Mídia inativa/não publicada: negar o stream e não revelar o conteúdo; validar o status HTTP conforme o contrato do endpoint. |
| AT-19 | `USER` U1: `POST/PUT/DELETE /institutions/{id}`; `ADMIN` realiza operação equivalente com dados de teste | `USER`: `403` e estado inalterado. `ADMIN`: sucesso somente com payload válido e dados de teste controlados. |
| AT-20 | `ADMIN` consulta `/admin/users`, consulta um usuário e altera o papel de um usuário de teste; em seguida, testar uma nova requisição desse usuário | Acesso admin permitido. |
| AT-21 | `USER` U1 consulta `/me/courses` e `/me/media` usando diferentes valores de paginação, `kind` e `status` | Listagens limitadas a U1; parâmetros de consulta não removem a condição de propriedade. A tentativa de acessar ID de mídia de U2 é coberta por AT-17. |
| AT-22 | Anônimo verifica certificado em `/certificates/verify/{code}` com código válido e inválido | A consulta pública retorna somente atributos explicitamente aprovados para verificação; não revela e-mail, progresso detalhado ou PDF. Confirmar se `userName`, nome do curso, total de seções, data e carga horária são divulgação intencional. Código inválido retorna `404`. |
| AT-23 | Anônimo e estudante consultam `GET /catalog/courses/{C1}` e inspecionam atividades e campos retornados | A consulta pública do curso deve retornar 200 com os dados públicos, mas sem incluir correctAnswer nas atividades. **Hipótese**: A rota é publica e retornara o gabarito do curso, mesmo o usuário nao devendo ter acesso a ele. |

### Dados de teste e controles positivos

- Criar U1 e U2 (`USER`), ADM1 (`ADMIN`), A e B (`STUDENT`) com credenciais independentes.
- Criar C1 de U1 e C2 de U2, cada um com seção e atividade; configurar mídia própria, mídia de curso publicada e mídia inativa.
- Criar matrícula, progresso e certificado para A e B em cursos distintos, sem reutilizar IDs.
- Incluir controles positivos: U1 administra C1/M1; U2 administra C2/M2; A e B consultam os próprios recursos; ADM1 executa as funções administrativas previstas. Eles detectam falsos positivos (negações indevidas).
- Para cada tentativa negada, registrar resposta HTTP e consultar novamente o banco e os dados de teste por um ator autorizado para confirmar ausência de mutação.

## 5. Métricas e critérios de sucesso

| Métrica | Fórmula | Critério de sucesso proposto |
|---|---|---|
| Cobertura de regras | Regras com ao menos um teste positivo e um negativo ÷ regras aplicáveis inventariadas × 100 | **100%** |
| Cobertura de funções | Pares método HTTP–endpoint sensíveis com autorização testada ÷ pares sensíveis inventariados × 100 | **100%** |
| Cobertura de objetos | Combinações próprias, alheias e inexistentes previstas e exercitadas ÷ combinações planejadas aplicáveis × 100 | **100%** |
| Cobertura de campos | Campos sensíveis inventariados com leitura/escrita permitida e negada testadas ÷ campos sensíveis inventariados × 100 | **100%** |
| Tentativas negadas bloqueadas | Tentativas não autorizadas sem dado/efeito indevido ÷ total de tentativas não autorizadas executadas × 100 | **100%** |
| Bypasses confirmados | Número de operações/dados não autorizados que foram obtidos ou alterados | **0** |
| Falsos positivos | Operações legítimas de controle negadas ÷ operações legítimas de controle executadas × 100 | **0%** |
| Integridade após negação | Tentativas negadas sem mutação persistida ÷ tentativas negadas com estado verificado × 100 | **100%** |
| Rastreabilidade ASVS | Requisitos ASVS aplicáveis com ao menos um caso associado ÷ requisitos ASVS aplicáveis selecionados × 100 | **100%** |
| Severidade | Contagem de falhas confirmadas por severidade após validação e análise de impacto | Registrar **100%** das falhas com severidade; **0 críticas/altas abertas** como condição para aceite futuro |

### Severidade proposta para triagem

- **Crítica:** acesso administrativo/sistêmico sem autorização ou alteração ampla de dados/contas.
- **Alta:** leitura ou alteração não autorizada de dados pessoais, certificados, progresso, papéis ou conteúdo de múltiplos usuários.
- **Média:** acesso/alteração indevida de escopo limitado, sem evidência de impacto amplo.
- **Baixa:** exposição de informação de baixo impacto ou falha com efeito muito restrito.

Classificar somente após reproduzir o resultado no ambiente autorizado, registrar evidência e estimar impacto. Uma hipótese derivada de leitura de código não recebe severidade como se fosse achado confirmado.

## 6. Rastreabilidade ao OWASP ASVS

Referência escolhida: **OWASP ASVS 5.0.0**, capítulo V8 Authorization.

| ASVS 5.0.0 | Aplicação ao planejamento | Casos relacionados |
|---|---|---|
| V8.1.1 | Documentar regras de autorização por função e dados/objetos | Matriz; AT-04 a AT-11, AT-19 a AT-22 |
| V8.1.2 | Documentar restrições de leitura e escrita por campo | Regras de campos; AT-05, AT-08, AT-12, AT-14, AT-22, AT-23 |
| V8.2.1 | Restringir funções a consumidores com permissão explícita | AT-01 a AT-05, AT-10, AT-11, AT-19, AT-20 |
| V8.2.2 | Restringir dados específicos e mitigar IDOR/BOLA | AT-06, AT-07, AT-09, AT-13 a AT-18, AT-21 |
| V8.2.3 | Restringir acesso a propriedades/campos e mitigar BOPLA | AT-05, AT-08, AT-12, AT-14, AT-22, AT-23 |
| V8.3.1 | Aplicar autorização em camada confiável do servidor, não só no cliente | Todos; chamadas diretas à `educado-api` |
| V8.3.2 | Aplicar mudanças de permissão de forma efetiva, inclusive em sessões/tokens | AT-05 e AT-20; política de revogação/expiração a confirmar |
| V8.4.1 | Controles entre instituições/tenants | AT-19 e casos adicionais após confirmar o modelo multi-instituição |

V8.1.3, V8.1.4, V8.2.4 e V8.4.2 tratam atributos contextuais/adaptativos ou controles administrativos de nível mais amplo e ficam fora do escopo inicial, salvo requisito do produto que os torne aplicáveis. A cobertura não deve ser declarada para requisitos excluídos.

## 7. Hipóteses do código a confirmar (não são vulnerabilidades confirmadas)

Na leitura estática usada para definir os cenários, foram observados pontos que justificam testes, mas não provam falha em execução:

- Há verificações de papel no middleware e nas funções administrativas; há também checagens de propriedade em serviços de curso e de mídia. Os testes devem verificar as rotas e os efeitos completos, não apenas a existência desses helpers.
- As rotas REST de atividades consultadas não mostram middleware de autorização no próprio arquivo. AT-09 a AT-11 validarão a política esperada de dono do curso/admin e confirmarão como os endpoints se comportam via API.
- A projeção de atividades no detalhe público do catálogo inclui o atributo `correctAnswer`, e a verificação pública do certificado retorna `userName`, curso, total de seções, data e carga horária. Isso motiva AT-22/AT-23 para confirmar a política de divulgação campo a campo; não é uma conclusão de vulnerabilidade.
- O stream de mídia tem lógica própria de token e trata estudantes diferentemente de leitores de metadados. AT-18 verificará que qualquer pessoa consegue transmitir mídia ativa e publicada, independentemente de autenticação ou matrícula, e que mídia inativa/não publicada não é transmitida.
- O mapeamento atual distingue `USER`, `ADMIN` e `STUDENT`. Para esta proposta, `USER` significa autor de conteúdo e estudantes A/B são contas diferentes com papel `STUDENT`.

Qualquer desvio deve ser reproduzido, comparado ao contrato aprovado, confirmado quanto à ausência/presença de efeito e registrado como resultado somente depois da execução autorizada.

## 8. Pré-requisitos, limites e segurança operacional

- Executar **somente em ambiente local ou homologação com autorização explícita**; nunca contra produção, usuários reais ou serviços de terceiros.
- Usar banco e armazenamento de mídia isolados, contas sintéticas e IDs gerados para teste. Não reutilizar tokens, segredos ou dados pessoais reais.
- Preparar backups e limpeza dos dados de teste, além de registrar os estados iniciais para provar que tentativas negadas não alteraram dados.
- Manter alcance limitado aos endpoints e cenários acordados. Não realizar força bruta, varredura indiscriminada ou tentativas contra infraestrutura externa.
- Confirmar previamente a ocultação de objetos com 404, administração de matrículas/progresso/certificados, escopo de acesso de ADMIN e isolamento por instituição.
- Este plano não implementa nem executa os testes e não apresenta resultados experimentais.

## Referências

- OWASP. **Application Security Verification Standard (ASVS), versão estável 5.0.0**, V8 Authorization: [requisitos V8](https://github.com/OWASP/ASVS/blob/v5.0.0_release/5.0/en/0x17-V8-Authorization.md) e [release estável](https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release).
- OWASP. **Authorization Cheat Sheet**: [cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- Código consultado para delimitar as superfícies (sem concluir vulnerabilidade): [middleware de autenticação](../educado-api/src/interface/http/middlewares/auth-jwt.ts), [middleware de papel](../educado-api/src/interface/http/middlewares/require-role.ts), [acesso a cursos](../educado-api/src/application/courses/course-access-service.ts), [acesso a mídias](../educado-api/src/application/media/media-access-service.ts), [rotas de atividades](../educado-api/src/routes/activities/activities.ts), [rotas de estudante](../educado-api/src/routes/student/student.ts) e [rotas administrativas](../educado-api/src/routes/admin/registrations.ts).
