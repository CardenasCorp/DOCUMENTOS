document.addEventListener('DOMContentLoaded', function () {
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

    // Mapeo para tipos
    const tipoMap = {
        "esquela": 1,
        "FP-IGV": 2,
        "FT-IGV": 3,
        "FP-RENTA": 4,
        "FT-RENTA": 5,
        "CRUCE": 6
    };

    // Función para verificar duplicados
    function hayDuplicados() {
        const tipo = document.getElementById('tipo').value;
        let mensajeError = '';

        if (tipo === 'CRUCE') {
            // Validar funcionarios para CRUCE
            const idsFuncionarios = new Set();
            const funcionarios = [];

            document.querySelectorAll('.funcionario-item').forEach(item => {
                const id = item.querySelector('.funcionario-id').value;
                if (id) funcionarios.push(id);
            });

            // Buscar duplicados entre funcionarios
            const duplicados = funcionarios.filter((id, index) => funcionarios.indexOf(id) !== index);
            if (duplicados.length > 0) {
                mensajeError = "Error: Tienes funcionarios duplicados. Un empleado no puede ser funcionario múltiples veces.";
            }

        } else {
            // Validar verificadores y supervisor para otros tipos
            const idsVerificadores = new Set();
            const verificadores = [];

            document.querySelectorAll('.verificador-item').forEach(item => {
                const id = item.querySelector('.verificador-id').value;
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
        }

        return mensajeError || false;
    }

    // Función para formatear período (MMyyyy)
    function formatPeriodToDB(period) {
        if (!period) return '';
        const [year, month] = period.split('-');
        return `${month}${year}`;
    }

    // Función para recolectar agentes según el tipo
    function recolectarAgentes() {
        const tipo = document.getElementById('tipo').value;

        if (tipo === 'CRUCE') {
            // Recolectar funcionarios para CRUCE
            const funcionarios = [];
            document.querySelectorAll('.funcionario-item').forEach(item => {
                const id = item.querySelector('.funcionario-id').value;
                const nombre = item.querySelector('.funcionario-name').value;
                if (id && nombre) {
                    funcionarios.push({
                        id_personal: id,
                        nombre_completo: nombre,
                        cargo: 'funcionario'
                    });
                }
            });
            return { funcionarios };

        } else {
            // Recolectar supervisor y verificadores para otros tipos
            const supervisorId = document.getElementById('supervisor_id').value;
            const supervisorNombre = document.getElementById('supervisor').value;

            const verificadores = [];
            document.querySelectorAll('.verificador-item').forEach(item => {
                const id = item.querySelector('.verificador-id').value;
                const nombre = item.querySelector('.verificador-name').value;
                if (id && nombre) {
                    verificadores.push({
                        id_personal: id,
                        nombre_completo: nombre,
                        cargo: 'verificador'
                    });
                }
            });

            return {
                supervisor: supervisorId ? {
                    id_personal: supervisorId,
                    nombre_completo: supervisorNombre,
                    cargo: 'supervisor'
                } : null,
                verificadores
            };
        }
    }

    // Evento de envío del formulario
    form.addEventListener('submit', async function (e) {
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

        // Recolectar agentes según el tipo
        const agentes = recolectarAgentes();
        const tipo = document.getElementById('tipo').value;

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
            IGV: parseFloat(document.getElementById('IGV').value) || 0,
            id_cliente: document.getElementById('empresa_id').value,
            id_tipo: tipoMap[tipo],
            agentes: agentes,
            ...(document.getElementById('id_fiscalizacion_padre').value && {
                id_fiscalizacion_padre: document.getElementById('id_fiscalizacion_padre').value
            })
        };

        if (document.getElementById('estado-select').value === 'Presentado') {
            const fechaPresentado = document.getElementById('fecha-presentado').value;
            if (fechaPresentado) {
                payload.fecha_presentado = fechaPresentado;
            } else {
                alert('Error: Cuando el estado es "Presentado", debe ingresar la fecha de presentación');
                return;
            }
        }
        // Validaciones adicionales
        if (tipo !== 'CRUCE') {
            if (!payload.agentes.supervisor) {
                alert('Error: Debe seleccionar un supervisor');
                return;
            }
            if (payload.agentes.verificadores.length === 0) {
                alert('Error: Debe agregar al menos un verificador');
                return;
            }
        } else {
            if (payload.agentes.funcionarios.length === 0) {
                alert('Error: Debe agregar al menos un funcionario para casos de tipo CRUCE');
                return;
            }
        }

        // Mostrar loading
        const submitButton = form.querySelector('.post');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Guardando...';
        submitButton.disabled = true;

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

            if (result.success) {
                alert('Documento actualizado correctamente');
                // Opcional: recargar los datos para ver los cambios
                document.dispatchEvent(new CustomEvent('documentSelected', {
                    detail: { documentId: currentDocumentId }
                }));
            } else {
                throw new Error(result.message || 'Error al actualizar el documento');
            }

        } catch (error) {
            console.error('Error:', error);
            alert(`Error al actualizar: ${error.message}`);
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    });

    // Escuchar evento cuando se selecciona un documento
    document.addEventListener('documentSelected', function (e) {
        currentDocumentId = e.detail.documentId;
    });

    // Validar requerimiento padre para etapas que no son 1er Requerimiento
    function validarRequerimientoPadre() {
        const etapa = document.getElementById('etapa').value;
        const idPadre = document.getElementById('id_fiscalizacion_padre').value;

        if (etapa !== '1er Requerimiento' && !idPadre) {
            alert('Para esta etapa debe seleccionar un requerimiento padre');
            return false;
        }

        if (etapa === '1er Requerimiento' && idPadre) {
            alert('No se puede asignar requerimiento padre al 1er Requerimiento');
            return false;
        }

        return true;
    }

    // Agregar validación antes del envío
    form.addEventListener('submit', function (e) {
        if (!validarRequerimientoPadre()) {
            e.preventDefault();
            return false;
        }
    });
});