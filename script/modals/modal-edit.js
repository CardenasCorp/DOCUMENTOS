document.addEventListener('DOMContentLoaded', function () {
    // Variables globales
    let currentPage = 1;
    const employeesPerPage = 6;
    let filteredEmployees = [];
    let employeesData = [];

    // Elementos del DOM
    const modal = document.getElementById('myModalEditEmpoyee');
    const openModalButtons = document.querySelectorAll('#openModalButtonEditEmpoyee');
    const closeModalButton = document.getElementById('closeModalEditEmpoyee');
    const firstNameInput = document.getElementById('f-name');
    const lastNameInput = document.getElementById('l-name');
    const acceptButton = document.querySelector('.accept-modal');
    const employeeContainer = document.querySelector('.employee-container');
    const searchInput = document.getElementById('searchInput');
    const paginationContainer = document.getElementById('pagination');

    // Función para abrir el modal
    function openModal(firstName = '', lastName = '', employeeId = null) {
        firstNameInput.value = firstName;
        lastNameInput.value = lastName;
        modal.dataset.employeeId = employeeId || '';
        modal.style.display = 'block';
    }

    // Función para cerrar el modal
    function closeModal() {
        modal.style.display = 'none';
    }

    // Función para crear elemento de empleado
    function createEmployeeElement(employee) {
        const employeeItem = document.createElement('div');
        employeeItem.className = 'employee-item';
        employeeItem.dataset.employeeId = employee.id;

        const employeeInfo = document.createElement('div');
        employeeInfo.className = 'employee-info';

        const nameContainer = document.createElement('div');
        nameContainer.className = 'name-container';

        const firstNamePara = document.createElement('p');
        firstNamePara.className = 'first-name';
        firstNamePara.textContent = employee.first_name || 'N/A';

        const lastNamePara = document.createElement('p');
        lastNamePara.className = 'last-name';
        lastNamePara.textContent = employee.last_name || 'N/A';

        nameContainer.appendChild(firstNamePara);
        nameContainer.appendChild(lastNamePara);

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'employee-actions';

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.innerHTML = '<i class="bi bi-pencil"></i>';
        editButton.addEventListener('click', () => {
            openModal(employee.first_name, employee.last_name, employee.id);
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<i class="bi bi-trash"></i>';
        deleteButton.addEventListener('click', () => {
            if (confirm(`¿Eliminar a ${employee.first_name} ${employee.last_name}?`)) {
                deleteEmployee(employee.id, employeeItem);
            }
        });

        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(deleteButton);
        employeeInfo.appendChild(nameContainer);
        employeeInfo.appendChild(actionsContainer);
        employeeItem.appendChild(employeeInfo);

        return employeeItem;
    }

    // Función para filtrar empleados
    function filterEmployees(searchTerm) {
        filteredEmployees = employeesData.filter(employee => {
            return employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.last_name.toLowerCase().includes(searchTerm.toLowerCase());
        });
        currentPage = 1;
        displayEmployees();
    }

    // Función para mostrar empleados con paginación
    function displayEmployees() {
        employeeContainer.innerHTML = '';

        const start = (currentPage - 1) * employeesPerPage;
        const end = start + employeesPerPage;
        const employeesToDisplay = filteredEmployees.slice(start, end);

        if (employeesToDisplay.length === 0) {
            employeeContainer.innerHTML = '<p class="no-results">No se encontraron empleados.</p>';
            return;
        }

        employeesToDisplay.forEach(employee => {
            const employeeElement = createEmployeeElement(employee);
            employeeContainer.appendChild(employeeElement);
        });

        updatePagination();
    }

    // Función para actualizar la paginación
    function updatePagination() {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

        if (totalPages <= 1) return;

        // Botón Anterior
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'pagination-btn';
            prevButton.innerHTML = '&laquo; Anterior';
            prevButton.addEventListener('click', () => {
                currentPage--;
                displayEmployees();
            });
            paginationContainer.appendChild(prevButton);
        }

        // Botones de página
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'pagination-btn';
            pageButton.textContent = i;
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.addEventListener('click', () => {
                currentPage = i;
                displayEmployees();
            });
            paginationContainer.appendChild(pageButton);
        }

        // Botón Siguiente
        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.className = 'pagination-btn';
            nextButton.innerHTML = 'Siguiente &raquo;';
            nextButton.addEventListener('click', () => {
                currentPage++;
                displayEmployees();
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    // Función para eliminar empleado
    async function deleteEmployee(employeeId, element) {
        if (!confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
            return;
        }

        try {
            const response = await fetch('empleados/delete_employee.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: employeeId })
            });

            const data = await response.json();

            if (data.success) {
                // Actualizar los datos locales
                employeesData = employeesData.filter(e => e.id !== employeeId);
                filteredEmployees = filteredEmployees.filter(e => e.id !== employeeId);

                // Recalcular la paginación
                const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
                if (currentPage > totalPages && totalPages > 0) {
                    currentPage = totalPages;
                }

                displayEmployees();
            } else {
                throw new Error(data.message || 'Error al eliminar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al eliminar empleado: ${error.message}`);
        }
    }

    // Función para cargar empleados
    async function loadEmployees() {
        employeeContainer.innerHTML = '<div class="loading">Cargando empleados...</div>';

        try {
            const response = await fetch('empleados/get_employees.php');

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success || !Array.isArray(result.data)) {
                throw new Error('Formato de respuesta inválido');
            }

            employeesData = result.data;
            filteredEmployees = [...employeesData];

            // Ordenar alfabéticamente al cargar
            sortEmployeesAlphabetically();

        } catch (error) {
            console.error("Error al cargar empleados:", error);
            employeeContainer.innerHTML = `
            <div class="error-message">
                <p>Error al cargar empleados</p>
                <small>${error.message}</small>
                <button class="retry-btn" onclick="location.reload()">Reintentar</button>
            </div>
        `;
        }
    }

    // Función para ordenar empleados alfabéticamente
    function sortEmployeesAlphabetically() {
        employeesData.sort((a, b) => {
            // Ordenar primero por nombre
            const nameCompare = a.first_name.localeCompare(b.first_name);
            if (nameCompare !== 0) return nameCompare;

            // Si los nombres son iguales, ordenar por apellido
            return a.last_name.localeCompare(b.last_name);
        });

        // Aplicar el mismo orden a los empleados filtrados
        if (filteredEmployees !== employeesData) {
            filteredEmployees = [...employeesData];
        }

        currentPage = 1;
        displayEmployees();
    }

    // Event Listeners
    openModalButtons[0].addEventListener('click', () => openModal('', ''));
    closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    acceptButton.addEventListener('click', async function (e) {
        e.preventDefault();

        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const employeeId = modal.dataset.employeeId;

        if (!firstName || !lastName) {
            alert("Por favor, ingresa un nombre y un apellido.");
            return;
        }

        try {
            const response = await fetch(employeeId ? 'empleados/update_employee.php' : 'empleados/add_employee.php', {
                method: employeeId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: employeeId,
                    first_name: firstName,
                    last_name: lastName
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error en la operación');
            }

            await loadEmployees();
            closeModal();

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        }
    });

    searchInput.addEventListener('input', function () {
        filterEmployees(this.value.trim());
    });

    // Carga inicial
    loadEmployees();
});