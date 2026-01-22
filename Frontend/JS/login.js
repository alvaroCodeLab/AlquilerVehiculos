document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

// GSAP: animación de entrada para la pantalla de login
document.addEventListener('DOMContentLoaded', function () {
    if (window.gsap) {
        try { gsap.registerPlugin(window.ScrollTrigger); } catch (e) { }

        const container = document.querySelector('.login-container');
        const logo = document.querySelector('.login-logo');

        if (container) {
            gsap.from(container, { y: 40, opacity: 0, duration: 0.7, ease: 'power2.out' });
        }
        if (logo) {
            gsap.from(logo, { y: -20, opacity: 0, duration: 0.9, delay: 0.15, ease: 'power2.out' });
        }
    }
});

            var datosUsuario = {
                email: email,
                password: password
            };

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosUsuario)
            }

            try {
                const response = await fetch('../../Backend/PHP/login.php', requestOptions);
                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('usuario', JSON.stringify ({
                        email: data.email,
                        rol: data.rol
                    }));

                    if (data.rol === 'administrador') {
                        window.location.href = '../HTML/panelAdministracion.html';
                    } else {
                        window.location.href = '../HTML/index.html';
                    }
                } else {
                    // Mostrar mensaje de error
                    errorMessage.style.display = 'block';
                    errorMessage.textContent = data.message || 'Correo o contraseña incorrectos.';
                }

            } catch (error) {
                console.log('Ha ocurrido un error: ', error);
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Error de conexión con el servidor. Intenta más tarde.';
            }

        })
    }
})