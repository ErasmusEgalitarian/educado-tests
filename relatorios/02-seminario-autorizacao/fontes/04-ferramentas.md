# Ferramentas para testes de autorização

Testar autorização exige observar a aplicação de pontos diferentes: como cliente externo, por requisições em uma suíte ou pelo comportamento da interface. Este texto compara cinco alternativas — OWASP ZAP com Access Control Testing, Playwright com `APIRequestContext`, Vitest, Schemathesis e Burp Suite Community com Autorize — quanto a funcionamento, licença, automação, integração contínua, múltiplos usuários, vantagens e limitações. Priorizam-se alternativas open source alinhadas ao Educado, cujo frontend usa Vitest e cuja API é REST [@educado-repos].

## OWASP ZAP e o add-on Access Control Testing

O OWASP ZAP é um proxy de teste dinâmico de segurança Web sob Apache 2.0 [@zap]. O add-on Access Control Testing define usuários e autenticação, cadastra regras de acesso por contexto e tenta acessar cada URL como cada usuário, sinalizando violações [@zap-access-control]. A automação usa Automation Framework, API, CLI e Docker; a integração contínua é viável com GitHub Action ou contêiner [@zap]. O suporte a múltiplos usuários é nativo. As vantagens são cobertura ampla, sessões autenticadas e detecção automatizada de falhas. As limitações incluem configuração de contexto e regras, dependência de exploração prévia — problemática em SPAs — e falsos positivos ou negativos [@zap-access-control].

## Playwright com APIRequestContext

O Playwright é uma biblioteca de automação de navegadores e de testes de API sob Apache 2.0 [@playwright]. O `APIRequestContext` dispara requisições HTTP sem abrir página, em contextos isolados com cookies e cabeçalhos próprios [@playwright-api-request], o que permite autenticar perfis e comparar respostas: um estudante recebe `403` ao alterar recurso alheio, enquanto um professor autorizado recebe `200`. A automação ocorre por linha de comando, e a integração contínua é suportada por ações oficiais, paralelização e relatórios [@playwright]. Múltiplos usuários decorrem de contextos isolados e do reaproveitamento de estado de autenticação. As vantagens são combinar API e interface na mesma ferramenta, cenários legíveis e controle por requisição. As limitações são a ausência de descoberta automática, a manutenção manual e a cobertura restrita às regras conhecidas.

## Vitest para guards e comportamentos do frontend

O Vitest é um executor de testes unitários e de componentes sobre Vite, sob licença MIT [@vitest]. Ele roda em jsdom ou happy-dom e simula funções, módulos, timers e requisições, sendo adequado para guards de rota, renderização por perfil e mensagens de negação [@vitest]. A automação ocorre por `npm test` ou `vitest run`, com cobertura opcional, e a integração contínua executa o script no pipeline. Múltiplos usuários são simulados por mocks, não por sessões reais. As vantagens são velocidade, integração com o `educado-web` e baixo custo de regressão. As limitações são decisivas: não prova autorização no servidor, mocks podem divergir da API e a ferramenta não substitui um teste de segurança.

## Schemathesis para operações descritas por OpenAPI

O Schemathesis gera testes baseados em propriedades a partir de OpenAPI, GraphQL ou gRPC, sob licença MIT [@schemathesis]. Ele produz entradas válidas e inválidas, verifica erros de servidor e violações de contrato e, com verificações personalizadas, compara respostas entre credenciais para detectar autorização quebrada em nível de objeto [@schemathesis]. A automação ocorre por CLI ou `pytest`, com integração contínua por ação oficial e relatórios [@schemathesis]. Múltiplos usuários dependem de autenticação configurada e de verificações próprias. As vantagens são geração automática, cobertura de entradas de borda e achados reproduzíveis. As limitações são a exigência de especificação completa, verificações de negócio manuais e efeitos colaterais nos dados.

## Burp Suite Community e Autorize

O Burp Suite Community é proprietário e gratuito, voltado ao teste manual, com proxy, Repeater e Comparer, mas sem o scanner da versão Professional [@burp-community]. O Autorize é uma extensão open source em Jython que monitora o tráfego de um usuário privilegiado, repete requisições com baixo privilégio ou sem autenticação e compara respostas [@autorize]. A automação limita-se à interceptação; não há integração contínua oficial. O suporte a vários perfis de baixo privilégio é um ponto forte. As vantagens são a detecção prática de IDOR e de separação inadequada de papéis. As limitações são heurísticas com falsos positivos, ajuste manual, ausência de pipeline e hospedeira proprietária.

## Comparação

| Ferramenta | Licença | Abordagem | Automação e CI | Múltiplos usuários | Principal limitação |
|---|---|---|---|---|---|
| OWASP ZAP + Access Control Testing | Apache 2.0 | DAST com regras de acesso por contexto | CLI, API, Docker e GitHub Action | Sim, nativo | Exige configuração; falsos positivos |
| Playwright + APIRequestContext | Apache 2.0 | Requisições HTTP e automação de navegador | CLI, paralelização e ações de CI | Sim, por contextos isolados | Não descobre falhas; casos manuais |
| Vitest | MIT | Testes unitários e de componente | `vitest run` no pipeline | Simulado por mocks | Não valida autorização no servidor |
| Schemathesis | MIT | Propriedades a partir de OpenAPI | CLI, `pytest` e ação de CI | Configurável por credenciais | Depende de especificação e de checks |
| Burp Community + Autorize | Proprietária e código aberto | Interceptação e repetição de requisições | Manual; sem CI oficial | Sim, vários perfis | Heurístico e pouco automatizável |

## Recomendação

A estratégia principal combina Playwright e OWASP ZAP. O Playwright cobre cenários conhecidos e repetíveis, comparando respostas entre perfis na API e na interface [@playwright-api-request]. O ZAP complementa percorrendo a aplicação e confrontando o acesso de cada usuário com as regras declaradas, encontrando rotas esquecidas [@zap-access-control]. O Vitest complementa o frontend com guards, visibilidade e mensagens de negação, sem provar a segurança do backend [@vitest]. Schemathesis é valioso quando houver uma especificação OpenAPI confiável [@schemathesis]. Burp/Autorize fica como alternativa não prioritária para investigação manual [@autorize]. Nesta entrega, as ferramentas foram apenas comparadas; nenhuma foi instalada ou executada.
