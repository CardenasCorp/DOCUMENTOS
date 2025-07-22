<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$host = 'localhost';
$db   = 'Documentos';
$user = 'root';
$pass = 'root'; 

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $data = json_decode(file_get_contents('php://input'), true);
    
    $first_name = trim($data['first_name'] ?? '');
    $last_name = trim($data['last_name'] ?? '');

    if (empty($first_name) || empty($last_name)) {
        throw new Exception('Nombre y apellido son requeridos');
    }

    $stmt = $conn->prepare("INSERT INTO personal (nombres, apellidos) VALUES (:first_name, :last_name)");
    $stmt->bindParam(':first_name', $first_name);
    $stmt->bindParam(':last_name', $last_name);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $conn->lastInsertId(), // Esto devolverá id_personal
            'first_name' => $first_name,
            'last_name' => $last_name
        ]);
    } else {
        throw new Exception('Error al insertar en la base de datos');
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>