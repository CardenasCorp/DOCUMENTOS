// direct_load.js - Versión corregida
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 direct_load.js iniciado');
    
    // Obtener el ID del caso de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');
    
    console.log('📋 ID obtenido de URL:', caseId);
    
    if (!caseId) {
        showError('No se ha proporcionado un ID de caso');
        return;
    }

    // Cargar datos inmediatamente pero con checks de funciones
    loadCaseData(caseId);
});

async function loadCaseData(caseId) {
    console.log('🔄 Iniciando carga de datos para caso:', caseId);
    
    try {
        showLoading(true);
        
        // Hacer el fetch
        const response = await fetch(`../app/modificar/get_case_data.php?id=${caseId}`);
        console.log('📡 Response status:', response.status);
        
        const result = await response.json();
        console.log('📦 Datos recibidos:', result);

        if (result.success) {
            console.log('✅ Datos cargados exitosamente');
            await populateForm(result.data);
            showSuccess('Datos del caso cargados correctamente');
        } else {
            throw new Error(result.message || 'Error al cargar datos del caso');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showError('Error al cargar datos del caso: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function populateForm(data) {
    console.log('🛠️ Poblando formulario con datos:', data);
    
    const caso = data.caso;
    const agentes = data.agentes;
    
    // **CORRECCIÓN CRÍTICA: Establecer el ID_FISCALIZACION primero**
    if (caso.id_fiscalizacion) {
        // 1. Establecer en variable global para modificar-fiscalizacion.js
        window.currentDocumentId = caso.id_fiscalizacion;
        console.log('📝 currentDocumentId establecido:', caso.id_fiscalizacion);
        
        // 2. Establecer en el campo hidden del formulario
        const fiscalizacionIdInput = document.getElementById('fiscalizacion_id');
        if (fiscalizacionIdInput) {
            fiscalizacionIdInput.value = caso.id_fiscalizacion;
            console.log('✅ fiscalizacion_id establecido en formulario:', caso.id_fiscalizacion);
        } else {
            console.error('❌ Campo fiscalizacion_id no encontrado en el formulario');
        }
        
        // 3. Disparar evento para modificar-fiscalizacion.js
        document.dispatchEvent(new CustomEvent('documentSelected', {
            detail: { documentId: caso.id_fiscalizacion }
        }));
    } else {
        console.error('❌ id_fiscalizacion no viene en los datos:', caso);
    }

    // VERIFICACIÓN DE FUNCIONES CRÍTICAS
    console.log('🔍 Verificando funciones disponibles:');
    console.log('- setValue:', typeof window.setValue);
    console.log('- formatPeriodForInput:', typeof window.formatPeriodForInput);
    console.log('- toggleSections:', typeof window.toggleSections);
    console.log('- agregarVerificador:', typeof window.agregarVerificador);
    console.log('- agregarFuncionario:', typeof window.agregarFuncionario);

    // Función setValue mejorada con debug
    const debugSetValue = function(id, value) {
        const element = document.getElementById(id);
        console.log(`📝 SetValue: ${id} = ${value}`);
        if (element) {
            element.value = value ?? '';
            console.log(`✅ Campo ${id} actualizado`);
        } else {
            console.warn(`⚠️ Elemento no encontrado: ${id}`);
        }
    };

    // Función formatPeriodForInput mejorada con debug
    const debugFormatPeriod = function(period) {
        console.log(`📅 Formateando período: ${period}`);
        if (!period) return '';
        
        if (period.length === 6) {
            const formatted = `${period.substring(2, 6)}-${period.substring(0, 2)}`;
            console.log(`✅ Período formateado: ${period} → ${formatted}`);
            return formatted;
        }
        return period;
    };

    // USAR FUNCIONES EXISTENTES O DEBUG
    const setValue = window.setValue || debugSetValue;
    const formatPeriodForInput = window.formatPeriodForInput || debugFormatPeriod;

    // LLENAR CAMPOS BÁSICOS
    console.log('🔄 Llenando campos básicos...');
    
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
    // fiscalizacion_id ya se estableció arriba

    console.log('✅ Campos básicos llenados');

    // LLENAR TIPO - CON MEJOR MANEJO DE ERRORES
    if (caso.id_tipo) {
        console.log(`🎯 Configurando tipo: ${caso.id_tipo}`);
        
        const tipoMap = {
            1: "esquela",
            2: "FP-IGV", 
            3: "FT-IGV",
            4: "FP-RENTA",
            5: "FT-RENTA",
            6: "CRUCE"
        };
        
        const tipoValue = tipoMap[caso.id_tipo];
        console.log(`📋 Tipo mapeado: ${caso.id_tipo} → ${tipoValue}`);
        
        if (tipoValue) {
            const tipoSelect = document.getElementById('tipo');
            if (tipoSelect) {
                tipoSelect.value = tipoValue;
                console.log(`✅ Tipo seleccionado: ${tipoValue}`);
                
                // TOGGLE SECTIONS - MÁS ROBUSTO
                if (typeof window.toggleSections === 'function') {
                    console.log('🔄 Ejecutando toggleSections existente');
                    window.toggleSections();
                } else {
                    console.log('🔄 Ejecutando toggleSections fallback');
                    toggleSectionsFallback(tipoValue);
                }
            } else {
                console.error('❌ Elemento tipo no encontrado');
            }
        }
    }

    // LLENAR ESTADO
    if (caso.id_estado) {
        console.log(`🎯 Configurando estado: ${caso.id_estado}`);
        
        const estadoMap = {
            2: "Presentado",
            3: "Prorroga", 
            4: "Anulado"
        };
        
        const estadoValue = estadoMap[caso.id_estado];
        const estadoSelect = document.getElementById('estado-select');
        
        if (estadoSelect && estadoValue) {
            estadoSelect.value = estadoValue;
            console.log(`✅ Estado seleccionado: ${estadoValue}`);
            
            if (typeof window.toggleFechaFields === 'function') {
                window.toggleFechaFields();
            }
        }
    }

    // LLENAR ETAPA
    if (caso.id_etapa) {
        console.log(`🎯 Configurando etapa: ${caso.id_etapa}`);
        
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
        
        const etapaValue = etapaMap[caso.id_etapa];
        const etapaSelect = document.getElementById('etapa');
        
        if (etapaSelect && etapaValue) {
            etapaSelect.value = etapaValue;
            console.log(`✅ Etapa seleccionada: ${etapaValue}`);
        }
    }

    // PEQUEÑA PAUSA PARA QUE EL DOM SE ACTUALICE
    await new Promise(resolve => setTimeout(resolve, 100));

    // DETERMINAR QUÉ PERSONAL CARGAR
    const tipo = document.getElementById('tipo')?.value;
    console.log(`👥 Tipo detectado para personal: ${tipo}`);
    
    if (tipo === 'CRUCE') {
        console.log('🔧 Cargando funcionarios para CRUCE');
        await loadFuncionarios(agentes.funcionarios || []);
    } else {
        console.log('🔧 Cargando supervisor y verificadores');
        await loadSupervisorYVerificadores(agentes);
    }
    
    console.log('✅ Formulario poblado completamente');
}

// FUNCIÓN MEJORADA: Cargar supervisor y verificadores
async function loadSupervisorYVerificadores(agentes) {
    console.log('👨‍💼 Cargando supervisor y verificadores...');
    
    // SUPERVISOR
    if (agentes.supervisor) {
        console.log('🎯 Supervisor encontrado:', agentes.supervisor);
        
        const supervisorInput = document.getElementById('supervisor');
        const supervisorIdInput = document.getElementById('supervisor_id');
        
        if (supervisorInput) {
            supervisorInput.value = agentes.supervisor.nombre_completo || '';
            console.log('✅ Supervisor asignado:', agentes.supervisor.nombre_completo);
        }
        if (supervisorIdInput) {
            supervisorIdInput.value = agentes.supervisor.id_personal || '';
        }
    }

    // VERIFICADORES
    if (agentes.verificadores && agentes.verificadores.length > 0) {
        console.log(`🔍 ${agentes.verificadores.length} verificadores encontrados`);
        
        // Esperar por la función
        console.log('⏳ Esperando función agregarVerificador...');
        try {
            await waitForFunction('agregarVerificador', 2000);
            console.log('✅ agregarVerificador disponible');
            
            // Limpiar contenedor
            const container = document.querySelector('.verificador-container');
            if (container) {
                container.innerHTML = '';
                console.log('🧹 Contenedor de verificadores limpiado');
            }
            
            // Agregar verificadores
            agentes.verificadores.forEach((verificador, index) => {
                console.log(`👤 Agregando verificador ${index + 1}:`, verificador);
                if (typeof window.agregarVerificador === 'function') {
                    window.agregarVerificador(verificador.nombre_completo, verificador.id_personal);
                }
            });
            
        } catch (error) {
            console.error('❌ Error esperando agregarVerificador:', error);
            // Fallback manual
            agregarVerificadoresFallback(agentes.verificadores);
        }
    } else {
        console.log('⚠️ No hay verificadores, agregando uno vacío');
        if (typeof window.agregarVerificador === 'function') {
            window.agregarVerificador();
        }
    }
}

// FUNCIÓN MEJORADA: Cargar funcionarios para tipo CRUCE
async function loadFuncionarios(funcionarios) {
    console.log('👥 Cargando funcionarios...');
    
    console.log('⏳ Esperando función agregarFuncionario...');
    try {
        await waitForFunction('agregarFuncionario', 2000);
        console.log('✅ agregarFuncionario disponible');
        
        if (funcionarios && funcionarios.length > 0) {
            console.log(`🔍 ${funcionarios.length} funcionarios encontrados`);
            
            // Limpiar contenedor
            const container = document.querySelector('.funcionarios-container');
            if (container) {
                container.innerHTML = '';
                console.log('🧹 Contenedor de funcionarios limpiado');
            }
            
            // Agregar funcionarios
            funcionarios.forEach((funcionario, index) => {
                console.log(`👤 Agregando funcionario ${index + 1}:`, funcionario);
                if (typeof window.agregarFuncionario === 'function') {
                    window.agregarFuncionario(funcionario.nombre_completo, funcionario.id_personal);
                }
            });
        } else {
            console.log('⚠️ No hay funcionarios, agregando uno vacío');
            if (typeof window.agregarFuncionario === 'function') {
                window.agregarFuncionario();
            }
        }
    } catch (error) {
        console.error('❌ Error esperando agregarFuncionario:', error);
        // Fallback manual
        agregarFuncionariosFallback(funcionarios || []);
    }
}

// FUNCIONES AUXILIARES
function waitForFunction(functionName, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function checkFunction() {
            if (typeof window[functionName] === 'function') {
                resolve();
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Timeout esperando función: ${functionName}`));
            } else {
                setTimeout(checkFunction, 100);
            }
        }
        
        checkFunction();
    });
}

function toggleSectionsFallback(tipo) {
    console.log('🔄 Ejecutando toggleSections fallback para:', tipo);
    
    const supervisorSection = document.getElementById('supervisor-verificadores-section');
    const funcionariosSection = document.getElementById('funcionarios-section');
    
    if (!supervisorSection || !funcionariosSection) {
        console.error('❌ Secciones no encontradas para toggle');
        return;
    }
    
    if (tipo === 'CRUCE') {
        supervisorSection.classList.add('hidden');
        funcionariosSection.classList.remove('hidden');
        console.log('✅ CRUCE: Mostrando funcionarios, ocultando supervisor');
    } else {
        supervisorSection.classList.remove('hidden');
        funcionariosSection.classList.add('hidden');
        console.log('✅ No-CRUCE: Mostrando supervisor, ocultando funcionarios');
    }
}

// FALLBACKS MANUALES MEJORADOS
function agregarVerificadoresFallback(verificadores) {
    console.log('🛠️ Usando fallback manual para verificadores');
    const container = document.querySelector('.verificador-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    verificadores.forEach((verificador, index) => {
        const div = document.createElement('div');
        div.className = 'verificador-item';
        div.innerHTML = `
            <input type="hidden" name="verificadores[${index}][id]" value="${verificador.id_personal}" class="verificador-id">
            <input type="text" name="verificadores[${index}][nombre]" value="${verificador.nombre_completo}" 
                   class="verificador-name" placeholder="Nombre del verificador" readonly style="margin-right: 10px; padding: 8px; width: 200px;">
            <button type="button" class="search verificador-search" style="margin-right: 5px; padding: 8px 12px;">
                <i class="bi bi-search"></i>
            </button>
            <button type="button" class="delete" style="padding: 8px 12px;">
                <i class="bi bi-trash"></i>
            </button>
        `;
        container.appendChild(div);
    });
    
    console.log(`✅ ${verificadores.length} verificadores agregados manualmente`);
}

function agregarFuncionariosFallback(funcionarios) {
    console.log('🛠️ Usando fallback manual para funcionarios');
    const container = document.querySelector('.funcionarios-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    funcionarios.forEach((funcionario, index) => {
        const div = document.createElement('div');
        div.className = 'funcionario-item';
        div.innerHTML = `
            <input type="hidden" name="funcionarios[${index}][id]" value="${funcionario.id_personal}" class="funcionario-id">
            <input type="text" name="funcionarios[${index}][nombre]" value="${funcionario.nombre_completo}" 
                   class="funcionario-name" placeholder="Nombre del funcionario" readonly style="margin-right: 10px; padding: 8px; width: 200px;">
            <button type="button" class="search funcionario-search" style="margin-right: 5px; padding: 8px 12px;">
                <i class="bi bi-search"></i>
            </button>
            <button type="button" class="delete" style="padding: 8px 12px;">
                <i class="bi bi-trash"></i>
            </button>
        `;
        container.appendChild(div);
    });
    
    console.log(`✅ ${funcionarios.length} funcionarios agregados manualmente`);
}

// FUNCIONES DE UI MEJORADAS
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
        console.log(show ? '🔄 Loading mostrado' : '✅ Loading ocultado');
    }
}

function showSuccess(message) {
    console.log('✅ ' + message);
    alert('✅ ' + message);
}

function showError(message) {
    console.error('❌ ' + message);
    alert('❌ ' + message);
}   