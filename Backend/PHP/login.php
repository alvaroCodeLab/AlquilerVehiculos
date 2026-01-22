<?php

include('config.php');
session_start();

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'];
$password = $data['password'];

$sql = "SELECT * FROM usuarios WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

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
