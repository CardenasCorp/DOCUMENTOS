<?php
// guardar_fiscalization.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de la base de datos
$host = 'localhost';
$db   = 'Documentos';
$user = 'root';
$pass = 'root';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $conn = new PDO($dsn, $user, $pass, $options);
    
    // Obtener datos del POST
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    // Validar que tenemos datos
    if (!$data) {
        throw new Exception('Datos inválidos o vacíos');
    }
    
    // Validar campos requeridos
    $requiredFields = ['numero', 'id_cliente', 'fecha_notificacion', 'fecha_presentacion', 
                      'id_etapa', 'periodo_inicio', 'periodo_final', 'IGV', 'supervisor_id'];
    
    $missingFields = [];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        throw new Exception('Campos requeridos faltantes: ' . implode(', ', $missingFields));
    }
    
    // Iniciar transacción
    $conn->beginTransaction();
    
    // CORRECCIÓN: Eliminar comentarios dentro de la cadena SQL
    $sqlFiscalizacion = "INSERT INTO fiscalizacion (
        numero, 
        id_cliente_real,
        fecha_notificacion, 
        fecha_presentacion, 
        id_etapa, 
        periodo_inicio, 
        periodo_final, 
        IGV
    ) VALUES (
        :numero, 
        :id_cliente_real,
        :fecha_notificacion, 
        :fecha_presentacion, 
        :id_etapa, 
        :periodo_inicio, 
        :periodo_final, 
        :IGV
    )";
    
    $stmtFiscal = $conn->prepare($sqlFiscalizacion);
    $stmtFiscal->execute([
        ':numero' => $data['numero'],
        ':id_cliente_real' => $data['id_cliente'],
        ':fecha_notificacion' => $data['fecha_notificacion'],
        ':fecha_presentacion' => $data['fecha_presentacion'],
        ':id_etapa' => $data['id_etapa'],
        ':periodo_inicio' => $data['periodo_inicio'],
        ':periodo_final' => $data['periodo_final'],
        ':IGV' => $data['IGV']
    ]);
    
    $id_fiscalizacion = $conn->lastInsertId();
    
    // Insertar supervisor y verificadores en agente_sunat
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
    $stmtAgente->execute([
        ':id_fiscalizacion' => $id_fiscalizacion,
        ':id_personal' => $data['supervisor_id'],
        ':cargo' => 'supervisor'
    ]);
    
    // Insertar verificadores
    if (!empty($data['verificadores_ids'])) {
        foreach ($data['verificadores_ids'] as $verificador_id) {
            $stmtAgente->execute([
                ':id_fiscalizacion' => $id_fiscalizacion,
                ':id_personal' => $verificador_id,
                ':cargo' => 'verificador'
            ]);
        }
    }
    
    // Confirmar transacción
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'id_fiscalizacion' => $id_fiscalizacion,
        'message' => 'Fiscalización guardada correctamente'
    ]);
    
} catch (PDOException $e) {
    // Revertir transacción en caso de error
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_details' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>