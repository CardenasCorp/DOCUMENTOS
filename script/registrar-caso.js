// Script para manejar la selección de supervisores y verificadores
document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM
    const supervisorSearchBtn = document.querySelector('.supervisor .search');
    const supervisorInput = document.getElementById('supervisor');
    const verificadoresContainer = document.querySelector('#verificadores .verificador-container');
    const agregarBtn = document.querySelector('.plus');
    const employeeModal = document.createElement('div');
    let currentContext = null; // 'supervisor' o 'verificador'
    let currentVerificadorInput = null;
    let employeesData = [];
    let verificadorCount = 0;

    // Crear modal para selección de empleados
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
                <div class="modal-button" style="text-align: right; margin-top: 20px;">
                    <button id="selectEmployeeButton" style="padding: 8px 20px;">Seleccionar</button>
                </div>
            </div>
        `;
        document.body.appendChild(employeeModal);

        // Eventos del modal
        document.getElementById('closeEmployeeModal').addEventListener('click', closeEmployeeModal);
        document.getElementById('employeeSearch').addEventListener('input', searchEmployees);
        document.getElementById('selectEmployeeButton').addEventListener('click', function() {
            // Esta función se maneja con los botones individuales
        });
    }

    // Función para agregar verificador
    window.agregarVerificador = function() {
        verificadorCount++;

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
            currentVerificadorInput = {
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

    // Función para abrir modal de empleados
    function openEmployeeModal() {
        employeeModal.style.display = 'block';
        loadEmployees();
    }

    // Función para cerrar modal de empleados
    function closeEmployeeModal() {
        employeeModal.style.display = 'none';
    }

    // Cargar empleados desde el servidor
    function loadEmployees() {
        const tableBody = document.getElementById('employeeTableBody');
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
                tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">${error.message}</td></tr>`;
            });
    }

    // Renderizar empleados en la tabla
    function renderEmployees(employees) {
        const tableBody = document.getElementById('employeeTableBody');
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
        const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
        const filtered = employeesData.filter(employee =>
            employee.first_name.toLowerCase().includes(searchTerm) ||
            employee.last_name.toLowerCase().includes(searchTerm)
        );
        renderEmployees(filtered);
    }

    // Seleccionar empleado
    function selectEmployee(employeeId, employeeName) {
        if (currentContext === 'verificador' && currentVerificadorInput) {
            // Actualizar el input de texto con el nombre
            currentVerificadorInput.name.value = employeeName;
            // Actualizar el campo oculto con el ID
            currentVerificadorInput.id.value = employeeId;
        }
        else if (currentContext === 'supervisor') {
            // Actualizar el input de texto con el nombre
            document.getElementById('supervisor').value = employeeName;
            // Actualizar el campo oculto con el ID
            document.getElementById('supervisor_id').value = employeeId;
        }

        closeEmployeeModal();
    }

    // Abrir modal para supervisor
    supervisorSearchBtn.addEventListener('click', function () {
        currentContext = 'supervisor';
        openEmployeeModal();
    });

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', function (event) {
        if (event.target === employeeModal) {
            closeEmployeeModal();
        }
    });

    // Inicializar el modal
    createEmployeeModal();
});