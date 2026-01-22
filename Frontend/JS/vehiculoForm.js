document.addEventListener('DOMContentLoaded', () => {
    const qs = new URLSearchParams(location.search);
    const id = qs.get('id');

    const form = document.getElementById('vehiculoForm');
    const backBtn = document.getElementById('backBtn');
    const deleteBtn = document.getElementById('btnEliminarPage');

    backBtn.addEventListener('click', () => window.location.href = 'panelAdministracion.html?section=vehiculos');

    // showToast local
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


    // cargar categorías y, si hay id, cargar datos del vehículo
    function cargarCategoriasYDatos() {
        fetch('../../Backend/PHP/panelAdministracion.php')
            .then(parseJSONResponse)
            .then(data => {
                // intentar obtener lista de categorias desde data.categorias o desde listaVehiculos
                const sel = document.getElementById('id_categoria');
                sel.innerHTML = '<option value="">-- Seleccionar --</option>';

                const mapa = {};
                if (data.categorias && Array.isArray(data.categorias)) {
                    data.categorias.forEach(c => { mapa[c.id_categoria] = c.nombre_categoria; });
                } else if (data.listaVehiculos && Array.isArray(data.listaVehiculos)) {
                    data.listaVehiculos.forEach(v => {
                        if (v.id_categoria && v.nombre_categoria) mapa[v.id_categoria] = v.nombre_categoria;
                    });
                }

                // si mapa vacío, usar categorías estáticas mínimas
                if (Object.keys(mapa).length === 0) {
                    mapa[1] = 'Económico'; mapa[2] = 'Compacto'; mapa[3] = 'Mediano'; mapa[4] = 'SUV';
                    mapa[5] = 'De lujo'; mapa[6] = 'Deportivo'; mapa[7] = 'Familiar'; mapa[8] = 'Furgoneta';
                    mapa[9] = 'Camioneta'; mapa[10] = 'Eléctrico'; mapa[11] = 'Híbrido'; mapa[12] = 'Cabriolet';
                }

                Object.keys(mapa).forEach(cid => {
                    const opt = document.createElement('option');
                    opt.value = cid;
                    opt.textContent = mapa[cid];
                    sel.appendChild(opt);
                });

                if (id) cargarDatosVehiculo(id);
            })
            .catch(err => {
                console.error('Error cargarCategoriasYDatos:', err);
                showToast('Error al cargar categorías', 'error');
                if (id) cargarDatosVehiculo(id); // intentar cargar datos aun así
            });
    }

    function cargarDatosVehiculo(idVeh) {
        fetch('../../Backend/PHP/panelAdministracion.php')
            .then(parseJSONResponse)
            .then(data => {
                const v = (data.listaVehiculos || []).find(x => x.id_vehiculo == idVeh);
                if (!v) {
                    showToast('Vehículo no encontrado', 'error');
                    return;
                }

                document.getElementById('pageTitle').textContent = `Editar vehículo — ${v.marca} ${v.modelo}`;
                document.getElementById('vehiculoId').value = v.id_vehiculo;
                document.getElementById('marca').value = v.marca || '';
                document.getElementById('modelo').value = v.modelo || '';
                document.getElementById('matricula').value = v.matricula || '';
                document.getElementById('anio').value = v.anio || '';
                if (v.id_categoria) document.getElementById('id_categoria').value = v.id_categoria;
                document.getElementById('cambio_marchas').value = v.cambio_marchas || 'manual';
                document.getElementById('numero_plazas').value = v.numero_plazas || '';
                document.getElementById('tipo_motor').value = v.tipo_motor || 'gasolina';
                document.getElementById('caballos').value = v.caballos || '';
                document.getElementById('precio_dia').value = v.precio_dia || '';
                document.getElementById('descripcion').value = v.descripcion || '';
                document.getElementById('estado').value = v.estado || 'disponible';

                // mostrar botón eliminar
                deleteBtn.style.display = 'inline-block';
            })
            .catch(err => {
                console.error('Error cargarDatosVehiculo:', err);
                showToast('Error al cargar datos', 'error');
            });
    }

    // submit guardar
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        fd.append('accion', 'guardar');

        fetch('../../Backend/PHP/vehiculosCRUD.php', { method: 'POST', body: fd })
            .then(parseJSONResponse)
            .then(res => {
                if (res && res.success) {
                    showToast('Guardado correctamente', 'success');
                    setTimeout(() => window.location.href = 'panelAdministracion.html?section=vehiculos', 900);
                } else {
                    showToast((res && res.message) || 'Error al guardar', 'error');
                }
            })
            .catch(err => { console.error('Error guardar:', err); showToast('Error en la petición', 'error'); });
    });

    // eliminar desde la página: barra inline de confirmación
    deleteBtn.addEventListener('click', () => {
        const vehId = document.getElementById('vehiculoId').value;
        if (!vehId) return;

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
        bar.innerHTML = `¿Eliminar vehículo #${vehId}? <button id="inlineCancel" style="margin-left:10px;padding:6px 10px;border-radius:6px;background:#ef233c;border:none;color:#fff;">Cancelar</button> <button id="inlineOk" style="margin-left:8px;padding:6px 10px;border-radius:6px;background:#4caf50;border:none;color:#fff;">Eliminar</button>`;
        document.body.appendChild(bar);

        document.getElementById('inlineCancel').addEventListener('click', () => bar.remove());
        document.getElementById('inlineOk').addEventListener('click', () => {
            const datos = new FormData();
            datos.append('accion', 'eliminar');
            datos.append('id', vehId);

            fetch('../../Backend/PHP/vehiculosCRUD.php', { method: 'POST', body: datos })
                .then(parseJSONResponse)
                .then(res => {
                        if (res && res.success) {
                        showToast('Vehículo eliminado', 'success');
                        setTimeout(() => window.location.href = 'panelAdministracion.html?section=vehiculos', 800);
                    } else {
                        showToast((res && res.message) || 'Error al eliminar', 'error');
                        bar.remove();
                    }
                })
                .catch(err => { console.error('Error eliminar:', err); showToast('Error en la petición', 'error'); bar.remove(); });
        });
    });

    // Helper para parsear respuestas JSON y loggearlas si vienen mal
    function parseJSONResponse(r) {
        if (!r.ok) {
            return r.text().then(t => { console.error('HTTP error', r.status, t); throw new Error(t || ('HTTP ' + r.status)); });
        }
        const ct = r.headers.get('content-type') || '';
        if (ct.indexOf('application/json') === -1) {
            return r.text().then(t => { console.error('Respuesta no JSON:', t); throw new Error(t || 'Respuesta no JSON'); });
        }
        return r.json();
    }

    // inicializar
    cargarCategoriasYDatos();

});