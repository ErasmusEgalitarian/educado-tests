# Como escrever no relatório

A regra que evita 90% da dor: **uma pessoa por seção, uma branch por seção, um PR por seção.**

## Divisão dos arquivos

Cada relatório vive em `relatorios/<nome>/`. Os caminhos abaixo são do
`relatorios/01-estrategia-de-testes/`; os próximos relatórios seguem o mesmo desenho.

| Arquivo | Seção do relatório |
|---|---|
| `secoes/00-capa.tex` | Capa: nome da equipe, integrantes, matrículas |
| `secoes/01-identificacao.tex` | Identificação do projeto OSS, repositório, commit analisado |
| `secoes/02-introducao.tex` | 1. Introdução |
| `secoes/03-visao-geral.tex` | 2. Visão Geral do Projeto |
| `secoes/04-estrategia-de-testes.tex` | 3. Estratégia de Testes (a maior, dá pra dividir por subseção) |
| `secoes/05-execucao-da-suite.tex` | 4. Execução da Suíte de Testes |
| `secoes/06-avaliacao-critica.tex` | 5. Avaliação Crítica |
| `secoes/07-conclusao.tex` | 6. Conclusão |
| `secoes/08-referencias.tex` | Referências |
| `secoes/09-apendice.tex` | Apêndice: evidências complementares |

Dois arquivos são compartilhados e merecem cuidado:

- `main.tex` do relatório: só preâmbulo e a ordem dos `\input`. Mexer nele conflita com todo mundo daquele relatório.
- `comum/preambulo.tex`: pacotes e formatação de **todos** os relatórios do repo. Mudar aqui muda o layout dos outros também, inclusive de relatório já entregue. Avise no grupo antes.

Figura vai em `figuras/` do **próprio** relatório, nunca em `comum/`. `comum/` é só o que é genuinamente de todos.

## Fluxo

```bash
git checkout main && git pull
git checkout -b docs/rel01-estrategia-de-testes
# escreve
./build.sh 01-estrategia-de-testes    # se você compila local; se não, deixa o CI conferir
git add relatorios/01-estrategia-de-testes/secoes/04-estrategia-de-testes.tex
git commit -m "docs(rel01): descrever niveis de teste com evidencia"
git push -u origin docs/rel01-estrategia-de-testes
gh pr create --fill
```

No PR, o CI compila. Se ficar vermelho, o LaTeX quebrou: abra o log da execução, ele aponta o arquivo e a linha.

Trabalhando em relatórios diferentes, vocês não se cruzam: pastas separadas, zero conflito.

## Nome de branch

Formato `tipo/relNN-assunto`, minúsculo e com hífen.

| Situação | Branch |
|---|---|
| Escrever uma seção | `docs/rel01-estrategia-de-testes` |
| Corrigir erro no texto | `fix/rel01-tabela-cobertura` |
| Começar um relatório novo | `feat/rel02-plano-de-testes` |
| Mexer em CI ou tooling | `ci/matrix-de-relatorios` |

Sempre parta de uma `main` atualizada. Branch criada de `main` velha gera conflito que não precisava existir.

## Padrão de commit

**Conventional Commits**: `tipo(escopo): descricao no imperativo`.

| Tipo | Quando |
|---|---|
| `docs` | Conteúdo do relatório: escrever, reescrever, completar seção |
| `fix` | Corrigir erro no texto, número errado, referência quebrada |
| `feat` | Estrutura nova: relatório novo, seção nova, comando novo |
| `style` | Só formatação LaTeX, sem mudar o que o texto diz |
| `ci` | Workflows do GitHub Actions |
| `chore` | Manutenção: gitignore, devcontainer, dependência |
| `refactor` | Reorganizar arquivos sem mudar o PDF resultante |

Escopo é o relatório (`rel01`, `rel02`). Mudança que não é de um relatório específico usa `comum` ou nenhum escopo.

Descrição no imperativo ("adicionar", não "adicionado"), minúscula, sem ponto final, até 72 caracteres. Descreva a mudança, não o arquivo.

```
docs(rel01): descrever niveis de teste com evidencia do repo
fix(rel01): corrigir cobertura de branches na tabela 4
feat(rel02): criar estrutura do plano de testes
ci: compilar todos os relatorios em matrix
```

Use o corpo do commit pro "porquê" quando não for óbvio. Se o commit muda um número ou uma conclusão do relatório, o corpo é onde se diz de onde veio o dado.

## Regras de PR

Um PR cobre **uma seção**. PR que toca cinco seções não é revisável e trava o trabalho dos outros.

Título no mesmo padrão do commit. Marque **um revisor**: revisão de colega é o filtro que pega afirmação sem fonte antes do professor pegar.

**Barra o merge:** CI vermelho, ausência de revisor, afirmação sem fonte apontada, ou mudança em `comum/preambulo.tex` sem aviso no grupo (afeta relatório já entregue).

Use **squash merge** e apague a branch depois. Não faça `force push` em branch já em revisão: quebra os comentários do revisor.

## Regras de escrita que valem nota

O template do professor é explícito sobre isso, então repetindo aqui:

- **Evidência encontrada** é o que foi observado no projeto, com fonte (arquivo, diretório, issue, PR, workflow, trecho de código).
- **Avaliação da equipe** é a interpretação de vocês sobre a prática, usando os conceitos da disciplina.
- **Recomendação** é melhoria proposta. Nunca escreva recomendação como se o projeto já fizesse aquilo.

Afirmação sem fonte é o erro mais caro do relatório. "O projeto possui testes unitários" sem apontar onde isso foi visto não conta como evidência.

## LaTeX na prática

Uma linha por frase. Facilita o diff e o review:

```latex
O projeto adota Jest para testes unitários.
A configuração está em \texttt{jest.config.js}.
```

Isso não muda nada no PDF, o LaTeX junta as linhas no mesmo parágrafo. Linha em branco é que separa parágrafo.

**Figuras e evidências.** Coloque o arquivo em `figuras/` do seu relatório e referencie:

```latex
\begin{figure}[H]
    \centering
    \includegraphics[width=0.8\textwidth]{figuras/cobertura-jest.png}
    \caption{Relatório de cobertura gerado pelo Jest.}
    \label{fig:cobertura}
\end{figure}
```

No texto, cite com `Figura \ref{fig:cobertura}`. O mesmo vale pra tabelas, com `Tabela \ref{tab:...}`.

**Log de execução ou trecho de código** vai em `lstlisting`:

```latex
\begin{lstlisting}
npm test -- --coverage
\end{lstlisting}
```

**Caracteres que quebram a compilação:** `& % $ # _ { }` precisam de barra invertida (`\&`, `\%`, `\_`). Em URL, use `\url{...}` que ele resolve sozinho.

## Antes de abrir o PR

- [ ] O CI compilou verde
- [ ] Toda afirmação sobre o projeto tem fonte apontada
- [ ] Evidência, avaliação e recomendação estão separadas, não misturadas no mesmo parágrafo
- [ ] Os `--` e placeholders das tabelas do template foram preenchidos ou a linha foi removida
- [ ] Nenhum `<nome do projeto OSS>` ou `Nome completo -- Matrícula` sobrou
