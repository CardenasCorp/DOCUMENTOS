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
    $conn = new PDO($dsn, $user, $pass, $options);
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data || !isset($data['id_fiscalizacion'])) {
        throw new Exception('Datos inválidos o ID no proporcionado');
    }

    // Iniciar transacción
    $conn->beginTransaction();

    // 1. Actualizar datos principales - AGREGAR cliente_cruce
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
                    fecha_presentado = :fecha_presentado,
                    id_tipo = :id_tipo,
                    cliente_cruce = :cliente_cruce  
                    WHERE id_fiscalizacion = :id_fiscalizacion";
    
    $stmt = $conn->prepare($updateQuery);
    
    // DEFINIR SIEMPRE el parámetro cliente_cruce, incluso si no viene en los datos
    $params = [
        ':numero' => $data['numero'],
        ':fecha_notificacion' => $data['fecha_notificacion'],
        ':fecha_presentacion' => $data['fecha_presentacion'],
        ':id_estado' => $data['id_estado'],
        ':fecha_prorroga' => $data['fecha_prorroga'] ?? null,
        ':id_etapa' => $data['id_etapa'],
        ':periodo_inicio' => $data['periodo_inicio'],
        ':periodo_final' => $data['periodo_final'],
        ':IGV' => $data['IGV'] ?? 0,
        ':fecha_presentado' => $data['fecha_presentado'] ?? null,
        ':id_tipo' => $data['id_tipo'],
        ':cliente_cruce' => $data['cliente_cruce'] ?? null, 
        ':id_fiscalizacion' => $data['id_fiscalizacion']
    ];
    
    $stmt->execute($params);

    // 2. ELIMINAR TODOS LOS AGENTES EXISTENTES para este documento
    $deleteQuery = "DELETE FROM agente_sunat WHERE id_fiscalizacion = ?";
    $stmtDelete = $conn->prepare($deleteQuery);
    $stmtDelete->execute([$data['id_fiscalizacion']]);

    // 3. INSERTAR NUEVOS AGENTES según el tipo de caso
    $insertQuery = "INSERT INTO agente_sunat (id_fiscalizacion, id_personal, cargo) 
                    VALUES (:id_fiscalizacion, :id_personal, :cargo)";
    $stmtInsert = $conn->prepare($insertQuery);

    if ($data['id_tipo'] == 6) { // CRUCE (id_tipo = 6)
        // Insertar funcionarios para casos CRUCE
        foreach ($data['agentes']['funcionarios'] as $funcionario) {
            $stmtInsert->execute([
                ':id_fiscalizacion' => $data['id_fiscalizacion'],
                ':id_personal' => $funcionario['id_personal'],
                ':cargo' => 'funcionario'
            ]);
        }
    } else {
        // Insertar supervisor y verificadores para otros tipos
        if (!empty($data['agentes']['supervisor'])) {
            $stmtInsert->execute([
                ':id_fiscalizacion' => $data['id_fiscalizacion'],
                ':id_personal' => $data['agentes']['supervisor']['id_personal'],
                ':cargo' => 'supervisor'
            ]);
        }

        // Insertar verificadores
        foreach ($data['agentes']['verificadores'] as $verificador) {
            $stmtInsert->execute([
                ':id_fiscalizacion' => $data['id_fiscalizacion'],
                ':id_personal' => $verificador['id_personal'],
                ':cargo' => 'verificador'
            ]);
        }
    }

    $conn->commit();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Documento actualizado correctamente',
        'id_fiscalizacion' => $data['id_fiscalizacion']
    ]);

} catch (PDOException $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    
    $mensaje = 'Error de base de datos: ' . $e->getMessage();
    $errorCode = $e->errorInfo[1] ?? $e->getCode();
    
    // Manejar errores específicos
    if ($errorCode == 1062) { // Duplicado
        $mensaje = 'Error: Empleado duplicado. Un mismo empleado no puede tener múltiples roles en el mismo documento.';
    } elseif ($errorCode == 1452) { // Foreign key violation
        $mensaje = 'Error: ID de empleado o cliente no válido. Verifique que los empleados y la empresa existan en el sistema.';
    }
    
    error_log("Error en update_document.php: " . $e->getMessage());
    error_log("Datos recibidos: " . json_encode($data));
    error_log("Parámetros ejecutados: " . json_encode($params ?? []));
    
    echo json_encode([
        'success' => false,
        'message' => $mensaje,
        'error_code' => $errorCode,
        'error_details' => $e->getMessage()
    ]);
    
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(400);
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>