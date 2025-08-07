<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

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
    
    $fiscalizacionId = $_GET['id_fiscalizacion'] ?? null;
    if (!$fiscalizacionId) {
        throw new Exception('ID de fiscalización no proporcionado');
    }

    $query = "SELECT 
                a.id_fiscalizacion,
                a.id_personal,
                a.cargo,
                CONCAT(p.nombres, ' ', p.apellidos) AS nombre_completo
              FROM agente_sunat a
              JOIN personal p ON a.id_personal = p.id_personal
              WHERE a.id_fiscalizacion = :id_fiscalizacion";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':id_fiscalizacion', $fiscalizacionId, PDO::PARAM_INT);
    $stmt->execute();
    
    $agentes = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $agentes
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>