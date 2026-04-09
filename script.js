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
   CARRUSEL HORIZONTAL — proyectos
   ============================================================ */
(function initCarousel() {
  const track       = document.querySelector('.carousel-track');
  const prevBtn     = document.querySelector('.carousel-prev');
  const nextBtn     = document.querySelector('.carousel-next');
  const indicators  = [...document.querySelectorAll('.carousel-indicator')];
  if (!track || !prevBtn || !nextBtn) return;

  const slides = [...track.children];
  let current  = 0;

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    indicators.forEach((dot, i) => dot.classList.toggle('active', i === current));
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  indicators.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // Swipe táctil
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) goTo(current + (diff > 0 ? 1 : -1));
  });

  goTo(0);
})();

/* ============================================================
   ORBITING SKILLS — habilidades orbitando
   ============================================================ */
(function initOrbitingSkills() {
  const container = document.getElementById('orbiting-skills');
  if (!container) return;

  /* SVG de cada tecnología */
  function getSkillSVG(id) {
    const svgs = {
      html: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z" fill="#E34F26"/></svg>`,
      css:  `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.751L12 19.351l5.379-1.443.744-8.157z" fill="#1572B6"/></svg>`,
      js:   `<svg viewBox="0 0 24 24" style="width:100%;height:100%"><rect width="24" height="24" fill="#F7DF1E"/><path d="M22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z" fill="#323330"/></svg>`,
      react:`<svg viewBox="0 0 24 24" fill="none" style="width:100%;height:100%"><g stroke="#61DAFB" stroke-width="1" fill="none"><circle cx="12" cy="12" r="2.05" fill="#61DAFB"/><ellipse cx="12" cy="12" rx="11" ry="4.2"/><ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="11" ry="4.2" transform="rotate(120 12 12)"/></g></svg>`,
      node: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.602.065-.037.151-.023.218.017l2.256 1.339c.082.045.198.045.275 0l8.795-5.076c.082-.047.135-.141.135-.241V6.921c0-.103-.055-.198-.137-.246l-8.791-5.072c-.081-.047-.189-.047-.273 0L2.075 6.675c-.084.048-.139.144-.139.246v10.146c0 .1.055.194.139.241l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551L1.352 18.675C.533 18.215 0 17.352 0 16.43V6.284c0-.922.533-1.786 1.352-2.245L10.147.963c.8-.452 1.866-.452 2.657 0l8.796 5.002c.819.459 1.352 1.323 1.352 2.245v10.146c0 .922-.533 1.783-1.352 2.245l-8.796 5.078c-.28.163-.601.247-.926.247zm2.717-6.993c-3.849 0-4.654-1.766-4.654-3.246 0-.14.114-.253.256-.253h1.136c.127 0 .232.091.252.215.173 1.164.686 1.752 3.01 1.752 1.852 0 2.639-.419 2.639-1.401 0-.566-.224-1.03-3.099-1.249-2.404-.184-3.89-.768-3.89-2.689 0-1.771 1.491-2.825 3.991-2.825 2.808 0 4.199.975 4.377 3.068.007.072-.019.141-.065.193-.047.049-.111.077-.178.077h-1.14c-.119 0-.225-.083-.248-.196-.276-1.224-.944-1.616-2.746-1.616-2.023 0-2.259.705-2.259 1.234 0 .641.278.827 3.006 1.19 2.7.359 3.982.866 3.982 2.771 0 1.922-1.603 3.024-4.399 3.024z" fill="#339933"/></svg>`,
      tw:   `<svg viewBox="0 0 24 24" fill="currentColor" style="width:100%;height:100%"><path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" fill="#06B6D4"/></svg>`,
    };
    return svgs[id] || '';
  }

  /* Calcula los radios según el tamaño real del contenedor */
  function getRadii() {
    const w = container.offsetWidth;
    const scale = Math.min(1, w / 420);
    return { inner: Math.round(100 * scale), outer: Math.round(180 * scale) };
  }

  const SKILLS = [
    { id: 'html',  orbit: 'inner', size: 40, speed: 1,    phase: 0,                    label: 'HTML5',       glow: '#E34F26' },
    { id: 'css',   orbit: 'inner', size: 44, speed: 1,    phase: (2*Math.PI)/3,        label: 'CSS3',        glow: '#1572B6' },
    { id: 'js',    orbit: 'inner', size: 40, speed: 1,    phase: (4*Math.PI)/3,        label: 'JavaScript',  glow: '#F7DF1E' },
    { id: 'react', orbit: 'outer', size: 48, speed: -0.6, phase: 0,                    label: 'React',       glow: '#61DAFB' },
    { id: 'node',  orbit: 'outer', size: 44, speed: -0.6, phase: (2*Math.PI)/3,        label: 'Node.js',     glow: '#339933' },
    { id: 'tw',    orbit: 'outer', size: 40, speed: -0.6, phase: (4*Math.PI)/3,        label: 'Tailwind CSS',glow: '#06B6D4' },
  ];

  /* Crear elementos DOM */
  const skillEls = SKILLS.map(s => {
    const wrapper = document.createElement('div');
    wrapper.className = 'orbit-skill';
    wrapper.style.width  = s.size + 'px';
    wrapper.style.height = s.size + 'px';

    const inner = document.createElement('div');
    inner.className = 'orbit-skill-inner';
    inner.innerHTML  = getSkillSVG(s.id);
    inner.style.setProperty('--glow', s.glow);

    const label = document.createElement('div');
    label.className   = 'orbit-skill-label';
    label.textContent = s.label;

    wrapper.appendChild(inner);
    wrapper.appendChild(label);
    container.appendChild(wrapper);

    // Glow al hover
    wrapper.addEventListener('mouseenter', () => {
      inner.style.boxShadow = `0 0 20px ${s.glow}60, 0 0 40px ${s.glow}25`;
    });
    wrapper.addEventListener('mouseleave', () => {
      inner.style.boxShadow = '';
    });

    return { el: wrapper, ...s };
  });

  let time     = 0;
  let lastTime = null;
  let paused   = false;

  container.addEventListener('mouseenter', () => { paused = true;  });
  container.addEventListener('mouseleave', () => { paused = false; });

  function tick(now) {
    if (lastTime !== null && !paused) {
      time += (now - lastTime) / 1000;
    }
    lastTime = now;

    const { inner: IR, outer: OR } = getRadii();

    skillEls.forEach(s => {
      const r     = s.orbit === 'inner' ? IR : OR;
      const angle = time * s.speed + s.phase;
      const x     = Math.cos(angle) * r;
      const y     = Math.sin(angle) * r;
      s.el.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

