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


# Métricas e proposta de aplicação

## Objetivo e fronteira

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

## Política e matriz de autorização

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

## Contrato esperado de respostas HTTP

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

## Catálogo de casos planejados

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

## Métricas e critérios de sucesso

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

## Rastreabilidade ao OWASP ASVS

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

## Observações estáticas e pendências

A leitura dos middlewares e serviços descreve pontos de verificação, sem provar seu resultado via HTTP.
O registro de decisões separa fontes do produto, código e propostas da equipe.

- O stream da versão exige token e distingue papéis; a proposta pública original permanece pendente P07.
- O CRUD de atividades precisa ser verificado no contexto de montagem das rotas e política; não concluir vulnerabilidade apenas por ausência local de middleware.
- A projeção de catálogo e a verificação pública de certificado motivam comparação dos campos com allowlists ainda a aprovar.
- O PATCH administrativo alterna papel; persistência e validade das sessões são verificações diferentes.
- O inventário das entidades consultadas não mostrou vínculo institucional de User/Course; isso não permite declarar isolamento demonstrado ou requisito não aplicável.

As decisões P06–P11 exigem fonte, pessoa/data de validação e atualização do catálogo.
O restante do planejamento pode ser revisado enquanto esses pontos são esclarecidos.

## Pré-requisitos e limites

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


# Resultados observados das métricas

Os valores abaixo vêm do catálogo de #25 e do registro de #27.
Nenhum percentual é inferido de planejamento, hipótese ou teste ignorado.

## Fontes e regra de contagem

| Fonte | Uso |
|---|---|
| `planejamento/casos-autorizacao.csv` | Inventário de 149 subcasos, regras, ASVS e estado de definição |
| `metricas/registro-execucao.csv` | Associação entre 42 testes da suíte e subcasos; situação e evidência |
| `educado-security-tests/relatorio-de-execucao.md` | Contagens por AT, falhas observadas e limitações |
| `metricas/calcular.py` | Cálculo reproduzível; gera este arquivo e `metricas/metricas-obsv.json` |

Cada execução de teste registrada conta uma tentativa; AT-04.2 e AT-19.1 são repetições distintas do mesmo par.
A cobertura de funções usa pares método–endpoint únicos, com `{...}` normalizado para `{}`.
Aplicam-se apenas subcasos `definido` aos denominadores de regras, funções, objetos e campos;
os 32 subcasos `bloqueado` e os testes `ignorado` não contam como aprovados nem como cobertura exercitada.
Denominador zero é informado como não mensurável, sem converter ausência de verificação em sucesso.

## Inventários e volume executado

| Item | Inventário aplicável | Executado |
|---|---|---|
| Subcasos | 117 definidos de 149 planejados | 17 |
| Regras | 7 aplicáveis; 6 pendentes | 3 |
| Pares método–endpoint | 42 | 14 |
| Combinações de objeto | 19 | 6 |
| Campos sensíveis | correctAnswer, ownerId, role, userId | nenhum |

Regras aplicáveis: P01, P02, P03, P04, P05, P12, P13.
Pendentes sem oráculo aprovado: P06, P07, P08, P09, P10, P11.
Testes descobertos: 42; aprovados: 15;
reprovados: 3; ignorados: 24.
AT-12 não teve teste descoberto; 132 dos 149 subcasos planejados não receberam execução registrada, inclusive os 32 bloqueados.

## Meta proposta × valor observado

| Métrica | Meta | Numerador | Denominador | Observado | Interpretação |
|---|---|---|---|---|---|
| cobertura_regras | 100% | 3 | 7 | 42,9% | Regras com controle positivo aprovado e tentativa negativa executada; todas as execuções são parciais. |
| cobertura_regras_validada | 100% | 0 | 7 | 0,0% | Contagem rigorosa com verificação de dados e efeitos nos dois lados. |
| cobertura_funcoes | 100% | 14 | 42 | 33,3% | Pares método–endpoint únicos efetivamente exercitados; repetições não aumentam o numerador. |
| cobertura_objetos | 100% | 6 | 19 | 31,6% | Combinações família de endpoint × próprio/alheio/inexistente efetivamente exercitadas. |
| cobertura_campos | 100% | 0 | 4 | 0,0% | Campos sensíveis com leitura ou escrita permitida e negada executadas. |
| negacoes_bloqueadas | 100% | 0 | 14 | 0,0% | Sem verificação de dado/efeito nas aprovações parciais; 0 não significa negação incorreta. |
| bypasses | 0 | 3 | — | 3 | Três acessos indevidos confirmados no registro de execução; nenhuma escrita indevida foi executada. |
| falsos_positivos | 0% | 0 | 4 | 0,0% | Controles legítimos executados e aprovados com verificação parcial de dados. |
| integridade_pos_negacao | 100% | 0 | 0 | não mensurável | Nenhuma negação executada registrou estado antes/depois; denominador zero não vira 100%. |
| rastreabilidade_planejada | 100% | 8 | 8 | 100,0% | Todos os requisitos selecionados têm rastreio documental; 8.1.1 e 8.1.2 são documentais. |
| rastreabilidade_executada | informativa | 4 | 8 | 50,0% | Requisitos com ao menos uma requisição executada e evidência referenciada. |
| severidade | zero críticas/altas abertas | 3 | — | 3 | Falhas confirmadas no registro de execução; ausência de teste não conta como ausência de falha. |

Das 14 tentativas negativas executadas,
11 tiveram status de negação esperado, mas nenhuma verificou dado ou efeito.
Os 4 controles legítimos executados falharam em nenhum caso.
As três falhas são desvios válidos para contagem de falhas, não ausência comprovada em casos não executados.

## Falhas confirmadas e severidade

| Teste | Subcasos | Severidade | Evidência | Desvio |
|---|---|---|---|---|
| AT-10.1 | AT-10-N1 | alta | `test-results/activities-Autorização-de--bf22e-ssa-atividade-não-publicada/error-context.md` | HTTP 200 com dados de atividade nao publicada conforme relatorio de execucao |
| AT-10.2 | AT-10-N2 | alta | `test-results/activities-Autorização-de--fb1d9-ades-de-seção-não-publicada/error-context.md` | HTTP 200 com dados de secao nao publicada conforme relatorio de execucao |
| AT-23 | AT-23-C1 | alta | `test-results/public-resources-Instituiç-2e202-ico-não-deve-expor-gabarito/error-context.md` | HTTP 200 com correctAnswer no catalogo publico conforme relatorio de execucao |

Severidade agregada: alta: 3.
A classificação usa o impacto descrito no registro de #27; nenhuma falha é atribuída a teste não executado.

## Matriz ASVS: planejamento → execução → evidência

| Requisito | Subcasos planejados | Executados | Aprovados | Reprovados | Ignorados | Evidência | Interpretação |
|---|---|---|---|---|---|---|---|
| 8.1.1 | documental | 0 | 0 | 0 | 0 | `relatorios/02-seminario-autorizacao/fontes/05-metricas-educado.md#6-rastreabilidade-ao-owasp-asvs` | Regra documentada; não há requisição HTTP que prove atendimento. |
| 8.1.2 | documental | 0 | 0 | 0 | 0 | `relatorios/02-seminario-autorizacao/fontes/05-metricas-educado.md#6-rastreabilidade-ao-owasp-asvs` | Campos sensíveis inventariados; escrita/leitura negada não executada. |
| 8.2.1 | 74 | 13 | 11 | 2 | 15 | `educado-security-tests/relatorio-de-execucao.md`, `test-results/activities-Autorização-de--bf22e-ssa-atividade-não-publicada/error-context.md`, `test-results/activities-Autorização-de--fb1d9-ades-de-seção-não-publicada/error-context.md` | Execução parcial por papel; parte depende de P06/P07. |
| 8.2.2 | 108 | 6 | 4 | 2 | 16 | `educado-security-tests/relatorio-de-execucao.md`, `test-results/activities-Autorização-de--bf22e-ssa-atividade-não-publicada/error-context.md`, `test-results/activities-Autorização-de--fb1d9-ades-de-seção-não-publicada/error-context.md` | Execução parcial; duas leituras não publicadas falharam. |
| 8.2.3 | 20 | 2 | 1 | 1 | 3 | `educado-security-tests/relatorio-de-execucao.md`, `test-results/public-resources-Instituiç-2e202-ico-não-deve-expor-gabarito/error-context.md` | Exposição de gabarito observada; demais campos não testados. |
| 8.3.1 | 113 | 14 | 12 | 2 | 18 | `educado-security-tests/relatorio-de-execucao.md`, `test-results/activities-Autorização-de--bf22e-ssa-atividade-não-publicada/error-context.md`, `test-results/activities-Autorização-de--fb1d9-ades-de-seção-não-publicada/error-context.md` | Chamadas diretas à API; respostas parciais não provam allowlist. |
| 8.3.2 | 4 | 0 | 0 | 0 | 0 | sem execução | Subcasos de sessão bloqueados por P09. |
| 8.4.1 | 1 | 0 | 0 | 0 | 0 | sem execução | Subcaso institucional bloqueado por P11; CRUD por papel não substitui tenant. |

Rastreabilidade planejada: 8/8 requisitos selecionados têm rastreio documental; 6/8 têm subcasos no catálogo e 2 são documentais (8.1.1 e 8.1.2).
Rastreabilidade executada: 4/8 (50,0%), requisitos 8.2.1, 8.2.2, 8.2.3, 8.3.1.
A seleção parcial não verifica nível ASVS nem permite afirmar conformidade integral.

## Alcance efetivo de revogação e isolamento

AT-20 executou apenas a consulta administrativa e a criação/leitura de curso.
O PATCH de papel, a persistência USER/ADMIN e o comportamento do token anterior e da nova sessão não foram executados;
8.3.2 permanece sem validação executada.
AT-19 executou restrições por papel em instituições; a fronteira entre I1 e I2 depende de P11 e não foi especificada.
8.4.1 permanece sem validação executada; nenhum requisito recebeu cobertura apenas por ser citado.

## Limitações

- O relatório de #27 não informa commit da API, BASE_URL, timestamp por teste nem duração por requisição.
- Os arquivos playwright-report e test-results não estão versionados; três falhas têm apenas o caminho do error-context no registro.
- Nenhum teste executado verificou estado antes/depois; integridade after denial permanece não mensurável.
- A asserção de AT-10 foi alterada após a rodada de 42 testes; repetir a suíte é necessário para validar a nova forma.
- P06–P11 permanecem sem decisão aprovada; casos bloqueados não entram em denominadores de regras aplicáveis.
- A revisão por colega dos cálculos ainda não foi registrada; a PR deve solicitar essa conferência.

## Fontes consultadas nesta seção

- [OWASP ASVS 5.0.0, V8](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md).
- Registros locais listados na tabela de fontes; nenhum segredo ou token é reproduzido.


# Discussão, limitações e conclusão

## Síntese da execução

A rodada de #27 foi executada em 22/11/2026 com Playwright, a partir de `educado-security-tests`, com o ambiente e as fixtures sintéticas preparados em #26.
Foram descobertos 42 testes: 15 aprovados, 3 reprovados e 24 ignorados, em 5,8 s; AT-12 não teve teste descoberto.
Esses testes exercitaram 17 dos 149 subcasos planejados; os 132 restantes, inclusive os 32 bloqueados por políticas pendentes, não têm execução registrada.
Os valores desta seção vêm de `05-resultados-metricas.md`, gerado por `metricas/calcular.py` a partir de `metricas/registro-execucao.csv` e `educado-security-tests/relatorio-de-execucao.md`.

## Discussão dos resultados

### Observado × metas

Nenhuma meta de cobertura proposta na Seção 6 foi atingida.
A cobertura de regras ficou em 3/7 (42,9%), a de funções em 14/42 pares método–endpoint (33,3%), a de objetos em 6/19 combinações (31,6%) e a de campos sensíveis em 0/4.
A meta de zero bypasses também não foi atingida: três leituras indevidas foram observadas, todas classificadas como alta severidade.
A rastreabilidade ASVS planejada chegou a 8/8, mas a executada ficou em 4/8 (8.2.1, 8.2.2, 8.2.3 e 8.3.1); 8.3.2 e 8.4.1 não receberam validação executada.

Esses números medem o alcance desta rodada, não o nível de segurança do Educado.
A baixa cobertura decorre principalmente de testes ignorados por dependência de tokens de estudante, de opt-ins de mutação desativados e de políticas P06–P11 sem decisão aprovada, conforme a coluna `observacao` do registro.

### Controles negativos e positivos

Das 14 tentativas negativas executadas, 11 receberam o status de negação esperado: requisições sem token ou com token malformado foram recusadas com 401 (AT-01, AT-03) e USER foi negado em `/admin/users` e `/institutions` com 403 (AT-04, AT-19.1).
Nenhuma dessas negações verificou ausência de dados no corpo nem estado antes/depois; por isso, `negacoes_bloqueadas` foi registrada como 0/14 e `integridade_pos_negacao` como não mensurável.
Isso não indica que as negações falharam, mas impede afirmar que bloquearam dado ou efeito.

AT-06 e AT-17.1 aceitam 403 ou 404 sem comprovar a existência da fixture alheia.
Logo, não distinguem negação por propriedade de recurso inexistente e não servem como evidência de proteção contra acesso direto a objeto alheio.

Os 4 controles legítimos executados (AT-19-P1, AT-20.1, AT-21 e AT-21.2) foram permitidos, sem falso positivo observado.
A verificação foi parcial: status e formato da resposta, sem conferência de proprietário, paginação ou conteúdo.

### Falhas observadas

As três reprovações são leituras sem autorização, sem escrita indevida executada:

- AT-10.1 e AT-10.2: acesso anônimo retornou HTTP 200 com dados de atividade e de seção não publicadas.
- AT-23: o catálogo público retornou HTTP 200 com duas ocorrências de `correctAnswer`.

O comportamento observado contraria a regra de não leitura do catálogo de casos e a proposta original de ocultar o gabarito antes da submissão.
As decisões formais sobre atividades (P06) e campos públicos (P10) continuam pendentes; a classificação como falha usa a política proposta pela equipe, não uma política aprovada pelos mantenedores.
A asserção de AT-10 foi alinhada depois da rodada, então a suíte precisa ser repetida para confirmar o resultado com a nova forma.
A exposição do gabarito pode comprometer avaliações; o uso dessas respostas para concluir cursos ou obter certificados é um impacto possível, mas não foi testado.

### Hipóteses de teste

As observações estáticas da Seção 6 foram tratadas como hipóteses; o quadro abaixo separa o que a execução permite afirmar.

| Hipótese ou expectativa | Situação | Base |
|---|---|---|
| Rotas protegidas recusam requisição sem token ou com token malformado | Confirmada parcialmente (status) | AT-01, AT-02.2, AT-03 |
| USER não acessa funções administrativas | Confirmada parcialmente (status) | AT-04, AT-19.1 |
| Conteúdo não publicado não é legível anonimamente | Contrariada pela execução | AT-10.1, AT-10.2 |
| O catálogo público não expõe `correctAnswer` | Contrariada pela execução | AT-23 |
| Objetos de outro criador ficam inacessíveis | Não avaliada: resposta 403/404 sem fixture comprovada | AT-06, AT-17.1 |
| Ausência local de middleware no CRUD de atividades indica falha | Não avaliada: testes de mutação ignorados | AT-09, AT-11 |
| Mudança de papel tem efeito imediato na sessão | Não avaliada: bloqueada por P09 | AT-20 |
| Instituições isolam dados entre si | Não avaliada: bloqueada por P11 | AT-19 |
| Estudantes só acessam matrícula, progresso e certificado próprios | Não avaliada: sem token de estudante | AT-13 a AT-16 |

Nenhuma hipótese foi refutada nesta rodada: os casos que poderiam refutá-las foram ignorados ou não comprovaram suas precondições.

## Limitações

- **Versão e ambiente:** a saída de #27 não informa commit da API, `API_URL`, timestamp por teste nem duração por requisição. Os commits de `escopo-e-decisoes.md` identificam a leitura estática, não a versão executada.
- **Evidências:** `playwright-report` e `test-results` não estão versionados; as três falhas têm apenas o caminho do `error-context`. Os `trace.zip` são tratados como evidência privada.
- **Dados:** foram usadas contas e fixtures sintéticas de #26; o comportamento com dados reais ou em produção não foi avaliado.
- **Asserções parciais:** as aprovações verificam status, sem conferir dados e efeitos; nenhuma negação registrou estado antes/depois.
- **Políticas:** P06–P11 seguem sem validação aprovada; 32 subcasos bloqueados ficam fora dos denominadores aplicáveis.
- **Escopo:** o recorte cobre AT-01 a AT-23 sobre a API REST; não cobre todas as rotas nem a interface Web. OWASP ZAP e Vitest, previstos na Seção 5, não foram usados nesta rodada.
- **Conformidade:** a seleção parcial de requisitos V8 não verifica nível ASVS nem permite afirmar conformidade.
- **Revisão:** a conferência dos cálculos por colega ainda precisa ser registrada no PR correspondente.

## Recomendações

Recomendações são propostas da equipe; nenhuma descreve comportamento já existente no Educado.

| Prioridade | Recomendação | Evidência | Depende de |
|---|---|---|---|
| Alta | Remover `correctAnswer` e demais campos de gabarito da resposta do catálogo público, usando lista explícita de campos permitidos | AT-23 | Decisão P10 e implementação na `educado-api` |
| Alta | Exigir publicação ou autoria antes de retornar atividades e seções, inclusive em rotas de leitura | AT-10.1, AT-10.2 | Decisão P06 e implementação na `educado-api` |
| Alta | Comunicar as três falhas pelo canal privado do projeto, com evidências saneadas | AT-10, AT-23 | Equipe |
| Alta | Repetir a suíte com a asserção revista de AT-10, registrando commit da API, `API_URL` e horário | `relatorio-de-execucao.md` | Ambiente de #26 |
| Média | Verificar ausência de dados e estado antes/depois em toda negação | Métricas `negacoes_bloqueadas` e `integridade_pos_negacao` | Ajuste da suíte |
| Média | Provisionar tokens de estudante e habilitar mutações em banco descartável para executar AT-05, AT-09, AT-11, AT-13 a AT-16 e AT-19.3 | 24 testes ignorados | Fixtures de #26 |
| Média | Decidir P06–P11 e implementar o teste de AT-12 | 32 subcasos bloqueados; AT-12 sem teste | Mantenedores e equipe |
| Baixa | Complementar com varredura OWASP ZAP e testes Vitest na interface | Seção 5 | Execuções futuras |

## Conclusão

O objetivo do seminário era testar sistematicamente a autorização da API do Educado a partir de uma matriz de sujeito, recurso, operação e resultado esperado.
A equipe transformou o planejamento em catálogo verificável, ambiente reproduzível, suíte automatizada e métricas calculadas a partir do registro de execução.
As referências estudadas se complementaram: o OWASP Top 10 indicou a relevância do risco, o ASVS forneceu requisitos verificáveis, o WSTG orientou os procedimentos e o CWE serviu para classificar as falhas [@owasp-top10-2025; @rel02-asvs-5].

A primeira rodada encontrou três leituras indevidas de alta severidade, que expõem conteúdo não publicado e gabaritos de atividades.
Os controles de autenticação e de papel administrativo responderam como esperado nos casos executados, mas com verificação limitada ao status.
A cobertura obtida, entre 31,6% e 42,9% nas métricas de regras, funções e objetos, ficou abaixo das metas e não permite concluir que a autorização do Educado esteja correta nos casos não executados.

O principal resultado é ter tornado visível o que foi verificado, o que falhou e o que permanece sem verificação, sem converter teste ignorado em aprovação.
A continuidade depende de corrigir AT-10 e AT-23, decidir P06–P11, repetir a suíte com metadados de execução e ampliar as asserções de dados e efeitos antes de qualquer afirmação mais ampla de cobertura.


