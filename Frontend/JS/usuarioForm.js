document.addEventListener('DOMContentLoaded', () => {
    const qs = new URLSearchParams(location.search);
    const id = qs.get('id');
    const form = document.getElementById('usuarioForm');
    const backBtn = document.getElementById('backBtn');
    const deleteBtn = document.getElementById('btnEliminarPage');

    backBtn.addEventListener('click', () => window.location.href = 'panelAdministracion.html?section=usuarios');

    // Mostrar mensaje Toast con animación
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '✔️' : '❗';
        toast.innerHTML = `<i>${icon}</i>${message}`;
        
        container.appendChild(toast);

        // Mostrar y esconder el toast con animaciones
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => container.removeChild(toast), 500);
        }, 3500);  // El toast se oculta después de 3.5 segundos
    }

    function parseJSONResponse(r) {
        if (!r.ok) return r.text().then(t => { console.error('HTTP', r.status, t); throw new Error(t || ('HTTP ' + r.status)); });
        const ct = r.headers.get('content-type') || '';
        if (ct.indexOf('application/json') === -1) return r.text().then(t => { console.error('No JSON:', t); throw new Error(t || 'No JSON'); });
        return r.json();
    }

    function cargarDatos() {
        if (!id) return;
        fetch('../../Backend/PHP/usersCRUD.php')
            .then(parseJSONResponse)
            .then(data => {
                const u = (data.usuarios || []).find(x => x.id_usuario == id);
                if (!u) { showToast('Usuario no encontrado', 'error'); return; }
                document.getElementById('pageTitle').textContent = `Editar usuario — ${u.nombre}`;
                document.getElementById('usuarioId').value = u.id_usuario;
                document.getElementById('nombre').value = u.nombre || '';
                document.getElementById('primer_apellido').value = u.primer_apellido || '';
                document.getElementById('segundo_apellido').value = u.segundo_apellido || '';
                document.getElementById('email').value = u.email || '';
                document.getElementById('telefono').value = u.telefono || '';
                document.getElementById('direccion').value = u.direccion || '';
                document.getElementById('rol').value = u.rol || 'cliente';
                deleteBtn.style.display = 'inline-block';
            })
            .catch(err => { console.error('Error cargar usuario', err); showToast('Error al cargar datos', 'error'); });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        fd.append('accion', 'guardar');
        fetch('../../Backend/PHP/usersCRUD.php', { method: 'POST', body: fd })
            .then(parseJSONResponse)
            .then(res => {
                if (res && res.success) {
                    showToast('Guardado correctamente', 'success');
                    setTimeout(() => window.location.href = 'panelAdministracion.html?section=usuarios', 900);
                } else showToast((res && res.message) || 'Error al guardar', 'error');
            })
            .catch(err => { console.error('Error guardar usuario', err); showToast('Error en la petición', 'error'); });
    });

    deleteBtn.addEventListener('click', () => {
        const uid = document.getElementById('usuarioId').value;
        if (!uid) return;
        if (!confirm('¿Eliminar usuario #' + uid + '?')) return;
        const fd = new FormData(); fd.append('accion','eliminar'); fd.append('id', uid);
        fetch('../../Backend/PHP/usersCRUD.php', { method: 'POST', body: fd })
            .then(parseJSONResponse)
            .then(res => {
                if (res && res.success) { showToast('Usuario eliminado', 'success'); setTimeout(()=>window.location.href='panelAdministracion.html?section=usuarios',700); }
                else showToast((res && res.message) || 'Error al eliminar', 'error');
            })
            .catch(err => { console.error('Error eliminar usuario', err); showToast('Error en la petición', 'error'); });
    });

    cargarDatos();

});
