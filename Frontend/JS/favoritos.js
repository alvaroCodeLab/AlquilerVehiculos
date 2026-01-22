document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("favList");

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

  function load() {
    fetch("../../Backend/PHP/favoritesCRUD.php")
      .then(parseJSONResponse)
      .then((d) => {
        if (!d.success) {
          list.innerHTML =
            '<div class="muted">No hay favoritos o no estás autenticado.</div>';
          return;
        }
        const favs = d.favoritos || [];
        if (favs.length === 0) {
          list.innerHTML =
            '<div class="muted">No has agregado favoritos todavía.</div>';
          return;
        }
        list.innerHTML = "";
        favs.forEach((f) => {
          const card = document.createElement("div");
          card.className = "fav-card";
          const img = f.imagen
            ? `../../SRC/IMG/vehiculos/${f.imagen}`
            : "../../SRC/IMG/noimage.png";
          card.innerHTML = `
        <img src="${img}" alt="${f.marca} ${f.modelo}">
        <h4 style="margin:8px 0">${f.marca} ${f.modelo}</h4>
        <div style="display:flex;gap:8px;align-items:center">
            <strong>${f.precio_dia} € /día</strong>
            <button class="btn-ghost remove" data-id="${f.id_vehiculo}">Eliminar</button>
            <!-- CORRECCIÓN: enlace actualizado a reservas.html -->
            <a class="btn-outline" href="reservas.html?idVeh=${f.id_vehiculo}">Reservar</a>
        </div>
    `;
          list.appendChild(card);
        });

        list.querySelectorAll(".remove").forEach((btn) =>
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const fd = new FormData();
            fd.append("id_vehiculo", id);
            fetch("../../Backend/PHP/favoritesCRUD.php", {
              method: "POST",
              body: fd,
            })
              .then(parseJSONResponse)
              .then((res) => {
                if (res.success) load();
              })
              .catch(console.error);
          })
        );
      })
      .catch((err) => {
        list.innerHTML = '<div class="muted">Error cargando favoritos.</div>';
        console.error(err);
      });
  }

  load();
});
