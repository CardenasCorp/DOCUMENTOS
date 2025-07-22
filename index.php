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
    <link rel="stylesheet" href="./style/style.css">
    <link rel="stylesheet" href="./style/modals/navbar.css">
    <title>Document</title>
</head>

<body>
    <nav>
        <ul>
            <div>
            <li><a href="index.php"><img src="../img/logo2.png" alt=""></a></li>
            </div>
            <div>
            <li><a href="app/registrar-caso.php">Documentos</a></li>
            </div>
            <div>
            <li><a href="app/logout.php" class="close">Cerrar Sesion</a></li>
            </div>
        </ul>

    </nav>

    <div class="container">
        <div class="vencer">
            <div class="vencer-header">
                <h2>
                    Por vencer
                </h2>   
                <p>7</p>
            </div>
            <div>
                <table class="vencer-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Tipo</th>
                            <th>Etapa</th>
                            <th>Fecha a presentar</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Conta de Luz</td>
                            <td>15/10/2023</td>
                            <td>R$ 150,00</td>
                            <td>10/10/2023</td>
                            <td>Pago</td>
                        </tr>
                        <tr>
                            <td>Conta de Água</td>
                            <td>20/10/2023</td>
                            <td>R$ 80,00</td>
                            <td>15/10/2023</td>
                            <td>Pago</td>
                        </tr>
                        <tr>
                            <td>Internet</td>
                            <td>25/10/2023</td>
                            <td>R$ 120,00</td>
                            <td>20/10/2023</td>
                            <td>Pago</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="tables">
            <div class="reclamar">
                <div class="reclamar-header">
                    <h2>
                        Por reclamar
                    </h2>
                    <p>3</p>
                </div>
                <table class="reclamar-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Tipo</th>
                            <th>Fecha a presentar</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Conta de Luz</td>
                            <td>10/10/2023</td>
                            <td>R$ 150,00</td>
                            <td>Pago</td>
                        </tr>
                        <tr>
                            <td>Conta de Água</td>
                            <td>05/10/2023</td>
                            <td>R$ 80,00</td>
                            <td>Pago</td>
                        </tr>
                        <tr>
                            <td>Conta de Água</td>
                            <td>02/10/2023</td>
                            <td>R$ 80,00</td>
                            <td>Pago</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="apelar">
                <div class="apelar-header">
                    <h2>
                        Por apelar
                    </h2>
                    <p>3</p>
                </div>
                <table class="apelar-table">
                    <thead>
                        <tr>
                            <th>Nro</th>
                            <th>Tipo</th>
                            <th>Fecha a presentar</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Conta de Luz</td>
                            <td>01/10/2023</td>
                            <td>R$ 150,00</td>
                            <td>Pago</td>
                        </tr>
                        <tr>
                            <td>Conta de Água</td>
                            <td>02/10/2023</td>
                            <td>R$ 80,00</td>
                            <td>Pago</td>
                        </tr>
                        <tr>
                            <td>Conta de Água</td>
                            <td>02/10/2023</td>
                            <td>R$ 80,00</td>
                            <td>Pago</td>
                        </tr>
                    </tbody>
                </table>
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
                        <th>etapa</th>
                        <th>Estado</th>
                        <th>Fecha a presentar</th>
                        <th>IGV</th>
                        <th>SUNAT</th>
                        <th>Ver</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Conta de Luz</td>
                        <td>15/10/2023</td>
                        <td>R$ 150,00</td>
                    </tr>
                    <tr>
                        <td>Conta de Água</td>
                        <td>20/10/2023</td>
                        <td>R$ 80,00</td>
                    </tr>
                    <tr>
                        <td>Conta de Água</td>
                        <td>20/10/2023</td>
                        <td>R$ 80,00</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>

</html>