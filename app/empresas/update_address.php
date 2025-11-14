<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $pdo = Database::connect();

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            throw new Exception('Datos no válidos');
        }

        if (empty($data['id'])) {
            throw new Exception('ID de dirección no proporcionado');
        }

        // Validar campos requeridos
        $required_fields = ['tipo_direccion', 'direccion', 'provincia', 'departamento', 'fecha_inicio'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                throw new Exception("El campo $field es requerido");
            }
        }

        // Validar tipo de dirección
        if (!in_array($data['tipo_direccion'], ['fiscal', 'anexo'])) {
            throw new Exception('Tipo de dirección no válido. Use "fiscal" o "anexo"');
        }

        $stmt = $pdo->prepare("
            UPDATE Historial_direcciones 
            SET tipo_direccion = ?, direccion = ?, provincia = ?, departamento = ?, 
                fecha_inicio = ?, fecha_fin = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $data['tipo_direccion'],
            $data['direccion'],
            $data['provincia'],
            $data['departamento'],
            $data['fecha_inicio'],
            $data['fecha_fin'] ?? null,
            $data['id']
        ]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('No se encontró la dirección para actualizar');
        }

        echo json_encode([
            'success' => true,
            'message' => 'Dirección actualizada correctamente'
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