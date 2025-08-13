<?php
// Configuración especial para App Engine
if (getenv('GAE_ENV') !== false) {
    ini_set('session.save_handler', 'files');
    ini_set('session.save_path', sys_get_temp_dir() . '/sessions');
    
    if (!file_exists(sys_get_temp_dir() . '/sessions')) {
        mkdir(sys_get_temp_dir() . '/sessions', 0700, true);
    }
}

session_start();

// Depuración (puedes eliminar esto después)
error_log("DEBUG Login - Session ID: " . session_id());
error_log("DEBUG Login - User ID: " . ($_SESSION['user_id'] ?? 'NOT SET'));

// Si ya está logueado, redirigir al index
if (isset($_SESSION['user_id'])) {
    error_log("DEBUG Login - User already logged in, redirecting to index");
    header('Location: /index.php');
    exit();
}

$error_message = "";

// Procesar formulario de login
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = $_POST['username'] ?? '';
    $clave = $_POST['password'] ?? '';

    // Validación simple (debes implementar una más segura)
    if ($usuario === 'CardenaCorp' && $clave === 'C4RD3N4Scorp') {
        $_SESSION['user_id'] = 1;
        error_log("DEBUG Login - Login successful, redirecting to index");
        header('Location: /index.php');
        exit();
    } else {
        $error_message = "Usuario o clave incorrectos";
        error_log("DEBUG Login - Failed login attempt");
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="../style/login.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <title>Iniciar Sesión</title>
</head>
<body>
    <div class="containers">
        <div class="logo">
            <img src="/img/logo.png" alt="Logo">
        </div>
        <div class="container">
            <div class="login-container">
                <h2>Iniciar Sesión</h2>
                <form action="login.php" method="POST">
                    <div class="input-group">
                        <label for="username">Usuario:</label>
                        <input type="text" id="username" name="username" placeholder="Ingresa tu usuario" required>
                    </div>
                    <div class="input-group">
                        <label for="password">Contraseña:</label>
                        <input type="password" id="password" name="password" placeholder="Ingresa tu contraseña" required>
                    </div>
                    <button type="submit" class="btn">Iniciar sesión</button>
                </form>
                <?php if ($error_message): ?>
                    <script>
                        alert("<?php echo $error_message; ?>");
                    </script>
                <?php endif; ?>
            </div>
        </div>
    </div>
</body>
</html>
