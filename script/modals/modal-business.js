document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM para el modal de empresas
    const openModalButton = document.getElementById('openModalButtonBusiness');
    const closeModalButton = document.getElementById('closeModalBusiness');
    const modal = document.getElementById('myModalBusiness');
    const searchRucInput = document.getElementById('search-ruc');
    const searchRazonInput = document.getElementById('search-razon-social');
    const acceptButton = document.getElementById('acceptBusiness');
    const tableBody = document.getElementById('business-table-body');

    // Campos del formulario principal
    const empresaInput = document.getElementById('empresa_input');
    const empresaIdInput = document.getElementById('empresa_id');
    const empresaRucInput = document.getElementById('empresa_ruc');
    const empresaDireccionInput = document.getElementById('empresa_direccion');
    const empresaDepartamentoInput = document.getElementById('empresa_departamento');

    // Variables de estado
    let selectedCompany = null;
    let companiesData = [];

    // URL base para las peticiones
    const BASE_URL = '/app/registrar';


    // Event Listeners
    if (openModalButton) {
        openModalButton.addEventListener('click', openModal);
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

    if (acceptButton) {
        acceptButton.addEventListener('click', handleAccept);
    }

    if (searchRucInput) {
        searchRucInput.addEventListener('input', function () {
            debounceSearch('ruc', this.value.trim());
        });
    }

    if (searchRazonInput) {
        searchRazonInput.addEventListener('input', function () {
            debounceSearch('nombre', this.value.trim()); // Cambiado a 'nombre'
        });
    }

    if (tableBody) {
        tableBody.addEventListener('change', function (event) {
            if (event.target.name === 'business-select') {
                const selectedId = parseInt(event.target.value);
                selectedCompany = companiesData.find(company => company.id_cliente === selectedId);
                highlightSelectedRow(event.target);
            }
        });
    }

    let debounceTimer;

    function debounceSearch(type, value) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (type === 'ruc') {
                searchRucInput.value = value;
                searchCompanies('ruc');
            } else {
                searchRazonInput.value = value;
                searchCompanies('nombre');
            }
        }, 300);
    }
    // Funciones principales
    function openModal() {
        if (modal) {
            modal.style.display = 'block';
            loadCompanies();
        }
    }

    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
            resetModal();
        }
    }

    function handleAccept() {
        if (selectedCompany) {
            // Actualizar campos en el formulario principal
            if (empresaInput) empresaInput.value = selectedCompany.razon_social;
            if (empresaIdInput) empresaIdInput.value = selectedCompany.id_cliente;
            if (empresaRucInput) empresaRucInput.value = selectedCompany.RUC;
            if (empresaDireccionInput) empresaDireccionInput.value = selectedCompany.direccion_fiscal;
            if (empresaDepartamentoInput) empresaDepartamentoInput.value = selectedCompany.departamento;

            closeModal();
        } else {
            showAlert('Por favor seleccione una empresa');
        }
    }

    function loadCompanies() {
        showLoader();

        fetch(`${BASE_URL}/get_companies.php`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    companiesData = data.data;
                    renderCompanies(companiesData);
                } else {
                    throw new Error(data.message || 'Error al cargar empresas');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError(error.message);
                // Datos de ejemplo para desarrollo
                renderCompanies(getSampleData());
            })
            .finally(hideLoader);
    }

    function searchCompanies(field) {
        const searchTerm = field === 'ruc'
            ? searchRucInput.value.trim()
            : searchRazonInput.value.trim();

        if (!searchTerm) {
            loadCompanies(); // Recargar todos si no hay término
            return;
        }

        showLoader();

        // Construir parámetros según el PHP
        const params = new URLSearchParams();
        if (field === 'ruc') {
            params.append('ruc', searchTerm);
        } else {
            params.append('nombre', searchTerm);
        }

        fetch(`${BASE_URL}/get_companies.php?${params.toString()}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data?.success) {
                    companiesData = data.data;
                    renderCompanies(data.data);
                } else {
                    throw new Error(data?.message || 'Sin resultados');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError(error.message);
                renderCompanies([]);
            })
            .finally(hideLoader);
    }

    function renderCompanies(companies) {
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (!companies || companies.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="no-results">No se encontraron empresas</td></tr>';
            return;
        }

        companies.forEach(company => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${company.RUC || 'N/A'}</td>
                <td>${company.razon_social || 'N/A'}</td>
                <td>${company.direccion_fiscal || 'N/A'}</td>
                <td>${company.departamento || 'N/A'}</td>
                <td>
                    <input type="radio" name="business-select" value="${company.id_cliente}">
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function resetModal() {
        if (searchRucInput) searchRucInput.value = '';
        if (searchRazonInput) searchRazonInput.value = '';
        selectedCompany = null;

        if (tableBody) {
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => row.classList.remove('selected-row'));
        }
    }

    function highlightSelectedRow(radioButton) {
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('selected-row'));

        const selectedRow = radioButton.closest('tr');
        if (selectedRow) {
            selectedRow.classList.add('selected-row');
        }
    }

    function showAlert(message) {
        const modalContent = document.querySelector('#myModalBusiness .modal-content');
        if (!modalContent) return;

        // Eliminar alertas anteriores
        const existingAlerts = modalContent.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = 'alert';
        alert.textContent = message;
        alert.style.cssText = `
            background-color: #ffdddd;
            color: #d8000c;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
            text-align: center;
        `;

        modalContent.insertBefore(alert, modalContent.querySelector('.modal-button'));

        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
    }

    function showLoader() {
        if (!tableBody || !tableBody.parentNode) return;

        // Eliminar loaders anteriores
        const existingLoaders = document.querySelectorAll('#myModalBusiness .loader');
        existingLoaders.forEach(loader => loader.remove());

        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.innerHTML = `
            <div class="spinner"></div>
            <p>Cargando empresas...</p>
        `;
        loader.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            gap: 10px;
        `;

        const spinner = loader.querySelector('.spinner');
        if (spinner) {
            spinner.style.cssText = `
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
            `;
        }

        tableBody.parentNode.insertBefore(loader, tableBody);
    }

    function hideLoader() {
        const loaders = document.querySelectorAll('#myModalBusiness .loader');
        loaders.forEach(loader => {
            if (loader.parentNode) {
                loader.remove();
            }
        });
    }

    function showError(message) {
        const modalContent = document.querySelector('#myModalBusiness .modal-content');
        if (!modalContent) return;

        // Eliminar errores anteriores
        const existingErrors = modalContent.querySelectorAll('.error');
        existingErrors.forEach(error => error.remove());

        const error = document.createElement('div');
        error.className = 'error';
        error.textContent = message;
        error.style.cssText = `
            background-color: #ffdddd;
            color: #d8000c;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
            text-align: center;
        `;

        modalContent.insertBefore(error, modalContent.querySelector('.modal-button'));
    }

    function getSampleData() {
        return [
            {
                id_cliente: 15,
                RUC: "9988776655443",
                razon_social: "Aventura y Turismo S.A.C.",
                direccion_fiscal: "Calle Los Andes 880, Urbanización Central",
                departamento: "Cusco"
            },
            {
                id_cliente: 16,
                RUC: "9876543210987",
                razon_social: "Comercial ABC Ltda.",
                direccion_fiscal: "Calle Ficticia 456, Distrito Norte",
                departamento: "Arequipa"
            }
        ];
    }

    function debounce(func, wait) {
        let timeout;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Cerrar modal al presionar Escape
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Cerrar al hacer clic fuera del contenido del modal
    if (modal) {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
});