<?php

// Configuración de la conexión a la base de datos de ejemplo
$servername = "localhost";
$username = "tu_usuario";
$password = "tu_contraseña";
$dbname = "nombre_de_base_de_datos";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Revisar conexión
if ($conn -> connect_error) {
    die("Conexion Fallida: " . $conn -> connect_error);
}

?>