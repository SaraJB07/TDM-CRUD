import { getItems, getItem, createItem, updateItem, deleteItem } from "./services/api.js";
import { renderItems, resetForm, fillForm } from "./ui/ui.js";

const form = document.getElementById("itemForm");
const tableBody = document.getElementById("itemsTable");
const submitBtn = document.getElementById("submitBtn");

let editingId = null;
let originalItem = null;

function showMessage(text, type = "success", duration = 2000) {
    const msg = document.getElementById("mensajito");
    msg.textContent = text;
    msg.className = "";
    msg.classList.add(type, "show");
    setTimeout(() => msg.classList.remove("show"), duration);
}

function normalizeNumericInput(fieldId, value) {
    if (fieldId === "price") {
        const sanitized = value.replace(/[^0-9.]/g, "");
        const parts = sanitized.split(".");
        if (parts.length <= 1) return sanitized;
        return `${parts[0]}.${parts.slice(1).join("")}`;
    }

    if (fieldId === "stock") {
        return value.replace(/[^0-9]/g, "");
    }

    return value;
}

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

    const emptyField = requiredFields.find(field => !field.value);
    if (emptyField) {
        form.querySelector(`#${emptyField.id}`).classList.add("input-error");
        return { ok: false, message: `El campo "${emptyField.label}" es obligatorio` };
    }

    const price = Number.parseFloat(data.priceRaw);
    if (!Number.isFinite(price) || price <= 0) {
        form.querySelector("#price").classList.add("input-error");
        return { ok: false, message: "El precio debe ser mayor a 0." };
    }

    const stock = Number.parseInt(data.stockRaw, 10);
    if (!Number.isInteger(stock) || stock < 0) {
        form.querySelector("#stock").classList.add("input-error");
        return { ok: false, message: "El stock debe ser un numero entero positivo." };
    }

    return {
        ok: true,
        item: {
            name: data.name,
            description: data.description,
            price,
            stock,
            category: data.category,
            material: data.material,
            image: data.image
        }
    };
}

form.addEventListener("input", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.id === "price" || target.id === "stock") {
        target.value = normalizeNumericInput(target.id, target.value);
    }
});

tableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = Number(btn.dataset.id);

    if (btn.classList.contains("btn-delete")) {
        const result = await Swal.fire({
            title: "Eliminar item?",
            text: "Esta accion no se puede deshacer",
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

            const item = await getItem(id);
            fillForm(form, item, submitBtn);
            editingId = id;
            originalItem = item;
        } catch (err) {
            console.error("Error cargando item:", err);
            showMessage("No se pudo cargar el item para edicion.", "error");
        }
    }
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const validation = validateItemForm(getFormData());
    if (!validation.ok) {
        showMessage(validation.message, "error");
        return;
    }

    const { name, description, price, stock, category, material, image } = validation.item;

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

            const result = await Swal.fire({
                title: "Guardar cambios?",
                text: "Se actualizara la informacion del item",
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

