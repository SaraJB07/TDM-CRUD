const API_URL = "/api/items";

const catalogLayout = document.getElementById("catalogLayout");
const catalogContainer = document.getElementById("catalogContainer");
const itemDrawer = document.getElementById("itemDrawer");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");

const drawerImage = document.getElementById("drawerImage");
const drawerName = document.getElementById("drawerName");
const drawerDescription = document.getElementById("drawerDescription");
const drawerCategory = document.getElementById("drawerCategory");
const drawerMaterial = document.getElementById("drawerMaterial");
const drawerPrice = document.getElementById("drawerPrice");

async function loadCatalog() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error al cargar items");

        const items = await res.json();
        catalogContainer.innerHTML = "";
        items.forEach(renderItem);
    } catch (err) {
        console.error("Error cargando catalogo:", err);
        catalogContainer.innerHTML = "<div class='error'>No se pudo cargar el catalogo.</div>";
    }
}

function renderItem(item) {
    const card = document.createElement("article");
    card.className = "item-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    card.innerHTML = `
        <img src="${item.image || ""}" alt="${item.name}" class="item-image">
        <h2>${item.name || "Sin nombre"}</h2>
        <p class="item-description-card">${item.description || "Sin descripción"}</p>
        <p class="item-card-price"><strong>Precio:</strong> $${item.price || "0"}</p>
    `;

    card.addEventListener("click", () => openDrawer(item));
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDrawer(item);
        }
    });

    catalogContainer.appendChild(card);
}

function openDrawer(item) {
    drawerImage.src = item.image || "";
    drawerImage.alt = item.name || "Item";

    drawerName.textContent = item.name || "Sin nombre";
    drawerDescription.textContent = item.description || "Sin descripcion";
    drawerCategory.textContent = item.category || "Sin categoria";
    drawerMaterial.textContent = item.material || "Sin material";
    drawerPrice.textContent = item.price ?? "0";

    catalogLayout.classList.add("modal-open");
    itemDrawer.classList.add("open");
    itemDrawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
    catalogLayout.classList.remove("modal-open");
    itemDrawer.classList.remove("open");
    itemDrawer.setAttribute("aria-hidden", "true");
}

closeDrawerBtn.addEventListener("click", closeDrawer);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
});

loadCatalog();
