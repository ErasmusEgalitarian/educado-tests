# Roteiro do seminário

Duração prevista: **10 minutos**. Seis blocos de **1min40**, com dois slides por integrante. As transições fazem parte do tempo de cada bloco. Ensaiar para manter a apresentação entre 8 e 12 minutos.

Texto de apoio gerado a partir de `conteudo.html` e dos integrantes de `../equipe.tex`. Adaptar a fala durante o ensaio, preservando a distinção entre planejamento e resultados.

## 01 · Testes de autorização e controle de acesso

Gustavo Xavier Evangelista · 0:00–0:40 · 40 segundos

O nosso tema é autorização e controle de acesso, aplicado às APIs REST e à interface Web do Educado. A pergunta central é: cada pessoa consegue fazer apenas aquilo que a política permite, sobre os recursos corretos? Vamos apresentar os conceitos, as referências, as técnicas, as ferramentas e o plano de aplicação. Esta entrega é de pesquisa e planejamento. Ainda não executamos os testes no Educado, então os pontos levantados no código são hipóteses a verificar, e não vulnerabilidades confirmadas.

## 02 · Identidade, permissão e contexto

Gustavo Xavier Evangelista · 0:40–1:40 · 60 segundos

Autenticação verifica a identidade. Autorização avalia uma ação concreta: quem solicita, qual recurso quer acessar e qual operação pretende realizar. Um login válido não autoriza ler qualquer registro. No RBAC, as permissões são agrupadas por papel. A propriedade acrescenta a relação entre o usuário e o objeto; dois autores podem ter o mesmo papel e controlar cursos diferentes. No ABAC, atributos do sujeito, do recurso e do contexto também entram na decisão. Quatro princípios orientam esse controle: conceder só o necessário, negar quando não houver permissão explícita, verificar cada acesso e separar responsabilidades incompatíveis. Na Web, a decisão precisa estar no servidor; esconder um botão não impede uma chamada direta à API.

Transição: Hugo apresenta as referências que transformam esses princípios em critérios de avaliação.

## 03 · Cada referência tem uma função

Hugo Freitas Silva · 1:40–2:30 · 50 segundos

Essas referências se complementam. A ISO 25010 organiza objetivos de qualidade; limitar leitura protege confidencialidade, e limitar alterações protege integridade. O Top 10 da OWASP contextualiza o risco: controle de acesso aparece em A01 na edição de 2025 usada pelo relatório. Isso não demonstra uma falha no Educado. Para testar, precisamos de requisitos mais concretos, fornecidos pelo ASVS, e de procedimentos, descritos no WSTG. Depois de reproduzir um desvio, o CWE ajuda a classificar sua causa, como ausência de autorização, verificação incorreta ou acesso por troca de chave. A proposta é ligar o objetivo de qualidade ao requisito, ao procedimento e à evidência.

## 04 · Função, objeto e campo

Hugo Freitas Silva · 2:30–3:20 · 50 segundos

A avaliação deve cobrir três níveis. No nível da função, perguntamos se um usuário comum pode executar uma ação administrativa. No nível do objeto, verificamos se ele pode acessar aquele curso ou certificado específico. No nível do campo, controlamos quais atributos podem ser lidos ou alterados, como o gabarito ou o papel de uma conta. No ASVS 5, essas dimensões aparecem em 8.2.1, 8.2.2 e 8.2.3. O API Security Top 10 de 2023 também distingue esses riscos. Antes de executar os casos, a política precisa estar documentada: ela funciona como oráculo do teste. Selecionar esses requisitos não equivale a verificar um nível inteiro do ASVS.

Transição: Bernardo mostra como transformar a política em casos de teste.

## 05 · Uma matriz define o que permitir e negar

Bernardo Watanabe Venzi · 3:20–4:10 · 50 segundos

O ponto de partida é uma matriz de sujeito, recurso, operação e resultado esperado. Neste recorte do plano, U1 e U2 são autores com cursos diferentes. U1 deve conseguir alterar seu próprio curso, mas não o de U2, nem usar uma função administrativa. O administrador deve conseguir executar as funções previstas para seu papel, e o anônimo não deve receber um perfil privado. Os casos permitidos são controles positivos: se a aplicação negar tudo, os testes negativos podem passar, mas o produto continua incorreto. Cada caso precisa registrar as precondições, a identidade, o recurso, a requisição e a evidência. Essa matriz ainda depende de validação da política do produto.

## 06 · Variar a requisição e conferir o efeito

Bernardo Watanabe Venzi · 4:10–5:00 · 50 segundos

Com a matriz definida, variamos a requisição. Retirar o token testa acesso anônimo; usar outra identidade testa isolamento horizontal; repetir uma ação administrativa com menor privilégio testa escalonamento vertical. Também trocamos identificadores, métodos HTTP e campos sensíveis. O ponto principal é verificar três coisas: o status, o corpo da resposta e o estado persistido. Uma resposta 403 não é suficiente se o registro foi alterado antes do erro. Pelo contrato proposto, 401 indica ausência de autenticação válida e 403 indica falta de permissão. Um 404 pode ocultar um objeto alheio, mas só se essa política for intencional e consistente. Os testes futuros usarão dados descartáveis em ambiente controlado.

Transição: Vítor apresenta as ferramentas para executar e repetir esses cenários.

## 07 · Playwright e ZAP na estratégia proposta

Vítor da Costa Rossi de Oliveira · 5:00–5:50 · 50 segundos

A recomendação do relatório combina Playwright e ZAP. No Playwright, o APIRequestContext permite fazer chamadas HTTP em contextos separados, com as credenciais de cada identidade. Assim podemos repetir a mesma operação como U1, U2 e administrador, comparando a resposta com a matriz. A ferramenta também cobre a interface, mas os cenários precisam ser escritos e mantidos. O ZAP complementa essa abordagem explorando a aplicação e usando o add-on Access Control Testing para confrontar o acesso de usuários com regras declaradas. Ele exige configuração de autenticação, contexto e exploração adequada das rotas. Alertas precisam ser verificados. Nenhuma dessas ferramentas foi executada no Educado nesta entrega.

## 08 · O papel das demais alternativas

Vítor da Costa Rossi de Oliveira · 5:50–6:40 · 50 segundos

O relatório compara mais três opções. O Vitest é útil para guards, renderização por perfil e mensagens no frontend. Esses testes são rápidos, mas usam simulações e não comprovam que a API está protegida. O Schemathesis gera testes a partir de contratos de API e pode ampliar a variedade de entradas. Para autorização, ainda precisa de credenciais, relações entre contas e verificações específicas. Já Burp Community com Autorize apoia a exploração manual, repetindo requisições com menos privilégio. A comparação de respostas é uma pista e precisa ser interpretada. Por isso, Playwright e ZAP ficam como combinação principal, com os demais em papéis complementares. Nenhuma ferramenta consegue inferir sozinha toda a política de negócio.

Transição: Matheus apresenta a aplicação planejada ao Educado e os critérios para medir os testes.

## 09 · 23 casos planejados para a API

Matheus Pinheiro · 6:40–7:30 · 50 segundos

O catálogo contém 23 casos planejados. Os dados de teste separam dois autores, um administrador e dois estudantes, além das chamadas anônimas. Aqui destacamos quatro casos. No AT-07, U1 tenta modificar ou excluir o curso de U2; a negativa precisa preservar o curso. No AT-12, o estudante envia campos extras para assumir outra identidade ou elevar o papel. No AT-18, existe uma permissão pública importante: qualquer pessoa deve conseguir transmitir mídia ativa e publicada, enquanto mídia inativa ou não publicada deve ser negada. No AT-23, o catálogo público deve retornar dados públicos sem expor o gabarito antes da submissão. São expectativas do plano a validar, não resultados observados em execução.

## 10 · Critérios de sucesso propostos

Matheus Pinheiro · 7:30–8:20 · 50 segundos

As métricas só terão valores depois da execução. A primeira meta é cobrir cem por cento das regras aplicáveis inventariadas, com pelo menos um caso positivo e um negativo para cada regra. O denominador precisa ser explícito: cobrir o que foi inventariado não garante segurança absoluta. A segunda meta é zero bypass confirmado, ou seja, nenhuma operação ou leitura obtida sem autorização. A terceira é zero por cento de falsos positivos, para que os controles legítimos não sejam bloqueados indevidamente. O plano também mede funções, objetos, campos, integridade após negativas e associação aos requisitos ASVS. Falhas só recebem severidade depois de reproduzidas e analisadas; não classificamos uma hipótese como achado confirmado.

Transição: Lucas fecha com as pendências da política e os próximos passos.

## 11 · O que ainda precisa ser confirmado

Lucas Gabriel da Silva Antunes · 8:20–9:10 · 50 segundos

O relatório tem limites importantes. Algumas regras ainda precisam ser acordadas com a equipe do produto: se a listagem e a criação de certificados devem ser públicas, quais dados de estudantes o administrador pode acessar e quando usar 404 para ocultar um objeto. Também há pontos sobre revogação de permissões e isolamento entre instituições. Na leitura do código, surgiram hipóteses sobre a autorização das atividades, a presença de correctAnswer no catálogo e os campos da verificação pública de certificado. Isso justifica testes, mas não prova vulnerabilidade. Uma verificação pode existir em outra camada, ou a divulgação pode ser uma decisão do produto. Precisamos comparar execução, contrato aprovado e efeitos persistidos antes de concluir.

## 12 · Próxima etapa: executar o plano

Lucas Gabriel da Silva Antunes · 9:10–10:00 · 50 segundos

A próxima etapa começa validando a política com o produto e fechando as pendências. Depois, preparamos um ambiente local ou de homologação autorizado, com banco, mídia e contas de teste isolados. Executamos os casos positivos e negativos, registrando requisições e respostas sanitizadas e comparando o estado antes e depois. Só então calculamos as métricas, confirmamos desvios e priorizamos correções. O resultado desta entrega é um plano rastreável: política, requisito, caso, evidência e métrica. A conclusão é que autorização pode ser testada de forma sistemática quando sabemos quem pode fazer o quê sobre cada recurso, e quando conferimos que a decisão foi realmente aplicada no servidor. Obrigado.
