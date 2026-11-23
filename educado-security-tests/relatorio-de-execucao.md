# Relatório da suíte `educado-security-tests`

## Execução Playwright

Execução informada em 2026-11-22, a partir de `C:\testes\educado-tests\educado-security-tests`, com `npx playwright test`:

| Resultado | Quantidade |
| --- | ---: |
| Testes descobertos | 42 |
| Aprovados | 15 |
| Reprovados | 3 |
| Ignorados (`skip`) | 24 |
| Duração | 5,8 s |

Os 24 testes ignorados não foram aprovados. A saída do terminal não detalha o motivo de cada `skip`; consulte o relatório HTML para isso. AT-12 não tem teste descoberto nesta suíte.

## Falhas observadas

| Caso | Esperado | Observado | Evidência |
| --- | --- | --- | --- |
| AT-10.1 - leitura anônima de atividade não publicada | Negar a leitura e não retornar dados | `200` | `test-results/activities-Autorização-de--bf22e-ssa-atividade-não-publicada/error-context.md` |
| AT-10.2 - listagem anônima de seção não publicada | Negar a leitura e não retornar dados | `200` | `test-results/activities-Autorização-de--fb1d9-ades-de-seção-não-publicada/error-context.md` |
| AT-23 - catálogo público sem gabarito | `200`, sem campos de resposta correta | `200`, com duas ocorrências de `correctAnswer` | `test-results/public-resources-Instituiç-2e202-ico-não-deve-expor-gabarito/error-context.md` |

O responsável pela execução confirmou que as respostas dos casos AT-10 continham dados das atividades; o catálogo também retornou dados de curso e atividades. Não são reproduzidos aqui IDs, textos, respostas ou corpos integrais.

Para alinhar AT-10 à tabela do planejamento, os testes verificam uma resposta de erro 4xx e ausência de dados, sem impor 401/403/404 para esses GETs. O `POST /activities` anônimo continua esperado como 401, conforme AT-10.

A asserção de AT-10 foi alinhada após a rodada de 42 testes; é necessário repetir a suíte para validar a nova asserção. O HTTP 200 e os dados confirmados na execução informada continuam contrariando a regra de não leitura.

Esses resultados apontam exposição de conteúdo não publicado e de gabaritos, conforme as precondições dos testes. A obtenção de respostas corretas pode comprometer avaliações; eventual uso para concluir cursos ou obter certificados é um impacto possível, mas não foi testado nem confirmado nesta execução. A saída não identifica a versão/commit da API nem informa o `API_URL`, portanto registre esses dados junto à próxima execução para completar a rastreabilidade.

Trate os arquivos `trace.zip` como evidência privada: podem conter dados de requisição e resposta. Não os publique sem revisão e saneamento.

## Resultados por AT

| AT | Testes encontrados | Aprovado | Reprovado | Ignorado |
| --- | ---: | ---: | ---: | ---: |
| AT-01 | 2 | 2 | 0 | 0 |
| AT-02 | 2 | 1 | 0 | 1 |
| AT-03 | 2 | 2 | 0 | 0 |
| AT-04 | 2 | 2 | 0 | 0 |
| AT-05 | 1 | 0 | 0 | 1 |
| AT-06 | 1 | 1 | 0 | 0 |
| AT-07 | 1 | 0 | 0 | 1 |
| AT-08 | 1 | 0 | 0 | 1 |
| AT-09 | 2 | 0 | 0 | 2 |
| AT-10 | 3 | 0 | 2 | 1 |
| AT-11 | 3 | 0 | 0 | 3 |
| AT-12 | 0 | 0 | 0 | 0 |
| AT-13 | 1 | 0 | 0 | 1 |
| AT-14 | 1 | 0 | 0 | 1 |
| AT-15 | 1 | 0 | 0 | 1 |
| AT-16 | 1 | 0 | 0 | 1 |
| AT-17 | 2 | 1 | 0 | 1 |
| AT-18 | 3 | 0 | 0 | 3 |
| AT-19 | 5 | 2 | 0 | 3 |
| AT-20 | 2 | 1 | 0 | 1 |
| AT-21 | 2 | 2 | 0 | 0 |
| AT-22 | 2 | 1 | 0 | 1 |
| AT-23 | 2 | 0 | 1 | 1 |
| **Total** | **42** | **15** | **3** | **24** |

`Ignorado` (`skip`) significa que o caso não foi executado, não que foi aprovado.

## Escopo da suíte

A pasta contém testes Playwright para autenticação, autorização de cursos e atividades, mídia, estudantes, instituições, certificados e recursos públicos. Os testes AT-10.1, AT-10.2 e AT-23 desta rodada são leituras; não fazem escrita nos recursos expostos.

Os cenários de escrita exigem `RUN_MUTATION_TESTS=true` e `ALLOW_MUTATIONS=true`, além de fixtures descartáveis e restauração. Mantenha os dois valores `false` por padrão. Execute a suíte somente contra API local em loopback, com banco e dados de teste apropriados; não use produção nem ambiente compartilhado.

## Abrir o relatório e repetir a execução

No PowerShell:

```powershell
cd C:\testes\educado-tests\educado-security-tests
npx playwright show-report
```

Isso abre o relatório HTML da última execução, sem repetir os testes. Para executar a suíte completa:

```powershell
cd C:\testes\educado-tests\educado-security-tests
npx playwright test
```

Artefatos da execução:

- `playwright-report/index.html`
- `test-results/.last-run.json`
- Os `error-context.md` indicados na tabela de falhas
