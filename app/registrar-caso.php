<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <title>Formulario con Sidebar</title>
    <link rel="stylesheet" href="../style/modals/modal-request.css">
    <link rel="stylesheet" href="../style/registrar-caso.css">
    <link rel="stylesheet" href="../style/modals/modal-business.css">
    <link rel="stylesheet" href="../style/modals/sidebar.css">
    <link rel="stylesheet" href="../style/modals/menu-container.css">
    <link rel="stylesheet" href="../style/modals/select-employee.css">
    
</head>

<body>
    <div class="container">
        <!-- Sidebar -->
        <div class="sidebar">
            <h2><a href="">Menú Principal</a></h2>
            <hr>
            <ul>
                <li><a href="registrar-caso.php">Registrar</a></li>
                <li><a href="modificar-caso.php">Modificar</a></li>
                <li><a href="#">Eliminar</a></li>
                <hr>
                <li><a href="empleados.php">SUNAT</a></li>
                <hr>
                <li><a href="empresas.php">Empresa</a></li>
            </ul>
        </div>
        <!-- Formulario -->
        <div class="main-content">
            <div class="form-section">
                <a href="../index.php"><i class="bi bi-arrow-left-square-fill"
                        style="font-size: 24px; color: #2a5298;"></i></a>
                <hr>
                <br>
                <h1>Registrar caso</h1>
                <form class="form-container" id="mainForm">
                    <div class="form-group-1">
                        <div class="number form-control">
                            <label for="number">Número</label>
                            <input type="text" id="number" name="number" placeholder="Ingrese el número de caso" required>
                        </div>
                        <div class="requerimiento form-control-2">
                            <label for="requerimiento">Requerimiento</label>
                            <div class="input-container">
                                <input type="text" id="requerimiento" name="requerimiento"
                                    placeholder="Ingrese el requerimiento" required disabled>
                                <button type="button" class="search-request" id="openModalButtonRequest">
                                    <i class="bi bi-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group-2">
                        <div class="empresa form-control-2">
                            <label for="empresa">Empresa</label>
                            <div class="input-container">
                                <input type="text" id="empresa_input" name="empresa" class="form-control"
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
                    </div>
                    <div class="form-group-3">
                        <div class="fecha-notificacion form-control">
                            <label for="fecha-notificacion">Fecha notificación</label>
                            <input type="date" id="fecha-notificacion" name="fecha-notificacion" required>
                        </div>
                        <div class="fecha-presentar form-control">
                            <label for="fecha-presentar">Fecha a presentar</label>
                            <input type="date" id="fecha-presentar" name="fecha-presentar" required>
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
                                <option value="Cierre">Cierre</option>
                                <option value="Reclamación">Reclamación</option>
                                <option value="Apelación">Apelación</option>
                                <option value="Proceso">Proceso</option>
                                <option value="Contencioso">Contencioso</option>
                                <option value="Finalizado">Finalizado</option>
                            </select>
                        </div>
                        <div class="IGV form-control">
                            <label for="IGV">IGV</label>
                            <input type="number" id="IGV" name="IGV" placeholder="IGV" required>
                        </div>
                    </div>
                    <div class="form-group-5">
                        <div class="periodo-inicio form-control">
                            <label for="periodo-inicio">Periodo Inicio</label>
                            <input type="month" id="periodo-inicio" name="periodo-inicio" required>
                        </div>
                        <div class="periodo-fin form-control">
                            <label for="periodo-fin">Periodo Fin</label>
                            <input type="month" id="periodo-fin" name="periodo-fin" required>
                        </div>
                    </div>
                    <div class="form-group-6">
                        <div class="supervisor form-control-2">
                            <label for="supervisor">Supervisor</label>
                            <div class="input-container">
                                <input type="text" id="supervisor" name="supervisor" placeholder="Nombre del supervisor" required readonly>
                                <!-- Campo oculto para el ID del supervisor -->
                                <input type="hidden" id="supervisor_id" name="supervisor_id">
                                <button type="button" class="search-employee search"><i class="bi bi-search"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group-7">
                        <div class="verificador form-control-2" id="verificadores">
                            <label for="verificador">Verificadores</label>
                            <!-- Verificador 1 -->
                            <div class="verificador-container">
                                <div class="input-container">
                                    
                                    <button type="button" class="search plus" onclick="agregarVerificador()">Agregar<i
                                            class="bi bi-plus-lg"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="post">Enviar</button>
                </form>
            </div>
        </div>
    </div>
    
    <!-- Modal de Empresas -->
    <div id="myModalBusiness" class="myModalBusiness modal">
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
    <script src="../script/modals/modal-business.js"></script>
    <script src="../script/modals/modal-request.js"></script>
    <script src="../script/registrar-caso.js"></script>
    <script src="../script/modals/guardar-fiscalizacion.js"></script>
</body>

</html>