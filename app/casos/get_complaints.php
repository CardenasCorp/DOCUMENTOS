<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$db   = 'Documentos';
$user = 'root';
$pass = 'root';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $conn = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, $options);
    
    $id_fiscalizacion = $_GET['id_fiscalizacion'] ?? null;
    
    if (!$id_fiscalizacion) {
        throw new Exception('ID de fiscalización no proporcionado');
    }

    $stmt = $conn->prepare("
        SELECT 
            id,
            fecha_presentacion,
            fecha_max,
            fecha_resolucion,
            resumen
        FROM queja
        WHERE id_fiscalizacion = :id_fiscalizacion
        ORDER BY fecha_presentacion DESC
    ");
    
    $stmt->bindParam(':id_fiscalizacion', $id_fiscalizacion, PDO::PARAM_INT);
    $stmt->execute();
    
    $quejas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $quejas
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}