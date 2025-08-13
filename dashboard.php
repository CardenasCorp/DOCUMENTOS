<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Location: ../app/login.php'); 
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">  
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="/style/modals/navbar.css">
    <link rel="stylesheet" href="/style/dashboard/dashboard-2.css">
    <title>Document</title>
</head>
<body>
    <nav>
        <ul>
            <div>
                <li><a href="index.php"><img src="/img/logo2.png" alt=""></a></li>
            </div>
            <div>
                <li><a href="/app/registrar-caso.php">Gestionar Casos</a></li>
            </div>
            <div>
                <li><a href="/app/logout.php" class="close">Cerrar Sesion</a></li>
            </div>  
        </ul>

    </nav>
    <div>
        <div class="container">
            <div class="dashboard-header">
                <a href="/index.php" style="text-decoration: none; color: inherit;">
                    <h3><i class="bi bi-caret-left-square"> Resumen de Casos</i></h3>
                </a>
            </div>
        </div>
    </div>
    <div class="container">
        <!-- Tabla Por Cerrar -->
        <div class="cerrar">
            <div class="table-header cerrar-header">
                <h2>Por cerrar</h2>
                <p>0</p>
            </div>
            <table id="cerrar-table" class="cerrar-table">
                <thead>
                    <tr>
                        <th>Nro</th>
                        <th>Tipo</th>
                        <th>Etapa</th>
                        <th>Estado</th>
                        <th>Fecha de cierre</th>
                    </tr>   
                </thead>    
                <tbody>
                    <!-- Datos se cargarán dinámicamente -->
                </tbody>
            </table>
            <div class="table-footer">
                <div class="pagination-controls">
                    <!-- Paginación se generará dinámicamente -->
                </div>
            </div>
        </div>

        <!-- Tablas Reclamaciones y Apelaciones -->
        <div class="tables">
            <!-- Tabla Reclamaciones -->
            <div class="reclamaciones">
                <div class="table-header reclamaciones-header">
                    <h2>Reclamaciones</h2>
                    <p>0</p>
                </div>
                <table id="reclamaciones-table" class="reclamaciones-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Tipo</th>
                            <th>Fecha a presentar</th>
                            <th>Fecha máxima de resolución</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Datos se cargarán dinámicamente -->
                    </tbody>
                </table>
                <div class="table-footer">
                    <div class="pagination-controls">
                        <!-- Paginación se generará dinámicamente -->
                    </div>
                </div>
            </div>

            <!-- Tabla Apelaciones -->
            <div class="apelaciones">
                <div class="table-header apelaciones-header">
                    <h2>Apelaciones</h2>
                    <p>0</p>
                </div>
                <table id="apelaciones-table" class="apelaciones-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Tipo</th>
                            <th>Fecha a presentar</th>
                            <th>Fecha máxima de resolución</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Datos se cargarán dinámicamente -->
                    </tbody>
                </table>
                <div class="table-footer">
                    <div class="pagination-controls">
                        <!-- Paginación se generará dinámicamente -->
                    </div>
                </div>
            </div>
        </div>
        <div class="quejas">
            <div class="quejas-header">
                <h2>
                    Quejas
                </h2>
                <input class="buscar-quejas" type="text" placeholder="Buscar...">
                <p>2</p>
            </div>
            <table class="quejas-table">
                <thead>
                    <tr>
                        <th>Empresa</th>
                        <th>Requerimiento</th>
                        <th>Numero</th>
                        <th>Resumen</th>
                        <th>Fecha de la presentacion</th>
                        <th>Fecha maxima de respuesta</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Aventura S.A.C.</td>
                        <td>F-00001</td>
                        <td>1</td>
                        <td>Queja por ...</td>
                        <td>15/10/2023</td>
                        <td>15/12/2023</td>
                    </tr>
                </tbody>
            </table>
            <div class="table-footer">
                <div class="pagination-controls">
                    <button class="pagination-btn" disabled>«</button>
                    <button class="pagination-btn active">1</button>
                    <button class="pagination-btn">2</button>
                    <button class="pagination-btn">3</button>
                    <button class="pagination-btn">»</button>
                </div>
            </div>
        </div>
    </div>

    <script src="./script/dashboard/tables-2.js"></script>
</body>
</html> 