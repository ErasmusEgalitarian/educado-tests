#!/usr/bin/env bash
# Compila os relatórios do repo. Saída em build/<nome-da-entrega>.pdf.
#
#   ./build.sh                       lista os relatórios disponíveis
#   ./build.sh 01-estrategia-de-testes    compila um
#   ./build.sh all                   compila todos
#   ./build.sh 01-estrategia-de-testes watch   recompila a cada save
#   ./build.sh clean                 limpa os intermediários
#
# Cada relatório mora em relatorios/<nome>/ com seu próprio main.tex.
# O preâmbulo compartilhado fica em comum/, referenciado por caminho relativo,
# então a compilação sempre roda de dentro da pasta do relatório.
set -euo pipefail
cd "$(dirname "$0")"
RAIZ="$PWD"

FLAGS=(-pdf -outdir=build -interaction=nonstopmode -halt-on-error -file-line-error)

listar() { find relatorios -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort; }

compilar() {
  local nome="$1"
  local dir="relatorios/$nome"
  [ -f "$dir/main.tex" ] || { echo "erro: $dir/main.tex não existe" >&2; return 1; }

  # entrega.txt define o nome final do PDF (o que vai pro Moodle).
  # Sem ele, o PDF herda o nome da pasta.
  local saida="$nome"
  [ -f "$dir/entrega.txt" ] && saida="$(head -1 "$dir/entrega.txt")"

  ( cd "$dir" && latexmk "${FLAGS[@]}" main.tex )
  mkdir -p "$RAIZ/build"
  cp "$dir/build/main.pdf" "$RAIZ/build/$saida.pdf"
  echo "PDF em build/$saida.pdf"
}

case "${1:-}" in
  "")
    echo "Relatórios neste repo:"
    listar | sed 's/^/  /'
    echo
    echo "uso: ./build.sh <nome> | all | clean"
    ;;
  all)
    while read -r nome; do compilar "$nome"; done < <(listar)
    ;;
  clean)
    while read -r nome; do rm -rf "relatorios/$nome/build"; done < <(listar)
    rm -rf build
    echo "limpo"
    ;;
  *)
    if [ "${2:-}" = "watch" ]; then
      ( cd "relatorios/$1" && latexmk -pvc "${FLAGS[@]}" main.tex )
    else
      compilar "$1"
    fi
    ;;
esac
