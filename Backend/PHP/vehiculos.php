<?php
// vehiculos.php - devuelve JSON con vehículos (simulado)
header('Content-Type: application/json; charset=utf-8');

$vehicles = [
    ['id'=>1,'marca'=>'Toyota','modelo'=>'Corolla','tipo'=>'turismo','cambio'=>'manual','motor'=>'gasolina','plazas'=>5,'precio'=>45.00,'caracteristicas'=>'Aire acondicionado, Bluetooth','imagen'=>'/Proyecto_Vehiculos/SRC/IMG/toyota_corolla.jpg'],
    ['id'=>2,'marca'=>'Renault','modelo'=>'Kangoo','tipo'=>'furgoneta','cambio'=>'manual','motor'=>'diesel','plazas'=>5,'precio'=>60.00,'caracteristicas'=>'Gran maletero, ideal para carga','imagen'=>'/Proyecto_Vehiculos/SRC/IMG/renault_kangoo.jpg'],
    ['id'=>3,'marca'=>'Tesla','modelo'=>'Model 3','tipo'=>'turismo','cambio'=>'automatico','motor'=>'electrico','plazas'=>5,'precio'=>120.00,'caracteristicas'=>'Autonomía alta, conducción eficiente','imagen'=>'/Proyecto_Vehiculos/SRC/IMG/tesla_model3.jpg'],
    ['id'=>4,'marca'=>'Nissan','modelo'=>'Qashqai','tipo'=>'suv','cambio'=>'automatico','motor'=>'gasolina','plazas'=>5,'precio'=>75.00,'caracteristicas'=>'SUV compacto, cómodo para ciudad','imagen'=>'/Proyecto_Vehiculos/SRC/IMG/nissan_qashqai.jpg'],
    ['id'=>5,'marca'=>'Ford','modelo'=>'Mustang','tipo'=>'deportivo','cambio'=>'manual','motor'=>'gasolina','plazas'=>4,'precio'=>180.00,'caracteristicas'=>'Deportivo, alto rendimiento','imagen'=>'/Proyecto_Vehiculos/SRC/IMG/ford_mustang.jpg'],
    ['id'=>6,'marca'=>'Peugeot','modelo'=>'208','tipo'=>'turismo','cambio'=>'manual','motor'=>'gasolina','plazas'=>5,'precio'=>40.00,'caracteristicas'=>'Económico y ágil','imagen'=>'/Proyecto_Vehiculos/SRC/IMG/peugeot_208.jpg'],
    ['id'=>7,'marca'=>'Kia','modelo'=>'Sorento','tipo'=>'suv','cambio'=>'automatico','motor'=>'hibrido','plazas'=>7,'precio'=>95.00,'caracteristicas'=>'7 plazas, eficiente','imagen'=>'/Proyecto_Vehiculos/SRC/IMG/kia_sorento.jpg'],
    ['id'=>8,'marca'=>'Fiat','modelo'=>'500','tipo'=>'turismo','cambio'=>'manual','motor'=>'gasolina','plazas'=>4,'precio'=>38.00,'caracteristicas'=>'Perfecto para ciudad y aparcar fácil','imagen'=>'/Proyecto_Vehiculos/SRC/IMG/fiat_500.jpg'],
];

// recibir filtros vía GET (o POST)
$tipo = isset($_REQUEST['tipo']) ? trim(strtolower($_REQUEST['tipo'])) : '';
$cambio = isset($_REQUEST['cambio']) ? trim(strtolower($_REQUEST['cambio'])) : '';
$motor = isset($_REQUEST['motor']) ? trim(strtolower($_REQUEST['motor'])) : '';
$plazas = isset($_REQUEST['plazas']) ? intval($_REQUEST['plazas']) : 0;

$out = array_filter($vehicles, function($v) use($tipo,$cambio,$motor,$plazas){
    if ($tipo !== '' && strtolower($v['tipo']) !== $tipo) return false;
    if ($cambio !== '' && strtolower($v['cambio']) !== $cambio) return false;
    if ($motor !== '' && strtolower($v['motor']) !== $motor) return false;
    if ($plazas !== 0 && intval($v['plazas']) !== $plazas) return false;
    return true;
});

// reindexar
$out = array_values($out);

echo json_encode(['success'=>true,'data'=>$out]);
exit;
