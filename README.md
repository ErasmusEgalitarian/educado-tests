# educado-tests

Relatório de Estratégia de Testes do projeto OSS **Educado**, disciplina **FGA0314 - Testes de Software** (FCTE/UnB).

O documento segue o template oficial da disciplina, apenas quebrado em arquivos por seção pra várias pessoas escreverem ao mesmo tempo sem conflito de merge. O PDF gerado é idêntico ao do template.

## Como compilar

Você tem três caminhos. Escolha um, nenhum é obrigatório.

### 1. Não instalar nada (recomendado pra maioria)

Abra um Pull Request. O GitHub Actions compila e anexa o PDF. Vá em **Actions > a execução do seu PR > Artifacts > relatorio-pdf**.

### 2. Devcontainer (VS Code ou Codespaces)

O repo tem `.devcontainer/` com TeX Live completo e o LaTeX Workshop já configurado.

- No VS Code: abra a pasta, aceite "Reopen in Container".
- No navegador: botão **Code > Codespaces > Create codespace**.

Salvou o arquivo, ele recompila sozinho e mostra o PDF ao lado.

### 3. Local

Precisa de TeX Live com `latexmk`. No Ubuntu/Debian:

```bash
sudo apt install texlive-full latexmk
```

Depois:

```bash
./build.sh          # compila, saída em build/main.pdf
./build.sh watch    # recompila a cada save
./build.sh clean    # limpa os intermediários
```

## Estrutura

```
main.tex                    espinha do documento: preâmbulo + ordem das seções
estilo/preambulo.tex        pacotes e configurações (não mexer sozinho)
secoes/                     o conteúdo, um arquivo por seção
figuras/                    imagens e evidências (screenshots, gráficos)
build/                      saída da compilação, não versionado
.github/workflows/          CI que compila e publica o PDF
.devcontainer/              ambiente pronto pro VS Code / Codespaces
```

Quem escreve o quê e como abrir PR: [CONTRIBUTING.md](CONTRIBUTING.md).

## Entrega

Quando a versão de entrega estiver fechada:

```bash
git tag entrega-1
git push origin entrega-1
```

O CI cria uma Release com o `FGA0314_Relatorio_1.pdf` anexado. É esse arquivo que vai pro Moodle.
