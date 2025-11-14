<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir la configuración de la base de datos
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        // Obtener JSON del cuerpo de la solicitud
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Datos JSON inválidos');
        }

        // Validar campos requeridos
        if (!isset($input['id']) || !is_numeric($input['id'])) {
            throw new Exception('ID de gerente inválido');
        }

        $requiredFields = ['gerente', 'fecha_inicio'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                throw new Exception("El campo $field es requerido");
            }
        }

        $pdo = Database::connect();

        // Preparar la consulta de actualización
        $stmt = $pdo->prepare("
            UPDATE historial_gerentes 
            SET gerente = ?, dni = ?, fecha_inicio = ?, fecha_fin = ? 
            WHERE id = ?
        ");

        $dni = !empty($input['dni']) ? trim($input['dni']) : null;
        $fecha_fin = !empty($input['fecha_fin']) ? $input['fecha_fin'] : null;

         $success = $stmt->execute([
            trim($input['gerente']),
            $dni,
            $input['fecha_inicio'],
            $fecha_fin,
            $input['id']
        ]);

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Gerente actualizado correctamente'
            ]);
        } else {
            throw new Exception('Error al actualizar el gerente');
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