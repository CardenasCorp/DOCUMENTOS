<?php
set_time_limit(60);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

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
    
    // 1. Consulta principal de casos fiscalizaciones - CON NÚMERO DEL PADRE
    $query = "SELECT 
        f.id_fiscalizacion,
        f.numero,
        f.id_tipo,
        f.fecha_notificacion,
        f.fecha_presentacion,
        f.fecha_prorroga,
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
        fp.numero AS numero_padre  -- NUEVO: Número del caso padre
        FROM fiscalizacion f
        LEFT JOIN cliente c ON f.id_cliente = c.id_cliente
        LEFT JOIN fiscalizacion fp ON f.id_fiscalizacion_padre = fp.id_fiscalizacion  -- NUEVO JOIN
        WHERE f.id_estado != 5  
        ORDER BY f.fecha_notificacion DESC
        LIMIT 1000";
    
    $stmt = $conn->query($query);
    $cases = $stmt->fetchAll();
    
    // 2. Obtener TODOS los agentes SUNAT en una sola consulta
    if (!empty($cases)) {
        $caseIds = array_column($cases, 'id_fiscalizacion');
        $placeholders = str_repeat('?,', count($caseIds) - 1) . '?';
        
        $agentesQuery = "SELECT 
                            a.id_fiscalizacion,
                            a.id_personal,
                            a.cargo,
                            CONCAT(p.nombres, ' ', p.apellidos) AS nombre_completo
                         FROM agente_sunat a
                         JOIN personal p ON a.id_personal = p.id_personal
                         WHERE a.id_fiscalizacion IN ($placeholders)
                         ORDER BY a.id_fiscalizacion, a.cargo";
        
        $agentesStmt = $conn->prepare($agentesQuery);
        $agentesStmt->execute($caseIds);
        $allAgentes = $agentesStmt->fetchAll();
        
        // 3. Organizar agentes por id_fiscalizacion
        $agentesPorCaso = [];
        foreach ($allAgentes as $agente) {
            $casoId = $agente['id_fiscalizacion'];
            if (!isset($agentesPorCaso[$casoId])) {
                $agentesPorCaso[$casoId] = [];
            }
            $agentesPorCaso[$casoId][] = $agente;
        }
        
        // 4. Asignar agentes a cada caso
        foreach ($cases as &$case) {
            $caseId = $case['id_fiscalizacion'];
            $case['agentes_sunat'] = $agentesPorCaso[$caseId] ?? [];
        }
        unset($case);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $cases,
        'total_cases' => count($cases)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_info' => $e->errorInfo
    ]);
}
?>