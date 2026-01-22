document.addEventListener("DOMContentLoaded", () => {
    // Cargar header
    fetch("../HTML/commonHeader.html")
        .then(res => res.text())
        .then(html => {
            document.body.insertAdjacentHTML("afterbegin", html);
            iniciarMenuResponsive();
            iniciarDropdownUsuario();
            cargarSesion();
            marcarEnlaceActivo();
        });
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

            if (!favoritos || !reservas || !cuenta) return;

            if (d.logged) {
                cuenta.href = "#";
                emailBox.textContent = d.user.email;
                favoritos.style.display = "block";
                reservas.style.display = "block";

                // Cambiar opción del menú
                const logoutLink = document.querySelector(".logout");
                logoutLink.textContent = "Cerrar sesión";
                logoutLink.href = "#";
                logoutLink.addEventListener("click", () => {
                    // Realizar el logout
                    fetch("../../Backend/PHP/logout.php")
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Redirigir a la página de despedida después de cerrar sesión
                                window.location.href = "../HTML/despedida.html";
                            }
                        });
                });
            } else {
                favoritos.style.display = "none";
                reservas.style.display = "none";
                emailBox.textContent = "Invitado";

                // Cambiar opción del menú
                const logoutLink = document.querySelector(".logout");
                logoutLink.textContent = "Iniciar Sesión";
                logoutLink.href = "../HTML/login.html";
            }

            // recarga cada 10s
            setTimeout(cargarSesion, 10000);
        });
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

    // persistencia
    localStorage.setItem("lastActive", page);
}

// ------------------------- MENÚ RESPONSIVE -------------------------
function iniciarMenuResponsive() {
    const btn = document.getElementById("menuToggle");
    const nav = document.getElementById("navMenu");

    btn.addEventListener("click", () => nav.classList.toggle("open"));

    nav.querySelectorAll("a").forEach(a =>
        a.addEventListener("click", () => nav.classList.remove("open"))
    );
}

// ------------------------- DROPDOWN DE USUARIO -------------------------
function iniciarDropdownUsuario() {
    const btn = document.getElementById("linkCuenta");
    const menu = document.getElementById("userDropdown");

    btn.addEventListener("click", e => {
        e.preventDefault();
        menu.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.remove("open");
        }
    });
}
