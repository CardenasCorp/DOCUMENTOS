<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$host = 'localhost';
$db   = 'Documentos';
$user = 'root';
$pass = 'root';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Construir consulta basada en parámetros
    $sql = "SELECT id_cliente, RUC, razon_social, direccion_fiscal, departamento FROM cliente";
    
    // Filtros
    $params = [];
    if (isset($_GET['ruc'])) {
        $sql .= " WHERE RUC LIKE :ruc";
        $params[':ruc'] = '%' . $_GET['ruc'] . '%';
    }
    elseif (isset($_GET['nombre'])) {
        $sql .= " WHERE razon_social LIKE :nombre";
        $params[':nombre'] = '%' . $_GET['nombre'] . '%';
    }
    
    $sql .= " ORDER BY razon_social LIMIT 50";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $empresas
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>