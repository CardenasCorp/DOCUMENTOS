document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const form = document.querySelector('.form-container');
    const estadoSelect = document.getElementById('estado-select');
    const fechaPresentado = document.getElementById('fecha-presentado');
    const fechaProrroga = document.getElementById('fecha-prórroga');
    const verificadoresContainer = document.getElementById('verificadores');
    const funcionariosContainer = document.getElementById('funcionarios');
    const supervisorInput = document.getElementById('supervisor');
    const supervisorSearchBtn = document.querySelector('.supervisor .search');
    const tipoSelect = document.getElementById('tipo');
    const supervisorSection = document.getElementById('supervisor-verificadores-section');
    const funcionariosSection = document.getElementById('funcionarios-section');

    // Variables de estado
    let currentDocumentId = null;
    let currentInput = null;
    let currentContext = null; // 'supervisor', 'verificador' o 'funcionario'
    let verificadoresCount = 0;
    let funcionariosCount = 0;
    let employeesData = [];

    // Referencias a elementos existentes
    const employeeModal = document.getElementById('employeeModal');
    const closeEmployeeModalBtn = document.getElementById('closeEmployeeModal');
    const employeeSearchInput = document.getElementById('employeeSearch');

    // Crear campo oculto para ID del supervisor si no existe
    let supervisorIdInput = document.getElementById('supervisor_id');
    if (!supervisorIdInput) {
        supervisorIdInput = document.createElement('input');
        supervisorIdInput.type = 'hidden';
        supervisorIdInput.id = 'supervisor_id';
        supervisorIdInput.name = 'supervisor_id';
        supervisorInput.parentNode.appendChild(supervisorIdInput);
    }

    // Mapeos
    const estadoMap = {
        2: "Presentado",
        3: "Prorroga",
        4: "Anulado",
        6: "No presentar"
    };

    const etapaMap = {
        1: "1er Requerimiento",
        2: "2do Requerimiento",
        3: "3ro Requerimiento",
        4: "4to Requerimiento",
        5: "Cierre",
        6: "Reclamación",
        7: "Apelación",
        8: "Proceso Contencioso",
        10: "Finalizado",
        11: "5to Requerimiento",
        12: "6to Requerimiento",
        13: "7mo Requerimiento",
        14: "Coactiva x R",
        15: "Coactiva x TF",
        16: "Coactiva sin R"
    };

    // ==================== FUNCIONES PARA MOSTRAR/OCULTAR SECCIONES ====================
    function toggleSections() {
        const tipoSelect = document.getElementById('tipo');
        const supervisorSection = document.getElementById('supervisor-verificadores-section');
        const funcionariosSection = document.getElementById('funcionarios-section');
        const clienteSection = document.getElementById('cliente-section'); // NUEVO

        if (tipoSelect.value === 'CRUCE') {
            supervisorSection.classList.add('hidden');
            funcionariosSection.classList.remove('hidden');
            clienteSection.classList.remove('hidden'); // MOSTRAR cliente
        } else {
            supervisorSection.classList.remove('hidden');
            funcionariosSection.classList.add('hidden');
            clienteSection.classList.add('hidden'); // OCULTAR cliente
        }
    }

    // ==================== FUNCIONES DE UTILIDAD PARA FECHAS ====================
    function formatDateForInput(dateString) {
        if (!dateString) return '';

        // Si ya está en formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // Si está en formato DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            const parts = dateString.split('/');
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        // Si está en formato MM/DD/YYYY (menos común)
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
            const parts = dateString.split('/');
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }

        return dateString; // Devolver tal cual si no se reconoce el formato
    }

    function formatPeriodForInput(period) {
        return period?.length === 6 ? `${period.substring(2, 6)}-${period.substring(0, 2)}` : '';
    }

    // ==================== MODAL DE EMPLEADOS ====================
    function setupEmployeeModal() {
        if (!employeeModal || !closeEmployeeModalBtn || !employeeSearchInput) {
            console.error('Elementos del modal no encontrados');
            return;
        }

        // Eventos del modal
        closeEmployeeModalBtn.addEventListener('click', closeEmployeeModal);
        employeeSearchInput.addEventListener('input', searchEmployees);

        // Cerrar modal al hacer clic fuera del contenido
        employeeModal.addEventListener('click', function (event) {
            if (event.target === employeeModal) {
                closeEmployeeModal();
            }
        });
    }

    function openEmployeeModal() {
        if (employeeModal) {
            employeeModal.style.display = 'block';
            loadEmployees();
        }
    }

    function closeEmployeeModal() {
        if (employeeModal) {
            employeeModal.style.display = 'none';
        }
    }

    function loadEmployees() {
        const tableBody = document.getElementById('employeeTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">Cargando empleados...</td></tr>';

        // Intentar diferentes rutas posibles
        const possiblePaths = [
            'registrar/get_employees.php',
            'get_employees.php',
            'registrar/get_employees.php',
            '/app/registrar/get_employees.php'
        ];

        const tryFetch = (index) => {
            if (index >= possiblePaths.length) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red; padding: 20px;">Error: No se pudo cargar empleados</td></tr>';
                return;
            }

            fetch(possiblePaths[index])
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log('Datos recibidos:', data);
                    if (data && data.success) {
                        employeesData = data.data;
                        renderEmployees(employeesData);
                    } else {
                        throw new Error(data.message || 'Error al cargar empleados');
                    }
                })
                .catch(error => {
                    console.error(`Error en ruta ${possiblePaths[index]}:`, error);
                    tryFetch(index + 1);
                });
        };

        tryFetch(0);
    }

    function renderEmployees(employees) {
        const tableBody = document.getElementById('employeeTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!employees || employees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No se encontraron empleados</td></tr>';
            return;
        }

        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.id}</td>
                <td>${employee.first_name}</td>
                <td>${employee.last_name}</td>
                <td>
                    <button class="select-employee" data-id="${employee.id}" 
                            data-name="${employee.first_name} ${employee.last_name}"
                            style="padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Seleccionar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Agregar eventos a los botones de selección
        document.querySelectorAll('.select-employee').forEach(button => {
            button.addEventListener('click', function () {
                const employeeId = this.getAttribute('data-id');
                const employeeName = this.getAttribute('data-name');
                selectEmployee(employeeId, employeeName);
            });
        });
    }

    function searchEmployees() {
        const searchInput = document.getElementById('employeeSearch');
        if (!searchInput || !employeesData.length) return;

        const searchTerm = searchInput.value.toLowerCase();
        const filtered = employeesData.filter(employee =>
            employee.first_name.toLowerCase().includes(searchTerm) ||
            employee.last_name.toLowerCase().includes(searchTerm) ||
            `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm)
        );

        renderEmployees(filtered);
    }

    function selectEmployee(employeeId, employeeName) {
        if (currentContext === 'verificador' && currentInput) {
            currentInput.name.value = employeeName;
            currentInput.id.value = employeeId;
        }
        else if (currentContext === 'funcionario' && currentInput) {
            currentInput.name.value = employeeName;
            currentInput.id.value = employeeId;
        }
        else if (currentContext === 'supervisor') {
            supervisorInput.value = employeeName;
            supervisorIdInput.value = employeeId;
        }

        closeEmployeeModal();
    }

    // ==================== FUNCIONES PARA VERIFICADORES ====================
    window.agregarVerificador = function (nombre = '', id = '') {
        verificadoresCount++;

        const nuevoVerificadorDiv = document.createElement('div');
        nuevoVerificadorDiv.classList.add('verificador-item');
        nuevoVerificadorDiv.style.marginBottom = '10px';

        // Campo oculto para el ID
        const hiddenIdInput = document.createElement('input');
        hiddenIdInput.type = 'hidden';
        hiddenIdInput.name = `verificadores[${verificadoresCount}][id]`;
        hiddenIdInput.className = 'verificador-id';
        hiddenIdInput.value = id;

        // Input para el nombre (solo lectura)
        const inputVerificador = document.createElement('input');
        inputVerificador.type = 'text';
        inputVerificador.name = `verificadores[${verificadoresCount}][nombre]`;
        inputVerificador.placeholder = 'Nombre del verificador';
        inputVerificador.readOnly = true;
        inputVerificador.required = true;
        inputVerificador.className = 'verificador-name';
        inputVerificador.style.marginRight = '10px';
        inputVerificador.style.padding = '8px';
        inputVerificador.style.width = '200px';
        inputVerificador.value = nombre;

        // Botón de búsqueda
        const searchButton = document.createElement('button');
        searchButton.type = 'button';
        searchButton.classList.add('search', 'verificador-search');
        searchButton.innerHTML = '<i class="bi bi-search"></i>';
        searchButton.style.marginRight = '5px';
        searchButton.style.padding = '8px 12px';
        searchButton.onclick = function () {
            currentContext = 'verificador';
            currentInput = {
                name: inputVerificador,
                id: hiddenIdInput
            };
            openEmployeeModal();
        };

        // Botón para eliminar
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('delete');
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.style.padding = '8px 12px';
        deleteButton.onclick = function () {
            nuevoVerificadorDiv.remove();
            verificadoresCount--;
        };

        // Contenedor interno para los elementos del verificador
        const itemContainer = document.createElement('div');
        itemContainer.style.display = 'flex';
        itemContainer.style.alignItems = 'center';
        itemContainer.style.gap = '10px';

        itemContainer.appendChild(hiddenIdInput);
        itemContainer.appendChild(inputVerificador);
        itemContainer.appendChild(searchButton);
        itemContainer.appendChild(deleteButton);

        nuevoVerificadorDiv.appendChild(itemContainer);

        // Agregar al contenedor de verificadores
        const container = verificadoresContainer.querySelector('.verificador-container');
        if (container) {
            container.appendChild(nuevoVerificadorDiv);
        } else {
            verificadoresContainer.appendChild(nuevoVerificadorDiv);
        }
    };

    // ==================== FUNCIONES PARA FUNCIONARIOS ====================
    window.agregarFuncionario = function (nombre = '', id = '') {
        funcionariosCount++;

        const nuevoFuncionarioDiv = document.createElement('div');
        nuevoFuncionarioDiv.classList.add('funcionario-item');
        nuevoFuncionarioDiv.style.marginBottom = '10px';

        // Campo oculto para el ID
        const hiddenIdInput = document.createElement('input');
        hiddenIdInput.type = 'hidden';
        hiddenIdInput.name = `funcionarios[${funcionariosCount}][id]`;
        hiddenIdInput.className = 'funcionario-id';
        hiddenIdInput.value = id;

        // Input para el nombre (solo lectura)
        const inputFuncionario = document.createElement('input');
        inputFuncionario.type = 'text';
        inputFuncionario.name = `funcionarios[${funcionariosCount}][nombre]`;
        inputFuncionario.placeholder = 'Nombre del funcionario';
        inputFuncionario.readOnly = true;
        inputFuncionario.required = true;
        inputFuncionario.className = 'funcionario-name';
        inputFuncionario.style.marginRight = '10px';
        inputFuncionario.style.padding = '8px';
        inputFuncionario.style.width = '200px';
        inputFuncionario.value = nombre;

        // Botón de búsqueda
        const searchButton = document.createElement('button');
        searchButton.type = 'button';
        searchButton.classList.add('search', 'funcionario-search');
        searchButton.innerHTML = '<i class="bi bi-search"></i>';
        searchButton.style.marginRight = '5px';
        searchButton.style.padding = '8px 12px';
        searchButton.onclick = function () {
            currentContext = 'funcionario';
            currentInput = {
                name: inputFuncionario,
                id: hiddenIdInput
            };
            openEmployeeModal();
        };

        // Botón para eliminar
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('delete');
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.style.padding = '8px 12px';
        deleteButton.onclick = function () {
            nuevoFuncionarioDiv.remove();
            funcionariosCount--;
        };

        // Contenedor interno para los elementos del funcionario
        const itemContainer = document.createElement('div');
        itemContainer.style.display = 'flex';
        itemContainer.style.alignItems = 'center';
        itemContainer.style.gap = '10px';

        itemContainer.appendChild(hiddenIdInput);
        itemContainer.appendChild(inputFuncionario);
        itemContainer.appendChild(searchButton);
        itemContainer.appendChild(deleteButton);

        nuevoFuncionarioDiv.appendChild(itemContainer);

        // Agregar al contenedor de funcionarios
        const container = funcionariosContainer.querySelector('.funcionarios-container');
        if (container) {
            container.appendChild(nuevoFuncionarioDiv);
        } else {
            funcionariosContainer.appendChild(nuevoFuncionarioDiv);
        }
    };

    // ==================== FUNCIONES PRINCIPALES ====================
    async function loadDocument(id) {
        try {
            showLoading(true);
            const response = await fetch(`modificar/get_document.php?id=${id}`);
            const result = await response.json();

            if (result.success) {
                const agentes = await loadAgentesSunat(id);
                populateForm(result.data, agentes);
                showSuccess('Documento cargado correctamente');
            } else {
                throw new Error(result.message || 'Error al cargar documento');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al cargar documento: ' + error.message);
            showLoading(false);
        }
    }

    async function loadAgentesSunat(fiscalizacionId) {
        try {
            const response = await fetch(`modificar/get_agentes_sunat.php?id_fiscalizacion=${fiscalizacionId}`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error al cargar agentes SUNAT:', error);
            return [];
        }
    }

    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value ?? '';

            // Si el campo está deshabilitado pero tiene valor, cambiar el fondo
            if (element.disabled && element.value) {
                element.style.backgroundColor = '#f0f0f0';
            } else if (element.disabled && !element.value) {
                element.style.backgroundColor = '';
            }
        }
    }

    function populateForm(responseData, agentes = []) {
        const data = responseData.documento || responseData;

        // Datos principales
        setValue('number', data.numero || '');
        setValue('requerimiento', data.numero_padre || 'N/A');
        setValue('empresa_input', data.razon_social || '');
        setValue('empresa_id', data.id_cliente || '');
        setValue('empresa_ruc', data.RUC || '');
        setValue('empresa_direccion', data.direccion_fiscal || '');
        setValue('empresa_departamento', data.departamento || '');
        setValue('fecha-notificacion', formatDateForInput(data.fecha_notificacion) || '');
        setValue('cliente_input', data.cliente_cruce || '');
        setValue('fecha-presentar', formatDateForInput(data.fecha_presentacion) || '');
        setValue('fecha-presentado', formatDateForInput(data.fecha_presentado) || '');
        setValue('fecha-prórroga', formatDateForInput(data.fecha_prorroga) || '');
        setValue('IGV', data.IGV || '0');
        setValue('periodo-inicio', formatPeriodForInput(data.periodo_inicio) || '');
        setValue('periodo-fin', formatPeriodForInput(data.periodo_final) || '');
        if (data.id_tipo) {
            const tipoMap = {
                1: "esquela",
                2: "FP-IGV",
                3: "FT-IGV",
                4: "FP-RENTA",
                5: "FT-RENTA",
                6: "CRUCE"
            };

            const tipoValue = tipoMap[data.id_tipo];
            if (tipoValue) {
                document.getElementById('tipo').value = tipoValue;
                toggleSections();
            }
        }

        // CORRECCIÓN: La lógica del estado debe usar fecha_presentado (real)
        if (data.id_estado) {
            estadoSelect.value = estadoMap[data.id_estado] || '';

            // Si hay fecha de presentación REAL, estado debe ser "Presentado"
            if (data.fecha_presentado && estadoSelect.value !== "Presentado") {
                estadoSelect.value = "Presentado";
            }

            // Si hay fecha de prórroga, estado debe ser "Prorroga"
            if (data.fecha_prorroga && estadoSelect.value !== "Prorroga") {
                estadoSelect.value = "Prorroga";
            }

            toggleFechaFields();
        }

        if (data.id_etapa) {
            document.getElementById('etapa').value = etapaMap[data.id_etapa] || '';
        }

        handleAgentesData(agentes);
        showLoading(false);
    }

    function handleAgentesData(agentes) {
        const supervisor = agentes.find(a => a.cargo === 'supervisor');
        if (supervisor) {
            supervisorInput.value = supervisor.nombre_completo || '';
            supervisorIdInput.value = supervisor.id_personal || '';
        }

        // Cargar verificadores o funcionarios según el tipo
        const tipo = document.getElementById('tipo').value;
        if (tipo === 'CRUCE') {
            loadFuncionarios(agentes.filter(a => a.cargo === 'funcionario'));
        } else {
            loadVerificadores(agentes.filter(a => a.cargo === 'verificador'));
        }
    }

    function loadVerificadores(verificadores) {
        // Limpiar verificadores existentes
        const container = verificadoresContainer.querySelector('.verificador-container');
        if (container) {
            const items = container.querySelectorAll('.verificador-item');
            items.forEach(item => item.remove());
        }
        verificadoresCount = 0;

        // Cargar nuevos verificadores
        verificadores.forEach(v => agregarVerificador(v.nombre_completo, v.id_personal));

        // Agregar uno vacío si no hay verificadores
        if (verificadores.length === 0) {
            agregarVerificador();
        }
    }

    function loadFuncionarios(funcionarios) {
        // Limpiar funcionarios existentes
        const container = funcionariosContainer.querySelector('.funcionarios-container');
        if (container) {
            const items = container.querySelectorAll('.funcionario-item');
            items.forEach(item => item.remove());
        }
        funcionariosCount = 0;

        // Cargar nuevos funcionarios
        funcionarios.forEach(f => agregarFuncionario(f.nombre_completo, f.id_personal));

        // Agregar uno vacío si no hay funcionarios
        if (funcionarios.length === 0) {
            agregarFuncionario();
        }
    }

    // ==================== FUNCIONES AUXILIARES ====================
    function showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }

        const submitButton = form.querySelector('.post');
        if (submitButton) {
            submitButton.disabled = show;
            submitButton.innerHTML = show ? '<i class="bi bi-arrow-repeat spin"></i> Procesando...' : 'Actualizar';
        }
    }

    function showMessage(type, message) {
        // Limpiar mensajes anteriores
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.padding = '10px';
        alertDiv.style.margin = '10px 0';
        alertDiv.style.borderRadius = '4px';
        alertDiv.style.color = type === 'success' ? '#155724' : '#721c24';
        alertDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
        alertDiv.style.border = type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';

        form.parentNode.insertBefore(alertDiv, form);
        setTimeout(() => alertDiv.remove(), 3000);
    }

    function showSuccess(message) {
        showMessage('success', message);
    }

    function showError(message) {
        showMessage('danger', message);
    }

    window.toggleFechaFields = function () {
        const estado = estadoSelect?.value;
        const fechaPresentado = document.getElementById('fecha-presentado');
        const fechaProrroga = document.getElementById('fecha-prórroga');

        // CORRECCIÓN: fecha-presentado se habilita solo cuando estado es "Presentado"
        if (fechaPresentado) {
            fechaPresentado.disabled = estado !== 'Presentado';
            // Si está deshabilitado pero tiene valor, mantener el valor
            if (fechaPresentado.disabled && fechaPresentado.value) {
                fechaPresentado.style.backgroundColor = '#f0f0f0';
            } else {
                fechaPresentado.style.backgroundColor = '';
            }
        }

        // CORRECCIÓN: fecha-prórroga se habilita solo cuando estado es "Prorroga"
        if (fechaProrroga) {
            fechaProrroga.disabled = estado !== 'Prorroga';
            // Si está deshabilitado pero tiene valor, mantener el valor
            if (fechaProrroga.disabled && fechaProrroga.value) {
                fechaProrroga.style.backgroundColor = '#f0f0f0';
            } else {
                fechaProrroga.style.backgroundColor = '';
            }
        }

        // Para estado "Anulado" y "No presentar", ambos campos deben estar deshabilitados
        if (estado === 'Anulado' || estado === 'No presentar') {
            if (fechaPresentado) {
                fechaPresentado.disabled = true;
                fechaPresentado.style.backgroundColor = '#f0f0f0';
            }
            if (fechaProrroga) {
                fechaProrroga.disabled = true;
                fechaProrroga.style.backgroundColor = '#f0f0f0';
            }
        }
    };

    // ==================== INICIALIZACIÓN ====================
    function init() {
        setupEmployeeModal();

        // Configurar evento para cambio de tipo
        if (tipoSelect) {
            tipoSelect.addEventListener('change', toggleSections);
        }

        // Evento para documento seleccionado
        document.addEventListener('documentSelected', async (e) => {
            currentDocumentId = e.detail.documentId;
            await loadDocument(currentDocumentId);
        });

        if (estadoSelect) {
            estadoSelect.addEventListener('change', toggleFechaFields);
            toggleFechaFields();
        }

        if (supervisorSearchBtn) {
            supervisorSearchBtn.addEventListener('click', () => {
                currentContext = 'supervisor';
                openEmployeeModal();
            });
        }

        // Agregar eventos a los botones de búsqueda existentes
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('verificador-search')) {
                currentContext = 'verificador';
                const container = e.target.closest('.verificador-item');
                if (container) {
                    currentInput = {
                        name: container.querySelector('.verificador-name'),
                        id: container.querySelector('.verificador-id')
                    };
                    openEmployeeModal();
                }
            }
            else if (e.target.classList.contains('funcionario-search')) {
                currentContext = 'funcionario';
                const container = e.target.closest('.funcionario-item');
                if (container) {
                    currentInput = {
                        name: container.querySelector('.funcionario-name'),
                        id: container.querySelector('.funcionario-id')
                    };
                    openEmployeeModal();
                }
            }
        });

        // Inicializar secciones
        toggleSections();
    }

    init();
});