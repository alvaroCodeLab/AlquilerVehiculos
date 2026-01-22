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

})();