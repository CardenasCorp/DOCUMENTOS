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
    $perPage = 5;

    // Validar parámetros
    if ($action !== 'fetch') {
        throw new Exception("Acción no válida", 400);
    }

    if (!in_array($tableType, ['vencer', 'reclamar', 'apelar'])) {
        throw new Exception("Tipo de tabla no válido", 400);
    }

    // CONSULTA MODIFICADA: Incluir fechas de prórroga
    $countQuery = "SELECT COUNT(*) as total 
                   FROM fiscalizacion f
                   JOIN etapa e ON f.id_etapa = e.id_etapa
                   JOIN cliente c ON f.id_cliente = c.id_cliente
                   WHERE (f.fecha_presentacion >= CURDATE() 
                          OR f.fecha_prorroga >= CURDATE())";

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

    // CONSULTA PRINCIPAL CORREGIDA - IGV SIN FORMATEO EN SQL
    $query = "SELECT 
            f.id_fiscalizacion AS id,
            c.razon_social AS Empresa,
            f.numero AS Nro,
            t.descripcion AS Tipo,
            e.descripcion AS Etapa,
            DATE_FORMAT(f.fecha_presentacion, '%d/%m/%Y') AS FechaPresentacion,
            DATE_FORMAT(f.fecha_prorroga, '%d/%m/%Y') AS NuevaFecha,  
            es.descripcion AS Estado,
            -- IGV SIN FORMATEAR - lo formatearemos en PHP
            f.IGV AS IGV_Raw,
            -- Cálculo de días restantes considerando PRÓRROGA
            CASE 
                WHEN f.fecha_prorroga IS NOT NULL AND f.fecha_prorroga >= CURDATE() THEN 
                    DATEDIFF(f.fecha_prorroga, CURDATE())
                ELSE 
                    DATEDIFF(f.fecha_presentacion, CURDATE())
            END AS DiasRestantes,
            -- Campo para saber qué fecha se está usando
            CASE 
                WHEN f.fecha_prorroga IS NOT NULL AND f.fecha_prorroga >= CURDATE() THEN 'prorroga'
                ELSE 'original'
            END AS TipoFecha
          FROM fiscalizacion f
          JOIN tipo t ON f.id_tipo = t.id_tipo
          JOIN etapa e ON f.id_etapa = e.id_etapa
          JOIN estado es ON f.id_estado = es.id_estado
          JOIN cliente c ON f.id_cliente = c.id_cliente
          WHERE (f.fecha_presentacion >= CURDATE() 
                 OR f.fecha_prorroga >= CURDATE())
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

    // ORDENAMIENTO MEJORADO considerando prórrogas
    $query .= " ORDER BY 
                -- Prioridad 1: Fechas que vencen HOY
                CASE 
                    WHEN (f.fecha_prorroga IS NOT NULL AND f.fecha_prorroga = CURDATE()) 
                         OR f.fecha_presentacion = CURDATE() THEN 0
                    ELSE 1
                END,
                -- Prioridad 2: Proximidad (usando la fecha activa)
                CASE 
                    WHEN f.fecha_prorroga IS NOT NULL AND f.fecha_prorroga >= CURDATE() THEN 
                        ABS(DATEDIFF(f.fecha_prorroga, CURDATE()))
                    ELSE 
                        ABS(DATEDIFF(f.fecha_presentacion, CURDATE()))
                END ASC,
                -- Prioridad 3: Preferir prórrogas sobre fechas originales
                CASE 
                    WHEN f.fecha_prorroga IS NOT NULL THEN 0
                    ELSE 1
                END,
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

    // **CORRECCIÓN PRINCIPAL: FORMATEO CORRECTO DEL IGV**
    array_walk($data, function(&$item) {
        // Obtener el valor raw del IGV
        $igvRaw = $item['IGV_Raw'];
        
        // Debug logging
        error_log("IGV Processing - Raw: " . $igvRaw . ", Type: " . gettype($igvRaw));
        
        // Convertir a float de manera segura
        if ($igvRaw !== null && $igvRaw !== '') {
            $igvValue = floatval($igvRaw);
            
            // Debug del valor convertido
            error_log("IGV Processing - Float: " . $igvValue);
            
            // **CORRECCIÓN: Formatear correctamente sin dividir**
            $item['IGV'] = number_format($igvValue, 2, '.', '');
            
            // Debug del valor formateado
            error_log("IGV Processing - Formatted: " . $item['IGV']);
        } else {
            $item['IGV'] = '0.00';
        }
        
        // Mantener el raw para debugging
        $item['IGV_Raw_Debug'] = $igvRaw;
    });

    // Log detallado para debugging del IGV
    error_log("=== IGV DEBUGGING ===");
    foreach ($data as $index => $item) {
        error_log("Registro {$index}: 
            ID: {$item['id']}
            Empresa: {$item['Empresa']}
            IGV_Raw: {$item['IGV_Raw_Debug']}
            IGV_Formatted: {$item['IGV']}
        ");
    }

    // Respuesta
    echo json_encode([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'currentPage' => $page,
            'perPage' => $perPage,
            'totalRecords' => $totalRecords,
            'totalPages' => $totalPages,
            'showingRecords' => count($data),
            'queryInfo' => 'Consulta con IGV corregido ejecutada correctamente'
        ],
        'debug' => [
            'igv_sample' => isset($data[0]) ? [
                'raw' => $data[0]['IGV_Raw_Debug'],
                'formatted' => $data[0]['IGV']
            ] : 'No data'
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