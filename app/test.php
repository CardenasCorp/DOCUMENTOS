<?php
// regenerate_passwords.php
$host = '34.45.106.213';
$db   = 'Documentos';
$user = 'root';
$pass = 'CardenasCorp2025';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // OJO: 'Alexis$1!' tiene 9 caracteres, no 10 😉
    // Define también 'departamento' porque es NOT NULL
    $users = [
        [
            'usuario'      => 'DirecAdmin',
            'password'     => 'Direc@dmin$1',
            'departamento' => 'OPERACIONES',  
            'activo'       => 1
        ],
        // agrega más usuarios aquí...
    ];

    // Transacción por seguridad
    $pdo->beginTransaction();

    // INSERT con upsert: crea si no existe (usuario es UNIQUE), si existe actualiza el hash y 'activo'
    $sql = "
        INSERT INTO usuarios (usuario, password_hash, departamento, activo)
        VALUES (:usuario, :password_hash, :departamento, :activo)
        ON DUPLICATE KEY UPDATE
            password_hash = VALUES(password_hash),
            departamento  = VALUES(departamento),
            activo        = VALUES(activo)
    ";
    $stmt = $pdo->prepare($sql);

    foreach ($users as $u) {
        // valida longitud mínima de contraseña (recomendado ≥ 8–10)
        if (strlen($u['password']) < 8) {
            throw new RuntimeException("La contraseña de {$u['usuario']} es muy corta.");
        }

        $hash = password_hash($u['password'], PASSWORD_DEFAULT);
        $stmt->execute([
            ':usuario'       => $u['usuario'],
            ':password_hash' => $hash,
            ':departamento'  => $u['departamento'],
            ':activo'        => (int)$u['activo'],
        ]);
    }

    $pdo->commit();
    echo "Usuarios creados/actualizados correctamente.";
} catch (Throwable $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Error: " . $e->getMessage();
}
