document.addEventListener('DOMContentLoaded', function () {
    // Obtener el ID del caso de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');
    
    if (!caseId) {
        showError('No se ha proporcionado un ID de caso');
        return;
    }

    // Cargar datos del caso
    loadCaseData(caseId);
});

async function loadCaseData(caseId) {
    try {
        showLoading(true);
        const response = await fetch(`../app/modificar/get_case_data.php?id=${caseId}`);
        const result = await response.json();

        if (result.success) {
            populateForm(result.data);
            showSuccess('Datos del caso cargados correctamente');
        } else {
            throw new Error(result.message || 'Error al cargar datos del caso');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar datos del caso: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function populateForm(data) {
    const caso = data.caso;
    const agentes = data.agentes;
    
    // Llenar campos básicos
    setValue('number', caso.numero || '');
    setValue('requerimiento', caso.numero_padre || 'N/A');
    setValue('empresa_input', caso.razon_social || '');
    setValue('empresa_id', caso.id_cliente || '');
    setValue('empresa_ruc', caso.RUC || '');
    setValue('empresa_direccion', caso.direccion_fiscal || '');
    setValue('empresa_departamento', caso.departamento || '');
    setValue('fecha-notificacion', caso.fecha_notificacion || '');
    setValue('fecha-presentar', caso.fecha_presentacion || '');
    setValue('fecha-prórroga', caso.fecha_prorroga || '');
    setValue('IGV', caso.IGV || '0');
    setValue('periodo-inicio', formatPeriodForInput(caso.periodo_inicio) || '');
    setValue('periodo-fin', formatPeriodForInput(caso.periodo_final) || '');

    // Llenar tipo
    if (caso.id_tipo) {
        const tipoMap = {
            1: "esquela",
            2: "FP-IGV", 
            3: "FT-IGV",
            4: "FP-RENTA",
            5: "FT-RENTA"
        };
        
        const tipoValue = tipoMap[caso.id_tipo];
        if (tipoValue) {
            document.getElementById('tipo').value = tipoValue;
        }
    }

    // Llenar estado
    if (caso.id_estado) {
        const estadoMap = {
            2: "Presentado",
            3: "Prorroga",
            4: "Anulado"
        };
        
        const estadoSelect = document.getElementById('estado-select');
        if (estadoSelect) {
            estadoSelect.value = estadoMap[caso.id_estado] || '';
            if (typeof toggleFechaFields === 'function') {
                toggleFechaFields();
            }
        }
    }

    // Llenar etapa
    if (caso.id_etapa) {
        const etapaMap = {
            1: "1er Requerimiento",
            2: "2do Requerimiento",
            3: "3ro Requerimiento",
            4: "4to Requerimiento",
            5: "Cierre",
            6: "Reclamación",
            7: "Apelación",
            8: "Proceso Contencioso",
            10: "Finalizado"
        };
        
        const etapaSelect = document.getElementById('etapa');
        if (etapaSelect) {
            etapaSelect.value = etapaMap[caso.id_etapa] || '';
        }
    }

    // Llenar supervisor
    if (agentes.supervisor) {
        setValue('supervisor', agentes.supervisor.nombre_completo || '');
        setValue('supervisor_id', agentes.supervisor.id_personal || '');
    }

    // Llenar verificadores
    if (agentes.verificadores && agentes.verificadores.length > 0) {
        // Limpiar verificadores existentes
        const verificadoresContainer = document.getElementById('verificadores');
        verificadoresContainer.querySelectorAll('.verificador-container:not(.add-verificador)').forEach(c => c.remove());
        
        // Agregar verificadores
        agentes.verificadores.forEach(verificador => {
            if (typeof modificarVerificador === 'function') {
                modificarVerificador(verificador.nombre_completo, verificador.id_personal);
            }
        });
    }
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? '';
}

function formatPeriodForInput(period) {
    return period?.length === 6 ? `${period.substring(2, 6)}-${period.substring(0, 2)}` : '';
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showSuccess(message) {
    // Implementar según tu sistema de notificaciones
    console.log('Éxito:', message);
    // Puedes mostrar una notificación bonita aquí
}

function showError(message) {
    // Implementar según tu sistema de notificaciones
    console.error('Error:', message);
    // Puedes mostrar una notificación de error aquí
    alert('Error: ' + message);
}