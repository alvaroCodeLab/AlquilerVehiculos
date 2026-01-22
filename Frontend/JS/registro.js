document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    if (registerForm) {
        registerForm.addEventListener('submit', async function name(e) {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value;
            const primerApellido = document.getElementById('primerApellido').value;
            const segundoApellido = document.getElementById('segundoApellido').value;
            const email = document.getElementById('email').value;
            const telefono = document.getElementById('telefono').value;
            const direccion = document.getElementById('direccion').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password != confirmPassword) {
                errorMessage.textContent = 'Las contraseñas no coinciden.';
                errorMessage.style.display = 'block';
                return;
            }

            var datosUsuario = {
                nombre: nombre,
                primerApellido: primerApellido,
                segundoApellido: segundoApellido,
                email: email,
                telefono: telefono,
                direccion: direccion,
                password: password,
                confirmPassword: confirmPassword
            }

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosUsuario)
            }

            try {
                const response = await fetch('../../Backend/PHP/registro.php', requestOptions);
                const data = await response.json();

                if (data.success) {
                    window.location.href = '../HTML/login.html'
                } else {
                    errorMessage.textContent = data.message;
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                console.log('Ha ocurrido un error: ', error);
                errorMessage.textContent = 'Ocurrió un error al procesar el registro, intentalo de nuevo más tarde.';
                errorMessage.style.display = 'block';
            }
        })
    }
})