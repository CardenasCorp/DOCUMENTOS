<?php
// --- Ajustes para App Engine (sesiones en /tmp) ---
if (getenv('GAE_ENV') !== false) {
    ini_set('session.save_handler', 'files');
    $sessDir = sys_get_temp_dir() . '/sessions';
    if (!file_exists($sessDir)) {
        mkdir($sessDir, 0700, true);
    }
    ini_set('session.save_path', $sessDir);
}

// Cookies de sesión más seguras (si tienes HTTPS en producción, pon secure => true)
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'domain'   => '',
    'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();

// -------- Configuración --------
$INACTIVITY_TIMEOUT = 3600; // 1 hora

// Expiración por inactividad
if (isset($_SESSION['last_activity']) && time() - $_SESSION['last_activity'] > $INACTIVITY_TIMEOUT) {
    session_unset();
    session_destroy();
    error_log("DEBUG Login - Session expired due to inactivity");
    header('Location: login.php?expired=1');
    exit();
}
$_SESSION['last_activity'] = time();

// Depuración opcional
error_log("DEBUG Login - Session ID: " . session_id());
error_log("DEBUG Login - User ID: " . ($_SESSION['user_id'] ?? 'NOT SET'));

// Si ya está logueado, envía a index
if (isset($_SESSION['user_id'])) {
    error_log("DEBUG Login - User already logged in, redirecting to index");
    header('Location: /index.php');
    exit();
}

// -------- DB Connection --------
function conectarDB() {
    $host = '34.45.106.213';
    $db   = 'Documentos';
    $user = 'root';
    $pass = 'CardenasCorp2025';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    try {
        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false
        ]);
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        // Mensaje genérico para el usuario
        die("Error de conexión. Contacte al administrador.");
    }
}

$error_message = "";

// -------- Procesar formulario --------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = trim($_POST['username'] ?? '');
    $clave   = $_POST['password'] ?? '';

    if ($usuario !== '' && $clave !== '') {
        try {
            $pdo = conectarDB();

            // IMPORTANTE: usa los campos reales de tu tabla
            // id_usuario, usuario, password_hash, departamento, activo
            $stmt = $pdo->prepare("
                SELECT id_usuario, usuario, password_hash, departamento, activo
                FROM usuarios
                WHERE usuario = :usuario
                LIMIT 1
            ");
            $stmt->bindValue(':usuario', $usuario, PDO::PARAM_STR);
            $stmt->execute();
            $user = $stmt->fetch();

            // Para no dar pistas (enumeración), usamos un mensaje genérico
            $genericError = "Usuario o contraseña incorrectos";

            if (!$user) {
                error_log("DEBUG Login - User not found: {$usuario}");
                $error_message = $genericError;
            } else {
                if ((int)$user['activo'] !== 1) {
                    error_log("DEBUG Login - Inactive user: {$usuario}");
                    $error_message = "Usuario inactivo. Contacte al administrador.";
                } else {
                    // Verificación con password_hash
                    if (password_verify($clave, $user['password_hash'])) {
                        // Rehash si el algoritmo/params cambiaron
                        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
                            $newHash = password_hash($clave, PASSWORD_DEFAULT);
                            $upd = $pdo->prepare("UPDATE usuarios SET password_hash = :hash WHERE id_usuario = :id");
                            $upd->execute([':hash' => $newHash, ':id' => $user['id_usuario']]);
                        }

                        // Regenerar ID de sesión para evitar fijación
                        session_regenerate_id(true);

                        // Setear sesión
                        $_SESSION['user_id']       = (int)$user['id_usuario'];
                        $_SESSION['username']      = $user['usuario'];
                        $_SESSION['departamento']  = $user['departamento'];
                        $_SESSION['last_activity'] = time();

                        // Redirigir según el departamento
                        if ($user['departamento'] === 'OPERACIONES') {
                            header('Location: /app/empresas.php');
                        } else {
                            header('Location: /index.php');
                        }
                        exit();
                    } else {
                        error_log("DEBUG Login - Wrong password for user: {$usuario}");
                        $error_message = $genericError;
                    }
                }
            }
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            $error_message = "Error del sistema. Intente más tarde.";
        }
    } else {
        $error_message = "Por favor, complete todos los campos";
    }
}

// Mensaje si expiró
if (isset($_GET['expired']) && $_GET['expired'] == '1') {
    $error_message = "Su sesión ha expirado por inactividad. Por favor, inicie sesión nuevamente.";
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión</title>

    <link rel="stylesheet" href="../style/login.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">

    <script>
        // Inactividad en el cliente (1 hora)
        (function inactivityTime(){
            let timer;
            function logout() {
                alert('Su sesión ha expirado por inactividad');
                window.location.href = 'login.php?expired=1';
            }
            function resetTimer() {
                clearTimeout(timer);
                timer = setTimeout(logout, 3600000);
            }
            window.addEventListener('load', resetTimer);
            ['mousemove','keypress','touchstart','click','scroll'].forEach(ev =>
                document.addEventListener(ev, resetTimer, {passive:true})
            );
        })();
    </script>
</head>
<body>
<div class="containers">
    <div class="logo">
        <img src="/img/logo.png" alt="Logo">
    </div>
    <div class="container">
        <div class="login-container">
            <h2>Iniciar Sesión</h2>
            <form action="login.php" method="POST" autocomplete="off">
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
                    alert("<?php echo addslashes($error_message); ?>");
                </script>
            <?php endif; ?>

        </div>
    </div>
</div>
</body>
</html>
                