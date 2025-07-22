<?php
session_start();
session_unset(); // Limpiar las variables de sesión
session_destroy(); // Destruir la sesión
header('Location: login.php'); // Redirigir a la página de login
exit();
?>
