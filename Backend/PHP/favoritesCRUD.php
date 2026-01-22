<?php
include('config.php');
session_start();
header('Content-Type: application/json');

// requiere sesión
if (!isset($_SESSION['user']['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$userId = (int) $_SESSION['user']['id_usuario'];

$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

// GET: devolver favoritos del usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $res = $conn->query("SELECT f.id_favorito, f.id_vehiculo, v.marca, v.modelo, v.precio_dia, v.imagen FROM favoritos f LEFT JOIN vehiculos v ON f.id_vehiculo = v.id_vehiculo WHERE f.id_usuario = {$userId} ORDER BY f.id_favorito DESC");
    $items = [];
    while ($r = $res->fetch_assoc()) $items[] = $r;
    echo json_encode(['success' => true, 'favoritos' => $items]);
    exit;
}

// POST: toggle favorito
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $idVeh = isset($_POST['id_vehiculo']) ? (int)$_POST['id_vehiculo'] : 0;
    if (!$idVeh) {
        echo json_encode(['success' => false, 'message' => 'Vehículo no indicado']);
        exit;
    }

    // comprobar si ya existe
    $q = $conn->query("SELECT id_favorito FROM favoritos WHERE id_usuario = {$userId} AND id_vehiculo = {$idVeh} LIMIT 1");
    if ($q && $q->num_rows) {
        // eliminar
        $conn->query("DELETE FROM favoritos WHERE id_usuario = {$userId} AND id_vehiculo = {$idVeh}");
        echo json_encode(['success' => true, 'action' => 'removed']);
        exit;
    } else {
        // insertar
        $conn->query("INSERT INTO favoritos (id_usuario, id_vehiculo, fecha_creacion) VALUES ({$userId}, {$idVeh}, NOW())");
        echo json_encode(['success' => true, 'action' => 'added']);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Método no soportado']);
