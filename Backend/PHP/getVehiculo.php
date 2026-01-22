<?php
include("config.php");
header("Content-Type: application/json; charset=utf-8");

$id = intval($_GET["id"] ?? 0);
if (!$id) {
    echo json_encode(["success" => false, "message" => "ID no enviado"]);
    exit;
}

$q = $conn->query("SELECT * FROM vehiculos WHERE id_vehiculo = $id LIMIT 1");

if (!$q || $q->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Vehículo no encontrado"]);
    exit;
}

echo json_encode([
    "success" => true,
    "vehiculo" => $q->fetch_assoc()
]);
