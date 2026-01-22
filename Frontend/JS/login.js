document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

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