<?php
session_start();

// ❌ Solo desarrollo (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

// Limpiar todas las variables de sesión
$_SESSION = array();

// Eliminar la cookie de sesión si existe
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destruir sesión
session_destroy();

// Respuesta JSON segura
header('Content-Type: application/json; charset=utf-8');
echo json_encode(["success" => true]);
exit;