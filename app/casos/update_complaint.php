<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT');
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
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $conn = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass, $options);
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data || !isset($data['id'])) {
        throw new Exception('Datos inválidos');
    }

    $stmt = $conn->prepare("
        UPDATE queja SET
            fecha_presentacion = :fecha_presentacion,
            fecha_max = :fecha_max,
            fecha_resolucion = :fecha_resolucion,
            resumen = :resumen
        WHERE id = :id
    ");
    
    $stmt->execute([
        ':id' => $data['id'],
        ':fecha_presentacion' => $data['fecha_presentacion'] ?? null,
        ':fecha_max' => $data['fecha_max'] ?? null,
        ':fecha_resolucion' => $data['fecha_resolucion'] ?? null,
        ':resumen' => $data['resumen'] ?? null
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Queja actualizada correctamente'
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