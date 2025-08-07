<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta RUC="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../style/modals/sidebar.css">
    <link rel="stylesheet" href="../style/modals/menu-container.css">
    <link rel="stylesheet" href="../style/empresa.css">
    <link rel="stylesheet" href="../style/modals/modal-edit-business.css">
    <title>Document</title>
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
            <div class="content-business">
                <h1>Lista de Empresas</h1> 
                <div class="business-list">
                    <div class="search-business">
                        <input type="text" id="searchClientInput" placeholder="Buscar por nombre... 🔎" class="search-input">
                        <input type="text" id="searchRUCInput" placeholder="Buscar por RUC... 🔎" class="search-input">
                        <button id="addClientButton">Agregar Empresa</button>  <!-- Cambiado el ID para consistencia -->
                    </div>
                    <div class="business-container" id="clientContainer">  <!-- Añadido ID -->
                        <!-- Los clientes/empresas se cargarán aquí -->
                        <div class="loading-message">Cargando empresas...</div>
                    </div>
                </div>
                <div class="pagination" id="pagination">
                    <!-- Los botones de paginación se generarán dinámicamente -->
                </div>
            </div>
        </div>
    </div>
    <div id="myModalEditBusiness" class="myModalEditBusiness">
        <div class="modal-content">
            <span class="close" id="closeModalEditBusiness">&times;</span>
            <h2>Gestión de Cliente</h2>
            <form id="businessForm" class="modal-form-EditBusiness">
                <div class="form-modal">
                    <label for="f-RUC">RUC</label>
                    <input type="text" id="f-RUC" name="RUC" placeholder="RUC" required>
                </div>
                <div class="form-modal">
                    <label for="razon_social">Razón Social</label>
                    <input type="text" id="razon_social" name="razon_social" placeholder="Razón social" required>
                </div>
                <div class="form-modal">
                    <label for="propietario">Propietario</label>
                    <input type="text" id="propietario" name="propietario" placeholder="Nombre del propietario">
                </div>
                <div class="form-modal">
                    <label for="direccion_fiscal">Dirección Fiscal</label>
                    <input type="text" id="direccion_fiscal" name="direccion_fiscal" placeholder="Dirección fiscal" required>
                </div>  
                <div class="form-modal">
                    <label for="Departamento">Departamento</label>
                    <input type="text" id="Departamento" name="Departamento" placeholder="Departamento" required>
                </div>
                <div class="modal-button">
                    <button type="submit" class="accept-modal">Aceptar</button>
                </div>
            </form>
        </div>
    </div>

    <script src="../script/modals/clients-management.js"></script>
</body>

</html>