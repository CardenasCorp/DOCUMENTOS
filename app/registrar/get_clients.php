<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$db   = 'Documentos';
$user = 'root';
$pass = 'root';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false
];

try {
    $conn = new PDO($dsn, $user, $pass, $options);
    
    // Consulta SQL simplificada y sin comentarios internos
    $sql = "SELECT 
            id_cliente as id, 
            RUC, 
            razon_social, 
            direccion_fiscal,
            departamento 
            FROM cliente 
            ORDER BY razon_social ASC";
    
    $stmt = $conn->query($sql);
    $clients = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $clients,
        'count' => count($clients)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_details' => [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'sql' => $sql ?? 'No disponible' // Mostramos la consulta SQL para depuración
        ]
    ]);
}
?>