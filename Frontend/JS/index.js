/* index.js
   - IntersectionObserver para animaciones on-scroll
   - Carrusel automático infinito (logos) en JS puro
*/

(function(){
  'use strict';

  const track = document.getElementById('logoTrack');
  if (!track) return;

  let offset = 0;
  let baseSpeed = 0.8; // velocidad base
  let speed = baseSpeed;

  // Para un loop perfecto, la sección HTML contiene duplicados de los items
  function getResetPoint(){
    return track.scrollWidth / 2;
  }

  // Pause control: escuchar en el contenedor padre para mayor fiabilidad
  let paused = false;
  const slider = track.closest('.logo-slider');
  if (slider){
    slider.addEventListener('mouseenter', ()=> paused = true);
    slider.addEventListener('mouseleave', ()=> paused = false);
    slider.addEventListener('touchstart', ()=> paused = true);
    slider.addEventListener('touchend', ()=> paused = false);
  }

  // Loop de animación optimizado
  function loop(){
    if (!paused) {
      offset += speed;
      if (offset >= getResetPoint()) offset = 0;
      track.style.transform = `translateX(${-offset}px)`;
    }
    requestAnimationFrame(loop);
  }

  // Ajustar velocidad según ancho pantalla
  function adaptSpeed(){ speed = window.innerWidth < 720 ? baseSpeed * 1.1 : baseSpeed; }
  window.addEventListener('resize', adaptSpeed);
  adaptSpeed();
  requestAnimationFrame(loop);

  // Elementos de la flota
  const fleetBtns = document.querySelectorAll('.fleet-controls .fleet-btn');
  const descriptionContainer = document.getElementById('fleetDescription');

  // Descripciones para cada categoría
  const descriptions = {
    1: "Los vehículos económicos son perfectos para quienes buscan una opción asequible sin comprometer la calidad. Perfectos para viajes cortos o urbanos.",
    2: "Los vehículos compactos ofrecen una excelente maniobrabilidad y eficiencia de combustible. Ideales para quienes necesitan un coche ágil en la ciudad.",
    3: "Vehículos medianos que combinan confort y espacio. Perfectos para quienes buscan más comodidad sin sacrificar la eficiencia.",
    4: "Los SUVs ofrecen más espacio, mayor visibilidad y capacidades todoterreno. Ideales para aventuras familiares o viajes largos.",
    5: "Los vehículos de lujo están diseñados para quienes buscan confort, rendimiento y tecnología avanzada en cada viaje.",
    6: "Los deportivos son para los amantes de la velocidad y el diseño agresivo. Estos vehículos ofrecen emociones fuertes y un rendimiento impresionante.",
    7: "Vehículos familiares, perfectos para viajes largos y cómodos con espacio para todos. Equipados con todas las comodidades para tu familia.",
    8: "Las furgonetas son ideales para transportar más personas o carga. Perfectas para viajes en grupo o mudanzas.",
    9: "Las camionetas son vehículos de gran capacidad, ideales para quienes necesitan potencia y espacio para trabajos pesados o aventuras al aire libre.",
    10: "Los vehículos eléctricos ofrecen una conducción ecológica, silenciosa y de bajo mantenimiento. Perfectos para un estilo de vida más sostenible.",
    11: "Los híbridos combinan lo mejor de ambos mundos: eficiencia de combustible y menor impacto ambiental, con un rendimiento impresionante.",
    12: "Los cabriolets ofrecen una experiencia de conducción al aire libre, combinando lujo y diversión para quienes disfrutan del viento mientras conducen."
  };

  // Función para mostrar la descripción de la categoría seleccionada
  function showDescription(catId) {
    if (descriptionContainer) {
      // Añadir una animación para la transición de la descripción
      descriptionContainer.classList.remove('fade-in');
      setTimeout(() => {
        descriptionContainer.innerHTML = `<p>${descriptions[catId]}</p>`;
        descriptionContainer.classList.add('fade-in');
      }, 300);  // Tiempo de espera antes de cambiar el contenido
    }
  }

  // Asignar eventos a los botones de la flota
  fleetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Desactivar todos los botones
      fleetBtns.forEach(b => b.classList.remove('active'));
      // Activar el botón seleccionado
      btn.classList.add('active');
      // Obtener el ID de la categoría y mostrar la descripción
      const catId = btn.getAttribute('data-cat');
      showDescription(catId);
    });
  });

  // Inicializar la primera categoría (por defecto)
  showDescription(1);

})();

// ===== Animaciones on-scroll y comportamientos adicionales =====
(function(){
  'use strict';

  // Revelar elementos con la clase .animate
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if (en.isIntersecting) {
        en.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.animate').forEach(el=> io.observe(el));

  // Marcar logos como lazy para reducir carga inicial
  document.querySelectorAll('.logo-img').forEach(img => { try { img.loading = 'lazy'; } catch(e){} });

  // FEATURES: lazy-load y cálculo de luminancia solo cuando la sección entra en viewport
  const featureCards = Array.from(document.querySelectorAll('.feature-card'));

  function loadFeatureCard(card) {
    const media = card.querySelector('.feature-media');
    const imgPath = card.getAttribute('data-img');
    if (!imgPath || !media) { card.classList.add('feature-contrast'); return; }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgPath;
    img.onload = () => {
      try {
        media.style.backgroundImage = `url('${imgPath}')`;
        // pequeño muestreo en canvas para determinar brillo medio
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const w = 10, h = 10; canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; count++; }
        r = r / count; g = g / count; b = b / count;
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        let threshold = 150;
        try { const cssVal = getComputedStyle(document.documentElement).getPropertyValue('--feature-luminance-threshold'); const parsed = parseInt(cssVal, 10); if (!isNaN(parsed)) threshold = parsed; } catch (e) {}
        if (luminance < threshold) card.classList.add('feature-dark'); else card.classList.add('feature-light');
      } catch (err) {
        card.classList.add('feature-contrast');
      }
    };
    img.onerror = () => { card.classList.add('feature-contrast'); };
  }

  if ('IntersectionObserver' in window) {
    const featuresSection = document.getElementById('features');
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          featureCards.forEach(c => loadFeatureCard(c));
          observer.disconnect();
        }
      });
    }, { root: null, rootMargin: '0px 0px 160px 0px', threshold: 0.12 });
    if (featuresSection) obs.observe(featuresSection); else featureCards.forEach(c => loadFeatureCard(c));
  } else {
    featureCards.forEach(c => loadFeatureCard(c));
  }

  // FLEET: galería dinámica por categoría
  const fleetBtns = document.querySelectorAll('.fleet-controls .fleet-btn');
  const gallery = document.getElementById('fleetGallery');

  // helper: convierte string csv a array y limpia
  function parseImages(txt){ if(!txt) return []; return txt.split(',').map(s=>s.trim()).filter(Boolean); }

  function renderGallery(images){
    if(!gallery) return;
    gallery.innerHTML = '';
    if(!images || images.length===0){
      gallery.innerHTML = '<div class="muted">No hay imágenes asignadas. Añade rutas en el atributo data-images del botón.</div>';
      return;
    }
    images.forEach(src=>{
      const img = document.createElement('img'); img.src = src; img.alt = ''; img.loading = 'lazy';
      gallery.appendChild(img);
    });
  }

  fleetBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      fleetBtns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const csv = btn.getAttribute('data-images') || '';
      const imgs = parseImages(csv);
      renderGallery(imgs);
    });
  });

  // Inicializar galería con el botón activo o el primero
  const active = document.querySelector('.fleet-controls .fleet-btn.active') || document.querySelector('.fleet-controls .fleet-btn');
  if (active){ const imgs = parseImages(active.getAttribute('data-images') || ''); renderGallery(imgs); }

})();

// ===== GSAP: ejemplos de animación (si GSAP está cargado) =====
document.addEventListener('DOMContentLoaded', function () {
  if (!window.gsap) return;
  try { gsap.registerPlugin(ScrollTrigger); } catch (e) { }

  // Animar CTA principal si existe
  const cta = document.querySelector('.cta-car') || document.querySelector('.cta');
  if (cta) {
    gsap.from(cta, {
      x: 120, opacity: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: cta, start: 'top 85%' }
    });
  }

  // Animar elementos marcados para GSAP reveal
  document.querySelectorAll('.gsap-reveal').forEach(el => {
    gsap.from(el, {
      y: 30, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%' }
    });
  });

  // Animación secuencial de las imágenes dentro de la sección FEATURES
  const featuresSection = document.getElementById('features');
  const featureMedias = document.querySelectorAll('#features .feature-card .feature-media');
  if (featuresSection && featureMedias.length) {
    try {
      gsap.fromTo(featureMedias, {
        opacity: 0,
        scale: 1.06,
        y: 18
      }, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.18,
        scrollTrigger: {
          trigger: featuresSection,
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      });

      // También animar el contenido de cada tarjeta ligeramente (texto/icono)
      gsap.from('#features .feature-card .icon, #features .feature-card h3, #features .feature-card p', {
        y: 18,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: featuresSection,
          start: 'top 76%'
        }
      });
    } catch (e) {
      console.warn('GSAP features animation error', e);
    }
  }
});