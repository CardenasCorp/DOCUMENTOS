<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $pdo = Database::connect();

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || empty($data['id'])) {
            throw new Exception('ID de dirección no proporcionado');
        }

        $stmt = $pdo->prepare("DELETE FROM Historial_direcciones WHERE id = ?");
        $stmt->execute([$data['id']]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('No se encontró la dirección para eliminar');
        }

        echo json_encode([
            'success' => true,
            'message' => 'Dirección eliminada correctamente'
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
}
?>