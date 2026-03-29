document.addEventListener('DOMContentLoaded', function () {

    // ── Cargar datos desde JSON del servidor (o usar embebidos como fallback) ─
    async function fetchData() {
        try {
            const res = await fetch('empresas-data.json?t=' + Date.now());
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json) && json.length > 0) return json;
            }
        } catch (e) { /* si no existe el JSON, usar datos embebidos */ }
        return null;
    }

    // ── DATOS ORIGINALES DEL EXCEL (embebidos, sin base de datos) ────────────
    const ORIGINAL_DATA = [{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20477561030","razon_social":"CONSTRUCTORA ROCARSA SAC","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20611376350","razon_social":"GRUPO FERROCONS E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20614166640","razon_social":"INDUSTRIAL BUSINESS GROUP E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20614159830","razon_social":"INDUSTRIALES PRO S.A.C","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20609969530","razon_social":"JCAR RACING STORE S.A.C.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20609993970","razon_social":"LEON & MELLIZOS E.I.R.L.","esquela":"SI","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20615138470","razon_social":"NEXFERRE E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20611280620","razon_social":"PIEDRA AZUL DISTRIBUIDORA E.I.R.L.","esquela":"SI","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20614691060","razon_social":"PLANET SOLUTIONS S.A.C","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20610283790","razon_social":"RGL CORPORACION E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"0","persona":"JURIDICA","ruc":"20614666260","razon_social":"TITANIUM SERVICIOS INTEGRALES S.A.C","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20614165821","razon_social":"ALIANZA MULTISERVICIOS E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20614064251","razon_social":"COMPANY TOTAL SERVICES E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20608891391","razon_social":"CONTRATISTAS GENERALES SUNSHINE E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20607861171","razon_social":"CORPORACION CANTERA 588 EIRL","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20611249501","razon_social":"CORPORACION CGL E.I.R.L.","esquela":"SI","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20606860081","razon_social":"CORPORATIVO SALUD Y VIDA E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20606929481","razon_social":"EMPRESA DE TRANSPORTES Y SERVICIOS ELIZABETH E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20609620731","razon_social":"GRUPO DISMAF E.I.R.L.","esquela":"SI","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20615303471","razon_social":"SERVICIOS FERRO GOLD E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20615123511","razon_social":"GRUPO FAMEX PERU E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20608219961","razon_social":"GRUPO LINOR S.A.C","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20611306441","razon_social":"INDUALE S.A.C.","esquela":"SI","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20611312041","razon_social":"INVERSIONES DEL NORTE YM E.I.R.L.","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20608258141","razon_social":"INVERSIONES NUEVO MONTE S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20606708581","razon_social":"INVERSIONES OREMSA S.A.C","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20608409891","razon_social":"INVERSIONES Y SERVICIOS MAZS E.I.R.L.","esquela":"SI","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20606493631","razon_social":"INVERSIONES Y SERVICIOS SHAZAM S.A.C.","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20608540131","razon_social":"J & L CONTRATISTAS E.I.R.L.","esquela":"SI","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20611731851","razon_social":"JJNC PROYECTOS E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"1","persona":"NATURAL","ruc":"10471105851","razon_social":"LAYZA MENDOZA ROYMER MELQUIADES","esquela":"NO","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20611286431","razon_social":"LEXINDUS E.I.R.L.","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20604327971","razon_social":"LIMA CONSTRUCTORES & CONSULTORES EIRL","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20611332361","razon_social":"LOMAZ INDUSTRIES S.A.C.","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20605506161","razon_social":"MULTISERVICE CORPORATION SAC","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20611316161","razon_social":"SERVICIOS GENERALES R & G EXPRESS E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20615123821","razon_social":"WORKZONE E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"2","persona":"JURIDICA","ruc":"20611276452","razon_social":"ALPHA CONTRATISTAS E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"2","persona":"JURIDICA","ruc":"20560141522","razon_social":"CONSTRUCTORA E INVERSIONES M&C JUNIOR'S S.A.C.","esquela":"SI","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"2","persona":"JURIDICA","ruc":"20611338652","razon_social":"INGENORT CONTRATISTAS E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"2","persona":"JURIDICA","ruc":"20614078562","razon_social":"INTEGRAGLOBAL COMPANY E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"2","persona":"JURIDICA","ruc":"20615285782","razon_social":"OPERACIONES COMEXA E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"2","persona":"JURIDICA","ruc":"20613292412","razon_social":"MULTISERVICIOS LGR E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"2","persona":"JURIDICA","ruc":"20608503782","razon_social":"REVOLUTION PUNTO NORTE S.A.C","esquela":"NO","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"3","persona":"JURIDICA","ruc":"20613154133","razon_social":"CORPORACION VISION GLOBAL EIRL","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"1","persona":"JURIDICA","ruc":"20614024381","razon_social":"GEONIX COMPANY E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"3","persona":"JURIDICA","ruc":"20609604523","razon_social":"INMOBILIARIA JC EL DESPERTAR DE MAÑANA S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"3","persona":"JURIDICA","ruc":"20607700843","razon_social":"INNOVUS PROJECT S.A.C","esquela":"SI","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"3","persona":"JURIDICA","ruc":"20560147563","razon_social":"LLAQTA PERU S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"3","persona":"JURIDICA","ruc":"20611339403","razon_social":"MULTISERVICIOS DINTEC E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"3","persona":"NATURAL","ruc":"10195385233","razon_social":"SANDOVAL ALVA RONALD ULISES","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"3","persona":"JURIDICA","ruc":"20611893303","razon_social":"SERVICIOS INTEGRALES D & G E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"3","persona":"JURIDICA","ruc":"20615121623","razon_social":"SOLUTECNIA E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"4","persona":"JURIDICA","ruc":"20611499354","razon_social":"C & A CALIDAD TOTAL E.I.R.L","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"4","persona":"JURIDICA","ruc":"20615133524","razon_social":"ELITEWORKS E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"4","persona":"JURIDICA","ruc":"20614050234","razon_social":"GENERALES PLUS E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"4","persona":"PERSONA","ruc":"10247944244","razon_social":"HUILLCA CCOLQQUE MACARIO","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"4","persona":"JURIDICA","ruc":"20608258184","razon_social":"INMOBILIARIA NUEVO PERU S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"4","persona":"JURIDICA","ruc":"20613371894","razon_social":"INTEGRADOS BUSINESS CORPORATION E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"4","persona":"JURIDICA","ruc":"20608377914","razon_social":"R & R INVENTA S.A.C.","esquela":"SI","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"4","persona":"JURIDICA","ruc":"20611287284","razon_social":"SOLUCIONES BANMAT E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20614042975","razon_social":"BUSINESS GENERAL MULTISERVICES E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20609620995","razon_social":"COMERCIALIZACION Y TRANSPORTES SANDOVAL EIRL","esquela":"SI","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20614148633","razon_social":"COMPANY INTEGRALES DEL NORTE S.A.C","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20611303875","razon_social":"DISTRIBUIDORA LHM E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20607913375","razon_social":"FR MAQUINARIAS E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20614166925","razon_social":"INVERSIONES GLOBAL 360 E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20614846845","razon_social":"INVERSIONES TRUPER E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20614151685","razon_social":"KAE CORPORACION S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20615118045","razon_social":"MAXTOOLS E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20611286075","razon_social":"NEO INDUSTRIES E.I.R.L","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20614125315","razon_social":"PRIME SERVICE EXPERTS E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20611271205","razon_social":"SERGELNORT E.I.R.L.","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20612531855","razon_social":"SIJA INDUSTRIES E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"5","persona":"JURIDICA","ruc":"20615144135","razon_social":"TOOLNOVA E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"6","persona":"NATURAL","ruc":"10446710066","razon_social":"CHIRINOS ASCOY RAMON ALEJANDRO","esquela":"NO","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"6","persona":"JURIDICA","ruc":"20604210306","razon_social":"CONTRATISTAS GENERALES LINOR EIRL","esquela":"NO","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"6","persona":"JURIDICA","ruc":"20611278056","razon_social":"CORPORACION MAFENOR E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"6","persona":"JURIDICA","ruc":"20615087506","razon_social":"IMPERIUM NOVEX E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"6","persona":"JURIDICA","ruc":"20606007176","razon_social":"MASTER POWER MULTISERVICE S.A.C","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"6","persona":"JURIDICA","ruc":"20615138186","razon_social":"MULTIFIX E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"6","persona":"JURIDICA","ruc":"20609104466","razon_social":"NESORIO E.I.R.L.","esquela":"SI","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"6","persona":"JURIDICA","ruc":"20608379186","razon_social":"SGC CORPORATION S.A.C.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"6","persona":"JURIDICA","ruc":"20610940596","razon_social":"SOCIEDAD MINERA DE RESPONSABILIDAD LIMITADA PERLA NEGRA 2021","esquela":"NO","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"7","persona":"JURIDICA","ruc":"20613170007","razon_social":"ATLANTIC SERVICIOS INTEGRADOS E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"7","persona":"NATURAL","ruc":"20614166305","razon_social":"BIZNEST GEN S.A.C","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"7","persona":"JURIDICA","ruc":"20604244537","razon_social":"CORPORACION CONSULTING CR EIRL","esquela":"NO","fiscalizacion":"SI","vigentes":"SI"},{"ultimo_digito":"7","persona":"JURIDICA","ruc":"20606517247","razon_social":"CORPORACION EMPRESARIAL CARDENAS S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"7","persona":"NATURAL","ruc":"20614169797","razon_social":"CORPORATION LOGISTICS AF E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"7","persona":"JURIDICA","ruc":"20606856637","razon_social":"ESTACION DE SERVICIOS MAURO S.A.C.","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"7","persona":"JURIDICA","ruc":"20615138127","razon_social":"GRANIFY E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"7","persona":"JURIDICA","ruc":"20610362347","razon_social":"INVERSIONES OMEGA DESING S.A.C","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"7","persona":"JURIDICA","ruc":"20605506187","razon_social":"POWER & ENERGY SERVICIOS GENERALES SAC","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"7","persona":"JURIDICA","ruc":"20614450747","razon_social":"TERRAMINA TRADING E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20606821248","razon_social":"CORPORACIÓN MEDICAL CENTER E.I.R.L.","esquela":"SI","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20613169688","razon_social":"DIGITAL SERVICES COMPANY E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20609627078","razon_social":"DISAGUI E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20614070898","razon_social":"GENERASERV E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20615308588","razon_social":"FORTEXA PERU E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20615274578","razon_social":"COMERCIAL NEXOLINK E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20608476688","razon_social":"GRUPO CASUVE S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20607450138","razon_social":"GRUPO GLAAL S.A.C.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20605955348","razon_social":"IMPULSE BUSSINES CORPORATION SAC","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20613291548","razon_social":"INVERSIONES BLUE DIAMOND E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20611889888","razon_social":"INVERSIONES Y SERVICIOS GENERALES ZETA E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20609597578","razon_social":"NEO ENTERPRISE E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20615133338","razon_social":"QALLARIPRO E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20611332158","razon_social":"SAFETY PROJECT E.I.R.L.","esquela":"SI","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"8","persona":"JURIDICA","ruc":"20613922408","razon_social":"VISION PULSE E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"9","persona":"JURIDICA","ruc":"20614100649","razon_social":"CORPORACION ROHOR E.I.R.L.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"9","persona":"JURIDICA","ruc":"20614164469","razon_social":"FABRIKON INDUSTRIAL S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"9","persona":"NATURAL","ruc":"20614166429","razon_social":"GRUPO MULTISERVICIOS JC S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"9","persona":"JURIDICA","ruc":"20615291529","razon_social":"PROVANTA E.I.R.L","esquela":"NO","fiscalizacion":"NO","vigentes":"SI"},{"ultimo_digito":"9","persona":"JURIDICA","ruc":"20610718729","razon_social":"INNOVUS CONTRATISTAS E.I.R.L.","esquela":"NO","fiscalizacion":"SI","vigentes":"NO"},{"ultimo_digito":"9","persona":"JURIDICA","ruc":"20608308319","razon_social":"INVERSIONES PERLA NEGRA S.A.C.","esquela":"NO","fiscalizacion":"NO","vigentes":"NO"},{"ultimo_digito":"9","persona":"JURIDICA","ruc":"20611286989","razon_social":"MPM DISTRIBUIDORA E.I.R.L.","esquela":"SI","fiscalizacion":"SI","vigentes":"SI"}];

    // ── Estado ────────────────────────────────────────────────────────────────
    // Copia de trabajo — las ediciones se aplican aquí, nunca al original
    let workingData   = ORIGINAL_DATA.map(r => ({ ...r }));
    let filteredData  = [...workingData];
    let hasChanges    = false;
    let currentPage   = 1;
    const itemsPerPage = 20;
    let sortCol = null;
    let sortDir = 'asc';
    let filterTimeout;

    // ── DOM ───────────────────────────────────────────────────────────────────
    const tbody          = document.getElementById('empresasBody');
    const pagination     = document.getElementById('pagination');
    const counter        = document.getElementById('resultsCounter');
    const unsavedBanner  = document.getElementById('unsavedBanner');
    const btnUndo        = document.getElementById('btnUndo');
    const btnClear       = document.getElementById('btnClear');
    const btnExport      = document.getElementById('btnExport');
    const filterRUC      = document.getElementById('filterRUC');
    const filterRazon    = document.getElementById('filterRazon');
    const filterEsquela  = document.getElementById('filterEsquela');
    const filterFisc     = document.getElementById('filterFiscalizacion');
    const filterVig      = document.getElementById('filterVigentes');

    // ── Badges ────────────────────────────────────────────────────────────────
    function badgeSiNo(val) {
        return val === 'SI'
            ? '<span class="badge-si">SI</span>'
            : '<span class="badge-no">NO</span>';
    }

    // ── Filtrado ──────────────────────────────────────────────────────────────
    function scheduleFilter() {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(applyFilters, 200);
    }

    function applyFilters() {
        const ruc     = filterRUC.value.toLowerCase();
        const razon   = filterRazon.value.toLowerCase();
        const esq     = filterEsquela.value;
        const fisc    = filterFisc.value;
        const vig     = filterVig.value;

        filteredData = workingData.filter(r =>
            (!ruc     || r.ruc.includes(ruc)) &&
            (!razon   || r.razon_social.toLowerCase().includes(razon)) &&
            (!esq     || r.esquela === esq) &&
            (!fisc    || r.fiscalizacion === fisc) &&
            (!vig     || r.vigentes === vig)
        );

        if (sortCol) applySortToFiltered();
        currentPage = 1;
        render();
    }

    // ── Ordenación ────────────────────────────────────────────────────────────
    function applySortToFiltered() {
        filteredData.sort((a, b) => {
            const va = String(a[sortCol] || '').toLowerCase();
            const vb = String(b[sortCol] || '').toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ?  1 : -1;
            return 0;
        });
    }

    document.querySelectorAll('#empresasTable thead th[data-col]').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            document.querySelectorAll('#empresasTable thead th .sort-icon').forEach(ic => {
                ic.className = 'sort-icon bi bi-chevron-expand';
            });
            sortDir = sortCol === col ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
            sortCol = col;
            th.querySelector('.sort-icon').className =
                `sort-icon bi bi-chevron-${sortDir === 'asc' ? 'up' : 'down'}`;
            applySortToFiltered();
            render();
        });
    });

    // ── Render tabla ──────────────────────────────────────────────────────────
    function render() {
        const start = (currentPage - 1) * itemsPerPage;
        const slice = filteredData.slice(start, start + itemsPerPage);

        counter.textContent = `Mostrando ${filteredData.length} de ${workingData.length} empresas`;

        if (slice.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="no-results">
                <i class="bi bi-search"></i> No se encontraron empresas
            </td></tr>`;
            renderPagination();
            return;
        }

        tbody.innerHTML = slice.map((r, i) => {
            const globalIdx = workingData.indexOf(r);
            return `<tr data-idx="${globalIdx}">
                <td>${r.ruc}</td>
                <td class="editable" data-field="razon_social">${r.razon_social}</td>
                <td class="editable" data-field="esquela">${badgeSiNo(r.esquela)}</td>
                <td class="editable" data-field="fiscalizacion">${badgeSiNo(r.fiscalizacion)}</td>
                <td class="editable" data-field="vigentes">${badgeSiNo(r.vigentes)}</td>
            </tr>`;
        }).join('');

        renderPagination();
        attachEditListeners();
    }

    // ── Edición inline ────────────────────────────────────────────────────────
    function attachEditListeners() {
        tbody.querySelectorAll('td.editable').forEach(td => {
            td.addEventListener('click', function () {
                if (this.querySelector('input, select')) return; // ya en edición
                startEdit(this);
            });
        });
    }

    function startEdit(td) {
        const field  = td.dataset.field;
        const tr     = td.closest('tr');
        const idx    = parseInt(tr.dataset.idx);
        const record = workingData[idx];
        const val    = record[field];

        let control;

        // Campos SI/NO → select
        if (['esquela', 'fiscalizacion', 'vigentes'].includes(field)) {
            control = document.createElement('select');
            ['SI', 'NO'].forEach(opt => {
                const o = document.createElement('option');
                o.value = opt; o.textContent = opt;
                if (opt === val) o.selected = true;
                control.appendChild(o);
            });
        }
        // Texto libre
        else {
            control = document.createElement('input');
            control.type  = 'text';
            control.value = val;
        }

        td.innerHTML = '';
        td.appendChild(control);
        control.focus();
        if (control.tagName === 'INPUT') control.select();

        function commitEdit() {
            const newVal = control.value.trim().toUpperCase() || val;
            if (newVal !== val) {
                workingData[idx][field] = newVal;
                hasChanges = true;
                unsavedBanner.classList.add('visible');
            }
            // Re-aplicar filtros y re-render para mostrar badges actualizados
            applyFilters();
        }

    // ── Guardar en JSON (servidor) ────────────────────────────────────────────
    async function saveToJSON() {
        const btnSave = document.getElementById('btnSave');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando…';

        try {
            const res = await fetch('guardar-empresas.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workingData)
            });

            const result = await res.json();

            if (result.ok) {
                hasChanges = false;
                unsavedBanner.classList.remove('visible');
                btnSave.innerHTML = '<i class="bi bi-check-circle-fill"></i> ¡Guardado!';
                btnSave.style.background = '#27ae60';
                setTimeout(() => {
                    btnSave.innerHTML = '<i class="bi bi-floppy2-fill"></i> Guardar cambios';
                    btnSave.style.background = '';
                    btnSave.disabled = false;
                }, 2500);
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (err) {
            alert('Error al guardar: ' + err.message);
            btnSave.innerHTML = '<i class="bi bi-floppy2-fill"></i> Guardar cambios';
            btnSave.disabled = false;
        }
    }

    document.getElementById('btnSave').addEventListener('click', () => {
        if (!hasChanges) return;
        saveToJSON();
    });

        control.addEventListener('blur', commitEdit);
        control.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); control.blur(); }
            if (e.key === 'Escape') {
                // Cancelar sin guardar
                td.innerHTML = renderCell(field, val);
            }
        });
    }

    function renderCell(field, val) {
        if (['esquela', 'fiscalizacion', 'vigentes'].includes(field)) return badgeSiNo(val);
        if (field === 'persona') return badgePersona(val);
        return val;
    }

    // ── Paginación ────────────────────────────────────────────────────────────
    function renderPagination() {
        const total = Math.ceil(filteredData.length / itemsPerPage);
        pagination.innerHTML = '';
        if (total <= 1) return;

        const add = (label, page, active = false, disabled = false) => {
            const btn = document.createElement('button');
            btn.innerHTML = label;
            if (active)   btn.classList.add('active');
            if (disabled) btn.disabled = true;
            btn.addEventListener('click', () => {
                if (disabled) return;
                currentPage = page;
                render();
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
        add('&laquo;', currentPage - 1, false, currentPage === 1);

        // Siempre primera página
        add(1, 1, currentPage === 1);

        // Elipsis izquierda
        if (currentPage > 4) addEllipsis();

        // Páginas del medio
        const start = Math.max(2, currentPage - 2);
        const end   = Math.min(total - 1, currentPage + 2);
        for (let i = start; i <= end; i++) {
            add(i, i, i === currentPage);
        }

        // Elipsis derecha
        if (currentPage < total - 3) addEllipsis();

        // Siempre última página
        if (total > 1) add(total, total, currentPage === total);

        // Siguiente
        add('&raquo;', currentPage + 1, false, currentPage === total);
    }

    // ── Deshacer todo ─────────────────────────────────────────────────────────
    btnUndo.addEventListener('click', () => {
        if (!confirm('¿Deshacer todos los cambios no guardados?')) return;
        workingData = ORIGINAL_DATA.map(r => ({ ...r }));
        hasChanges  = false;
        unsavedBanner.classList.remove('visible');
        applyFilters();
    });

    // ── Arrancar (carga datos desde JSON si existe, si no usa embebidos) ──────
    (async () => {
        const serverData = await fetchData();
        if (serverData) {
            workingData  = serverData;
            filteredData = [...workingData];
        }
        applyFilters();
    })();
    btnClear.addEventListener('click', () => {
        filterRUC.value = '';
        filterRazon.value = '';
        filterEsquela.value = '';
        filterFisc.value = '';
        filterVig.value = '';
        applyFilters();
    });

    // ── Exportar CSV (con cambios aplicados) ──────────────────────────────────
    btnExport.addEventListener('click', () => {
        const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const headers = ['RUC','Razón Social','Esquela','Fiscalización','Vigentes'];
        const rows = filteredData.map(r => [
            r.ruc, r.razon_social, r.esquela, r.fiscalizacion, r.vigentes
        ].map(esc).join(','));
        const csv  = [headers.map(esc).join(','), ...rows].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `lista_empresas_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ── Event listeners filtros ───────────────────────────────────────────────
    [filterRUC, filterRazon].forEach(el => el.addEventListener('input', scheduleFilter));
    [filterEsquela, filterFisc, filterVig].forEach(el =>
        el.addEventListener('change', applyFilters)
    );

    // ── Aviso al salir si hay cambios ─────────────────────────────────────────
    window.addEventListener('beforeunload', e => {
        if (hasChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

});