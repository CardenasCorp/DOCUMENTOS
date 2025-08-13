<?php
// Configuración especial para App Engine
if (getenv('GAE_ENV') !== false) {
    ini_set('session.save_handler', 'files');
    ini_set('session.save_path', sys_get_temp_dir() . '/sessions');
}

session_start();

// Destruir la sesión
$_SESSION = array();
session_destroy();

// Redirigir al login
header('Location: /app/login.php');
exit();
?>