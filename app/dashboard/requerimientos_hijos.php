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
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input === null) {
        throw new Exception("Datos JSON inválidos", 400);
    }

    $action = $input['action'] ?? '';
    $idPadre = $input['id_fiscalizacion_padre'] ?? null;

    // Validar parámetros
    if ($action !== 'fetch_hijos' || !$idPadre) {
        throw new Exception("Parámetros inválidos", 400);
    }

    // Consulta para obtener requerimientos hijos (etapas 2-10)
    $query = "SELECT 
                f.id_fiscalizacion,
                f.numero,
                e.descripcion AS etapa,
                DATE_FORMAT(f.fecha_presentacion, '%d/%m/%Y') AS fecha_presentacion,
                es.descripcion AS estado,
                f.IGV
              FROM fiscalizacion f
              JOIN etapa e ON f.id_etapa = e.id_etapa
              JOIN estado es ON f.id_estado = es.id_estado
              WHERE f.id_fiscalizacion_padre = :idPadre
              AND f.id_etapa BETWEEN 2 AND 10
              ORDER BY f.id_etapa ASC";

    $stmt = $pdo->prepare($query);
    $stmt->bindValue(':idPadre', $idPadre, PDO::PARAM_INT);
    $stmt->execute();

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data
    ]);

} catch (PDOException $e) {
    error_log("PDO Error: " . $e->getMessage());
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