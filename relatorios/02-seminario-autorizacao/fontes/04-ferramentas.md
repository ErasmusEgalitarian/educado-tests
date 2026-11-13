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
