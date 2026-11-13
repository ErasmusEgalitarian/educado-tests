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
{ for f in fontes/0[0-6]-*.md; do
  # tira numeração manual dos títulos ("## 1. Objetivo") e renomeia a lista
  # local de referências, para não colidir com a numeração e a seção do LaTeX
  sed -E -e 's/^(#+) [0-9]+\. /\1 /' -e 's/^## Referências$/## Fontes consultadas nesta seção/' "$f"; printf '\n\n'; done; } > fontes/relatorio.md
pandoc fontes/relatorio.md --citeproc --csl ieee.csl --bibliography referencias.bib \
  -M lang=pt-BR -M reference-section-title=Referências \
  --top-level-division=section -t latex -o secoes/corpo.tex
# permite quebrar linha depois de "/" entre palavras (células estreitas), fora de URLs
python3 - <<'PY'
import re
p='secoes/corpo.tex'; t=open(p,encoding='utf-8').read().split('\n')
t=[l if ('http' in l or '\\url' in l or '\\href' in l) else re.sub(r'(?<=[A-Za-zÀ-ú])/(?=[A-Za-zÀ-ú])', r'/\\allowbreak{}', l) for l in t]
open(p,'w',encoding='utf-8').write('\n'.join(t))
PY
echo "secoes/corpo.tex gerado"
