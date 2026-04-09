import { createNoise2D } from 'simplex-noise';

/* ============================================================
   WAVES BACKGROUND — fondo de ondas interactivo (toda la página)
   ============================================================ */
(function initWaves() {
  const container = document.getElementById('waves-bg');
  if (!container) return;

  const svgNS = 'http://www.w3.org/2000/svg';

  // SVG
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  container.appendChild(svg);

  // Dot cursor
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
      path.setAttribute('stroke', '#ffffff');
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-opacity', '0.18');
      svg.appendChild(path);
      paths.push(path);
      lines.push(points);
    }
  }

  function updateMouse(x, y) {
    // clientX/clientY son correctos para un elemento position:fixed
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
    const t = e.touches[0];
    updateMouse(t.clientX, t.clientY);
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

  const velocidad = borrando ? 60 : 90;
  setTimeout(escribir, velocidad);
}

escribir();

/* ============================================================
   SCROLL REVEAL — secciones y habilidades (bidireccional)
   ============================================================ */
const observerOpciones = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px',
};

const observerSecciones = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
      entrada.target.classList.add('visible');
    } else {
      entrada.target.classList.remove('visible');
    }
  });
}, observerOpciones);

document.querySelectorAll('.reveal').forEach((el) => observerSecciones.observe(el));

const observerSkills = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    const items = entrada.target.querySelectorAll('li');
    if (entrada.isIntersecting) {
      items.forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 70);
      });
    } else {
      items.forEach((item) => item.classList.remove('visible'));
    }
  });
}, observerOpciones);

const skillsList = document.querySelector('.skills-list');
if (skillsList) observerSkills.observe(skillsList);

/* ============================================================
   NAVEGACION ACTIVA — resalta el enlace de la sección visible
   ============================================================ */
const secciones = document.querySelectorAll('section[id]');
const enlacesNav = document.querySelectorAll('nav a');

const observerNav = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
      enlacesNav.forEach((a) => a.classList.remove('activo'));
      const enlaceActivo = document.querySelector(`nav a[href="#${entrada.target.id}"]`);
      if (enlaceActivo) enlaceActivo.classList.add('activo');
    }
  });
}, { threshold: 0.4 });

secciones.forEach((s) => observerNav.observe(s));

/* ============================================================
   HEADER — sombra al hacer scroll + SCROLL PROGRESS BAR
   ============================================================ */
const header = document.querySelector('header');
const scrollProgress = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  // Barra de progreso de scroll
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
  let ringActive = false;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform  = `translate(${mx - 3}px, ${my - 3}px)`;
  });

  // Hover sobre elementos interactivos
  document.querySelectorAll('a, button, .stack-dot').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { ring.classList.remove('hover'); });
  });

  // Press
  window.addEventListener('mousedown', () => ring.classList.add('pressed'));
  window.addEventListener('mouseup',   () => ring.classList.remove('pressed'));

  // Ocultar cursor al salir de la ventana
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });

  (function loopRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx - 15}px, ${ry - 15}px)`;
    requestAnimationFrame(loopRing);
  })();
})();

/* ============================================================
   STACK CAROUSEL — proyectos apilados con swipe horizontal
   ============================================================ */
(function initProjectStack() {
  const stack = document.querySelector('.proyectos-stack');
  if (!stack) return;

  const cards  = [...stack.querySelectorAll('.stack-card')];
  const dots   = [...document.querySelectorAll('.stack-dot')];
  if (cards.length < 2) return;

  const PEEK      = 40;   // px de la siguiente card que asoma debajo
  const THRESHOLD = 80;   // px de arrastre mínimo para cambiar card
  const DEAD_ZONE = 8;    // px antes de activar el drag visual

  let current     = 0;
  let startX      = 0;
  let dragX       = 0;
  let dragging    = false;
  let visualDrag  = false; // drag real superó el dead zone
  let animating   = false;

  /* ---- Altura del contenedor ---- */
  function setHeight() {
    // offsetHeight funciona en elementos absolute con left:0/right:0
    const h = cards[current].offsetHeight;
    stack.style.height = (h + PEEK) + 'px';
  }

  /* ---- Actualiza clases y posición del stack ---- */
  function updateStack() {
    cards.forEach((card, i) => {
      card.classList.remove('is-active', 'is-next', 'is-hidden', 'is-dragging');
      card.style.transform = '';
      card.style.transition = '';
      const offset = (i - current + cards.length) % cards.length;
      if      (offset === 0) card.classList.add('is-active');
      else if (offset === 1) card.classList.add('is-next');
      else                   card.classList.add('is-hidden');
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    setHeight();
  }

  /* ---- Drag ---- */
  function onStart(x) {
    if (animating) return;
    dragging   = true;
    visualDrag = false;
    startX     = x;
    dragX      = 0;
  }

  function onMove(x) {
    if (!dragging) return;
    dragX = x - startX;

    if (!visualDrag && Math.abs(dragX) < DEAD_ZONE) return;
    visualDrag = true;

    // Bloquear scroll táctil horizontal
    const active = cards[current];
    active.classList.add('is-dragging');
    active.style.transition = 'none';

    const angle = dragX * 0.035;
    active.style.transform = `translateX(${dragX}px) rotate(${angle}deg)`;

    // La siguiente card sube a medida que el arrastre aumenta
    const ni       = (current + 1) % cards.length;
    const progress = Math.min(Math.abs(dragX) / THRESHOLD, 1);
    const ny       = PEEK * (1 - progress);
    const ns       = 0.97 + 0.03 * progress;
    cards[ni].style.transition = 'none';
    cards[ni].style.transform  = `translateY(${ny}px) scale(${ns})`;
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    cards[current].classList.remove('is-dragging');

    if (!visualDrag) return; // fue un click, no un drag

    if (Math.abs(dragX) > THRESHOLD) {
      // ---- Swipe consumado: animar la card fuera ----
      animating = true;
      const dir     = dragX > 0 ? 1 : -1;
      const outCard = cards[current];
      outCard.style.transition = 'transform 0.35s ease';
      outCard.style.transform  = `translateX(${dir * 115}%) rotate(${dir * 22}deg) scale(0.75)`;

      setTimeout(() => {
        current = dragX > 0
          ? (current - 1 + cards.length) % cards.length
          : (current + 1) % cards.length;

        // Reset instantáneo de la card saliente (invisible mientras cambia)
        outCard.style.transition = 'none';
        outCard.style.transform  = '';

        updateStack();
        requestAnimationFrame(() => { animating = false; });
      }, 340);

    } else {
      // ---- Snap back ----
      const ease    = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      const ni      = (current + 1) % cards.length;
      cards[current].style.transition = ease;
      cards[current].style.transform  = '';
      cards[ni].style.transition      = ease;
      cards[ni].style.transform       = `translateY(${PEEK}px) scale(0.97)`;

      setTimeout(() => {
        cards[current].style.transition = '';
        cards[ni].style.transition      = '';
        cards[ni].style.transform       = '';
      }, 350);
    }
  }

  /* ---- Event listeners ---- */
  stack.addEventListener('mousedown', e => {
    // Solo botón izquierdo
    if (e.button !== 0) return;
    onStart(e.clientX);
  });
  window.addEventListener('mousemove', e => onMove(e.clientX));
  window.addEventListener('mouseup',   onEnd);

  // Suprimir click en links si hubo drag real
  stack.addEventListener('click', e => {
    if (visualDrag && Math.abs(dragX) > DEAD_ZONE) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  stack.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove',  e => {
    if (dragging && visualDrag) e.preventDefault();
    if (dragging) onMove(e.touches[0].clientX);
  }, { passive: false });
  window.addEventListener('touchend', onEnd);

  // Dots clickables
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (animating || i === current) return;
      current = i;
      updateStack();
    });
  });

  window.addEventListener('resize', setHeight);

  /* ---- Init sin transición ---- */
  cards.forEach(c => { c.style.transition = 'none'; });
  updateStack();
  requestAnimationFrame(() => { cards.forEach(c => { c.style.transition = ''; }); });

  /* ---- Tilt 3D en la card activa ---- */
  stack.addEventListener('mousemove', (e) => {
    const activeCard = cards[current];
    if (!activeCard || activeCard.classList.contains('is-dragging')) return;
    const rect = activeCard.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const nx = (e.clientX - cx) / (rect.width  / 2); // [-1, 1]
    const ny = (e.clientY - cy) / (rect.height / 2); // [-1, 1]
    const MAX = 6;
    activeCard.style.transform  = `perspective(800px) rotateX(${-ny * MAX}deg) rotateY(${nx * MAX}deg)`;
    activeCard.style.transition = 'transform 0.1s ease';
  });

  stack.addEventListener('mouseleave', () => {
    const activeCard = cards[current];
    if (!activeCard) return;
    activeCard.style.transition = 'transform 0.4s ease';
    activeCard.style.transform  = '';
    setTimeout(() => { if (activeCard.style.transform === '') activeCard.style.transition = ''; }, 400);
  });
})();
