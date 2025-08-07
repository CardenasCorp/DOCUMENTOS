<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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
    $conn = new PDO($dsn, $user, $pass, $options);
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data || !isset($data['id_fiscalizacion'])) {
        throw new Exception('Datos inválidos o ID no proporcionado');
    }

    // Iniciar transacción
    $conn->beginTransaction();

    // 1. Actualizar datos principales
    $updateQuery = "UPDATE fiscalizacion SET
                    numero = :numero,
                    fecha_notificacion = :fecha_notificacion,
                    fecha_presentacion = :fecha_presentacion,
                    id_estado = :id_estado,
                    fecha_prorroga = :fecha_prorroga,
                    id_etapa = :id_etapa,
                    periodo_inicio = :periodo_inicio,
                    periodo_final = :periodo_final,
                    IGV = :IGV,
                    fecha_presentado = :fecha_presentado
                    WHERE id_fiscalizacion = :id_fiscalizacion";
    
    $stmt = $conn->prepare($updateQuery);
    $stmt->execute([
        ':numero' => $data['numero'],
        ':fecha_notificacion' => $data['fecha_notificacion'],
        ':fecha_presentacion' => $data['fecha_presentacion'],
        ':id_estado' => $data['id_estado'],
        ':fecha_prorroga' => $data['fecha_prorroga'],
        ':id_etapa' => $data['id_etapa'],
        ':periodo_inicio' => $data['periodo_inicio'],
        ':periodo_final' => $data['periodo_final'],
        ':IGV' => $data['IGV'],
        ':fecha_presentado' => $data['fecha_presentado'] ?? null,
        ':id_fiscalizacion' => $data['id_fiscalizacion']
    ]);

    // 2. Manejar agentes SUNAT con enfoque UPSERT (INSERT o UPDATE)
    // Primero eliminar solo los verificadores que ya no están en la lista nueva
    if (!empty($data['verificadores'])) {
        $verificadoresIds = array_column($data['verificadores'], 'id_personal');
        $placeholders = implode(',', array_fill(0, count($verificadoresIds), '?'));
        
        $deleteQuery = "DELETE FROM agente_sunat 
                       WHERE id_fiscalizacion = ? 
                       AND cargo = 'verificador'";
        
        if (!empty($verificadoresIds)) {
            $deleteQuery .= " AND id_personal NOT IN ($placeholders)";
        }
        
        $stmtDelete = $conn->prepare($deleteQuery);
        $params = array_merge([$data['id_fiscalizacion']], $verificadoresIds);
        $stmtDelete->execute($params);
    } else {
        // Si no hay verificadores, eliminar todos
        $deleteQuery = "DELETE FROM agente_sunat 
                       WHERE id_fiscalizacion = ? 
                       AND cargo = 'verificador'";
        $stmtDelete = $conn->prepare($deleteQuery);
        $stmtDelete->execute([$data['id_fiscalizacion']]);
    }

    // Insertar/actualizar verificadores
    $upsertQuery = "INSERT INTO agente_sunat (id_fiscalizacion, id_personal, cargo)
                   VALUES (:id_fiscalizacion, :id_personal, 'verificador')
                   ON DUPLICATE KEY UPDATE cargo = VALUES(cargo)";
    
    $stmtVerificador = $conn->prepare($upsertQuery);
    
    foreach ($data['verificadores'] as $verificador) {
        $stmtVerificador->execute([
            ':id_fiscalizacion' => $data['id_fiscalizacion'],
            ':id_personal' => $verificador['id_personal']
        ]);
    }

    // Manejar supervisor con UPSERT
    if (!empty($data['supervisor_id'])) {
        $upsertSupervisor = "INSERT INTO agente_sunat (id_fiscalizacion, id_personal, cargo)
                           VALUES (:id_fiscalizacion, :id_personal, 'supervisor')
                           ON DUPLICATE KEY UPDATE cargo = VALUES(cargo)";
        
        $stmtSupervisor = $conn->prepare($upsertSupervisor);
        $stmtSupervisor->execute([
            ':id_fiscalizacion' => $data['id_fiscalizacion'],
            ':id_personal' => $data['supervisor_id']
        ]);
    }

    $conn->commit();
    echo json_encode(['success' => true, 'message' => 'Documento actualizado correctamente']);

} catch (PDOException $e) {
    $conn->rollBack();
    http_response_code(500);
    
    $mensaje = 'Error de base de datos';
    if ($e->errorInfo[1] == 1062) { // Código de error para duplicados
        $mensaje = 'Error: El supervisor o algun verificador está duplicado. Un mismo empleado no puede tener múltiples roles.';
    }
    
    echo json_encode([
        'success' => false,
        'message' => $mensaje,
        'error_code' => $e->errorInfo[1]
    ]);
}