<?php
include('config.php');
session_start();

header('Content-Type: application/json');

// ❌ Solo desarrollo (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

// ✅ Leer JSON y validar campos
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

if (!$email || !$password) {
    echo json_encode([
        'success' => false,
        'message' => 'Email y contraseña son obligatorios.'
    ]);
    exit;
}

// ✅ Preparar query y comprobar errores
$stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ? LIMIT 1");
if (!$stmt) {
    error_log("SELECT ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}

$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

// ✅ Verificar contraseña
if ($user && password_verify($password, $user['password'])) {
    $_SESSION['user'] = [
        'id_usuario' => $user['id_usuario'],
        'email' => $user['email'],
        'rol' => $user['rol']
    ];

    echo json_encode([
        'success' => true,
        'rol' => $user['rol'],
        'id_usuario' => $user['id_usuario']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Email o contraseña incorrectos.'
    ]);
}