/**
 * Mi Visa593 — Guardar casos del formulario en una hoja de cálculo
 * ================================================================
 *
 * Recibe cada caso de mivisaec.com/empezar/, lo guarda como una fila,
 * le asigna un código único y arma los links listos para copiar.
 *
 * INSTALACIÓN (una sola vez)
 *  1. Hoja nueva en https://sheets.new, nómbrala "Casos Mi Visa593".
 *  2. Extensiones → Apps Script. Borra todo y pega este archivo.
 *  3. Implementar → Nueva implementación → Aplicación web.
 *       Ejecutar como: Yo
 *       Quién tiene acceso: Cualquier persona   <-- IMPORTANTE
 *  4. Copia la URL que termina en /exec y pégala en empezar/index.html,
 *     en ENDPOINT_GUARDADO.
 *
 * AL ACTUALIZAR ESTE ARCHIVO: Implementar → Gestionar implementaciones
 * → editar (lápiz) → Versión: Nueva versión → Implementar.
 * Así la URL NO cambia.
 */

var SITIO = "https://mivisaec.com";

/** Orden de las columnas. Para añadir una, agrégala aquí. */
var COLUMNAS = [
  ["fecha",           "Fecha"],
  ["codigo",          "Código"],
  ["nombre",          "Nombre"],
  ["telefono",        "WhatsApp"],
  ["correo",          "Correo"],
  ["destino",         "País destino"],
  ["link_pago",       "Link de pago"],
  ["link_expediente", "Link del expediente"],
  ["carpeta",         "Carpeta de documentos"],
  ["personas",        "Personas"],
  ["semaforo",        "Semáforo"],
  ["puntos",          "Puntos"],
  ["a_favor",         "A favor"],
  ["en_contra",       "En contra"],
  ["pais_schengen",   "País Schengen"],
  ["aplico_antes",    "¿Aplicó antes?"],
  ["cuando_negada",   "¿Hace cuánto la negaron?"],
  ["cambio_algo",     "¿Cambió algo?"],
  ["viajes",          "Viajes previos"],
  ["trabajo",         "Situación laboral"],
  ["antiguedad",      "Antigüedad"],
  ["ingresos",        "Acredita ingresos"],
  ["dependientes",    "Dependientes"],
  ["pareja",          "Pareja"],
  ["bienes",          "Bienes"],
  ["pasaporte",       "Pasaporte"],
  ["cuando",          "Cuándo viaja"],
  ["consentimiento",  "Consentimiento"]
];

/* Campos que debe traer un caso de verdad, para descartar basura. */
var OBLIGATORIOS = ["nombre", "telefono", "destino", "semaforo"];
var SEMAFOROS = ["verde", "ambar", "rojo"];

/* Sin caracteres que se confundan al dictarlos: nada de O/0, I/1, L. */
var ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!e || !e.postData || e.postData.contents.length > 8000) {
      return responder({ ok: false, error: "Envio invalido" });
    }
    var datos = JSON.parse(e.postData.contents);

    for (var i = 0; i < OBLIGATORIOS.length; i++) {
      var c = OBLIGATORIOS[i];
      if (!datos[c] || typeof datos[c] !== "string") {
        return responder({ ok: false, error: "Falta el campo " + c });
      }
    }
    if (SEMAFOROS.indexOf(String(datos.semaforo).toLowerCase()) === -1) {
      return responder({ ok: false, error: "Semaforo invalido" });
    }

    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Encabezados, solo la primera vez
    if (hoja.getLastRow() === 0) {
      hoja.appendRow(COLUMNAS.map(function (c) { return c[1]; }));
      hoja.getRange(1, 1, 1, COLUMNAS.length)
          .setFontWeight("bold")
          .setBackground("#0f3d38")
          .setFontColor("#ffffff");
      hoja.setFrozenRows(1);
    }

    // La fecha la pone el servidor, en hora de Ecuador,
    // para no depender del reloj del visitante.
    datos.fecha = Utilities.formatDate(new Date(), "America/Guayaquil", "dd/MM/yyyy HH:mm");

    // Codigo unico del caso y links ya armados, para que David
    // solo copie una celda y nunca tenga que escribirlos.
    datos.codigo = codigoNuevo(hoja);
    datos.link_expediente = SITIO + "/expediente/?caso=" + datos.codigo;
    datos.link_pago = SITIO + "/pago/?v=" + servicio(datos);
    datos.carpeta = carpetaDelCaso(datos);

    var fila = COLUMNAS.map(function (c) {
      var v = datos[c[0]];
      return v === undefined || v === null ? "" : v;
    });
    hoja.appendRow(fila);

    // Pintar la fila segun el semaforo, para verlo de un vistazo
    var colores = { verde: "#e8f2ec", ambar: "#fbf2e0", rojo: "#f8ecec" };
    var color = colores[String(datos.semaforo).toLowerCase()];
    if (color) {
      hoja.getRange(hoja.getLastRow(), 1, 1, COLUMNAS.length).setBackground(color);
    }

    return responder({ ok: true, codigo: datos.codigo });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Genera un codigo de 4 caracteres que no exista ya en la hoja. */
function codigoNuevo(hoja) {
  var usados = {};
  var ultimaFila = hoja.getLastRow();
  var col = indiceColumna("codigo");
  if (ultimaFila > 1 && col > 0) {
    hoja.getRange(2, col, ultimaFila - 1, 1).getValues().forEach(function (f) {
      if (f[0]) usados[String(f[0])] = true;
    });
  }
  for (var intento = 0; intento < 50; intento++) {
    var c = "";
    for (var i = 0; i < 4; i++) {
      c += ALFABETO.charAt(Math.floor(Math.random() * ALFABETO.length));
    }
    if (!usados[c]) return c;
  }
  return "X" + String(ultimaFila);
}

function indiceColumna(clave) {
  for (var i = 0; i < COLUMNAS.length; i++) {
    if (COLUMNAS[i][0] === clave) return i + 1;
  }
  return 0;
}

/** Devuelve el identificador del servicio, para el link de pago. */
function servicio(datos) {
  var d = String(datos.destino || "").toLowerCase();
  var renovacion = String(datos.aplico_antes || "").toLowerCase().indexOf("dieron") !== -1;
  if (d.indexOf("estados unidos") !== -1) return renovacion ? "usa-renovacion" : "usa-primera";
  if (d.indexOf("canad") !== -1)          return renovacion ? "canada-renovacion" : "canada-primera";
  if (d.indexOf("europa") !== -1 || d.indexOf("schengen") !== -1) return "schengen";
  return "";
}

/**
 * Crea la carpeta del caso en Drive, dentro de "Casos Mi Visa593",
 * y devuelve su enlace. Ahi van a caer los documentos del expediente.
 */
function carpetaDelCaso(datos) {
  try {
    var busca = DriveApp.getFoldersByName("Casos Mi Visa593");
    var raiz = busca.hasNext() ? busca.next() : DriveApp.createFolder("Casos Mi Visa593");
    var carpeta = raiz.createFolder(datos.codigo + " - " + datos.nombre);
    return carpeta.getUrl();
  } catch (err) {
    return "";
  }
}

/** Para comprobar en el navegador que la app web esta viva. */
function doGet() {
  return responder({ ok: true, mensaje: "Endpoint de Mi Visa593 activo" });
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
