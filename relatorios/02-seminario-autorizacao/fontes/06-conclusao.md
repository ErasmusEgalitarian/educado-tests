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
