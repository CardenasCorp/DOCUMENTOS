function agregarVerificador() {
            const verificadorContainer = document.getElementById('verificadores');

            const nuevoVerificadorDiv = document.createElement('div');
            nuevoVerificadorDiv.classList.add('verificador-container');

            // Crear un nuevo div 'space'
            var nuevoDiv = document.createElement('div');
            nuevoDiv.classList.add('space');

            // Añadir el div 'space' al contenedor de verificadores
            verificadorContainer.appendChild(nuevoDiv);

            // Crear el verificador (input y botones)
            const nuevoVerificador = document.createElement('div');
            nuevoVerificador.classList.add('input-container');

            // Crear los elementos del nuevo verificador
            const inputVerificador = document.createElement('input');
            inputVerificador.type = 'text';
            inputVerificador.name = `verificador1`;
            inputVerificador.placeholder = 'Nombre del verificador';
            inputVerificador.required = true;

            const dashButton = document.createElement('button');
            dashButton.type = 'button';
            dashButton.classList.add('dash');
            dashButton.innerHTML = '<i class="bi bi-dash"></i>';
            dashButton.onclick = () => eliminarVerificador(dashButton);

            const plusButton = document.createElement('button');
            plusButton.type = 'button';
            plusButton.classList.add('plus');
            plusButton.innerHTML = '<i class="bi bi-plus-lg"></i>';
            plusButton.onclick = agregarVerificador;

            // Agregar los elementos al nuevo verificador
            nuevoVerificador.appendChild(inputVerificador);
            nuevoVerificador.appendChild(dashButton);
            nuevoVerificador.appendChild(plusButton);

            // Añadir el nuevo verificador al contenedor
            nuevoVerificadorDiv.appendChild(nuevoVerificador);
            verificadorContainer.appendChild(nuevoVerificadorDiv);
        }

        // Función para eliminar un verificador y su div 'space'
        function eliminarVerificador(button) {
            const verificadorContainer = document.getElementById('verificadores');

            // Encuentra el contenedor 'verificador-container' más cercano al botón de dash
            const verificadorDiv = button.closest('.verificador-container');

            // Encuentra y elimina el 'div' con la clase 'space' asociado al verificador
            const spaceDiv = verificadorDiv.previousElementSibling; // Este es el div 'space'
            if (spaceDiv && spaceDiv.classList.contains('space')) {
                verificadorContainer.removeChild(spaceDiv);  // Eliminar el div 'space'
            }

            // Elimina el verificador
            verificadorContainer.removeChild(verificadorDiv);  // Eliminar el div 'verificador-container'
        }
