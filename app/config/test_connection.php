<?php
require_once 'database.php';
try {
    $pdo = Database::connect();
    echo "¡Conexión exitosa!";
    print_r($pdo->query("SHOW TABLES")->fetchAll());
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}