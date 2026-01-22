document.addEventListener('DOMContentLoaded', ()=>{
    const qs = new URLSearchParams(location.search);
    const id = qs.get('id');
    const form = document.getElementById('reservaForm');
    const backBtn = document.getElementById('backBtn');
    const deleteBtn = document.getElementById('btnEliminarPage');
    const pageTitle = document.getElementById('pageTitle');

    backBtn.addEventListener('click', ()=> window.location.href = 'panelAdministracion.html?section=reservas');

    // Si abrimos con un id, cambiar el título a edición
    if (pageTitle && id) {
        pageTitle.textContent = 'Editar Reserva';
    }

    function showToast(m, t = 'success') {
        const c = document.getElementById('toastContainer');
        if (!c) return;
        
        const el = document.createElement('div');
        el.className = `toast ${t}`;
        
        const icon = t === 'success' ? '✔️' : '❗';
        el.innerHTML = `<i>${icon}</i>${m}`;
        
        c.appendChild(el);

        // Mostrar y esconder el toast con animaciones
        setTimeout(() => el.classList.add('show'), 10);
        setTimeout(() => {
            el.classList.add('fade-out');
            setTimeout(() => c.removeChild(el), 500);
        }, 3500); // El toast desaparece después de 3.5 segundos
    }

    function parseJSONResponse(r){ if(!r.ok) return r.text().then(t=>{ console.error('HTTP',r.status,t); throw new Error(t||('HTTP '+r.status)); }); const ct=r.headers.get('content-type')||''; if(ct.indexOf('application/json')===-1) return r.text().then(t=>{ console.error('No JSON',t); throw new Error(t||'No JSON'); }); return r.json(); }

    // cargar usuarios y vehiculos para selects
    function cargarSelects(){
        fetch('../../Backend/PHP/usersCRUD.php').then(parseJSONResponse).then(d=>{
            const selU = document.getElementById('id_usuario'); selU.innerHTML=''; (d.usuarios||[]).forEach(u=>{ const opt = document.createElement('option'); opt.value = u.id_usuario; opt.textContent = u.nombre + ' ' + (u.primer_apellido||''); selU.appendChild(opt); });
        }).catch(e=>{ console.error('Error cargar usuarios',e); showToast('Error cargar usuarios','error'); });

        fetch('../../Backend/PHP/panelAdministracion.php').then(parseJSONResponse).then(d=>{
            const selV = document.getElementById('id_vehiculo'); selV.innerHTML=''; window.__listaVehiculos = d.listaVehiculos || [];
            (window.__listaVehiculos).forEach(v=>{ const opt=document.createElement('option'); opt.value=v.id_vehiculo; opt.textContent = v.marca + ' ' + v.modelo; selV.appendChild(opt); });
            // set preview when changing
            const previewImg = document.getElementById('vehPreviewImg');
            const previewBox = document.getElementById('vehPreview');
            function updatePreview() {
                const vid = selV.value;
                const veh = (window.__listaVehiculos || []).find(x=> String(x.id_vehiculo) === String(vid));
                if (veh && veh.imagen) {
                    previewImg.src = `../../SRC/IMG/vehiculos/${veh.imagen}`;
                    previewImg.style.display = 'block';
                } else {
                    previewImg.style.display = 'none';
                }
                // store price for calculation
                window.__precioSeleccionado = veh ? (parseFloat(veh.precio_dia) || 0) : 0;
                calcularTotalAutomatico();
            }
            selV.addEventListener('change', updatePreview);
            // initial
            setTimeout(updatePreview, 50);
        }).catch(e=>{ console.error('Error cargar vehiculos',e); showToast('Error cargar vehículos','error'); });
    }

    function diasEntre(fInicio, fFin){
        try{
            const a = new Date(fInicio);
            const b = new Date(fFin);
            if (isNaN(a) || isNaN(b)) return 0;
            const diff = (b - a) / (1000*60*60*24);
            return Math.max(0, Math.ceil(diff));
        }catch(e){return 0}
    }

    function calcularTotalAutomatico(){
        const inicio = document.getElementById('fecha_inicio').value;
        const fin = document.getElementById('fecha_fin').value;
        const precio = window.__precioSeleccionado || 0;
        if (!inicio || !fin || precio <= 0) return;
        const dias = diasEntre(inicio, fin) || 1;
        const total = (dias * precio).toFixed(2);
        document.getElementById('total').value = total;
    }

    // calcular al cambiar fechas
    document.getElementById('fecha_inicio').addEventListener('change', calcularTotalAutomatico);
    document.getElementById('fecha_fin').addEventListener('change', calcularTotalAutomatico);

    function cargarDatos(){ if(!id) return; fetch('../../Backend/PHP/reservasCRUD.php').then(parseJSONResponse).then(d=>{ const r = (d.reservas||[]).find(x=> x.id_reserva == id); if(!r){ showToast('Reserva no encontrada','error'); return; } document.getElementById('reservaId').value = r.id_reserva; document.getElementById('id_usuario').value = r.id_usuario; document.getElementById('id_vehiculo').value = r.id_vehiculo; document.getElementById('fecha_inicio').value = r.fecha_inicio; document.getElementById('fecha_fin').value = r.fecha_fin; document.getElementById('estado').value = r.estado || 'pendiente'; document.getElementById('total').value = r.total || ''; deleteBtn.style.display='inline-block'; }).catch(e=>{ console.error('Error cargar reserva',e); showToast('Error al cargar','error'); }); }

    form.addEventListener('submit', e=>{ e.preventDefault(); const fd = new FormData(form); fd.append('accion','guardar'); fetch('../../Backend/PHP/reservasCRUD.php',{ method:'POST', body: fd }).then(parseJSONResponse).then(res=>{ if(res && res.success){ showToast('Guardado correctamente','success'); setTimeout(()=> window.location.href='panelAdministracion.html?section=reservas',900); } else showToast((res && res.message) || 'Error al guardar','error'); }).catch(err=>{ console.error('Error guardar',err); showToast('Error en la petición','error'); }); });

    deleteBtn.addEventListener('click', ()=>{ const rid = document.getElementById('reservaId').value; if(!rid) return; if(!confirm('¿Eliminar reserva #'+rid+'?')) return; const fd = new FormData(); fd.append('accion','eliminar'); fd.append('id', rid); fetch('../../Backend/PHP/reservasCRUD.php',{ method:'POST', body: fd }).then(parseJSONResponse).then(res=>{ if(res && res.success){ showToast('Reserva eliminada','success'); setTimeout(()=> window.location.href='panelAdministracion.html?section=reservas',800); } else showToast((res && res.message)||'Error','error'); }).catch(err=>{ console.error('Error eliminar',err); showToast('Error en la petición','error'); }); });

    cargarSelects(); cargarDatos();

});
