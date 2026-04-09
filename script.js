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
   HEADER — sombra al hacer scroll
   ============================================================ */
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}, { passive: true });
