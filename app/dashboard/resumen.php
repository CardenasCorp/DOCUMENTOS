<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Usar una ruta absoluta definida en tu configuración
define('BASE_PATH', realpath(dirname(__FILE__) . '/../..'));
require_once BASE_PATH . '/app/config/database.php';

try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido", 405);
    }

    // Conexión a la base de datos
    $pdo = Database::connect();
    if (!$pdo) {
        throw new Exception("Error de conexión a la base de datos", 500);
    }

    // Obtener parámetros
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        $data = $_POST;
    }

    $action = $data['action'] ?? '';
    $page = isset($data['page']) ? (int)$data['page'] : 1;
    $search = isset($data['search']) ? trim($data['search']) : '';
    $perPage = 5;

    // Validar parámetros
    if ($action !== 'fetch') {
        throw new Exception("Acción no válida", 400);
    }

    // Construir consulta base con filtro de etapa 1
    $query = "SELECT 
                f.id_fiscalizacion AS id,
                f.numero AS Nro,
                t.descripcion AS Tipo,
                e.descripcion AS Etapa,
                es.descripcion AS Estado,
                DATE_FORMAT(f.fecha_presentacion, '%d/%m/%Y') AS FechaPresentacion,
                DATE_FORMAT(f.fecha_presentado, '%d/%m/%Y') AS FechaPresentado,
                f.IGV,
                c.propietario AS Propietario,
                c.RUC AS SUNAT
              FROM fiscalizacion f
              JOIN tipo t ON f.id_tipo = t.id_tipo
              JOIN etapa e ON f.id_etapa = e.id_etapa
              JOIN estado es ON f.id_estado = es.id_estado
              JOIN cliente c ON f.id_cliente = c.id_cliente
              WHERE f.id_etapa = 1";  // Solo primer requerimiento

    $conditions = [];
    $params = [];

    // Añadir condición de búsqueda si existe
    if (!empty($search)) {
        $conditions[] = "(c.propietario LIKE ? OR f.numero LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }

    // Añadir condiciones adicionales si existen
    if (!empty($conditions)) {
        $query .= " AND " . implode(" AND ", $conditions);
    }

    // Consulta para contar total de registros
    $countQuery = "SELECT COUNT(*) FROM ($query) AS total_query";
    $stmt = $pdo->prepare($countQuery);
    
    // Vincular parámetros para COUNT
    foreach ($params as $index => $value) {
        $stmt->bindValue($index + 1, $value);
    }
    
    $stmt->execute();
    $totalRecords = $stmt->fetchColumn();
    $totalPages = ceil($totalRecords / $perPage);

    // Validar número de página
    if ($page < 1 || ($totalPages > 0 && $page > $totalPages)) {
        throw new Exception("Número de página no válido", 400);
    }

    // Consulta principal con paginación
    $query .= " ORDER BY f.fecha_presentacion DESC LIMIT ?, ?";
    $stmt = $pdo->prepare($query);
    
    // Vincular parámetros de búsqueda
    foreach ($params as $index => $value) {
        $stmt->bindValue($index + 1, $value);
    }
    
    // Vincular parámetros de paginación
    $offset = ($page - 1) * $perPage;
    $stmt->bindValue(count($params) + 1, $offset, PDO::PARAM_INT);
    $stmt->bindValue(count($params) + 2, $perPage, PDO::PARAM_INT);
    
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formatear IGV
    foreach ($result as &$item) {
        $item['IGV'] = isset($item['IGV']) ? 'S/ ' . number_format($item['IGV'], 2, '.', ',') : 'S/ 0.00';
    }

    // Respuesta exitosa
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
    error_log("PDO Error: " . $e->getMessage() . "\nConsulta: " . ($query ?? 'N/A') . "\nParams: " . print_r($params, true));
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos',
        'details' => $e->getMessage()
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