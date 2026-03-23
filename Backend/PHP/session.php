<?php
require('config.php'); // ✅ require en lugar de include
session_start();

header('Content-Type: application/json; charset=utf-8'); // ✅ cabecera JSON con charset

// Validar que $_SESSION['user'] exista y sea array
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    // ✅ solo exponer lo necesario
    $user = [
        'id_usuario' => intval($_SESSION['user']['id_usuario']),
        'email' => htmlspecialchars($_SESSION['user']['email'], ENT_QUOTES, 'UTF-8'),
        'rol' => htmlspecialchars($_SESSION['user']['rol'], ENT_QUOTES, 'UTF-8')
    ];
    echo json_encode(['logged' => true, 'user' => $user], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['logged' => false]);
}
exit;