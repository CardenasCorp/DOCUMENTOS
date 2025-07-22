document.addEventListener('DOMContentLoaded', function () {
    // Variables globales
    let currentPage = 1;
    const clientsPerPage = 4;
    let filteredClients = [];
    let clientsData = [];

    // Elementos del DOM
    const modal = document.getElementById('myModalEditBusiness');
    const closeModalButton = document.getElementById('closeModalEditBusiness');
    const rucInput = document.getElementById('f-RUC');
    const razonSocialInput = document.getElementById('razon_social');
    const direccionFiscalInput = document.getElementById('direccion_fiscal');
    const departamentoInput = document.getElementById('Departamento');
    const acceptButton = document.querySelector('.accept-modal');
    const clientContainer = document.getElementById('clientContainer');
    const searchNameInput = document.getElementById('searchClientInput');
    const searchRUCInput = document.getElementById('searchRUCInput');
    const addClientButton = document.getElementById('addClientButton');
    const paginationContainer = document.getElementById('pagination');
    const businessForm = document.getElementById('businessForm');

    // Función para abrir el modal con datos de cliente
    function openClientModal(client = null) {
        if (client) {
            rucInput.value = client.RUC || '';
            razonSocialInput.value = client.razon_social || '';
            // Asegúrate que este selector coincide con tu HTML
            direccionFiscalInput.value = client.direccion_fiscal || '';
            departamentoInput.value = client.departamento || '';
            modal.dataset.clientId = client.id;
        } else {
            rucInput.value = '';
            razonSocialInput.value = '';
            direccionFiscalInput.value = '';
            departamentoInput.value = '';
            delete modal.dataset.clientId;
        }
        modal.style.display = 'block';
    }

    // Función para cerrar el modal
    function closeModal() {
        modal.style.display = 'none';
    }

    // Función para crear elemento de cliente
    function createClientElement(client) {
        const clientItem = document.createElement('div');
        clientItem.className = 'client-item';
        clientItem.dataset.clientId = client.id;

        clientItem.innerHTML = `
        <div class="client-info">
            <div class="client-details">
                <h3>${client.razon_social || 'N/A'}</h3>
                <p><strong>RUC:</strong> ${client.RUC || 'N/A'}</p>
                <p><strong>Dirección Fiscal:</strong> ${client.direccion_fiscal || 'N/A'}</p>
                <p><strong>Departamento:</strong> ${client.departamento || 'N/A'}</p>
            </div>
            <div class="client-actions">
                <button class="edit-btn"><i class="bi bi-pencil"></i> Editar</button>
                <button class="delete-btn"><i class="bi bi-trash"></i> Eliminar</button>
            </div>
        </div>
    `;

        // Agregar event listeners
        clientItem.querySelector('.edit-btn').addEventListener('click', () => {
            openClientModal(client);
        });

        clientItem.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm(`¿Eliminar la empresa ${client.razon_social}?`)) {
                deleteClient(client.id, clientItem);
            }
        });

        return clientItem;
    }

    // Función para actualizar la paginación
    function updatePagination() {
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

        if (totalPages <= 1) return;

        // Botón Anterior
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'pagination-btn';
            prevButton.innerHTML = '&laquo; Anterior';
            prevButton.addEventListener('click', () => {
                currentPage--;
                displayClients();
            });
            paginationContainer.appendChild(prevButton);
        }

        // Botones de página
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                displayClients();
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
                displayClients();
            });
            paginationContainer.appendChild(nextButton);
        }
    }

    // Función para cargar clientes
    async function loadClients() {
        if (!clientContainer) {
            console.error('Error: No se encontró el contenedor de clientes');
            return;
        }

        clientContainer.innerHTML = '<div class="loading">Cargando empresas...</div>';

        try {
            const response = await fetch('empresas/get_clients.php');

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (!result?.success || !Array.isArray(result?.data)) {
                throw new Error('Formato de respuesta inválido');
            }

            clientsData = result.data;
            filteredClients = [...clientsData];
            displayClients();

        } catch (error) {
            console.error("Error al cargar clientes:", error);
            clientContainer.innerHTML = `
                <div class="error-message">
                    <p>Error al cargar empresas</p>
                    <small>${error.message}</small>
                    <button class="retry-btn" onclick="location.reload()">Reintentar</button>
                </div>
            `;
        }
    }

    // Función para mostrar clientes
    function displayClients() {
        if (!clientContainer) return;

        const start = (currentPage - 1) * clientsPerPage;
        const end = start + clientsPerPage;
        const clientsToDisplay = filteredClients.slice(start, end);

        clientContainer.innerHTML = '';

        if (clientsToDisplay.length === 0) {
            clientContainer.innerHTML = '<p class="no-results">No se encontraron empresas.</p>';
            return;
        }

        clientsToDisplay.forEach(client => {
            const clientElement = createClientElement(client);
            clientContainer.appendChild(clientElement);
        });

        updatePagination();
    }

    // Función para filtrar clientes
    function filterClients() {
        const nameTerm = searchNameInput.value.trim().toLowerCase();
        const rucTerm = searchRUCInput.value.trim();

        filteredClients = clientsData.filter(client => {
            const matchesName = client.razon_social.toLowerCase().includes(nameTerm);
            const matchesRUC = client.RUC.includes(rucTerm);
            return matchesName && matchesRUC;
        });

        currentPage = 1;
        displayClients();
    }

    // Función para eliminar cliente
    async function deleteClient(clientId, element) {
        if (!confirm('¿Estás seguro de eliminar esta empresa?')) return;

        try {
            const response = await fetch('empresas/delete_client.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: clientId })
            });

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Respuesta inesperada: ${text.substring(0, 100)}...`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar');
            }

            // Actualizar datos locales
            clientsData = clientsData.filter(c => c.id !== clientId);
            filteredClients = filteredClients.filter(c => c.id !== clientId);

            // Recalcular paginación
            const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            }

            displayClients();

        } catch (error) {
            console.error('Error:', error);
            alert(`Error al eliminar empresa: ${error.message}`);
        }
    }

    // Función para guardar cliente (añadir/editar)
    async function saveClient(e) {
        e.preventDefault();

        const clientData = {
            RUC: rucInput.value.trim(),
            razon_social: razonSocialInput.value.trim(),
            direccion_fiscal: direccionFiscalInput.value.trim(),  // Nombre exacto
            departamento: departamentoInput.value.trim()
        };

        // Validación
        if (!clientData.RUC || !/^\d{11}$/.test(clientData.RUC)) {
            alert("El RUC debe tener 11 dígitos numéricos.");
            return;
        }

        if (!clientData.razon_social || clientData.razon_social.length < 3) {
            alert("La Razón Social debe tener al menos 3 caracteres.");
            return;
        }

        const clientId = modal.dataset.clientId;
        const url = clientId ? 'empresas/update_client.php' : 'empresas/add_client.php';
        const method = clientId ? 'PUT' : 'POST';

        if (clientId) {
            clientData.id = clientId;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clientData)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error en la operación');
            }

            await loadClients();
            closeModal();

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Event Listeners
    closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    if (businessForm) {
        businessForm.addEventListener('submit', saveClient);
    }

    if (searchNameInput && searchRUCInput) {
        searchNameInput.addEventListener('input', filterClients);
        searchRUCInput.addEventListener('input', filterClients);
    }

    if (addClientButton) {
        addClientButton.addEventListener('click', () => openClientModal());
    }

    // Carga inicial
    loadClients();

    // Depuración
    console.log('Elementos inicializados:', {
        modal,
        clientContainer,
        searchNameInput,
        searchRUCInput,
        addClientButton,
        paginationContainer
    });
});