<?php
// app/casos/get_case_drive_info.php

require_once '../../config/database.php';

header('Content-Type: application/json');

if (!isset($_GET['id_fiscalizacion'])) {
    echo json_encode(['success' => false, 'message' => 'ID de fiscalización requerido']);
    exit;
}

$id_fiscalizacion = $_GET['id_fiscalizacion'];

try {
    // 1. Obtener información del caso
    $query = "SELECT 
                f.numero,
                f.id_etapa,
                f.periodo_inicio,
                f.periodo_final,
                c.RUC,
                c.razon_social,
                te.nombre as etapa_nombre
              FROM fiscalizaciones f
              LEFT JOIN clientes c ON f.id_cliente = c.id_cliente
              LEFT JOIN tipo_etapa te ON f.id_etapa = te.id_etapa
              WHERE f.id_fiscalizacion = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id_fiscalizacion);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Caso no encontrado']);
        exit;
    }
    
    $caso = $result->fetch_assoc();
    
    // 2. Obtener número de requerimiento padre (si existe)
    $query_padre = "SELECT numero FROM fiscalizaciones WHERE id_fiscalizacion = 
                    (SELECT id_fiscalizacion_padre FROM fiscalizaciones WHERE id_fiscalizacion = ?)";
    $stmt_padre = $conn->prepare($query_padre);
    $stmt_padre->bind_param("i", $id_fiscalizacion);
    $stmt_padre->execute();
    $result_padre = $stmt_padre->get_result();
    $padre = $result_padre->fetch_assoc();
    
    // 3. Preparar datos para la API de Drive
    $drive_data = [
        'ruc' => $caso['RUC'],
        'etapa' => $caso['etapa_nombre'],
        'numero_requerimiento' => $caso['numero']
    ];
    
    // Determinar si es 1er requerimiento o tiene padre
    if ($caso['id_etapa'] == 1) {
        // Es 1er requerimiento
        $drive_data['etapa'] = '1er Requerimiento';
    } else if ($padre && isset($padre['numero'])) {
        // Tiene requerimiento padre
        $drive_data['requerimiento_principal'] = $padre['numero'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $caso,
        'drive_data' => $drive_data,
        'padre' => $padre
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>