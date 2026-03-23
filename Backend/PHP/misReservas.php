<?php
include('config.php');
session_start();

header('Content-Type: application/json; charset=utf-8');

// ❌ Solo desarrollo (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

// ✅ Verificar sesión
if (!isset($_SESSION['user']['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$id_usuario = (int) $_SESSION['user']['id_usuario'];

// ✅ Preparar query y comprobar errores
$sql = "SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.total, r.estado, 
               v.id_vehiculo, v.marca, v.modelo, v.precio_dia, v.imagen
        FROM reservas r
        LEFT JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
        WHERE r.id_usuario = ?
        ORDER BY r.fecha_inicio DESC";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    error_log("SELECT ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}

$stmt->bind_param('i', $id_usuario);
$stmt->execute();
$res = $stmt->get_result();

$rows = [];
while ($row = $res->fetch_assoc()) {
    $rows[] = $row;
}

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'reservas' => $rows]);
exit;