document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('mainForm');

    // Mapa de etapas a IDs
    const etapasMap = {
        "1er Requerimiento": 1,
        "2do Requerimiento": 2,
        "3ro Requerimiento": 3,
        "4to Requerimiento": 4,
        "5to Requerimiento": 11,
        "6to Requerimiento": 12,
        "7mo Requerimiento": 13,
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
            // Mostrar campo para etapas que NO son 1er Requerimiento
            requerimientoContainer.style.display = 'block';
            requerimientoBtn.disabled = false;
            document.getElementById('requerimiento').required = true;
        } else {
            // Ocultar campo para 1er Requerimiento
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

        form.addEventListener('submit', handleSubmit);
    }

    // Manejar el envío del formulario
    async function handleSubmit(e) {
        e.preventDefault();

        // Mostrar indicador de carga
        const submitButton = form.querySelector('.post');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
        submitButton.disabled = true;

        try {
            // Validar antes de enviar
            const validationErrors = validateBeforeSubmit();
            if (validationErrors.length > 0) {
                showValidationErrors(validationErrors);
                return;
            }

            // Recoger datos del formulario
            const formData = prepareFormData();

            // Enviar al servidor
            const response = await fetch('registrar/guardar_fiscalizacion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                showSuccess('Fiscalización guardada correctamente. ID: ' + result.id_fiscalizacion);
            } else {
                showError(result.message || 'Error al guardar la fiscalización');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión: ' + error.message);
        } finally {
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }

    // Validar antes de enviar
    function validateBeforeSubmit() {
        const errors = [];
        const etapa = document.getElementById('etapa').value;
        const idPadre = document.getElementById('id_fiscalizacion_padre').value;

        // Validación específica para requerimiento padre
        if (etapa !== '1er Requerimiento' && !idPadre) {
            errors.push('Debe seleccionar un requerimiento padre para esta etapa');
        }

        if (etapa === '1er Requerimiento' && idPadre) {
            errors.push('No se puede asignar requerimiento padre al 1er Requerimiento');
        }

        // Otras validaciones básicas
        if (!document.getElementById('number').value) {
            errors.push('El número de caso es requerido');
        }

        if (!document.getElementById('empresa_id').value) {
            errors.push('Debe seleccionar una empresa');
        }

        // Validar según el tipo (CRUCE vs otros)
        const tipo = document.getElementById('tipo').value;
        if (tipo === 'CRUCE') {
            // Validar funcionarios para CRUCE
            const funcionariosIds = getFuncionariosIds();
            if (funcionariosIds.length === 0) {
                errors.push('Debe agregar al menos un funcionario para casos de tipo CRUCE');
            }
        } 
        return errors;
    }

    // Preparar los datos del formulario
    function prepareFormData() {
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

        // Diferente manejo según el tipo
        if (tipo === 'CRUCE') {
            data.funcionarios_ids = getFuncionariosIds();
        } else {
            data.supervisor_id = document.getElementById('supervisor_id').value;
            data.verificadores_ids = getVerificadoresIds();
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

    // Mostrar mensaje de éxito (CORREGIDO)
    function showSuccess(message) {
        // Limpiar errores previos
        const errorContainer = document.getElementById('validation-errors');
        if (errorContainer) errorContainer.remove();

        // Mostrar alerta
        alert(message);

        // Redirigir al index después de 500ms (medio segundo)
        setTimeout(() => {
            window.location.href = '../index.php'; // Ajusta esta ruta según tu estructura
        }, 500);
    }

    // Mostrar mensaje de error
    function showError(message) {
        // Limpiar errores previos
        const errorContainer = document.getElementById('validation-errors');
        if (errorContainer) errorContainer.remove();

        // Crear mensaje de error
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