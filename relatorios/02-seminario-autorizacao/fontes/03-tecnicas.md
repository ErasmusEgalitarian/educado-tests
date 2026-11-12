# Técnicas de teste de autorização e controle de acesso

## Modelo de teste e matriz de decisão

O teste deve começar por uma matriz que relacione **sujeito**, **recurso**, **operação** e **resultado esperado**.
Por exemplo, para um estudante (`S1`), um professor (`S2`) e um administrador (`S3`):

| Sujeito | Recurso | Operação | Resultado esperado |
|---|---|---|---|
| Anônimo | Perfil de estudante | Ler | Negar (401 ou redirecionamento para login) |
| `S1` | Sua própria entrega | Ler/alterar | Permitir |
| `S1` | Entrega de outro estudante | Ler/alterar | Negar (403 ou resposta indistinguível) |
| `S2` | Entrega de estudante de sua turma | Ler/avaliar | Permitir |
| `S2` | Função de administração | Excluir usuário | Negar |
| `S3` | Usuário e política | Administrar | Permitir, com controles adicionais para operações críticas |

A matriz torna explícita a diferença entre uma permissão funcional e uma relação de propriedade.
O caso de teste deve registrar precondições, usuário, token ou sessão, recurso, requisição, resultado esperado e evidência (status, corpo, efeito persistido e logs).
`403` exige verificar que o dado não foi retornado nem alterado.
Toda execução deve usar dados descartáveis em ambiente local ou de homologação [@owasp-wstg; @owasp-authorization].

## Acesso anônimo e navegação forçada

**Objetivo:** confirmar que recursos protegidos exigem autenticação e autorização no servidor.
**Procedimento:** sem cookies, tokens ou cabeçalhos de autenticação, acessar diretamente páginas, APIs e arquivos previsíveis; depois repetir com conta autenticada, mas sem o papel necessário.
Testar a rota mesmo quando o menu não a apresenta.
**Falha detectada:** conteúdo privado entregue a anônimos, endpoint que aceita uma sessão insuficiente ou confiança no redirecionamento e no controle visual do cliente.
**Vantagem:** é simples, barato e encontra rotas esquecidas.
**Limitação:** não cobre relações entre objetos ou regras condicionais.

O frontend pode esconder um botão, mas o usuário consegue construir a requisição fora do navegador.
A decisão confiável é a aplicada pelo servidor em cada requisição [@owasp-authorization].

## Escalonamento horizontal, BOLA/IDOR e adulteração de identificadores

**Objetivo:** verificar se um usuário com a mesma função acessa apenas os próprios objetos.
**Procedimento:** criar dois usuários do mesmo nível, obter um recurso de cada um e substituir, em URL, query, corpo ou caminho, o identificador pelo do outro.
Repetir para leitura, atualização e exclusão, usando IDs sequenciais e UUIDs.
**Falha detectada:** BOLA/IDOR, quando o servidor aceita a referência ao objeto sem conferir a relação entre sujeito e recurso.
**Vantagem:** reproduz falha de alto impacto com alteração pequena e observável.
**Limitação:** exige dados de usuários distintos e pode não revelar autorização contextual.

Testar IDs em exportações e anexos; identificador difícil não autoriza.
O resultado para o objeto alheio é uma negativa consistente, sem vazamento de existência, metadados ou efeitos [@owasp-api1; @owasp-top10-2025].

## Escalonamento vertical e fluxos administrativos

**Objetivo:** impedir que um usuário comum execute operações reservadas a papéis superiores.
**Procedimento:** comparar as matrizes de estudante, professor e administrador; repetir requisições administrativas com o token de menor privilégio; tentar acessar rotas de gestão, alterar papéis e excluir contas.
Para cada negativa, verificar ausência de mudança no banco ou fila.
**Falha detectada:** escalonamento vertical, endpoint administrativo sem verificação de papel, papel amplo demais ou separação de responsabilidades ausente.
**Vantagem:** testa o impacto mais severo.
**Limitação:** aprovações múltiplas e expiração exigem cenários longos.

Testar a alteração do próprio papel e a criação de outro administrador, além da operação final.
Alterar o papel enviado ou guardado no cliente (campo `role`, `localStorage` ou token não assinado) e confirmar que o servidor o ignora.
Ações críticas podem exigir reautenticação ou segunda autoridade [@owasp-authorization].

## Método HTTP e autorização por campo

**Objetivo:** verificar que a autorização permanece correta quando a forma da requisição muda.
**Procedimento:** para recurso somente de leitura, trocar `GET` por `POST`, `PUT`, `PATCH` ou `DELETE`; testar `X-HTTP-Method-Override` e variantes de rota.
Adicionar ao JSON campos como `role`, `ownerId`, `approved` ou `status` e tentar alterá-los com operação permitida.
**Falha detectada:** autorização aplicada a uma rota ou método, mas não a outro, e *mass assignment* que permite ao cliente controlar atributos reservados.
**Vantagem:** encontra inconsistências entre controladores e mapeamentos.
**Limitação:** requer conhecer o contrato.

O resultado esperado é validar cada combinação de operação e campo no servidor, aceitando apenas atributos permitidos para aquele sujeito.
Não se deve confundir filtragem visual do formulário com uma lista de campos autorizados [@owasp-api3].

## Testes manuais, automatizados e orientados por OpenAPI

Testes manuais exploram fluxos novos, interpretam regras de negócio e confirmam evidências.
Testes automatizados repetem a matriz para usuários e identificadores, detectam regressões e comparam status, corpo e efeitos.
Testes orientados por OpenAPI geram casos de rotas, métodos, parâmetros e esquemas documentados.
Sua limitação é estrutural: um contrato incompleto não descreve autorização, propriedade ou transições de negócio, e a geração não substitui cenários com contas relacionadas [@openapi-spec].

Uma estratégia equilibrada automatiza casos de alto risco, usa a especificação como inventário e reserva exploração manual para regras contextuais.
Cada falha deve preservar requisição e resposta sanitizadas, usuário de teste e estado inicial, sem expor segredos.
Ferramentas devem ficar em ambientes locais ou de homologação, com autorização explícita e taxa controlada.
O objetivo é demonstrar a decisão de acesso e seu impacto, não contornar controles em sistemas de terceiros.
