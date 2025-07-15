// Obtener elementos para el modal de empresas
var modalBusiness = document.getElementById("myModalBusiness");
var btnBusiness = document.getElementById("openModalButtonBusiness");
var spanBusiness = document.getElementById("closeModalBusiness"); // Cierre único para el modal de empresas

// Cuando el usuario haga clic en el botón, se abre el modal
btnBusiness.onclick = function() {
  modalBusiness.style.display = "block";
}

// Cuando el usuario haga clic en el botón de cerrar (X), se cierra el modal
spanBusiness.onclick = function() {
  modalBusiness.style.display = "none";
}

// Cuando el usuario haga clic fuera del modal (en el fondo oscuro), también se cerrará
window.onclick = function(event) {
  if (event.target == modalBusiness) {  // Verifica si se hizo clic fuera del contenido del modal
    modalBusiness.style.display = "none";
  }
}

// Agregar el evento de teclado para cerrar el modal al presionar "Esc"
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {  // Detecta si se presionó la tecla "Esc"
    modalBusiness.style.display = "none";  // Cierra el modal
  }
});
