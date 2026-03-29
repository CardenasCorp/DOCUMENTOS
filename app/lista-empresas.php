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
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="../style/modals/sidebar.css">
    <link rel="stylesheet" href="../style/modals/menu-container.css">
    <link rel="icon" href="../img/favicon.ico">
    <title>Lista de Empresas</title>
    <style>
        /* ── Sección principal ── */
        .content-empresas {
            max-width: 1300px;
            margin: 2rem auto;
            padding: 2rem;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            font-family: 'Segoe UI', system-ui, sans-serif;
        }

        .content-empresas h1 {
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
            min-width: 150px;
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
            min-width: 900px;
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
        thead th.no-sort { cursor: default; }
        thead th.no-sort:hover { background: #e69022; }

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
            padding: 9px 14px;
            color: #2c3e50;
            white-space: nowrap;
        }

        /* ── Celda editable ── */
        td.editable {
            cursor: pointer;
            position: relative;
        }

        td.editable:hover::after {
            content: '\F4CA';
            font-family: 'bootstrap-icons';
            font-size: 0.75rem;
            color: #e69022;
            margin-left: 6px;
            opacity: 0.8;
        }

        td.editable input,
        td.editable select {
            width: 100%;
            padding: 4px 8px;
            border: 2px solid #e69022;
            border-radius: 6px;
            font-size: 0.88rem;
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: #fffdf8;
            color: #2c3e50;
            outline: none;
            box-shadow: 0 0 0 3px rgba(230, 144, 34, 0.15);
        }

        /* ── Badges SI/NO ── */
        .badge-si  { display:inline-block; padding:3px 10px; border-radius:12px; font-size:0.78rem; font-weight:600; background:#d1f2eb; color:#0e6655; }
        .badge-no  { display:inline-block; padding:3px 10px; border-radius:12px; font-size:0.78rem; font-weight:600; background:#f2f3f4; color:#555; }

        /* ── Aviso cambios sin guardar ── */
        #unsavedBanner {
            display: none;
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 0.7rem 1.2rem;
            margin-bottom: 1rem;
            font-size: 0.88rem;
            color: #856404;
            align-items: center;
            gap: 0.6rem;
        }

        #unsavedBanner.visible {
            display: flex;
        }

        .btn-undo {
            padding: 0.4rem 0.9rem;
            background: #856404;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 0.82rem;
            cursor: pointer;
            transition: background 0.2s;
            margin-left: auto;
        }
        .btn-undo:hover { background: #5a4202; }

        .btn-save {
            padding: 0.4rem 0.9rem;
            background: #e69022;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 0.82rem;
            cursor: pointer;
            transition: background 0.2s;
            margin-left: auto;
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
        }
        .btn-save:hover { background: #d6821e; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Sin resultados ── */
        .no-results {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 0.95rem;
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
            background: #d6821e;
            color: #fff;
            border-color: #d6821e;
        }

        .pagination button:disabled {
            opacity: 0.35;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
            .content-empresas { padding: 1.2rem; margin: 1rem; }
            .filters-bar input, .filters-bar select { min-width: 100%; }
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

            <div class="content-empresas">
                <h1>Lista de Empresas</h1>

                <!-- Aviso cambios sin guardar -->
                <div id="unsavedBanner">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span>Tienes cambios sin guardar.</span>
                    <button class="btn-save" id="btnSave"><i class="bi bi-floppy2-fill"></i> Guardar cambios</button>
                    <button class="btn-undo" id="btnUndo"><i class="bi bi-arrow-counterclockwise"></i> Deshacer todo</button>
                </div>

                <!-- Filtros -->
                <div class="filters-bar">
                    <input type="text"  id="filterRUC"         placeholder="Buscar RUC...">
                    <input type="text"  id="filterRazon"       placeholder="Buscar razón social...">
                    <select id="filterEsquela">
                        <option value="">Esquela - Todos</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                    </select>
                    <select id="filterFiscalizacion">
                        <option value="">Fiscalización - Todos</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                    </select>
                    <select id="filterVigentes">
                        <option value="">Vigentes - Todos</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                    </select>
                    <button class="btn-clear" id="btnClear"><i class="bi bi-x-circle"></i> Limpiar</button>
                    <button class="btn-export" id="btnExport"><i class="bi bi-download"></i> Exportar CSV</button>
                </div>

                <div id="resultsCounter"></div>

                <!-- Tabla -->
                <div class="table-wrapper">
                    <table id="empresasTable">
                        <thead>
                            <tr>
                                <th data-col="ruc">RUC <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="razon_social">Razón Social <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="esquela">Esquela <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="fiscalizacion">Fiscalización <span class="sort-icon bi bi-chevron-expand"></span></th>
                                <th data-col="vigentes">Vigentes <span class="sort-icon bi bi-chevron-expand"></span></th>
                            </tr>
                        </thead>
                        <tbody id="empresasBody"></tbody>
                    </table>
                </div>

                <div class="pagination" id="pagination"></div>
            </div>
        </div>
    </div>

    <script src="../script/lista-empresas.js"></script>
</body>
</html>