document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('filters-form');
  const btnClear = document.getElementById('btn-clear');
  const listEl = document.getElementById('vehicles-list');

  function buildQuery(){
    const tipo = document.getElementById('f-tipo').value.trim();
    const cambio = document.getElementById('f-cambio').value.trim();
    const motor = document.getElementById('f-motor').value.trim();
    const plazas = document.getElementById('f-plazas').value.trim();
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (cambio) params.append('cambio', cambio);
    if (motor) params.append('motor', motor);
    if (plazas) params.append('plazas', plazas);
    return params.toString();
  }

  async function fetchVehicles(){
    listEl.innerHTML = '<div class="loading">Cargando vehículos...</div>';
    try{
      const q = buildQuery();
      const res = await fetch('/Proyecto_Vehiculos/Backend/PHP/vehiculos.php'+(q?('?'+q):''));
      const data = await res.json();
      if (!data.success){ listEl.innerHTML = '<div class="loading">Error al cargar</div>'; return; }
      renderVehicles(data.data);
    }catch(e){ console.error(e); listEl.innerHTML = '<div class="loading">Error de red</div>'; }
  }

  function renderVehicles(items){
    if (!items || items.length === 0){ listEl.innerHTML = '<div class="loading">No se han encontrado vehículos.</div>'; return; }
    const grid = document.createElement('div'); grid.className = 'vehicles-grid';
    items.forEach(v=>{
      const card = document.createElement('article'); card.className = 'veh-card';
      const media = document.createElement('div'); media.className = 'veh-media';
      const img = document.createElement('img'); img.src = v.imagen || '../../SRC/IMG/placeholder-car.png'; img.alt = v.marca + ' ' + v.modelo;
      media.appendChild(img);
      const body = document.createElement('div'); body.className = 'veh-body';
      body.innerHTML = `<h3 class="veh-title">${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}</h3>
        <div class="veh-meta">Tipo: ${escapeHtml(v.tipo)} · Cambio: ${escapeHtml(v.cambio)} · Motor: ${escapeHtml(v.motor)}</div>
        <div class="veh-features">${escapeHtml(v.caracteristicas || '')}</div>
        <div class="veh-actions"><div class="price">€ ${Number(v.precio).toFixed(2)}</div><button class="btn-primary" type="button">Reservar vehículo</button></div>`;
      card.appendChild(media); card.appendChild(body); grid.appendChild(card);
    });
    listEl.innerHTML = ''; listEl.appendChild(grid);
  }

  function escapeHtml(s){ if (s==null) return ''; return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  // listeners
  form.addEventListener('change', function(){ fetchVehicles(); });
  btnClear.addEventListener('click', function(){ form.reset(); fetchVehicles(); });

  // initial load
  fetchVehicles();
});
