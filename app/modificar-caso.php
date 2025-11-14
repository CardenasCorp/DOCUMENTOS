    <?php
    require_once 'session_check.php';

    // Generar token CSRF para protección
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    $csrf_token = $_SESSION['csrf_token'];
    ?>

    <!DOCTYPE html>
    <html lang="es">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
        <title>Modificar caso</title>
        <link rel="stylesheet" href="../style/modals/modal-doc.css">
        <link rel="stylesheet" href="../style/modificar-caso.css">
        <link rel="stylesheet" href="../style/modals/modal-business.css">
        <link rel="stylesheet" href="../style/modals/sidebar.css">
        <link rel="stylesheet" href="../style/modals/menu-container.css">
        <link rel="stylesheet" href="../style/modals/select-employee.css">
        <link rel="icon" href="../img/favicon.ico" >
    </head>

    <body>
        <div class="container">
            <!-- Sidebar -->
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
            <!-- Formulario -->
            <div class="main-content">
                <div class="form-section">
                    <a href="../index.php"><i class="bi bi-arrow-left-square-fill"></i></a>
                        <hr>
                        <br>
                    <h1>Modificar Caso</h1>
                    <form class="form-container" id="mainForm" method="POST">
                        <!-- Token CSRF para protección -->
                        <input type="hidden" name="csrf_token" value="<?php echo $csrf_token; ?>">
                        <input type="hidden" id="fiscalizacion_id" name="fiscalizacion_id">
                        
                        <div class="form-group-2">
                            <div class="empresa form-control-2">
                                <label for="number"> Buscar documento</label>
                                <div class="input-container">
                                    <input type="text" id="number" name="number" placeholder="Número de documento"
                                        required disabled>
                                    <button type="button" class="search-request" id="openModalButtonDoc">
                                        <i class="bi bi-search"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="form-group-4">
                            <div class="form-control ">
                                <label for="tipo">Tipo</label>
                                <select id="tipo" name="tipo" required onchange="toggleSections()">
                                    <option value="esquela">Esquela</option>
                                    <option value="FP-IGV">Fiscalización Parcial - IGV</option>
                                    <option value="FT-IGV">Fiscalizacón Total - IGV</option>
                                    <option value="FP-RENTA">Fiscalización Parcial - Renta</option>
                                    <option value="FT-RENTA">Fiscalizacón Total - Renta</option>
                                    <option value="CRUCE">Cruce de información</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group-1">
                            <div class="empresa form-control-2">
                                <label for="empresa">Empresa</label>
                                <div class="input-container"> 
                                    <input type="text" id="empresa_input" name="empresa"
                                        placeholder="Ingrese la empresa" required disabled>
                                <button type="button" class="search-business" id="openModalButtonBusiness">
                                        <i class="bi bi-search"></i>
                                    </button>
                                </div>
                                <!-- Campos ocultos para almacenar toda la información de la empresa -->
                                <input type="hidden" id="empresa_id" name="empresa_id">
                                <input type="hidden" id="empresa_ruc" name="empresa_ruc">
                                <input type="hidden" id="empresa_direccion" name="empresa_direccion">
                                <input type="hidden" id="empresa_departamento" name="empresa_departamento">
                            </div>

                            <div class="requerimiento form-control">
                                <label for="requerimiento">Requerimiento Principal</label>
                                <div class="input-container">
                                    <input type="text" id="requerimiento" name="requerimiento"
                                        placeholder="Ingrese el requerimiento" required disabled>
                                    <input type="hidden" id="id_fiscalizacion_padre" name="id_fiscalizacion_padre">
                                </div>
                            </div>
                        </div>
                        <div id="cliente-section" class="hidden">
                            <div class="form-group-4">
                                <div class="empresa form-control">
                                    <label for="cliente">Cliente</label>
                                    <div class="input-container"> 
                                        <input type="text" id="cliente_input" name="cliente" placeholder="Ingrese el cliente" disabled>
                                        <button type="button" class="search-business" id="openModalButtonClient">
                                            <i class="bi bi-search"></i>
                                        </button>
                                    </div>
                                </div>
                            </div> 
                        </div>
                        <div class="form-group-4">
                            <div class="etapa form-control ">
                                <label for="etapa">Etapa</label>
                                <select id="etapa" name="etapa" required>
                                    <option value="1er Requerimiento">1er Requerimiento</option>
                                    <option value="2do Requerimiento">2do Requerimiento</option>
                                    <option value="3ro Requerimiento">3ro Requerimiento</option>
                                    <option value="4to Requerimiento">4to Requerimiento</option>
                                    <option value="5to Requerimiento">5to Requerimiento</option>
                                    <option value="6to Requerimiento">6to Requerimiento</option>
                                    <option value="7mo Requerimiento">7mo Requerimiento</option>
                                    <option value="Cierre">Cierre / Valores</option>
                                    <option value="Reclamación">R. Reclamación</option>
                                    <option value="Apelación">R. Apelación</option>
                                    <option value="Proceso">Proceso Contencioso</option>
                                    <option value="Finalizado">Finalizado</option>
                                </select>
                            </div>
                            <div class="IGV form-control">
                                <label for="IGV">IGV</label>
                                <input type="number" id="IGV" name="IGV" placeholder="IGV" step="0.01">
                            </div>
                        </div>  
                        <div class="form-group-3">
                            <div class="fecha-notificacion form-control">
                                <label for="fecha-notificacion">Fecha notificacion</label>
                                <input type="date" id="fecha-notificacion" name="fecha-notificacion"
                                    placeholder="Ingrese la empresa" required>
                            </div>
                            <div class="fecha-presentar form-control">
                                <label for="fecha-presentar">Fecha a presentar</label>
                                <input type="date" id="fecha-presentar" name="fecha-presentar" placeholder="fecha-presentar"
                                    required>
                            </div>
                        </div>
                        <div class="form-group-5">
                            <div class="periodo-inicio form-control">
                                <label for="periodo-inicio">Periodo Inicio</label>
                                <input type="month" id="periodo-inicio" name="periodo-inicio" placeholder="periodo-inicio"
                                    required>
                            </div>
                            <div class="periodo-fin form-control">
                                <label for="periodo-fin">Periodo Fin</label>
                                <input type="month" id="periodo-fin" name="periodo-fin" placeholder="periodo-fin" required>
                            </div>
                        </div>  
                        <div class="form-group-9">
                            <div class="fecha-presentado form-control">
                                <label for="fecha-presentado">Estado</label>
                                <select name="estado" id="estado-select" onchange="toggleFechaFields()">
                                    <option value="" selected>Escoge el estado</option>
                                    <option value="Prorroga">Nueva fecha</option>
                                    <option value="Presentado">Presentado</option>
                                    <option value="Anulado">Anulado</option>
                                    <option value="Anulado">No presentar   </option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group-8">
                            <div class="fecha-presentado form-control">
                                <label for="fecha-presentado">Fecha presentado</label>
                                <input type="date" id="fecha-presentado" name="fecha-presentado" disabled>
                            </div>
                            <div class="fecha-prórroga form-control">
                                <label for="fecha-prórroga">Nueva fecha</label>
                                <input type="date" id="fecha-prórroga" name="fecha-prórroga" disabled>
                            </div>
                        </div>
                        
                        <!-- Sección para Supervisor y Verificadores -->
                        <div id="supervisor-verificadores-section">
                            <div class="form-group-6">
                                <div class="supervisor form-control-2">
                                    <label for="supervisor">Supervisor</label>
                                    <div class="input-container">
                                        <input type="text" id="supervisor" name="supervisor" placeholder="Nombre del supervisor" readonly>
                                        <input type="hidden" id="supervisor_id" name="supervisor_id">
                                        <button type="button" class="search-employee search"><i class="bi bi-search"></i></button>
                                    </div>
                                </div>
                            </div>
                            <div class="form-group-7">
                                <div class="verificador form-control-2" id="verificadores">
                                    <label for="verificador">Verificadores</label>
                                    <div class="verificador-container">
                                        <!-- Aquí se agregarán dinámicamente los verificadores -->
                                    </div>
                                </div>
                                <div class="input-container">    
                                    <button type="button" class="plus" onclick="agregarVerificador()">Agregar</button>      
                                </div>
                            </div>
                        </div>
                        
                        <!-- Sección para Funcionarios (oculta inicialmente) -->
                        <div id="funcionarios-section" class="hidden">
                            <div class="form-group-8">
                                <div class="funcionarios form-control-2" id="funcionarios">
                                    <label for="funcionarios">Funcionarios</label>
                                    <div class="funcionarios-container">
                                        <!-- Aquí se agregarán dinámicamente los funcionarios -->
                                    </div>
                                </div>
                                <div class="input-container">    
                                    <button type="button" class="plus-funcionarios" onclick="agregarFuncionario()">Agregar Funcionario</button>      
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" class="post">Guardar Cambios</button>
                    </form>
                </div>
            </div>
        </div>
        <div id="myModalDoc" class="myModalDoc custom-modal">
            <div class="modal-content">
                <span class="close" id="closeModalDoc">&times;</span>
                <h2>Documentos</h2>
                <form class="modal-form-doc" id="searchDocForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="search-tipo">Numero de Doc</label>
                            <input type="text" id="search-numero" placeholder="Buscar por número...">
                        </div>
                        <div class="form-group">
                            <label for="search-referencia">Razon Social</label>
                            <input type="text" id="search-cliente" placeholder="Buscar por Razon Social...">
                        </div>
                    </div>
                </form> 
                <div class="table-container">
                    <table class="doc-table">
                        <thead>
                            <tr>
                                <th width="20%">Número</th>
                                <th width="40%">Cliente</th>
                                <th width="20%">Tipo</th>
                                <th width="15%">Periodo</th>
                                <th width="5%">Seleccionar</th>    
                            </tr>
                        </thead>
                        <tbody id="doc-table-body">
                            <!-- Las filas se llenarán dinámicamente con JavaScript de modal-doc.js -->
                        </tbody>
                    </table>
                </div>
                <div class="modal-button">
                    <button type="button" class="accept-modal" id="acceptDoc">Aceptar</button>
                </div>
            </div>
        </div>      
        <div id="myModalBusiness" class="myModalBusiness custom-modal">
            <div class="modal-content">
                <span class="close" id="closeModalBusiness">&times;</span>
                <h2>Empresa</h2>
                <form class="modal-form-request" id="searchForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="search-ruc">RUC</label>
                            <input type="text" id="search-ruc" name="ruc" placeholder="Ingrese número">
                        </div>
                        <div class="form-group">
                            <label for="search-razon-social">Razón Social</label>
                            <input type="text" id="search-razon-social" name="nombre" placeholder="Ingrese razón social">
                        </div>
                    </div>
                </form>
                <div class="table-container">
                    <table class="request-table">
                        <thead>
                            <tr>
                                <th width="20%">RUC</th>
                                <th width="30%">Razón Social</th>
                                <th width="30%">Dirección Fiscal</th>
                                <th width="15%">Departamento</th>
                                <th width="5%">Seleccionar</th>
                            </tr>
                        </thead>
                        <tbody id="business-table-body">
                            <!-- Las filas se llenarán dinámicamente con JavaScript -->
                        </tbody>
                    </table>
                </div>
                <div class="modal-button">
                    <button type="button" class="accept-modal" id="acceptBusiness">Aceptar</button>
                </div>
            </div>
        </div>
        
        <!-- Modal de empleados -->
        <div id="employeeModal" class="modal">
            <div class="modal-content">
                <span class="close" id="closeEmployeeModal">&times;</span>
                <h2>Seleccionar Empleado</h2>
                <div class="search-container" style="margin-bottom: 20px;">
                    <input type="text" id="employeeSearch" placeholder="Buscar por nombre..." style="width: 100%; padding: 10px;">
                </div>
                <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%;">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Seleccionar</th>
                            </tr>
                        </thead>
                        <tbody id="employeeTableBody"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="loading-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); z-index: 9999; justify-content: center; align-items: center;">
            <div style="text-align: center;">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid rgb(230, 144, 34); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                <p style="margin-top: 15px;">Cargando datos del caso...</p>
            </div>
        </div>
        <style>
            @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
            }
            
            .hidden {
                display: none;
            }
        </style>
        
        <script src="../script/modals/modal-business.js"></script>
        <script src="../script/modals/modal-doc.js"></script>
        <script src="../script/modificar.js"></script>
        <script src="../script/modals/group-9.js"></script>
        <script src="../script/modals/modficar-fiscalizacion.js"></script>  
        <script src="../script/modals/direct_load.js"></script>
        
        <!-- Script para mostrar/ocultar secciones -->
        <script>
        function toggleSections() {
                const tipoSelect = document.getElementById('tipo');
                const supervisorSection = document.getElementById('supervisor-verificadores-section');
                const funcionariosSection = document.getElementById('funcionarios-section');
                const clienteSection = document.getElementById('cliente-section');
                
                if (tipoSelect.value === 'CRUCE') {
                    supervisorSection.classList.add('hidden');
                    funcionariosSection.classList.remove('hidden');
                    clienteSection.classList.remove('hidden');
                } else {
                    supervisorSection.classList.remove('hidden');
                    funcionariosSection.classList.add('hidden');
                    clienteSection.classList.add('hidden');
                }
            }
            
            // Inicializar el estado al cargar la página
            document.addEventListener('DOMContentLoaded', function() {
                toggleSections();
                
                // Agregar event listener al select de tipo
                document.getElementById('tipo').addEventListener('change', toggleSections);
            });
            
            // Funciones globales para agregar verificadores y funcionarios
            function agregarVerificador() {
                // Esta función será implementada en select-employee.js
                console.log('Agregar verificador');
            }
            
            function agregarFuncionario() {
                // Esta función será implementada en select-employee.js
                console.log('Agregar funcionario');
            }
        </script>
    </body>

    </html>