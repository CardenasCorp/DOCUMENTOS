<?php
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

// Función de conexión simplificada
function connectDB() {
    global $dsn, $options, $user, $pass;
    
    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error de conexión a la base de datos',
            'error_details' => $e->getMessage()
        ]);
        exit;
    }
}

// Validación del ID
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID de caso inválido',
        'error_code' => 'INVALID_ID'
    ]);
    exit;
}

try {
    $conn = connectDB();
    
    // Consulta para datos del caso
    $stmt = $conn->prepare("
        SELECT 
            f.id_fiscalizacion,
            f.numero,
            f.requerimiento_principal,
            f.fecha_notificacion,
            f.fecha_presentacion,
            f.fecha_presentado,
            f.fecha_prorroga,
            f.periodo_inicio,
            f.periodo_final,
            f.IGV,
            f.id_estado,
            f.id_etapa,
            f.id_cliente,
            c.razon_social,
            c.RUC,
            c.direccion_fiscal,
            c.departamento
        FROM fiscalizacion f
        JOIN cliente c ON f.id_cliente = c.id_cliente
        WHERE f.id_fiscalizacion = :id
        AND f.id_estado != 5
    ");
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $documento = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$documento) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Caso no encontrado',
            'error_code' => 'CASE_NOT_FOUND'
        ]);
        exit;
    }

    // Consulta para agentes SUNAT
    $stmtAgentes = $conn->prepare("
        SELECT 
            a.id_personal,
            a.cargo,
            CONCAT(p.nombres, ' ', p.apellidos) AS nombre_completo
        FROM agente_sunat a
        JOIN personal p ON a.id_personal = p.id_personal
        WHERE a.id_fiscalizacion = :id
        ORDER BY a.cargo
    ");
    $stmtAgentes->bindParam(':id', $id, PDO::PARAM_INT);
    $stmtAgentes->execute();
    
    $agentes = $stmtAgentes->fetchAll(PDO::FETCH_ASSOC);
    
    // Clasificar agentes
    $supervisor = array_values(array_filter($agentes, fn($a) => $a['cargo'] === 'supervisor'))[0] ?? null;
    $verificadores = array_values(array_filter($agentes, fn($a) => $a['cargo'] === 'verificador'));

    // Respuesta estructurada
    echo json_encode([
        'success' => true,
        'data' => [
            'documento' => $documento,
            'agentes' => [
                'supervisor' => $supervisor,
                'verificadores' => $verificadores
            ]
        ],
        'meta' => [
            'api_version' => '1.0',
            'timestamp' => date('c')
        ]
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en la base de datos',
        'error_details' => $e->getMessage(),
        'error_code' => 'DB_ERROR'
    ]);
}
?>