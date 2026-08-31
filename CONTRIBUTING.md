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
git checkout -b secao/04-estrategia
# escreve
./build.sh 01-estrategia-de-testes    # se você compila local; se não, deixa o CI conferir
git add relatorios/01-estrategia-de-testes/secoes/04-estrategia-de-testes.tex
git commit -m "docs(secao-4): niveis de teste e evidencias"
git push -u origin secao/04-estrategia
gh pr create --fill
```

Trabalhando em relatórios diferentes, vocês não se cruzam: pastas separadas, zero conflito.

No PR, o CI compila. Se ficar vermelho, o LaTeX quebrou: abra o log da execução, ele aponta o arquivo e a linha.

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
