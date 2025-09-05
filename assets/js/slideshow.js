// assets/js/slideshow.js
(() => {
  const SELECTOR = '.slideshow';
  const slideshows = document.querySelectorAll(SELECTOR);
  if (!slideshows.length) return;

  slideshows.forEach(initSlideshow);

  function initSlideshow(root) {
    const track = root.querySelector('.slideshow__track');
    const slides = Array.from(root.querySelectorAll('.slide'));
    const prevBtn = root.querySelector('.slideshow__btn[data-dir="-1"]');
    const nextBtn = root.querySelector('.slideshow__btn[data-dir="1"]');
    const dotsWrap = root.querySelector('.slideshow__dots');
    const toggleBtn = root.querySelector('.slideshow__toggle');
    const viewport = root.querySelector('.slideshow__viewport');

    let index = 0;
    let autoplayMs = parseInt(root.dataset.autoplay || '0', 10) || 0;
    let timer = null;
    let playing = autoplayMs > 0;

    // Build dots
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.role = 'tab';
      dot.ariaLabel = `Go to slide ${i + 1}`;
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    function updateUI() {
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      [...dotsWrap.children].forEach((d, i) => d.setAttribute('aria-selected', String(i === index)));
      // Toggle icons
      if (toggleBtn) {
        toggleBtn.querySelector('.icon-play')?.toggleAttribute('hidden', playing);
        toggleBtn.querySelector('.icon-pause')?.toggleAttribute('hidden', !playing);
        toggleBtn.setAttribute('aria-label', playing ? 'Pause autoplay' : 'Play autoplay');
      }
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      updateUI();
      restartAutoplay();
    }

    function step(dir) { goTo(index + dir); }

    function startAutoplay() {
      if (!autoplayMs) return;
      clearInterval(timer);
      if (playing) timer = setInterval(() => step(1), autoplayMs);
    }

    function stopAutoplay() {
      clearInterval(timer);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // Events
    prevBtn?.addEventListener('click', () => step(-1));
    nextBtn?.addEventListener('click', () => step(1));

    // Pause on hover/focus, resume on leave/blur
    root.addEventListener('mouseenter', () => { playing && stopAutoplay(); });
    root.addEventListener('mouseleave', () => { playing && startAutoplay(); });
    root.addEventListener('focusin', () => { playing && stopAutoplay(); });
    root.addEventListener('focusout', () => { playing && startAutoplay(); });

    // Keyboard (left/right; Home/End)
    root.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (key === 'Home') { e.preventDefault(); goTo(0); }
      else if (key === 'End') { e.preventDefault(); goTo(slides.length - 1); }
      else if (key === ' ' && (e.target === toggleBtn || e.target === viewport)) {
        e.preventDefault(); togglePlay();
      }
    });

    // Touch / drag swipe
    let startX = 0, currentX = 0, dragging = false;
    viewport.addEventListener('pointerdown', (e) => {
      dragging = true; startX = e.clientX; currentX = startX;
      viewport.setPointerCapture(e.pointerId);
      track.style.transition = 'none';
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      currentX = e.clientX;
      const dx = currentX - startX;
      const pct = (dx / viewport.clientWidth) * 100;
      track.style.transform = `translateX(calc(-${index * 100}% + ${pct}%))`;
    });
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      track.style.transition = '';
      const dx = e.clientX - startX;
      const t = viewport.clientWidth * 0.15; // threshold ~15% width
      if (dx > t) step(-1);
      else if (dx < -t) step(1);
      else updateUI();
    }

    // Play/Pause
    function togglePlay() {
      if (!autoplayMs) return; // nothing to toggle
      playing = !playing;
      playing ? startAutoplay() : stopAutoplay();
      updateUI();
    }
    toggleBtn?.addEventListener('click', togglePlay);

    // Init
    updateUI();
    startAutoplay();

    // Resize safety
    new ResizeObserver(() => updateUI()).observe(viewport);
  }
})();
