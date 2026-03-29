document.addEventListener('DOMContentLoaded', function () {

    // ── Mapeos ──────────────────────────────────────────────────────────────
    const tipoMap = {
        1: "Esquela",
        2: "Fiscalización Parcial-IGV",
        3: "Fiscalización Total-IGV",
        4: "Fiscalización Parcial-RENTA",
        5: "Fiscalización Total-RENTA",
        6: "Cruce de Información"
    };

    const estadoMap = {
        1: "Notificado",
        2: "Presentado",
        3: "Prórroga",
        4: "Anulado",
        5: "Eliminado",
        6: "No presentado"
    };

    const estadoBadge = {
        1: "badge-notificado",
        2: "badge-presentado",
        3: "badge-prorroga",
        4: "badge-anulado",
        6: "badge-nopresentado"
    };

    const etapaMap = {
        1:  "1er Requerimiento",
        2:  "2do Requerimiento",
        3:  "3ro Requerimiento",
        4:  "4to Requerimiento",
        5:  "Cierre/Valores",
        6:  "R. Reclamación",
        7:  "R. Apelación",
        8:  "Proceso Contencioso",
        10: "Finalizado",
        11: "5to Requerimiento",
        12: "6to Requerimiento",
        13: "7mo Requerimiento",
        14: "Coactiva x R.",
        15: "Coactiva x T.F.",
        16: "Coactiva sin R."
    };

    // ── Estado ───────────────────────────────────────────────────────────────
    let allCases      = [];
    let filteredCases = [];
    let currentPage   = 1;
    const itemsPerPage = 20;
    let sortCol = null;
    let sortDir = 'asc';
    let filterTimeout;

    // ── Referencias DOM ──────────────────────────────────────────────────────
    const tbody          = document.getElementById('casosBody');
    const pagination     = document.getElementById('pagination');
    const counter        = document.getElementById('resultsCounter');
    const filterRUC          = document.getElementById('filterRUC');
    const filterRazonSocial  = document.getElementById('filterRazonSocial');
    const filterNumero       = document.getElementById('filterNumero');
    const filterTipo         = document.getElementById('filterTipo');
    const filterEtapa        = document.getElementById('filterEtapa');
    const filterEstado       = document.getElementById('filterEstado');
    const filterPeriodo      = document.getElementById('filterPeriodo');
    const filterPropietario  = document.getElementById('filterPropietario');
    const btnClear           = document.getElementById('btnClear');
    const btnExportCSV       = document.getElementById('btnExportCSV');

    // ── Carga de datos ───────────────────────────────────────────────────────
    async function loadCases() {
        try {
            const response = await fetch('../app/tabla/get_cases_table.php');
            const data     = await response.json();

            if (!data.success) throw new Error(data.message || 'Error al cargar');

            allCases      = data.data;
            filteredCases = [...allCases];

            populatePeriodoSelect();
            applyFilters();

        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="11" class="no-results">
                <i class="bi bi-exclamation-triangle"></i> Error al cargar: ${err.message}
            </td></tr>`;
        }
    }

    // ── Poblar select de periodos ─────────────────────────────────────────────
    function populatePeriodoSelect(contextCases = null) {
        const source = contextCases ?? allCases;
        const selected = filterPeriodo.value;

        const rangosSet = new Set();
        source.forEach(c => {
            if (c.periodo_inicio && c.periodo_final)
                rangosSet.add(c.periodo_inicio + '|' + c.periodo_final);
        });

        const sortPeriodo = (a, b) => {
            const toNum = p => parseInt(p.slice(2) + p.slice(0, 2));
            return toNum(a.split('|')[0]) - toNum(b.split('|')[0]);
        };

        const rangos = [...rangosSet].sort(sortPeriodo);
        const fmt    = p => (p && p.length === 6) ? `${p.slice(0, 2)}/${p.slice(2)}` : (p || '—');

        filterPeriodo.innerHTML = '<option value="">Todos los periodos</option>';
        rangos.forEach(rango => {
            const [ini, fin] = rango.split('|');
            const opt = document.createElement('option');
            opt.value       = rango;
            opt.textContent = ini === fin ? fmt(ini) : `${fmt(ini)} — ${fmt(fin)}`;
            if (rango === selected) opt.selected = true;
            filterPeriodo.appendChild(opt);
        });
    }

    // ── Filtrado ─────────────────────────────────────────────────────────────
    function scheduleFilter() {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(applyFilters, 250);
    }

    function applyFilters() {
        const ruc        = filterRUC.value.toLowerCase();
        const razon      = filterRazonSocial.value.toLowerCase();
        const numero     = filterNumero.value.toLowerCase();
        const tipo       = filterTipo.value;
        const etapa      = filterEtapa.value;
        const estado     = filterEstado.value;
        const periodo    = filterPeriodo.value;
        const propietario = filterPropietario.value.toLowerCase();

        // Primero filtrar sin el periodo para actualizar las opciones disponibles
        const sinPeriodo = allCases.filter(c =>
            (!ruc       || (c.RUC         || '').toLowerCase().includes(ruc))   &&
            (!razon     || (c.razon_social || '').toLowerCase().includes(razon)) &&
            (!numero    || (c.numero       || '').toLowerCase().includes(numero))&&
            (!tipo      || c.id_tipo  == tipo)  &&
            (!etapa     || c.id_etapa == etapa) &&
            (!estado    || c.id_estado== estado) &&
            (!propietario || (c.propietario || '').toLowerCase().includes(propietario))
        );
        populatePeriodoSelect(sinPeriodo);

        // Filtro completo incluyendo periodo
        filteredCases = sinPeriodo.filter(c =>
            !periodo || (c.periodo_inicio + '|' + c.periodo_final) === periodo
        );

        // Aplicar ordenación actual
        if (sortCol) sortData();

        currentPage = 1;
        renderTable();
        renderPagination();
        updateCounter();
    }

    // ── Ordenación ────────────────────────────────────────────────────────────
    function sortData() {
        filteredCases.sort((a, b) => {
            let va = a[sortCol] ?? '';
            let vb = b[sortCol] ?? '';

            // Numérico para IGV
            if (sortCol === 'IGV') {
                va = parseFloat(va) || 0;
                vb = parseFloat(vb) || 0;
                return sortDir === 'asc' ? va - vb : vb - va;
            }

            // Periodo MMYYYY
            if (sortCol === 'periodo_inicio' || sortCol === 'periodo_final') {
                const toNum = p => p.length === 6 ? parseInt(p.slice(2) + p.slice(0, 2)) : 0;
                return sortDir === 'asc' ? toNum(va) - toNum(vb) : toNum(vb) - toNum(va);
            }

            va = String(va).toLowerCase();
            vb = String(vb).toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 :  1;
            if (va > vb) return sortDir === 'asc' ?  1 : -1;
            return 0;
        });
    }

    // ── Render tabla ──────────────────────────────────────────────────────────
    function renderTable() {
        const start = (currentPage - 1) * itemsPerPage;
        const slice = filteredCases.slice(start, start + itemsPerPage);

        if (slice.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" class="no-results">
                <i class="bi bi-search"></i> No se encontraron casos
            </td></tr>`;
            return;
        }

        const fmt = p => (p && p.length === 6) ? `${p.slice(0, 2)}/${p.slice(2)}` : (p || '—');

        tbody.innerHTML = slice.map(c => {
            const badgeClass = estadoBadge[c.id_estado] || '';
            const estadoLabel = estadoMap[c.id_estado] || '—';
            const igv = c.IGV ? 'S/ ' + parseFloat(c.IGV).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '—';
            const fecha = formatDate(c.fecha_notificacion);

            return `<tr>
                <td>${c.RUC || '—'}</td>
                <td>${c.razon_social || '—'}</td>
                <td>${c.numero || '—'}</td>
                <td>${tipoMap[c.id_tipo] || '—'}</td>
                <td>${etapaMap[c.id_etapa] || '—'}</td>
                <td><span class="badge ${badgeClass}">${estadoLabel}</span></td>
                <td>${fmt(c.periodo_inicio)}</td>
                <td>${fmt(c.periodo_final)}</td>
                <td>${fecha || '—'}</td>
                <td>${igv}</td>
                <td>${c.propietario || '—'}</td>
            </tr>`;
        }).join('');
    }

    // ── Paginación ────────────────────────────────────────────────────────────
    function renderPagination() {
        const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
        pagination.innerHTML = '';
        if (totalPages <= 1) return;

        const addBtn = (label, page, active = false, disabled = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = label;
            if (active)   btn.classList.add('active');
            if (disabled) btn.disabled = true;
            btn.addEventListener('click', () => {
                if (disabled) return;
                currentPage = page;
                renderTable();
                renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            pagination.appendChild(btn);
        };

        const addEllipsis = () => {
            const span = document.createElement('span');
            span.textContent = '…';
            span.style.cssText = 'padding:6px 4px;color:#999;align-self:center;';
            pagination.appendChild(span);
        };

        // Anterior
        addBtn('&laquo;', currentPage - 1, false, currentPage === 1);

        // Siempre mostrar primera página
        addBtn(1, 1, currentPage === 1);

        // Elipsis izquierda
        if (currentPage > 4) addEllipsis();

        // Páginas del medio (alrededor de la actual)
        const start = Math.max(2, currentPage - 2);
        const end   = Math.min(totalPages - 1, currentPage + 2);
        for (let i = start; i <= end; i++) {
            addBtn(i, i, i === currentPage);
        }

        // Elipsis derecha
        if (currentPage < totalPages - 3) addEllipsis();

        // Siempre mostrar última página (si hay más de 1)
        if (totalPages > 1) addBtn(totalPages, totalPages, currentPage === totalPages);

        // Siguiente
        addBtn('&raquo;', currentPage + 1, false, currentPage === totalPages);
    }

    // ── Contador ──────────────────────────────────────────────────────────────
    function updateCounter() {
        counter.textContent = `Mostrando ${filteredCases.length} de ${allCases.length} casos`;
    }

    // ── Formato fecha ─────────────────────────────────────────────────────────
    function formatDate(dateStr) {
        if (!dateStr) return null;
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-PE', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    // ── Ordenar por columna ───────────────────────────────────────────────────
    document.querySelectorAll('#casosTable thead th').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (!col) return;

            // Resetear íconos
            document.querySelectorAll('#casosTable thead th .sort-icon').forEach(ic => {
                ic.className = 'sort-icon bi bi-chevron-expand';
            });

            if (sortCol === col) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortCol = col;
                sortDir = 'asc';
            }

            const icon = th.querySelector('.sort-icon');
            icon.className = `sort-icon bi bi-chevron-${sortDir === 'asc' ? 'up' : 'down'}`;

            sortData();
            renderTable();
            renderPagination();
        });
    });

    // ── Exportar CSV ──────────────────────────────────────────────────────────
    btnExportCSV.addEventListener('click', () => {
        const fmt  = p => (p && p.length === 6) ? `${p.slice(0, 2)}/${p.slice(2)}` : (p || '');
        const esc  = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

        const headers = ['RUC','Razón Social','N° Doc','Tipo','Etapa','Estado',
                         'Periodo Inicio','Periodo Fin','Fecha Notificación','Importe','Propietario'];

        const rows = filteredCases.map(c => [
            c.RUC || '',
            c.razon_social || '',
            c.numero || '',
            tipoMap[c.id_tipo] || '',
            etapaMap[c.id_etapa] || '',
            estadoMap[c.id_estado] || '',
            fmt(c.periodo_inicio),
            fmt(c.periodo_final),
            formatDate(c.fecha_notificacion) || '',
            c.IGV ? parseFloat(c.IGV).toFixed(2) : '',
            c.propietario || ''
        ].map(esc).join(','));

        const csv  = [headers.map(esc).join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `casos_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ── Limpiar filtros ───────────────────────────────────────────────────────
    btnClear.addEventListener('click', () => {
        filterRUC.value         = '';
        filterRazonSocial.value = '';
        filterNumero.value      = '';
        filterTipo.value        = '';
        filterEtapa.value       = '';
        filterEstado.value      = '';
        filterPeriodo.value     = '';
        filterPropietario.value = '';
        applyFilters();
    });

    // ── Event listeners de filtros ────────────────────────────────────────────
    [filterRUC, filterRazonSocial, filterNumero, filterPropietario].forEach(el =>
        el.addEventListener('input', scheduleFilter)
    );
    [filterTipo, filterEtapa, filterEstado, filterPeriodo].forEach(el =>
        el.addEventListener('change', applyFilters)
    );

    // ── Arrancar ──────────────────────────────────────────────────────────────
    loadCases();
});