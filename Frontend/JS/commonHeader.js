document.addEventListener("DOMContentLoaded", () => {
    fetch("../HTML/commonHeader.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("afterbegin", html);

            iniciarMenuResponsive();
            iniciarDropdownUsuario();
            cargarSesion();
            marcarEnlaceActivo();
        })
        .catch(err => console.error("Error cargando header:", err));
});

// ------------------------- SESIÓN -------------------------
function cargarSesion() {
    fetch("../../Backend/PHP/session.php")
        .then(r => r.json())
        .then(d => {
            const favoritos = document.getElementById("linkFavoritos");
            const reservas = document.getElementById("linkReservas");
            const cuenta = document.getElementById("linkCuenta");
            const emailBox = document.getElementById("userEmail");

            if (!favoritos || !reservas || !cuenta || !emailBox) return;

            const logoutLink = document.querySelector(".logout");
            if (!logoutLink) return;

            if (d.logged) {
                cuenta.href = "#";
                emailBox.textContent = d.user.email;
                favoritos.style.display = "block";
                reservas.style.display = "block";

                logoutLink.textContent = "Cerrar sesión";
                logoutLink.href = "#";

                logoutLink.onclick = () => {
                    fetch("../../Backend/PHP/logout.php")
                        .then(r => r.json())
                        .then(data => {
                            if (data.success) {
                                window.location.href = "../HTML/despedida.html";
                            }
                        });
                };

            } else {
                favoritos.style.display = "none";
                reservas.style.display = "none";
                emailBox.textContent = "Invitado";

                logoutLink.textContent = "Iniciar Sesión";
                logoutLink.href = "../HTML/login.html";
            }

            setTimeout(cargarSesion, 10000);
        })
        .catch(err => console.error("Error sesión:", err));
}

// ------------------------- ENLACE ACTIVO -------------------------
function marcarEnlaceActivo() {
    const current = window.location.pathname.split("/").pop();

    const map = {
        "index.html": "index",
        "vehiculos.html": "vehiculos",
        "misReservas.html": "reservas",
        "favoritos.html": "favoritos",
        "registro.html": "cuenta"
    };

    const page = map[current];
    if (!page) return;

    const link = document.querySelector(`[data-page="${page}"]`);
    if (link) link.classList.add("active");

    localStorage.setItem("lastActive", page);
}

// ------------------------- MENÚ RESPONSIVE -------------------------
function iniciarMenuResponsive() {
    const btn = document.getElementById("menuToggle");
    const nav = document.getElementById("navMenu");

    if (!btn || !nav) return;

    btn.addEventListener("click", (e) => {
        e.stopPropagation(); // 🔥 importante
        nav.classList.toggle("open");
    });

    nav.addEventListener("click", e => {
        e.stopPropagation(); // 🔥 evita conflictos
    });

    document.addEventListener("click", () => {
        nav.classList.remove("open");
    });
}

// ------------------------- DROPDOWN -------------------------
function iniciarDropdownUsuario() {
    const btn = document.getElementById("linkCuenta");
    const menu = document.getElementById("userDropdown");

    if (!btn || !menu) return;

    btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation(); // 🔥 clave
        menu.classList.toggle("open");
    });

    menu.addEventListener("click", e => {
        e.stopPropagation(); // 🔥 evita cierre al clicar dentro
    });

    document.addEventListener("click", () => {
        menu.classList.remove("open");
    });
}