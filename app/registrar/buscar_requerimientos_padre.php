<?php
// buscar_requerimientos_padre.php
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
    
    // Consulta base
    $query = "SELECT 
                f.id_fiscalizacion, 
                f.numero, 
                c.razon_social AS cliente,
                f.periodo_inicio,
                f.periodo_final
              FROM fiscalizacion f
              JOIN cliente c ON f.id_cliente = c.id_cliente
              WHERE f.id_etapa = 1";
    
    // Añadir condiciones de búsqueda si hay parámetros
    if (!empty($search) && !empty($field)) {
        if ($field === 'numero') {
            $query .= " AND f.numero LIKE :search";
        } elseif ($field === 'cliente') {
            $query .= " AND c.razon_social LIKE :search";
        }
    }
    
    $stmt = $conn->prepare($query);
    
    // Bind parameters si hay búsqueda
    if (!empty($search) && !empty($field)) {
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