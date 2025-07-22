// guardar-fiscalizacion.js
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mainForm');
    
    // Mapa de etapas a IDs
    const etapasMap = {
        "1er Requerimiento": 1,
        "2do Requerimiento": 2,
        "3ro Requerimiento": 3,
        "4to Requerimiento": 4,
        "Cierre": 5,
        "Reclamación": 6,
        "Apelación": 7,
        "Proceso": 8,
        "Contencioso": 9,
        "Finalizado": 10
    };
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Mostrar indicador de carga
        const submitButton = form.querySelector('.post');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
        submitButton.disabled = true;
        
        try {
            // Recoger datos del formulario
            const formData = {
                numero: document.getElementById('number').value,
                id_cliente: document.getElementById('empresa_id').value,
                fecha_notificacion: document.getElementById('fecha-notificacion').value,
                fecha_presentacion: document.getElementById('fecha-presentar').value,
                id_etapa: etapasMap[document.getElementById('etapa').value],
                periodo_inicio: formatPeriod(document.getElementById('periodo-inicio').value),
                periodo_final: formatPeriod(document.getElementById('periodo-fin').value),
                IGV: parseFloat(document.getElementById('IGV').value),
                supervisor_id: document.getElementById('supervisor_id').value,
                verificadores_ids: []
            };
            
            // Recoger IDs de verificadores
            document.querySelectorAll('.verificador-id').forEach(input => {
                if (input.value) {
                    formData.verificadores_ids.push(input.value);
                }
            });
            
            // Validar datos
            const validationErrors = validateForm(formData);
            if (validationErrors.length > 0) {
                showValidationErrors(validationErrors);
                return;
            }
            
            // Enviar datos al servidor
            const response = await fetch('registrar/guardar_fiscalizacion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showSuccess('Fiscalización guardada correctamente');
                // Opcional: resetear el formulario
                // form.reset();
            } else {
                showError('Error al guardar: ' + (result.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error de conexión: ' + error.message);
        } finally {
            // Restaurar el botón
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    });
    
    // Función para formatear período (de YYYY-MM a MMAAAA)
    function formatPeriod(period) {
        if (!period) return '';
        const [year, month] = period.split('-');
        return `${month}${year}`;
    }
    
    // Validar formulario
    function validateForm(formData) {
        const errors = [];
        
        if (!formData.numero) errors.push('El número de caso es requerido');
        if (!formData.id_cliente) errors.push('Debe seleccionar una empresa');
        if (!formData.fecha_notificacion) errors.push('La fecha de notificación es requerida');
        if (!formData.fecha_presentacion) errors.push('La fecha a presentar es requerida');
        if (!formData.id_etapa) errors.push('Debe seleccionar una etapa');
        if (!formData.periodo_inicio) errors.push('El período de inicio es requerido');
        if (!formData.periodo_final) errors.push('El período final es requerido');
        if (isNaN(formData.IGV)) errors.push('El IGV debe ser un número válido');
        if (!formData.supervisor_id) errors.push('Debe seleccionar un supervisor');
        if (formData.verificadores_ids.length === 0) errors.push('Debe agregar al menos un verificador');
        
        return errors;
    }
    
    // Mostrar errores de validación
    function showValidationErrors(errors) {
        // Crear contenedor de errores si no existe
        let errorContainer = document.getElementById('validation-errors');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'validation-errors';
            errorContainer.className = 'validation-errors';
            form.parentNode.insertBefore(errorContainer, form);
        }
        
        // Limpiar y mostrar errores
        errorContainer.innerHTML = `
            <div class="error-header">
                <i class="bi bi-exclamation-circle"></i> Errores de validación
            </div>
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
        
        // Scroll a los errores
        errorContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Mostrar mensaje de éxito
    function showSuccess(message) {
        // Eliminar errores anteriores
        const errorContainer = document.getElementById('validation-errors');
        if (errorContainer) errorContainer.remove();
        
        // Crear mensaje de éxito
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <div class="success-header">
                <i class="bi bi-check-circle"></i> ${message}
            </div>
        `;
        
        form.parentNode.insertBefore(successMessage, form);
        
        // Scroll al mensaje
        successMessage.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.remove();
            }
        }, 5000);
    }
    
    // Mostrar mensaje de error
    function showError(message) {
        // Crear mensaje de error
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <div class="error-header">
                <i class="bi bi-exclamation-triangle"></i> ${message}
            </div>
        `;
        
        form.parentNode.insertBefore(errorMessage, form);
        
        // Scroll al mensaje
        errorMessage.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.remove();
            }
        }, 5000);
    }
});