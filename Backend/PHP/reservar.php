<?php
include("config.php");
session_start();
header("Content-Type: application/json");

// Verificar sesión
if (!isset($_SESSION['user']['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión"]);
    exit;
}

$id_usuario = $_SESSION['user']['id_usuario'];
$id_vehiculo = intval($_POST["id_vehiculo"] ?? 0);
$fecha_inicio = $_POST["fecha_inicio"] ?? "";
$fecha_fin = $_POST["fecha_fin"] ?? "";
$metodo_pago = $_POST["metodo_pago"] ?? "";

if (!$id_vehiculo || !$fecha_inicio || !$fecha_fin || !$metodo_pago) {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

/* NO permitir reservar si fecha_inicio es anterior a HOY */
$hoy = date("Y-m-d");
if ($fecha_inicio < $hoy) {
    echo json_encode(["success" => false, "message" => "La fecha de inicio no puede ser anterior al día actual"]);
    exit;
}

// Verificar estado vehículo
$qVeh = $conn->query("SELECT precio_dia, estado FROM vehiculos WHERE id_vehiculo=$id_vehiculo LIMIT 1");

if (!$qVeh || $qVeh->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Vehículo no encontrado"]);
    exit;
}

$v = $qVeh->fetch_assoc();

if ($v["estado"] !== "disponible") {
    echo json_encode(["success" => false, "message" => "El vehículo no está disponible"]);
    exit;
}

// Evitar reservas duplicadas activas
$qChk = $conn->query("
    SELECT * FROM reservas 
    WHERE id_vehiculo=$id_vehiculo 
    AND estado IN ('pendiente','confirmada')
    LIMIT 1
");

if ($qChk->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "El vehículo ya está reservado"]);
    exit;
}

// Calcular total y validar fechas
$diash = (strtotime($fecha_fin) - strtotime($fecha_inicio)) / 86400;

if ($diash <= 0) {
    echo json_encode(["success" => false, "message" => "Las fechas no son válidas"]);
    exit;
}

$total = $diash * floatval($v["precio_dia"]);

// Insertar reserva
$conn->query("
    INSERT INTO reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado, total)
    VALUES ($id_usuario, $id_vehiculo, '$fecha_inicio', '$fecha_fin', 'confirmada', $total)
");

$id_reserva = $conn->insert_id;

// Cambiar estado vehículo a alquilado
$conn->query("UPDATE vehiculos SET estado='alquilado' WHERE id_vehiculo=$id_vehiculo");

// Registrar pago
$conn->query("
    INSERT INTO pagos (id_reserva, metodo_pago, monto, estado_pago)
    VALUES ($id_reserva, '$metodo_pago', $total, 'completado')
");

echo json_encode([
    "success" => true,
    "message" => "Reserva completada con éxito"
]);
