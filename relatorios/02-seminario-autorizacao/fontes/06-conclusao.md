# Limitações e conclusão

## Limitações

O trabalho se limita à pesquisa e ao planejamento. As técnicas, ferramentas e métricas descritas não foram aplicadas ao Educado nesta entrega, então nenhuma afirmação deste documento deve ser lida como resultado de teste. A matriz de autorização proposta parte da leitura do código e da documentação do projeto e precisa ser validada contra o comportamento real da `educado-api`, que é onde a decisão de acesso efetivamente acontece. A execução futura deve ocorrer apenas em ambiente local ou de homologação autorizado, com dados descartáveis.

## Conclusão

Autorização pode ser testada de forma sistemática quando a política é explicitada como uma matriz de sujeito, recurso, operação e resultado esperado. As referências estudadas se complementam: o OWASP Top 10 indica a relevância do risco, o ASVS fornece requisitos verificáveis, o WSTG descreve procedimentos de teste e o CWE classifica as fraquezas encontradas [@owasp-top10-2025]. Para o Educado, a equipe propõe combinar Playwright, para cenários conhecidos e repetíveis entre perfis, com o OWASP ZAP, para a varredura de rotas, usando Vitest apenas como complemento no frontend. A próxima etapa do seminário é executar o plano em ambiente controlado e medir os resultados com as métricas definidas.
