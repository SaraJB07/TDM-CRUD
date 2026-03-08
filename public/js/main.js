import { getItems, getItem, createItem, updateItem, deleteItem } from "./services/api.js";
import { renderItems, resetForm, fillForm } from "./ui/ui.js";

const form = document.getElementById("itemForm");
const tableBody = document.getElementById("itemsTable");
const submitBtn = document.getElementById("submitBtn");

let editingId = null;
let originalItem = null;

// MOSTRAR MENSAJES AUTOMÁTICOS
function showMessage(text, type = "success", duration = 2000) {
    const msg = document.getElementById("mensajito");
    msg.textContent = text;
    msg.className = ""; 
    msg.classList.add(type, "show"); 
    setTimeout(() => msg.classList.remove("show"), duration);
}

// EVENTOS DE TABLA
tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = Number(btn.dataset.id);






    if (btn.classList.contains("btn-delete")) {

    const result = await Swal.fire({
        title: "¿Eliminar item?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",

        customClass: {
            popup: "mi-popup",
            confirmButton: "btn-eliminar",
            cancelButton: "btn-cancelar",
            title: "titulo-alerta",
            htmlContainer: "texto-alerta"
        },

        buttonsStyling: false
    });

    if (!result.isConfirmed) return;

    try {
        await deleteItem(id);
        showMessage("Item eliminado correctamente", "success");
        loadItems();
    } catch (err) {
        console.error("Error eliminando:", err);
        showMessage("No se pudo eliminar el item.", "error");
    }





} else if (btn.classList.contains("btn-edit")) {
        try {
            if (editingId === id) {
                resetForm(form, submitBtn);
                editingId = null;
                originalItem = null;
                return;
            }

            // Solo cargar datos en el formulario, sin confirmación
            const item = await getItem(id);
            fillForm(form, item, submitBtn);
            editingId = id;
            originalItem = item;
        } catch (err) {
            console.error("Error cargando item:", err);
            showMessage("No se pudo cargar el item para edición.", "error");
        }
    }
});

// ENVÍO DEL FORMULARIO
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // VALIDACIÓN DE CAMPOS VACÍOS CON BORDE ROJO
    const inputs = form.querySelectorAll("input");
    let camposVacios = false;

    inputs.forEach(input => input.classList.remove("input-error"));

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add("input-error");
            showMessage(`El campo "${input.placeholder}" es obligatorio`, "error");
            camposVacios = true;
        }
    });

    if (camposVacios) return;

    // OBTENER VALORES
    const name = form.querySelector("#name").value.trim();
    const description = form.querySelector("#description").value.trim();
    const price = parseFloat(form.querySelector("#price").value);
    const stock = parseInt(form.querySelector("#stock").value);
    const category = form.querySelector("#category").value.trim();
    const material = form.querySelector("#material").value.trim();
    const image = form.querySelector("#image").value.trim();

    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;

    // VALIDACIONES ESPECÍFICAS
    if (isNaN(price) || price <= 0) {
        showMessage("El precio debe ser mayor a 0.", "error");
        return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
        showMessage("El stock debe ser un número entero positivo.", "error");
        return;
    }

    if (!soloLetras.test(category)) {
        showMessage("La categoría solo debe contener letras.", "error");
        return;
    }

    if (!soloLetras.test(material)) {
        showMessage("El material solo debe contener letras.", "error");
        return;
    }

    try {

    if (editingId) {

        const huboCambios =
            name !== originalItem.name ||
            description !== originalItem.description ||
            price !== originalItem.price ||
            stock !== originalItem.stock ||
            category !== originalItem.category ||
            material !== originalItem.material ||
            image !== originalItem.image;

        if (!huboCambios) {
            showMessage("No se realizaron cambios.", "warning");
            return;
        }

        // CONFIRMAR EDICIÓN
        const result = await Swal.fire({
            title: "¿Guardar cambios?",
            text: "Se actualizará la información del item",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Guardar",
            cancelButtonText: "Cancelar",
            customClass: {
                popup: "mi-popup",
                confirmButton: "btn-editar",
                cancelButton: "btn-cancelar",
                title: "titulo-alerta",
                htmlContainer: "texto-alerta"
            },
            buttonsStyling: false
        });

        if (!result.isConfirmed) return;

        await updateItem(editingId, { name, description, price, stock, category, material, image });

        editingId = null;
        originalItem = null;

        showMessage("Item actualizado correctamente", "success");

    } else {

        // CREAR NUEVO ITEM
        await createItem({ name, description, price, stock, category, material, image });

        showMessage("Item agregado correctamente", "success");
    }

    resetForm(form, submitBtn);
    loadItems();

} catch (err) {

    console.error("Error guardando item:", err);
    showMessage("No se pudo guardar el item.", "error");

}
});

// CARGAR ITEMS
async function loadItems() {
    try {
        const items = await getItems();
        renderItems(items, tableBody);
    } catch (err) {
        console.error("Error cargando lista:", err);
        showMessage("No se pudieron cargar los items.", "error");
    }
}


loadItems(); 