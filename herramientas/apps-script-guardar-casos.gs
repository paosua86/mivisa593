/**
 * MiVisa EC — Guardar casos del formulario en una hoja de cálculo
 * ================================================================
 *
 * Recibe cada caso de mivisaec.com/empezar/, lo guarda como una fila,
 * le asigna un código único y arma los links listos para copiar.
 *
 * INSTALACIÓN (una sola vez)
 *  1. Hoja nueva en https://sheets.new, nómbrala "Casos MiVisa EC".
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

/* Nombre de la carpeta raíz en Drive donde se guarda cada caso.
   NOMBRE_CARPETA_ANTERIOR es el nombre con el que se creó al inicio del
   proyecto (cuando el negocio se llamaba "Mi Visa593" de trabajo). Si esa
   carpeta existe, se renombra sola la primera vez que corre este script;
   los casos ya guardados dentro no se mueven ni se pierden, porque Drive
   identifica las carpetas por su ID, no por su nombre. */
var NOMBRE_CARPETA = "Casos MiVisa EC";
var NOMBRE_CARPETA_ANTERIOR = "Casos Mi Visa593";

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

    // El expediente entra por otro camino: escribe en su propia hoja
    // y genera el documento del caso.
    if (datos.tipo === "expediente") {
      return guardarExpediente(datos);
    }

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
          .setBackground("#0b6478")
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

/** Genera un codigo de 6 caracteres que no exista ya en la hoja. */
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
    for (var i = 0; i < 6; i++) {
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
 * Devuelve la carpeta raíz de Drive donde viven los casos, migrando
 * sola el nombre antiguo al nuevo la primera vez que la encuentra.
 */
function carpetaRaiz() {
  var actual = DriveApp.getFoldersByName(NOMBRE_CARPETA);
  if (actual.hasNext()) return actual.next();

  var anterior = DriveApp.getFoldersByName(NOMBRE_CARPETA_ANTERIOR);
  if (anterior.hasNext()) {
    var carpeta = anterior.next();
    carpeta.setName(NOMBRE_CARPETA);
    return carpeta;
  }

  return DriveApp.createFolder(NOMBRE_CARPETA);
}

/**
 * Crea la carpeta del caso dentro de la carpeta raíz de Drive,
 * y devuelve su enlace. Ahi van a caer los documentos del expediente.
 */
function carpetaDelCaso(datos) {
  try {
    var carpeta = carpetaRaiz().createFolder(datos.codigo + " - " + datos.nombre);
    return carpeta.getUrl();
  } catch (err) {
    return "";
  }
}

/**
 * Con ?caso=CODIGO devuelve lo minimo para abrir el expediente:
 * el nombre con el que se registro y el pais destino. Nada mas.
 * Sin parametros, solo confirma que la app web esta viva.
 */
function doGet(e) {
  var codigo = e && e.parameter ? String(e.parameter.caso || "").toUpperCase() : "";

  // Diagnostico: ?prueba=drive comprueba si el script puede usar Drive.
  if (e && e.parameter && e.parameter.prueba === "drive") {
    var r = {};
    try {
      var raiz = carpetaRaiz();
      r.carpetaExiste = true;
      r.carpetaUrl = raiz.getUrl();
      var archivo = DriveApp.createFile(Utilities.newBlob("prueba", "text/plain", "prueba-drive.txt"));
      r.archivoUrl = archivo.getUrl();
      archivo.setTrashed(true);
      r.ok = true;
    } catch (err) {
      r.ok = false;
      r.error = String(err);
    }
    return responder(r);
  }

  if (!codigo) {
    return responder({ ok: true, mensaje: "Endpoint de MiVisa EC activo" });
  }
  try {
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var ultima = hoja.getLastRow();
    if (ultima < 2) return responder({ ok: false, error: "Caso no encontrado" });

    var colCodigo   = indiceColumna("codigo");
    var colNombre   = indiceColumna("nombre");
    var colDestino  = indiceColumna("destino");
    var colPersonas = indiceColumna("personas");

    var valores = hoja.getRange(2, 1, ultima - 1, COLUMNAS.length).getValues();
    for (var i = valores.length - 1; i >= 0; i--) {
      if (String(valores[i][colCodigo - 1]).toUpperCase() === codigo) {
        return responder({
          ok: true,
          codigo: codigo,
          nombre: valores[i][colNombre - 1],
          destino: valores[i][colDestino - 1],
          personas: valores[i][colPersonas - 1]
        });
      }
    }
    return responder({ ok: false, error: "Caso no encontrado" });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

/**
 * Guarda el expediente completo: una fila por persona en la hoja
 * "Expedientes" y un documento ordenado en la carpeta del caso.
 */
function guardarExpediente(datos) {
  var codigo = String(datos.codigo || "").toUpperCase();
  if (!codigo) return responder({ ok: false, error: "Falta el codigo del caso" });
  if (!datos.personas || !datos.personas.length) {
    return responder({ ok: false, error: "El expediente no trae personas" });
  }

  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName("Expedientes");
  if (!hoja) hoja = libro.insertSheet("Expedientes");

  var fecha = Utilities.formatDate(new Date(), "America/Guayaquil", "dd/MM/yyyy HH:mm");

  // Los encabezados salen de los campos de la primera persona,
  // asi la hoja se adapta sola si el formulario cambia.
  var claves = ["fecha", "codigo", "persona"];
  datos.personas.forEach(function (per) {
    Object.keys(per).forEach(function (k) {
      if (claves.indexOf(k) === -1) claves.push(k);
    });
  });

  if (hoja.getLastRow() === 0) {
    hoja.appendRow(claves);
    hoja.getRange(1, 1, 1, claves.length)
        .setFontWeight("bold").setBackground("#0b6478").setFontColor("#ffffff");
    hoja.setFrozenRows(1);
  }

  datos.personas.forEach(function (per, n) {
    per.fecha = fecha;
    per.codigo = codigo;
    per.persona = String(n + 1) + " de " + datos.personas.length;
    hoja.appendRow(claves.map(function (k) {
      var v = per[k];
      return v === undefined || v === null ? "" : v;
    }));
  });

  var urlDoc = "";
  try {
    urlDoc = documentoDelCaso(codigo, datos);
  } catch (err) {
    urlDoc = "ERROR: " + err;
  }

  return responder({ ok: true, codigo: codigo, documento: urlDoc });
}

/**
 * Arma el documento del caso y lo deja en su carpeta de Drive.
 * Se crea con DriveApp convirtiendo texto a Documento de Google, para
 * no necesitar un permiso extra sobre la API de Documentos.
 */
function documentoDelCaso(codigo, datos) {
  var L = [];
  L.push("EXPEDIENTE " + codigo);
  L.push((datos.destinoNombre || "") + "   ·   " + datos.personas.length + " solicitante(s)");
  L.push("Recibido el " + Utilities.formatDate(new Date(), "America/Guayaquil", "dd/MM/yyyy HH:mm"));
  L.push("");

  datos.personas.forEach(function (per, n) {
    var titulo = ((per.personales__nombres || "") + " " + (per.personales__apellidos || "")).trim();
    if (!titulo) titulo = per.nombre_ficha || ("Persona " + (n + 1));
    L.push("");
    L.push("==================================================");
    L.push(titulo.toUpperCase());
    L.push("==================================================");

    var seccionActual = "";
    Object.keys(per).forEach(function (k) {
      if (k === "fecha" || k === "codigo" || k === "persona" || k === "nombre_ficha") return;
      var v = per[k];
      if (v === "" || v === undefined || v === null || v === "[]") return;

      var partes = k.split("__");
      if (partes.length === 2 && partes[0] !== seccionActual) {
        seccionActual = partes[0];
        L.push("");
        L.push("-- " + etiquetaSeccion(seccionActual).toUpperCase() + " --");
      }
      var campo = partes.length === 2 ? partes[1] : k;
      campo = campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, " ");

      if (campo.toLowerCase() === "lista") {
        L.push(listaLegible(v));
      } else {
        L.push(campo + ": " + v);
      }
    });
  });

  if (datos.documentos && datos.documentos.length) {
    L.push("");
    L.push("==================================================");
    L.push("DOCUMENTOS");
    L.push("==================================================");
    datos.documentos.forEach(function (d) {
      L.push("[" + d.estado + "]  " + d.nombre);
    });
  }

  var nombreArchivo = "Expediente " + codigo + " - " + (datos.titular || "");
  var archivo = DriveApp.createFile(
    Utilities.newBlob(L.join("\n"), "text/plain", nombreArchivo + ".txt")
  );

  var creado = archivo;

  try {
    var carpetas = carpetaRaiz().getFolders();
    while (carpetas.hasNext()) {
      var c = carpetas.next();
      if (c.getName().indexOf(codigo) === 0) {
        c.addFile(creado);
        DriveApp.getRootFolder().removeFile(creado);
        break;
      }
    }
  } catch (err) { /* si no se puede mover, el archivo igual existe */ }

  return creado.getUrl();
}

/** Convierte la lista JSON de viajes o familiares en algo legible. */
function listaLegible(v) {
  try {
    var arr = typeof v === "string" ? JSON.parse(v) : v;
    if (!arr || !arr.length) return "";
    return arr.map(function (o, i) {
      return "  " + (i + 1) + ") " + Object.keys(o).map(function (k) {
        return k + ": " + o[k];
      }).join("  |  ");
    }).join("\n");
  } catch (e) {
    return String(v);
  }
}

function etiquetaSeccion(clave) {
  var mapa = {
    personales: "Datos personales",
    conyuge: "Cónyuge",
    padres: "Padres",
    secundaria: "Estudios secundarios",
    universidad: "Estudios superiores",
    laboral_anterior: "Situación laboral anterior",
    laboral: "Situación laboral actual",
    pasaporte: "Pasaporte",
    viajes: "Viajes a otros países",
    viajes_usa: "Viajes a Estados Unidos",
    redes: "Redes sociales",
    familia_usa: "Familiares en Estados Unidos"
  };
  return mapa[clave] || clave.replace(/_/g, " ");
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
