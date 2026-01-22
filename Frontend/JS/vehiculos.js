document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('vehiclesGrid');
    const pagination = document.getElementById('vehiclesPagination');
    const q = document.getElementById('q');
    const f_categoria = document.getElementById('f_categoria');
    const f_cambio = document.getElementById('f_cambio');
    const f_motor = document.getElementById('f_motor');
    const f_plazas = document.getElementById('f_plazas');

    let lista = [];
    let favoritosSet = new Set();
    let currentPage = 1;
    const perPage = 9;
    let session = { logged: false };

    function parseJSONResponse(r) {
        if (!r.ok) return r.text().then(t => { throw new Error(t || 'HTTP ' + r.status) });
        const ct = r.headers.get('content-type') || '';
        if (ct.indexOf('application/json') === -1) return r.text().then(t => { throw new Error('No JSON') });
        return r.json();
    }

    // cargar sesión
    fetch('../../Backend/PHP/session.php').then(parseJSONResponse).then(d => {
        if (d.logged) {
            session = d;
            document.getElementById('linkCuenta').setAttribute('title', d.user.email);
        } else {
            document.getElementById('linkFavoritos').style.display = 'none';
            document.getElementById('linkReservas').style.display = 'none';
        }
    });

    // cargar vehículos desde panelAdministracion (lista completa) y poblar filtros dinámicos
    fetch('../../Backend/PHP/panelAdministracion.php').then(parseJSONResponse).then(d => {
        lista = d.listaVehiculos || [];
        // poblar categorias
        const cats = [...new Set(lista.map(v => v.id_categoria))].filter(Boolean);
        cats.forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = lista.find(x => x.id_categoria == id).nombre_categoria || ('Cat ' + id);
            f_categoria.appendChild(opt);
        });
        render();
        if (session.logged) loadFavoritos();
    }).catch(err => { console.error('Error cargar vehiculos', err); });

    function loadFavoritos() {
        fetch('../../Backend/PHP/favoritesCRUD.php').then(parseJSONResponse).then(d => {
            if (d.success) {
                favoritosSet = new Set((d.favoritos || []).map(f => String(f.id_vehiculo)));
                render();
            }
        });
    }

    function applyFilters(list) {
        let res = list.slice();
        const qv = q.value.trim().toLowerCase();
        if (qv) res = res.filter(v => (v.marca + ' ' + v.modelo + ' ' + v.matricula).toLowerCase().includes(qv));
        if (f_categoria.value) res = res.filter(v => String(v.id_categoria) === String(f_categoria.value));
        if (f_cambio.value) res = res.filter(v => (v.cambio_marchas || '') === f_cambio.value);
        if (f_motor.value) res = res.filter(v => (v.tipo_motor || '') === f_motor.value);
        if (f_plazas.value) res = res.filter(v => String(v.numero_plazas || '') === f_plazas.value);
        return res;
    }

    function render() {
        const filtered = applyFilters(lista);
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / perPage));
        if (currentPage > pages) currentPage = pages;
        const start = (currentPage - 1) * perPage;
        const pageItems = filtered.slice(start, start + perPage);
        grid.innerHTML = '';
        pageItems.forEach(v => {
            const div = document.createElement('div');
            div.className = 'vehicle-card';
            const img = v.imagen ? `../../SRC/IMG/vehiculos/${v.imagen}` : '../../SRC/IMG/noimage.png';
            div.innerHTML = `
        <div style="position:relative">
          <img src="${img}" style="width:100%;height:160px;object-fit:cover;border-radius:8px">
          <div style="position:absolute;right:8px;top:8px"> <svg data-id="${v.id_vehiculo}" class="fav" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6 9 4.6c-1.6-1.6-4.2-1.6-5.8 0-1.6 1.6-1.6 4.2 0 5.8l8.8 8.8 8.8-8.8c1.6-1.6 1.6-4.2 0-5.8z"></path></svg></div>
        </div>
        <h4 style="margin:8px 0 4px">${v.marca} ${v.modelo} <small style="color:var(--muted);font-weight:600">${v.matricula || ''}</small></h4>
        <div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${v.precio_dia} € /día</strong></div><div><a class="btn-outline" href="../../Frontend/HTML/reservas.html?idVeh=${v.id_vehiculo}">Reservar</a></div></div>
      `;
            grid.appendChild(div);
        });

        // attach fav listeners
        grid.querySelectorAll('.fav').forEach(el => {
            const id = el.getAttribute('data-id');
            if (favoritosSet.has(String(id))) el.classList.add('active'); else el.classList.remove('active');
            el.addEventListener('click', () => {
                if (!session.logged) {
                    showToastError('Inicia sesión para usar favoritos');
                    return;
                }
                const fd = new FormData();
                fd.append('id_vehiculo', id);
                fetch('../../Backend/PHP/favoritesCRUD.php', { method: 'POST', body: fd }).then(parseJSONResponse).then(res => {
                    if (res.success) {
                        if (res.action === 'added') {
                            favoritosSet.add(String(id));
                            el.classList.add('active');
                            // pequeña animación al añadir
                            el.classList.add('pop');
                            // quitar la clase después de la animación
                            el.addEventListener('animationend', function _ae(){ el.classList.remove('pop'); el.removeEventListener('animationend', _ae); });
                        } else {
                            favoritosSet.delete(String(id));
                            el.classList.remove('active');
                        }
                    }
                }).catch(err => { console.error(err); });
            });
        });

        // interceptar botones de reservar para usuarios no logueados
        grid.querySelectorAll('a.btn-outline').forEach(el => {
            el.addEventListener('click', (e) => {
                if (!session.logged) {
                    e.preventDefault();
                    showToastError('Debes iniciar sesión para reservar este vehículo');
                }
            });
        });

        // pagination
        pagination.innerHTML = '';
        for (let p = 1; p <= pages; p++) {
            const b = document.createElement('button');
            b.textContent = p;
            if (p === currentPage) b.disabled = true;
            b.addEventListener('click', () => {
                currentPage = p;
                render();
            });
            pagination.appendChild(b);
        }
    }

    [q, f_categoria, f_cambio, f_motor, f_plazas].forEach(el => el.addEventListener('input', () => { currentPage = 1; render(); }));

    // Función para mostrar el toast de error
    function showToastError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-error';
        toast.innerHTML = `
            <span class="icon">❌</span>
            <span class="message">${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
        }, 100); // para que se vea con un pequeño retraso
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 400); // tiempo para desaparecer
        }, 4000); // el mensaje se mantiene por 4 segundos
    }
});
