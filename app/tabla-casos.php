<?php
require_once 'session_check.php';
?>
<?php if (isset($_SESSION['departamento']) && in_array($_SESSION['departamento'], ['OPERACIONES', 'CONSULTING'])): ?>
<style>
    .sidebar ul li:nth-child(1), /* Registrar */
    .sidebar ul li:nth-child(2), /* Modificar */
    .sidebar ul li:nth-child(3), /* Lista de casos */
    .sidebar ul li:nth-child(6), /* SUNAT */
    .sidebar hr:nth-of-type(2),  /* HR antes de SUNAT */
    .sidebar hr:nth-of-type(3)   /* HR después de SUNAT */
    {
        display: none;
    }
</style>
<?php endif; ?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../style/modals/sidebar.css">
    <link rel="stylesheet" href="../style/modals/menu-container.css">
    <link rel="icon" href="../img/favicon.ico">
    <title>Tabla de casos</title>
    <link rel="stylesheet" href="../style/quejas.css">
    <style>
        /* ── Sección principal ── */
        .content-table {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 2rem;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .content-table h1 {
            color: #2c3e50;
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid #e69022;
        }

        /* ── Barra de filtros ── */
        .filters-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.8rem;
            margin-bottom: 1rem;
            align-items: center;
        }

        .filters-bar input,
        .filters-bar select {
            padding: 0.8rem 1rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 0.9rem;
            background-color: #f9f9f9;
            color: #2c3e50;
            min-width: 160px;
            transition: all 0.3s ease;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 0.8rem center;
            background-size: 1em;
        }

        .filters-bar input {
            background-image: none;
        }

        .filters-bar input:focus,
        .filters-bar select:focus {
            outline: none;
            border-color: #e69022;
            box-shadow: 0 0 0 3px rgba(230, 144, 34, 0.2);
            background-color: #fff;
        }

        /* ── Botones ── */
        .btn-clear {
            padding: 0.8rem 1.2rem;
            background-color: #e74c3c;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            transition: all 0.3s;
            white-space: nowrap;
        }
        .btn-clear:hover {
            background-color: #c0392b;
            transform: translateY(-2px);
            box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
        }

        .btn-export {
            padding: 0.8rem 1.2rem;
            background-color: #e69022;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            transition: all 0.3s;
            white-space: nowrap;
            margin-left: auto;
        }
        .btn-export:hover {
            background-color: #d6821e;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(230, 144, 34, 0.3);
        }

        /* ── Contador ── */
        #resultsCounter {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 0.8rem;
            font-weight: 500;
        }

        /* ── Tabla ── */
        .table-wrapper {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.88rem;
            min-width: 1000px;
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        thead tr {
            background: #e69022;
            color: #fff;
        }

        thead th {
            padding: 12px 14px;
            text-align: left;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
            user-select: none;
            transition: background 0.2s;
        }

        thead th:hover { background: #d6821e; }

        thead th .sort-icon {
            font-size: 0.72rem;
            margin-left: 5px;
            opacity: 0.75;
        }

        tbody tr {
            border-bottom: 1px solid #f0f0f0;
            transition: background 0.15s;
        }

        tbody tr:hover { background: #fff8f0; }
        tbody tr:last-child { border-bottom: none; }

        tbody td {
            padding: 10px 14px;
            color: #2c3e50;
            white-space: nowrap;
        }

        /* ── Badges de estado ── */
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.78rem;
            font-weight: 600;
        }
        .badge-notificado   { background: #fef3cd; color: #856404; }
        .badge-presentado   { background: #d1f2eb; color: #0e6655; }
        .badge-prorroga     { background: #d6eaf8; color: #1a5276; }
        .badge-anulado      { background: #fadbd8; color: #922b21; }
        .badge-nopresentado { background: #f2f3f4; color: #555;    }

        /* ── Sin resultados / Loading ── */
        .no-results {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 0.95rem;
        }

        #loading-overlay {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        #loading-overlay i {
            font-size: 2rem;
            animation: spin 1s linear infinite;
            display: block;
            margin-bottom: 10px;
            color: #e69022;
        }
        @keyframes spin {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* ── Paginación ── */
        .pagination {
            display: flex;
            gap: 6px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 1.2rem;
        }

        .pagination button {
            padding: 6px 13px;
            border: 1px solid #ddd;
            background: #fff;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.85rem;
            color: #2c3e50;
            transition: all 0.2s;
        }
        .pagination button:hover {
            background-color: #e69022;
            color: #fff;
            border-color: #e69022;
            transform: translateY(-1px);
        }
        .pagination button.active {
            background: #2c3e50;
            color: #fff;
            border-color: #2c3e50;
        }

        .pagination button:disabled {
            opacity: 0.35;
            cursor: not-allowed;
            transform: none;
            background: #fff;
            color: #2c3e50;
            border-color: #ddd;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
            .content-table { padding: 1.2rem; margin: 1rem; }
            .filters-bar input,
            .filters-bar select { min-width: 100%; }
            .btn-export { margin-left: 0; }
        }
    </style>
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
                <li><a href="tabla-casos.php"><i class="bi bi-table"></i> <span>Coactiva</span></a></li>
                <li><a href="lista-empresas.php"><i class="bi bi-building-check"></i> <span>Lista de Empresas (Coactivas)</span></a></li>
                <hr>
                <li><a href="empleados.php"><i class="bi bi-building"></i> <span>SUNAT</span></a></li>
                <hr>
                <li><a href="empresas.php"><i class="bi bi-briefcase"></i> <span>Empresa</span></a></li>
            </ul>
        </div>

        <!-- Contenido principal -->
        <div class="main-content">
            <a href="../index.php"><i class="bi bi-arrow-left-square-fill"></i></a>
            <hr><br>

            <div class="content-table">
                <h1>Tabla de casos — Coactiva</h1>

                <!-- Filtros -->
                <div class="filters-bar">
                    <input type="text" id="filterRUC"          placeholder="Buscar RUC...">
                    <input type="text" id="filterRazonSocial"  placeholder="Buscar razón social...">
                    <input type="text" id="filterNumero"       placeholder="Buscar N° doc...">
                    <select id="filterTipo">
                        <option value="">Todos los tipos</option>
                        <option value="1">Esquela</option>
                        <option value="2">Fiscalización Parcial-IGV</option>
                        <option value="3">Fiscalización Total-IGV</option>
                        <option value="4">Fiscalización Parcial-RENTA</option>
                        <option value="5">Fiscalización Total-RENTA</option>
                        <option value="6">Cruce de información</option>
                    </select>
                    <select id="filterEtapa">
                        <option value="">Todas las etapas</option>
                        <option value="16">Coactiva sin R.</option>
                        <option value="14">Coactiva x R.</option>
                        <option value="15">Coactiva x T.F.</option>
                    </select>
                    <select id="filterEstado">
                        <option value="">Todos los estados</option>
                        <option value="1">Notificado</option>
                        <option value="2">Presentado</option>
                        <option value="3">Prórroga</option>
                        <option value="4">Anulado</option>
                        <option value="6">No presentado</option>
                    </select>
                    <select id="filterPeriodo">
                        <option value="">Todos los periodos</option>
                        <!-- Se pobla dinámicamente -->
                    </select>
                    <input type="text" id="filterPropietario" placeholder="Buscar propietario...">
                    <button class="btn-clear" id="btnClear"><i class="bi bi-x-circle"></i> Limpiar</button>
                    <button class="btn-export" id="btnExportCSV"><i class="bi bi-download"></i> Exportar CSV</button>
                </div>

                <div id="resultsCounter"></div>

                <!-- Tabla -->
                <div class="table-wrapper">
                    <table id="casosTable">
                        <thead>
                            <tr>
                                <th data-col="RUC">RUC <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="razon_social">Razón Social <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="numero">N° Doc <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="id_tipo">Tipo <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="id_etapa">Etapa <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="id_estado">Estado <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="periodo_inicio">Periodo Inicio <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="periodo_final">Periodo Fin <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="fecha_notificacion">Fecha Notif. <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="IGV">Importe <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="propietario">Propietario <span class="sort-icon bi bi-chevron-expand"></span></th>
                            </tr>
                        </thead>
                        <tbody id="casosBody">
                            <tr>
                                <td colspan="11">
                                    <div id="loading-overlay">
                                        <i class="bi bi-arrow-repeat"></i>
                                        Cargando casos...
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="pagination"></div>
            </div>
        </div>
    </div>

    <script src="../script/tabla-casos.js"></script>
</body>
</html>