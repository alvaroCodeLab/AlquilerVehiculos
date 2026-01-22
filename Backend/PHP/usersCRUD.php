<?php
require "config.php";
header("Content-Type: application/json");

// Crear PDO 
try {
    $pdo = new PDO("mysql:host={$servername};dbname={$dbname};charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection error: " . $e->getMessage()]);
    exit;
}

// Simple logging
$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
$logFile = $logDir . '/users_crud.log';
function dbg_users($m)
{
    global $logFile;
    @file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] " . $m . PHP_EOL, FILE_APPEND);
}
dbg_users("usersCRUD called, method=" . ($_SERVER['REQUEST_METHOD'] ?? ''));

// GET -> listar usuarios
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id_usuario, nombre, primer_apellido, segundo_apellido, email, telefono, direccion, rol, fecha_registro FROM usuarios ORDER BY id_usuario DESC");
        $rows = $stmt->fetchAll();
        echo json_encode(["success" => true, "usuarios" => $rows]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        dbg_users("LIST_ERROR: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit;
    }
}

// Para POST: acciones guardar o eliminar
$input = $_POST;
$accion = isset($input['accion']) ? $input['accion'] : null;

if ($accion === 'guardar') {
    $id = isset($input['id']) && $input['id'] !== '' ? intval($input['id']) : '';
    $nombre = isset($input['nombre']) ? trim($input['nombre']) : '';
    $primer_apellido = isset($input['primer_apellido']) ? trim($input['primer_apellido']) : '';
    $segundo_apellido = isset($input['segundo_apellido']) ? trim($input['segundo_apellido']) : null;
    $email = isset($input['email']) ? trim($input['email']) : '';
    $telefono = isset($input['telefono']) ? trim($input['telefono']) : null;
    $direccion = isset($input['direccion']) ? trim($input['direccion']) : null;
    $rol = isset($input['rol']) ? $input['rol'] : 'cliente';
    $password = isset($input['password']) ? $input['password'] : '';

    try {
        if ($id === '') {
            // crear
            if ($password === '') {
                throw new Exception('La contraseña es obligatoria al crear un usuario');
            }
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $sql = $pdo->prepare("INSERT INTO usuarios (nombre, primer_apellido, segundo_apellido, email, password, telefono, direccion, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $sql->execute([$nombre, $primer_apellido, $segundo_apellido, $email, $hash, $telefono, $direccion, $rol]);
        } else {
            // actualizar: no sobrescribir password si no viene
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
        dbg_users("GUARDAR_ERROR: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
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
        dbg_users("ELIMINAR_ERROR: " . $e->getMessage());
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit;
    }
}

echo json_encode(["success" => false, "message" => "Acción inválida"]);
