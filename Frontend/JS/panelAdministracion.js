document.addEventListener("DOMContentLoaded", () => {

    //================= NAVEGACIÓN =================
    const links = document.querySelectorAll(".menu a");
    const sections = document.querySelectorAll(".panel-section");

    links.forEach(link => {
        link.addEventListener("click", () => {
            links.forEach(e => e.classList.remove("active"));
            link.classList.add("active");

            sections.forEach(s => s.classList.remove("active"));
            document.getElementById(link.dataset.section).classList.add("active");
        });
    });

    // Activar sección desde query param ?section=vehiculos|usuarios|dashboard
    function activateSection(name) {
        if (!name) return;
        links.forEach(e => e.classList.remove('active'));
        const link = Array.from(links).find(l => l.dataset.section === name);
        if (link) link.classList.add('active');
        sections.forEach(s => s.classList.remove('active'));
        const sec = document.getElementById(name);
        if (sec) sec.classList.add('active');
    }

    const params = new URLSearchParams(location.search);
    const pref = params.get('section');
    if (pref) activateSection(pref);

    // ================= TEMA ======================
    const temaSwitch = document.getElementById("temaSwitch");
    temaSwitch.addEventListener("change", () =>
        document.body.classList.toggle("claro")
    );

    // ================= LOGOUT ====================
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("usuario");
        window.location.href = "../HTML/login.html";
    });

    // ===========================================================
    // =========== CARGAR DATOS INICIALES ========================
    // ===========================================================
    let vehiculosOriginal = [];
    let categoriasMap = {};
    let selectedDeleteId = null;
    function loadPanel() {
        fetch("../../Backend/PHP/panelAdministracion.php")
            .then(parseJSONResponse)
            .then(data => {
                // Dashboard
                document.getElementById("countVehiculos").textContent = data.totalVehiculos;
                document.getElementById("countClientes").textContent = data.totalClientes;
                document.getElementById("countReservas").textContent = data.totalReservas;
                document.getElementById("ingresosTotales").textContent = data.ingresosTotales + " €";

                // Sección Vehículos (GRID Moderno)
                cargarVehiculos(data.listaVehiculos);

                // Charts
                cargarChartIngresos(data.ingresosMensuales);
                cargarChartVehiculos(data.vehiculosPopulares);

                // Nuevos widgets
                cargarChartEstado(data.estadoDistribution || []);
                cargarChartReservasSemana(data.reservasSemana || []);
                renderTopVehiculos(data.vehiculosPopulares || []);
            });
    }
    loadPanel();

    // ===========================================================
    // ========= VEHÍCULOS (GRID MODERNO + FILTROS) ==============
    // ===========================================================

    function cargarVehiculos(lista) {
        vehiculosOriginal = lista;
        renderVehiculos(lista);
        cargarFiltroMarcas(lista);
        cargarCategorias(lista);
    }

    function cargarCategorias(lista) {
        categoriasMap = {};
        lista.forEach(v => {
            if (v.id_categoria && !categoriasMap[v.id_categoria]) {
                categoriasMap[v.id_categoria] = v.nombre_categoria || (`Cat ${v.id_categoria}`);
            }
        });

        const sel = document.getElementById("id_categoria");
        if (!sel) return;
        sel.innerHTML = `<option value="">-- Seleccionar --</option>`;
        Object.keys(categoriasMap).forEach(id => {
            const name = categoriasMap[id];
            sel.innerHTML += `<option value="${id}">${name}</option>`;
        });
    }

    function renderVehiculos(lista) {
        const grid = document.getElementById("gridVehiculos");
        grid.innerHTML = "";

        lista.forEach(v => {
            const imagen = v.imagen ? `../../SRC/IMG/vehiculos/${v.imagen}` : "../../SRC/IMG/noimage.png";
            const badgeClass = `badge-${v.estado}`;

            grid.innerHTML += `
                <div class="vehicle-card">
                    <div class="vehicle-img" style="background-image:url('${imagen}')"></div>

                    <div class="vehicle-title">${v.marca} ${v.modelo}</div>

                    <div class="vehicle-info">Matrícula: <b>${v.matricula}</b></div>
                    <div class="vehicle-info">Precio/día: <b>${v.precio_dia} €</b></div>

                    <div class="vehicle-specs">
                        <div class="spec">⚙️ ${v.cambio_marchas || '—'}</div>
                        <div class="spec">💺 ${v.numero_plazas || '—'} plazas</div>
                        <div class="spec">🔋 ${v.tipo_motor || '—'}</div>
                        <div class="spec">🏎️ ${v.caballos || '—'} CV</div>
                    </div>

                    <span class="vehicle-badge ${badgeClass}">${v.estado}</span>

                    <div class="vehicle-actions">
                        <div class="icon-btn edit" data-id="${v.id_vehiculo}">✏️ Editar</div>
                        <div class="icon-btn delete" data-id="${v.id_vehiculo}">🗑️ Eliminar</div>
                    </div>
                </div>
            `;
        });

        // Scoped action buttons inside the vehicles grid only
        grid.querySelectorAll(".edit").forEach(b =>
            b.addEventListener("click", e => abrirModalEditar(e.currentTarget.dataset.id))
        );

        grid.querySelectorAll(".delete").forEach(b =>
            b.addEventListener("click", e => eliminarVehiculo(e.currentTarget.dataset.id))
        );

        // Animación GSAP al renderizar tarjetas (si está disponible)
        if (window.gsap) {
            try { gsap.registerPlugin(ScrollTrigger); } catch (e) { }
            const cards = grid.querySelectorAll('.vehicle-card');
            if (cards.length) {
                gsap.from(cards, { y: 30, opacity: 0, stagger: 0.06, duration: 0.6, ease: 'power2.out' });
            }
        }
    }

    // ==================== BUSCADOR ==========================
    document.getElementById("buscadorVehiculos").addEventListener("input", e => {
        const texto = e.target.value.toLowerCase();

        const filtrados = vehiculosOriginal.filter(v =>
            v.marca.toLowerCase().includes(texto) ||
            v.modelo.toLowerCase().includes(texto) ||
            v.matricula.toLowerCase().includes(texto)
        );

        renderVehiculos(filtrados);
    });

    // ==================== FILTROS ===========================
    document.getElementById("filtroEstado").addEventListener("change", filtrar);
    document.getElementById("filtroMarca").addEventListener("change", filtrar);

    function filtrar() {
        const estado = document.getElementById("filtroEstado").value;
        const marca  = document.getElementById("filtroMarca").value;

        let filtrados = vehiculosOriginal;

        if (estado) filtrados = filtrados.filter(v => v.estado === estado);
        if (marca) filtrados = filtrados.filter(v => v.marca === marca);

        renderVehiculos(filtrados);
    }

    function cargarFiltroMarcas(lista) {
        const marcas = [...new Set(lista.map(v => v.marca))];
        const select = document.getElementById("filtroMarca");

        select.innerHTML = `<option value="">Todas las marcas</option>`;
        marcas.forEach(m => select.innerHTML += `<option value="${m}">${m}</option>`);
    }

    // ===========================================================
    // ========================= CHARTS ==========================
    // ===========================================================

    function cargarChartIngresos(datos) {
        new Chart(document.getElementById("chartIngresos"), {
            type: "line",
            data: {
                labels: datos.map(d => d.mes),
                datasets: [{
                    label: "Ingresos mensuales",
                    data: datos.map(d => d.total),
                    borderColor: "#00b4d8",
                    fill: false
                }]
            }
        });
    }

    function cargarChartVehiculos(datos) {
        new Chart(document.getElementById("chartVehiculos"), {
            type: "bar",
            data: {
                labels: datos.map(v => v.modelo),
                datasets: [{
                    label: "Reservas",
                    data: datos.map(v => v.total),
                    backgroundColor: "#4caf50"
                }]
            }
        });
    }

    // ========== NUEVOS GRÁFICOS / WIDGETS ===========
    function cargarChartEstado(datos) {
        const ctx = document.getElementById('chartEstado');
        if (!ctx) return;
        const labels = datos.map(d => d.estado);
        const values = datos.map(d => d.total);
        const colors = labels.map(s => s === 'disponible' ? '#4caf50' : (s === 'alquilado' ? '#ef8a1f' : '#ef233c'));

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: values, backgroundColor: colors }]
            },
            options: {
                plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).color } } }
            }
        });
    }

    function cargarChartReservasSemana(datos) {
        const ctx = document.getElementById('chartReservasSemana');
        if (!ctx) return;
        // datos: [{dia:'2025-11-25', total: 2}, ...]
        const labels = datos.map(d => d.dia);
        const values = datos.map(d => d.total);

        new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Reservas', data: values, borderColor: '#ffd166', fill: true, backgroundColor: 'rgba(255,209,102,0.12)' }] },
            options: { plugins: { legend: { display: false } } }
        });
    }

    function renderTopVehiculos(datos) {
        const cont = document.getElementById('topVehiculos');
        if (!cont) return;
        cont.innerHTML = '';
        datos.slice(0,5).forEach((v, i) => {
            const item = document.createElement('div');
            item.className = 'top-item';
            const rank = document.createElement('div'); rank.className = 'rank'; rank.textContent = `#${i+1}`;
            const meta = document.createElement('div'); meta.className = 'meta'; meta.innerHTML = `<div class="model">${v.modelo}</div><div class="count">${v.total} reservas</div>`;
            item.appendChild(rank);
            item.appendChild(meta);
            cont.appendChild(item);
        });
    }

    // ===========================================================
    // =============== NAVEGACIÓN A PÁGINA VEHÍCULO ==============
    // ===========================================================

    // Nuevo vehículo -> abrir página de formulario sin id
    document.getElementById("btnAgregarVehiculo")
        .addEventListener("click", () => {
            window.location.href = "vehiculo.html";
        });

    // Editar vehículo -> redirigir a la página de formulario con ?id=
    function abrirModalEditar(id) {
        window.location.href = `vehiculo.html?id=${id}`;
    }

    // Eliminar: confirmación inline (barra flotante)
    function eliminarVehiculo(id) {
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
        bar.innerHTML = `¿Eliminar vehículo #${id}? <button id="inlineCancel" style="margin-left:10px;padding:6px 10px;border-radius:6px;background:#ef233c;border:none;color:#fff;">Cancelar</button> <button id="inlineOk" style="margin-left:8px;padding:6px 10px;border-radius:6px;background:#4caf50;border:none;color:#fff;">Eliminar</button>`;

        document.body.appendChild(bar);

        document.getElementById('inlineCancel').addEventListener('click', () => {
            bar.remove();
        });

        document.getElementById('inlineOk').addEventListener('click', () => {
            const datos = new FormData();
            datos.append('accion', 'eliminar');
            datos.append('id', id);

            fetch('../../Backend/PHP/vehiculosCRUD.php', { method: 'POST', body: datos })
                .then(parseJSONResponse)
                .then(res => {
                    if (res && res.success) showToast('Vehículo eliminado', 'success');
                    else showToast((res && res.message) || 'Error al eliminar', 'error');
                    loadPanel();
                })
                .catch(err => { console.error('Error eliminar (panel):', err); showToast('Error en la petición', 'error'); })
                .finally(() => bar.remove());
        });
    }

    // Toast utility
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        container.appendChild(t);
        // force reflow
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => container.removeChild(t), 300);
        }, 3500);
    }

    // Helper para parsear respuestas JSON y loguear respuestas no-JSON
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

});
