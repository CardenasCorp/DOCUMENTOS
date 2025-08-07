<?php
// buscar_todos_requerimientos.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

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
    
    // Obtener parámetros de búsqueda
    $search = $_GET['search'] ?? '';
    $field = $_GET['field'] ?? '';
    
    // Consulta base para todos los requerimientos (sin filtrar por etapa)
    $query = "SELECT 
                f.id_fiscalizacion, 
                f.numero, 
                c.razon_social AS cliente,
                f.periodo_inicio,
                f.periodo_final,
                f.id_etapa,
                f.fecha_notificacion,
                f.fecha_presentacion,
                f.IGV
              FROM fiscalizacion f
              JOIN cliente c ON f.id_cliente = c.id_cliente
              WHERE 1=1";
    
    // Añadir condiciones de búsqueda si hay parámetros
    if (!empty($search)) {
        if ($field === 'tipo') {
            $query .= " AND f.numero LIKE :search";
        } elseif ($field === 'referencia') {
            $query .= " AND c.razon_social LIKE :search";
        }
    }
    
    // Ordenar por número de documento por defecto
    $query .= " ORDER BY f.numero DESC";
    
    $stmt = $conn->prepare($query);
    
    // Bind parameters si hay búsqueda
    if (!empty($search)) {
        $stmt->bindValue(':search', '%' . $search . '%');
    }
    
    $stmt->execute();
    $requerimientos = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $requerimientos
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>  