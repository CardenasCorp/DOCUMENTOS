document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const form = document.querySelector('.form-container');
    const estadoSelect = document.getElementById('estado-select');
    const fechaPresentado = document.getElementById('fecha-presentado');
    const fechaProrroga = document.getElementById('fecha-prórroga');
    const verificadoresContainer = document.getElementById('verificadores');
    const supervisorInput = document.getElementById('supervisor');
    const supervisorSearchBtn = document.querySelector('.supervisor .search');

    // Variables de estado
    let currentDocumentId = null;
    let currentVerificadorInput = null;
    let currentContext = null; // 'supervisor' o 'verificador'
    let verificadoresCount = 0;
    let employeesData = [];
    const employeeModal = document.createElement('div');

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
        4: "Anulado"
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
        10: "Finalizado"
    };

    // ==================== MODAL DE EMPLEADOS ====================
    function createEmployeeModal() {
        employeeModal.id = 'employeeModal';
        employeeModal.className = 'modal';
        employeeModal.style.display = 'none';
        employeeModal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
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
        `;
        document.body.appendChild(employeeModal);

        // Eventos del modal
        document.getElementById('closeEmployeeModal').addEventListener('click', closeEmployeeModal);
        document.getElementById('employeeSearch').addEventListener('input', searchEmployees);
    }

    function openEmployeeModal() {
        employeeModal.style.display = 'block';
        loadEmployees();
    }

    function closeEmployeeModal() {
        employeeModal.style.display = 'none';
    }

    function loadEmployees() {
        const tableBody = document.getElementById('employeeTableBody');
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Cargando empleados...</td></tr>';

        fetch('registrar/get_employees.php')
            .then(response => response.json())
            .then(data => {
                if (data && data.success) {
                    employeesData = data.data;
                    renderEmployees(employeesData);
                } else {
                    throw new Error(data.message || 'Error al cargar empleados');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">${error.message}</td></tr>`;
            });
    }

    function renderEmployees(employees) {
        const tableBody = document.getElementById('employeeTableBody');
        tableBody.innerHTML = '';

        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.id}</td>
                <td>${employee.first_name}</td>
                <td>${employee.last_name}</td>
                <td>
                    <button class="select-employee" data-id="${employee.id}" 
                            data-name="${employee.first_name} ${employee.last_name}">
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
        const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
        const filtered = employeesData.filter(employee =>
            `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm)
        );
        renderEmployees(filtered);
    }

    function selectEmployee(employeeId, employeeName) {
        if (currentContext === 'verificador' && currentVerificadorInput) {
            currentVerificadorInput.name.value = employeeName;
            currentVerificadorInput.id.value = employeeId;
        }
        else if (currentContext === 'supervisor') {
            supervisorInput.value = employeeName;
            supervisorIdInput.value = employeeId;
        }
        closeEmployeeModal();
    }

    // ==================== FUNCIONES PARA VERIFICADORES ====================
    window.modificarVerificador = function (nombre = '', id = '') {
        verificadoresCount++;
        const container = document.createElement('div');
        container.className = 'verificador-container';
        container.innerHTML = `
            <div class="input-container">
                <input type="hidden" name="verificadores[${verificadoresCount}][id]" class="verificador-id" value="${id}">
                <input type="text" name="verificadores[${verificadoresCount}][nombre]" class="verificador-name" 
                       placeholder="Nombre del verificador" value="${nombre}" readonly required>
                <button type="button" class="search verificador-search">
                    <i class="bi bi-search"></i>
                </button>
                <button type="button" class="delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        const addButton = verificadoresContainer.querySelector('.add-verificador');
        if (addButton) {
            addButton.parentNode.insertBefore(container, addButton);
        } else {
            verificadoresContainer.appendChild(container);
        }

        // Agregar evento al botón de búsqueda del verificador recién creado
        const searchBtn = container.querySelector('.verificador-search');
        searchBtn.addEventListener('click', function() {
            currentContext = 'verificador';
            currentVerificadorInput = {
                name: this.previousElementSibling,
                id: this.previousElementSibling.previousElementSibling
            };
            openEmployeeModal();
        });

        // Agregar evento al botón de eliminar
        const deleteBtn = container.querySelector('.delete');
        deleteBtn.addEventListener('click', function() {
            this.closest('.verificador-container').remove();
            verificadoresCount--;
        });
    };

    // ==================== FUNCIONES PRINCIPALES ====================
    async function loadDocument(id) {
        try {
            showLoading(true);
            const response = await fetch(`/app/modificar/get_document.php?id=${id}`);
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
        } finally {
            showLoading(false);
        }
    }

    async function loadAgentesSunat(fiscalizacionId) {
        try {
            const response = await fetch(`/app/modificar/get_agentes_sunat.php?id_fiscalizacion=${fiscalizacionId}`);
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error al cargar agentes SUNAT:', error);
            return [];
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
        setValue('fecha-notificacion', data.fecha_notificacion || '');
        setValue('fecha-presentar', data.fecha_presentacion || '');
        setValue('fecha-prórroga', data.fecha_prorroga || '');
        setValue('IGV', data.IGV || '0.00');
        setValue('periodo-inicio', formatPeriodForInput(data.periodo_inicio) || '');
        setValue('periodo-fin', formatPeriodForInput(data.periodo_final) || '');

        if (data.id_estado) {
            estadoSelect.value = estadoMap[data.id_estado] || '';
            toggleFechaFields();
        }

        if (data.id_etapa) {
            document.getElementById('etapa').value = etapaMap[data.id_etapa] || '';
        }

        handleAgentesData(agentes);
    }

    function handleAgentesData(agentes) {
        const supervisor = agentes.find(a => a.cargo === 'supervisor');
        if (supervisor) {
            supervisorInput.value = supervisor.nombre_completo || '';
            supervisorIdInput.value = supervisor.id_personal || '';
        }

        loadVerificadores(agentes.filter(a => a.cargo === 'verificador'));
    }

    function loadVerificadores(verificadores) {
        verificadoresContainer.querySelectorAll('.verificador-container:not(.add-verificador)').forEach(c => c.remove());
        verificadoresCount = 0;

        verificadores.forEach(v => modificarVerificador(v.nombre_completo, v.id_personal));

        if (verificadores.length === 0 && !verificadoresContainer.querySelector('.verificador-container:not(.add-verificador)')) {
            modificarVerificador();
        }
    }

    // ==================== FUNCIONES AUXILIARES ====================
    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value ?? '';
    }

    function showLoading(show) {
        const submitButton = form.querySelector('.post');
        if (submitButton) {
            submitButton.disabled = show;
            submitButton.innerHTML = show ? '<i class="bi bi-arrow-repeat spin"></i> Procesando...' : 'Actualizar';
        }
    }

    function showMessage(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        form.prepend(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
    }

    function showSuccess(message) {
        showMessage('success', message);
    }

    function showError(message) {
        showMessage('danger', message);
    }

    function formatPeriodForInput(period) {
        return period?.length === 6 ? `${period.substring(2, 6)}-${period.substring(0, 2)}` : '';
    }

    window.toggleFechaFields = function () {
        const estado = estadoSelect?.value;
        if (fechaPresentado) fechaPresentado.disabled = estado !== 'Presentado';
        if (fechaProrroga) fechaProrroga.disabled = estado !== 'Prorroga';
        if (estado === 'Anulado') {
            if (fechaPresentado) fechaPresentado.disabled = true;
            if (fechaProrroga) fechaProrroga.disabled = true;
        }
    };

    // ==================== INICIALIZACIÓN ====================
    function init() {
        createEmployeeModal();

        // Evento para documento seleccionado
        document.addEventListener('documentSelected', async (e) => {
            currentDocumentId = e.detail.documentId;
            await loadDocument(currentDocumentId);
        });

        if (estadoSelect) {
            estadoSelect.addEventListener('change', toggleFechaFields);
            toggleFechaFields();
        }

        if (!verificadoresContainer.querySelector('.add-verificador')) {
            const plusContainer = document.createElement('div');
            plusContainer.className = 'verificador-container add-verificador';
            plusContainer.innerHTML = `
                <div class="input-container">
                    <button type="button" class="plus" onclick="modificarVerificador()">
                        <i class="bi bi-plus-lg"></i> Modificar verificador
                    </button>
                </div>
            `;
            verificadoresContainer.appendChild(plusContainer);
        }

        if (!verificadoresContainer.querySelector('.verificador-container:not(.add-verificador)')) {
            modificarVerificador();
        }

        if (supervisorSearchBtn) {
            supervisorSearchBtn.addEventListener('click', () => {
                currentContext = 'supervisor';
                openEmployeeModal();
            });
        }
    }

    init();
});