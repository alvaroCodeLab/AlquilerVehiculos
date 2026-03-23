<?php

// ❌ SOLO DESARROLLO (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

require 'config.php';

session_start();
header('Content-Type: application/json');

// requiere sesión
if (!isset($_SESSION['user']['id_usuario']) || !is_numeric($_SESSION['user']['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'No autenticado']);
    exit;
}

$userId = (int) $_SESSION['user']['id_usuario'];

$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

// ✅ Comprobar conexión
if (!isset($conn) || $conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}

// GET: devolver favoritos del usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $stmt = $conn->prepare("
        SELECT f.id_favorito, f.id_vehiculo, v.marca, v.modelo, v.precio_dia, v.imagen 
        FROM favoritos f 
        LEFT JOIN vehiculos v ON f.id_vehiculo = v.id_vehiculo 
        WHERE f.id_usuario = ? 
        ORDER BY f.id_favorito DESC
    ");

    if (!$stmt) {
        error_log("SELECT ERROR: " . $conn->error);
        echo json_encode(['success' => false, 'message' => 'Error interno']);
        exit;
    }

    $stmt->bind_param('i', $userId);
    $stmt->execute();

    $res = $stmt->get_result();

    $items = [];
    while ($r = $res->fetch_assoc()) {
        $items[] = $r;
    }

    $stmt->close();

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
    $stmt = $conn->prepare("SELECT id_favorito FROM favoritos WHERE id_usuario = ? AND id_vehiculo = ? LIMIT 1");

    if (!$stmt) {
        error_log("SELECT ERROR: " . $conn->error);
        echo json_encode(['success' => false, 'message' => 'Error interno']);
        exit;
    }

    $stmt->bind_param('ii', $userId, $idVeh);
    $stmt->execute();

    $res = $stmt->get_result();
    $exists = ($res && $res->num_rows > 0);

    $stmt->close();

    if ($exists) {
        // eliminar
        $stmt = $conn->prepare("DELETE FROM favoritos WHERE id_usuario = ? AND id_vehiculo = ?");

        if (!$stmt) {
            error_log("DELETE ERROR: " . $conn->error);
            echo json_encode(['success' => false, 'message' => 'Error interno']);
            exit;
        }

        $stmt->bind_param('ii', $userId, $idVeh);
        $stmt->execute();
        $stmt->close();

        echo json_encode(['success' => true, 'action' => 'removed']);
        exit;

    } else {
        // insertar
        $stmt = $conn->prepare("INSERT INTO favoritos (id_usuario, id_vehiculo, fecha_creacion) VALUES (?, ?, NOW())");

        if (!$stmt) {
            error_log("INSERT ERROR: " . $conn->error);
            echo json_encode(['success' => false, 'message' => 'Error interno']);
            exit;
        }

        $stmt->bind_param('ii', $userId, $idVeh);
        $stmt->execute();
        $stmt->close();

        echo json_encode(['success' => true, 'action' => 'added']);
        exit;
    }
}

echo json_encode(['success' => false, 'message' => 'Método no soportado']);