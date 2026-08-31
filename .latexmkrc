# Configuração usada pelo build local, pelo LaTeX Workshop e pelo CI.
# Todo mundo compila do mesmo jeito, então "na minha máquina funciona" não vale.
$pdf_mode = 1;              # pdflatex
$pdflatex = 'pdflatex -interaction=nonstopmode -halt-on-error -file-line-error %O %S';
$out_dir = 'build';
$clean_ext = 'synctex.gz run.xml bbl';
