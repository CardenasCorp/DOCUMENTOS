<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = '34.45.106.213';
$db   = 'Documentos';
$user = 'root';
$pass = 'CardenasCorp2025';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $conn = new PDO($dsn, $user, $pass, $options);
    
    $query = "SELECT 
        f.id_fiscalizacion,
        f.numero,
        f.id_tipo,
        f.fecha_notificacion,
        f.fecha_presentacion,
        f.id_estado,
        f.id_etapa,
        f.IGV,
        f.periodo_inicio, 
        f.periodo_final,    
        c.RUC,
        c.razon_social
        FROM fiscalizacion f
        LEFT JOIN cliente c ON f.id_cliente = c.id_cliente
        WHERE f.id_estado != 5  
        ORDER BY f.fecha_notificacion DESC";
    
    $stmt = $conn->query($query);
    $cases = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $cases
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_info' => $e->errorInfo  // Para debug adicional
    ]);
}