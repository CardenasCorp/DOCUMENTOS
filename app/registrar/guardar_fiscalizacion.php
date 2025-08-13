<?php
// guardar_fiscalizacion.php
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
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $conn = new PDO($dsn, $user, $pass, $options);
    
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!$data) {
        throw new Exception('Datos inválidos o vacíos');
    }
    
    // Campos requeridos básicos
    $requiredFields = [
        'numero', 
        'id_cliente', 
        'fecha_notificacion', 
        'fecha_presentacion',
        'id_etapa', 
        'periodo_inicio', 
        'periodo_final', 
        'IGV', 
        'supervisor_id',
        'tipo'
    ];
    
    // Validar campos requeridos
    $missingFields = [];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        throw new Exception('Campos requeridos faltantes: ' . implode(', ', $missingFields));
    }
    
    // Validación específica para requerimiento padre
    if ($data['id_etapa'] != 1 && empty($data['id_fiscalizacion_padre'])) {
        throw new Exception('Debe seleccionar un requerimiento padre para esta etapa');
    }
    
    // Validar que no tenga padre si es 1er Requerimiento
    if ($data['id_etapa'] == 1 && !empty($data['id_fiscalizacion_padre'])) {
        throw new Exception('No se puede asignar requerimiento padre al 1er Requerimiento');
    }
    
    // Validar y formatear IGV
    $igv = str_replace(',', '.', $data['IGV']);
    $igv = (float) $igv;
    
    if ($igv <= 0) {
        throw new Exception('El IGV debe ser un valor mayor a 0');
    }
    
    $igv = number_format($igv, 2, '.', '');
    
    // Mapeo de tipos de fiscalización
    $tiposMap = [
        'esquela' => 1,
        'FP-IGV' => 2,
        'FT-IGV' => 3,
        'FP-RENTA' => 4,
        'FT-RENTA' => 5
    ];
    
    if (!isset($tiposMap[$data['tipo']])) {
        throw new Exception('Tipo de fiscalización inválido: ' . $data['tipo']);
    }
    
    $id_tipo = $tiposMap[$data['tipo']];
    
    $conn->beginTransaction();
    
    // Insertar fiscalización
    $sqlFiscalizacion = "INSERT INTO fiscalizacion (
        numero, 
        id_cliente,
        fecha_notificacion, 
        fecha_presentacion, 
        id_etapa, 
        periodo_inicio, 
        periodo_final, 
        IGV,
        id_estado,
        id_tipo,
        id_fiscalizacion_padre
    ) VALUES (
        :numero, 
        :id_cliente,
        :fecha_notificacion, 
        :fecha_presentacion, 
        :id_etapa, 
        :periodo_inicio, 
        :periodo_final, 
        :IGV,
        1,  -- Estado activo
        :id_tipo,
        :id_fiscalizacion_padre
    )";
    
    $stmtFiscal = $conn->prepare($sqlFiscalizacion);
    $stmtFiscal->execute([
        ':numero' => $data['numero'],
        ':id_cliente' => $data['id_cliente'],
        ':fecha_notificacion' => $data['fecha_notificacion'],
        ':fecha_presentacion' => $data['fecha_presentacion'],
        ':id_etapa' => $data['id_etapa'],
        ':periodo_inicio' => $data['periodo_inicio'],
        ':periodo_final' => $data['periodo_final'],
        ':IGV' => $igv,
        ':id_tipo' => $id_tipo,
        ':id_fiscalizacion_padre' => ($data['id_etapa'] != 1) ? $data['id_fiscalizacion_padre'] : null
    ]);
    
    $id_fiscalizacion = $conn->lastInsertId();
    
    // Insertar agentes SUNAT (supervisor y verificadores)
    $sqlAgente = "INSERT INTO agente_sunat (
        id_fiscalizacion, 
        id_personal, 
        cargo
    ) VALUES (
        :id_fiscalizacion, 
        :id_personal, 
        :cargo
    )";
    
    $stmtAgente = $conn->prepare($sqlAgente);
    
    // Insertar supervisor
    try {
        $stmtAgente->execute([
            ':id_fiscalizacion' => $id_fiscalizacion,
            ':id_personal' => $data['supervisor_id'],
            ':cargo' => 'supervisor'
        ]);
    } catch (PDOException $e) {
        if ($e->errorInfo[1] != 1062) { // Ignorar error de duplicado
            throw $e;
        }
    }
    
    // Insertar verificadores
    if (!empty($data['verificadores_ids'])) {
        foreach ($data['verificadores_ids'] as $verificador_id) {
            try {
                $stmtAgente->execute([
                    ':id_fiscalizacion' => $id_fiscalizacion,
                    ':id_personal' => $verificador_id,
                    ':cargo' => 'verificador'
                ]);
            } catch (PDOException $e) {
                if ($e->errorInfo[1] != 1062) { // Ignorar error de duplicado
                    throw $e;
                }
            }
        }
    }
    
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'id_fiscalizacion' => $id_fiscalizacion,
        'message' => 'Fiscalización guardada correctamente'
    ]);
    
} catch (PDOException $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_code' => $e->errorInfo[1] ?? null
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>