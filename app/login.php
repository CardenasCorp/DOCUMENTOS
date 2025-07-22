<?php
session_start();

// Usuario y contraseña predefinidos
$valid_username = "CardenaCorp";
$valid_password = "C4RD3N4Scorp";

// Variable para controlar el mensaje de error
$error_message = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Verificar si el usuario y la contraseña coinciden con los valores predefinidos
    if ($username === $valid_username && $password === $valid_password) {
        // Iniciar sesión si los datos son correctos
        $_SESSION['user_id'] = 1; // Puede ser cualquier valor, ya que solo hay un usuario
        $_SESSION['username'] = $valid_username;
        header('Location: ../index.php'); // Redirigir a index.php después de iniciar sesión
        exit();
    } else {
        // Si las credenciales son incorrectas, asignar mensaje de error
        $error_message = 'Usuario o contraseña incorrectos.';
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
    <nav>
        <!-- Aquí va tu navegación si la tienes -->
    </nav>
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
                        // Si hay un mensaje de error, mostrar alerta
                        alert("<?php echo $error_message; ?>");
                    </script>
                <?php endif; ?>
            </div>
        </div>
    </div>
</body>

</html>
