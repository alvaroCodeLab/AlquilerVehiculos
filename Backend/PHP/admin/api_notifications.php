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

if ($method === 'GET'){
    // listar notificaciones recientes
    $res = $conn->query('SELECT n.id_notificacion, n.id_usuario, n.tipo, n.mensaje, n.fecha_envio, n.leido, u.email FROM notificaciones n LEFT JOIN usuarios u ON n.id_usuario = u.id_usuario ORDER BY n.fecha_envio DESC LIMIT 50');
    $rows = [];
    while($r=$res->fetch_assoc()) $rows[] = $r;
    echo json_encode(['success'=>true,'data'=>$rows]); exit;
}

if ($method === 'POST'){
    // verificar CSRF
    $csrf = $_POST['csrf_token'] ?? null;
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (!$csrf && !empty($headers['X-CSRF-Token'])) $csrf = $headers['X-CSRF-Token'];
    if (!$csrf || !hash_equals($_SESSION['csrf_token'] ?? '', $csrf)) { http_response_code(401); echo json_encode(['success'=>false,'message'=>'Invalid CSRF token']); exit; }

    $id_usuario = isset($_POST['id_usuario']) ? intval($_POST['id_usuario']) : null;
    $tipo = trim($_POST['tipo'] ?? 'general');
    $mensaje = trim($_POST['mensaje'] ?? '');
    if (!$id_usuario || $mensaje === '') { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Missing params']); exit; }
    if (strlen($mensaje) > 2000) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'Mensaje demasiado largo']); exit; }
    $stmt = $conn->prepare('INSERT INTO notificaciones (id_usuario,tipo,mensaje) VALUES (?,?,?)');
    $stmt->bind_param('iss',$id_usuario,$tipo,$mensaje);
    if ($stmt->execute()) echo json_encode(['success'=>true,'id'=>$stmt->insert_id]); else echo json_encode(['success'=>false,'error'=>$conn->error]);
    exit;
}

http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed']);
