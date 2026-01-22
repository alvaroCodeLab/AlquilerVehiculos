<?php
require __DIR__ . '/../config.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['admin_logged'])){
	http_response_code(401);
	echo json_encode(['success'=>false,'message'=>'Unauthorized']);
	exit;
}

$result = ['success'=>true,'data'=>[]];

// ingresos mensuales (vista)
$res = $conn->query("SELECT mes, total_ingresos FROM vista_ingresos_mensuales ORDER BY mes DESC LIMIT 12");
$ing = [];
while($r = $res->fetch_assoc()) $ing[] = $r;
$result['data']['ingresos_mensuales'] = $ing;

// vehiculos más alquilados
$res2 = $conn->query("SELECT id_vehiculo, marca, modelo, total_reservas FROM vista_vehiculos_mas_alquilados LIMIT 10");
$vmas = [];
while($r = $res2->fetch_assoc()) $vmas[] = $r;
$result['data']['vehiculos_mas_alquilados'] = $vmas;

// totales rápidos
$q = $conn->query('SELECT (SELECT COUNT(*) FROM vehiculos) AS total_vehiculos, (SELECT COUNT(*) FROM usuarios) AS total_users, (SELECT COUNT(*) FROM reservas) AS total_reservas');
$tot = $q->fetch_assoc();
$result['data']['totales'] = $tot;

echo json_encode($result);
