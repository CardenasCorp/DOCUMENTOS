<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <title>Formulario con Sidebar</title>
    <link rel="stylesheet" href="../style/modals/modal-doc.css">
    <link rel="stylesheet" href="../style/modificar-caso.css">
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
                <form class="form-container">
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
                                <option value="Cierre">Cierre</option>
                                <option value="Reclamación">Reclamación</option>
                                <option value="Apelación">Apelación</option>
                                <option value="Proceso">Proceso Contencioso</option>
                                <option value="Finalizado">Finalizado</option>
                            </select>
                        </div>
                        <div class="IGV form-control">
                            <label for="IGV">IGV</label>
                            <input type="number" id="IGV" name="IGV" placeholder="IGV" required>
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
                                <option value="" disabled selected>Escoge el estado</option>
                                <option value="Prorroga">Prórroga</option>
                                <option value="Presentado">Presentado</option>
                                <option value="Presentado">Anulado</option>
                            </select>
                        </div>
                        <div class="">

                        </div>
                    </div>
                    <div class="form-group-8">
                        <div class="fecha-presentado form-control">
                            <label for="fecha-presentado">Fecha presentado</label>
                            <input type="date" id="fecha-presentado" name="fecha-presentado" disabled>
                        </div>
                        <div class="fecha-prórroga form-control">
                            <label for="fecha-prórroga">Fecha de prórroga</label>
                            <input type="date" id="fecha-prórroga" name="fecha-prórroga" disabled>
                        </div>
                    </div>
                    <div class="form-group-6">
                        <div class="supervisor form-control-2">
                            <label for="supervisor">Supervisor</label>
                            <div class="input-container">
                                <input type="text" id="supervisor" name="supervisor" placeholder="Nombre del supervisor" required readonly>
                                <input type="hidden" id="supervisor_id" name="supervisor_id">
                                <button type="button" class="search"><i class="bi bi-search"></i></button>
                            </div>
                        </div>
                    </div>
                        <div class="form-group-7">
                            <div class="verificador form-control-2" id="verificadores">
                                <label for="verificador">Verificadores</label>
                                <!-- Verificador 1 -->
                                <div class="verificador-container">
                                    <div class="input-container">

                                    </div>
                                </div>
                            </div>
                        </div>
                    <button type="submit" class="post">Enviar</button>
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
                        <label for="search-tipo">Tipo</label>
                        <input type="text" id="search-tipo" name="tipo" placeholder="Ingrese tipo">
                    </div>
                    <div class="form-group">
                        <label for="search-referencia">Referencia</label>
                        <input type="text" id="search-referencia" name="referencia" placeholder="Ingrese referencia">
                    </div>
                </div>
            </form>
            <div class="table-container">
                <table class="doc-table">
                    <thead>
                        <tr>
                            <th width="20%">Número</th>
                            <th width="40%">Cliente</th>
                            <th width="30%">Periodo</th>
                            <th width="10%">Seleccionar</th>    
                        </tr>
                    </thead>
                    <tbody id="doc-table-body">
                        <!-- Las filas se llenarán dinámicamente con JavaScript -->
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
    <script src="../script/modals/modal-business.js"></script>
    <script src="../script/modals/modal-doc.js"></script>
    <script src="../script/modificar.js"></script>
    <script src="../script/modals/group-9.js"></script>
    <script src="../script/modals/modficar-fiscalizacion.js"></script>  
</body>

</html> 