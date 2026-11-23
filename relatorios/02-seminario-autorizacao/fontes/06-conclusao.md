# Limitações e conclusão

## Limitações

A execução de #27 registrou 42 testes Playwright: 15 aprovados, 3 reprovados e 24 ignorados; AT-12 não teve teste descoberto. Os 24 testes ignorados não contam como aprovação nem como cobertura executada. A cobertura ficou em 3/7 regras aplicáveis, 14/42 pares método–endpoint, 6/19 combinações de objeto e 4/8 requisitos ASVS selecionados; os detalhes e as evidências estão em `05-resultados-metricas.md`.

A saída não informa commit da API, `BASE_URL`, timestamp por teste nem duração por requisição, e os arquivos `playwright-report` e `test-results` não estão versionados. As três falhas confirmadas — AT-10.1, AT-10.2 e AT-23 — são leituras indevidas; nenhuma escrita não autorizada foi executada. Nenhuma negação verificou estado antes/depois, então integridade após negação e ausência de dados/efeitos em respostas aprovadas permanecem não mensuráveis, e não devem ser lidas como sucesso.

As decisões P06–P11 continuam sem validação aprovada, e a asserção de AT-10 foi alinhada após a rodada informada. Os resultados não provam conformidade com nível ASVS, não substituem revisão por pares e não autorizam concluir que casos não executados estejam corretos. Execuções futuras devem ocorrer apenas em ambiente local ou de homologação autorizado, com dados descartáveis e registro de versões.

## Conclusão

Autorização pode ser testada de forma sistemática quando a política é explicitada como uma matriz de sujeito, recurso, operação e resultado esperado. As referências estudadas se complementam: o OWASP Top 10 indica a relevância do risco, o ASVS fornece requisitos verificáveis, o WSTG descreve procedimentos de teste e o CWE classifica as fraquezas encontradas [@owasp-top10-2025]. A suíte de #27 confirmou três desvios de alto impacto e mostrou lacunas amplas de execução; o valor está em ligar cada resultado a regra, subcaso e evidência, sem transformar ausência de verificação em aprovação.

A combinação de Playwright para cenários repetíveis entre perfis, OWASP ZAP para varredura de rotas e Vitest como complemento no frontend permanece adequada [@rel02-asvs-5]. A próxima etapa é resolver P06–P11, repetir a suíte com a asserção revista de AT-10, versionar metadados de execução e evidências saneadas, verificar estado antes/depois nas negações e submeter os cálculos a revisão por colega antes de ampliar qualquer afirmação de cobertura.
