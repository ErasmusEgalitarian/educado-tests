# Introdução

Este relatório apresenta a primeira entrega do seminário de testes de características de qualidade da disciplina FGA0314, Testes de Software. O tema escolhido pela equipe é **testes de autorização e controle de acesso**, aplicado às APIs REST e à interface Web do projeto Educado [@educado-repos].

Autorização é a subcaracterística de segurança que decide se um sujeito já identificado pode executar uma operação sobre um recurso. Falhas nesse controle ocupam a primeira posição do OWASP Top 10:2025 [@owasp-top10-2025], o que justifica tratá-la como objeto de teste próprio, separado da autenticação.

O documento está organizado da seguinte forma: a Seção 2 fundamenta os conceitos de autorização e os modelos de controle de acesso; a Seção 3 apresenta as normas e referências usadas para avaliá-la; a Seção 4 descreve as técnicas de teste; a Seção 5 compara ferramentas de apoio; a Seção 6 define métricas e uma proposta de aplicação ao Educado; a Seção 7 discute limitações e conclui.

Esta entrega é de pesquisa e planejamento. Nenhum teste foi executado no Educado e nenhum resultado experimental é apresentado. Observações sobre o código do projeto são tratadas como hipóteses de teste, não como vulnerabilidades confirmadas.


# Fundamentação de autorização

## O que é autorização?

Autorização é o processo de decidir se uma solicitação deve ser permitida ou negada de acordo com uma política de acesso. Ela responde a perguntas como “este usuário pode consultar este prontuário?” ou “este serviço pode excluir este registro?”. O conceito não se confunde com **identificação**, que associa uma entidade a um identificador, nem com **autenticação**, que verifica se quem apresenta esse identificador consegue demonstrar que é seu titular. Assim, informar um nome de usuário identifica, apresentar uma credencial válida autentica e avaliar o que a identidade autenticada pode fazer autoriza. A autenticação pode fornecer dados confiáveis para a decisão, mas não concede, por si só, acesso a todos os recursos [@nist-sp800-162].

Uma decisão de acesso relaciona cinco elementos. O **sujeito** é a entidade que solicita o acesso, como uma pessoa, processo ou serviço. O **recurso** é o objeto protegido, por exemplo uma página, arquivo, registro, campo ou função administrativa. A **operação** expressa a ação pretendida, como ler, criar, alterar, aprovar ou excluir. A **política** estabelece as condições sob as quais essa combinação é permitida. Por fim, a **decisão de acesso** é o resultado da avaliação — normalmente permitir ou negar — que deve ser efetivamente aplicado pelo mecanismo de controle. Logo, autorizar não significa apenas reconhecer um perfil geral: significa avaliar um sujeito, uma operação e um recurso concretos no contexto da política aplicável [@nist-sp800-162].

## Princípios de proteção

Quatro princípios orientam um projeto de autorização seguro. O **menor privilégio** determina que cada sujeito receba somente as permissões necessárias para executar sua tarefa e apenas pelo tempo necessário. Isso reduz tanto a superfície disponível a um invasor quanto o dano causado por erro ou comprometimento de uma conta. A **negação por padrão** exige que uma solicitação seja recusada quando nenhuma regra a autorizar explicitamente; uma funcionalidade nova ou uma combinação imprevista de condições não deve se tornar pública por omissão [@saltzer-schroeder-1975; @owasp-authorization].

A **mediação completa** requer que toda tentativa de acesso seja verificada, e não apenas a primeira ação de uma sessão. Uma tela escondida, uma resposta anterior em cache ou a aprovação de acesso a um recurso do mesmo tipo não substituem a verificação do objeto e da operação atuais. Em aplicações Web, isso implica validar a autorização no lado confiável do servidor em cada requisição, inclusive nas APIs, sem depender de botões ocultos ou de verificações em JavaScript [@saltzer-schroeder-1975; @owasp-authorization].

A **separação de responsabilidades** evita concentrar poderes incompatíveis em uma única pessoa ou função. Uma operação sensível pode exigir condições independentes ou participação de sujeitos distintos; por exemplo, quem cadastra um pagamento não deveria também aprová-lo. Essa separação reduz fraude e abuso e pode ser expressa como restrições de papéis ou como etapas diferentes de um fluxo. Ela complementa o menor privilégio: além de limitar a quantidade de permissões, limita combinações perigosas delas [@saltzer-schroeder-1975; @ferraiolo-kuhn-1992].

## Modelos de controle de acesso

No **controle de acesso baseado em papéis** (*Role-Based Access Control*, RBAC), permissões são associadas a papéis que representam funções organizacionais, como estudante, professor ou administrador, e os sujeitos recebem um ou mais desses papéis. O modelo simplifica a administração e favorece menor privilégio e separação de responsabilidades, mas papéis excessivamente amplos podem continuar concedendo acesso indevido [@ferraiolo-kuhn-1992].

O **controle por propriedade** acrescenta uma relação entre sujeito e recurso. Estar autenticado e poder usar a função “editar” não basta: a aplicação confirma se o registro pertence ao solicitante ou está sob sua responsabilidade. Por exemplo, um estudante pode alterar a própria entrega, mas não a de outro estudante apenas trocando um identificador na URL. A propriedade deve ser verificada no servidor e pode coexistir com RBAC — um professor, por exemplo, pode acessar entregas somente das turmas pelas quais é responsável [@owasp-top10-2025].

No **controle de acesso baseado em atributos** (*Attribute-Based Access Control*, ABAC), a política avalia atributos do sujeito, do recurso, da operação e, quando necessário, do ambiente. Uma regra pode permitir a leitura quando o sujeito pertence ao mesmo departamento do documento, possui credencial ativa e realiza a solicitação durante determinado período. O ABAC representa condições mais contextuais e granulares que papéis isolados, embora exija atributos confiáveis e políticas cuidadosamente administradas [@nist-sp800-162].

## Por que é importante em aplicações Web?

Aplicações Web expõem recursos e operações por rotas, formulários e APIs acessíveis a clientes que não são confiáveis. O navegador mostra somente a interface prevista, mas um solicitante pode alterar URLs, identificadores, métodos HTTP e corpos de requisição. Por isso, autenticar a sessão ou esconder controles visuais não protege os objetos subjacentes. A autorização precisa acompanhar cada ponto de entrada e aplicar as mesmas regras de negócio a páginas, APIs e recursos estáticos. A OWASP mantém falhas de controle de acesso na primeira posição de seu levantamento de riscos para aplicações Web, o que evidencia a relevância prática do problema [@owasp-top10-2025].

## Quais problemas podem ocorrer?

Uma falha pode causar **exposição indevida**, quando alguém lê dados pessoais, documentos ou informações de outra conta; **alteração indevida**, quando modifica registros que não controla; ou **exclusão indevida**, quando destrói dados por uma operação que deveria estar restrita. Esses impactos comprometem, respectivamente, confidencialidade, integridade e disponibilidade, além de poderem gerar consequências legais e operacionais.

Também pode ocorrer **escalonamento horizontal de privilégios**, no qual um usuário acessa recursos de outro usuário de nível semelhante, ou **escalonamento vertical**, no qual obtém capacidades superiores, como as de moderador ou administrador. No caso mais grave, a falha permite executar operações administrativas: criar contas privilegiadas, alterar políticas, aprovar transações, exportar bases ou remover conteúdos. Referências diretas inseguras a objetos, endpoints sem verificação e confiança em controles do cliente são caminhos comuns para esses resultados [@owasp-authorization; @owasp-top10-2025]. Portanto, a autorização é a barreira que transforma identidade autenticada em acesso limitado, justificável e coerente com as responsabilidades de cada sujeito.


# Normas e referências para avaliação de autorização

## Qualidade do produto e conscientização

A ISO/IEC 25010:2023, segunda edição, integra a família SQuaRE e define um modelo de qualidade de produto com nove características, subdivididas em subcaracterísticas.
O modelo orienta a especificação de requisitos, os objetivos de teste e os critérios de aceitação durante o ciclo de vida [@rel02-iso25010-2023].
Para este seminário, a autorização é examinada no âmbito da segurança: restringir a leitura protege a confidencialidade, enquanto restringir alterações e exclusões protege a integridade.
Essa relação orienta a avaliação, mas precisa ser traduzida em regras concretas sobre sujeitos, recursos e operações; a norma não constitui, por si só, um roteiro de testes de endpoints.

O OWASP Top 10:2025 é uma referência de **conscientização** sobre riscos de aplicações Web [@rel02-top10-2025].
A categoria **A01 — Broken Access Control** reúne situações em que usuários ultrapassam suas permissões, como acessar registros alheios, alcançar funções administrativas ou contornar verificações manipulando requisições.
Suas recomendações incluem negação por padrão, verificação em código confiável no servidor e controle da propriedade dos registros [@rel02-top10-a01-2025].
A categoria ajuda a justificar prioridades, mas sua posição no ranking não demonstra que o Educado tenha essas vulnerabilidades.
Também não fornece cobertura suficiente para declarar uma aplicação segura: **ASVS e WSTG oferecem requisitos e procedimentos mais diretamente testáveis**.

## Requisitos selecionados do ASVS

O OWASP Application Security Verification Standard **5.0.0**, capítulo **V8 — Authorization**, permite especificar o comportamento esperado.
Selecionam-se os requisitos abaixo; o prefixo da versão evita ambiguidades entre edições [@rel02-asvs-5].

| Requisito | Nível | Verificação selecionada |
| --- | --- | --- |
| `v5.0.0-8.1.1` | 1 | Documentar regras de acesso a funções e dados, considerando permissões e atributos dos recursos. |
| `v5.0.0-8.1.2` | 2 | Documentar restrições de leitura e escrita por campo. |
| `v5.0.0-8.2.1` | 1 | Restringir funções a sujeitos com permissão explícita. |
| `v5.0.0-8.2.2` | 1 | Restringir cada objeto aos sujeitos autorizados. |
| `v5.0.0-8.2.3` | 2 | Restringir campos específicos conforme as permissões. |
| `v5.0.0-8.3.1` | 1 | Aplicar as regras em camada confiável, sem depender do cliente. |

Os itens de documentação permitem definir o oráculo dos testes: uma matriz de sujeitos, operações, objetos e campos com decisões esperadas.
Os demais orientam verificações positivas e negativas contra essa matriz.
A seleção combina requisitos dos níveis 1 e 2; não equivale à verificação integral de qualquer nível do ASVS.

## Procedimentos do WSTG

O OWASP Web Security Testing Guide **4.2**, seção 4.5, descreve quatro procedimentos de autorização.
Neste mapeamento, os identificadores incluem a versão `v42` para preservar a rastreabilidade.

- **WSTG-v42-ATHZ-01 — Directory Traversal/File Include:** investigar parâmetros que referenciam arquivos e tentativas de acesso fora dos limites permitidos; aplica-se quando existirem funcionalidades de arquivos ou inclusão [@rel02-wstg42-athz01].
- **WSTG-v42-ATHZ-02 — Bypassing Authorization Schema:** repetir requisições sem autenticação, após logout e com outras identidades ou papéis, procurando desvios horizontais e verticais; relaciona-se aos requisitos `8.2.1`, `8.2.2` e `8.3.1` [@rel02-wstg42-athz02].
- **WSTG-v42-ATHZ-03 — Privilege Escalation:** manipular parâmetros de grupo ou perfil e verificar obtenção de capacidades indevidas; relaciona-se a `8.2.1` e, quando a alteração envolve campos protegidos, a `8.2.3` [@rel02-wstg42-athz03].
- **WSTG-v42-ATHZ-04 — Insecure Direct Object References:** substituir referências de objetos usando contas com permissões conhecidas e verificar acesso indevido; operacionaliza especialmente `8.2.2` [@rel02-wstg42-athz04].

Essas relações são uma proposta de organização do seminário, não uma equivalência oficial ou exaustiva entre os documentos.
No planejamento, cada caso deve registrar precondições, identidade, recurso, operação e resultado esperado.
A avaliação deve considerar os dados retornados e os efeitos persistidos, além do código HTTP: uma mensagem de erro não basta se a operação proibida ocorrer.

## APIs e classificação das fraquezas

O **OWASP API Security Top 10:2023** detalha três dimensões complementares.
**API1 — Broken Object Level Authorization** trata da permissão sobre o objeto solicitado: poder chamar uma função não autoriza consultar qualquer registro [@rel02-api1-2023].
**API3 — Broken Object Property Level Authorization** trata das propriedades desse objeto, tanto na exposição de campos quanto na alteração indevida; corresponde ao foco de `8.2.3` [@rel02-api3-2023].
**API5 — Broken Function Level Authorization** trata do acesso à própria função, como executar uma operação administrativa com um perfil comum; corresponde ao foco de `8.2.1` [@rel02-api5-2023].
Assim, testar somente a troca de identificadores deixa descobertas as permissões sobre campos e funções.

Como vocabulário de classificação, adota-se o catálogo **CWE 5.0**, preservado em arquivo versionado [@rel02-cwe5].
**CWE-862** identifica ausência de verificação de autorização; **CWE-863**, uma verificação existente, porém incorreta; **CWE-639**, acesso a dados de outro usuário pela alteração de uma chave controlável pelo solicitante [@rel02-cwe862; @rel02-cwe863; @rel02-cwe639].
O último se relaciona a cenários de API1 e ATHZ-04, sem tornar BOLA, IDOR e CWE-639 sinônimos universais.
A classificação deve acompanhar a causa demonstrada, evitando atribuir automaticamente todas as categorias a um mesmo caso.

## Comparação e uso conjunto

A tabela sintetiza o papel das referências apresentadas.

| Referência e versão | Objetivo | Escopo | Uso na avaliação |
| --- | --- | --- | --- |
| ISO/IEC 25010:2023 | Organizar a qualidade | Produtos de software e TIC | Definir objetivos e critérios de qualidade. |
| OWASP Top 10:2025 | Conscientizar sobre riscos | Aplicações Web; A01 | Justificar prioridade para autorização. |
| ASVS 5.0.0, V8 | Especificar requisitos verificáveis | Documentação e controles de autorização | Definir resultados esperados e cobertura. |
| WSTG 4.2, seção 4.5 | Orientar procedimentos | Testes de segurança Web | Estruturar tentativas de contorno. |
| API Security Top 10:2023 | Evidenciar riscos de APIs | Objetos, propriedades e funções | Diversificar cenários de autorização. |
| CWE 5.0: 862, 863 e 639 | Classificar fraquezas | Causas e mecanismos de falha | Padronizar a descrição de eventuais achados. |

Para a futura aplicação ao Educado, propõe-se encadear objetivo de qualidade, risco, requisito, procedimento e classificação.
A política real do projeto deverá determinar quais combinações são permitidas e quais casos se aplicam.
Esta entrega estabelece referências para esse planejamento, sem executar testes nem afirmar resultados experimentais.


# Técnicas de teste de autorização e controle de acesso

## Modelo de teste e matriz de decisão

O teste começa por uma matriz com **sujeito**, **recurso**, **operação** e **resultado esperado**.
Por exemplo, para um estudante (`S1`), um professor (`S2`) e um administrador (`S3`):

| Sujeito | Recurso | Operação | Resultado esperado |
|---|---|---|---|
| Anônimo | Perfil de estudante | Ler | Negar (401 ou redirecionamento para login) |
| `S1` | Sua própria entrega | Ler/alterar | Permitir |
| `S1` | Entrega de outro estudante | Ler/alterar | Negar (403 ou resposta indistinguível) |
| `S2` | Entrega de estudante de sua turma | Ler/avaliar | Permitir |
| `S2` | Função de administração | Excluir usuário | Negar |
| `S3` | Usuário e política | Administrar | Permitir, com controles adicionais para operações críticas |

A matriz diferencia permissão funcional de propriedade.
O caso registra precondições, usuário, token ou sessão, recurso, requisição, resultado esperado e evidência (status, corpo, efeito persistido e logs).
Um `403` isolado não basta: é necessário verificar que o dado não foi retornado nem alterado.
Toda execução deve usar dados descartáveis em ambiente local ou de homologação [@owasp-wstg; @owasp-authorization].

## Acesso anônimo e navegação forçada

**Objetivo:** confirmar que recursos protegidos exigem autenticação e autorização no servidor.
**Procedimento:** sem cookies, tokens ou cabeçalhos de autenticação, acessar diretamente páginas, APIs e arquivos previsíveis; depois repetir com conta autenticada, mas sem o papel necessário.
Testar a rota mesmo quando o menu não a apresenta.
**Falha detectada:** conteúdo privado entregue a anônimos, endpoint que aceita uma sessão insuficiente ou confiança no redirecionamento e no controle visual do cliente.
**Vantagem:** é simples, barato e encontra rotas esquecidas.
**Limitação:** não cobre relações entre objetos ou regras condicionais.

O frontend pode esconder um botão, mas o usuário consegue construir a requisição fora do navegador.
A decisão confiável é a aplicada pelo servidor em cada requisição [@owasp-authorization].

## Escalonamento horizontal, BOLA/IDOR e adulteração de identificadores

**Objetivo:** verificar se um usuário com a mesma função acessa apenas os próprios objetos.
**Procedimento:** criar dois usuários do mesmo nível, obter um recurso de cada um e substituir, em URL, query, corpo ou caminho, o identificador pelo do outro.
Repetir para leitura, atualização e exclusão, usando IDs sequenciais e UUIDs.
**Falha detectada:** BOLA/IDOR, quando o servidor aceita a referência ao objeto sem conferir a relação entre sujeito e recurso.
**Vantagem:** reproduz falha de alto impacto com alteração pequena e observável.
**Limitação:** exige dados de usuários distintos e pode não revelar autorização contextual.

Testar também IDs em exportações e anexos; identificador difícil não é autorização.
O resultado para o objeto alheio é uma negativa consistente, sem vazamento de existência, metadados ou efeitos [@owasp-api1; @owasp-top10-2025].

## Escalonamento vertical e fluxos administrativos

**Objetivo:** impedir que um usuário comum execute operações reservadas a papéis superiores.
**Procedimento:** comparar as matrizes de estudante, professor e administrador; repetir requisições administrativas com o token de menor privilégio; tentar acessar rotas de gestão, alterar papéis e excluir contas.
Para cada negativa, verificar que não houve mudança no banco ou em fila.
**Falha detectada:** escalonamento vertical, endpoint administrativo sem verificação de papel, papel amplo demais ou separação de responsabilidades ausente.
**Vantagem:** testa o impacto mais severo.
**Limitação:** aprovações múltiplas e expiração exigem cenários longos.

Testar a alteração do próprio papel e a criação de outro administrador, além da operação final.
Alterar o papel enviado ou guardado no cliente (campo `role`, `localStorage` ou token não assinado) e confirmar que o servidor o ignora.
Ações críticas podem exigir reautenticação ou segunda autoridade [@owasp-authorization].

## Método HTTP e autorização por campo

**Objetivo:** verificar que a autorização permanece correta quando a forma da requisição muda.
**Procedimento:** para recurso somente de leitura, trocar `GET` por `POST`, `PUT`, `PATCH` ou `DELETE`; testar `X-HTTP-Method-Override` e variantes de rota.
Adicionar ao JSON campos como `role`, `ownerId`, `approved` ou `status` e tentar alterá-los com operação permitida.
**Falha detectada:** autorização aplicada a uma rota ou método, mas não a outro, e *mass assignment* que permite ao cliente controlar atributos reservados.
**Vantagem:** encontra inconsistências entre controladores e mapeamentos.
**Limitação:** requer conhecer o contrato.

O resultado esperado é validar cada combinação de operação e campo no servidor, aceitando apenas atributos permitidos para aquele sujeito.
Não se deve confundir filtragem visual do formulário com uma lista de campos autorizados [@owasp-api3].

## Testes manuais, automatizados e orientados por OpenAPI

Testes manuais exploram fluxos novos, interpretam regras de negócio e confirmam evidências.
Testes automatizados repetem a matriz para usuários e identificadores, detectam regressões e comparam status, corpo e efeitos.
Testes orientados por OpenAPI geram casos de rotas, métodos, parâmetros e esquemas documentados.
Sua limitação é estrutural: um contrato incompleto não descreve autorização, propriedade ou transições de negócio, e a geração não substitui cenários com contas relacionadas [@openapi-spec].

Uma estratégia equilibrada automatiza casos de alto risco, usa a especificação como inventário e reserva exploração manual para regras contextuais.
Cada falha deve preservar requisição e resposta sanitizadas, usuário de teste e estado inicial, sem expor segredos.
Ferramentas devem ficar em ambientes locais ou de homologação, com autorização explícita e taxa controlada.
O objetivo é demonstrar a decisão de acesso e seu impacto, não contornar controles em sistemas de terceiros.


# Ferramentas para testes de autorização

Testar autorização exige observar a aplicação como cliente externo, por requisições em uma suíte ou pelo comportamento da interface. Este texto compara cinco alternativas — OWASP ZAP com Access Control Testing, Playwright com `APIRequestContext`, Vitest, Schemathesis e Burp Suite Community com Autorize — quanto a funcionamento, licença, automação, CI, múltiplos usuários, vantagens e limitações, priorizando opções open source alinhadas ao Educado [@educado-repos].

## OWASP ZAP e o add-on Access Control Testing

O OWASP ZAP é um proxy DAST sob Apache 2.0 [@zap]. O add-on Access Control Testing define usuários e autenticação, cadastra regras por contexto e tenta acessar cada URL como cada usuário, sinalizando violações [@zap-access-control]. A automação usa Automation Framework, API, CLI e Docker; o CI é viável com GitHub Action [@zap]. Múltiplos usuários são nativos. As vantagens são cobertura ampla e detecção automatizada. As limitações incluem configuração de contexto, dependência de exploração prévia em SPAs e falsos positivos ou negativos [@zap-access-control].

## Playwright com APIRequestContext

O Playwright é uma biblioteca de automação de navegadores e testes de API sob Apache 2.0 [@playwright]. O `APIRequestContext` dispara HTTP sem abrir página, em contextos isolados com cookies e cabeçalhos próprios [@playwright-api-request], permitindo comparar perfis: um estudante recebe `403` ao alterar recurso alheio; um professor autorizado recebe `200`. A automação ocorre por CLI, com CI por ações oficiais [@playwright]. Múltiplos usuários decorrem de contextos isolados e do estado de autenticação. As vantagens são API e interface na mesma ferramenta e controle por requisição. As limitações são a ausência de descoberta automática e a manutenção manual.

## Vitest para guards e comportamentos do frontend

O Vitest é um executor de testes unitários e de componentes sobre Vite, sob licença MIT [@vitest]. Roda em jsdom e simula funções, módulos e requisições, sendo adequado para guards de rota, renderização por perfil e mensagens de negação [@vitest]. A automação ocorre por `npm test` ou `vitest run`, e o CI executa o script. Múltiplos usuários são simulados por mocks. As vantagens são velocidade, integração com o `educado-web` e baixo custo de regressão. As limitações são decisivas: não prova autorização no servidor, mocks podem divergir da API e a ferramenta não substitui um teste de segurança.

## Schemathesis para operações descritas por OpenAPI

O Schemathesis gera testes baseados em propriedades a partir de OpenAPI, GraphQL ou gRPC, sob licença MIT [@schemathesis]. Ele produz entradas válidas e inválidas, verifica erros de servidor e violações de contrato e, com verificações personalizadas, compara respostas entre credenciais para detectar autorização quebrada em nível de objeto [@schemathesis]. A automação ocorre por CLI ou `pytest`, com CI por ação oficial [@schemathesis]. Múltiplos usuários dependem de autenticação configurada e de verificações próprias. As vantagens são geração automática e achados reproduzíveis. As limitações são a exigência de especificação completa, verificações manuais e efeitos colaterais nos dados.

## Burp Suite Community e Autorize

O Burp Suite Community é proprietário e gratuito, voltado ao teste manual, sem o scanner da versão Professional [@burp-community]. O Autorize é uma extensão open source que repete requisições com baixo privilégio ou sem autenticação e compara respostas, apoiando a detecção de IDOR [@autorize]. A automação limita-se à interceptação, sem CI oficial, mas há suporte a vários perfis. Vantagens: uso exploratório; limitações: heurísticas, ajuste manual e ausência de pipeline.

## Comparação

| Ferramenta | Licença | Automação/CI | Múltiplos usuários | Limitação |
|---|---|---|---|---|
| ZAP + Access Control Testing | Apache 2.0 | CLI, API, Docker e GitHub Action | Sim, nativo | Configuração e falsos positivos |
| Playwright + APIRequestContext | Apache 2.0 | CLI e ações de CI | Sim, contextos isolados | Não descobre falhas |
| Vitest | MIT | `vitest run` no pipeline | Simulado por mocks | Não valida o servidor |
| Schemathesis | MIT | CLI, `pytest` e ação de CI | Configurável | Depende da especificação |
| Burp Community + Autorize | Proprietária e open source | Manual; sem CI oficial | Sim, vários perfis | Heurístico |

## Recomendação

A estratégia principal combina Playwright e OWASP ZAP. O Playwright cobre cenários conhecidos e repetíveis, comparando respostas entre perfis na API e na interface [@playwright-api-request]. O ZAP percorre a aplicação e confronta o acesso de cada usuário com as regras declaradas, encontrando rotas esquecidas [@zap-access-control]. O Vitest complementa o frontend com guards e mensagens de negação, sem provar a segurança do backend [@vitest]. Schemathesis é útil quando houver OpenAPI confiável [@schemathesis], e Burp/Autorize fica como alternativa manual não prioritária [@autorize]. Nenhuma ferramenta foi instalada ou executada.


# Métricas e Proposta de aplicação

## Objetivo e fronteira

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

## Política inicial e matriz de autorização

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

## Contrato esperado de respostas HTTP

| Situação | Resposta esperada | Critério de interpretação |
|---|---|---|
| Endpoint protegido sem token, com token inválido/expirado ou identidade inválida | **401 Unauthorized** | Não autenticado. Não revelar dados nem executar a operação. |
| Token válido, mas papel sem permissão para a função | **403 Forbidden** | Autenticado, porém sem autorização para a função (por exemplo, `USER` chamando função exclusiva de `ADMIN`). |
| Token válido, mas objeto pertence a outro ator | **403** por padrão. | O contrato deve ser documentado por endpoint. Se 404 for escolhido para ocultação, objeto alheio e inexistente devem ser indistinguíveis na resposta relevante. |
| Recurso realmente inexistente | **404 Not Found** | Não confundir ausência do objeto com autorização bem-sucedida. |
| Recurso alheio deliberadamente ocultado | **404 Not Found**  | Aceitável somente se for política intencional e consistente, sem conteúdo ou efeito colateral. |

Para todo resultado negado, conferir também o **estado antes/depois**: nenhum perfil, papel, curso, atividade, mídia, matrícula, progresso ou certificado pode ter sido alterado. Um código 403/404 isolado não prova que a operação foi bloqueada.

## Catálogo de casos de teste futuros

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

## Métricas e critérios de sucesso

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

## Rastreabilidade ao OWASP ASVS

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

## Hipóteses do código a confirmar (não são vulnerabilidades confirmadas)

Na leitura estática usada para definir os cenários, foram observados pontos que justificam testes, mas não provam falha em execução:

- Há verificações de papel no middleware e nas funções administrativas; há também checagens de propriedade em serviços de curso e de mídia. Os testes devem verificar as rotas e os efeitos completos, não apenas a existência desses helpers.
- As rotas REST de atividades consultadas não mostram middleware de autorização no próprio arquivo. AT-09 a AT-11 validarão a política esperada de dono do curso/admin e confirmarão como os endpoints se comportam via API.
- A projeção de atividades no detalhe público do catálogo inclui o atributo `correctAnswer`, e a verificação pública do certificado retorna `userName`, curso, total de seções, data e carga horária. Isso motiva AT-22/AT-23 para confirmar a política de divulgação campo a campo; não é uma conclusão de vulnerabilidade.
- O stream de mídia tem lógica própria de token e trata estudantes diferentemente de leitores de metadados. AT-18 verificará que qualquer pessoa consegue transmitir mídia ativa e publicada, independentemente de autenticação ou matrícula, e que mídia inativa/não publicada não é transmitida.
- O mapeamento atual distingue `USER`, `ADMIN` e `STUDENT`. Para esta proposta, `USER` significa autor de conteúdo e estudantes A/B são contas diferentes com papel `STUDENT`.

Qualquer desvio deve ser reproduzido, comparado ao contrato aprovado, confirmado quanto à ausência/presença de efeito e registrado como resultado somente depois da execução autorizada.

## Pré-requisitos, limites e segurança operacional

- Executar **somente em ambiente local ou homologação com autorização explícita**; nunca contra produção, usuários reais ou serviços de terceiros.
- Usar banco e armazenamento de mídia isolados, contas sintéticas e IDs gerados para teste. Não reutilizar tokens, segredos ou dados pessoais reais.
- Preparar backups e limpeza dos dados de teste, além de registrar os estados iniciais para provar que tentativas negadas não alteraram dados.
- Manter alcance limitado aos endpoints e cenários acordados. Não realizar força bruta, varredura indiscriminada ou tentativas contra infraestrutura externa.
- Confirmar previamente a ocultação de objetos com 404, administração de matrículas/progresso/certificados, escopo de acesso de ADMIN e isolamento por instituição.
- Este plano não implementa nem executa os testes e não apresenta resultados experimentais.

## Fontes consultadas nesta seção

- OWASP. **Application Security Verification Standard (ASVS), versão estável 5.0.0**, V8 Authorization: [requisitos V8](https://github.com/OWASP/ASVS/blob/v5.0.0_release/5.0/en/0x17-V8-Authorization.md) e [release estável](https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release).
- OWASP. **Authorization Cheat Sheet**: [cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- Código consultado para delimitar as superfícies (sem concluir vulnerabilidade): [middleware de autenticação](../educado-api/src/interface/http/middlewares/auth-jwt.ts), [middleware de papel](../educado-api/src/interface/http/middlewares/require-role.ts), [acesso a cursos](../educado-api/src/application/courses/course-access-service.ts), [acesso a mídias](../educado-api/src/application/media/media-access-service.ts), [rotas de atividades](../educado-api/src/routes/activities/activities.ts), [rotas de estudante](../educado-api/src/routes/student/student.ts) e [rotas administrativas](../educado-api/src/routes/admin/registrations.ts).


# Limitações e conclusão

## Limitações

O trabalho se limita à pesquisa e ao planejamento. As técnicas, ferramentas e métricas descritas não foram aplicadas ao Educado nesta entrega, então nenhuma afirmação deste documento deve ser lida como resultado de teste. A matriz de autorização proposta parte da leitura do código e da documentação do projeto e precisa ser validada contra o comportamento real da `educado-api`, que é onde a decisão de acesso efetivamente acontece. A execução futura deve ocorrer apenas em ambiente local ou de homologação autorizado, com dados descartáveis.

## Conclusão

Autorização pode ser testada de forma sistemática quando a política é explicitada como uma matriz de sujeito, recurso, operação e resultado esperado. As referências estudadas se complementam: o OWASP Top 10 indica a relevância do risco, o ASVS fornece requisitos verificáveis, o WSTG descreve procedimentos de teste e o CWE classifica as fraquezas encontradas [@owasp-top10-2025]. Para o Educado, a equipe propõe combinar Playwright, para cenários conhecidos e repetíveis entre perfis, com o OWASP ZAP, para a varredura de rotas, usando Vitest apenas como complemento no frontend. A próxima etapa do seminário é executar o plano em ambiente controlado e medir os resultados com as métricas definidas.


