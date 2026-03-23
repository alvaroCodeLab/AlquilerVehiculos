<?php
require "config.php";  // ✅ usar require, no include
header("Content-Type: application/json; charset=utf-8"); // ✅ cabecera JSON segura

// ✅ Forzar método POST/GET según acción
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET','POST'])) {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Crear PDO con manejo de errores
try {
    $pdo = new PDO("mysql:host={$servername};dbname={$dbname};charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error interno de conexión"]);
    exit;
}

// Logging básico
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
$logFile = $logDir . '/users_crud.log';
function dbg_users($m) {
    global $logFile;
    @file_put_contents($logFile, "[".date('Y-m-d H:i:s')."] ".$m.PHP_EOL, FILE_APPEND);
}
dbg_users("usersCRUD called, method=" . $method);

// GET -> listar usuarios
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id_usuario, nombre, primer_apellido, segundo_apellido, email, telefono, direccion, rol, fecha_registro FROM usuarios ORDER BY id_usuario DESC");
        $rows = $stmt->fetchAll();

        // ✅ Sanitizar nombres y email para evitar XSS
        foreach ($rows as &$user) {
            $user['nombre'] = htmlspecialchars($user['nombre'], ENT_QUOTES, 'UTF-8');
            $user['primer_apellido'] = htmlspecialchars($user['primer_apellido'], ENT_QUOTES, 'UTF-8');
            $user['segundo_apellido'] = htmlspecialchars($user['segundo_apellido'], ENT_QUOTES, 'UTF-8');
            $user['email'] = htmlspecialchars($user['email'], ENT_QUOTES, 'UTF-8');
            $user['rol'] = htmlspecialchars($user['rol'], ENT_QUOTES, 'UTF-8');
        }

        echo json_encode(["success" => true, "usuarios" => $rows]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        dbg_users("LIST_ERROR: ".$e->getMessage());
        echo json_encode(["success" => false, "message" => "Error interno"]);
        exit;
    }
}

// POST -> guardar o eliminar
if ($method === 'POST') {
    $input = $_POST;
    $accion = $input['accion'] ?? null;

    if ($accion === 'guardar') {
        $id = isset($input['id']) && $input['id'] !== '' ? intval($input['id']) : '';
        $nombre = trim($input['nombre'] ?? '');
        $primer_apellido = trim($input['primer_apellido'] ?? '');
        $segundo_apellido = trim($input['segundo_apellido'] ?? '');
        $email = trim($input['email'] ?? '');
        $telefono = trim($input['telefono'] ?? '');
        $direccion = trim($input['direccion'] ?? '');
        $rol = $input['rol'] ?? 'cliente';
        $password = $input['password'] ?? '';

        try {
            if ($id === '') {
                // ✅ Crear usuario nuevo
                if ($password === '') throw new Exception("Contraseña obligatoria");
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $sql = $pdo->prepare("INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, email, password, telefono, direccion, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $sql->execute([$nombre, $primer_apellido, $segundo_apellido, $email, $hash, $telefono, $direccion, $rol]);
            } else {
                // ✅ Actualizar usuario
                $fields = "nombre = ?, primer_apellido = ?, segundo_apellido = ?, email = ?, telefono = ?, direccion = ?, rol = ?";
                $params = [$nombre, $primer_apellido, $segundo_apellido, $email, $telefono, $direccion, $rol];
                if ($password !== '') {
                    $fields .= ", password = ?";
                    $params[] = password_hash($password, PASSWORD_DEFAULT);
                }
                $params[] = $id;
                $sql = $pdo->prepare("UPDATE usuarios SET $fields WHERE id_usuario = ?");
                $sql->execute($params);
            }

            echo json_encode(["success" => true]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            dbg_users("GUARDAR_ERROR: ".$e->getMessage());
            echo json_encode(["success" => false, "message" => "Error interno"]);
            exit;
        }
    }

    if ($accion === 'eliminar') {
        $id = isset($input['id']) ? intval($input['id']) : 0;
        try {
            $pdo->prepare("DELETE FROM usuarios WHERE id_usuario = ?")->execute([$id]);
            echo json_encode(["success" => true]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            dbg_users("ELIMINAR_ERROR: ".$e->getMessage());
            echo json_encode(["success" => false, "message" => "Error interno"]);
            exit;
        }
    }

    echo json_encode(["success" => false, "message" => "Acción inválida"]);
    exit;
}

// 🚫 Método no permitido
http_response_code(405);
echo json_encode(["success" => false, "message" => "Método no permitido"]);
exit;