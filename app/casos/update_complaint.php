<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT');
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
    $conn = new PDO($dsn, $user, $pass, $options);
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data || !isset($data['id'])) {
        throw new Exception('Datos inválidos');
    }

    // Limpiar campos: convertir cadenas vacías en null
    $fecha_presentacion = !empty($data['fecha_presentacion']) ? $data['fecha_presentacion'] : null;
    $fecha_max = !empty($data['fecha_max']) ? $data['fecha_max'] : null;
    $fecha_resolucion = !empty($data['fecha_resolucion']) ? $data['fecha_resolucion'] : null;
    $resumen = $data['resumen'] ?? null;
    $id = $data['id'];

    $stmt = $conn->prepare("
        UPDATE queja SET
            fecha_presentacion = :fecha_presentacion,
            fecha_max = :fecha_max,
            fecha_resolucion = :fecha_resolucion,
            resumen = :resumen
        WHERE id = :id
    ");
    
    $stmt->execute([
        ':id' => $id,
        ':fecha_presentacion' => $fecha_presentacion,
        ':fecha_max' => $fecha_max,
        ':fecha_resolucion' => $fecha_resolucion,
        ':resumen' => $resumen
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
