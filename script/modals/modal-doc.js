document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const openModalButton = document.getElementById('openModalButtonDoc');
  const closeModalButton = document.getElementById('closeModalDoc');
  const modal = document.getElementById('myModalDoc');
  const tipoInput = document.getElementById('search-tipo');
  const referenciaInput = document.getElementById('search-referencia');
  const acceptButton = document.getElementById('acceptDoc');
  const tableBody = document.getElementById('doc-table-body');

  // State variables
  let selectedDocument = null;
  let documentsData = [];

  // Base URL for requests
  const BASE_URL = '/app/modificar';

  // Event Listeners
  openModalButton.addEventListener('click', openModal);
  closeModalButton.addEventListener('click', closeModal);
  acceptButton.addEventListener('click', handleAccept);

  // Search events with debounce
  if (tipoInput) {
    tipoInput.addEventListener('input', debounce(() => searchDocuments('tipo'), 300));
  }

  if (referenciaInput) {
    referenciaInput.addEventListener('input', debounce(() => searchDocuments('referencia'), 300));
  }

  // Row selection handler
  tableBody.addEventListener('change', function (event) {
    if (event.target.name === 'document-select') {
      const selectedId = parseInt(event.target.value);
      selectedDocument = documentsData.find(doc => doc.id_fiscalizacion === selectedId);
      highlightSelectedRow(event.target);
    }
  });

  // Main functions
  function openModal() {
    modal.style.display = 'block';
    loadDocuments();
  }

  function closeModal() {
    modal.style.display = 'none';
    resetModal();
  }

  function handleAccept() {
    if (selectedDocument) {
      const event = new CustomEvent('documentSelected', {
        detail: {
          documentId: selectedDocument.id_fiscalizacion,
          documentNumber: selectedDocument.numero,
          client: selectedDocument.cliente || selectedDocument.razon_social,
          tipo: selectedDocument.tipo, // Nuevo campo agregado
          periodoInicio: selectedDocument.periodo_inicio,
          periodoFinal: selectedDocument.periodo_final,
          etapa: selectedDocument.id_etapa,
          fechaNotificacion: selectedDocument.fecha_notificacion,
          fechaPresentacion: selectedDocument.fecha_presentacion,
          IGV: selectedDocument.IGV
        }
      });
      document.dispatchEvent(event);
      closeModal();
    } else {
      showAlert('Por favor seleccione un documento');
    }
  }

  function loadDocuments() {
    showLoader();

    fetch(`${BASE_URL}/buscar_todos_requerimientos.php`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data?.success) {
          documentsData = data.data;
          renderDocuments(documentsData);
        } else {
          throw new Error(data?.message || 'Error al cargar documentos');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showError(error.message);
      })
      .finally(hideLoader);
  }

  function searchDocuments(field) {
    const searchTerm = field === 'tipo'
      ? tipoInput.value.trim()
      : referenciaInput.value.trim();

    if (!searchTerm) {
      loadDocuments();
      return;
    }

    showLoader();

    const params = new URLSearchParams();
    params.append('search', searchTerm);
    params.append('field', field);

    fetch(`${BASE_URL}/buscar_todos_requerimientos.php?${params.toString()}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data?.success) {
          documentsData = data.data;
          renderDocuments(data.data);
        } else {
          throw new Error(data?.message || 'Sin resultados');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showError(error.message);
      })
      .finally(hideLoader);
  }

  function renderDocuments(documents) {
    tableBody.innerHTML = '';

    if (!documents || documents.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="no-results">No se encontraron documentos</td></tr>';
      return;
    }

    documents.forEach(doc => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${doc.numero || 'N/A'}</td>
        <td>${doc.cliente || doc.razon_social || 'N/A'}</td>
        <td>${doc.tipo || 'N/A'}</td> <!-- Nueva columna agregada -->
        <td>${formatPeriodo(doc.periodo_inicio, doc.periodo_final)}</td>
        <td><input type="radio" name="document-select" value="${doc.id_fiscalizacion}"></td>
      `;
      tableBody.appendChild(row);
    });
  }

  function formatPeriodo(inicio, final) {
    if (!inicio && !final) return 'N/A';
    return `${inicio || ''}${final ? ' - ' + final : ''}`;
  }

  function resetModal() {
    if (tipoInput) tipoInput.value = '';
    if (referenciaInput) referenciaInput.value = '';
    selectedDocument = null;
    tableBody.innerHTML = '';
  }

  function highlightSelectedRow(radioButton) {
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => row.classList.remove('selected-row'));
    radioButton.closest('tr').classList.add('selected-row');
  }

  function showAlert(message) {
    const modalContent = document.querySelector('#myModalDoc .modal-content');
    if (!modalContent) return;

    // Remove existing alerts
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

    modalContent.insertBefore(alert, modalContent.querySelector('.table-container'));
    setTimeout(() => alert.remove(), 3000);
  }

  function showLoader() {
    if (!tableBody || !tableBody.parentNode) return;

    // Remove existing loaders
    const existingLoaders = document.querySelectorAll('#myModalDoc .loader');
    existingLoaders.forEach(loader => loader.remove());

    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
      <div class="spinner"></div>
      <p>Cargando documentos...</p>
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
    const loaders = document.querySelectorAll('#myModalDoc .loader');
    loaders.forEach(loader => loader.remove());
  }

  function showError(message) {
    const modalContent = document.querySelector('#myModalDoc .modal-content');
    if (!modalContent) return;

    // Remove existing errors
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

  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Close modal on Escape key
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });

  // Close modal when clicking outside
  modal.addEventListener('click', function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });
});