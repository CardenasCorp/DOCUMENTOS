<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir la configuración de la base de datos
require_once '../config/database.php';

try {
    // Obtener la conexión usando el método connect() de la clase Database
    $pdo = Database::connect();

    $id_cliente = $_GET['id_cliente'] ?? null;
    
    if (!$id_cliente) {
        throw new Exception('ID de cliente no proporcionado');
    }

    // Validar que el ID sea numérico
    if (!is_numeric($id_cliente)) {
        throw new Exception('ID de cliente inválido');
    }

    $stmt = $pdo->prepare("
        SELECT 
            id,
            id_cliente,
            gerente,
            dni, 
            fecha_inicio,
            fecha_fin
        FROM historial_gerentes 
        WHERE id_cliente = ? 
        ORDER BY fecha_inicio DESC, fecha_fin IS NULL DESC
    ");
    
    if (!$stmt) {
        throw new Exception('Error al preparar la consulta');
    }

    $stmt->execute([$id_cliente]);
    $managers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $managers
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>