document.addEventListener('DOMContentLoaded', function() {
    // Elementos del modal
    const modal = document.getElementById('myModalEditEmpoyee');
    const openModalButtons = document.querySelectorAll('#openModalButtonEditEmpoyee');
    const closeModalButton = document.getElementById('closeModalEditEmpoyee');
    const firstNameInput = document.getElementById('f-name');
    const lastNameInput = document.getElementById('l-name');
    const acceptButton = document.querySelector('.accept-modal');
    
    // Función para abrir el modal
    function openModal(firstName = '', lastName = '') {
        firstNameInput.value = firstName;
        lastNameInput.value = lastName;
        modal.style.display = 'block';
    }
    
    // Función para cerrar el modal
    function closeModal() {
        modal.style.display = 'none';
    }
    
    // Evento para el botón Agregar (primer botón)
    openModalButtons[0].addEventListener('click', function() {
        openModal('', ''); // Modal vacío para nuevo empleado
    });
    
    // Eventos para los botones de edición
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            const employeeItem = this.closest('.employee-item');
            const firstName = employeeItem.querySelector('.first-name').textContent;
            const lastName = employeeItem.querySelector('.last-name').textContent;
            openModal(firstName, lastName);
        });
    });
    
    // Evento para cerrar el modal
    closeModalButton.addEventListener('click', closeModal);
    
    // Cerrar al hacer clic fuera del modal
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Evento para el botón Aceptar (aquí puedes agregar la lógica para guardar)
    acceptButton.addEventListener('click', function(e) {
        e.preventDefault();
        // Aquí iría la lógica para guardar los datos
        console.log('Nombre:', firstNameInput.value);
        console.log('Apellido:', lastNameInput.value);
        closeModal();
    });
});