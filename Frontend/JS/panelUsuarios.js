document.addEventListener('DOMContentLoaded', () => {
    const tablaBodyEl = document.querySelector('#tablaUsuarios tbody');
    if (!tablaBodyEl) return; // no estamos en una página con tabla de usuarios
    const tabla = tablaBodyEl;

    // aceptar varios ids para integrarse en panelPrincipal
    const buscador = document.getElementById('buscador') || document.getElementById('buscadorUsuarios');
    const btnNuevo = document.getElementById('btnNuevo') || document.getElementById('btnNuevoUsuario');

    if (btnNuevo) btnNuevo.addEventListener('click', () => window.location.href = 'usuario.html');

    // ============================
    // Toast
    // ============================
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        container.appendChild(t);
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => { 
            t.classList.remove('show'); 
            setTimeout(()=>container.removeChild(t),300); 
        }, 3500);
    }

    // ============================
    // Parse JSON seguro
    // ============================
    function parseJSONResponse(r) {
        if (!r.ok) 
            return r.text().then(t => { 
                console.error('HTTP', r.status, t); 
                throw new Error(t || ('HTTP ' + r.status)); 
            });

        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json'))
            return r.text().then(t => { 
                console.error('No JSON:', t); 
                throw new Error(t || 'No JSON'); 
            });

        return r.json();
    }

    // ============================
    // Cargar usuarios
    // ============================
    function cargarUsuarios() {
        fetch('../../Backend/PHP/usersCRUD.php')
            .then(parseJSONResponse)
            .then(data => {
                if (!data || !data.usuarios) return;
                render(data.usuarios);
            })
            .catch(err => { 
                console.error('Error cargar usuarios', err); 
                showToast('Error al cargar usuarios', 'error'); 
            });
    }

    // ============================================================
    // RENDER TABLA + EVENTOS (CON CONFIRMACIÓN INLINE)
    // ============================================================
    function render(items) {
        tabla.innerHTML = '';

        items.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id_usuario}</td>
                <td>${u.nombre} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}</td>
                <td>${u.email}</td>
                <td>${u.telefono || ''}</td>
                <td>${u.rol}</td>
                <td>${u.fecha_registro}</td>
                <td>
                    <button class="btn-edit btn" data-id="${u.id_usuario}">✏️</button>
                    <button class="btn-delete btn" data-id="${u.id_usuario}">🗑️</button>
                </td>
            `;
            tabla.appendChild(tr);
        });

        // Editar
        tabla.querySelectorAll('.btn-edit').forEach(b => 
            b.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id;
                window.location.href = `usuario.html?id=${id}`;
            })
        );

        // ============================
        // Eliminar con barra flotante
        // ============================
        tabla.querySelectorAll('.btn-delete').forEach(b => 
            b.addEventListener('click', e => {
                const id = e.currentTarget.dataset.id;

                // Cerrar cualquier barra existente
                const existing = document.getElementById('inlineConfirm');
                if (existing) existing.remove();

                // Crear barra flotante (MISMO DISEÑO QUE VEHÍCULOS)
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
                    ¿Eliminar usuario #${id}? 
                    <button id="inlineCancel" 
                            style="margin-left:10px;padding:6px 10px;border-radius:6px;background:#ef233c;border:none;color:#fff;">
                        Cancelar
                    </button> 
                    <button id="inlineOk" 
                            style="margin-left:8px;padding:6px 10px;border-radius:6px;background:#4caf50;border:none;color:#fff;">
                        Eliminar
                    </button>
                `;

                document.body.appendChild(bar);

                // Cancelar
                document.getElementById('inlineCancel').addEventListener('click', () => {
                    bar.remove();
                });

                // Confirmar eliminación
                document.getElementById('inlineOk').addEventListener('click', () => {
                    const fd = new FormData();
                    fd.append('accion', 'eliminar');
                    fd.append('id', id);

                    fetch('../../Backend/PHP/usersCRUD.php', { method: 'POST', body: fd })
                        .then(parseJSONResponse)
                        .then(res => {
                            if (res && res.success)
                                showToast('Usuario eliminado', 'success');
                            else
                                showToast((res && res.message) || 'Error al eliminar', 'error');

                            cargarUsuarios();
                        })
                        .catch(err => {
                            console.error('Error eliminar usuario', err);
                            showToast('Error en la petición', 'error');
                        })
                        .finally(() => bar.remove());
                });
            })
        );
    }

    // ============================================================
    // BUSCADOR
    // ============================================================
    if (buscador) {
        buscador.addEventListener('input', e => {
            const q = e.target.value.toLowerCase();
            fetch('../../Backend/PHP/usersCRUD.php')
                .then(parseJSONResponse)
                .then(data => {
                    const filtered = (data.usuarios || []).filter(u =>
                        (u.nombre + ' ' + (u.primer_apellido||'') + ' ' + (u.email||'')).toLowerCase().includes(q)
                    );
                    render(filtered);
                });
        });
    }

    // inicial
    cargarUsuarios();
});
