<?php
include('config.php');
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user']['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$id_usuario = $_SESSION['user']['id_usuario'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

// Verificar que la reserva pertenece al usuario
$sql = "SELECT id_reserva, id_usuario, estado, fecha_inicio FROM reservas WHERE id_reserva = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Reserva no encontrada']);
    exit;
}

if (intval($row['id_usuario']) !== intval($id_usuario)) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

// Lógica de cancelación: evitar recancelar
if ($row['estado'] === 'cancelada' || $row['estado'] === 'cancelado') {
    echo json_encode(['success' => false, 'message' => 'Reserva ya cancelada']);
    exit;
}


// Política: permitir cancelar sólo si la fecha de inicio es al menos 24 horas en el futuro
if (!empty($row['fecha_inicio'])) {
    try {
        $fi = new DateTime($row['fecha_inicio']);
        $now = new DateTime();
        $deadline = (clone $now)->add(new DateInterval('PT24H')); // ahora + 24 horas
        if ($fi->getTimestamp() <= $deadline->getTimestamp()) {
            echo json_encode(['success' => false, 'message' => 'No se puede cancelar dentro de las 24 horas anteriores al inicio']);
            exit;
        }
    } catch (Exception $e) {
        // Si no podemos parsear la fecha, denegamos por seguridad
        echo json_encode(['success' => false, 'message' => 'Error al validar la fecha de la reserva']);
        exit;
    }
}

// Marcar como cancelada
$estadoNuevo = 'cancelada';
$u = $conn->prepare("UPDATE reservas SET estado = ? WHERE id_reserva = ?");
$u->bind_param('si', $estadoNuevo, $id);
if ($u->execute()) {
    echo json_encode(['success' => true, 'message' => 'Reserva cancelada']);
    exit;
} else {
    echo json_encode(['success' => false, 'message' => 'Error al cancelar']);
    exit;
}
