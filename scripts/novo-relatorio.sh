#!/usr/bin/env bash
# Cria a pasta de um relatório novo já ligada ao preâmbulo comum e ao CI.
#
#   ./scripts/novo-relatorio.sh 02-plano-de-testes "Plano de Testes" FGA0314_Relatorio_2
#
# Depois disso, o relatório já compila (./build.sh 02-plano-de-testes) e o CI
# passa a construí-lo sozinho, sem editar nenhum workflow.
set -euo pipefail
cd "$(dirname "$0")/.."

nome="${1:-}"
titulo="${2:-}"
entrega="${3:-}"

if [ -z "$nome" ] || [ -z "$titulo" ]; then
  echo "uso: ./scripts/novo-relatorio.sh <nome-da-pasta> \"<Título>\" [nome-do-pdf]" >&2
  echo "ex:  ./scripts/novo-relatorio.sh 02-plano-de-testes \"Plano de Testes\" FGA0314_Relatorio_2" >&2
  exit 1
fi

dir="relatorios/$nome"
[ -e "$dir" ] && { echo "erro: $dir já existe" >&2; exit 1; }

mkdir -p "$dir/secoes" "$dir/figuras"
touch "$dir/figuras/.gitkeep"
[ -n "$entrega" ] && echo "$entrega" > "$dir/entrega.txt"

cat > "$dir/main.tex" <<EOF
% ============================================================================
% $titulo
% FGA0314 - Testes de Software (FCTE/UnB)
%
% Este arquivo é só a espinha: preâmbulo + ordem das seções.
% NÃO escreva conteúdo aqui. Cada seção mora em secoes/ e entra pelo \\input
% abaixo, pra duas pessoas editarem seções diferentes sem conflito de merge.
% ============================================================================

\\documentclass[12pt,a4paper]{article}

\\input{../../comum/preambulo}

\\begin{document}

\\input{secoes/00-capa}
\\input{secoes/01-introducao}

\\end{document}
EOF

cat > "$dir/secoes/00-capa.tex" <<EOF
% !TEX root = ../main.tex
\\begin{titlepage}
\\begin{center}

\\includegraphics[width=3.5cm]{../../comum/logo_unb.jpg}

\\vspace{0.5cm}

{\\large
\\textbf{UNIVERSIDADE DE BRASÍLIA}\\\\
Faculdade de Ciências e Tecnologias em Engenharia (FCTE)
}

\\vspace{0.8cm}

{\\large
\\textbf{FGA0314 -- TESTES DE SOFTWARE}
}

\\vfill

{\\Large
\\textbf{$titulo}
}

\\vfill

\\begin{tabular}{ll}
\\textbf{Equipe:} & Nome da equipe \\\\[0.3cm]
\\textbf{Integrantes:} & Nome completo -- Matrícula \\\\
                      & Nome completo -- Matrícula
\\end{tabular}

\\vfill

{\\large
Brasília -- DF\\\\
\\the\\year
}

\\end{center}
\\end{titlepage}
EOF

cat > "$dir/secoes/01-introducao.tex" <<EOF
% !TEX root = ../main.tex
\\section{Introdução}

Escreva aqui.
EOF

echo "Criado: $dir"
echo "Compile com: ./build.sh $nome"
