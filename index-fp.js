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


// ── Navigate to a scene by index ──
function goTo(idx) {
  const clamped = Math.max(0, Math.min(idx, sections.length - 1));
  scroller.scrollTo({ top: clamped * scroller.clientHeight, behavior: 'smooth' });
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


// ── Dot click → jump to scene ──
dots.forEach(dot => {
  dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
});

//    Used by all three scroll-hint arrows.
document.querySelectorAll('[data-scroll-next]').forEach(btn => {
  btn.addEventListener('click', () => goTo(activeIndex() + 1));
});

//    Used by the "see more ↓" link in the hobby label row.
document.querySelectorAll('[data-scroll-to]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    goTo(parseInt(el.dataset.scrollTo));
  });
});


// ── Keyboard arrow / page navigation ──
document.addEventListener('keydown', e => {
  const cur = activeIndex();
  if ((e.key === 'ArrowDown' || e.key === 'PageDown') && cur < sections.length - 1)
    goTo(cur + 1);
  if ((e.key === 'ArrowUp' || e.key === 'PageUp') && cur > 0)
    goTo(cur - 1);
});