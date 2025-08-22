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
    $perPage = 5; // Registros por página

    // Validar parámetros
    if ($action !== 'fetch') {
        throw new Exception("Acción no válida", 400);
    }

    if (!in_array($tableType, ['vencer', 'reclamar', 'apelar'])) {
        throw new Exception("Tipo de tabla no válido", 400);
    }

    // Consulta para contar solo registros con fechas válidas
    $countQuery = "SELECT COUNT(*) as total 
                   FROM fiscalizacion f
                   JOIN etapa e ON f.id_etapa = e.id_etapa
                   WHERE f.fecha_presentacion >= CURDATE()"; // Solo fechas futuras o hoy

    // Aplicar filtros adicionales según tipo de tabla
    switch ($tableType) {
        case 'reclamar':
            $countQuery .= " AND f.id_etapa = 6";
            break;
        case 'apelar':
            $countQuery .= " AND f.id_etapa = 7";
            break;
    }

    $stmt = $pdo->query($countQuery);
    $totalRecords = $stmt->fetchColumn();
    $totalPages = ceil($totalRecords / $perPage);

    // Validar número de página
    if ($page < 1 || ($totalPages > 0 && $page > $totalPages)) {
        throw new Exception("Número de página no válido", 400);
    }

    // Consulta principal con mismo filtro y ordenamiento
    $query = "SELECT 
            f.id_fiscalizacion AS id,
            f.numero AS Nro,
            t.descripcion AS Tipo,
            e.descripcion AS Etapa,
            DATE_FORMAT(f.fecha_presentacion, '%d/%m/%Y') AS FechaPresentacion,
            DATE_FORMAT(f.fecha_prorroga, '%d/%m/%Y') AS NuevaFecha,  
            es.descripcion AS Estado,
            f.IGV,
            DATEDIFF(f.fecha_presentacion, CURDATE()) AS DiasRestantes
          FROM fiscalizacion f
          JOIN tipo t ON f.id_tipo = t.id_tipo
          JOIN etapa e ON f.id_etapa = e.id_etapa
          JOIN estado es ON f.id_estado = es.id_estado
          WHERE f.fecha_presentacion >= CURDATE()
          AND f.id_estado IN ('1', '3')";

    // Aplicar mismos filtros que en countQuery
    switch ($tableType) {
        case 'reclamar':
            $query .= " AND f.id_etapa = 6";
            break;
        case 'apelar':
            $query .= " AND f.id_etapa = 7";
            break;
    }

    // Ordenar por proximidad y luego por fecha
    $query .= " ORDER BY 
                CASE 
                    WHEN f.fecha_presentacion = CURDATE() THEN 0
                    ELSE 1
                END,
                ABS(DATEDIFF(f.fecha_presentacion, CURDATE())) ASC,
                f.fecha_presentacion ASC
               LIMIT :offset, :perPage";

    $stmt = $pdo->prepare($query);
    $offset = ($page - 1) * $perPage;
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindValue(':perPage', $perPage, PDO::PARAM_INT);
    $stmt->execute();

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Validación de datos obtenidos
    if ($data === false) {
        throw new Exception("Error al obtener datos de la consulta", 500);
    }

    // Formatear datos numéricos
    array_walk($data, function(&$item) {
        $item['IGV'] = isset($item['IGV']) ? number_format((float)$item['IGV'], 2, '.', ',') : '0.00';
    });

    // Log detallado para depuración
    error_log("Consulta ejecutada: " . $query);
    error_log("Parámetros: offset=$offset, perPage=$perPage");
    error_log("Registros obtenidos: " . count($data));
    error_log("Total de registros: $totalRecords, Total de páginas: $totalPages");

    // Respuesta con datos de paginación
    echo json_encode([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'currentPage' => $page,
            'perPage' => $perPage,
            'totalRecords' => $totalRecords,
            'totalPages' => $totalPages,
            'showingRecords' => count($data),
            'queryInfo' => 'Consulta ejecutada correctamente'
        ]
    ]);

} catch (PDOException $e) {
    $errorInfo = [
        'error' => 'Database Error',
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
        'query' => $query ?? 'No definida',
        'params' => [
            'offset' => $offset ?? null,
            'perPage' => $perPage ?? null
        ]
    ];

    error_log("Error PDO detallado:\n" . print_r($errorInfo, true));
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error de base de datos',
        'errorDetails' => $errorInfo,
        'pagination' => null
    ]);

} catch (Exception $e) {
    $errorInfo = [
        'error' => 'Application Error',
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString(),
        'inputData' => $input ?? null,
        'tableType' => $tableType ?? null,
        'page' => $page ?? null
    ];

    error_log("Error de aplicación:\n" . print_r($errorInfo, true));
    
    http_response_code($e->getCode() ?: 400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'errorDetails' => $errorInfo,
        'pagination' => null
    ]);
}
?>