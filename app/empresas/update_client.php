<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$host = 'localhost';
$db   = 'Documentos';
$user = 'root';
$pass = 'root';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $conn->prepare("UPDATE cliente SET 
                           RUC = :ruc, 
                           razon_social = :razon_social, 
                           direccion_fiscal = :direccion_fiscal, 
                           departamento = :departamento
                           WHERE id_cliente = :id");
    
    $stmt->bindParam(':id', $data['id']);
    $stmt->bindParam(':ruc', $data['RUC']);
    $stmt->bindParam(':razon_social', $data['razon_social']);
    $stmt->bindParam(':direccion_fiscal', $data['direccion_fiscal']);
    $stmt->bindParam(':departamento', $data['departamento']);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Cliente actualizado correctamente'
        ]);
    } else {
        throw new Exception('Error al actualizar cliente');
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>