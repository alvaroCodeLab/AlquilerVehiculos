<?php
include('config.php');
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$id_usuario = $_SESSION['user']['id_usuario'];

$sql = "SELECT r.id_reserva, r.fecha_inicio, r.fecha_fin, r.total, r.estado, v.id_vehiculo, v.marca, v.modelo, v.precio_dia, v.imagen
        FROM reservas r
        LEFT JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
        WHERE r.id_usuario = ?
        ORDER BY r.fecha_inicio DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $id_usuario);
$stmt->execute();
$res = $stmt->get_result();
$rows = [];
while ($row = $res->fetch_assoc()) {
    $rows[] = $row;
}

echo json_encode(['success' => true, 'reservas' => $rows]);
exit;
