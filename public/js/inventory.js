'use strict' 

// Envuelve todo el código en un evento DOMContentLoaded.
// Esto garantiza que el script solo se ejecute cuando todos los elementos HTML
// (incluido el selector #classificationList) estén cargados y disponibles.
document.addEventListener("DOMContentLoaded", function () {
    
    // Obtener el selector de clasificaciones
    let classificationList = document.querySelector("#classificationList")
    
    if (classificationList) {
        // Añadir el listener de cambio
        classificationList.addEventListener("change", function () { 
            let classification_id = classificationList.value 
            console.log(`[Cliente JS] ID de clasificación seleccionado: ${classification_id}`) 
            
            // Si el valor es vacío (la opción "Choose a Classification"), no hacemos nada
            if (!classification_id) {
                document.getElementById("inventoryDisplay").innerHTML = '<p class="text-gray-500 mt-4">Please select a classification above to see the inventory list.</p>';
                return;
            }

            let classIdURL = "/inv/getInventory/"+classification_id 
            
            fetch(classIdURL) 
            .then(function (response) { 
                if (response.ok) { 
                    return response.json(); 
                } 
                throw Error("Network response was not OK or server failed to return data."); 
            }) 
            .then(function (data) { 
                console.log("[Cliente JS] Datos JSON recibidos:", data); 
                buildInventoryList(data); 
            }) 
            .catch(function (error) { 
                console.error('[Cliente JS] Hubo un problema: ', error.message)
                document.getElementById("inventoryDisplay").innerHTML = `<p class="text-red-500 mt-4">Error al cargar el inventario: ${error.message}</p>`;
            }) 
        })
    } else {
        console.error("[Cliente JS] Elemento #classificationList no encontrado en el DOM.");
    }
})


// Build inventory items into HTML table components and inject into DOM 
function buildInventoryList(data) { 
    let inventoryDisplay = document.getElementById("inventoryDisplay"); 
    
    if (!inventoryDisplay) return;

    if (!data || data.length === 0) {
        inventoryDisplay.innerHTML = '<p class="text-gray-600 mt-4">No se encontraron vehículos para esta clasificación.</p>';
        return;
    }

    // ***************************************************************
    // FIX CRÍTICO: Añadir la etiqueta inicial <table>
    // ***************************************************************
    let dataTable = '<table class="min-w-full divide-y divide-gray-200 shadow-lg mt-4">'; 
    
    // Set up the table labels 
    dataTable += '<thead class="bg-gray-50">'; 
    dataTable += '<tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Name</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modify</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th></tr>'; 
    dataTable += '</thead>'; 
    
    // Set up the table body 
    dataTable += '<tbody class="bg-white divide-y divide-gray-200">'; 
    
    // Iterate over all vehicles in the array and put each in a row 
    data.forEach(function (element) { 
        console.log(element.inv_id + ", " + element.inv_model); 
        dataTable += `
            <tr class="hover:bg-indigo-50 transition duration-150">
                <td class="px-6 py-4 whitespace-nowrap">${element.inv_make} ${element.inv_model}</td>
                <td class="px-6 py-4 whitespace-nowrap"><a href='/inv/edit/${element.inv_id}' title='Click to update' class="text-indigo-600 hover:text-indigo-900 font-medium">Modify</a></td>
                <td class="px-6 py-4 whitespace-nowrap"><a href='/inv/delete/${element.inv_id}' title='Click to delete' class="text-red-600 hover:text-red-900 font-medium">Delete</a></td>
            </tr>`; 
    }) 
    dataTable += '</tbody>'; 
    
    // ***************************************************************
    // FIX CRÍTICO: Añadir la etiqueta de cierre </table>
    // ***************************************************************
    dataTable += '</table>';
    
    // Display the contents in the Inventory Management view 
    inventoryDisplay.innerHTML = dataTable; 
}