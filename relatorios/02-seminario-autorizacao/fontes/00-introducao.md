# Introdução

Este relatório apresenta a versão final do seminário de testes de características de qualidade da disciplina FGA0314, Testes de Software. O tema escolhido pela equipe é **testes de autorização e controle de acesso**, aplicado à API REST do projeto Educado, com a interface Web como fonte complementar [@educado-repos].

Autorização é a subcaracterística de segurança que decide se um sujeito já identificado pode executar uma operação sobre um recurso. Falhas nesse controle ocupam a primeira posição do OWASP Top 10:2025 [@owasp-top10-2025], o que justifica tratá-la como objeto de teste próprio, separado da autenticação.

O documento está organizado da seguinte forma: a Seção 2 fundamenta os conceitos de autorização e os modelos de controle de acesso; a Seção 3 apresenta as normas e referências usadas para avaliá-la; a Seção 4 descreve as técnicas de teste; a Seção 5 compara ferramentas de apoio; a Seção 6 define métricas e uma proposta de aplicação ao Educado; a Seção 7 apresenta os resultados observados das métricas; a Seção 8 discute os resultados, as limitações e as recomendações e conclui.

A primeira entrega foi de pesquisa e planejamento, sem execução de testes.
Esta versão acrescenta a execução de uma suíte Playwright sobre os casos AT-01 a AT-23 em 22/11/2026: 42 testes descobertos, 15 aprovados, 3 reprovados e 24 ignorados.
Testes ignorados não são contados como aprovados, e as métricas são calculadas apenas a partir do registro de execução.
Observações sobre o código do projeto que não foram exercitadas continuam tratadas como hipóteses de teste, não como vulnerabilidades confirmadas.
