<?php
require "config.php";  // ✅ require
header("Content-Type: application/json; charset=utf-8"); // ✅ cabecera segura

// Permitir solo POST/GET
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET','POST'])) {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Método no permitido"]);
    exit;
}

// Crear PDO
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
$logFile = $logDir . '/vehiculos_crud.log';
function dbg_vehiculos($msg)
{
    global $logFile;
    @file_put_contents($logFile, "[".date('Y-m-d H:i:s')."] ".$msg.PHP_EOL, FILE_APPEND);
}
dbg_vehiculos("vehiculosCRUD called, method=" . $method);

// ===== POST acciones =====
$input = $_POST;
$accion = $input['accion'] ?? null;

// =========================
// AGREGAR / EDITAR VEHÍCULO
// =========================
if ($method === 'POST' && $accion === 'guardar') {

    $id = isset($input["id"]) ? $input["id"] : '';
    $marca = trim($input["marca"] ?? '');
    $modelo = trim($input["modelo"] ?? '');
    $matricula = trim($input["matricula"] ?? '');
    $precio = isset($input["precio_dia"]) ? floatval($input["precio_dia"]) : (isset($input["precio"]) ? floatval($input["precio"]) : 0);
    $estado = $input["estado"] ?? 'disponible';
    $id_categoria = isset($input["id_categoria"]) ? intval($input["id_categoria"]) : 1;
    $anio = $input["anio"] ?? null;
    $cambio_marchas = $input["cambio_marchas"] ?? null;
    $numero_plazas = isset($input["numero_plazas"]) ? intval($input["numero_plazas"]) : null;
    $tipo_motor = $input["tipo_motor"] ?? null;
    $caballos = isset($input["caballos"]) ? intval($input["caballos"]) : null;
    $descripcion = $input["descripcion"] ?? null;

    // Imagen
    $nombreImagen = null;
    if (!empty($_FILES["imagen"]["name"])) {
        $nombreImagen = time() . "_" . preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($_FILES["imagen"]["name"]));
        $destDir = __DIR__ . '/../../SRC/IMG/vehiculos/';
        if (!is_dir($destDir)) @mkdir($destDir, 0755, true);
        move_uploaded_file($_FILES["imagen"]["tmp_name"], $destDir . $nombreImagen);
    }

    try {
        if ($id === "") {
            $sql = $pdo->prepare("INSERT INTO vehiculos (id_categoria, marca, modelo, cambio_marchas, numero_plazas, tipo_motor, caballos, anio, matricula, precio_dia, descripcion, estado, imagen)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $sql->execute([$id_categoria, $marca, $modelo, $cambio_marchas, $numero_plazas, $tipo_motor, $caballos, $anio, $matricula, $precio, $descripcion, $estado, $nombreImagen]);
        } else {
            $fields = "id_categoria=?, marca=?, modelo=?, cambio_marchas=?, numero_plazas=?, tipo_motor=?, caballos=?, anio=?, matricula=?, precio_dia=?, descripcion=?, estado=?";
            if ($nombreImagen) $fields .= ", imagen=?";
            $sql = $pdo->prepare("UPDATE vehiculos SET $fields WHERE id_vehiculo=?");

            $params = [$id_categoria, $marca, $modelo, $cambio_marchas, $numero_plazas, $tipo_motor, $caballos, $anio, $matricula, $precio, $descripcion, $estado];
            if ($nombreImagen) $params[] = $nombreImagen;
            $params[] = $id;

            $sql->execute($params);
        }

        echo json_encode(["success" => true]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        dbg_vehiculos("GUARDAR_ERROR: ".$e->getMessage());
        echo json_encode(["success" => false, "message" => "Error interno"]);
        exit;
    }
}

// =================
// ELIMINAR VEHÍCULO
// =================
if ($method === 'POST' && $accion === 'eliminar') {
    $id = isset($input["id"]) ? intval($input["id"]) : 0;
    try {
        $pdo->prepare("DELETE FROM vehiculos WHERE id_vehiculo=?")->execute([$id]);
        echo json_encode(["success" => true]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        dbg_vehiculos("ELIMINAR_ERROR: ".$e->getMessage());
        echo json_encode(["success" => false, "message" => "Error interno"]);
        exit;
    }
}

// 🚫 Acción inválida
echo json_encode(["success" => false, "message" => "Acción inválida"]);
exit;