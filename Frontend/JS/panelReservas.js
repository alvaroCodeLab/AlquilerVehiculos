document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('gridReservas');
    if (!grid) return;
    const buscador = document.getElementById('buscadorReservas');
    const btnNuevo = document.getElementById('btnNuevaReserva');

    function showToast(msg, type='success'){
        const c = document.getElementById('toastContainer'); 
        if(!c) return;
        const t = document.createElement('div'); 
        t.className = `toast ${type}`; 
        t.textContent = msg; 
        c.appendChild(t);
        setTimeout(()=>t.classList.add('show'),10);
        setTimeout(()=>{
            t.classList.remove('show'); 
            setTimeout(()=>c.removeChild(t),300); 
        },3500);
    }

    function parseJSONResponse(r){
        if(!r.ok) 
            return r.text().then(t=>{ 
                console.error('HTTP',r.status,t); 
                throw new Error(t||('HTTP '+r.status)); 
            });
        const ct = r.headers.get('content-type')||'';
        if(ct.indexOf('application/json')===-1)
            return r.text().then(t=>{ 
                console.error('No JSON',t); 
                throw new Error(t||'No JSON'); 
            });
        return r.json();
    }

    function cargar(){
        fetch('../../Backend/PHP/reservasCRUD.php')
            .then(parseJSONResponse)
            .then(data=>{
                if(!data || !data.reservas) return;
                render(data.reservas);
            })
            .catch(err=>{
                console.error('Error cargar reservas',err);
                showToast('Error al cargar reservas','error');
            });
    }

    function render(items){
        grid.innerHTML = '';
        items.forEach(r => {
            const card = document.createElement('div');
            card.className = 'reserva-card';

            const usuario = r.usuario_nombre 
                ? (r.usuario_nombre + ' ' + (r.usuario_apellido||'')) 
                : ('#'+r.id_usuario);

            const veh = r.marca 
                ? (r.marca + ' ' + (r.modelo||'')) 
                : ('#'+r.id_vehiculo);

            card.innerHTML = `
                <div class="reserva-top">
                    <div class="reserva-id">#${r.id_reserva}</div>
                    <div class="reserva-estado estado-${r.estado}">${r.estado}</div>
                </div>

                <div style="display:flex;gap:12px;align-items:center">
                    <div class="reserva-thumb" style="width:86px;height:60px;border-radius:8px;overflow:hidden;background:#111;flex:0 0 86px">
                        ${r.imagen 
                            ? `<img src="../../SRC/IMG/vehiculos/${r.imagen}" style="width:100%;height:100%;object-fit:cover">`
                            : `<img src="../../SRC/IMG/noimage.png" style="width:100%;height:100%;object-fit:cover">`
                        }
                    </div>

                    <div class="reserva-body">
                        <div class="reserva-user">👤 ${usuario}</div>
                        <div class="reserva-veh">🚗 ${veh}</div>
                        <div class="reserva-dates">📅 ${r.fecha_inicio} → ${r.fecha_fin}</div>
                        <div class="reserva-total">💶 ${r.total ? r.total + ' €' : '-'}</div>
                    </div>
                </div>

                <div class="reserva-actions">
                    <button class="btn-edit btn" data-id="${r.id_reserva}">✏️ Editar</button>
                    <button class="btn-delete btn" data-id="${r.id_reserva}">🗑️ Eliminar</button>
                </div>
            `;

            grid.appendChild(card);
        });

        // Botón editar
        grid.querySelectorAll('.btn-edit').forEach(b => 
            b.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id;
                window.location.href = 'reserva.html?id='+id;
            })
        );

        // Botón eliminar con BARRA INLINE
        grid.querySelectorAll('.btn-delete').forEach(b =>
            b.addEventListener('click', e => inlineDelete(e.currentTarget.dataset.id))
        );
    }

    // ===============================
    //  CONFIRMACIÓN INLINE (NUEVO)
    // ===============================
    function inlineDelete(id) {
        const existing = document.getElementById('inlineConfirm');
        if (existing) existing.remove();

        const bar = document.createElement('div');
        bar.id = 'inlineConfirm';
        bar.style.position = 'fixed';
        bar.style.top = '20px';
        bar.style.left = '50%';
        bar.style.transform = 'translateX(-50%)';
        bar.style.zIndex = 99999;
        bar.style.background = '#222';
        bar.style.color = '#fff';
        bar.style.padding = '12px 16px';
        bar.style.borderRadius = '8px';
        bar.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';

        bar.innerHTML = `
            ¿Eliminar reserva #${id}? 
            <button id="inlineCancel" style="margin-left:10px;padding:6px 10px;border-radius:6px;background:#ef233c;border:none;color:#fff;">Cancelar</button> 
            <button id="inlineOk" style="margin-left:8px;padding:6px 10px;border-radius:6px;background:#4caf50;border:none;color:#fff;">Eliminar</button>
        `;

        document.body.appendChild(bar);

        document.getElementById('inlineCancel').addEventListener('click', () => bar.remove());

        document.getElementById('inlineOk').addEventListener('click', () => {
            const fd = new FormData(); 
            fd.append('accion','eliminar'); 
            fd.append('id', id);

            fetch('../../Backend/PHP/reservasCRUD.php', { method:'POST', body: fd })
                .then(parseJSONResponse)
                .then(res => {
                    if (res && res.success) showToast('Reserva eliminada', 'success');
                    else showToast((res && res.message) || 'Error al eliminar', 'error');
                    cargar();
                })
                .catch(err => {
                    console.error('Error eliminar reserva', err);
                    showToast('Error en la petición', 'error');
                })
                .finally(() => bar.remove());
        });
    }

    // ===========================
    // BUSCADOR
    // ===========================
    if(buscador){
        buscador.addEventListener('input', e=>{
            const q = e.target.value.toLowerCase();
            fetch('../../Backend/PHP/reservasCRUD.php')
                .then(parseJSONResponse)
                .then(data=>{
                    const filtered = (data.reservas||[]).filter(r => {
                        const usr = (r.usuario_nombre||'') + ' ' + (r.usuario_apellido||'');
                        const veh = (r.marca||'') + ' ' + (r.modelo||'');
                        return (usr + veh + (r.estado||'')).toLowerCase().includes(q);
                    });
                    render(filtered);
                });
        });
    }

    if (btnNuevo) btnNuevo.addEventListener('click', ()=> window.location.href = 'reserva.html');

    cargar();
});
