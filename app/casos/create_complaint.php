<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

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
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data || !isset($data['id_fiscalizacion'])) {
        throw new Exception('Datos inválidos');
    }

    $stmt = $conn->prepare("
        INSERT INTO queja (
            id_fiscalizacion,
            fecha_presentacion,
            fecha_max,
            fecha_resolucion,
            resumen
        ) VALUES (
            :id_fiscalizacion,
            :fecha_presentacion,
            :fecha_max,
            :fecha_resolucion,
            :resumen
        )
    ");
    
    $stmt->execute([
        ':id_fiscalizacion' => $data['id_fiscalizacion'],
        ':fecha_presentacion' => $data['fecha_presentacion'] ?? null,
        ':fecha_max' => $data['fecha_max'] ?? null,
        ':fecha_resolucion' => $data['fecha_resolucion'] ?? null,
        ':resumen' => $data['resumen'] ?? null
    ]);
    
    $id = $conn->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'id' => $id,
        'message' => 'Queja creada correctamente'
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