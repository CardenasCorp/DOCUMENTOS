<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir la configuración de la base de datos
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        // Obtener JSON del cuerpo de la solicitud
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Datos JSON inválidos');
        }

        // Validar ID
        if (!isset($input['id']) || !is_numeric($input['id'])) {
            throw new Exception('ID de gerente inválido');
        }

        $pdo = Database::connect();

        // Preparar la consulta de eliminación
        $stmt = $pdo->prepare("DELETE FROM historial_gerentes WHERE id = ?");
        
        $success = $stmt->execute([$input['id']]);

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Gerente eliminado correctamente'
            ]);
        } else {
            throw new Exception('Error al eliminar el gerente');
        }

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