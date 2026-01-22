document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("reservasList");

  function parseJSONResponse(r) {
    if (!r.ok)
      return r.text().then((t) => {
        throw new Error(t || "HTTP " + r.status);
      });
    const ct = r.headers.get("content-type") || "";
    if (ct.indexOf("application/json") === -1)
      return r.text().then((t) => {
        throw new Error("No JSON");
      });
    return r.json();
  }

  fetch("../../Backend/PHP/misReservas.php")
    .then(parseJSONResponse)
    .then((d) => {
      if (!d.success) {
        list.innerHTML =
          '<div class="muted">No hay reservas o no estás autenticado.</div>';
        return;
      }
      const rows = d.reservas || [];
      if (rows.length === 0) {
        list.innerHTML = '<div class="muted">No tienes reservas activas.</div>';
        return;
      }
      list.innerHTML = "";
      // helper: toast (in-page)
      function showToast(msg, ok = true) {
        const container = document.getElementById('toastContainer');
        if (!container) { alert(msg); return; }
        const t = document.createElement('div');
        t.className = 'toast ' + (ok ? 'success' : 'error');
        t.textContent = msg;
        container.appendChild(t);
        // force reflow then show
        requestAnimationFrame(() => t.classList.add('show'));
        setTimeout(() => t.classList.remove('show'), 3200);
        setTimeout(() => { try{ container.removeChild(t);}catch(e){} }, 3500);
      }

      rows.forEach((r) => {
        const el = document.createElement("div");
        el.className = "res-card";
        const img = r.imagen
          ? `../../SRC/IMG/vehiculos/${r.imagen}`
          : "../../SRC/IMG/noimage.png";
        el.innerHTML = `
        <img src="${img}" alt="${r.marca} ${r.modelo}">
        <div class="res-meta">
          <h4>${r.marca} ${r.modelo}</h4>
          <div class="muted">${r.fecha_inicio} → ${r.fecha_fin}</div>
        </div>
        <div class="res-right">
          <div><strong>${r.total} €</strong></div>
          <div class="muted">${r.estado}</div>
          <div style="margin-top:8px">
            ${r.estado && r.estado.toLowerCase().includes('cancel') ? '<span class="muted">Cancelada</span>' : '<button class="btn-cancel" data-id="' + r.id_reserva + '">Cancelar</button>'}
          </div>
        </div>
      `;
        list.appendChild(el);
      });

      // Delegación: manejar click en botones cancelar usando modal personalizado
      function showConfirm(message){
        return new Promise((resolve)=>{
          const modal = document.getElementById('confirmModal');
          const titleEl = document.getElementById('confirmTitle');
          const msgEl = document.getElementById('confirmMessage');
          const btnOk = document.getElementById('confirmOk');
          const btnCancel = document.getElementById('confirmCancel');
          if (!modal || !btnOk || !btnCancel) { resolve(confirm(message)); return; }

          titleEl.textContent = 'Confirmar cancelación';
          msgEl.textContent = message;
          // abrir modal mediante clase para aprovechar transiciones CSS
          modal.classList.add('open');

          function cleanup(){
            // cerrar con transición
            modal.classList.remove('open');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
          }
          function onOk(){ cleanup(); resolve(true); }
          function onCancel(){ cleanup(); resolve(false); }

          btnOk.addEventListener('click', onOk);
          btnCancel.addEventListener('click', onCancel);
        });
      }

      list.addEventListener('click', async function(e){
        const btn = e.target.closest('.btn-cancel');
        if (!btn) return;
        const id = btn.dataset.id;
        if (!id) return;
        const ok = await showConfirm('¿Cancelar esta reserva?');
        if (!ok) return;

        const fd = new FormData();
        fd.append('id', id);

        fetch('../../Backend/PHP/cancelarReserva.php', { method: 'POST', body: fd })
          .then(parseJSONResponse)
          .then(res => {
            if (res && res.success) {
              showToast('Reserva cancelada');
              // actualizar tarjeta en sitio
              const btnEl = list.querySelector('.btn-cancel[data-id="' + id + '"]');
              if (btnEl) {
                const card = btnEl.closest('.res-card');
                if (card) {
                  const statusEl = card.querySelector('.res-right .muted');
                  if (statusEl) statusEl.textContent = 'cancelada';
                  const actionWrapper = card.querySelector('.res-right [style]');
                  if (actionWrapper) actionWrapper.innerHTML = '<span class="muted">Cancelada</span>';
                }
              }
            } else {
              showToast((res && res.message) || 'Error al cancelar', false);
            }
          })
          .catch(err => { console.error(err); showToast('Error en la petición', false); });
      });
    })
    .catch((err) => {
      list.innerHTML = '<div class="muted">Error cargando reservas.</div>';
      console.error(err);
    });
});
