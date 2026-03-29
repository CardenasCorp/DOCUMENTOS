document.addEventListener('DOMContentLoaded', function () {
    // Estilo para botones de paginación deshabilitados
    const s = document.createElement('style');
    s.textContent = '.pagination-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none !important; box-shadow: none !important; }';
    document.head.appendChild(s);

    // Variables globales
    let currentPage = 1;
    const clientsPerPage = 6;
    let filteredClients = [];
    let clientsData = [];
    let currentClientId = null;
    let searchTimeout;

    // Elementos del DOM - Clientes
    const modal = document.getElementById('myModalEditBusiness');
    const closeModalButton = document.getElementById('closeModalEditBusiness');
    const rucInput = document.getElementById('f-RUC');
    const razonSocialInput = document.getElementById('razon_social');
    const propietarioInput = document.getElementById('propietario');
    const direccionFiscalInput = document.getElementById('direccion_fiscal');
    const departamentoInput = document.getElementById('Departamento');
    const acceptButton = document.querySelector('.accept-modal');
    const clientContainer = document.getElementById('clientContainer');
    const searchNameInput = document.getElementById('searchClientInput');
    const searchRUCInput = document.getElementById('searchRUCInput');
    const addClientButton = document.getElementById('addClientButton');
    const paginationContainer = document.getElementById('pagination');
    const businessForm = document.getElementById('businessForm');

    // Elementos del DOM - Historial de Direcciones Y Gerentes
    const historyModal = document.getElementById('myModalHistory');
    const closeHistoryModalButton = document.getElementById('closeModalHistory');
    const addressesContainer = document.getElementById('addressesContainer');
    const addAddressButton = document.getElementById('addAddressButton');
    const managersContainer = document.getElementById('managersContainer');
    const addManagerButton = document.getElementById('addManagerButton');
    const historyTabs = document.querySelectorAll('.history-tabs .tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Elementos del DOM - Modal de Direcciones
    const addressModal = document.getElementById('myModalAddress');
    const closeAddressModalButton = document.getElementById('closeModalAddress');
    const closeAddressModalBtn = document.getElementById('closeModalAddressBtn');
    const addressForm = document.getElementById('addressForm');
    const addressModalTitle = document.getElementById('addressModalTitle');

    // Elementos del DOM - Modal de Gerentes
    const managerModal = document.getElementById('myModalManager');
    const closeManagerModalButton = document.getElementById('closeModalManager');
    const managerForm = document.getElementById('managerForm');
    const managerModalTitle = document.getElementById('managerModalTitle');

    // Función para inicializar event listeners
    function initializeEventListeners() {
        console.log('Inicializando event listeners...');

        // Verificar elementos críticos
        if (!clientContainer) {
            console.error('CRITICAL: clientContainer no encontrado');
            return false;
        }

        // Event Listeners - Clientes
        if (closeModalButton) {
            closeModalButton.addEventListener('click', closeModal);
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === modal) closeModal();
        });

        if (businessForm) {
            businessForm.addEventListener('submit', saveClient);
        }

        if (searchNameInput && searchRUCInput) {
            searchNameInput.addEventListener('input', filterClients);
            searchRUCInput.addEventListener('input', filterClients);
        } else {
            console.warn('Inputs de búsqueda no encontrados');
        }

        if (addClientButton) {
            addClientButton.addEventListener('click', () => openClientModal());
        }

        // Event Listeners - Historial de Direcciones
        if (closeHistoryModalButton) {
            closeHistoryModalButton.addEventListener('click', closeHistoryModal);
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === historyModal) closeHistoryModal();
        });

        // Event Listeners - Modal de Direcciones (CORREGIDOS)
        if (closeAddressModalButton) {
            closeAddressModalButton.addEventListener('click', closeAddressModal);
        }
        if (closeAddressModalBtn) {
            closeAddressModalBtn.addEventListener('click', closeAddressModal);
        }
        window.addEventListener('click', (event) => {
            if (event.target === addressModal) closeAddressModal();
        });

        if (addAddressButton) {
            console.log('Botón agregar dirección encontrado, agregando event listener');
            addAddressButton.addEventListener('click', function() {
                console.log('Botón agregar dirección clickeado, currentClientId:', currentClientId);
                openAddressModal();
            });
        } else {
            console.error('ERROR: Botón agregar dirección NO encontrado en el DOM');
        }

        if (addressForm) {
            addressForm.addEventListener('submit', saveAddress);
        }

        // Event Listeners - Gerentes
        if (closeManagerModalButton) {
            closeManagerModalButton.addEventListener('click', closeManagerModal);
        }
        
        window.addEventListener('click', (event) => {
            if (event.target === managerModal) closeManagerModal();
        });

        if (addManagerButton) {
            addManagerButton.addEventListener('click', () => openManagerModal());
        }

        if (managerForm) {
            managerForm.addEventListener('submit', saveManager);
        }

        // Event Listeners para las pestañas
        historyTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                switchTab(tabName);
            });
        });

        console.log('Event listeners inicializados correctamente');
        return true;
    }

    // Función para formatear fechas
    function formatDate(dateString) {
        if (!dateString) return 'N/A';

        // Para fechas en formato MySQL YYYY-MM-DD
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${parseInt(day)}/${parseInt(month)}/${year}`;
        }

        return dateString;
    }

    // Función para cambiar entre pestañas
    function switchTab(tabName) {
        console.log('Cambiando a pestaña:', tabName);
        
        // Remover clase active de todos los tabs y contenidos
        historyTabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Activar el tab seleccionado
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        const targetContent = document.getElementById(`${tabName}Tab`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetContent) targetContent.classList.add('active');
    }

    // Función para abrir el modal con datos de cliente
    function openClientModal(client = null) {
        if (!modal) {
            console.error('Modal no encontrado');
            return;
        }

        if (client) {
            rucInput.value = client.RUC || '';
            razonSocialInput.value = client.razon_social || '';
            propietarioInput.value = client.propietario || '';
            direccionFiscalInput.value = client.direccion_fiscal || '';
            departamentoInput.value = client.departamento || '';
            modal.dataset.clientId = client.id;
        } else {
            rucInput.value = '';
            razonSocialInput.value = '';
            propietarioInput.value = '';
            direccionFiscalInput.value = '';
            departamentoInput.value = '';
            delete modal.dataset.clientId;
        }
        modal.style.display = 'block';
    }

    // Función para cerrar el modal de cliente
    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Función para abrir el modal de historial
    function openHistoryModal(clientId) {
        console.log('Abriendo historial para cliente:', clientId);
        
        if (!historyModal) {
            console.error('Modal de historial no encontrado');
            return;
        }

        // Asegurar que clientId sea un número
        currentClientId = parseInt(clientId);
        console.log('currentClientId establecido:', currentClientId);
        
        historyModal.style.display = 'block';

        // Cargar ambos historiales
        loadAddresses(currentClientId);
        loadManagers(currentClientId);

        // Resetear a la pestaña de direcciones por defecto
        switchTab('direcciones');
    }

    // Función para cerrar el modal de historial
    function closeHistoryModal() {
        if (historyModal) {
            historyModal.style.display = 'none';
        }
        currentClientId = null;
    }

    // Función para abrir el modal de dirección (agregar/editar) - CORREGIDA
    function openAddressModal(address = null) {
        console.log('=== ABRIR MODAL DIRECCIÓN ===');
        console.log('currentClientId:', currentClientId);
        console.log('addressModal disponible:', !!addressModal);
        console.log('address data:', address);

        if (!addressModal) {
            console.error('Modal de dirección no encontrado en el DOM');
            alert('Error: No se puede abrir el modal de dirección');
            return;
        }

        // VERIFICACIÓN CRÍTICA - Asegurar que currentClientId esté definido
        if (!currentClientId) {
            console.error('ERROR: currentClientId no está definido');
            alert('Error: No se ha seleccionado una empresa. Por favor, abra el historial de una empresa primero.');
            return;
        }

        if (address) {
            addressModalTitle.textContent = 'Editar Dirección';
            document.getElementById('addressId').value = address.id;
            document.getElementById('clientId').value = currentClientId;
            document.getElementById('tipo_direccion').value = address.tipo_direccion;
            document.getElementById('direccion').value = address.direccion;
            document.getElementById('provincia').value = address.provincia;
            document.getElementById('departamento').value = address.departamento;

            // Usar las fechas directamente de la base de datos (formato ISO)
            document.getElementById('fecha_inicio').value = address.fecha_inicio;
            document.getElementById('fecha_fin').value = address.fecha_fin || '';
        } else {
            addressModalTitle.textContent = 'Agregar Dirección';
            addressForm.reset();
            document.getElementById('clientId').value = currentClientId;
            document.getElementById('addressId').value = '';

            // Establecer fecha de inicio por defecto como hoy
            document.getElementById('fecha_inicio').value = new Date().toISOString().split('T')[0];
        }
        
        addressModal.style.display = 'block';
        console.log('Modal de dirección abierto exitosamente');
    }

    // Función para cerrar el modal de dirección
    function closeAddressModal() {
        if (addressModal) {
            addressModal.style.display = 'none';
        }
    }

    // Función para abrir el modal de gerente
    function openManagerModal(manager = null) {
        if (!managerModal) {
            console.error('Modal de gerente no encontrado');
            return;
        }

        if (manager) {
            managerModalTitle.textContent = 'Editar Gerente';
            document.getElementById('managerId').value = manager.id;
            document.getElementById('managerClientId').value = currentClientId;
            document.getElementById('gerente').value = manager.gerente;
            document.getElementById('dni').value = manager.dni || '';
            document.getElementById('fecha_inicio_gerente').value = manager.fecha_inicio;
            document.getElementById('fecha_fin_gerente').value = manager.fecha_fin || '';
        } else {
            managerModalTitle.textContent = 'Agregar Gerente';
            managerForm.reset();
            document.getElementById('managerClientId').value = currentClientId;
            document.getElementById('managerId').value = '';
            document.getElementById('fecha_inicio_gerente').value = new Date().toISOString().split('T')[0];
        }
        managerModal.style.display = 'block';
    }

    function closeManagerModal() {
        if (managerModal) {
            managerModal.style.display = 'none';
        }
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
                <p><strong>Propietario:</strong> ${client.propietario || 'N/A'}</p>
                <p><strong>Dirección Fiscal:</strong> ${client.direccion_fiscal || 'N/A'}</p>
                <p><strong>Departamento:</strong> ${client.departamento || 'N/A'}</p>
            </div>
            <div class="client-actions">
                <button class="edit-btn"><i class="bi bi-pencil"></i> Editar</button>
                <button class="delete-btn"><i class="bi bi-trash"></i> Eliminar</button>
                <button class="history-btn"><i class="bi bi-clock-history"></i> Historial</button>
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

        // Event listener para el botón de historial
        clientItem.querySelector('.history-btn').addEventListener('click', () => {
            console.log('Botón historial clickeado para cliente:', client.id);
            openHistoryModal(client.id);
        });

        return clientItem;
    }

    // Función para crear elemento de dirección
    function createAddressElement(address) {
        const addressItem = document.createElement('div');
        addressItem.className = `address-item ${!address.fecha_fin ? 'current-address' : 'past-address'}`;

        const isCurrent = !address.fecha_fin;

        // Usar la función corregida para mostrar fechas
        const fechaInicioDisplay = formatDate(address.fecha_inicio);
        const fechaFinDisplay = address.fecha_fin ? formatDate(address.fecha_fin) : '';

        const dateText = isCurrent
            ? `Activa desde: ${fechaInicioDisplay}`
            : `Del ${fechaInicioDisplay} al ${fechaFinDisplay}`;

        addressItem.innerHTML = `
            <div class="address-header">
                <span class="address-type ${address.tipo_direccion}">
                    ${address.tipo_direccion.toUpperCase()}
                </span>
                <span class="address-dates">${dateText}</span>
            </div>
            <div class="address-details">
                <p><strong>Dirección:</strong> ${address.direccion}</p>
                <p><strong>Provincia:</strong> ${address.provincia}</p>
                <p><strong>Departamento:</strong> ${address.departamento}</p>
            </div>
            <div class="address-actions">
                <button class="edit-address-btn">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="delete-address-btn">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </div>
        `;

        // Event listeners para los botones
        addressItem.querySelector('.edit-address-btn').addEventListener('click', () => {
            console.log('Editando dirección:', address.id);
            openAddressModal(address);
        });

        addressItem.querySelector('.delete-address-btn').addEventListener('click', () => {
            deleteAddress(address.id);
        });

        return addressItem;
    }

    // Función para crear elemento de gerente
    function createManagerElement(manager) {
        const managerItem = document.createElement('div');
        managerItem.className = `manager-item ${!manager.fecha_fin ? 'current-manager' : 'past-manager'}`;

        const isCurrent = !manager.fecha_fin;
        const fechaInicioDisplay = formatDate(manager.fecha_inicio);
        const fechaFinDisplay = manager.fecha_fin ? formatDate(manager.fecha_fin) : '';

        const dateText = isCurrent
            ? `Activo desde: ${fechaInicioDisplay}`
            : `Del ${fechaInicioDisplay} al ${fechaFinDisplay}`;

        const dniText = manager.dni ? ` DNI: ${manager.dni}` : '';

        managerItem.innerHTML = `
        <div class="manager-header">
            <span class="manager-name">${manager.gerente}</span>
            <span class="manager-dates">${dniText}</span>
            <span class="manager-dates">${dateText}</span>
        </div>
        <div class="manager-status ${isCurrent ? 'current' : 'past'}">
            ${isCurrent ? '🟢 Gerente Actual' : '🔴 Gerente Anterior'}
        </div>
        <div class="manager-actions">
            <button class="edit-manager-btn">
                <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="delete-manager-btn">
                <i class="bi bi-trash"></i> Eliminar
            </button>
        </div>
    `;

        // Event listeners para los botones
        managerItem.querySelector('.edit-manager-btn').addEventListener('click', () => {
            openManagerModal(manager);
        });

        managerItem.querySelector('.delete-manager-btn').addEventListener('click', () => {
            deleteManager(manager.id);
        });

        return managerItem;
    }

    // Función para actualizar la paginación
    function updatePagination() {
        if (!paginationContainer) return;

        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

        if (totalPages <= 1) return;

        const addBtn = (label, page, active = false, disabled = false) => {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn' + (active ? ' active' : '');
            btn.innerHTML = label;
            if (disabled) btn.disabled = true;
            btn.addEventListener('click', () => {
                if (disabled) return;
                currentPage = page;
                displayClients();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationContainer.appendChild(btn);
        };

        const addEllipsis = () => {
            const span = document.createElement('span');
            span.textContent = '…';
            span.style.cssText = 'padding:6px 4px;color:#999;align-self:center;';
            paginationContainer.appendChild(span);
        };

        addBtn('&laquo;', currentPage - 1, false, currentPage === 1);
        addBtn(1, 1, currentPage === 1);
        if (currentPage > 4) addEllipsis();

        const start = Math.max(2, currentPage - 2);
        const end   = Math.min(totalPages - 1, currentPage + 2);
        for (let i = start; i <= end; i++) {
            addBtn(i, i, i === currentPage);
        }

        if (currentPage < totalPages - 3) addEllipsis();
        if (totalPages > 1) addBtn(totalPages, totalPages, currentPage === totalPages);
        addBtn('&raquo;', currentPage + 1, false, currentPage === totalPages);
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
                    <button class="retry-btn" id="retryLoadClients">Reintentar</button>
                </div>
            `;
            
            // Agregar event listener correctamente
            setTimeout(() => {
                const retryButton = document.getElementById('retryLoadClients');
                if (retryButton) {
                    retryButton.addEventListener('click', () => {
                        location.reload();
                    });
                }
            }, 100);
        }
    }

    // Función para cargar direcciones
    async function loadAddresses(clientId) {
        if (!addressesContainer) {
            console.error('Error: No se encontró el contenedor de direcciones');
            return;
        }

        addressesContainer.innerHTML = '<div class="loading-message">Cargando direcciones...</div>';

        try {
            const response = await fetch(`empresas/get_addresses.php?id_cliente=${clientId}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (!result?.success) {
                throw new Error(result?.message || 'Error al cargar direcciones');
            }

            displayAddresses(result.data || []);

        } catch (error) {
            console.error("Error al cargar direcciones:", error);
            addressesContainer.innerHTML = `
                <div class="error-message">
                    <p>Error al cargar direcciones</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    // Función para cargar gerentes
    async function loadManagers(clientId) {
        if (!managersContainer) {
            console.error('Error: No se encontró el contenedor de gerentes');
            return;
        }

        managersContainer.innerHTML = '<div class="loading-message">Cargando gerentes...</div>';

        try {
            const response = await fetch(`empresas/get_managers.php?id_cliente=${clientId}`);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (!result?.success) {
                throw new Error(result?.message || 'Error al cargar gerentes');
            }

            displayManagers(result.data || []);

        } catch (error) {
            console.error("Error al cargar gerentes:", error);
            managersContainer.innerHTML = `
            <div class="error-message">
                <p>Error al cargar gerentes</p>
                <small>${error.message}</small>
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

    // Función para mostrar direcciones
    function displayAddresses(addresses) {
        if (!addressesContainer) return;

        addressesContainer.innerHTML = '';

        if (addresses.length === 0) {
            addressesContainer.innerHTML = '<p class="no-results">No se encontraron direcciones.</p>';
            return;
        }

        addresses.forEach(address => {
            const addressElement = createAddressElement(address);
            addressesContainer.appendChild(addressElement);
        });
    }

    // Función para mostrar gerentes
    function displayManagers(managers) {
        if (!managersContainer) return;

        managersContainer.innerHTML = '';

        if (managers.length === 0) {
            managersContainer.innerHTML = '<p class="no-results">No se encontraron gerentes.</p>';
            return;
        }

        managers.forEach(manager => {
            const managerElement = createManagerElement(manager);
            managersContainer.appendChild(managerElement);
        });
    }

    // Función para filtrar clientes CON DEBOUNCING
    function filterClients() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const nameTerm = searchNameInput?.value.trim().toLowerCase() || '';
            const rucTerm = searchRUCInput?.value.trim() || '';

            filteredClients = clientsData.filter(client => {
                const matchesName = client.razon_social?.toLowerCase().includes(nameTerm) || false;
                const matchesRUC = client.RUC?.includes(rucTerm) || false;
                return matchesName && matchesRUC;
            });

            currentPage = 1;
            displayClients();
        }, 300);
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

    // Función para eliminar dirección
    async function deleteAddress(addressId) {
        if (!confirm('¿Estás seguro de eliminar esta dirección?')) return;

        try {
            const response = await fetch('empresas/delete_address.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: addressId })
            });

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Respuesta inesperada: ${text.substring(0, 100)}...`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar dirección');
            }

            // Recargar las direcciones
            await loadAddresses(currentClientId);

        } catch (error) {
            console.error('Error:', error);
            alert(`Error al eliminar dirección: ${error.message}`);
        }
    }

    // Función para eliminar gerente
    async function deleteManager(managerId) {
        if (!confirm('¿Estás seguro de eliminar este gerente?')) return;

        try {
            const response = await fetch('empresas/delete_manager.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: managerId })
            });

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Respuesta inesperada: ${text.substring(0, 100)}...`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar gerente');
            }

            await loadManagers(currentClientId);

        } catch (error) {
            console.error('Error:', error);
            alert(`Error al eliminar gerente: ${error.message}`);
        }
    }

    // Función para guardar cliente (añadir/editar)
    async function saveClient(e) {
        e.preventDefault();

        const clientData = {
            RUC: rucInput.value.trim(),
            razon_social: razonSocialInput.value.trim(),
            propietario: propietarioInput.value.trim(),
            direccion_fiscal: direccionFiscalInput.value.trim(),
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

    // Función para guardar dirección (agregar/editar)
    async function saveAddress(e) {
        e.preventDefault();

        const addressData = {
            id_cliente: document.getElementById('clientId').value,
            tipo_direccion: document.getElementById('tipo_direccion').value,
            direccion: document.getElementById('direccion').value.trim(),
            provincia: document.getElementById('provincia').value.trim(),
            departamento: document.getElementById('departamento').value.trim(),
            fecha_inicio: document.getElementById('fecha_inicio').value,
            fecha_fin: document.getElementById('fecha_fin').value || null
        };

        // Validación
        if (!addressData.tipo_direccion) {
            alert("Por favor selecciona un tipo de dirección.");
            return;
        }

        if (!addressData.direccion || addressData.direccion.length < 5) {
            alert("La dirección debe tener al menos 5 caracteres.");
            return;
        }

        // Validar que fecha_fin sea posterior a fecha_inicio
        if (addressData.fecha_fin && addressData.fecha_fin < addressData.fecha_inicio) {
            alert("La fecha de fin debe ser posterior a la fecha de inicio.");
            return;
        }

        const addressId = document.getElementById('addressId').value;
        const url = addressId ? 'empresas/update_address.php' : 'empresas/add_address.php';
        const method = addressId ? 'PUT' : 'POST';

        if (addressId) {
            addressData.id = addressId;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(addressData)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error en la operación');
            }

            await loadAddresses(currentClientId);
            closeAddressModal();

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Función para guardar gerente
    async function saveManager(e) {
        e.preventDefault();

        const managerData = {
            id_cliente: document.getElementById('managerClientId').value,
            gerente: document.getElementById('gerente').value.trim(),
            dni: document.getElementById('dni').value.trim(),
            fecha_inicio: document.getElementById('fecha_inicio_gerente').value,
            fecha_fin: document.getElementById('fecha_fin_gerente').value || null
        };

        // Validación
        if (!managerData.gerente || managerData.gerente.length < 3) {
            alert("El nombre del gerente debe tener al menos 3 caracteres.");
            return;
        }

        if (managerData.fecha_fin && managerData.fecha_fin < managerData.fecha_inicio) {
            alert("La fecha de fin debe ser posterior a la fecha de inicio.");
            return;
        }

        const managerId = document.getElementById('managerId').value;
        const url = managerId ? 'empresas/update_manager.php' : 'empresas/add_manager.php';
        const method = managerId ? 'PUT' : 'POST';

        if (managerId) {
            managerData.id = managerId;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(managerData)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Error en la operación');
            }

            await loadManagers(currentClientId);
            closeManagerModal();

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        }
    }

    // Inicialización principal
    if (initializeEventListeners()) {
        loadClients();
        console.log('Sistema de empresas inicializado correctamente');
    } else {
        console.error('Error al inicializar el sistema de empresas');
    }

    // Depuración
    console.log('Elementos inicializados:', {
        modal,
        clientContainer,
        searchNameInput,
        searchRUCInput,
        addClientButton,
        paginationContainer,
        historyModal,
        addressModal,
        managerModal,
        addAddressButton: document.getElementById('addAddressButton')
    });

    // Función de debug temporal
    window.debugOpenAddressModal = function() {
        console.log('=== DEBUG MODAL DIRECCIÓN ===');
        console.log('addressModal:', document.getElementById('myModalAddress'));
        console.log('currentClientId:', currentClientId);
        console.log('addAddressButton:', document.getElementById('addAddressButton'));
        
        // Forzar apertura para testing
        const modal = document.getElementById('myModalAddress');
        if (modal) {
            modal.style.display = 'block';
            console.log('Modal abierto forzadamente');
        }
    };
});