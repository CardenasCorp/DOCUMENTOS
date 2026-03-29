<?php
set_time_limit(60);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host    = '34.45.106.213';
$db      = 'Documentos';
$user    = 'root';
$pass    = 'CardenasCorp2025';
$charset = 'utf8mb4';

$dsn     = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $conn = new PDO($dsn, $user, $pass, $options);

    $query = "
        SELECT
            c.RUC,
            c.razon_social,
            c.propietario,
            f.numero,
            f.id_tipo,
            f.id_etapa,
            f.id_estado,
            f.periodo_inicio,
            f.periodo_final,
            f.fecha_notificacion,
            f.IGV
        FROM fiscalizacion f
        LEFT JOIN cliente c ON f.id_cliente = c.id_cliente
        WHERE f.id_estado != 5
          AND f.id_etapa IN (14, 15, 16)
        ORDER BY f.fecha_notificacion DESC
        LIMIT 2000
    ";

    $stmt  = $conn->query($query);
    $cases = $stmt->fetchAll();

    echo json_encode([
        'success'     => true,
        'data'        => $cases,
        'total_cases' => count($cases)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success'    => false,
        'message'    => 'Error de base de datos: ' . $e->getMessage(),
        'error_info' => $e->errorInfo
    ]);
}
?>