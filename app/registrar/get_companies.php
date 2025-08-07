<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
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

    // Construir consulta base
    $sql = "SELECT 
                id_cliente, 
                RUC, 
                razon_social, 
                direccion_fiscal, 
                departamento 
            FROM cliente";
    
    // Inicializar parámetros
    $where = [];
    $params = [];
    
    // Filtro por RUC
    if (isset($_GET['ruc']) && !empty($_GET['ruc'])) {
        $where[] = "RUC LIKE :ruc";
        $params[':ruc'] = '%' . $_GET['ruc'] . '%';
    }
    
    // Filtro por razón social
    if (isset($_GET['nombre']) && !empty($_GET['nombre'])) {
        $where[] = "razon_social LIKE :nombre";
        $params[':nombre'] = '%' . $_GET['nombre'] . '%';
    }
    
    // Combinar condiciones WHERE si existen
    if (!empty($where)) {
        $sql .= " WHERE " . implode(' AND ', $where);
    }
    
    // Ordenar y limitar resultados
    $sql .= " ORDER BY razon_social ASC LIMIT 50";
    
    // Preparar y ejecutar consulta
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $empresas = $stmt->fetchAll();

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => $empresas,
        'count' => count($empresas)
    ]);

} catch (PDOException $e) {
    // Manejo de errores
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
}
?>