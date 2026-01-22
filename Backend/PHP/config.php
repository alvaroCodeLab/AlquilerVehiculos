<?php

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "vehículos";

// Crear la conexión:
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar si la conexión es exitosa:
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
