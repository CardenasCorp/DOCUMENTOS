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
    $conn = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, $options);
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        echo json_encode([
            'success' => true,
            'data' => null // Indicar que es una nueva queja
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT 
            id,
            fecha_presentacion,
            fecha_max,
            fecha_resolucion,
            resumen
        FROM queja
        WHERE id = :id
    ");
    
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $queja = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$queja) {
        throw new Exception('Queja no encontrada');
    }
    
    echo json_encode([
        'success' => true,
        'data' => $queja
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