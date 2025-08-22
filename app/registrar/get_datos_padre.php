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
    
    $idPadre = $_GET['id_padre'] ?? null;
    if (!$idPadre) {
        throw new Exception('ID de documento padre no proporcionado');
    }

    // 1. Consulta principal del documento padre
    $query = "SELECT 
                f.id_fiscalizacion,
                f.numero,
                f.IGV,
                f.periodo_inicio,
                f.periodo_final,
                f.id_cliente
              FROM fiscalizacion f
              WHERE f.id_fiscalizacion = :id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id', $idPadre, PDO::PARAM_INT);
    $stmt->execute();
    
    $documentoPadre = $stmt->fetch();
    
    if (!$documentoPadre) {
        throw new Exception('Documento padre no encontrado');
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
    $agentesStmt->bindParam(':id_fiscalizacion', $idPadre, PDO::PARAM_INT);
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
            'documento' => $documentoPadre,
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