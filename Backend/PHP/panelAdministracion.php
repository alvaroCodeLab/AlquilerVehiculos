<?php
include("config.php");

header("Content-Type: application/json; charset=utf-8");

// =====================================================
//    TOTALES
// =====================================================

$totalVehiculos = $conn->query("
    SELECT COUNT(*) AS total 
    FROM vehiculos
")->fetch_assoc()['total'];

$totalClientes = $conn->query("
    SELECT COUNT(*) AS total 
    FROM usuarios 
    WHERE rol = 'cliente'
")->fetch_assoc()['total'];

$totalReservas = $conn->query("
    SELECT COUNT(*) AS total 
    FROM reservas
")->fetch_assoc()['total'];

$ingresosTotales = $conn->query("
    SELECT SUM(monto) AS total 
    FROM pagos 
    WHERE estado_pago = 'completado'
")->fetch_assoc()['total'] ?? 0;


// =====================================================
//    INGRESOS MENSUALES
// =====================================================

$ingresosMensuales = [];
$q1 = $conn->query("
    SELECT mes, total_ingresos 
    FROM vista_ingresos_mensuales
");

while ($row = $q1->fetch_assoc()) {
    $ingresosMensuales[] = [
        "mes" => $row["mes"],
        "total" => $row["total_ingresos"]
    ];
}


// =====================================================
//    VEHÍCULOS MÁS ALQUILADOS
// =====================================================

$vehiculosPopulares = [];
$q2 = $conn->query("
    SELECT marca, modelo, total_reservas 
    FROM vista_vehiculos_mas_alquilados 
    LIMIT 10
");

while ($row = $q2->fetch_assoc()) {
    $vehiculosPopulares[] = [
        "modelo" => $row["marca"] . " " . $row["modelo"],
        "total" => $row["total_reservas"]
    ];
}


// =====================================================
//    LISTA COMPLETA DE VEHÍCULOS
//    → incluye nombre_categoria
// =====================================================

$listaVehiculos = [];

$q3 = $conn->query("
    SELECT v.*, c.nombre_categoria
    FROM vehiculos v
    LEFT JOIN categorias c ON v.id_categoria = c.id_categoria
");

while ($row = $q3->fetch_assoc()) {
    $listaVehiculos[] = $row;
}


// =====================================================
//    DISTRIBUCIÓN POR ESTADO DE LOS VEHÍCULOS
// =====================================================

$estadoDistribution = [];
$q4 = $conn->query("
    SELECT estado, COUNT(*) AS total 
    FROM vehiculos 
    GROUP BY estado
");

while ($row = $q4->fetch_assoc()) {
    $estadoDistribution[] = [
        "estado" => $row["estado"],
        "total" => (int)$row["total"]
    ];
}


// =====================================================
//    RESERVAS ÚLTIMOS 7 DÍAS
// =====================================================

$reservasSemana = [];
$q5 = $conn->query("
    SELECT DATE(fecha_reserva) AS dia, COUNT(*) AS total 
    FROM reservas 
    WHERE fecha_reserva >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY dia 
    ORDER BY dia ASC
");

while ($row = $q5->fetch_assoc()) {
    $reservasSemana[] = [
        "dia" => $row["dia"],
        "total" => (int)$row["total"]
    ];
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
