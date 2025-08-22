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
    <link rel="stylesheet" href="/style/style.css">
    <link rel="stylesheet" href="/style/modals/navbar.css">
    <link rel="stylesheet" href="/style/dashboard/tables.css">
    <link rel="icon" href="/img/favicon.ico" >
    <title>Document</title>
</head>
<body>
    <nav>
        <ul>
            <div>
                <li><a href="/index.php"><img src="/img/logo2.png" alt=""></a></li>
            </div>
            <div>
                <li><a href="/app/registrar-caso.php">Gestionar Casos</a></li>
            </div>
            <div>
                <li><a href="/app/logout.php" class="close">Cerrar Sesión</a></li>
            </div>  
        </ul>

    </nav>
    <div>
        <div class="container">
            <div class="dashboard-header">
                <a href="/dashboard.php" style="text-decoration: none; color: inherit;">

                    <h3>Resumen de Casos <i class="bi bi-caret-right-square"></i></h3>
                </a>
            </div>
        </div>
    </div>
    <div class="container">
        <!-- Tabla Por Vencer -->
        <div class="vencer">
            <div class="table-header vencer-header">
                <h2>Por vencer</h2>
                <p>0</p>
            </div>
            <table id="vencer-table" class="vencer-table">
                <thead>
                    <tr>
                        <th>Nro</th>
                        <th>Tipo</th>
                        <th>Etapa</th>
                        <th>Fecha a presentar</th>
                        <th>Nueva Fecha</th>  <!-- ← NUEVA COLUMNA -->
                        <th>Estado</th>
                        <th>IGV</th>
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

        <!-- Tablas Por Reclamar y Por Apelar -->
        <div class="tables">
            <!-- Tabla Por Reclamar -->
            <div class="reclamar">
                <div class="table-header reclamar-header">
                    <h2>Por reclamar</h2>
                    <p>0</p>
                </div>
                <table id="reclamar-table" class="reclamar-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Tipo</th>
                            <th>Fecha a presentar</th>
                            <th>Estado</th>
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

            <!-- Tabla Por Apelar -->
            <div class="apelar">
                <div class="table-header apelar-header">
                    <h2>Por apelar</h2>
                    <p>0</p>
                </div>
                <table id="apelar-table" class="apelar-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Tipo</th>
                            <th>Fecha a presentar</th>
                            <th>Estado</th>
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
        <div class="resumen">
            <div class="resumen-header">
                <h2>
                    Resumen
                </h2>
                <input class="buscar-resumen" type="text" placeholder="Buscar...">
                <p>2</p>
            </div>
            <table class="resumen-table">
                <thead>
                    <tr>
                        <th>Nro</th>
                        <th>Tipo</th>
                        <th>Etapa</th>
                        <th>Estado</th>
                        <th>Fecha a presentar</th>
                        <th>Fecha de presentacion</th>
                        <th>Nueva Fecha</th>
                        <th>IGV</th>
                        <th>SUNAT</th>
                        <th>Ver</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
            <div class="table-footer">
                <div class="pagination-controls">
                    
                </div>
            </div>
        </div>
    </div>
    <!-- Modal para Requerimientos Hijos -->
    <div id="requerimientosModal" class="modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h3>Requerimientos Relacionados</h3>
        <div class="modal-body">
          <table class="modal-table">
            <thead>
              <tr>
                <th>Nro</th>
                <th>Etapa</th>
                <th>Fecha a Presentar</th>  
                <th>Fecha de Presentación</th>
                <th>Nueva Fecha</th>
                <th>Estado</th>
                <th>IGV</th>
              </tr>
            </thead>
            <tbody id="modalRequerimientosBody">
              <!-- Datos se cargarán dinámicamente -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <script src="/script/dashboard/tables.js"></script>

</body>

</html>