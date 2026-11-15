(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const stage = document.querySelector('#stage');
  const deck = document.querySelector('#deck');
  const toolbar = document.querySelector('.toolbar');
  const selector = document.querySelector('#slide-select');
  const previous = document.querySelector('#previous');
  const next = document.querySelector('#next');
  const panel = document.querySelector('#speaker-panel');
  const notesButton = document.querySelector('#notes-button');
  const timerButton = document.querySelector('#timer-button');
  const timer = document.querySelector('#timer');
  const help = document.querySelector('#help');
  let index = 0;
  let elapsed = 0;
  let startedAt = null;

  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function fit() {
    if (!matchMedia('(max-width: 760px)').matches || panel.hidden) {
      stage.style.height = `${window.innerHeight - toolbar.offsetHeight}px`;
    } else {
      stage.style.height = '42dvh';
    }
    const scale = Math.min(stage.clientWidth / 1280, stage.clientHeight / 720);
    deck.style.transform = `translate(-50%, -50%) scale(${scale})`;
    panel.style.bottom = `${toolbar.offsetHeight}px`;
  }
  function hashIndex() {
    const match = location.hash.match(/^#slide-(\d+)$/);
    return match ? Math.min(slides.length - 1, Math.max(0, Number(match[1]) - 1)) : 0;
  }
  function show(target, updateHash = true) {
    index = Math.max(0, Math.min(slides.length - 1, target));
    slides.forEach((slide, position) => { slide.hidden = position !== index; });
    const slide = slides[index];
    selector.value = String(index);
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    const title = slide.querySelector('h1, h2').textContent;
    document.querySelector('#announcement').textContent = `Slide ${index + 1} de ${slides.length}: ${title}`;
    document.querySelector('#speaker-meta').textContent = `${slide.dataset.name} · ${slide.dataset.window} · ${slide.dataset.seconds} s neste slide`;
    document.querySelector('#speaker-notes').innerHTML = slide.querySelector('.notes').innerHTML;
    document.title = `${index + 1}/${slides.length} · ${title} · Sleep 6`;
    if (updateHash) history.replaceState(null, '', `#slide-${index + 1}`);
    fit();
  }
  function toggleNotes() {
    panel.hidden = !panel.hidden;
    document.body.classList.toggle('with-notes', !panel.hidden);
    notesButton.setAttribute('aria-expanded', String(!panel.hidden));
    fit();
  }
  function tick() {
    const seconds = Math.floor((elapsed + (startedAt === null ? 0 : performance.now() - startedAt)) / 1000);
    timer.textContent = formatTime(seconds);
    timer.title = seconds < 480 ? 'Duração prevista: 8 a 12 minutos' : seconds <= 720 ? 'Dentro da faixa de 8 a 12 minutos' : 'Acima de 12 minutos';
  }
  function toggleTimer() {
    if (startedAt === null) {
      startedAt = performance.now();
      timerButton.textContent = 'Pausar';
    } else {
      elapsed += performance.now() - startedAt;
      startedAt = null;
      timerButton.textContent = 'Continuar';
    }
    timerButton.setAttribute('aria-pressed', String(startedAt !== null));
    fit();
    tick();
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      document.querySelector('#announcement').textContent = 'Tela cheia indisponível. Use o modo de apresentação do navegador.';
    }
  }
  slides.forEach((slide, position) => {
    const option = document.createElement('option');
    option.value = String(position);
    option.textContent = `${String(position + 1).padStart(2, '0')} · ${slide.querySelector('h1, h2').textContent}`;
    selector.append(option);
  });
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  selector.addEventListener('change', () => show(Number(selector.value)));
  notesButton.addEventListener('click', toggleNotes);
  timerButton.addEventListener('click', toggleTimer);
  document.querySelector('#reset-timer').addEventListener('click', () => {
    elapsed = 0;
    startedAt = null;
    timerButton.textContent = 'Iniciar';
    timerButton.setAttribute('aria-pressed', 'false');
    tick();
    fit();
  });
  document.querySelector('#fullscreen').addEventListener('click', fullscreen);
  document.querySelector('#help-button').addEventListener('click', () => help.showModal());
  document.querySelector('#close-help').addEventListener('click', () => help.close());
  window.addEventListener('hashchange', () => show(hashIndex(), false));
  window.addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);
  document.addEventListener('keydown', event => {
    if (help.open || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('button, select, input, textarea, a, [contenteditable]')) return;
    const actions = {
      ArrowRight: () => show(index + 1), PageDown: () => show(index + 1), ' ': () => show(index + 1),
      ArrowLeft: () => show(index - 1), PageUp: () => show(index - 1),
      Home: () => show(0), End: () => show(slides.length - 1),
      n: toggleNotes, f: fullscreen, t: toggleTimer, '?': () => help.showModal(),
    };
    const action = actions[event.key];
    if (action) { event.preventDefault(); action(); }
  });
  setInterval(tick, 250);
  show(hashIndex(), false);
})();
