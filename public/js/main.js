import { getItems, getItem, createItem, updateItem, deleteItem } from "./services/api.js";
import { renderItems, resetForm, fillForm } from "./ui/ui.js";

const form = document.getElementById("itemForm");
const tableBody = document.getElementById("itemsTable");
const submitBtn = document.getElementById("submitBtn");
const modal = document.getElementById("customConfirm");

let editingId = null;
let originalItem = null;

//  Crea una promesa, hasta que el usuario elija
function confirmarAccion(titulo, mensaje, icono = "?") {
    return new Promise((resolve) => {
        document.getElementById("modalTitle").textContent = titulo;
        document.getElementById("modalMessage").textContent = mensaje;
        document.getElementById("modalIcon").textContent = icono;
        modal.showModal();
        document.getElementById("confirmBtn").onclick = () => {
            modal.close();
            resolve(true);
        };
        document.getElementById("cancelBtn").onclick = () => {
            modal.close();
            resolve(false);
        };
    });
}

// * Muestra alertas- errore temporales en pantalla
function showMessage(text, type = "success", duration = 2000) {
    const msg = document.getElementById("mensajito");
    msg.textContent = text;
    msg.className = "";
    msg.classList.add(type, "show");
    setTimeout(() => msg.classList.remove("show"), duration);
}

// No letras donde van números.
//  * Se ejecuta en tiempo real mientras el usuario escribe.
function normalizeNumericInput(fieldId, value) {
    if (fieldId === "price") {
        const sanitized = value.replace(/[^0-9.]/g, "");
        const parts = sanitized.split(".");
        if (parts.length <= 1) return sanitized;
        return `${parts[0]}.${parts.slice(1).join("")}`;
    }
    // solo números enteros
    if (fieldId === "stock") return value.replace(/[^0-9]/g, "");
    return value;
}

// No números donde van letras (Categoría)
function normalizeAlphaInput(value) {
    return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "");
}

// Recolecta los datos
function getFormData() {
    return {
        name: form.querySelector("#name").value.trim(),
        description: form.querySelector("#description").value.trim(),
        priceRaw: form.querySelector("#price").value.trim(),
        stockRaw: form.querySelector("#stock").value.trim(),
        category: form.querySelector("#category").value.trim(),
        material: form.querySelector("#material").value.trim(),
        image: form.querySelector("#image").value.trim()
    };
}

// *No campos vacíos y Si números sean lógicos.
function validateItemForm(data) {
    const requiredFields = [
        { id: "name", value: data.name, label: "Nombre del item" },
        { id: "description", value: data.description, label: "Descripcion" },
        { id: "price", value: data.priceRaw, label: "Precio" },
        { id: "stock", value: data.stockRaw, label: "Stock" },
        { id: "category", value: data.category, label: "Categoria" },
        { id: "material", value: data.material, label: "Material" },
        { id: "image", value: data.image, label: "Link de imagen" }
    ];
    form.querySelectorAll("input, textarea").forEach(field => field.classList.remove("input-error"));
    // Todos los espacios vacios
    const todosVacios = requiredFields.every(field => !field.value);
    if (todosVacios) {
        //el borde rojo a cada espacio
        form.querySelectorAll("input, textarea").forEach(field => field.classList.add("input-error"));
        // FORMULARIO TIEMBLa Y SE PONe ROJO
        form.classList.add("form-error-vibrar");
        // 3. para que pueda repetirse cada 0.3s)
        setTimeout(() => form.classList.remove("form-error-vibrar"), 300);
        return { ok: false, message: "Todos los espacios están vacíos." };
    }
    // Busca si algún campo obligatorio está vacío
    const emptyField = requiredFields.find(field => !field.value);
    if (emptyField) {
        form.querySelector(`#${emptyField.id}`).classList.add("input-error");
        return { ok: false, message: `El campo "${emptyField.label}" es obligatorio` };
    }
    // Categoría solo letras
    const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
    if (!regexLetras.test(data.category)) {
        form.querySelector("#category").classList.add("input-error");
        return { ok: false, message: "La categoría solo puede contener letras." };
    }
    //precio positivo
    const price = Number.parseFloat(data.priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
        form.querySelector("#price").classList.add("input-error");
        return { ok: false, message: "El precio debe ser mayor a 0." };
    }
    // stock entero
    const stock = Number.parseInt(data.stockRaw, 10);
    if (!Number.isInteger(stock) || stock < 0) {
        form.querySelector("#stock").classList.add("input-error");
        return { ok: false, message: "El stock debe ser un numero entero positivo." };
    }
    return { ok: true, item: { ...data, price, stock } };
}

form.addEventListener("input", (e) => {
    if (e.target.id === "price" || e.target.id === "stock") {
        e.target.value = normalizeNumericInput(e.target.id, e.target.value);
    }
    // Solo letras en categoría
    if (e.target.id === "category") {
        e.target.value = normalizeAlphaInput(e.target.value);
    }
});

// Borrar y Editar de la tabla
tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    // ELIMINAR
    if (btn.classList.contains("btn-delete")) {
        // CAMBIADO: Ahora usa confirmarAccion en lugar de Swal
        if (await confirmarAccion("¿Eliminar item?", "Esta accion no se puede deshacer", "!")) {
            try {
                await deleteItem(id);
                showMessage("Item eliminado correctamente");
                loadItems();
            } catch { showMessage("Error al eliminar", "error"); }
        }
        // EDITAR
    } else if (btn.classList.contains("btn-edit")) {
        const item = await getItem(id);
        fillForm(form, item, submitBtn);
        editingId = id;
        originalItem = item;
        // AGRANDAR FORMULARIO AL EDITAR
        form.classList.add("form-editando", "animar-pulso");
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => form.classList.remove("animar-pulso"), 500);
    }
});

// Crear o Actualizar
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const validation = validateItemForm(getFormData());
    if (!validation.ok) return showMessage(validation.message, "error");
    const { name, description, price, stock, category, material, image } = validation.item;
    try {
        if (editingId) {
            // Comprobamos si hubo cambios reales
            const Cambios = name !== originalItem.name || description !== originalItem.description ||
                price !== originalItem.price || stock !== originalItem.stock ||
                category !== originalItem.category || material !== originalItem.material ||
                image !== originalItem.image;
            if (!Cambios) {
                form.classList.remove("form-editando");
                showMessage("No se realizaron cambios.", "warning");
                editingId = null;
                resetForm(form, submitBtn);
                return;
            }
            // --- AQUÍ ESTÁ LA PREGUNTA ---
            // Usamos await para que el código se DETENGA hasta que presiones un botón del modal
            const userConfirmó = await confirmarAccion("¿Guardar cambios?", "Se actualizará la informacion del item", "?");
            if (userConfirmó) {
                await updateItem(editingId, { name, description, price, stock, category, material, image });
                showMessage("Item actualizado correctamente");
                editingId = null;
                form.classList.remove("form-editando");
                resetForm(form, submitBtn);
                loadItems();
            } 
            // Si userConfirmó es false, no hace nada (se queda en el formulario)
            return; 
        } else {
            // Crear item nuevo
            await createItem({ name, description, price, stock, category, material, image });
            showMessage("Item agregado correctamente");
            resetForm(form, submitBtn);
            loadItems();
        }
    } catch { showMessage("Error al guardar", "error"); }
});

// Carga inicial de datos
async function loadItems() {
    const items = await getItems();
    renderItems(items, tableBody);
}
loadItems();

