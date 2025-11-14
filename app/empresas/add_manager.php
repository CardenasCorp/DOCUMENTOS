<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Incluir la configuración de la base de datos
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Obtener JSON del cuerpo de la solicitud
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Datos JSON inválidos');
        }

        // Validar campos requeridos
        $requiredFields = ['id_cliente', 'gerente', 'fecha_inicio'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                throw new Exception("El campo $field es requerido");
            }
        }

        $pdo = Database::connect();

        // Preparar la consulta de inserción
        $stmt = $pdo->prepare("
            INSERT INTO historial_gerentes (id_cliente, gerente, dni, fecha_inicio, fecha_fin) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $dni = !empty($input['dni']) ? trim($input['dni']) : null;
        $fecha_fin = !empty($input['fecha_fin']) ? $input['fecha_fin'] : null;

        $success = $stmt->execute([
            $input['id_cliente'],
            trim($input['gerente']),
            $dni,
            $input['fecha_inicio'],
            $fecha_fin
        ]);

        if ($success) {
            echo json_encode([
                'success' => true,
                'message' => 'Gerente agregado correctamente',
                'id' => $pdo->lastInsertId()
            ]);
        } else {
            throw new Exception('Error al agregar el gerente');
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