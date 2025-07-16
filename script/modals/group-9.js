function toggleFechaFields() {
    const estadoSelect = document.getElementById('estado-select');
    const fechaPresentado = document.getElementById('fecha-presentado');
    const fechaProrroga = document.getElementById('fecha-prórroga');
    
    // Reset ambos campos
    fechaPresentado.disabled = true;
    fechaProrroga.disabled = true;
    fechaPresentado.value = '';
    fechaProrroga.value = '';
    
    // Habilitar el campo correspondiente
    if (estadoSelect.value === 'Presentado') {
        fechaPresentado.disabled = false;
        fechaPresentado.required = true;
        fechaProrroga.required = false;
    } else if (estadoSelect.value === 'Prorroga') {
        fechaProrroga.disabled = false;
        fechaProrroga.required = true;
        fechaPresentado.required = false;
    }
}