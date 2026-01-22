<?php
require __DIR__ . '/../config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin_logged'])){
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT id_usuario, nombre, apellido, email, telefono, direccion, rol, fecha_registro FROM usuarios ORDER BY id_usuario DESC";
    $res = $conn->query($sql);
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode(['success' => true, 'data' => $rows]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
