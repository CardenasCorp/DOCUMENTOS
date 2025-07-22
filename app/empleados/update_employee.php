<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: PUT, OPTIONS');
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
    
    $id = $data['id'] ?? null;
    $first_name = trim($data['first_name'] ?? '');
    $last_name = trim($data['last_name'] ?? '');

    if (empty($id)) {
        throw new Exception('ID de empleado requerido');
    }

    $stmt = $conn->prepare("UPDATE personal SET nombres = :first_name, apellidos = :last_name WHERE id_personal = :id");
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':first_name', $first_name);
    $stmt->bindParam(':last_name', $last_name);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $id,
            'first_name' => $first_name,
            'last_name' => $last_name
        ]);
    } else {
        throw new Exception('Error al actualizar el empleado');
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