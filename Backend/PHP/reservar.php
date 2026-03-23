<?php
require("config.php");
session_start();
header("Content-Type: application/json; charset=utf-8");

// ❌ Solo desarrollo (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

// ✅ Verificar sesión
if (!isset($_SESSION['user']['id_usuario'])) {
    echo json_encode(["success" => false, "message" => "Debes iniciar sesión"]);
    exit;
}

$id_usuario = (int) $_SESSION['user']['id_usuario'];
$id_vehiculo = isset($_POST["id_vehiculo"]) ? (int)$_POST["id_vehiculo"] : 0;
$fecha_inicio = $_POST["fecha_inicio"] ?? "";
$fecha_fin = $_POST["fecha_fin"] ?? "";
$metodo_pago = $_POST["metodo_pago"] ?? "";

// ✅ Validación básica
if (!$id_vehiculo || !$fecha_inicio || !$fecha_fin || !$metodo_pago) {
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
    exit;
}

// ❌ NO permitir reservar si fecha_inicio es anterior a HOY
$hoy = date("Y-m-d");
if ($fecha_inicio < $hoy) {
    echo json_encode(["success" => false, "message" => "La fecha de inicio no puede ser anterior al día actual"]);
    exit;
}

// ✅ Consultar estado y precio del vehículo
$stmtVeh = $conn->prepare("SELECT precio_dia, estado FROM vehiculos WHERE id_vehiculo = ? LIMIT 1");
$stmtVeh->bind_param("i", $id_vehiculo);
$stmtVeh->execute();
$resVeh = $stmtVeh->get_result();
if (!$resVeh || $resVeh->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Vehículo no encontrado"]);
    exit;
}
$v = $resVeh->fetch_assoc();

if ($v["estado"] !== "disponible") {
    echo json_encode(["success" => false, "message" => "El vehículo no está disponible"]);
    exit;
}

// ✅ Evitar reservas duplicadas activas
$stmtChk = $conn->prepare("
    SELECT 1 FROM reservas 
    WHERE id_vehiculo = ? AND estado IN ('pendiente','confirmada')
    LIMIT 1
");
$stmtChk->bind_param("i", $id_vehiculo);
$stmtChk->execute();
$resChk = $stmtChk->get_result();
if ($resChk && $resChk->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "El vehículo ya está reservado"]);
    exit;
}

// ✅ Calcular total y validar fechas
$diash = (strtotime($fecha_fin) - strtotime($fecha_inicio)) / 86400;
if ($diash <= 0) {
    echo json_encode(["success" => false, "message" => "Las fechas no son válidas"]);
    exit;
}

$total = $diash * floatval($v["precio_dia"]);

// ✅ Insertar reserva
$stmtInsert = $conn->prepare("
    INSERT INTO reservas (id_usuario, id_vehiculo, fecha_inicio, fecha_fin, estado, total)
    VALUES (?, ?, ?, ?, 'confirmada', ?)
");
$stmtInsert->bind_param("i(sssi)", $id_usuario, $id_vehiculo, $fecha_inicio, $fecha_fin, $total);
if (!$stmtInsert->execute()) {
    error_log("DB ERROR (reserva): " . $conn->error);
    echo json_encode(["success" => false, "message" => "Error al crear la reserva"]);
    exit;
}
$id_reserva = $conn->insert_id;

// ✅ Cambiar estado vehículo a alquilado
$stmtUpdVeh = $conn->prepare("UPDATE vehiculos SET estado='alquilado' WHERE id_vehiculo = ?");
$stmtUpdVeh->bind_param("i", $id_vehiculo);
$stmtUpdVeh->execute();

// ✅ Registrar pago
$stmtPago = $conn->prepare("
    INSERT INTO pagos (id_reserva, metodo_pago, monto, estado_pago)
    VALUES (?, ?, ?, 'completado')
");
$stmtPago->bind_param("isd", $id_reserva, $metodo_pago, $total);
$stmtPago->execute();

echo json_encode([
    "success" => true,
    "message" => "Reserva completada con éxito"
]);

$conn->close();
exit;