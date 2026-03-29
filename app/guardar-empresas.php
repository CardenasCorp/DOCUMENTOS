<?php
require_once 'session_check.php';

// Solo admite POST con JSON
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}


header('Content-Type: application/json');

// Leer body JSON
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Datos inválidos']);
    exit;
}

// Validar estructura básica de cada registro
$camposRequeridos = ['ruc', 'razon_social', 'esquela', 'fiscalizacion', 'vigentes'];
foreach ($data as $row) {
    foreach ($camposRequeridos as $campo) {
        if (!array_key_exists($campo, $row)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => "Falta el campo: $campo"]);
            exit;
        }
    }
    // Validar que esquela, fiscalizacion y vigentes sean SI o NO
    foreach (['esquela', 'fiscalizacion', 'vigentes'] as $campo) {
        if (!in_array($row[$campo], ['SI', 'NO'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => "Valor inválido en $campo: {$row[$campo]}"]);
            exit;
        }
    }
}

// Ruta del archivo JSON (mismo directorio que el script)
$jsonFile = __DIR__ . '/empresas-data.json';

// Hacer backup del archivo anterior si existe
if (file_exists($jsonFile)) {
    $backup = __DIR__ . '/empresas-data.backup.json';
    copy($jsonFile, $backup);
}

// Guardar con formato legible
$resultado = file_put_contents(
    $jsonFile,
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
);

if ($resultado === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo escribir el archivo. Verifica permisos de escritura.']);
    exit;
}

echo json_encode([
    'ok'      => true,
    'mensaje' => 'Datos guardados correctamente',
    'total'   => count($data),
    'archivo' => 'empresas-data.json'
]);