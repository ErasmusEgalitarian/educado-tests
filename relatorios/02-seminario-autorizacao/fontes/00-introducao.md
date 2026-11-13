# Introdução

Este relatório apresenta a primeira entrega do seminário de testes de características de qualidade da disciplina FGA0314, Testes de Software. O tema escolhido pela equipe é **testes de autorização e controle de acesso**, aplicado às APIs REST e à interface Web do projeto Educado [@educado-repos].

Autorização é a subcaracterística de segurança que decide se um sujeito já identificado pode executar uma operação sobre um recurso. Falhas nesse controle ocupam a primeira posição do OWASP Top 10:2025 [@owasp-top10-2025], o que justifica tratá-la como objeto de teste próprio, separado da autenticação.

O documento está organizado da seguinte forma: a Seção 2 fundamenta os conceitos de autorização e os modelos de controle de acesso; a Seção 3 apresenta as normas e referências usadas para avaliá-la; a Seção 4 descreve as técnicas de teste; a Seção 5 compara ferramentas de apoio; a Seção 6 define métricas e uma proposta de aplicação ao Educado; a Seção 7 discute limitações e conclui.

Esta entrega é de pesquisa e planejamento. Nenhum teste foi executado no Educado e nenhum resultado experimental é apresentado. Observações sobre o código do projeto são tratadas como hipóteses de teste, não como vulnerabilidades confirmadas.
