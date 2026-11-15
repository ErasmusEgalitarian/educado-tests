#!/usr/bin/env python3
"""Gera um HTML offline usando os integrantes cadastrados em equipe.tex."""

import html
from pathlib import Path
import re

PASTA = Path(__file__).resolve().parent
equipe = (PASTA.parent / "equipe.tex").read_text(encoding="utf-8")
nomes = re.findall(r"\\integrante\{([^}]+)\}\{[^}]+\}", equipe)
if len(nomes) != 6:
    raise ValueError("A apresentação exige seis integrantes em equipe.tex.")

conteudo = (PASTA / "conteudo.html").read_text(encoding="utf-8")
partes = re.findall(r'<section class="slide\b.*?</section>', conteudo, re.DOTALL)
if len(partes) != 12:
    raise ValueError("São esperados doze slides.")


def tempo(segundos):
    return f"{segundos // 60}:{segundos % 60:02d}"


acumulado = 0
tempo_por_integrante = [0] * 6
slides = []
roteiro = []
for numero, parte in enumerate(partes, start=1):
    integrante = int(re.search(r'data-speaker="(\d+)"', parte)[1])
    duracao = int(re.search(r'data-seconds="(\d+)"', parte)[1])
    nome = html.escape(nomes[integrante], quote=True)
    janela = f"{tempo(acumulado)}–{tempo(acumulado + duracao)}"
    parte = parte.replace(' aria-labelledby=', f' id="slide-{numero}" data-name="{nome}" data-window="{janela}" aria-labelledby=', 1)
    if numero > 1:
        parte = parte.replace('<section ', '<section hidden ', 1)
    rodape = f'<footer class="slide-footer"><strong>{nome}</strong><span>{janela} · {duracao} s</span><span>{numero:02d} / 12</span></footer>'
    parte = parte.replace('</section>', rodape + '\n</section>')
    slides.append(parte)
    titulo = re.search(r'<h[12][^>]*>(.*?)</h[12]>', parte, re.DOTALL)[1]
    titulo = html.unescape(re.sub(r'<[^>]+>', ' ', titulo))
    notas = re.search(r'<aside class="notes">(.*?)</aside>', parte, re.DOTALL)[1]
    paragrafos = re.findall(r'<p[^>]*>(.*?)</p>', notas, re.DOTALL)
    texto = '\n\n'.join(html.unescape(re.sub(r'<[^>]+>', '', p)) for p in paragrafos)
    roteiro.append(f"## {numero:02d} · {titulo}\n\n{nomes[integrante]} · {janela} · {duracao} segundos\n\n{texto}")
    acumulado += duracao
    tempo_por_integrante[integrante] += duracao

if acumulado != 600 or tempo_por_integrante != [100] * 6:
    raise ValueError("O roteiro deve reservar 100 segundos para cada integrante.")

css = (PASTA / "estilo.css").read_text(encoding="utf-8")
js = (PASTA / "navegacao.js").read_text(encoding="utf-8")
pagina = f'''<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Seminário de testes de autorização e controle de acesso no Educado. Equipe Sleep 6, FGA0314, UnB.">
  <title>Autorização e controle de acesso · Sleep 6</title>
  <style>{css}</style>
</head>
<body>
  <noscript><p>Ative JavaScript para navegar e consultar as notas. O roteiro completo está em <a href="roteiro.md">roteiro.md</a>.</p></noscript>
  <main id="stage" aria-label="Apresentação do seminário"><div id="deck">
  {''.join(slides)}
  </div></main>
  <aside id="speaker-panel" aria-label="Roteiro de fala" hidden>
    <h2>Roteiro de fala</h2><p id="speaker-meta"></p>
    <p>Este painel aparece na tela compartilhada. Feche-o antes de projetar.</p>
    <div id="speaker-notes"></div>
  </aside>
  <nav class="toolbar" aria-label="Controles da apresentação">
    <button id="previous" aria-label="Slide anterior" title="Anterior (←)">←</button>
    <label class="sr-only" for="slide-select">Ir para o slide</label><select id="slide-select"></select>
    <button id="next" aria-label="Próximo slide" title="Próximo (→)">→</button>
    <button id="notes-button" aria-controls="speaker-panel" aria-expanded="false">Notas (N)</button>
    <button id="fullscreen">Tela cheia (F)</button>
    <span id="timer" class="timer" aria-label="Tempo decorrido">0:00</span>
    <button id="timer-button" aria-pressed="false" title="Iniciar ou pausar cronômetro (T)">Iniciar</button>
    <button id="reset-timer" title="Zerar cronômetro">Zerar</button>
    <button id="help-button" aria-label="Ajuda e atalhos">?</button>
  </nav>
  <p id="announcement" class="sr-only" aria-live="polite" aria-atomic="true"></p>
  <dialog id="help" aria-labelledby="help-title">
    <h2 id="help-title">Como apresentar</h2>
    <ul><li><kbd>←</kbd> / <kbd>→</kbd> ou <kbd>Page Up</kbd> / <kbd>Page Down</kbd>: navegar.</li>
    <li><kbd>Espaço</kbd>: próximo slide. <kbd>Home</kbd> / <kbd>End</kbd>: primeiro / último.</li>
    <li><kbd>N</kbd>: notas. <kbd>F</kbd>: tela cheia. <kbd>T</kbd>: iniciar ou pausar cronômetro.</li>
    <li><kbd>Ctrl</kbd> + <kbd>P</kbd>: imprimir os 12 slides ou salvar em PDF.</li></ul>
    <p>Plano: 10 minutos, com 1min40 por integrante. Notas são visíveis na tela compartilhada.</p>
    <button id="close-help">Fechar ajuda</button>
  </dialog>
  <script>{js}</script>
</body>
</html>
'''
(PASTA / "index.html").write_text(pagina, encoding="utf-8")
(PASTA / "roteiro.md").write_text(
    "# Roteiro do seminário\n\n"
    "Duração prevista: **10 minutos**. Seis blocos de **1min40**, com dois slides por integrante. "
    "As transições fazem parte do tempo de cada bloco. Ensaiar para manter a apresentação entre 8 e 12 minutos.\n\n"
    "Texto de apoio gerado a partir de `conteudo.html` e dos integrantes de `../equipe.tex`. "
    "Adaptar a fala durante o ensaio, preservando a distinção entre planejamento e resultados.\n\n"
    + '\n\n'.join(roteiro) + '\n', encoding="utf-8"
)
print(f"Gerados index.html e roteiro.md: {len(slides)} slides, {tempo(acumulado)}, seis integrantes.")
