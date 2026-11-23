# Resultados observados das métricas

Os valores abaixo vêm do catálogo de #25 e do registro de #27.
Nenhum percentual é inferido de planejamento, hipótese ou teste ignorado.

## 1. Fontes e regra de contagem

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

## 2. Inventários e volume executado

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

## 3. Meta proposta × valor observado

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

## 4. Falhas confirmadas e severidade

| Teste | Subcasos | Severidade | Evidência | Desvio |
|---|---|---|---|---|
| AT-10.1 | AT-10-N1 | alta | `test-results/activities-Autorização-de--bf22e-ssa-atividade-não-publicada/error-context.md` | HTTP 200 com dados de atividade nao publicada conforme relatorio de execucao |
| AT-10.2 | AT-10-N2 | alta | `test-results/activities-Autorização-de--fb1d9-ades-de-seção-não-publicada/error-context.md` | HTTP 200 com dados de secao nao publicada conforme relatorio de execucao |
| AT-23 | AT-23-C1 | alta | `test-results/public-resources-Instituiç-2e202-ico-não-deve-expor-gabarito/error-context.md` | HTTP 200 com correctAnswer no catalogo publico conforme relatorio de execucao |

Severidade agregada: alta: 3.
A classificação usa o impacto descrito no registro de #27; nenhuma falha é atribuída a teste não executado.

## 5. Matriz ASVS: planejamento → execução → evidência

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

## 6. Alcance efetivo de revogação e isolamento

AT-20 executou apenas a consulta administrativa e a criação/leitura de curso.
O PATCH de papel, a persistência USER/ADMIN e o comportamento do token anterior e da nova sessão não foram executados;
8.3.2 permanece sem validação executada.
AT-19 executou restrições por papel em instituições; a fronteira entre I1 e I2 depende de P11 e não foi especificada.
8.4.1 permanece sem validação executada; nenhum requisito recebeu cobertura apenas por ser citado.

## 7. Limitações

- O relatório de #27 não informa commit da API, BASE_URL, timestamp por teste nem duração por requisição.
- Os arquivos playwright-report e test-results não estão versionados; três falhas têm apenas o caminho do error-context no registro.
- Nenhum teste executado verificou estado antes/depois; integridade after denial permanece não mensurável.
- A asserção de AT-10 foi alterada após a rodada de 42 testes; repetir a suíte é necessário para validar a nova forma.
- P06–P11 permanecem sem decisão aprovada; casos bloqueados não entram em denominadores de regras aplicáveis.
- A revisão por colega dos cálculos ainda não foi registrada; a PR deve solicitar essa conferência.

## Fontes consultadas nesta seção

- [OWASP ASVS 5.0.0, V8](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md).
- Registros locais listados na tabela de fontes; nenhum segredo ou token é reproduzido.
