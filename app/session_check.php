<?php
// session_check.php - Incluir este archivo al inicio de cada página protegida
session_start();

$inactivity_timeout = 3600; // 1 hora

// Verificar si el usuario está logueado
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

// Verificar inactividad
if (isset($_SESSION['last_activity'])) {
    if (time() - $_SESSION['last_activity'] > $inactivity_timeout) {
        session_unset();
        session_destroy();
        header('Location: login.php?expired=1');
        exit();
    }
}

// Actualizar timestamp de última actividad
$_SESSION['last_activity'] = time();

// Conectar a la base de datos para verificar que el usuario aún existe
function conectarDB() {
    $host = '34.45.106.213';
    $db   = 'Documentos';
    $user = 'root';
    $pass = 'CardenasCorp2025';
    $charset = 'utf8mb4';
    
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    
    try {
        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    } catch (PDOException $e) {
        error_log("Database connection failed in session_check: " . $e->getMessage());
        return null;
    }
}

// Verificar que el usuario todavía existe en la base de datos
try {
    $pdo = conectarDB();
    if ($pdo) {
        $stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE id_usuario = :id");
        $stmt->bindParam(':id', $_SESSION['user_id']);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            // Usuario fue eliminado de la base de datos
            session_unset();
            session_destroy();
            header('Location: login.php?deleted=1');
            exit();
        }
    }
} catch (PDOException $e) {
    error_log("Error verifying user in session_check: " . $e->getMessage());
    // Continuar la sesión aunque falle la verificación para no interrumpir al usuario
}

// RESTRICCIÓN PARA OPERACIONES Y CONSULTING
// Solo pueden acceder a empresas.php y tabla-casos.php
$departamentos_restringidos = ['OPERACIONES', 'CONSULTING'];

if (isset($_SESSION['departamento']) && in_array($_SESSION['departamento'], $departamentos_restringidos)) {
    $current_page = basename($_SERVER['PHP_SELF']);
    
    // ÚNICAS páginas permitidas para estos departamentos
    $allowed_pages = ['empresas.php', 'logout.php', 'tabla-casos.php', 'lista-empresas.php'];
    
    // Si intenta acceder a cualquier otra página, lo redirigimos a app/empresas.php
    if (!in_array($current_page, $allowed_pages)) {
        header('Location: /app/empresas.php');
        exit();
    }
}

// Los demás departamentos (ADMIN, CONTABILIDAD, etc.) NO tienen restricciones
// Pueden navegar libremente por todas las páginas
?>