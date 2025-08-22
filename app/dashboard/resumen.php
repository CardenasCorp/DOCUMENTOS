<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

define('BASE_PATH', realpath(dirname(__FILE__) . '/../..'));
require_once BASE_PATH . '/app/config/database.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido", 405);
    }

    $pdo = Database::connect();
    if (!$pdo) {
        throw new Exception("Error de conexión a la base de datos", 500);
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        $data = $_POST;
    }

    $action = $data['action'] ?? '';
    $page = isset($data['page']) ? (int)$data['page'] : 1;
    $search = isset($data['search']) ? trim($data['search']) : '';
    $perPage = 5;

    if ($action !== 'fetch') {
        throw new Exception("Acción no válida", 400);
    }

    // CONSULTA ACTUALIZADA CON NUEVA FECHA
    $query = "SELECT 
                f.id_fiscalizacion AS id,
                f.numero AS Nro,
                t.descripcion AS Tipo,
                e.descripcion AS Etapa,
                es.descripcion AS Estado,
                DATE_FORMAT(f.fecha_presentacion, '%d/%m/%Y') AS FechaPresentacion,
                DATE_FORMAT(f.fecha_presentado, '%d/%m/%Y') AS FechaPresentado,
                DATE_FORMAT(f.fecha_prorroga, '%d/%m/%Y') AS NuevaFecha,  
                f.IGV,
                c.propietario AS Propietario,
                c.RUC AS SUNAT
              FROM fiscalizacion f
              JOIN tipo t ON f.id_tipo = t.id_tipo
              JOIN etapa e ON f.id_etapa = e.id_etapa
              JOIN estado es ON f.id_estado = es.id_estado
              JOIN cliente c ON f.id_cliente = c.id_cliente
              WHERE f.id_etapa = 1
              AND f.id_estado != '5'";

    $conditions = [];
    $params = [];

    if (!empty($search)) {
        $conditions[] = "(c.propietario LIKE ? OR f.numero LIKE ?)";
        $params[] = "%" . $search . "%";  // ✅ Corregido SQL injection
        $params[] = "%" . $search . "%";
    }

    if (!empty($conditions)) {
        $query .= " AND " . implode(" AND ", $conditions);
    }

    $countQuery = "SELECT COUNT(*) FROM ($query) AS total_query";
    $stmt = $pdo->prepare($countQuery);
    
    foreach ($params as $index => $value) {
        $stmt->bindValue($index + 1, $value);
    }
    
    $stmt->execute();
    $totalRecords = $stmt->fetchColumn();
    $totalPages = ceil($totalRecords / $perPage);

    if ($page < 1 || ($totalPages > 0 && $page > $totalPages)) {
        throw new Exception("Número de página no válido", 400);
    }

    $query .= " ORDER BY f.fecha_presentacion DESC LIMIT ?, ?";
    $stmt = $pdo->prepare($query);
    
    foreach ($params as $index => $value) {
        $stmt->bindValue($index + 1, $value);
    }
    
    $offset = ($page - 1) * $perPage;
    $stmt->bindValue(count($params) + 1, $offset, PDO::PARAM_INT);
    $stmt->bindValue(count($params) + 2, $perPage, PDO::PARAM_INT);
    
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($result as &$item) {
        $item['IGV'] = isset($item['IGV']) ? 'S/ ' . number_format($item['IGV'], 2, '.', ',') : 'S/ 0.00';
        // NuevaFecha ya viene formateada desde la consulta SQL
    }

    echo json_encode([
        'success' => true,
        'data' => $result,
        'pagination' => [
            'currentPage' => $page,
            'perPage' => $perPage,
            'totalRecords' => $totalRecords,
            'totalPages' => $totalPages
        ]
    ]);

} catch (PDOException $e) {
    error_log("PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos'
    ]);
} catch (Exception $e) {
    error_log("App Error: " . $e->getMessage());
    http_response_code($e->getCode() ?: 400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>