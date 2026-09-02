/**
 * Mi Visa593 — Guardar casos del formulario en una hoja de cálculo
 * ================================================================
 *
 * CÓMO INSTALARLO (10 minutos, una sola vez)
 *
 *  1. Con la cuenta de Google de David, entra a https://sheets.new
 *     y crea una hoja nueva. Ponle de nombre "Casos Mi Visa593".
 *
 *  2. En esa hoja: menú Extensiones → Apps Script.
 *
 *  3. Borra todo lo que salga en el editor y pega este archivo completo.
 *
 *  4. Guarda (el ícono del disquete) y ponle nombre al proyecto.
 *
 *  5. Arriba a la derecha: botón azul "Implementar" → "Nueva implementación".
 *     - Junto a "Seleccionar tipo" (el engranaje) elige "Aplicación web".
 *     - Descripción: "Formulario Mi Visa593"
 *     - Ejecutar como: "Yo"
 *     - Quién tiene acceso: "Cualquier persona"   <-- IMPORTANTE
 *     - Implementar.
 *
 *  6. Google te va a pedir permisos. Acepta. Si sale la pantalla
 *     "Google no ha verificado esta aplicación", dale a
 *     "Configuración avanzada" → "Ir a (nombre del proyecto)".
 *     Es tu propio script, no hay riesgo.
 *
 *  7. Copia la "URL de la aplicación web". Termina en /exec
 *
 *  8. Pega esa URL en empezar/index.html, en la línea:
 *        var ENDPOINT_GUARDADO = "";
 *     Debe quedar así:
 *        var ENDPOINT_GUARDADO = "https://script.google.com/macros/s/.../exec";
 *
 *  9. Sube el cambio a GitHub y listo. Cada caso nuevo cae como una
 *     fila en la hoja.
 *
 * SI DESPUÉS CAMBIAS ESTE SCRIPT: hay que volver a "Implementar" →
 * "Gestionar implementaciones" → editar → "Nueva versión". Si creas una
 * implementación nueva en lugar de una versión nueva, la URL cambia.
 */

/** Orden de las columnas en la hoja. Para añadir una, agrégala aquí. */
var COLUMNAS = [
  ["fecha",           "Fecha"],
  ["nombre",          "Nombre"],
  ["telefono",        "WhatsApp"],
  ["correo",          "Correo"],
  ["destino",         "País destino"],
  ["pais_schengen",   "País Schengen"],
  ["personas",        "Personas"],
  ["semaforo",        "Semáforo"],
  ["puntos",          "Puntos"],
  ["a_favor",         "A favor"],
  ["en_contra",       "En contra"],
  ["aplico_antes",    "¿Aplicó antes?"],
  ["cuando_negada",   "¿Hace cuánto la negaron?"],
  ["cambio_algo",     "¿Cambió algo?"],
  ["viajes",          "Viajes previos"],
  ["trabajo",         "Situación laboral"],
  ["antiguedad",      "Antigüedad"],
  ["ingresos",        "Demuestra ingresos"],
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

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!e || !e.postData || e.postData.contents.length > 8000) {
      return responder({ ok: false, error: "Envío inválido" });
    }
    var datos = JSON.parse(e.postData.contents);

    for (var i = 0; i < OBLIGATORIOS.length; i++) {
      var c = OBLIGATORIOS[i];
      if (!datos[c] || typeof datos[c] !== "string") {
        return responder({ ok: false, error: "Falta el campo " + c });
      }
    }
    if (SEMAFOROS.indexOf(String(datos.semaforo).toLowerCase()) === -1) {
      return responder({ ok: false, error: "Semáforo inválido" });
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

    var fila = COLUMNAS.map(function (c) {
      var v = datos[c[0]];
      return v === undefined || v === null ? "" : v;
    });
    hoja.appendRow(fila);

    // Pintar la fila según el semáforo, para verlo de un vistazo
    var colores = { verde: "#e8f2ec", ambar: "#fbf2e0", rojo: "#f8ecec" };
    var color = colores[String(datos.semaforo).toLowerCase()];
    if (color) {
      hoja.getRange(hoja.getLastRow(), 1, 1, COLUMNAS.length).setBackground(color);
    }

    return responder({ ok: true });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** Para comprobar en el navegador que la app web está viva. */
function doGet() {
  return responder({ ok: true, mensaje: "Endpoint de Mi Visa593 activo" });
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
