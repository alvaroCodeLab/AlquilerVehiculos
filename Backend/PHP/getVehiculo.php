<?php
include("config.php");
header("Content-Type: application/json; charset=utf-8");

// ❌ Solo desarrollo (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

// ✅ Validar ID
$id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
if ($id <= 0) {
    echo json_encode(["success" => false, "message" => "ID no enviado"]);
    exit;
}

// ✅ Comprobar conexión
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Error interno"]);
    exit;
}

// ✅ Preparar query para evitar SQL Injection
$stmt = $conn->prepare("SELECT * FROM vehiculos WHERE id_vehiculo = ? LIMIT 1");
if (!$stmt) {
    error_log("SELECT ERROR: " . $conn->error);
    echo json_encode(["success" => false, "message" => "Error interno"]);
    exit;
}

$stmt->bind_param('i', $id);
$stmt->execute();

$res = $stmt->get_result();
if (!$res || $res->num_rows === 0) {
    $stmt->close();
    echo json_encode(["success" => false, "message" => "Vehículo no encontrado"]);
    exit;
}

$vehiculo = $res->fetch_assoc();
$stmt->close();

echo json_encode([
    "success" => true,
    "vehiculo" => $vehiculo
]);