<?php
require __DIR__ . '/../config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin_logged'])){
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT r.id_reserva, r.id_usuario, u.nombre, u.apellido, r.id_vehiculo, v.marca, v.modelo, r.fecha_inicio, r.fecha_fin, r.estado, r.total FROM reservas r LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario LEFT JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo ORDER BY r.fecha_reserva DESC";
    $res = $conn->query($sql);
    $rows = [];
    while($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode(['success'=>true,'data'=>$rows]);
    exit;
}

if ($method === 'POST'){
    // verificar CSRF
    $csrf = $_POST['csrf_token'] ?? null;
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (!$csrf && !empty($headers['X-CSRF-Token'])) $csrf = $headers['X-CSRF-Token'];
    if (!$csrf || !hash_equals($_SESSION['csrf_token'] ?? '', $csrf)) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Invalid CSRF token']); exit; }

    // Actualizar estado o crear notificación relacionada
    $id = isset($_POST['id_reserva']) ? intval($_POST['id_reserva']) : null;
    $estado = trim($_POST['estado'] ?? '');
    if ($id && $estado){
        $allowed = ['pendiente','confirmada','cancelada','finalizada'];
        if (!in_array($estado, $allowed)) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Estado inválido']); exit; }
        $stmt = $conn->prepare('UPDATE reservas SET estado = ? WHERE id_reserva = ?');
        $stmt->bind_param('si',$estado,$id);
        if ($stmt->execute()){
            echo json_encode(['success'=>true]);
            exit;
        } else { echo json_encode(['success'=>false,'error'=>$conn->error]); exit; }
    }
    http_response_code(400); echo json_encode(['success'=>false,'message'=>'Invalid params']); exit;
}

http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed']);
