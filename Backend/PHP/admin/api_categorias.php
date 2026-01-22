<?php
require __DIR__ . '/../config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin_logged'])){
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET'){
    http_response_code(405); echo json_encode(['success'=>false,'message'=>'Method not allowed']); exit;
}

$res = $conn->query('SELECT id_categoria, nombre_categoria FROM categorias ORDER BY nombre_categoria ASC');
$rows = [];
while($r = $res->fetch_assoc()) $rows[] = $r;
echo json_encode(['success'=>true,'data'=>$rows]);
exit;
