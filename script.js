/* ============================================================
   BACKGROUND PATHS — trayectorias SVG animadas en el hero
   ============================================================ */
(function initBackgroundPaths() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const hero = document.getElementById('hero');
  if (!hero) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'bg-paths-wrapper';
  hero.insertBefore(wrapper, hero.firstChild);

  function createPathsSVG(position) {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 696 316');
    svg.setAttribute('fill', 'none');

    for (let i = 0; i < 36; i++) {
      const p = position;
      const d = [
        `M-${380 - i * 5 * p} -${189 + i * 6}`,
        `C-${380 - i * 5 * p} -${189 + i * 6}`,
        `-${312 - i * 5 * p} ${216 - i * 6}`,
        `${152 - i * 5 * p} ${343 - i * 6}`,
        `C${616 - i * 5 * p} ${470 - i * 6}`,
        `${684 - i * 5 * p} ${875 - i * 6}`,
        `${684 - i * 5 * p} ${875 - i * 6}`,
      ].join(' ');

      const strokeOpacity = 0.1 + i * 0.03;
      const strokeWidth   = 0.5 + i * 0.03;
      const duration      = 20 + Math.random() * 10;
      const delay         = -(Math.random() * duration);

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', 'white');
      path.setAttribute('stroke-width', String(strokeWidth));
      path.setAttribute('stroke-opacity', String(strokeOpacity));
      path.setAttribute('fill', 'none');
      path.setAttribute('pathLength', '1');
      path.style.strokeDasharray = '0.3 0.7';
      path.style.animation =
        `bgPathFlow ${duration.toFixed(1)}s linear ${delay.toFixed(1)}s infinite`;

      svg.appendChild(path);
    }

    return svg;
  }

  wrapper.appendChild(createPathsSVG(1));
  wrapper.appendChild(createPathsSVG(-1));
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
      // Pausa antes de borrar
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
   SCROLL REVEAL — secciones y habilidades
   ============================================================ */
const observerOpciones = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px',
};

// Revela secciones con clase .reveal
const observerSecciones = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
      entrada.target.classList.add('visible');
      observerSecciones.unobserve(entrada.target);
    }
  });
}, observerOpciones);

document.querySelectorAll('.reveal').forEach((el) => observerSecciones.observe(el));

// Revela los tags de habilidades con retraso escalonado
const observerSkills = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada) => {
    if (entrada.isIntersecting) {
      const items = entrada.target.querySelectorAll('li');
      items.forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 70);
      });
      observerSkills.unobserve(entrada.target);
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
