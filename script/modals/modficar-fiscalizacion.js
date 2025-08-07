document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.form-container');
    let currentDocumentId = null;

    // Mapeos para estados y etapas
    const estadoMap = {
        "Presentado": 2,
        "Prorroga": 3,
        "Anulado": 4
    };
    
    const etapaMap = {
        "1er Requerimiento": 1,
        "2do Requerimiento": 2,
        "3ro Requerimiento": 3,
        "4to Requerimiento": 4,
        "Cierre": 5,
        "Reclamación": 6,
        "Apelación": 7,
        "Proceso Contencioso": 8,
        "Finalizado": 10
    };

    // Función para verificar duplicados
    function hayDuplicados() {
        const idsVerificadores = new Set();
        let mensajeError = '';
        
        // Recolectar todos los IDs de verificadores
        const verificadores = [];
        document.querySelectorAll('.verificador-container:not(.add-verificador)').forEach(container => {
            const id = container.querySelector('.verificador-id').value;
            if (id) verificadores.push(id);
        });
        
        // Buscar duplicados entre verificadores
        const duplicados = verificadores.filter((id, index) => verificadores.indexOf(id) !== index);
        if (duplicados.length > 0) {
            mensajeError = "Error: Tienes verificadores duplicados. Un empleado no puede ser verificador múltiples veces.";
        }
        
        // Verificar si supervisor es también verificador
        const supervisorId = document.getElementById('supervisor_id').value;
        if (supervisorId && verificadores.includes(supervisorId)) {
            mensajeError = mensajeError ? `${mensajeError}\n` : '';
            mensajeError += "Error: El supervisor no puede ser también verificador.";
        }
        
        return mensajeError || false;
    }

    // Función para formatear período (MMyyyy)
    function formatPeriodToDB(period) {
        if (!period) return '';
        const [year, month] = period.split('-');
        return `${month}${year}`;
    }

    // Evento de envío del formulario
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentDocumentId) {
            alert('No hay un documento seleccionado para actualizar');
            return;
        }

        // Validar duplicados antes de enviar
        const errorDuplicados = hayDuplicados();
        if (errorDuplicados) {
            alert(errorDuplicados);
            return;
        }

        // Recolectar verificadores
        const verificadores = [];
        document.querySelectorAll('.verificador-container:not(.add-verificador)').forEach(container => {
            const id = container.querySelector('.verificador-id').value;
            const nombre = container.querySelector('.verificador-name').value;
            if (id && nombre) {
                verificadores.push({
                    id_personal: id,
                    nombre_completo: nombre
                });
            }
        });

        // Preparar payload
        const payload = {
            id_fiscalizacion: currentDocumentId,
            numero: document.getElementById('number').value,
            fecha_notificacion: document.getElementById('fecha-notificacion').value,
            fecha_presentacion: document.getElementById('fecha-presentar').value,
            id_estado: estadoMap[document.getElementById('estado-select').value],
            fecha_prorroga: document.getElementById('fecha-prórroga').value || null,
            id_etapa: etapaMap[document.getElementById('etapa').value],
            periodo_inicio: formatPeriodToDB(document.getElementById('periodo-inicio').value),
            periodo_final: formatPeriodToDB(document.getElementById('periodo-fin').value),
            IGV: parseFloat(document.getElementById('IGV').value),
            id_cliente: document.getElementById('empresa_id').value,
            supervisor_id: document.getElementById('supervisor_id').value,
            verificadores: verificadores,
            ...(document.getElementById('estado-select').value === 'Presentado' && {
                fecha_presentado: document.getElementById('fecha-presentado').value
            })
        };

        // Enviar datos
        try {
            const response = await fetch('modificar/update_document.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error al actualizar el documento');
            }
            
            alert('Documento actualizado correctamente');
            
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al actualizar: ${error.message}`);
        }
    });

    // Escuchar evento cuando se selecciona un documento
    document.addEventListener('documentSelected', function(e) {
        currentDocumentId = e.detail.documentId;
    });
});