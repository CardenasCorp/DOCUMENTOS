// Obtener elementos para el modal de requerimientos
var modalDoc = document.getElementById("myModalDoc");
var btnDoc = document.getElementById("openModalButtonDoc");
var spanDoc = document.getElementById("closeModalDoc"); // Cierre único para el modal de requerimientos

// Cuando el usuario haga clic en el botón, se abre el modal
btnDoc.onclick = function() {
  modalDoc.style.display = "block";
}

// Cuando el usuario haga clic en el botón de cerrar (X), se cierra el modal
spanDoc.onclick = function() {
  modalDoc.style.display = "none";
}

// Cuando el usuario haga clic fuera del modal (en el fondo oscuro), también se cerrará
window.onclick = function(event) {
  if (event.target == modalDoc) {  // Verifica si se hizo clic fuera del contenido del modal
    modalDoc.style.display = "none";
  }
}

// Agregar el evento de teclado para cerrar el modal al presionar "Esc"
document.addEventListener("keydown", function(event) {
  if (event.key === "Escape") {  // Detecta si se presionó la tecla "Esc"
    modalDoc.style.display = "none";  // Cierra el modal
  }
});
