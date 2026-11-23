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
