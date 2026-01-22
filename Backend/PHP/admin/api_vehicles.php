<?php
require __DIR__ . '/../config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

// comprobar sesión de administrador
if (empty($_SESSION['admin_logged'])){
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Helper: responder JSON
function respond($data, $code = 200){ http_response_code($code); echo json_encode($data); exit; }

if ($method === 'GET') {
    $sql = "SELECT v.id_vehiculo, v.marca, v.modelo, v.anio, v.matricula, v.precio_dia, v.estado, v.imagen, c.nombre_categoria FROM vehiculos v LEFT JOIN categorias c ON v.id_categoria = c.id_categoria ORDER BY v.id_vehiculo DESC";
    $res = $conn->query($sql);
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    respond(['success' => true, 'data' => $rows]);
}

if ($method === 'POST') {
    // verificar token CSRF
    $csrf = $_POST['csrf_token'] ?? null;
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (!$csrf && !empty($headers['X-CSRF-Token'])) $csrf = $headers['X-CSRF-Token'];
    if (!$csrf || !hash_equals($_SESSION['csrf_token'] ?? '', $csrf)) respond(['success'=>false,'message'=>'Invalid CSRF token'],401);

    // si action=delete -> borrar
    $action = $_POST['action'] ?? null;
    if ($action === 'delete' && isset($_POST['id'])){
        $id = intval($_POST['id']);
        $stmt = $conn->prepare('DELETE FROM vehiculos WHERE id_vehiculo = ?');
        $stmt->bind_param('i',$id);
        if ($stmt->execute()) respond(['success'=>true]); else respond(['success'=>false,'error'=>$conn->error],500);
    }

    // si id existe -> actualizar
    if (isset($_POST['id']) && !($action === 'delete')){
        $id = intval($_POST['id']);
        // sanitizar y validar campos
        $marca = trim($_POST['marca'] ?? '');
        $modelo = trim($_POST['modelo'] ?? '');
        $anio = intval($_POST['anio'] ?? 0) ?: null;
        $matricula = trim($_POST['matricula'] ?? '');
        $precio = is_numeric($_POST['precio_dia'] ?? null) ? floatval($_POST['precio_dia']) : 0;
        $id_cat = isset($_POST['id_categoria']) ? intval($_POST['id_categoria']) : null;
        $estado = trim($_POST['estado'] ?? 'disponible');
        $desc = trim($_POST['descripcion'] ?? null);

        // validaciones básicas
        $allowed_states = ['disponible','ocupado','mantenimiento'];
        if ($marca === '' || $modelo === '') respond(['success'=>false,'message'=>'Marca y modelo requeridos'],400);
        if ($precio < 0) respond(['success'=>false,'message'=>'Precio inválido'],400);
        if ($anio !== null && ($anio < 1900 || $anio > 2050)) respond(['success'=>false,'message'=>'Año inválido'],400);
        if ($estado && !in_array($estado, $allowed_states)) respond(['success'=>false,'message'=>'Estado inválido'],400);

        // imagen opcional con validación
        $imagenPath = null;
        if (!empty($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            // comprobar tamaño y tipo
            $maxBytes = 3 * 1024 * 1024; // 3MB
            if ($_FILES['imagen']['size'] > $maxBytes) respond(['success'=>false,'message'=>'Imagen demasiado grande'],400);
            $info = getimagesize($_FILES['imagen']['tmp_name']);
            if ($info === false) respond(['success'=>false,'message'=>'Archivo no es imagen'],400);
            $mime = $info['mime'];
            $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
            if (!isset($allowed[$mime])) respond(['success'=>false,'message'=>'Tipo de imagen no permitido'],400);
            $ext = $allowed[$mime];
            $uploadDir = realpath(__DIR__ . '/../../Frontend/assets/uploads/vehicles') ?: __DIR__ . '/../../Frontend/assets/uploads/vehicles';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            $fname = 'veh_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
            $target = $uploadDir . DIRECTORY_SEPARATOR . $fname;
            if (move_uploaded_file($_FILES['imagen']['tmp_name'], $target)){
                $imagenPath = '/Proyecto_Vehiculos/Frontend/assets/uploads/vehicles/' . $fname;
            }
        }

        if ($imagenPath) {
            $stmt = $conn->prepare('UPDATE vehiculos SET id_categoria=?, marca=?, modelo=?, anio=?, matricula=?, precio_dia=?, descripcion=?, estado=?, imagen=? WHERE id_vehiculo = ?');
            $stmt->bind_param('ississsssi', $id_cat, $marca, $modelo, $anio, $matricula, $precio, $desc, $estado, $imagenPath, $id);
        } else {
            $stmt = $conn->prepare('UPDATE vehiculos SET id_categoria=?, marca=?, modelo=?, anio=?, matricula=?, precio_dia=?, descripcion=?, estado=? WHERE id_vehiculo = ?');
            $stmt->bind_param('ississssi', $id_cat, $marca, $modelo, $anio, $matricula, $precio, $desc, $estado, $id);
        }
        if ($stmt->execute()) respond(['success'=>true]); else respond(['success'=>false,'error'=>$conn->error],500);
    }

    // Crear vehículo. Campos esperados: marca, modelo, anio, matricula, precio_dia, id_categoria, estado
    // validar y sanear
    $marca = trim($_POST['marca'] ?? '');
    $modelo = trim($_POST['modelo'] ?? '');
    $anio = intval($_POST['anio'] ?? 0) ?: null;
    $matricula = trim($_POST['matricula'] ?? '');
    $precio = is_numeric($_POST['precio_dia'] ?? null) ? floatval($_POST['precio_dia']) : 0;
    $id_cat = isset($_POST['id_categoria']) ? intval($_POST['id_categoria']) : null;
    $estado = trim($_POST['estado'] ?? 'disponible');
    $desc = trim($_POST['descripcion'] ?? null);

    if ($marca === '' || $modelo === '') respond(['success'=>false,'message'=>'Marca y modelo requeridos'],400);
    if ($precio < 0) respond(['success'=>false,'message'=>'Precio inválido'],400);
    if ($anio !== null && ($anio < 1900 || $anio > 2050)) respond(['success'=>false,'message'=>'Año inválido'],400);

    // manejo de imagen con validación
    $imagenPath = null;
    if (!empty($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
        $maxBytes = 3 * 1024 * 1024; // 3MB
        if ($_FILES['imagen']['size'] > $maxBytes) respond(['success'=>false,'message'=>'Imagen demasiado grande'],400);
        $info = getimagesize($_FILES['imagen']['tmp_name']);
        if ($info === false) respond(['success'=>false,'message'=>'Archivo no es imagen'],400);
        $mime = $info['mime'];
        $allowed = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
        if (!isset($allowed[$mime])) respond(['success'=>false,'message'=>'Tipo de imagen no permitido'],400);
        $ext = $allowed[$mime];
        $uploadDir = realpath(__DIR__ . '/../../Frontend/assets/uploads/vehicles') ?: __DIR__ . '/../../Frontend/assets/uploads/vehicles';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        $fname = 'veh_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $target = $uploadDir . DIRECTORY_SEPARATOR . $fname;
        if (move_uploaded_file($_FILES['imagen']['tmp_name'], $target)){
            $imagenPath = '/Proyecto_Vehiculos/Frontend/assets/uploads/vehicles/' . $fname;
        }
    }

    $stmt = $conn->prepare("INSERT INTO vehiculos (id_categoria, marca, modelo, anio, matricula, precio_dia, descripcion, estado, imagen) VALUES (?,?,?,?,?,?,?,?,?)");
    $stmt->bind_param('ississsss', $id_cat, $marca, $modelo, $anio, $matricula, $precio, $desc, $estado, $imagenPath);
    if ($stmt->execute()) {
        respond(['success' => true, 'id' => $stmt->insert_id]);
    } else respond(['success'=>false,'error'=>$conn->error],500);
}

respond(['success'=>false,'message'=>'Method not allowed'],405);
