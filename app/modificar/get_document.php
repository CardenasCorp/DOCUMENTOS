<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

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
    
    $documentId = $_GET['id'] ?? null;
    if (!$documentId) {
        throw new Exception('ID de documento no proporcionado');
    }

    // 1. Consulta principal del documento - AGREGAR cliente_cruce
    $query = "SELECT 
                f.id_fiscalizacion,
                f.numero,
                f.fecha_notificacion,
                f.fecha_presentacion,
                f.id_estado,
                f.fecha_prorroga,
                f.fecha_presentado,
                f.id_etapa,
                f.periodo_inicio,
                f.periodo_final,
                f.IGV,
                f.id_cliente,
                f.id_fiscalizacion_padre,
                f.id_tipo, 
                f.cliente_cruce,
                c.razon_social,
                c.RUC,
                c.direccion_fiscal,
                c.departamento,
                fp.numero AS numero_padre,
                t.descripcion AS tipo_descripcion  
              FROM fiscalizacion f
              JOIN cliente c ON f.id_cliente = c.id_cliente
              LEFT JOIN fiscalizacion fp ON f.id_fiscalizacion_padre = fp.id_fiscalizacion
              JOIN tipo t ON f.id_tipo = t.id_tipo  
              WHERE f.id_fiscalizacion = :id";
              
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $documentId, PDO::PARAM_INT);
    $stmt->execute();
    
    $document = $stmt->fetch();
    
    if (!$document) {
        throw new Exception('Documento no encontrado');
    }

    // 2. Consulta para agentes SUNAT (supervisor y verificadores)
    $agentesQuery = "SELECT 
                        a.id_personal,
                        a.cargo,
                        CONCAT(p.nombres, ' ', p.apellidos) AS nombre_completo
                     FROM agente_sunat a
                     JOIN personal p ON a.id_personal = p.id_personal
                     WHERE a.id_fiscalizacion = :id_fiscalizacion
                     ORDER BY a.cargo";
    
    $agentesStmt = $conn->prepare($agentesQuery);
    $agentesStmt->bindParam(':id_fiscalizacion', $documentId, PDO::PARAM_INT);
    $agentesStmt->execute();
    $agentes = $agentesStmt->fetchAll();

    // 3. Separar supervisor y verificadores
    $supervisor = null;
    $verificadores = [];

    foreach ($agentes as $agente) {
        if ($agente['cargo'] === 'supervisor') {
            $supervisor = $agente;
        } elseif ($agente['cargo'] === 'verificador') {
            $verificadores[] = $agente;
        }
    }

    // 4. Estructurar la respuesta
    $response = [
        'success' => true,
        'data' => [
            'documento' => $document,
            'agentes' => [
                'supervisor' => $supervisor,
                'verificadores' => $verificadores
            ]
        ]
    ];

    echo json_encode($response);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_info' => $e->errorInfo
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>