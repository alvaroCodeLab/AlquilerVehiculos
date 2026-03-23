<?php
require('config.php');

header("Content-Type: application/json; charset=utf-8");

// ❌ Solo desarrollo (en producción dejar en 0)
ini_set('display_errors', 0);
error_reporting(0);

// =====================================================
//    TOTALES
// =====================================================
$totalVehiculos = $conn->query("SELECT COUNT(*) AS total FROM vehiculos");
if (!$totalVehiculos) {
    error_log("QUERY ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}
$totalVehiculos = $totalVehiculos->fetch_assoc()['total'];

$totalClientes = $conn->query("SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'cliente'");
if (!$totalClientes) {
    error_log("QUERY ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}
$totalClientes = $totalClientes->fetch_assoc()['total'];

$totalReservas = $conn->query("SELECT COUNT(*) AS total FROM reservas");
if (!$totalReservas) {
    error_log("QUERY ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}
$totalReservas = $totalReservas->fetch_assoc()['total'];

$ingresosTotales = $conn->query("SELECT SUM(monto) AS total FROM pagos WHERE estado_pago = 'completado'");
if (!$ingresosTotales) {
    error_log("QUERY ERROR: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
    exit;
}
$ingresosTotales = $ingresosTotales->fetch_assoc()['total'] ?? 0;

// =====================================================
//    INGRESOS MENSUALES
// =====================================================
$ingresosMensuales = [];
$q1 = $conn->query("SELECT mes, total_ingresos FROM vista_ingresos_mensuales");
if ($q1) {
    while ($row = $q1->fetch_assoc()) {
        $ingresosMensuales[] = [
            "mes" => $row["mes"],
            "total" => $row["total_ingresos"]
        ];
    }
} else {
    error_log("QUERY ERROR: " . $conn->error);
}

// =====================================================
//    VEHÍCULOS MÁS ALQUILADOS
// =====================================================
$vehiculosPopulares = [];
$q2 = $conn->query("SELECT marca, modelo, total_reservas FROM vista_vehiculos_mas_alquilados LIMIT 10");
if ($q2) {
    while ($row = $q2->fetch_assoc()) {
        $vehiculosPopulares[] = [
            "modelo" => $row["marca"] . " " . $row["modelo"],
            "total" => $row["total_reservas"]
        ];
    }
} else {
    error_log("QUERY ERROR: " . $conn->error);
}

// =====================================================
//    LISTA COMPLETA DE VEHÍCULOS
// =====================================================
$listaVehiculos = [];
$q3 = $conn->query("SELECT v.*, c.nombre_categoria FROM vehiculos v LEFT JOIN categorias c ON v.id_categoria = c.id_categoria");
if ($q3) {
    while ($row = $q3->fetch_assoc()) {
        $listaVehiculos[] = $row;
    }
} else {
    error_log("QUERY ERROR: " . $conn->error);
}

// =====================================================
//    DISTRIBUCIÓN POR ESTADO DE LOS VEHÍCULOS
// =====================================================
$estadoDistribution = [];
$q4 = $conn->query("SELECT estado, COUNT(*) AS total FROM vehiculos GROUP BY estado");
if ($q4) {
    while ($row = $q4->fetch_assoc()) {
        $estadoDistribution[] = [
            "estado" => $row["estado"],
            "total" => (int)$row["total"]
        ];
    }
} else {
    error_log("QUERY ERROR: " . $conn->error);
}

// =====================================================
//    RESERVAS ÚLTIMOS 7 DÍAS
// =====================================================
$reservasSemana = [];
$q5 = $conn->query("SELECT DATE(fecha_reserva) AS dia, COUNT(*) AS total FROM reservas WHERE fecha_reserva >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY dia ORDER BY dia ASC");
if ($q5) {
    while ($row = $q5->fetch_assoc()) {
        $reservasSemana[] = [
            "dia" => $row["dia"],
            "total" => (int)$row["total"]
        ];
    }
} else {
    error_log("QUERY ERROR: " . $conn->error);
}

// =====================================================
//    RESPUESTA JSON COMPLETA
// =====================================================
echo json_encode([
    "totalVehiculos"      => $totalVehiculos,
    "totalClientes"       => $totalClientes,
    "totalReservas"       => $totalReservas,
    "ingresosTotales"     => $ingresosTotales,
    "ingresosMensuales"   => $ingresosMensuales,
    "vehiculosPopulares"  => $vehiculosPopulares,
    "estadoDistribution"  => $estadoDistribution,
    "reservasSemana"      => $reservasSemana,
    "listaVehiculos"      => $listaVehiculos
], JSON_UNESCAPED_UNICODE);

$conn->close();
exit;