const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzzkU969B-wGjgtz629fTk1aJ_hrUQosvwLvIIiVpVXzgCJQIpXA2bjeXmlql1KIsGHwA/exec"; 

// Estructura fija de los 8 emojis solicitados
const EMOJIS_ESTRUCTURA = [
  "🗓️",
  "📌",
  "👖",
  "👚",
  "🧥",
  "👠",
  "👛",
  "💇"
];

document.addEventListener("DOMContentLoaded", () => {
  cargarOpcionesDesplegables();
});

function cambiarVista(vista) {
  document.getElementById("vista-inicio").classList.add("oculto");
  document.getElementById("vista-entrada").classList.add("oculto");
  document.getElementById("vista-salida").classList.add("oculto");

  if (vista === 'inicio') {
    document.getElementById("vista-inicio").classList.remove("oculto");
  } else if (vista === 'entrada') {
    document.getElementById("vista-entrada").classList.remove("oculto");
  } else if (vista === 'salida') {
    document.getElementById("vista-salida").classList.remove("oculto");
  }
}

// Cargar dinámicamente las opciones de la hoja 'opciones' y registros desde Google Sheets
async function cargarOpcionesDesplegables() {
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();

    window.registrosTotalesArmario = data.registrosArmario || [];

    const opciones = data.opciones || { destino: [], pants: [], shoes: [], bag: [] };

    llenarSelect("select-destino", opciones.destino);
    llenarSelect("select-pants", opciones.pants);
    llenarSelect("select-shoes", opciones.shoes);
    llenarSelect("select-bag", opciones.bag);

    llenarSelect("filtro-destino", opciones.destino, "-- Todos --");
    llenarSelect("filtro-pants", opciones.pants, "-- Todos --");
    llenarSelect("filtro-shoes", opciones.shoes, "-- Todos --");
    llenarSelect("filtro-bag", opciones.bag, "-- Todos --");

  } catch (err) {
    console.error("Error al cargar opciones:", err);
  }
}

function llenarSelect(idElemento, lista, textoDefault = "-- Selecciona --") {
  const select = document.getElementById(idElemento);
  if (!select) return;
  select.innerHTML = `<option value="">${textoDefault}</option>`;
  lista.forEach(item => {
    select.innerHTML += `<option value="${item}">${item}</option>`;
  });
}

// Lógica de Conversión en Entrada
function convertirDatos() {
  let fechaInput = document.getElementById("input-fecha").value.trim();
  if (fechaInput === "") {
    fechaInput = "SF";
  }

  const destino = document.getElementById("select-destino").value || "";
  const pants = document.getElementById("select-pants").value || "";
  const shirt = document.getElementById("input-shirt").value || "";
  const jersey = document.getElementById("input-jersey").value || "";
  const shoes = document.getElementById("select-shoes").value || "";
  const bag = document.getElementById("select-bag").value || "";
  const hair = document.getElementById("input-hair").value || "";

  const textoConvertido = 
    `${EMOJIS_ESTRUCTURA[0]} ${fechaInput}\n` +
    `${EMOJIS_ESTRUCTURA[1]} ${destino}\n` +
    `${EMOJIS_ESTRUCTURA[2]} ${pants}\n` +
    `${EMOJIS_ESTRUCTURA[3]} ${shirt}\n` +
    `${EMOJIS_ESTRUCTURA[4]} ${jersey}\n` +
    `${EMOJIS_ESTRUCTURA[5]} ${shoes}\n` +
    `${EMOJIS_ESTRUCTURA[6]} ${bag}\n` +
    `${EMOJIS_ESTRUCTURA[7]} ${hair}`;

  document.getElementById("texto-convertido-final").value = textoConvertido;
  document.getElementById("area-conversion").classList.remove("oculto");
}

function limpiarEntrada() {
  document.getElementById("form-entrada").reset();
  document.getElementById("area-conversion").classList.add("oculto");
  document.getElementById("estado-guardado-entrada").innerText = "";
}

// Guardar en Sheets (Hoja 'armario')
async function guardarEnSheetsArmario() {
  const estado = document.getElementById("estado-guardado-entrada");
  estado.innerText = "Guardando en Sheets...";

  const textoConvertido = document.getElementById("texto-convertido-final").value;

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "guardarArmario",
        textoConvertido: textoConvertido
      })
    });
    const resultado = await res.json();

    if (resultado.status === "success") {
      estado.innerText = "¡Guardado exitosamente en la hoja armario!";
      limpiarEntrada();
      cargarOpcionesDesplegables();
    } else {
      estado.innerText = "Error al guardar.";
    }
  } catch (err) {
    estado.innerText = "Error de conexión con Sheets.";
  }
}

// Lógica de Salida / Filtros con Rango de Fechas (Calendarios)
function limpiarFiltrosSalida() {
  document.getElementById("filtro-fecha-desde").value = "";
  document.getElementById("filtro-fecha-hasta").value = "";
  document.getElementById("filtro-destino").value = "";
  document.getElementById("filtro-pants").value = "";
  document.getElementById("filtro-shoes").value = "";
  document.getElementById("filtro-bag").value = "";
  document.getElementById("resultados-busqueda-container").classList.add("oculto");
}

function ejecutarBusquedaSalida() {
  const valDesde = document.getElementById("filtro-fecha-desde").value; // Viene en formato "aaaa-mm-dd" del input date
  const valHasta = document.getElementById("filtro-fecha-hasta").value; // Viene en formato "aaaa-mm-dd" del input date
  
  const destinoFiltro = document.getElementById("filtro-destino").value.toLowerCase().trim();
  const pantsFiltro = document.getElementById("filtro-pants").value.toLowerCase().trim();
  const shoesFiltro = document.getElementById("filtro-shoes").value.toLowerCase().trim();
  const bagFiltro = document.getElementById("filtro-bag").value.toLowerCase().trim();

  const contenedorResultados = document.getElementById("resultados-busqueda-container");
  const listaContenedor = document.getElementById("lista-resultados-salida");
  
  contenedorResultados.classList.remove("oculto");
  listaContenedor.innerHTML = "";

  const registros = window.registrosTotalesArmario || [];

  // Función para convertir fecha de texto guardado "dd/mm/aa" a objeto Date
  function parsearFechaArmario(textoFecha) {
    if (!textoFecha || textoFecha === "SF") return null;
    const partes = textoFecha.split("/");
    if (partes.length !== 3) return null;
    let dia = parseInt(partes[0], 10);
    let mes = parseInt(partes[1], 10) - 1;
    let anio = parseInt(partes[2], 10);
    if (anio < 100) anio += 2000;
    return new Date(anio, mes, dia);
  }

  // Objetos Date para el filtro de calendario (los inputs date devuelven aaaa-mm-dd exactos para el objeto Date)
  const fechaDesdeObj = valDesde ? new Date(valDesde + "T00:00:00") : null;
  const fechaHastaObj = valHasta ? new Date(valHasta + "T23:59:59") : null;

  const filtrados = registros.filter(reg => {
    const regLower = reg.toLowerCase();

    // 1. Filtrar por Rango de Fechas del Calendario
    let cumpleFecha = true;
    if (fechaDesdeObj || fechaHastaObj) {
      const lineas = reg.split("\n");
      let fechaRegStr = "";
      for (let l of lineas) {
        if (l.includes("🗓️")) {
          fechaRegStr = l.replace("🗓️", "").trim();
          break;
        }
      }
      
      const fechaRegObj = parsearFechaArmario(fechaRegStr);

      if (!fechaRegObj) {
        cumpleFecha = false;
      } else {
        if (fechaDesdeObj && fechaRegObj < fechaDesdeObj) cumpleFecha = false;
        if (fechaHastaObj && fechaRegObj > fechaHastaObj) cumpleFecha = false;
      }
    }

    // 2. Filtrar por los demás elementos desplegables
    const cumpleDestino = !destinoFiltro || regLower.includes(destinoFiltro);
    const cumplePants = !pantsFiltro || regLower.includes(pantsFiltro);
    const cumpleShoes = !shoesFiltro || regLower.includes(shoesFiltro);
    const cumpleBag = !bagFiltro || regLower.includes(bagFiltro);

    return cumpleFecha && cumpleDestino && cumplePants && cumpleShoes && cumpleBag;
  });

  if (filtrados.length === 0) {
    listaContenedor.innerHTML = '<p style="text-align: center; color: #666;">No se encontraron registros que coincidan con los filtros y el rango de fechas.</p>';
    return;
  }

  filtrados.forEach(reg => {
    const div = document.createElement("div");
    div.className = "card-resultado-item";
    div.textContent = reg;
    listaContenedor.appendChild(div);
  });
}
