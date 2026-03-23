<?php

// ❌ SOLO DESARROLLO (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

require 'config.php';

session_start();
header('Content-Type: application/json');

// ✅ Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// ✅ Validar sesión
if (!isset($_SESSION['user']['id_usuario']) || !is_numeric($_SESSION['user']['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$id_usuario = (int) $_SESSION['user']['id_usuario'];

// ✅ Validar ID
$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

// ✅ Comprobar conexión
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}

// Verificar que la reserva pertenece al usuario
$sql = "SELECT id_reserva, id_usuario, estado, fecha_inicio FROM reservas WHERE id_reserva = ? LIMIT 1";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    error_log("SELECT ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}

$stmt->bind_param('i', $id);
$stmt->execute();

$res = $stmt->get_result();
$row = $res ? $res->fetch_assoc() : null;

$stmt->close();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Reserva no encontrada']);
    exit;
}

if ((int)$row['id_usuario'] !== $id_usuario) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

// Lógica de cancelación: evitar recancelar
$estado = strtolower(trim((string)$row['estado']));
if ($estado === 'cancelada' || $estado === 'cancelado') {
    echo json_encode(['success' => false, 'message' => 'Reserva ya cancelada']);
    exit;
}

// Política: permitir cancelar sólo si la fecha de inicio es al menos 24 horas en el futuro
if (!empty($row['fecha_inicio'])) {
    try {
        $fi = new DateTime($row['fecha_inicio']);
        $now = new DateTime();
        $deadline = (clone $now)->add(new DateInterval('PT24H'));

        if ($fi->getTimestamp() <= $deadline->getTimestamp()) {
            echo json_encode(['success' => false, 'message' => 'No se puede cancelar dentro de las 24 horas anteriores al inicio']);
            exit;
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al validar la fecha de la reserva']);
        exit;
    }
}

// Marcar como cancelada
$estadoNuevo = 'cancelada';
$u = $conn->prepare("UPDATE reservas SET estado = ? WHERE id_reserva = ?");

if (!$u) {
    error_log("UPDATE ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}

$u->bind_param('si', $estadoNuevo, $id);

if ($u->execute()) {
    echo json_encode(['success' => true, 'message' => 'Reserva cancelada']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error al cancelar']);
}

$u->close();
$conn->close();
exit;