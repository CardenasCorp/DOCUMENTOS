<?php
// Configuración especial para App Engine
if (getenv('GAE_ENV') !== false) {
    ini_set('session.save_handler', 'files');
    ini_set('session.save_path', sys_get_temp_dir() . '/sessions');
    
    // Asegurar que el directorio de sesiones existe
    if (!file_exists(sys_get_temp_dir() . '/sessions')) {
        mkdir(sys_get_temp_dir() . '/sessions', 0700, true);
    }
}

// Iniciar sesión solo si no está iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Registrar el logout para auditoría
if (isset($_SESSION['user_id'])) {
    error_log("DEBUG Logout - User ID: " . $_SESSION['user_id'] . " logged out");
}

// Destruir completamente la sesión
$_SESSION = array();

// Si se desea destruir la cookie de sesión también
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destruir la sesión
session_destroy();

// Redirigir al login con parámetro de logout exitoso
header('Location: /app/login.php?logout=1');
exit();
?>