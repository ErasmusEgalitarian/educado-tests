#!/usr/bin/env bash
# Regenera secoes/corpo.tex a partir das fontes Markdown (Pandoc + citeproc IEEE).
# Rodar daqui: relatorios/02-seminario-autorizacao/. O CI só compila o LaTeX,
# então secoes/corpo.tex e referencias.bib são versionados.
set -euo pipefail
cd "$(dirname "$0")"
cat bibliografia/*.bib > referencias.bib.tmp
# remove entradas com chave repetida (mesma fonte citada em mais de uma seção)
awk '/^@/{split($0,a,"{");k=a[2];skip=(k in seen);seen[k]=1} !skip' referencias.bib.tmp > referencias.bib
rm referencias.bib.tmp
# relatorio.md = concatenação das seções na ordem do sumário
{ for f in fontes/0[0-6]-*.md; do cat "$f"; printf '\n\n'; done; } > fontes/relatorio.md
pandoc fontes/relatorio.md --citeproc --csl ieee.csl --bibliography referencias.bib \
  -M lang=pt-BR -M reference-section-title=Referências \
  --top-level-division=section -t latex -o secoes/corpo.tex
echo "secoes/corpo.tex gerado"
