// Obtener elementos para el modal de requerimientos
var modalRequest = document.getElementById("myModalRequest");
var btnRequest = document.getElementById("openModalButtonRequest");
var spanRequest = document.getElementById("closeModalRequest"); // Cierre único para el modal de requerimientos

// Cuando el usuario haga clic en el botón, se abre el modal
btnRequest.onclick = function() {
  modalRequest.style.display = "block";
}

// Cuando el usuario haga clic en el botón de cerrar (X), se cierra el modal
spanRequest.onclick = function() {
  modalRequest.style.display = "none";
}

// Cuando el usuario haga clic fuera del modal (en el fondo oscuro), también se cerrará
window.onclick = function(event) {
  if (event.target == modalRequest) {  // Verifica si se hizo clic fuera del contenido del modal
    modalRequest.style.display = "none";
  }
}

// Agregar el evento de teclado para cerrar el modal al presionar "Esc"
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {  // Detecta si se presionó la tecla "Esc"
    modalRequest.style.display = "none";  // Cierra el modal
  }
});
