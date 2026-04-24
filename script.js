import { createNoise2D } from 'simplex-noise';

/* ============================================================
   WAVES BACKGROUND — fondo de ondas interactivo (toda la página)
   ============================================================ */
(function initWaves() {
  const container = document.getElementById('waves-bg');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  container.appendChild(svg);

  const dot = document.createElement('div');
  dot.className = 'waves-dot';
  container.appendChild(dot);

  const noise2D = createNoise2D();
  let paths = [];
  let lines = [];
  let bounding = null;

  const mouse = {
    x: -10, y: 0,
    lx: 0,  ly: 0,
    sx: 0,  sy: 0,
    v: 0, vs: 0, a: 0,
    set: false,
  };

  function setSize() {
    bounding = container.getBoundingClientRect();
    svg.style.width  = bounding.width  + 'px';
    svg.style.height = bounding.height + 'px';
  }

  function setLines() {
    if (!bounding) return;
    const { width, height } = bounding;

    paths.forEach(p => p.remove());
    paths = [];
    lines = [];

    const xGap = 8;
    const yGap = 8;
    const oWidth  = width + 200;
    const oHeight = height + 30;
    const totalLines  = Math.ceil(oWidth  / xGap);
    const totalPoints = Math.ceil(oHeight / yGap);
    const xStart = (width  - xGap * totalLines)  / 2;
    const yStart = (height - yGap * totalPoints) / 2;

    for (let i = 0; i < totalLines; i++) {
      const points = [];
      for (let j = 0; j < totalPoints; j++) {
        points.push({
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave:   { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        });
      }

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#818cf8');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-opacity', '0.13');
      svg.appendChild(path);
      paths.push(path);
      lines.push(points);
    }
  }

  function updateMouse(x, y) {
    mouse.x = x - bounding.left;
    mouse.y = y - bounding.top;
    if (!mouse.set) {
      mouse.sx = mouse.x; mouse.sy = mouse.y;
      mouse.lx = mouse.x; mouse.ly = mouse.y;
      mouse.set = true;
    }
    container.style.setProperty('--x', mouse.sx + 'px');
    container.style.setProperty('--y', mouse.sy + 'px');
  }

  function movePoints(time) {
    lines.forEach(points => {
      points.forEach(p => {
        const move = noise2D(
          (p.x + time * 0.008) * 0.003,
          (p.y + time * 0.003) * 0.002
        ) * 8;

        p.wave.x = Math.cos(move) * 12;
        p.wave.y = Math.sin(move) * 6;

        const dx = p.x - mouse.sx;
        const dy = p.y - mouse.sy;
        const d  = Math.hypot(dx, dy);
        const l  = Math.max(175, mouse.vs);

        if (d < l) {
          const s = 1 - d / l;
          const f = Math.cos(d * 0.001) * s;
          p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035;
          p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035;
        }

        p.cursor.vx += (0 - p.cursor.x) * 0.01;
        p.cursor.vy += (0 - p.cursor.y) * 0.01;
        p.cursor.vx *= 0.95;
        p.cursor.vy *= 0.95;
        p.cursor.x  += p.cursor.vx;
        p.cursor.y  += p.cursor.vy;
        p.cursor.x = Math.min(50, Math.max(-50, p.cursor.x));
        p.cursor.y = Math.min(50, Math.max(-50, p.cursor.y));
      });
    });
  }

  function moved(point, withCursor = true) {
    return {
      x: point.x + point.wave.x + (withCursor ? point.cursor.x : 0),
      y: point.y + point.wave.y + (withCursor ? point.cursor.y : 0),
    };
  }

  function drawLines() {
    lines.forEach((points, i) => {
      if (points.length < 2 || !paths[i]) return;
      const first = moved(points[0], false);
      let d = `M ${first.x} ${first.y}`;
      for (let j = 1; j < points.length; j++) {
        const c = moved(points[j]);
        d += ` L ${c.x} ${c.y}`;
      }
      paths[i].setAttribute('d', d);
    });
  }

  function tick(time) {
    mouse.sx += (mouse.x - mouse.sx) * 0.1;
    mouse.sy += (mouse.y - mouse.sy) * 0.1;

    const dx = mouse.x - mouse.lx;
    const dy = mouse.y - mouse.ly;
    const d  = Math.hypot(dx, dy);
    mouse.v   = d;
    mouse.vs += (d - mouse.vs) * 0.1;
    mouse.vs  = Math.min(100, mouse.vs);
    mouse.lx  = mouse.x;
    mouse.ly  = mouse.y;
    mouse.a   = Math.atan2(dy, dx);

    container.style.setProperty('--x', mouse.sx + 'px');
    container.style.setProperty('--y', mouse.sy + 'px');

    movePoints(time);
    drawLines();
    requestAnimationFrame(tick);
  }

  setSize();
  setLines();
  requestAnimationFrame(tick);

  window.addEventListener('resize', () => { setSize(); setLines(); });
  window.addEventListener('mousemove', e => updateMouse(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => {
    e.preventDefault();
    updateMouse(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
})();

/* ============================================================
   EFECTO DE ESCRITURA — hero subtitle
   ============================================================ */
const frases = [
  'Desarrollo Web',
  'Next.js & React',
  'TypeScript',
  'Apps Full Stack',
  'Apasionado del software',
];

let fraseActual = 0;
let charActual = 0;
let borrando = false;
const elementoTyping = document.getElementById('typing-text');

function escribir() {
  const frase = frases[fraseActual];

  if (!borrando) {
    elementoTyping.textContent = frase.slice(0, charActual + 1);
    charActual++;
    if (charActual === frase.length) {
      setTimeout(() => { borrando = true; }, 1800);
      setTimeout(escribir, 2200);
      return;
    }
  } else {
    elementoTyping.textContent = frase.slice(0, charActual - 1);
    charActual--;
    if (charActual === 0) {
      borrando = false;
      fraseActual = (fraseActual + 1) % frases.length;
    }
  }

  setTimeout(escribir, borrando ? 60 : 90);
}

escribir();

/* ============================================================
   OBSERVERS — scroll reveal, nav activa, stagger
   ============================================================ */
const observerOpts = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' };

// Reveal de secciones (bidireccional)
const observerSecciones = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => e.target.classList.toggle('visible', e.isIntersecting));
}, observerOpts);

document.querySelectorAll('.reveal').forEach((el) => observerSecciones.observe(el));

// Navegación activa
const observerNav = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (!entrada.isIntersecting) return;
    document.querySelectorAll('nav a').forEach((a) => a.classList.remove('activo'));
    const enlace = document.querySelector(`nav a[href="#${entrada.target.id}"]`);
    if (enlace) enlace.classList.add('activo');
  });
}, { threshold: 0.4 });

document.querySelectorAll('section[id]').forEach((s) => observerNav.observe(s));

// Helper reutilizable: anima hijos con retraso escalonado al entrar en viewport
function createStaggerObserver(childSelector, delay, opts = {}) {
  return new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      const items = [...entrada.target.querySelectorAll(childSelector)];
      if (entrada.isIntersecting) {
        items.forEach((item, i) => setTimeout(() => item.classList.add('visible'), i * delay));
      } else {
        items.forEach((item) => item.classList.remove('visible'));
      }
    });
  }, { ...observerOpts, ...opts });
}

const skillsList = document.querySelector('.skills-list');
if (skillsList) createStaggerObserver('li', 70).observe(skillsList);

const testimoniosGrid = document.querySelector('.testimonios-grid');
if (testimoniosGrid) createStaggerObserver('.testimonio-card', 180, { threshold: 0.08 }).observe(testimoniosGrid);

/* ============================================================
   HEADER — sombra al hacer scroll + SCROLL PROGRESS BAR
   ============================================================ */
const header = document.querySelector('header');
const scrollProgress = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);

  if (scrollProgress) {
    const total = document.body.scrollHeight - window.innerHeight;
    scrollProgress.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  }
}, { passive: true });

/* ============================================================
   ANIMACION DE LETRAS — nombre en hero (spring stagger)
   ============================================================ */
(function initLetterAnimation() {
  const nombreEl = document.querySelector('.hero-nombre');
  if (!nombreEl) return;

  const texto = nombreEl.textContent;
  nombreEl.textContent = '';

  texto.split('').forEach((char, i) => {
    if (char === ' ') {
      nombreEl.appendChild(document.createTextNode(' '));
      return;
    }
    const span = document.createElement('span');
    span.className = 'letter';
    span.textContent = char;
    span.style.animationDelay = (0.75 + i * 0.05) + 's';
    nombreEl.appendChild(span);
  });
})();

/* ============================================================
   CURSOR PERSONALIZADO — dot inmediato + ring con lerp
   ============================================================ */
(function initCustomCursor() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
  });

  document.querySelectorAll('a, button, .stack-dot').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });

  window.addEventListener('mousedown', () => ring.classList.add('pressed'));
  window.addEventListener('mouseup',   () => ring.classList.remove('pressed'));

  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });

  (function loopRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx - 15}px, ${ry - 15}px)`;
    requestAnimationFrame(loopRing);
  })();
})();

/* ============================================================
   CARRUSEL HORIZONTAL — proyectos con tilt 3D
   ============================================================ */
(function initCarousel() {
  const track      = document.querySelector('.carousel-track');
  const prevBtn    = document.querySelector('.carousel-prev');
  const nextBtn    = document.querySelector('.carousel-next');
  const viewport   = document.querySelector('.carousel-viewport');
  const indicators = [...document.querySelectorAll('.carousel-indicator')];
  if (!track || !prevBtn || !nextBtn) return;

  const slides = [...track.children];
  let current  = 0;

  function resetTilt(slide) {
    if (!slide) return;
    slide.style.transition = 'transform 0.4s ease';
    slide.style.transform  = '';
  }

  function goTo(index) {
    resetTilt(slides[current]);
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    indicators.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  indicators.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
  });

  if (viewport) {
    viewport.addEventListener('mousemove', e => {
      const slide = slides[current];
      if (!slide) return;
      const rect = slide.getBoundingClientRect();
      const nx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
      const ny = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
      slide.style.transition = 'transform 0.08s ease';
      slide.style.transform  = `perspective(900px) rotateX(${-ny * 5}deg) rotateY(${nx * 5}deg)`;
    });

    viewport.addEventListener('mouseleave', () => resetTilt(slides[current]));
  }

  goTo(0);
})();
