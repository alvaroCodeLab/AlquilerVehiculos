document.addEventListener('DOMContentLoaded', () => {

    // Obtener el formulario y el contenedor de mensajes
    const form = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    // Si no existe el formulario, salir (evita errores en otras páginas)
    if (!form) return;

    // Evento al enviar el formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita recarga de página

        // Recoger y limpiar los datos del formulario
        const datos = {
            nombre: document.getElementById('nombre').value.trim(),
            primerApellido: document.getElementById('primerApellido').value.trim(),
            segundoApellido: document.getElementById('segundoApellido').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };

        // ✅ Validación básica: comprobar que las contraseñas coinciden
        if (datos.password !== datos.confirmPassword) {
            mostrarError('Las contraseñas no coinciden');
            return;
        }

        try {

            // Enviar datos al backend en formato JSON
            const response = await fetch('../../Backend/PHP/registro.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(datos)
            });

            // Leer respuesta como texto (por seguridad antes de parsear)
            const text = await response.text();

            let data;
            try {
                // Intentar convertir la respuesta a JSON
                data = JSON.parse(text);
            } catch {
                console.error("Respuesta inválida:", text);
                throw new Error("Respuesta del servidor inválida");
            }

            // Si el registro ha sido exitoso
            if (data.success) {

                mostrarExito('Registro completado correctamente');

                // Esperar 2 segundos antes de redirigir al login
                setTimeout(() => {
                    window.location.href = '../HTML/login.html';
                }, 2000);

            } else {
                mostrarError(data.message);
            }

        } catch (error) {
            console.error(error);
            mostrarError('Error de conexión con el servidor');
        }
    });

    // Mostrar mensaje de error (rojo)
    function mostrarError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
        errorMessage.classList.remove('success'); // quitar verde si lo tenía
    }

    // Mostrar mensaje de éxito (verde)
    function mostrarExito(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
        errorMessage.classList.add('success'); // activar estilo verde
    }
});