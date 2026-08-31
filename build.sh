#!/usr/bin/env bash
# Compila o relatório. Saída em build/main.pdf.
#
#   ./build.sh          compila
#   ./build.sh watch    recompila a cada save
#   ./build.sh clean    limpa os arquivos intermediários
set -euo pipefail
cd "$(dirname "$0")"

case "${1:-build}" in
  watch) latexmk -pvc main.tex ;;
  clean) latexmk -C main.tex ; rm -rf build ;;
  build) latexmk main.tex && echo "PDF em build/main.pdf" ;;
  *) echo "uso: ./build.sh [build|watch|clean]" >&2 ; exit 1 ;;
esac
