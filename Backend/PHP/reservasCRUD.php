<?php
require "config.php";
header("Content-Type: application/json");

try {
    $pdo = new PDO("mysql:host={$servername};dbname={$dbname};charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection error: " . $e->getMessage()]);
    exit;
}

// Simple logger
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
$logFile = $logDir . '/reservas_crud.log';
function dbg($m)
{
    global $logFile;
    @file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] " . $m . PHP_EOL, FILE_APPEND);
}

dbg("reservasCRUD called method=" . ($_SERVER['REQUEST_METHOD'] ?? ''));

// GET -> listar reservas con JOIN a usuarios y vehiculos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sql = "SELECT r.id_reserva, r.id_usuario, r.id_vehiculo, r.fecha_inicio, r.fecha_fin, r.estado, r.fecha_reserva, r.total,
                   u.nombre as usuario_nombre, u.primer_apellido as usuario_apellido, v.marca, v.modelo, v.imagen, v.precio_dia
            FROM reservas r
                LEFT JOIN usuarios u ON u.id_usuario = r.id_usuario
                LEFT JOIN vehiculos v ON v.id_vehiculo = r.id_vehiculo
                ORDER BY r.fecha_reserva DESC";
        $stmt = $pdo->query($sql);
        $rows = $stmt->fetchAll();
        echo json_encode(["success" => true, "reservas" => $rows]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        dbg("LIST_ERROR: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit;
    }
}

// POST -> acciones guardar/eliminar
$input = $_POST;
$accion = isset($input['accion']) ? $input['accion'] : null;

if ($accion === 'guardar') {
    $id = isset($input['id']) && $input['id'] !== '' ? intval($input['id']) : '';
    $id_usuario = isset($input['id_usuario']) ? intval($input['id_usuario']) : 0;
    $id_vehiculo = isset($input['id_vehiculo']) ? intval($input['id_vehiculo']) : 0;
    $fecha_inicio = isset($input['fecha_inicio']) ? $input['fecha_inicio'] : null;
    $fecha_fin = isset($input['fecha_fin']) ? $input['fecha_fin'] : null;
    $estado = isset($input['estado']) ? $input['estado'] : 'pendiente';
    $total = isset($input['total']) && $input['total'] !== '' ? $input['total'] : null;

    try {
        if ($id === '') {
            $sql = $pdo->prepare("INSERT INTO reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado, total) VALUES (?, ?, ?, ?, ?, ?)");
            $sql->execute([$id_usuario, $id_vehiculo, $fecha_inicio, $fecha_fin, $estado, $total]);
        } else {
            $sql = $pdo->prepare("UPDATE reservas SET id_usuario = ?, id_vehiculo = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?, total = ? WHERE id_reserva = ?");
            $sql->execute([$id_usuario, $id_vehiculo, $fecha_inicio, $fecha_fin, $estado, $total, $id]);
        }
        echo json_encode(["success" => true]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        dbg("GUARDAR_ERROR: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit;
    }
}

if ($accion === 'eliminar') {
    $id = isset($input['id']) ? intval($input['id']) : 0;
    try {
        $pdo->prepare("DELETE FROM reservas WHERE id_reserva = ?")->execute([$id]);
        echo json_encode(["success" => true]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        dbg("ELIMINAR_ERROR: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit;
    }
}

echo json_encode(["success" => false, "message" => "Acción inválida"]);
