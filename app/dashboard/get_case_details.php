<?php
set_time_limit(60);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// DEBUG COMPLETO
error_log("=== DEPURACIÓN GET_CASE_DETAILS.PHP ===");
error_log("Método: " . $_SERVER['REQUEST_METHOD']);
error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'No definido'));

// Obtener el input raw
$input_raw = file_get_contents('php://input');
error_log("Input RAW: " . $input_raw);
error_log("Input RAW length: " . strlen($input_raw));

// Verificar si el input está vacío
if (empty($input_raw)) {
    error_log("ERROR: Input vacío");
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Input vacío. Se esperaba JSON con id_fiscalizacion',
        'debug' => [
            'method' => $_SERVER['REQUEST_METHOD'],
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'No definido',
            'input_length' => strlen($input_raw)
        ]
    ]);
    exit;
}

// Intentar decodificar JSON
$input = json_decode($input_raw, true);
$json_error = json_last_error();

if ($json_error !== JSON_ERROR_NONE) {
    error_log("ERROR JSON: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'JSON inválido: ' . json_last_error_msg(),
        'debug' => [
            'json_error' => $json_error,
            'json_error_msg' => json_last_error_msg(),
            'input_received' => $input_raw
        ]
    ]);
    exit;
}

error_log("Input decodificado: " . print_r($input, true));

// Verificar campos recibidos
error_log("Campos recibidos: " . implode(', ', array_keys($input)));

$caseId = $input['id_fiscalizacion'] ?? null;
error_log("id_fiscalizacion obtenido: " . ($caseId ?? 'NULL'));

// Si no viene en id_fiscalizacion, probar con otros nombres comunes
if (!$caseId) {
    $caseId = $input['id'] ?? $input['caseId'] ?? $input['case_id'] ?? null;
    error_log("ID alternativo: " . ($caseId ?? 'NULL'));
}

if (!$caseId) {
    error_log("ERROR: No se pudo encontrar ningún ID válido");
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID de fiscalización no proporcionado',
        'debug' => [
            'campos_recibidos' => array_keys($input),
            'valores_recibidos' => $input
        ]
    ]);
    exit;
}

// Validar tipo de dato
if (!is_numeric($caseId)) {
    error_log("ERROR: ID no numérico: " . $caseId);
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID de fiscalización debe ser numérico',
        'debug' => [
            'id_recibido' => $caseId,
            'tipo_id' => gettype($caseId)
        ]
    ]);
    exit;
}

$caseId = (int)$caseId;
error_log("ID procesado: " . $caseId);

// Ahora conectamos a la base de datos solo si todo lo anterior está bien
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
    error_log("Conectando a la base de datos...");
    $conn = new PDO($dsn, $user, $pass, $options);
    
    // CONSULTA PRINCIPAL
    $query = "SELECT 
        f.id_fiscalizacion,
        f.numero,
        f.id_tipo,
        f.fecha_notificacion,
        f.fecha_presentacion,
        f.fecha_prorroga,
        f.fecha_presentado,
        f.id_estado,
        f.id_etapa,
        f.IGV,
        f.periodo_inicio, 
        f.periodo_final,    
        c.RUC,
        f.id_cliente,
        f.id_fiscalizacion_padre,
        f.cliente_cruce,
        c.razon_social,
        t.descripcion as tipo_descripcion,
        e.descripcion as etapa_descripcion,
        es.descripcion as estado_descripcion,
        fp.numero AS numero_padre
        FROM fiscalizacion f
        LEFT JOIN cliente c ON f.id_cliente = c.id_cliente
        LEFT JOIN tipo t ON f.id_tipo = t.id_tipo
        LEFT JOIN etapa e ON f.id_etapa = e.id_etapa
        LEFT JOIN estado es ON f.id_estado = es.id_estado
        LEFT JOIN fiscalizacion fp ON f.id_fiscalizacion_padre = fp.id_fiscalizacion
        WHERE f.id_fiscalizacion = ?";
    
    error_log("Ejecutando consulta con ID: " . $caseId);
    $stmt = $conn->prepare($query);
    $stmt->execute([$caseId]);
    $caseData = $stmt->fetch();
    
    if (!$caseData) {
        error_log("Caso no encontrado en BD para ID: " . $caseId);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Caso no encontrado',
            'debug' => [
                'id_buscado' => $caseId
            ]
        ]);
        exit;
    }

    error_log("Caso encontrado: " . $caseData['numero']);

    // CONSULTA DE AGENTES SUNAT
    $agentesQuery = "SELECT 
                        a.id_fiscalizacion,
                        a.id_personal,
                        a.cargo,
                        CONCAT(p.nombres, ' ', p.apellidos) AS nombre_completo
                     FROM agente_sunat a
                     JOIN personal p ON a.id_personal = p.id_personal
                     WHERE a.id_fiscalizacion = ?
                     ORDER BY a.cargo, p.nombres";
    
    $agentesStmt = $conn->prepare($agentesQuery);
    $agentesStmt->execute([$caseId]);
    $agentes = $agentesStmt->fetchAll();
    
    error_log("Agentes encontrados: " . count($agentes));

    // Asignar agentes al caso
    $caseData['agentes_sunat'] = $agentes ?: [];
    
    error_log("Enviando respuesta exitosa");
    echo json_encode([
        'success' => true,
        'data' => $caseData,
        'debug' => [
            'case_id' => $caseId,
            'agents_count' => count($agentes),
            'input_processed' => $input
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("ERROR PDO: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_info' => $e->errorInfo
    ]);
} catch (Exception $e) {
    error_log("ERROR GENERAL: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

error_log("=== FIN DEPURACIÓN ===");
?>