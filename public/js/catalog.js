// Script base para la vista de catálogo
// Aquí deben consumir la API de items y mostrarlos en la página

// Constante con la URL base de la API
const API_URL = "/api/items";

const catalogContainer = document.getElementById("catalogContainer");

// Función principal para cargar los items desde la API
async function loadCatalog() {
    try {
        // 1. Hacer fetch a la API (GET /api/items)
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error al cargar items");
        const items = await res.json();

        // 2. Limpiar el contenedor del catálogo
        catalogContainer.innerHTML = "";

        // 3. Iterar sobre cada item y llamar a renderItem()
        items.forEach(renderItem);
    } catch (err) {
        console.error("Error cargando catálogo:", err);
        catalogContainer.innerHTML = `<div class='error'>No se pudo cargar el catálogo.</div>`;
    }
}

// Función para renderizar un item en el catálogo
function renderItem(item) {
    // Crear un elemento div para la card
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
        <h2>${item.name}</h2>
        <p><strong>Descripción:</strong> ${item.description}</p>
        <p><strong>Categoría:</strong> ${item.category}</p>
        <p><strong>Material:</strong> ${item.material}</p>
        <p><strong>Precio:</strong> $${item.price}</p>
        <p><strong>Stock:</strong> ${item.stock}</p>
    `;
    catalogContainer.appendChild(card);
}

// Inicializar el catálogo cuando cargue la página
loadCatalog();