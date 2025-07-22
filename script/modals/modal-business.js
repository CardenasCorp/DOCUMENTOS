document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const openModalButton = document.getElementById('openModalButtonBusiness');
    const closeModalButton = document.getElementById('closeModalBusiness');
    const modal = document.getElementById('myModalBusiness');
    const empresaInput = document.querySelector('.empresa input[type="text"]');
    const searchRucInput = document.querySelector('#myModalBusiness input[name="ruc"]');
    const searchRazonSocialInput = document.querySelector('#myModalBusiness input[name="nombre"]');
    const acceptButton = document.querySelector('#myModalBusiness .accept-modal');
    const tableBody = document.querySelector('#myModalBusiness tbody');
    
    // Campos ocultos
    const empresaIdInput = document.getElementById('empresa_id');
    const empresaRucInput = document.getElementById('empresa_ruc');
    const empresaDireccionInput = document.getElementById('empresa_direccion');
    const empresaDepartamentoInput = document.getElementById('empresa_departamento');
    
    // Variables de estado
    let selectedCompany = null;
    let companiesData = [];
    
    // Abrir modal
    openModalButton.addEventListener('click', function() {
        modal.style.display = 'block';
        loadCompanies(); // Cargar todas las empresas al abrir el modal
    });
    
    // Cerrar modal
    closeModalButton.addEventListener('click', function() {
        closeModal();
    });
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Buscar empresas al escribir en los campos de búsqueda
    searchRucInput.addEventListener('input', debounce(searchCompanies, 300));
    searchRazonSocialInput.addEventListener('input', debounce(searchCompanies, 300));
    
    // Seleccionar empresa
    tableBody.addEventListener('change', function(event) {
        if (event.target.name === 'request-select') {
            const selectedId = parseInt(event.target.value);
            selectedCompany = companiesData.find(company => company.id_cliente === selectedId);
            highlightSelectedRow(event.target);
        }
    });
    
    // Aceptar selección
    acceptButton.addEventListener('click', function() {
        if (selectedCompany) {
            // Llenar el input visible con la razón social
            empresaInput.value = selectedCompany.razon_social;
            
            // Llenar los campos ocultos
            empresaIdInput.value = selectedCompany.id_cliente;
            empresaRucInput.value = selectedCompany.RUC;
            empresaDireccionInput.value = selectedCompany.direccion_fiscal;
            empresaDepartamentoInput.value = selectedCompany.departamento;
            
            // Cerrar modal y resetear
            closeModal();
        } else {
            showAlert('Por favor seleccione una empresa');
        }
    });
    
    // Función para cargar empresas
    function loadCompanies() {
        showLoader();
        
        // URL del servicio PHP
        const url = 'registrar/get_companies.php';
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    // Si la respuesta no es OK, intentar leer el cuerpo como texto
                    return response.text().then(text => {
                        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    companiesData = data.data;
                    renderCompanies(companiesData);
                } else {
                    const errorMsg = data && data.message ? data.message : 'Respuesta inesperada del servidor';
                    throw new Error(errorMsg);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error de conexión: ' + error.message);
                
                // Mostrar datos de ejemplo como fallback
                renderCompanies([
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
                ]);
            })
            .finally(() => {
                hideLoader();
            });
    }
    
    // Función para buscar empresas con filtros
    function searchCompanies() {
        const params = new URLSearchParams();
        
        if (searchRucInput.value.trim()) {
            params.append('ruc', searchRucInput.value.trim());
        }
        
        if (searchRazonSocialInput.value.trim()) {
            params.append('nombre', searchRazonSocialInput.value.trim());
        }
        
        showLoader();
          
        // URL del servicio PHP con parámetros
        const url = `registrar/get_companies.php?${params.toString()}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    companiesData = data.data;
                    renderCompanies(companiesData);
                } else {
                    const errorMsg = data && data.message ? data.message : 'Sin resultados';
                    throw new Error(errorMsg);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error de búsqueda: ' + error.message);
            })
            .finally(() => {
                hideLoader();
            });
    }
    
    // Función para renderizar empresas en la tabla
    function renderCompanies(companies) {
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
                    <input type="radio" name="request-select" value="${company.id_cliente}">
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Función para cerrar el modal
    function closeModal() {
        modal.style.display = 'none';
        resetModal();
    }
    
    // Función para resetear el modal
    function resetModal() {
        searchRucInput.value = '';
        searchRazonSocialInput.value = '';
        selectedCompany = null;
        
        // Remover cualquier fila seleccionada
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('selected-row'));
    }
    
    // Función para resaltar la fila seleccionada
    function highlightSelectedRow(radioButton) {
        // Remover selección anterior
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('selected-row'));
        
        // Resaltar nueva selección
        const selectedRow = radioButton.closest('tr');
        selectedRow.classList.add('selected-row');
    }
    
    // Función para mostrar alerta
    function showAlert(message) {
        // Eliminar alertas previas
        const existingAlert = document.querySelector('#myModalBusiness .alert');
        if (existingAlert) existingAlert.remove();
        
        const alert = document.createElement('div');
        alert.className = 'alert';
        alert.textContent = message;
        alert.style.cssText = `
            background-color: #ffdddd;
            color: #d8000c;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            text-align: center;
        `;
        
        const modalButton = document.querySelector('#myModalBusiness .modal-button');
        if (modalButton) {
            modalButton.insertAdjacentElement('beforebegin', alert);
        }
        
        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 3000);
    }
    
    // Función para mostrar loader
    function showLoader() {
        // Eliminar loaders previos
        const existingLoader = document.querySelector('#myModalBusiness .loader');
        if (existingLoader) existingLoader.remove();
        
        // Eliminar mensajes de error
        const existingError = document.querySelector('#myModalBusiness .error');
        if (existingError) existingError.remove();
        
        const loader = document.createElement('div');
        loader.className = 'loader';
        loader.style.cssText = `
            text-align: center;
            padding: 20px;
            color: #2a5298;
        `;
        loader.innerHTML = `<i class="bi bi-arrow-repeat" style="font-size: 24px; animation: spin 1s linear infinite;"></i>
                            <p style="margin-top: 10px;">Buscando empresas...</p>`;
        
        tableBody.parentNode.insertBefore(loader, tableBody);
        
        // Agregar animación CSS si no existe
        if (!document.getElementById('spin-animation')) {
            const style = document.createElement('style');
            style.id = 'spin-animation';
            style.innerHTML = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Función para ocultar loader
    function hideLoader() {
        const loader = document.querySelector('#myModalBusiness .loader');
        if (loader && loader.parentNode) {
            loader.remove();
        }
    }
    
    // Función para mostrar error
    function showError(message) {
        // Eliminar errores previos
        const existingError = document.querySelector('#myModalBusiness .error');
        if (existingError) existingError.remove();
        
        const error = document.createElement('div');
        error.className = 'error';
        error.textContent = message;
        error.style.cssText = `
            background-color: #ffdddd;
            color: #d8000c;
            padding: 10px;
            margin-top: 10px;
            border-radius: 4px;
            text-align: center;
        `;
        
        tableBody.parentNode.insertBefore(error, tableBody);
    }
    
    // Función debounce para optimizar búsquedas
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
});