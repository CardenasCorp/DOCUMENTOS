<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../style/modals/sidebar.css">
    <link rel="stylesheet" href="../style/modals/menu-container.css">
    <link rel="stylesheet" href="../style/empleados.css">
    <link rel="stylesheet" href="../style/modals/modal-edit.css">
    <title>Documentos</title>
</head>

<body>
    <div class="container">
        <div class="sidebar">
            <h2><a href="">Menú Principal</a></h2>
            <hr>
            <ul>
                <li><a href="registrar-caso.php"><i class="bi bi-file-earmark-plus"></i> <span>Registrar</span></a></li>
                <li><a href="modificar-caso.php"><i class="bi bi-pencil-square"></i> <span>Modificar</span></a></li>
                <li><a href="list-case.php"><i class="bi bi-list-ul"></i> <span>Lista de casos</span></a></li>
                <hr>
                <li><a href="empleados.php"><i class="bi bi-building"></i> <span>SUNAT</span></a></li>
                <hr>
                <li><a href="empresas.php"><i class="bi bi-briefcase"></i> <span>Empresa</span></a></li>
            </ul>
        </div>
        <div class="main-content">
            <a href="../index.php"><i class="bi bi-arrow-left-square-fill"></i></a>
                    <hr>
                    <br>
            <div class="content-employees">
                
                <h1>Lista de empleados</h1>
                <div class="employees-list">
                    <div class="search-employee">
                        <label for="nombre">Nombre</label>
                        <input type="text" id="searchInput" placeholder="Buscar empleado... 🔎" class="search-input">
                        <button id="openModalButtonEditEmpoyee">Agregar</button>
                    </div>
                    <div class="employee-container">
                        <h4>Lista de empleados</h4>
                        
                    </div>
                </div>
                <div class="pagination" id="pagination">
                 <!-- Los botones de paginación se generarán dinámicamente -->
                </div>
            </div>
        </div>
    </div>
    <div id="myModalEditEmpoyee" class="myModalEditEmpoyee">
        <div class="modal-content">
            <span class="close" id="closeModalEditEmpoyee">&times;</span>
            <h2>Empleado</h2>
    <!-- Un solo formulario con method POST -->
            <form id="employeeForm" class="modal-form-EditEmpoyee" method="POST">
                <div class="form-modal">
                    <label for="f-name">Nombres</label>
                    <input type="text" id="f-name" name="first_name" placeholder="Nombres" required>
            <!-- ^^ name="first_name" para que PHP lo reciba -->
                </div>

                <div class="form-modal">
                    <label for="l-name">Apellidos</label>
                    <input type="text" id="l-name" name="last_name" placeholder="Apellidos" required>
            <!-- ^^ name="last_name" para que PHP lo reciba -->
                </div>

                <div class="modal-button">
                    <button type="submit" class="accept-modal">Aceptar</button>
                    <!-- Botón DENTRO del formulario -->
                </div>
            </form>
        </div>
    </div>
    <script src="../script/modals/modal-edit.js"></script>

</body>

</html>