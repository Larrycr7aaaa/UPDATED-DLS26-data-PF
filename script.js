// ===========================================
// DLS 26 CARDS SPA
// API Local: dls26-cards.json
// ===========================================

const URL = './dls26-cards.json';

// ==============================
// VARIABLES DE DATOS Y PAGINACIÓN
// ==============================

let todosLosJugadores = [];
let jugadoresFiltrados = [];
let offset = 0;
const limite = 8;

// ==============================
// ELEMENTOS DEL DOM
// ==============================

const playerContainer = document.getElementById("playerContainer");
const detailContainer = document.getElementById("detailContainer");

const previousBtn = document.getElementById("previousBtn");
const nextBtn = document.getElementById("nextBtn");

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");

const playerCounter = document.getElementById("playerCounter");

// ==============================
// Mapeo de Colores por Posición
// ==============================

function obtenerClasePosicion(posicion) {
    if (!posicion) return "pos-default";
    const pos = posicion.toUpperCase();

    // Portero (Azul / Texto Blanco)
    if (["GK", "POR"].includes(pos)) return "pos-gk";

    // Delanteros (Rojo / Texto Blanco)
    if (["DC", "SD", "EI", "ED"].includes(pos)) return "pos-del";

    // Defensas (Verde / Texto Negro)
    if (["DFC", "LD", "LI"].includes(pos)) return "pos-def";

    // Mediocampistas y Carrileros (Naranja-Amarillo / Texto Negro)
    if (["MC", "CAI", "CAD", "MCO", "MCD"].includes(pos)) return "pos-med";

    return "pos-default";
}

// ==============================
// ESTADOS (LOADING / ERROR)
// ==============================

function mostrarLoading() {
    loading.classList.remove("hidden");
}

function ocultarLoading() {
    loading.classList.add("hidden");
}

function mostrarError(texto = "Jugador no encontrado.") {
    errorMessage.textContent = texto;
    errorMessage.classList.remove("hidden");

    setTimeout(() => {
        errorMessage.classList.add("hidden");
    }, 2500);
}

// ==============================
// OBTENER DATOS DE LA API
// ==============================

async function cargarDatosAPI() {
    mostrarLoading();

    try {
        const respuesta = await fetch(URL);
        if (!respuesta.ok) throw new Error("No se pudo cargar la API");

        todosLosJugadores = await respuesta.json();
        jugadoresFiltrados = [...todosLosJugadores];

        renderizarPaginaActual();
    } catch (error) {
        mostrarError("Error cargando la base de datos.");
    }

    ocultarLoading();
}

// ==============================
// RENDERIZAR PÁGINA
// ==============================

function renderizarPaginaActual() {
    playerContainer.innerHTML = "";
    playerCounter.textContent = `${jugadoresFiltrados.length} Jugadores`;

    if (jugadoresFiltrados.length === 0) {
        playerContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No se encontraron resultados.</p>`;
        return;
    }

    const corte = jugadoresFiltrados.slice(offset, offset + limite);
    corte.forEach(jugador => crearCard(jugador));

    previousBtn.disabled = offset === 0;
    nextBtn.disabled = offset + limite >= jugadoresFiltrados.length;
}

// ==============================
// TARJETAS
// ==============================

function crearCard(player) {
    const card = document.createElement("article");
    card.classList.add("card");

    const clasePosicion = obtenerClasePosicion(player.position);

    card.innerHTML = `
        <div class="card-body">
            <span class="id">#${player.year} • ${player.country.flag}</span>
            <h3>${player.name}</h3>
            <p><strong>${player.team}</strong></p>
            <span class="tipo ${clasePosicion}">${player.position}</span>
            <span class="tipo dark">${player.rating} OVR</span>
            <button>Ver Información</button>
        </div>
    `;

    card.querySelector("button").addEventListener("click", () => {
        mostrarDetalle(player);
    });

    playerContainer.appendChild(card);
}

// ==============================
// DETALLE DEL JUGADOR
// ==============================

function mostrarDetalle(player) {
    const posUpper = player.position ? player.position.toUpperCase() : "";
    const esPortero = posUpper === "GK" || posUpper === "POR";
    const clasePosicion = obtenerClasePosicion(player.position);

    let statsHTML = "";

    // Atributos Físicos
    statsHTML += renderBarraStat("Velocidad", player.stats.physical.speed);
    statsHTML += renderBarraStat("Aceleración", player.stats.physical.acceleration);
    if (!esPortero) {
        statsHTML += renderBarraStat("Resistencia", player.stats.physical.stamina);
    }
    statsHTML += renderBarraStat("Fuerza", player.stats.physical.strength);

    // Atributos Técnicos / Portería
    statsHTML += renderBarraStat("Control", player.stats.technical.control);
    statsHTML += renderBarraStat("Pases", player.stats.technical.passing);
    if (!esPortero) {
        statsHTML += renderBarraStat("Tiro", player.stats.technical.shooting);
    }
    statsHTML += renderBarraStat("Entrada", player.stats.technical.tackling);

    if (esPortero && player.stats.goalkeeping) {
        statsHTML += renderBarraStat("Reflejos", player.stats.goalkeeping.reflexes);
        statsHTML += renderBarraStat("Paradas", player.stats.goalkeeping.handling);
    }

    detailContainer.innerHTML = `
        <h2>${player.name} ${player.country.flag}</h2>
        <p><strong>Posición:</strong> <span class="tipo ${clasePosicion}">${player.position}</span> | <strong>Media:</strong> ${player.rating}</p>
        <p><strong>Equipo:</strong> ${player.team}</p>
        <p><strong>País:</strong> ${player.country.name}</p>
        <p><strong>Tipo de carta:</strong> ${player.cardType} (${player.year})</p>
        <p><strong>Pie preferido:</strong> ${player.preferredFoot} ${player.heightCm ? `| <strong>Altura:</strong> ${player.heightCm} cm` : ''}</p>

        <div class="stats">
            <h3>Atributos</h3>
            ${statsHTML}
        </div>
    `;
}

function renderBarraStat(label, valor) {
    if (valor === undefined) return '';
    return `
        <div class="stat">
            <div class="stat-header">
                <span>${label}</span>
                <span>${valor}</span>
            </div>
            <div class="progress">
                <span style="width: ${Math.min(valor, 100)}%;"></span>
            </div>
        </div>
    `;
}

// ==============================
// BUSCADOR EN TIEMPO REAL
// ==============================

function buscarJugador() {
    const busqueda = searchInput.value.trim().toLowerCase();

    jugadoresFiltrados = todosLosJugadores.filter(p =>
        p.name.toLowerCase().includes(busqueda) ||
        p.team.toLowerCase().includes(busqueda) ||
        p.country.name.toLowerCase().includes(busqueda) ||
        p.position.toLowerCase().includes(busqueda) ||
        p.cardType.toLowerCase().includes(busqueda)||
       p.rating.tLowerCase().includes(busqueda)                                           
    );

    offset = 0;
    renderizarPaginaActual();
}

// ==============================
// EVENTOS Y EVENT LISTENERS
// ==============================

searchButton.addEventListener("click", buscarJugador);

searchInput.addEventListener("keyup", () => {
    buscarJugador();
});

nextBtn.addEventListener("click", () => {
    if (offset + limite < jugadoresFiltrados.length) {
        offset += limite;
        renderizarPaginaActual();
    }
});

previousBtn.addEventListener("click", () => {
    if (offset - limite >= 0) {
        offset -= limite;
        renderizarPaginaActual();
    }
});

// INICIALIZAR
cargarDatosAPI();
