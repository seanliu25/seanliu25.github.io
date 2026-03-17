/* index-fp.js  —  Full-page scroll interactions */

// ── Mobile nav toggle ──
const toggle   = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
  toggle.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
    toggle.classList.remove('open');
  });
});


// ── Core refs ──
const scroller = document.getElementById('fp-scroll');
const dots     = document.querySelectorAll('.fp-dot');
const sections = document.querySelectorAll('.fp-section');


// ── Active section index ──
function activeIndex() {
  return Math.round(scroller.scrollTop / scroller.clientHeight);
}


// ── Sync nav dots ──
function syncDots(i) {
  dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
}

let ticking = false;
scroller.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => { syncDots(activeIndex()); ticking = false; });
    ticking = true;
  }
});


// ── Navigate to a scene by index ──
function goTo(idx) {
  scroller.scrollTo({ top: idx * scroller.clientHeight, behavior: 'smooth' });
}


// ── Dot click → jump to scene ──
dots.forEach(dot => {
  dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
});


// ── Scroll-hint arrow → advance to next scene ──
const scrollBtn = document.getElementById('scroll-btn');
if (scrollBtn) {
  scrollBtn.addEventListener('click', () => {
    const next = activeIndex() + 1;
    if (next < sections.length) goTo(next);
  });
}


// ── Keyboard arrow / page navigation ──
document.addEventListener('keydown', e => {
  const cur = activeIndex();
  if ((e.key === 'ArrowDown' || e.key === 'PageDown') && cur < sections.length - 1)
    goTo(cur + 1);
  if ((e.key === 'ArrowUp' || e.key === 'PageUp') && cur > 0)
    goTo(cur - 1);
});