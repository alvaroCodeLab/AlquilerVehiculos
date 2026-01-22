// admin.js - lógica básica del panel de administración
document.addEventListener('DOMContentLoaded', function(){
  // Navegación entre secciones
  document.querySelectorAll('.sidebar nav a[data-section]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      document.querySelectorAll('.sidebar nav a').forEach(x=>x.classList.remove('active'));
      a.classList.add('active');
      const section = a.getAttribute('data-section');
      document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
      const el = document.getElementById('section-' + section);
      if (el) el.classList.add('active');
      // carga dinámica
      if (section === 'vehicles') loadVehicles();
      if (section === 'users') loadUsers();
    });
  });

  // Inicializar dashboard counts
  fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_vehicles.php').then(r=>r.json()).then(res=>{
    if (res.success) document.getElementById('count-vehicles').textContent = res.data.length;
  }).catch(()=>{});
  fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_users.php').then(r=>r.json()).then(res=>{
    if (res.success) document.getElementById('count-users').textContent = res.data.length;
  }).catch(()=>{});

  // carga inicial de chart demo -> ahora desde endpoint api_stats.php
  const ctx = document.getElementById('chartIncome');
  if (ctx) {
    fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_stats.php').then(r=>r.json()).then(res=>{
      if (!res) return;
      const ingresos = (res.data.ingresos_mensuales || []).slice().reverse();
      const labels = ingresos.map(i=>i.mes);
      const data = ingresos.map(i=>parseFloat(i.total_ingresos));
      new Chart(ctx, {type:'line',data:{labels:labels,datasets:[{label:'Ingresos',data:data,backgroundColor:'rgba(11,61,145,0.08)',borderColor:'#0b3d91',fill:true}]},options:{responsive:true}});
      // Totales
      if (res.data.totales){
        document.getElementById('count-vehicles').textContent = res.data.totales.total_vehiculos || 0;
        document.getElementById('count-users').textContent = res.data.totales.total_users || 0;
        document.getElementById('count-reservas').textContent = res.data.totales.total_reservas || 0;
      }
    }).catch(()=>{
      // fallback demo
      new Chart(ctx, {type:'bar',data:{labels:['2025-08','2025-09','2025-10','2025-11'],datasets:[{label:'Ingresos',data:[1200,2300,1800,2700],backgroundColor:'#0b3d91'}]}});
    });
  }

  // funciones
  window.loadVehicles = function(){
    const container = document.getElementById('vehicles-list');
    container.innerHTML = 'Cargando...';
    fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_vehicles.php').then(r=>r.json()).then(res=>{
      if (!res.success) { container.innerHTML = 'Error'; return; }
      const rows = res.data;
      let html = '<table class="table"><thead><tr><th>ID</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Precio/día</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
      rows.forEach(r=>{
        html += `<tr><td>${r.id_vehiculo}</td><td>${r.marca}</td><td>${r.modelo}</td><td>${r.anio||''}</td><td>${r.precio_dia}</td><td>${r.estado}</td><td><button data-id="${r.id_vehiculo}" class="btn-edit">Editar</button> <button data-id="${r.id_vehiculo}" class="btn-del">Eliminar</button></td></tr>`;
      });
      html += '</tbody></table>';
      container.innerHTML = html;

      // enlazar botones Editar / Eliminar
      container.querySelectorAll('.btn-edit').forEach(b=>{
        b.addEventListener('click', ()=>{
          const id = b.getAttribute('data-id');
          const data = rows.find(rr=>rr.id_vehiculo == id);
          openVehicleModal(data);
        });
      });
      container.querySelectorAll('.btn-del').forEach(b=>{
        b.addEventListener('click', ()=>{
          const id = b.getAttribute('data-id');
          if (!confirm('¿Eliminar vehículo #'+id+'?')) return;
          const fd = new FormData(); fd.append('action','delete'); fd.append('id', id);
          const meta = document.querySelector('meta[name="csrf-token"]'); if (meta) fd.append('csrf_token', meta.getAttribute('content'));
          fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_vehicles.php', {method:'POST', body: fd}).then(r=>r.json()).then(resp=>{
            if (resp.success) { showToast('Vehículo eliminado', 'success'); loadVehicles(); } else showToast('Error al eliminar: '+(resp.message||resp.error||''), 'error');
          });
        });
      });
    }).catch(err=>{ container.innerHTML = 'Error al cargar'; });
  };

  // abrir modal para nuevo/editar
  function openVehicleModal(data){
    document.getElementById('veh-modal').style.display = 'flex';
    document.getElementById('veh-modal-title').textContent = data ? ('Editar vehículo #'+data.id_vehiculo) : 'Nuevo vehículo';
    document.getElementById('veh-id').value = data ? data.id_vehiculo : '';
    document.getElementById('veh-marca').value = data ? data.marca : '';
    document.getElementById('veh-modelo').value = data ? data.modelo : '';
    document.getElementById('veh-anio').value = data ? data.anio : '';
    document.getElementById('veh-matricula').value = data ? data.matricula : '';
    document.getElementById('veh-precio').value = data ? data.precio_dia : '';
    document.getElementById('veh-cat').value = data ? data.id_categoria : '';
    document.getElementById('veh-estado').value = data ? data.estado : 'disponible';
    document.getElementById('veh-desc').value = data ? (data.descripcion||'') : '';
    document.getElementById('veh-imagen').value = null;
    // cargar categorías y seleccionar
    loadCategories().then(()=>{
      if (data && data.id_categoria) document.getElementById('veh-cat').value = data.id_categoria;
    }).catch(()=>{});

    // mostrar imagen existente si la hay
    const previewImg = document.getElementById('veh-preview-img');
    const previewEmpty = document.getElementById('veh-preview-empty');
    const previewName = document.getElementById('veh-preview-filename');
    if (data && data.imagen){
      previewImg.src = data.imagen;
      previewImg.style.display = 'block';
      previewEmpty.style.display = 'none';
      previewName.textContent = data.imagen.split('/').pop();
    } else {
      previewImg.src = '';
      previewImg.style.display = 'none';
      previewEmpty.style.display = 'block';
      previewName.textContent = '';
    }
  }
  function closeVehicleModal(){ document.getElementById('veh-modal').style.display = 'none'; }

  // enlazar botones modal globales
  document.addEventListener('click', function(e){
    if (e.target && e.target.id === 'btn-add-vehicle') openVehicleModal(null);
    if (e.target && e.target.id === 'veh-close') closeVehicleModal();
    if (e.target && e.target.id === 'veh-cancel') { e.preventDefault(); closeVehicleModal(); }
  });

  // submit del form de vehículo
  const vehForm = document.getElementById('veh-form');
  if (vehForm) vehForm.addEventListener('submit', function(evt){
    evt.preventDefault();
    const fd = new FormData(vehForm);
    // adjuntar token CSRF si está disponible
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) fd.append('csrf_token', meta.getAttribute('content'));
    // si trae id => actualización (API soporta update via POST con id)
    fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_vehicles.php', {method:'POST', body: fd}).then(r=>r.json()).then(resp=>{
      if (resp.success){ closeVehicleModal(); loadVehicles(); showToast('Guardado correctamente', 'success'); }
      else showToast('Error: ' + (resp.error || resp.message || ''), 'error'); 
    }).catch(err=>{ showToast('Error de red', 'error'); });
  });

  // cargar categorías desde API y rellenar select
  function loadCategories(){
    return fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_categorias.php').then(r=>r.json()).then(res=>{
      if (!res.success) return Promise.reject();
      const sel = document.getElementById('veh-cat');
      if (!sel) return Promise.resolve();
      sel.innerHTML = '';
      sel.insertAdjacentHTML('beforeend','<option value="">-- Seleccionar categoría --</option>');
      res.data.forEach(c=>{
        sel.insertAdjacentHTML('beforeend', `<option value="${c.id_categoria}">${c.nombre_categoria}</option>`);
      });
      return Promise.resolve();
    });
  }

  // preview de imagen al seleccionar archivo
  const inputImg = document.getElementById('veh-imagen');
  if (inputImg){
    inputImg.addEventListener('change', function(){
      const f = this.files && this.files[0];
      const previewImg = document.getElementById('veh-preview-img');
      const previewEmpty = document.getElementById('veh-preview-empty');
      const previewName = document.getElementById('veh-preview-filename');
      if (!f){ previewImg.style.display='none'; previewEmpty.style.display='block'; previewName.textContent=''; return; }
      const reader = new FileReader();
      reader.onload = function(ev){
        previewImg.src = ev.target.result;
        previewImg.style.display = 'block'; previewEmpty.style.display = 'none'; previewName.textContent = f.name;
      };
      reader.readAsDataURL(f);
    });
  }

  // ensure CSRF token appended on delete and reservation updates
  const meta = document.querySelector('meta[name="csrf-token"]');
  const csrfToken = meta ? meta.getAttribute('content') : null;
  // override delete flow to include token (we already did above when building fd)
  // patch reservation update to include token
  const originalLoadReservas = window.loadReservas;
  window.loadReservas = function(){
    originalLoadReservas();
    // attach handler override happens inside loadReservas after table built
    setTimeout(()=>{
      document.querySelectorAll('.btn-update').forEach(b=>{
        if (b.__csrf_patched) return; b.__csrf_patched = true;
        b.addEventListener('click', (e)=>{
          const id = b.getAttribute('data-id');
          const sel = document.querySelector('.res-state[data-id="'+id+'"]');
          const estado = sel.value;
          const fd = new FormData(); fd.append('id_reserva', id); fd.append('estado', estado);
          if (csrfToken) fd.append('csrf_token', csrfToken);
          fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_reservas.php', {method:'POST', body: fd}).then(r=>r.json()).then(resp=>{
            if (resp.success) { showToast('Estado actualizado', 'success'); loadReservas(); }
            else showToast('Error al actualizar estado', 'error');
          });
        });
      });
    }, 200);
  };

  window.loadUsers = function(){
    const container = document.getElementById('users-list');
    container.innerHTML = 'Cargando...';
    fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_users.php').then(r=>r.json()).then(res=>{
      if (!res.success) { container.innerHTML = 'Error'; return; }
      const rows = res.data;
      let html = '<table class="table"><thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Registrado</th></tr></thead><tbody>';
      rows.forEach(r=>{
        html += `<tr><td>${r.id_usuario}</td><td>${r.nombre} ${r.apellido}</td><td>${r.email}</td><td>${r.rol}</td><td>${r.fecha_registro}</td></tr>`;
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    }).catch(err=>{ container.innerHTML = 'Error al cargar'; });
  };

  // cargar reservas
  window.loadReservas = function(){
    const container = document.getElementById('reservas-list');
    container.innerHTML = 'Cargando...';
    fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_reservas.php').then(r=>r.json()).then(res=>{
      if (!res.success) { container.innerHTML = 'Error'; return; }
      const rows = res.data;
      let html = '<table class="table"><thead><tr><th>ID</th><th>Cliente</th><th>Vehículo</th><th>Desde</th><th>Hasta</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
      rows.forEach(r=>{
        html += `<tr><td>${r.id_reserva}</td><td>${r.nombre} ${r.apellido}</td><td>${r.marca} ${r.modelo}</td><td>${r.fecha_inicio}</td><td>${r.fecha_fin}</td><td>${r.estado}</td><td><select data-id="${r.id_reserva}" class="res-state"><option value="pendiente">pendiente</option><option value="confirmada">confirmada</option><option value="cancelada">cancelada</option><option value="finalizada">finalizada</option></select> <button class="btn-update" data-id="${r.id_reserva}">Actualizar</button></td></tr>`;
      });
      html += '</tbody></table>';
      container.innerHTML = html;
      // set values for selects
      document.querySelectorAll('.res-state').forEach(s=>{ const id=s.getAttribute('data-id'); const row = rows.find(rr=>rr.id_reserva==id); if (row) s.value = row.estado; });
      document.querySelectorAll('.btn-update').forEach(b=>{
        b.addEventListener('click', (e)=>{
          const id = b.getAttribute('data-id');
          const sel = document.querySelector('.res-state[data-id="'+id+'"]');
          const estado = sel.value;
          const fd = new FormData(); fd.append('id_reserva', id); fd.append('estado', estado);
          fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_reservas.php', {method:'POST', body: fd}).then(r=>r.json()).then(resp=>{
            if (resp.success) { showToast('Estado actualizado', 'success'); loadReservas(); }
            else showToast('Error al actualizar estado', 'error');
          });
        });
      });
    }).catch(err=>{ container.innerHTML = 'Error al cargar'; });
  };

  // Notificaciones polling simple
  function loadNotifications(){
    fetch('/Proyecto_Vehiculos/Backend/PHP/admin/api_notifications.php').then(r=>r.json()).then(res=>{
      if (!res.success) return;
      const list = res.data.slice(0,5).map(n=>`<div class="notif"><strong>${n.tipo}</strong>: ${n.mensaje} <small>${n.fecha_envio}</small></div>`).join('');
      const t = document.getElementById('top-notifications'); if (t) t.innerHTML = list;
    });
  }
  loadNotifications(); setInterval(loadNotifications, 15000);

  // Helper: show toast
  function showToast(message, type='info', ttl=4000){
    const container = document.getElementById('toast-container');
    if (!container) return alert(message); // fallback
    const el = document.createElement('div'); el.className = 'toast '+(type||'info');
    el.innerHTML = `<div class="toast-msg">${message}</div><button class="toast-close" aria-label="Cerrar">×</button>`;
    container.appendChild(el);
    // close handler
    el.querySelector('.toast-close').addEventListener('click', ()=>{ el.remove(); });
    // auto remove
    setTimeout(()=>{ if (el.parentNode) el.remove(); }, ttl);
  }

  // inicial carga reservas si se accede
  if (document.querySelector('.sidebar nav a.active').getAttribute('data-section') === 'reservas') loadReservas();

});
