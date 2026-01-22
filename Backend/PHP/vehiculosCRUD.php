<?php
require "config.php";
// `config.php` define $servername, $username, $password, $dbname
// Crear también un objeto PDO `$pdo` para las consultas usadas en este script.
try {
    $pdo = new PDO("mysql:host={$servername};dbname={$dbname};charset=utf8", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection error: " . $e->getMessage()]);
    // también log
    if (!headers_sent()) {
        // nothing
    }
    exit;
}
header("Content-Type: application/json");
// DEBUG: registrar errores fatales y entrada para depuración
error_reporting(E_ALL);
ini_set('display_errors', 0);

$logDir = __DIR__ . '/../../logs';
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
$logFile = $logDir . '/vehiculos_crud.log';

function dbg_log($msg)
{
    global $logFile;
    @file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] " . $msg . PHP_EOL, FILE_APPEND);
}

dbg_log("---- nueva petición ----");
dbg_log("REQUEST_METHOD=" . ($_SERVER['REQUEST_METHOD'] ?? ''));
dbg_log("REQUEST_URI=" . ($_SERVER['REQUEST_URI'] ?? ''));
dbg_log("POST_KEYS=" . json_encode(array_keys($_POST)));
$filesInfo = [];
foreach ($_FILES as $k => $f) {
    $filesInfo[$k] = isset($f['name']) ? $f['name'] : null;
}
dbg_log("FILES=" . json_encode($filesInfo));

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    dbg_log("PHP_ERROR: $errstr in $errfile:$errline");
});

register_shutdown_function(function () {
    $err = error_get_last();
    if ($err) {
        dbg_log("SHUTDOWN_ERROR: " . json_encode($err));
        if (!headers_sent()) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server fatal error"]);
        }
    }
});

// ========== AGREGAR / EDITAR VEHÍCULO ==========
if (isset($_POST["accion"]) && $_POST["accion"] === "guardar") {

    // Recoger campos (compatibilidad con frontend antiguo y nuevo)
    $id = isset($_POST["id"]) ? $_POST["id"] : '';
    $marca = isset($_POST["marca"]) ? trim($_POST["marca"]) : '';
    $modelo = isset($_POST["modelo"]) ? trim($_POST["modelo"]) : '';
    $matricula = isset($_POST["matricula"]) ? trim($_POST["matricula"]) : '';
    // aceptar tanto 'precio' como 'precio_dia'
    $precio = isset($_POST["precio_dia"]) ? $_POST["precio_dia"] : (isset($_POST["precio"]) ? $_POST["precio"] : 0);
    $estado = isset($_POST["estado"]) ? $_POST["estado"] : 'disponible';
    $id_categoria = isset($_POST["id_categoria"]) && $_POST["id_categoria"] !== '' ? intval($_POST["id_categoria"]) : 1;
    $anio = isset($_POST["anio"]) && $_POST["anio"] !== '' ? $_POST["anio"] : null;
    $cambio_marchas = isset($_POST["cambio_marchas"]) ? $_POST["cambio_marchas"] : null;
    $numero_plazas = isset($_POST["numero_plazas"]) && $_POST["numero_plazas"] !== '' ? intval($_POST["numero_plazas"]) : null;
    $tipo_motor = isset($_POST["tipo_motor"]) ? $_POST["tipo_motor"] : null;
    $caballos = isset($_POST["caballos"]) && $_POST["caballos"] !== '' ? intval($_POST["caballos"]) : null;
    $descripcion = isset($_POST["descripcion"]) ? $_POST["descripcion"] : null;

    // Imagen
    $nombreImagen = null;

    if (!empty($_FILES["imagen"]["name"])) {
        $nombreImagen = time() . "_" . preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($_FILES["imagen"]["name"]));
        // Intentar crear directorio si no existe
        $destDir = __DIR__ . '/../../SRC/IMG/vehiculos/';
        if (!is_dir($destDir)) @mkdir($destDir, 0755, true);
        move_uploaded_file($_FILES["imagen"]["tmp_name"], $destDir . $nombreImagen);
    }

    try {
        if ($id == "") {
            // INSERT con todos los campos
            $sql = $pdo->prepare("INSERT INTO vehiculos (id_categoria, marca, modelo, cambio_marchas, numero_plazas, tipo_motor, caballos, anio, matricula, precio_dia, descripcion, estado, imagen)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $sql->execute([$id_categoria, $marca, $modelo, $cambio_marchas, $numero_plazas, $tipo_motor, $caballos, $anio, $matricula, $precio, $descripcion, $estado, $nombreImagen]);
        } else {
            // UPDATE: construir dinámica para imagen opcional
            $fields = "id_categoria = ?, marca = ?, modelo = ?, cambio_marchas = ?, numero_plazas = ?, tipo_motor = ?, caballos = ?, anio = ?, matricula = ?, precio_dia = ?, descripcion = ?, estado = ?";
            if ($nombreImagen) $fields .= ", imagen = ?";
            $sql = $pdo->prepare("UPDATE vehiculos SET $fields WHERE id_vehiculo = ?");

            $params = [$id_categoria, $marca, $modelo, $cambio_marchas, $numero_plazas, $tipo_motor, $caballos, $anio, $matricula, $precio, $descripcion, $estado];
            if ($nombreImagen) $params[] = $nombreImagen;
            $params[] = $id;

            $sql->execute($params);
        }

        echo json_encode(["success" => true]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit;
    }
}

// ========== ELIMINAR VEHÍCULO ==========
if (isset($_POST["accion"]) && $_POST["accion"] === "eliminar") {

    $id = intval($_POST["id"]);
    try {
        $pdo->prepare("DELETE FROM vehiculos WHERE id_vehiculo=?")->execute([$id]);
        echo json_encode(["success" => true]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
        exit;
    }
}

echo json_encode(["error" => "Acción inválida"]);
