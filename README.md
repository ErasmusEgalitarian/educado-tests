# educado-tests

Relatórios da disciplina **FGA0314 - Testes de Software** (FCTE/UnB) sobre o projeto OSS **Educado**.

Um repo, N relatórios. Cada relatório é uma pasta isolada em `relatorios/`, com seu próprio `main.tex`, suas seções e suas figuras. O preâmbulo e o logo são compartilhados em `comum/`, então mudança de formatação vale pra todos de uma vez.

## Relatórios

| Pasta | Documento | PDF da entrega |
|---|---|---|
| `relatorios/01-estrategia-de-testes/` | Relatório de Estratégia de Testes de Projeto OSS | `FGA0314_Relatorio_1.pdf` |

## Como compilar

Três caminhos. Escolha um, nenhum é obrigatório.

### 1. Não instalar nada (recomendado pra maioria)

Abra um Pull Request. O GitHub Actions compila **todos** os relatórios e anexa cada PDF. Vá em **Actions > a execução do seu PR > Artifacts**.

### 2. Devcontainer (VS Code ou Codespaces)

O repo tem `.devcontainer/` com TeX Live completo e o LaTeX Workshop configurado.

- No VS Code: abra a pasta, aceite "Reopen in Container".
- No navegador: botão **Code > Codespaces > Create codespace**.

Salvou o arquivo, ele recompila sozinho e mostra o PDF ao lado. As seções trazem um comentário `% !TEX root` no topo, então o editor sabe qual relatório compilar mesmo com você editando só uma seção.

### 3. Local

Precisa de TeX Live com `latexmk`. No Ubuntu/Debian:

```bash
sudo apt install texlive-full latexmk
```

Depois:

```bash
./build.sh                              lista os relatórios
./build.sh 01-estrategia-de-testes      compila um, saída em build/
./build.sh all                          compila todos
./build.sh 01-estrategia-de-testes watch    recompila a cada save
./build.sh clean                        limpa os intermediários
```

## Estrutura

```
comum/
  preambulo.tex           pacotes e configurações, valem pra todos os relatórios
  logo_unb.jpg
relatorios/
  01-estrategia-de-testes/
    main.tex              espinha: preâmbulo + ordem das seções
    equipe.tex            nome e matrícula dos integrantes, um lugar só
    entrega.txt           nome do PDF final (o que vai pro Moodle)
    secoes/               o conteúdo, um arquivo por seção
    figuras/              imagens e evidências deste relatório
build/                    saída da compilação, não versionado
scripts/novo-relatorio.sh cria a pasta do próximo relatório
.github/workflows/        CI que compila todos e publica os PDFs
.devcontainer/            ambiente pronto pro VS Code / Codespaces
```

Quem escreve o quê e como abrir PR: [CONTRIBUTING.md](CONTRIBUTING.md).

**Primeira vez aqui?** O [Guia do Repositório](docs/Guia_do_Repositorio_educado-tests.pdf) cobre o caminho inteiro em PDF: clone, setup, contribuição, padrão de commit, regras de PR e como gerar a versão de entrega.

## Começar um relatório novo

```bash
./scripts/novo-relatorio.sh 02-plano-de-testes "Plano de Testes" FGA0314_Relatorio_2
```

Isso cria a pasta já ligada ao preâmbulo comum, com capa e uma seção inicial. O CI descobre a pasta sozinho na próxima execução: **nenhum workflow precisa ser editado.**

Quando o professor mandar o template do relatório novo, quebre o `main.tex` dele em `secoes/` do mesmo jeito que o 01 está, pra equipe conseguir escrever em paralelo.

## Entrega

Quando a versão de entrega de um relatório estiver fechada:

```bash
git tag entrega-01-estrategia-de-testes
git push origin entrega-01-estrategia-de-testes
```

O trecho depois de `entrega-` é o nome da pasta em `relatorios/`. O CI compila **aquele** relatório e cria uma Release com o PDF anexado, já com o nome definido em `entrega.txt`. É esse arquivo que vai pro Moodle.

Precisa reentregar depois de feedback? Acrescente o sufixo de versão. O CI entende o `-v2` como versão, acha a mesma pasta e cria uma Release separada, mantendo a anterior recuperável:

```bash
git tag entrega-01-estrategia-de-testes-v2
git push origin entrega-01-estrategia-de-testes-v2
```
