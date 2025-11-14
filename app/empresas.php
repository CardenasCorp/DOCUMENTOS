<?php
require_once 'session_check.php';
?>

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
    <link rel="icon" href="../img/favicon.ico" >
    <title>Empresas</title>
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
                        <input type="text" id="searchClientInput" placeholder="Buscar por nombre... " class="search-input">
                        <input type="text" id="searchRUCInput" placeholder="Buscar por RUC... " class="search-input">
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
    <!-- Modal para Historial de Direcciones Y Gerentes -->
    <div id="myModalHistory" class="myModalHistory">
        <div class="modal-content">
            <span class="close" id="closeModalHistory">&times;</span>
            <h2>Historial de la Empresa</h2>
            
            <!-- Pestañas para navegar entre historiales -->
            <div class="history-tabs">
                <button class="tab-button active" data-tab="direcciones">Direcciones</button>
                <button class="tab-button" data-tab="gerentes">Gerentes</button>
            </div>
    
            <!-- Contenedor de Direcciones -->
            <div class="tab-content active" id="direccionesTab">
                <div class="modal-header">
                    <button id="addAddressButton" class="add-address-btn">
                        <i class="bi bi-plus-circle"></i> Agregar Dirección
                    </button>
                </div>
                <div class="addresses-container" id="addressesContainer">
                    <div class="loading-message">Cargando direcciones...</div>
                </div>
            </div>
    
            <!-- Contenedor de Gerentes -->
            <div class="tab-content" id="gerentesTab">
                <div class="modal-header">
                    <button id="addManagerButton" class="add-manager-btn">
                        <i class="bi bi-plus-circle"></i> Agregar Gerente
                    </button>
                </div>
                <div class="managers-container" id="managersContainer">
                    <div class="loading-message">Cargando gerentes...</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal para Agregar/Editar Gerente -->
    <div id="myModalManager" class="myModalManager">
        <div class="modal-content">
            <span class="close" id="closeModalManager">&times;</span>
            <h2 id="managerModalTitle">Agregar Gerente</h2>
            
            <form id="managerForm" class="modal-form-manager">
                <input type="hidden" id="managerId" name="id">
                <input type="hidden" id="managerClientId" name="id_cliente">
                
                <div class="form-modal">
                    <label for="gerente">Nombre del Gerente</label>
                    <input type="text" id="gerente" name="gerente" placeholder="Nombre completo del gerente" required>
                </div>
                
                <div class="form-modal">
                    <label for="dni">DNI del Gerente</label>
                    <input type="number" id="dni" name="dni" placeholder="DNI del Gerente">
                </div>

                <div class="form-modal">
                    <label for="fecha_inicio_gerente">Fecha de Inicio</label>
                    <input type="date" id="fecha_inicio_gerente" name="fecha_inicio" required>
                </div>
                
                <div class="form-modal">
                    <label for="fecha_fin_gerente">Fecha de Fin (Opcional)</label>
                    <input type="date" id="fecha_fin_gerente" name="fecha_fin">
                </div>
                
                <div class="modal-button">
                    <button type="submit" class="accept-modal">Guardar</button>
                </div>
            </form>
        </div>
    </div>
    <script src="../script/modals/clients-management.js"></script>
</body>

</html>