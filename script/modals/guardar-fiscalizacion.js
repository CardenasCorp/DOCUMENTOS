/**
 * script/guardar-fiscalizacion-integrado.js
 * Maneja el guardado en BD y subida a Drive en secuencia
 */

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('mainForm');
    /*
    // ⚠️ Configuración Drive - Actualiza con tus valores reales
    const DRIVE_CONFIG = {
        ngrokUrl: 'https://beula-aortal-undiscernably.ngrok-free.dev',
        apiToken: 'aB3xK9mP2qR7sT4vW8yZ1nL5jH6gF0dC'
    };
    */
    
    // Mapa de etapas a IDs
    const etapasMap = {
        "1er Requerimiento": 1,
        "2do Requerimiento": 2,
        "3ro Requerimiento": 3,
        "4to Requerimiento": 4,
        "5to Requerimiento": 11,
        "6to Requerimiento": 12,
        "7mo Requerimiento": 13,
        "Coactiva x R": 14,
        "Coactiva x TF": 15,
        "Coactiva sin R": 16,
        "Cierre": 5,
        "Reclamación": 6,
        "Apelación": 7,
        "Proceso Contencioso": 8,
        "Finalizado": 10
    };

    // Controlar visibilidad del campo requerimiento
    function toggleRequerimientoField() {
        const etapa = document.getElementById('etapa').value;
        const requerimientoContainer = document.querySelector('.requerimiento');
        const requerimientoBtn = document.getElementById('openModalButtonRequest');

        if (etapa !== '1er Requerimiento') {
            requerimientoContainer.style.display = 'block';
            requerimientoBtn.disabled = false;
            document.getElementById('requerimiento').required = true;
        } else {
            requerimientoContainer.style.display = 'none';
            requerimientoBtn.disabled = true;
            document.getElementById('requerimiento').required = false;
            document.getElementById('requerimiento').value = '';
            document.getElementById('id_fiscalizacion_padre').value = '';
        }
    }

    // Inicializar y configurar event listeners
    function init() {
        toggleRequerimientoField(); // Estado inicial
        document.getElementById('etapa').addEventListener('change', toggleRequerimientoField);
        /*
        // Agregar campo de archivos si no existe
        addFileInputField();
        */
        // Configurar el único manejador del formulario
        form.addEventListener('submit', handleSubmitIntegrated);
    }

    /* Agregar campo para subir archivos
    function addFileInputField() {
        // Verificar si ya existe
        if (document.getElementById('documentos')) return;
        
        const submitButton = form.querySelector('button[type="submit"]');
        
        const fileUploadSection = document.createElement('div');
        fileUploadSection.className = 'form-group-4';
        fileUploadSection.innerHTML = `
            <div class="form-control file-upload">
                <label for="documentos">
                    📎 Documentos (Opcional)
                    <small style="color: #666; font-weight: normal;">
                        - Puedes seleccionar uno o varios archivos
                    </small>
                </label>
                <input type="file" 
                       id="documentos" 
                       name="documentos[]" 
                       accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                       multiple
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                <small style="color: #999; display: block; margin-top: 5px;">
                    Los archivos se subirán automáticamente a Google Drive después de guardar
                </small>
                <div id="filePreview" style="margin-top: 10px;"></div>
            </div>
        `;

        form.insertBefore(fileUploadSection, submitButton);
        
        // Configurar preview de archivos
        document.getElementById('documentos').addEventListener('change', showFilePreview);
    }
    */
    // Mostrar preview de archivos seleccionados
    /*function showFilePreview() {
        const fileInput = document.getElementById('documentos');
        const previewDiv = document.getElementById('filePreview');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            previewDiv.innerHTML = '';
            return;
        }

        let html = '<div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">';
        html += `<strong>Archivos seleccionados (${fileInput.files.length}):</strong><ul style="margin: 5px 0; padding-left: 20px;">`;
        
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            const sizeMB = (file.size / 1024 / 1024).toFixed(2);
            html += `<li>${file.name} <small style="color: #666;">(${sizeMB} MB)</small></li>`;
        }
        
        html += '</ul></div>';
        previewDiv.innerHTML = html;
    }
    */
    // Manejador integrado del formulario
    async function handleSubmitIntegrated(e) {
        e.preventDefault();

        // Mostrar indicador de carga
        const submitButton = form.querySelector('.post');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Validando...';
        submitButton.disabled = true;

        try {
            // 1. Validar datos del formulario
            const validationErrors = validateBeforeSubmit();
            if (validationErrors.length > 0) {
                showValidationErrors(validationErrors);
                return;
            }

            // 2. Preparar datos para BD
            const formDataForDB = prepareFormDataForDB();
            
            // 3. Guardar en Base de Datos
            submitButton.innerHTML = '<i class="bi bi-database"></i> Guardando en BD...';
            
            const dbResult = await saveToDatabase(formDataForDB);
            
            if (!dbResult.success) {
                throw new Error(dbResult.message || 'Error al guardar en base de datos');
            }

            console.log('✅ Registro guardado en BD. ID:', dbResult.id_fiscalizacion);

            /*
           // 4. Subir archivos a Drive (si hay)
            const fileInput = document.getElementById('documentos');
            if (fileInput.files && fileInput.files.length > 0) {
                submitButton.innerHTML = '<i class="bi bi-cloud-upload"></i> Subiendo archivos...';
                
                // Obtener el RUC del campo oculto
                const ruc = document.getElementById('empresa_ruc').value;
                if (!ruc) {
                    throw new Error('No se encontró el RUC de la empresa');
                }
                
                const driveResult = await uploadFilesToDrive(fileInput.files, formDataForDB, ruc);
                
                // Mostrar resultado combinado
                showFinalResult(dbResult, driveResult);
            } else {
                // Solo mostrar resultado de BD
                showFinalResult(dbResult, null);
            }
            */
        } catch (error) {
            console.error('❌ Error en el proceso:', error);
            
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            showError('Error: ' + error.message);
        }
    }

    // Guardar en base de datos
    async function saveToDatabase(formData) {
        try {
            const response = await fetch('registrar/guardar_fiscalizacion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error('Error de conexión con la base de datos: ' + error.message);
        }
    }
    /*
    // Subir archivos a Drive
    async function uploadFilesToDrive(files, formData, ruc) {
        // Preparar FormData para Drive
        const driveFormData = new FormData();
        
        // Agregar TODOS los archivos
        for (let i = 0; i < files.length; i++) {
            driveFormData.append('files', files[i]);
        }
        
        // Agregar datos necesarios para la estructura de carpetas
        // Usar el RUC del campo oculto en lugar de id_cliente
        driveFormData.append('ruc', ruc);
        driveFormData.append('etapa', getEtapaName(formData.id_etapa));
        driveFormData.append('numero_requerimiento', formData.numero);
        
        if (formData.id_fiscalizacion_padre) {
            driveFormData.append('requerimiento_principal', formData.id_fiscalizacion_padre);
        }

        console.log(`📤 Subiendo ${files.length} archivo(s) a Drive...`);
        console.log('📋 Datos para Drive:', {
            ruc: ruc,
            etapa: getEtapaName(formData.id_etapa),
            numero_requerimiento: formData.numero
        });

        try {
            const response = await fetch(`${DRIVE_CONFIG.ngrokUrl}/api/v1/create-and-upload`, {
                method: 'POST',
                headers: {
                    'api_token': DRIVE_CONFIG.apiToken
                },
                body: driveFormData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error al subir archivos');
            }

            return result;

        } catch (error) {
            console.error('❌ Error al subir a Drive:', error);
            throw error;
        }
    }
    */
    // Obtener nombre de etapa a partir del ID
    function getEtapaName(etapaId) {
        for (const [name, id] of Object.entries(etapasMap)) {
            if (id == etapaId) return name;
        }
        return 'Sin Etapa';
    }

    // Validar antes de enviar - MODIFICADA: Sin verificador obligatorio
    function validateBeforeSubmit() {
        const errors = [];
        const etapa = document.getElementById('etapa').value;
        const idPadre = document.getElementById('id_fiscalizacion_padre').value;

        // Validación de requerimiento padre
        if (etapa !== '1er Requerimiento' && !idPadre) {
            errors.push('Debe seleccionar un requerimiento padre para esta etapa');
        }

        if (etapa === '1er Requerimiento' && idPadre) {
            errors.push('No se puede asignar requerimiento padre al 1er Requerimiento');
        }

        // Validaciones básicas
        if (!document.getElementById('number').value) {
            errors.push('El número de caso es requerido');
        }

        if (!document.getElementById('empresa_id').value) {
            errors.push('Debe seleccionar una empresa');
        }

        const tipo = document.getElementById('tipo').value;
        if (tipo === 'CRUCE') {
            const funcionariosIds = getFuncionariosIds();
            if (funcionariosIds.length === 0) {
                errors.push('Debe agregar al menos un funcionario para casos de tipo CRUCE');
            }
        } else {
            // MODIFICACIÓN: El supervisor sigue siendo obligatorio, pero verificadores es opcional
            if (!document.getElementById('supervisor_id').value) {
                errors.push('Debe seleccionar un supervisor');
            }
            // Verificadores es opcional, no hay validación
        }

        return errors;
    }

    // Preparar datos para BD
    function prepareFormDataForDB() {
        const etapa = document.getElementById('etapa').value;
        const tipo = document.getElementById('tipo').value;

        const data = {
            numero: document.getElementById('number').value,
            id_cliente: document.getElementById('empresa_id').value,
            cliente: document.getElementById('cliente_input').value,
            fecha_notificacion: document.getElementById('fecha-notificacion').value,
            fecha_presentacion: document.getElementById('fecha-presentar').value,
            id_etapa: etapasMap[etapa],
            periodo_inicio: formatPeriod(document.getElementById('periodo-inicio').value),
            periodo_final: formatPeriod(document.getElementById('periodo-fin').value),
            IGV: parseFloat(document.getElementById('IGV').value) || 0,
            tipo: tipo,
            id_fiscalizacion_padre: (etapa !== '1er Requerimiento')
                ? document.getElementById('id_fiscalizacion_padre').value
                : null
        };

        if (tipo === 'CRUCE') {
            data.funcionarios_ids = getFuncionariosIds();
        } else {
            data.supervisor_id = document.getElementById('supervisor_id').value;
            data.verificadores_ids = getVerificadoresIds(); // Puede estar vacío
        }

        return data;
    }

    // Obtener IDs de funcionarios
    function getFuncionariosIds() {
        const ids = [];
        document.querySelectorAll('.funcionario-id').forEach(input => {
            if (input.value) ids.push(input.value);
        });
        return ids;
    }

    // Obtener IDs de verificadores
    function getVerificadoresIds() {
        const ids = [];
        document.querySelectorAll('.verificador-id').forEach(input => {
            if (input.value) ids.push(input.value);
        });
        return ids;
    }

    // Formatear período (de YYYY-MM a MMAAAA)
    function formatPeriod(period) {
        if (!period) return '';
        const [year, month] = period.split('-');
        return `${month}${year}`;
    }

    // Mostrar resultado final combinado
    
    function showFinalResult(dbResult, driveResult) {
        let message = `✅ Fiscalización guardada correctamente\n`;
        message += `📋 ID del caso: ${dbResult.id_fiscalizacion}\n\n`;
        /*
        if (driveResult) {
            const uploadedFiles = driveResult.uploaded_files || [];
            message += `☁️ ${uploadedFiles.length} archivo(s) subido(s) a Google Drive\n`;
            
            if (driveResult.folders && driveResult.folders.etapa) {
                message += `📁 Carpeta: ${driveResult.folders.final_folder_path}\n`;
                
                // Mostrar archivos subidos
                if (uploadedFiles.length > 0) {
                    message += '\nArchivos subidos:\n';
                    uploadedFiles.forEach((file, index) => {
                        message += `  ${index + 1}. ${file.name}\n`;
                    });
                }
                
                message += '\n¿Desea ver los archivos en Google Drive?';
                
                if (confirm(message)) {
                    // Abrir carpeta en nueva pestaña
                    window.open(driveResult.folders.etapa.webViewLink, '_blank');
                    
                    // Redirigir después de un momento
                    setTimeout(() => {
                        window.location.href = 'list-case.php';
                    }, 1000);
                    return;
                }
            }
        } else {
            message += '📎 No se subieron archivos a Drive\n';
        }
        */
        // Si no hay Drive o usuario no quiere ver archivos
        alert(message);
        setTimeout(() => {
            window.location.href = 'list-case.php';
        }, 1000);
    }
    
    // Mostrar errores de validación
    function showValidationErrors(errors) {
        let errorContainer = document.getElementById('validation-errors');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'validation-errors';    
            errorContainer.className = 'validation-errors';
            form.parentNode.insertBefore(errorContainer, form);
        }

        errorContainer.innerHTML = `
            <div class="error-header">
                <i class="bi bi-exclamation-circle"></i> Errores de validación
            </div>
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;

        errorContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Restaurar el botón de enviar
        const submitButton = form.querySelector('.post');
        submitButton.innerHTML = 'Guardar';
        submitButton.disabled = false;
    }

    // Mostrar mensaje de error
    function showError(message) {
        const errorContainer = document.getElementById('validation-errors');
        if (errorContainer) errorContainer.remove();

        const errorMessage = document.createElement('div');
        errorMessage.id = 'validation-errors';
        errorMessage.className = 'validation-errors';
        errorMessage.innerHTML = `
            <div class="error-header">
                <i class="bi bi-exclamation-circle"></i> Error
            </div>
            <div>${message}</div>
        `;

        form.parentNode.insertBefore(errorMessage, form);
        errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    // Inicializar la aplicación
    init();
});