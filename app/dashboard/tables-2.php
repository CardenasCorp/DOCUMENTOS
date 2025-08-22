<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

require_once __DIR__ . '/../config/database.php';

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
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $action = $input['action'] ?? '';
    $tableType = $input['tableType'] ?? '';
    $page = isset($input['page']) ? (int)$input['page'] : 1;
    $search = isset($input['search']) ? trim($input['search']) : '';
    $perPage = 5;

    // Validar parámetros comunes
    if ($action !== 'fetch') {
        throw new Exception("Acción no válida", 400);
    }

    // Variables para la consulta
    $query = "";
    $countQuery = "";
    $conditions = [];
    $params = [];
    $orderBy = "";

    // Determinar la consulta según el tipo de tabla
    switch ($tableType) {
        case 'cerrar':
            // Tabla "Por cerrar" - Etapa 1 sin hijos en etapa 5
            $query = "SELECT 
                        f.id_fiscalizacion AS id,
                        f.numero AS Nro,
                        t.descripcion AS Tipo,
                        e.descripcion AS Etapa,
                        es.descripcion AS Estado,
                        DATE_FORMAT(f.fecha_presentacion, '%d/%m/%Y') AS FechaCierre
                      FROM fiscalizacion f
                      JOIN tipo t ON f.id_tipo = t.id_tipo
                      JOIN etapa e ON f.id_etapa = e.id_etapa
                      JOIN estado es ON f.id_estado = es.id_estado
                      WHERE f.id_etapa = 1 
                      AND f.id_estado != '5'
                      AND NOT EXISTS (
                          SELECT 1 FROM fiscalizacion f2 
                          WHERE f2.id_fiscalizacion_padre = f.id_fiscalizacion 
                          AND f2.id_etapa = 5
                      )";
            $orderBy = "ORDER BY f.fecha_presentacion ASC";
            break;

        case 'reclamaciones':
            // Tabla "Reclamaciones" - Etapa 6 con estado 2
            $query = "SELECT 
                        f.id_fiscalizacion AS id,
                        f.numero AS Nro,
                        t.descripcion AS Tipo,
                        DATE_FORMAT(f.fecha_presentacion, '%d/%m/%Y') AS FechaPresentar,
                        DATE_FORMAT(DATE_ADD(f.fecha_presentacion, INTERVAL 90 DAY), '%d/%m/%Y') AS FechaMaxima,
                        DATEDIFF(DATE_ADD(f.fecha_presentacion, INTERVAL 90 DAY), CURDATE()) AS DiasRestantes
                      FROM fiscalizacion f
                      JOIN tipo t ON f.id_tipo = t.id_tipo
                      WHERE f.id_etapa = '6' AND f.id_estado = '2'";
            $orderBy = "ORDER BY DiasRestantes ASC";
            break;

        case 'apelaciones':
            // Tabla "Apelaciones" - Etapa 7 con estado 2
            $query = "SELECT 
                        f.id_fiscalizacion AS id,
                        f.numero AS Nro,
                        t.descripcion AS Tipo,
                        DATE_FORMAT(f.fecha_presentacion, '%d/%m/%Y') AS FechaPresentar,
                        DATE_FORMAT(DATE_ADD(f.fecha_presentacion, INTERVAL 90 DAY), '%d/%m/%Y') AS FechaMaxima,
                        DATEDIFF(DATE_ADD(f.fecha_presentacion, INTERVAL 90 DAY), CURDATE()) AS DiasRestantes
                      FROM fiscalizacion f
                      JOIN tipo t ON f.id_tipo = t.id_tipo
                      WHERE f.id_etapa = '7' AND f.id_estado = '2'";
            $orderBy = "ORDER BY DiasRestantes ASC";
            break;

        case 'quejas':
            // Tabla "Quejas" - Búsqueda por propietario
            $query = "SELECT 
                        c.razon_social AS Empresa,
                        c.propietario AS Propietario,
                        f.numero AS Requerimiento,
                        q.id_fiscalizacion,
                        DATE_FORMAT(q.fecha_presentacion, '%d/%m/%Y') AS FechaPresentacion,
                        DATE_FORMAT(q.fecha_max, '%d/%m/%Y') AS FechaMaximaRespuesta,
                        q.resumen AS Resumen
                      FROM queja q
                      JOIN fiscalizacion f ON q.id_fiscalizacion = f.id_fiscalizacion
                      JOIN cliente c ON f.id_cliente = c.id_cliente
                      WHERE q.fecha_resolucion IS NULL";

            if (!empty($search)) {
                $conditions[] = "(c.propietario LIKE ? OR f.numero LIKE ? OR q.resumen LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }
            $orderBy = "ORDER BY q.fecha_presentacion DESC";
            break;

        default:
            throw new Exception("Tipo de tabla no válido", 400);
    }

    // Aplicar condiciones adicionales si existen
    if (!empty($conditions)) {
        $query .= " WHERE " . implode(" AND ", $conditions);
    }

    // Consulta para contar total de registros
    $countQuery = "SELECT COUNT(*) FROM ($query) AS total_query";
    $stmt = $pdo->prepare($countQuery);
    
    foreach ($params as $i => $param) {
        $stmt->bindValue($i+1, $param);
    }
    
    $stmt->execute();
    $totalRecords = $stmt->fetchColumn();
    $totalPages = ceil($totalRecords / $perPage);

    // Validar número de página
    if ($page < 1 || ($totalPages > 0 && $page > $totalPages)) {
        throw new Exception("Número de página no válido", 400);
    }

    // Consulta principal con paginación
    $query .= " $orderBy LIMIT ?, ?";
    $stmt = $pdo->prepare($query);
    
    // Vincular parámetros de búsqueda
    foreach ($params as $i => $param) {
        $stmt->bindValue($i+1, $param);
    }
    
    // Vincular parámetros de paginación
    $offset = ($page - 1) * $perPage;
    $stmt->bindValue(count($params)+1, $offset, PDO::PARAM_INT);
    $stmt->bindValue(count($params)+2, $perPage, PDO::PARAM_INT);
    
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'currentPage' => $page,
            'perPage' => $perPage,
            'totalRecords' => $totalRecords,
            'totalPages' => $totalPages
        ]
    ]);

} catch (Exception $e) {
    $errorCode = is_numeric($e->getCode()) ? $e->getCode() : 500;
    http_response_code($errorCode);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>