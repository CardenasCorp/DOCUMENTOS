
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../style/modals/sidebar.css">
    <link rel="stylesheet" href="../style/modals/menu-container.css">
    <link rel="stylesheet" href="../style/quejas.css">
    <link rel="stylesheet" href="../style/modals/modal-complaint.css">
    <link rel="icon" href="../img/favicon.ico" >
    <title>Lista de documentos</title>
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
            <div class="content-complaint">

                <h1>Lista de casos</h1> 
                <div class="complaint-list">
                    <div class="search-business">
                        <input type="text" id="searchClientInput" placeholder="Buscar por nombre... "
                            class="search-input">
                        <input type="text" id="searchRUCInput" placeholder="Buscar por RUC... " class="search-input">
                    </div>
                    <div class="employee-container">
                        <h4>Lista de casos</h4>
                        <!-- Los casos se generan automaticamente -->
                    </div>
                </div>
                <div class="pagination" id="pagination">
                    <!-- Los botones de paginación se generarán dinámiacamente -->
                </div>
            </div>
        </div>
    </div>
    <div id="myModalComplaint" class="myModalComplaint">
        <div class="modal-content">
            <span class="close" id="closeModalEditBusiness">&times;</span>
            <h2>Gestión de Cliente</h2>
            <div id="listComplaint" class="listComplaint">
                <div class="complaint-item">
                    <div class="complaint-info">
                        <button>Agregrar    </button>
                        <table>
                            <tr>
                                <th>Numero</th>
                                <td>Descripcion</td>
                                <td>Editar</td>
                                <td>Eliminar</td>
                            </tr>
                            <tr>
                                <th>1</th>
                                <td>Queja por</td>
                                <td><button class="edit-complaint-btn"><i class="bi bi-pencil"></i></button></td>
                                <td><button class="delete-complaint-btn"><i class="bi bi-trash"></i></button></td>
                            </tr>
                            <tr>
                                <th>2</th>
                                <td>Queja por</td>
                                <td><button class="edit-complaint-btn"><i class="bi bi-pencil"></i></button></td>
                                <td><button class="delete-complaint-btn"><i class="bi bi-trash"></i></button></td>
                            </tr>
                        </table>

                    </div>
                    <div class="complaint-actions">
                        <button class="edit-complaint-btn"><i class="bi bi-pencil"></i> Editar</button>
                        <button class="delete-complaint-btn"><i class="bi bi-trash"></i> Eliminar</button>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
    <script src="../script/lista-casos.js"></script>
    <script src="../script/modals/modal-complaint.js"></script>
</body>         
</html>