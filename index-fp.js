/* =====================================================
   index-fp.js  —  Full-page scroll interactions
   ===================================================== */

// ── Mobile detection ──
// On mobile we switch to natural scroll (no snap), so navigation
// and dot-sync need different logic.
const isMobile = () => window.innerWidth <= 768;


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


// ────────────────────────────────────────────────────
//  NAVIGATION
//  Desktop: snap-scroll container (fixed section height)
//  Mobile:  body scroll + scrollIntoView
// ────────────────────────────────────────────────────

function activeIndex() {
  if (isMobile()) return currentMobileIndex;
  return Math.round(scroller.scrollTop / scroller.clientHeight);
}

function goTo(idx) {
  const clamped = Math.max(0, Math.min(idx, sections.length - 1));

  if (isMobile()) {
    // On mobile, sections have natural height — use scrollIntoView
    sections[clamped].scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // Desktop snap container
    scroller.scrollTo({ top: clamped * scroller.clientHeight, behavior: 'smooth' });
  }
}


// ────────────────────────────────────────────────────
//  DOT SYNC
//  Desktop: recalculate on .fp-scroll scroll event
//  Mobile:  IntersectionObserver watches each section
// ────────────────────────────────────────────────────

function syncDots(i) {
  dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
}

// ── Desktop: scroll event on the snap container ──
let ticking = false;
scroller.addEventListener('scroll', () => {
  if (isMobile()) return;  // mobile uses IntersectionObserver instead
  if (!ticking) {
    requestAnimationFrame(() => {
      syncDots(activeIndex());
      ticking = false;
    });
    ticking = true;
  }
});

// ── Mobile: IntersectionObserver ──
// Track which section is most visible and update dots accordingly.
let currentMobileIndex = 0;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = Array.from(sections).indexOf(entry.target);
        if (idx !== -1) {
          currentMobileIndex = idx;
          syncDots(idx);
        }
      }
    });
  },
  {
    // Fire when a section is at least 40% visible
    threshold: 0.40,
  }
);

sections.forEach(section => observer.observe(section));


// ────────────────────────────────────────────────────
//  CLICK HANDLERS
// ────────────────────────────────────────────────────

// Dot click → jump to scene
dots.forEach(dot => {
  dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
});

// [data-scroll-next] → advance one scene (hero arrow only)
document.querySelectorAll('[data-scroll-next]').forEach(btn => {
  btn.addEventListener('click', () => goTo(activeIndex() + 1));
});

// [data-scroll-to="N"] → jump to scene N ("see more ↓" link)
document.querySelectorAll('[data-scroll-to]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    goTo(parseInt(el.dataset.scrollTo));
  });
});


// ────────────────────────────────────────────────────
//  KEYBOARD NAVIGATION  (desktop only)
// ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (isMobile()) return;
  const cur = activeIndex();
  if ((e.key === 'ArrowDown' || e.key === 'PageDown') && cur < sections.length - 1)
    goTo(cur + 1);
  if ((e.key === 'ArrowUp' || e.key === 'PageUp') && cur > 0)
    goTo(cur - 1);
});



let lastMobile = isMobile();
window.addEventListener('resize', () => {
  const nowMobile = isMobile();
  if (nowMobile !== lastMobile) {
    lastMobile = nowMobile;
    goTo(currentMobileIndex || activeIndex());
  }
});


// ────────────────────────────────────────────────────
//  WHEEL SCROLL  (desktop only)
//
//  Strategy: fire goTo() immediately on the first
//  wheel event — zero perceived latency. Then lock
//  for the animation duration. Any scroll that arrives
//  during the lock is accumulated as "pending". Once
//  the animation settles, if there's meaningful pending
//  delta we chain one more jump automatically.
//
//  Result:
//    slow scroll  → 1 section, instant
//    fast scroll  → chains smoothly into 2-3 sections
// ────────────────────────────────────────────────────

let wheelLocked   = false;
let pendingDelta  = 0;
const ANIM_MS     = 700; // matches smooth scroll duration

function fireWheel(deltaY) {
  const dir = deltaY > 0 ? 1 : -1;
  wheelLocked = true;
  goTo(activeIndex() + dir);

  setTimeout(() => {
    wheelLocked = false;
    // Chain if user kept scrolling in the same direction
    if (Math.abs(pendingDelta) > 30) {
      const d = pendingDelta;
      pendingDelta = 0;
      fireWheel(d);
    } else {
      pendingDelta = 0;
    }
  }, ANIM_MS);
}

scroller.addEventListener('wheel', (e) => {
  if (isMobile()) return;
  e.preventDefault();

  if (!wheelLocked) {
    pendingDelta = 0;
    fireWheel(e.deltaY);
  } else {
    // Accumulate while animating — same direction adds up, reversal cancels
    pendingDelta += e.deltaY;
  }
}, { passive: false });


// ────────────────────────────────────────────────────
//  TRAVEL PHOTO ZOOM  (desktop hover)
//
//  Hovering any .fp-photo that contains an <img> fades
//  in a full-screen overlay showing the complete image.
//  Leaving the photo dismisses it.
// ────────────────────────────────────────────────────

const zoomOverlay = document.createElement('div');
zoomOverlay.className = 'fp-zoom-overlay';
const zoomImg = document.createElement('img');
zoomOverlay.appendChild(zoomImg);
document.body.appendChild(zoomOverlay);

document.querySelectorAll('.fp-photo').forEach(photo => {
  const img = photo.querySelector('img');
  if (!img) return;

  let zoomTimer = null;

  photo.addEventListener('mouseenter', () => {
    // Pre-load src immediately so image is ready when overlay appears
    zoomImg.src = img.src;
    zoomImg.alt = img.alt;

    // Wait 1s before showing — cancel if mouse leaves first
    zoomTimer = setTimeout(() => {
      zoomOverlay.classList.add('visible');
    }, 600);
  });

  photo.addEventListener('mouseleave', () => {
    clearTimeout(zoomTimer);
    zoomOverlay.classList.remove('visible');
  });
});