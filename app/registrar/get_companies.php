<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la base de datos
$host = '34.45.106.213';
$db   = 'Documentos';
$user = 'root';
$pass = 'CardenasCorp2025';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    // Activar emulación para evitar problemas con Google Cloud y LIKE
    PDO::ATTR_EMULATE_PREPARES   => true 
];

try {
    $conn = new PDO($dsn, $user, $pass, $options);

    // Consulta base
    $sql = "SELECT 
                id_cliente, 
                RUC, 
                razon_social, 
                direccion_fiscal, 
                departamento 
            FROM cliente";

    // Filtros dinámicos
    $where = [];
    $params = [];

    if (!empty($_GET['ruc'])) {
        $where[] = "RUC LIKE :ruc";
        $params[':ruc'] = '%' . $_GET['ruc'] . '%';
    }

    if (!empty($_GET['nombre'])) {
        $where[] = "razon_social LIKE :nombre";
        $params[':nombre'] = '%' . $_GET['nombre'] . '%';
    }

    if ($where) {
        $sql .= " WHERE " . implode(' AND ', $where);
    }

    $sql .= " ORDER BY razon_social ASC LIMIT 50";

    // Ejecutar consulta
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $empresas = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data'    => $empresas,
        'count'   => count($empresas)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_code' => $e->getCode(),
        'sql' => $sql ?? 'No disponible'
    ]);
}
