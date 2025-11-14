// Script para manejar la selección de supervisores, verificadores y funcionarios
document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const supervisorSearchBtn = document.querySelector('.supervisor .search');
    const verificadoresContainer = document.querySelector('#verificadores .verificador-container');
    const funcionariosContainer = document.querySelector('#funcionarios .funcionarios-container');
    const tipoSelect = document.getElementById('tipo');
    const supervisorSection = document.getElementById('supervisor-verificadores-section');
    const funcionariosSection = document.getElementById('funcionarios-section');

    let currentContext = null; // 'supervisor', 'verificador' o 'funcionario'
    let currentInput = null;
    let employeesData = [];
    let verificadorCount = 0;
    let funcionarioCount = 0;

    // Inicializar el estado de las secciones
    toggleSections();

    // Configurar evento para el cambio de tipo
    tipoSelect.addEventListener('change', toggleSections);

    // Función para mostrar/ocultar secciones según el tipo seleccionado
    function toggleSections() {
        if (tipoSelect.value === 'CRUCE') {
            supervisorSection.classList.add('hidden');
            funcionariosSection.classList.remove('hidden');
        } else {
            supervisorSection.classList.remove('hidden');
            funcionariosSection.classList.add('hidden');
        }
    }

    // Función para abrir modal de empleados
    function openEmployeeModal() {
        const modal = document.getElementById('employeeModal');
        if (modal) {
            modal.style.display = 'block';
            loadEmployees();
        } else {
            console.error('Modal de empleados no encontrado');
        }
    }

    // Función para cerrar modal de empleados
    function closeEmployeeModal() {
        const modal = document.getElementById('employeeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Cargar empleados desde el servidor
    function loadEmployees() {
        const tableBody = document.getElementById('employeeTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Cargando empleados...</td></tr>';

        fetch('registrar/get_employees.php')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
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
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
            });
    }

    // Renderizar empleados en la tabla
    function renderEmployees(employees) {
        const tableBody = document.getElementById('employeeTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!employees || employees.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No se encontraron empleados</td></tr>';
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

    // Buscar empleados
    function searchEmployees() {
        const searchInput = document.getElementById('employeeSearch');
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const filtered = employeesData.filter(employee =>
            employee.first_name.toLowerCase().includes(searchTerm) ||
            employee.last_name.toLowerCase().includes(searchTerm)
        );
        renderEmployees(filtered);
    }

    // Seleccionar empleado
    function selectEmployee(employeeId, employeeName) {
        if (currentContext === 'verificador' && currentInput) {
            // Actualizar el input de texto con el nombre
            currentInput.name.value = employeeName;
            // Actualizar el campo oculto con el ID
            currentInput.id.value = employeeId;
        }
        else if (currentContext === 'funcionario' && currentInput) {
            // Actualizar el input de texto con el nombre
            currentInput.name.value = employeeName;
            // Actualizar el campo oculto con el ID
            currentInput.id.value = employeeId;
        }
        else if (currentContext === 'supervisor') {
            // Actualizar el input de texto con el nombre
            document.getElementById('supervisor').value = employeeName;
            // Actualizar el campo oculto con el ID
            document.getElementById('supervisor_id').value = employeeId;
        }

        closeEmployeeModal();
    }

    // Función para agregar verificador
    // Función para agregar verificador - MEJORADA
    window.agregarVerificador = function () {
        const verificadoresContainer = document.querySelector('#verificadores .verificador-container');
        const verificadorCount = verificadoresContainer.querySelectorAll('.verificador-item').length + 1;

        const nuevoVerificadorDiv = document.createElement('div');
        nuevoVerificadorDiv.classList.add('verificador-item');
        nuevoVerificadorDiv.style.marginBottom = '10px';

        // Campo oculto para el ID
        const hiddenIdInput = document.createElement('input');
        hiddenIdInput.type = 'hidden';
        hiddenIdInput.name = `verificadores[${verificadorCount}][id]`;
        hiddenIdInput.className = 'verificador-id';

        // Input para el nombre (solo lectura)
        const inputVerificador = document.createElement('input');
        inputVerificador.type = 'text';
        inputVerificador.name = `verificadores[${verificadorCount}][nombre]`;
        inputVerificador.placeholder = 'Nombre del verificador';
        inputVerificador.readOnly = true;
        inputVerificador.required = true;
        inputVerificador.className = 'verificador-name';
        inputVerificador.style.marginRight = '10px';
        inputVerificador.style.padding = '8px';
        inputVerificador.style.width = '200px';

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
        verificadoresContainer.appendChild(nuevoVerificadorDiv);
    };

    // Función para agregar funcionario
    window.agregarFuncionario = function () {
        funcionarioCount++;

        const nuevoFuncionarioDiv = document.createElement('div');
        nuevoFuncionarioDiv.classList.add('funcionario-item');
        nuevoFuncionarioDiv.style.marginBottom = '10px';

        // Campo oculto para el ID
        const hiddenIdInput = document.createElement('input');
        hiddenIdInput.type = 'hidden';
        hiddenIdInput.name = `funcionarios[${funcionarioCount}][id]`;
        hiddenIdInput.className = 'funcionario-id';

        // Input para el nombre (solo lectura)
        const inputFuncionario = document.createElement('input');
        inputFuncionario.type = 'text';
        inputFuncionario.name = `funcionarios[${funcionarioCount}][nombre]`;
        inputFuncionario.placeholder = 'Nombre del funcionario';
        inputFuncionario.readOnly = true;
        inputFuncionario.required = true;
        inputFuncionario.className = 'funcionario-name';
        inputFuncionario.style.marginRight = '10px';
        inputFuncionario.style.padding = '8px';
        inputFuncionario.style.width = '200px';

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
        funcionariosContainer.appendChild(nuevoFuncionarioDiv);
    };

    // Configurar eventos existentes
    if (supervisorSearchBtn) {
        supervisorSearchBtn.addEventListener('click', function () {
            currentContext = 'supervisor';
            openEmployeeModal();
        });
    }

    // Configurar eventos del modal existente (si existe)
    const closeEmployeeModalBtn = document.getElementById('closeEmployeeModal');
    const employeeSearchInput = document.getElementById('employeeSearch');

    if (closeEmployeeModalBtn) {
        closeEmployeeModalBtn.addEventListener('click', closeEmployeeModal);
    }

    if (employeeSearchInput) {
        employeeSearchInput.addEventListener('input', searchEmployees);
    }

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('employeeModal');
        if (event.target === modal) {
            closeEmployeeModal();
        }
    });

    // Inicializar contadores basados en los elementos existentes
    verificadorCount = document.querySelectorAll('.verificador-item').length;
    funcionarioCount = document.querySelectorAll('.funcionario-item').length;
});