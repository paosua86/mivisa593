/**
 * MiVisa EC — Guardar casos, avisar por correo y armar el expediente
 * ==================================================================
 *
 * Recibe cada caso de mivisaec.com/empezar/, lo guarda como una fila,
 * le avisa a David por correo y le arma el expediente ya lleno, con el
 * mismo formato de sus archivos de Excel.
 *
 * INSTALACIÓN (una sola vez)
 *  1. Hoja nueva en https://sheets.new, nómbrala "Casos MiVisa EC".
 *  2. Extensiones → Apps Script. Borra todo y pega este archivo.
 *  3. Ejecuta una vez la función `instalarDisparadores` desde el editor
 *     y acepta los permisos. Sin eso, la persona NO recibe el aviso
 *     cuando David marca su pago.
 *  4. Implementar → Nueva implementación → Aplicación web.
 *       Ejecutar como: Yo
 *       Quién tiene acceso: Cualquier persona   <-- IMPORTANTE
 *  5. Copia la URL que termina en /exec y pégala en ENDPOINT, en
 *     empezar/index.html, caso/index.html y expediente/index.html.
 *
 * IMPORTANTE: todo esto tiene que quedar instalado en la cuenta de
 * Google de David (davidubilluz83@gmail.com), porque el script manda
 * los correos "desde" la cuenta que lo ejecuta y guarda los archivos
 * en su Drive. Antes de abrir el editor de Apps Script, comprueba
 * arriba a la derecha que la cuenta activa es la suya.
 *
 * AL ACTUALIZAR ESTE ARCHIVO: Implementar → Gestionar implementaciones
 * → editar (lápiz) → Versión: Nueva versión → Implementar.
 * Así la URL NO cambia.
 */

var SITIO = "https://mivisaec.com";

/* A quién le llegan los avisos de casos nuevos y los expedientes.
   Es la bandeja de trabajo de David: aquí ya no entra nada por
   WhatsApp. */
var CORREO_DAVID = "davidubilluz83@gmail.com";

/* Marca de version. Sirve para comprobar desde fuera que la
   implementacion en vivo ya tiene los cambios: al abrir la URL /exec
   sin parametros, la respuesta trae este mismo texto. Subirla cada vez
   que se cambie este archivo. */
var VERSION = "2026-09-09-sin-candado";

/* ------------------------------------------------------------
   NO HAY CANDADO

   El formulario detallado está abierto desde el primer momento para
   cualquiera que tenga su código. No hay nada que David tenga que
   habilitar y no hay nada que la persona tenga que esperar.

   Lo que ordena el trabajo no es un permiso técnico: David se pone a
   trabajar un caso cuando ve el pago. Que alguien llene el formulario
   antes de pagar no le cuesta nada — es información que ya estaba
   ahí para él cuando cobre.

   Las columnas "Pago declarado" y "Pagado" quedan como registro:
   la primera la escribe la persona desde su página, la segunda la
   escribe David cuando verifica. Ninguna de las dos abre ni cierra
   nada.
   ------------------------------------------------------------ */

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
  ["pago_declarado",  "Pago declarado"],
  ["pagado",          "Pagado"],
  ["expediente",      "Expediente"],
  ["nombre",          "Nombre"],
  ["telefono",        "WhatsApp"],
  ["correo",          "Correo"],
  ["destino",         "País destino"],
  ["link_caso",       "Página del caso"],
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

/* Tope de tamaño de un envío, solo para descartar basura.
   Antes estaba en 8000 caracteres, que alcanzaba cuando el expediente
   era solo de Estados Unidos y con respuestas cortas. Con datos reales
   ya no: un expediente de una persona pesa entre 8 y 12 KB según el
   destino, y uno de cuatro personas pasa de 29 KB. */
var TOPE_ENVIO = 200000;

/* Campos que debe traer un caso de verdad, para descartar basura. */
var OBLIGATORIOS = ["nombre", "telefono", "destino", "semaforo"];
var SEMAFOROS = ["verde", "ambar", "rojo"];

/* Sin caracteres que se confundan al dictarlos: nada de O/0, I/1, L. */
var ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/* ============================================================
   ENTRADA: casos nuevos desde empezar/
   ============================================================ */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (!e || !e.postData || e.postData.contents.length > TOPE_ENVIO) {
      return responder({ ok: false, error: "Envio invalido" });
    }
    var datos = JSON.parse(e.postData.contents);

    // El expediente entra por otro camino: escribe en su propia hoja
    // y genera el archivo del caso.
    if (datos.tipo === "expediente") {
      return guardarExpediente(datos);
    }

    // La persona avisa desde su página que ya pagó. No es una
    // confirmación de cobro: es lo que le abre el formulario y lo que
    // le dice a David que vaya a buscar ese comprobante.
    if (datos.tipo === "pago-declarado") {
      return declararPago(datos);
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
    asegurarColumnas(hoja);

    // La fecha la pone el servidor, en hora de Ecuador,
    // para no depender del reloj del visitante.
    datos.fecha = Utilities.formatDate(new Date(), "America/Guayaquil", "dd/MM/yyyy HH:mm");

    /* El código lo propone el navegador y aquí solo se valida.
       Motivo: contra Apps Script el formulario no siempre puede leer la
       respuesta, así que si el código naciera aquí, la página de
       resultado no sabría cuál es y no podría mostrarle a la persona su
       propio link. Con 31^6 combinaciones el choque es remoto, y si aun
       así choca, se genera otro aquí. */
    datos.codigo = codigoValido(hoja, datos.codigo);
    datos.link_caso = SITIO + "/caso/?c=" + datos.codigo;
    datos.link_expediente = SITIO + "/expediente/?caso=" + datos.codigo;
    datos.link_pago = SITIO + "/pago/?v=" + servicio(datos);
    datos.carpeta = carpetaDelCaso(datos);
    datos.pagado = "";
    datos.pago_declarado = "";
    datos.expediente = "";

    // Cada dato va a la columna que le corresponde por su titulo, no
    // por su posicion en COLUMNAS: la hoja puede tener columnas
    // añadidas a mano en el medio y nada se corre de lugar.
    var indice = columnasDeLaHoja(hoja);
    var ancho = hoja.getLastColumn();
    var fila = [];
    for (var k = 0; k < ancho; k++) fila.push("");
    COLUMNAS.forEach(function (c) {
      var pos = indice[c[0]];
      if (!pos) return;
      var v = datos[c[0]];
      fila[pos - 1] = v === undefined || v === null ? "" : v;
    });
    hoja.appendRow(fila);

    // Pintar la fila segun el semaforo, para verlo de un vistazo
    var colores = { verde: "#e8f2ec", ambar: "#fbf2e0", rojo: "#f8ecec" };
    var color = colores[String(datos.semaforo).toLowerCase()];
    if (color) {
      hoja.getRange(hoja.getLastRow(), 1, 1, ancho).setBackground(color);
    }

    try { avisarCasoNuevo(datos); } catch (err) { /* el caso ya está guardado */ }
    try { correoALaPersona(datos); } catch (err) { /* idem */ }

    return responder({ ok: true, codigo: datos.codigo });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * La persona toca "Ya pagué" en su página.
 *
 * Escribe la fecha en la columna "Pago declarado" y le avisa a David
 * para que vaya a buscar el comprobante. NO toca la columna "Pagado":
 * esa sigue siendo suya y significa "lo verifiqué".
 *
 * No abre ni cierra nada: el formulario ya estaba abierto. Sirve para
 * que a David le llegue el aviso de ir a buscar el comprobante, y para
 * que en la hoja quede la hora en que la persona dijo que pagó.
 */
function declararPago(datos) {
  var codigo = String(datos.codigo || "").toUpperCase();
  if (!codigo) return responder({ ok: false, error: "Falta el codigo" });

  var fila = filaDelCaso(codigo);
  if (!fila) return responder({ ok: false, error: "Caso no encontrado" });

  var pos = fila.indice.pago_declarado;
  if (!pos) {
    asegurarColumnas(fila.hoja);
    fila = filaDelCaso(codigo);
    pos = fila.indice.pago_declarado;
    if (!pos) return responder({ ok: false, error: "La hoja no tiene la columna Pago declarado" });
  }

  // Si ya lo había declarado, no se vuelve a avisar: la persona puede
  // tocar el botón varias veces sin llenarle el correo a David.
  var yaEstaba = String(fila.valor("pago_declarado")).trim() !== "";
  if (!yaEstaba) {
    fila.hoja.getRange(fila.numero, pos)
        .setValue(Utilities.formatDate(new Date(), "America/Guayaquil", "dd/MM/yyyy HH:mm"));
    try { avisarPagoDeclarado(fila, codigo); } catch (err) { /* queda escrito igual */ }
  }

  return responder({ ok: true, codigo: codigo });
}

/**
 * Acepta el código que propone el navegador si tiene la forma correcta
 * y no está usado. Si no, genera uno aquí.
 */
function codigoValido(hoja, propuesto) {
  var c = String(propuesto || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  var usados = codigosUsados(hoja);
  if (c.length === 6 && !usados[c]) {
    var limpio = true;
    for (var i = 0; i < 6; i++) {
      if (ALFABETO.indexOf(c.charAt(i)) === -1) limpio = false;
    }
    if (limpio) return c;
  }
  return codigoNuevo(hoja, usados);
}

function codigosUsados(hoja) {
  var usados = {};
  var ultimaFila = hoja.getLastRow();
  var col = indiceColumna(hoja, "codigo");
  if (ultimaFila > 1 && col > 0) {
    hoja.getRange(2, col, ultimaFila - 1, 1).getValues().forEach(function (f) {
      if (f[0]) usados[String(f[0]).toUpperCase()] = true;
    });
  }
  return usados;
}

/** Genera un codigo de 6 caracteres que no exista ya en la hoja. */
function codigoNuevo(hoja, usados) {
  usados = usados || codigosUsados(hoja);
  for (var intento = 0; intento < 50; intento++) {
    var c = "";
    for (var i = 0; i < 6; i++) {
      c += ALFABETO.charAt(Math.floor(Math.random() * ALFABETO.length));
    }
    if (!usados[c]) return c;
  }
  return "X" + String(hoja.getLastRow());
}

/**
 * Añade al final de la hoja las columnas de COLUMNAS que todavía no
 * existan. Se ejecuta en cada guardado, así una hoja creada con una
 * versión anterior del script se pone al día sola y sin mover nada de
 * lo ya escrito.
 */
function asegurarColumnas(hoja) {
  var ancho = hoja.getLastColumn();
  if (ancho === 0) return;
  var titulos = hoja.getRange(1, 1, 1, ancho).getValues()[0].map(function (t) {
    return String(t).trim();
  });
  var faltan = COLUMNAS
    .map(function (c) { return c[1]; })
    .filter(function (t) { return titulos.indexOf(t) === -1; });
  if (!faltan.length) return;
  hoja.getRange(1, ancho + 1, 1, faltan.length)
      .setValues([faltan])
      .setFontWeight("bold").setBackground("#0b6478").setFontColor("#ffffff");
}

/**
 * En que columna real de la hoja vive cada dato, mirando los titulos
 * de la fila 1. La hoja manda: si una columna se mueve, se sigue
 * escribiendo donde corresponde.
 */
function columnasDeLaHoja(hoja) {
  var indice = {};
  var ancho = hoja.getLastColumn();
  if (ancho === 0) return indice;

  var titulos = hoja.getRange(1, 1, 1, ancho).getValues()[0];
  var porTitulo = {};
  titulos.forEach(function (t, i) {
    var titulo = String(t).trim();
    if (titulo && porTitulo[titulo] === undefined) porTitulo[titulo] = i + 1;
  });

  COLUMNAS.forEach(function (c) {
    var pos = porTitulo[c[1]];
    if (pos) indice[c[0]] = pos;
  });
  return indice;
}

/** Columna real de un dato en la hoja. 0 si la hoja no la tiene. */
function indiceColumna(hoja, clave) {
  return columnasDeLaHoja(hoja)[clave] || 0;
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

/* ============================================================
   DRIVE
   ============================================================ */

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

/** Busca la carpeta de un caso por su código. null si no existe. */
function carpetaPorCodigo(codigo) {
  try {
    var carpetas = carpetaRaiz().getFolders();
    while (carpetas.hasNext()) {
      var c = carpetas.next();
      if (c.getName().indexOf(codigo) === 0) return c;
    }
  } catch (err) { /* sin permisos de Drive, se sigue sin carpeta */ }
  return null;
}

/* ============================================================
   CONSULTAS DESDE EL SITIO
   ============================================================ */

/**
 * Con ?caso=CODIGO devuelve el estado del caso: con qué nombre se
 * registró, a qué país va, si David ya marcó el pago y si el
 * expediente ya llegó. De eso vive la página /caso/.
 */
function doGet(e) {
  var codigo = e && e.parameter ? String(e.parameter.caso || e.parameter.c || "").toUpperCase() : "";

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
    return responder({ ok: true, mensaje: "Endpoint de MiVisa EC activo", version: VERSION });
  }
  try {
    var fila = filaDelCaso(codigo);
    if (!fila) return responder({ ok: false, error: "Caso no encontrado" });

    var confirmado = String(fila.valor("pagado")).trim() !== "";
    var declarado  = String(fila.valor("pago_declarado")).trim() !== "";

    return responder({
      ok: true,
      codigo: codigo,
      nombre:     fila.valor("nombre"),
      correo:     fila.valor("correo"),
      destino:    fila.valor("destino"),
      personas:   fila.valor("personas"),
      semaforo:   String(fila.valor("semaforo")).toLowerCase(),
      servicio:   servicio({ destino: fila.valor("destino"), aplico_antes: fila.valor("aplico_antes") }),
      a_favor:    fila.valor("a_favor"),
      en_contra:  fila.valor("en_contra"),
      // Los dos son informativos: la página los usa para saber qué
      // decirle a la persona, no para dejarla pasar o no.
      pagoConfirmado:  confirmado,
      pagoDeclarado:   declarado,
      expediente: String(fila.valor("expediente")).trim() !== ""
    });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

/**
 * Localiza la fila de un caso y devuelve un pequeño ayudante para
 * leerla por nombre de dato en vez de por número de columna.
 */
function filaDelCaso(codigo) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var ultima = hoja.getLastRow();
  if (ultima < 2) return null;

  var indice = columnasDeLaHoja(hoja);
  if (!indice.codigo) return null;

  var valores = hoja.getRange(2, 1, ultima - 1, hoja.getLastColumn()).getValues();
  for (var i = valores.length - 1; i >= 0; i--) {
    if (String(valores[i][indice.codigo - 1]).toUpperCase() === codigo) {
      return {
        hoja: hoja,
        numero: i + 2,
        indice: indice,
        valor: (function (celdas) {
          return function (clave) {
            var pos = indice[clave];
            return pos ? celdas[pos - 1] : "";
          };
        })(valores[i])
      };
    }
  }
  return null;
}

/* ============================================================
   EXPEDIENTE
   ============================================================ */

/**
 * Guarda el expediente completo: una fila por persona en la hoja del
 * destino, un archivo con el formato de los Excel de David en la
 * carpeta del caso, y un correo a David con ese archivo adjunto.
 */
function guardarExpediente(datos) {
  var codigo = String(datos.codigo || "").toUpperCase();
  if (!codigo) return responder({ ok: false, error: "Falta el codigo del caso" });
  if (!datos.personas || !datos.personas.length) {
    return responder({ ok: false, error: "El expediente no trae personas" });
  }

  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = hojaDeExpediente(libro, datos.destinoClave);

  var fecha = Utilities.formatDate(new Date(), "America/Guayaquil", "dd/MM/yyyy HH:mm");

  var claves = ["fecha", "codigo", "persona"];
  datos.personas.forEach(function (per) {
    Object.keys(per).forEach(function (k) {
      if (claves.indexOf(k) === -1) claves.push(k);
    });
  });

  var indice = columnasDeExpediente(hoja, claves, datos);
  var ancho = hoja.getLastColumn();

  datos.personas.forEach(function (per, n) {
    per.fecha = fecha;
    per.codigo = codigo;
    per.persona = String(n + 1) + " de " + datos.personas.length;

    var fila = [];
    for (var i = 0; i < ancho; i++) fila.push("");
    claves.forEach(function (k) {
      var v = per[k];
      fila[indice[k] - 1] = (v === undefined || v === null) ? "" : v;
    });
    hoja.appendRow(fila);
  });

  // El archivo con el formato de David. Si algo falla aquí, el
  // expediente ya quedó guardado en la hoja: se avisa, no se pierde.
  var archivo = null;
  var urlDoc = "";
  try {
    archivo = libroDelCaso(codigo, datos);
    urlDoc = archivo.getUrl();
  } catch (err) {
    urlDoc = "ERROR: " + err;
  }

  try { avisarExpediente(codigo, datos, archivo, urlDoc); } catch (err) { /* ya está guardado */ }
  try { marcarExpedienteRecibido(codigo, fecha); } catch (err) { /* idem */ }

  return responder({ ok: true, codigo: codigo, documento: urlDoc });
}

/** Deja constancia en la hoja de casos de que el expediente llegó. */
function marcarExpedienteRecibido(codigo, fecha) {
  var fila = filaDelCaso(codigo);
  if (!fila || !fila.indice.expediente) return;
  fila.hoja.getRange(fila.numero, fila.indice.expediente).setValue(fecha);
}

/**
 * Cada destino tiene su propia hoja, porque las columnas que pide
 * Estados Unidos, Canada y Europa no son las mismas. Mezclarlas en
 * una sola hoja desalinea las filas.
 */
var HOJAS_EXPEDIENTE = {
  usa: "Expedientes EE.UU.",
  canada: "Expedientes Canadá",
  schengen: "Expedientes Europa"
};

/* Título de la portada de cada archivo, igual al de los Excel que
   David venía mandando a mano. */
var TITULO_ARCHIVO = {
  usa: "INFORMACIÓN PARA VISA AMERICANA",
  canada: "INFORMACIÓN PARA VISA CANADIENSE",
  schengen: "INFORMACIÓN PARA VISA SCHENGEN"
};

function hojaDeExpediente(libro, clave) {
  var nombre = HOJAS_EXPEDIENTE[clave] || "Expedientes";
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  return hoja;
}

/**
 * Devuelve en que columna va cada clave, creando al final las que
 * falten. La fila 1 lleva el titulo legible y la fila 2, oculta, la
 * clave interna: gracias a eso la hoja se puede ampliar despues sin
 * que se desalineen las filas ya guardadas.
 */
function columnasDeExpediente(hoja, claves, datos) {
  function titulo(k) { return etiquetaCampoExpediente(k, datos.etiquetas, datos.secciones); }

  if (hoja.getLastRow() === 0) {
    hoja.appendRow(claves.map(titulo));
    hoja.appendRow(claves);
    hoja.getRange(1, 1, 1, claves.length)
        .setFontWeight("bold").setBackground("#0b6478").setFontColor("#ffffff");
    hoja.hideRows(2);
    hoja.setFrozenRows(2);
  }

  var ancho = hoja.getLastColumn();
  var existentes = hoja.getRange(2, 1, 1, ancho).getValues()[0];
  var indice = {};
  existentes.forEach(function (k, i) { if (k) indice[String(k)] = i + 1; });

  var nuevas = claves.filter(function (k) { return !indice[k]; });
  if (nuevas.length) {
    hoja.getRange(1, ancho + 1, 1, nuevas.length)
        .setValues([nuevas.map(titulo)])
        .setFontWeight("bold").setBackground("#0b6478").setFontColor("#ffffff");
    hoja.getRange(2, ancho + 1, 1, nuevas.length).setValues([nuevas]);
    nuevas.forEach(function (k, i) { indice[k] = ancho + 1 + i; });
  }

  return indice;
}

function etiquetaCampoExpediente(k, etiquetas, secciones) {
  var especiales = { fecha: "Fecha", codigo: "Codigo del caso", persona: "Persona", nombre_ficha: "Nombre" };
  if (especiales[k]) return especiales[k];

  var partes = k.split("__");
  if (partes.length !== 2) return k;

  var seccion = etiquetaSeccion(partes[0], secciones);
  if (partes[1] === "lista") return seccion + " — detalle";

  var campo = (etiquetas && etiquetas[k]) || partes[1].replace(/_/g, " ");
  return seccion + " — " + campo;
}

/**
 * El titulo de la seccion lo manda el formulario en `secciones`, asi
 * no hay que tocar este archivo cada vez que se agrega un destino.
 * El mapa de abajo queda solo como respaldo para expedientes viejos
 * que se enviaron antes de que el formulario mandara los titulos.
 */
function etiquetaSeccion(clave, secciones) {
  if (secciones && secciones[clave]) return secciones[clave];
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

/* ============================================================
   EL ARCHIVO DEL CASO — el Excel de David, ya lleno
   ============================================================

   David venía mandando por WhatsApp un Excel con una pestaña por
   persona y las preguntas en vertical, y desde ahí copiaba y pegaba
   al formulario oficial. Eso funcionaba para él y no funcionaba para
   la gente: no todos saben usar Excel.

   Aquí se arma exactamente ese mismo archivo, pero lleno con lo que
   la persona respondió en el formulario web. Una pestaña por
   solicitante, las secciones numeradas en el mismo orden, la etiqueta
   a la izquierda y la respuesta a la derecha.

   El orden y los títulos NO están escritos aquí: llegan desde el
   formulario en `orden`, `secciones` y `etiquetas`. Así, cambiar una
   pregunta en expediente/index.html cambia también este archivo, sin
   tocar el script.
   ------------------------------------------------------------ */

function libroDelCaso(codigo, datos) {
  var titular = datos.titular || "";
  var nombre = "Expediente " + codigo + (titular ? " - " + titular : "");
  var libro = SpreadsheetApp.create(nombre);

  datos.personas.forEach(function (per, n) {
    var hoja = n === 0 ? libro.getSheets()[0] : libro.insertSheet();
    hoja.setName(nombrePestana(per, n, libro));
    pintarFichaPersona(hoja, per, datos);
  });

  if (datos.documentos && datos.documentos.length) {
    pintarDocumentos(libro.insertSheet("Documentos"), datos);
  }

  SpreadsheetApp.flush();

  var archivo = DriveApp.getFileById(libro.getId());
  var carpeta = carpetaPorCodigo(codigo);
  if (carpeta) {
    try {
      carpeta.addFile(archivo);
      DriveApp.getRootFolder().removeFile(archivo);
    } catch (err) { /* si no se puede mover, el archivo igual existe */ }
  }
  return archivo;
}

/** Nombre corto y único para la pestaña de cada persona. */
function nombrePestana(per, n, libro) {
  var base = String(per.nombre_ficha ||
    ((per.personales__nombres || "") + " " + (per.personales__apellidos || "")).trim() ||
    ("Persona " + (n + 1))).trim();
  base = base.substring(0, 24).replace(/[\[\]\*\/\\\?:]/g, " ");
  if (!base) base = "Persona " + (n + 1);
  var nombre = base;
  var intento = 2;
  while (libro.getSheetByName(nombre)) {
    nombre = base + " " + intento;
    intento++;
  }
  return nombre;
}

/**
 * Escribe la ficha de una persona en su pestaña: portada, secciones
 * numeradas y, dentro de cada una, etiqueta y respuesta.
 */
function pintarFichaPersona(hoja, per, datos) {
  var orden = datos.orden || [];
  var etiquetas = datos.etiquetas || {};
  var secciones = datos.secciones || {};

  var filas = [];
  var estilos = [];   // {fila, tipo} con tipo "titulo" | "seccion" | "tabla"

  function fila(a, b) {
    filas.push([a, b === undefined || b === null ? "" : b]);
    return filas.length;
  }
  function marcar(n, tipo) { estilos.push({ fila: n, tipo: tipo }); }

  marcar(fila(TITULO_ARCHIVO[datos.destinoClave] || "EXPEDIENTE", ""), "titulo");
  fila("Solicitante:", per.nombre_ficha || "");
  fila("Código del caso:", datos.codigo || "");
  fila("Recibido:", per.fecha || "");
  fila("", "");

  // Las secciones, en el orden en que el formulario se las presentó a
  // la persona. Si el formulario no manda `orden` (versión antigua),
  // se cae en el orden natural de las claves.
  var grupos = orden.length ? orden : ordenDeRespaldo(per);

  var numero = 0;
  grupos.forEach(function (grupo) {
    var claves = grupo.campos.filter(function (k) {
      var v = per[k];
      return v !== "" && v !== undefined && v !== null && v !== "[]";
    });
    if (!claves.length) return;

    numero++;
    marcar(fila(numero + ". " + String(secciones[grupo.id] || grupo.id).toUpperCase(), ""), "seccion");

    claves.forEach(function (k) {
      var partes = k.split("__");
      if (partes.length === 2 && partes[1] === "lista") {
        var tabla = filasDeLista(per[k]);
        if (!tabla.length) return;
        marcar(fila(tabla[0].join("   ·   "), ""), "tabla");
        tabla.slice(1).forEach(function (r) { fila(r[0], r.slice(1).join("   ·   ")); });
        return;
      }
      var etiqueta = etiquetas[k] || (partes.length === 2 ? partes[1].replace(/_/g, " ") : k);
      fila(etiqueta + ":", String(per[k]));
    });
    fila("", "");
  });

  hoja.getRange(1, 1, filas.length, 2).setValues(filas);
  hoja.setColumnWidth(1, 320);
  hoja.setColumnWidth(2, 460);
  hoja.getRange(1, 1, filas.length, 2).setVerticalAlignment("top").setWrap(true);

  estilos.forEach(function (e) {
    var r = hoja.getRange(e.fila, 1, 1, 2);
    if (e.tipo === "titulo") {
      r.merge().setFontSize(13).setFontWeight("bold")
       .setBackground("#0b6478").setFontColor("#ffffff");
    } else if (e.tipo === "seccion") {
      r.merge().setFontWeight("bold")
       .setBackground("#d9edf2").setFontColor("#0b3c48");
    } else {
      r.merge().setFontWeight("bold").setBackground("#f0f4f5");
    }
  });
  hoja.setFrozenRows(1);
}

/** Convierte la lista JSON de viajes o familiares en filas. */
function filasDeLista(v) {
  var arr;
  try { arr = typeof v === "string" ? JSON.parse(v) : v; } catch (e) { return []; }
  if (!arr || !arr.length) return [];
  var columnas = [];
  arr.forEach(function (o) {
    Object.keys(o).forEach(function (k) {
      if (columnas.indexOf(k) === -1) columnas.push(k);
    });
  });
  var filas = [columnas.map(function (k) { return k.replace(/_/g, " "); })];
  arr.forEach(function (o, i) {
    filas.push([String(i + 1) + ")"].concat(columnas.map(function (k) {
      return o[k] === undefined || o[k] === null ? "" : String(o[k]);
    })));
  });
  return filas;
}

/** Para expedientes enviados por una versión del formulario que
 *  todavía no mandaba el orden de las secciones. */
function ordenDeRespaldo(per) {
  var grupos = [];
  var vistos = {};
  Object.keys(per).forEach(function (k) {
    if (["fecha", "codigo", "persona", "nombre_ficha"].indexOf(k) !== -1) return;
    var id = k.split("__")[0];
    if (!vistos[id]) { vistos[id] = { id: id, campos: [] }; grupos.push(vistos[id]); }
    vistos[id].campos.push(k);
  });
  return grupos;
}

/** Pestaña con el estado de los documentos de soporte. */
function pintarDocumentos(hoja, datos) {
  var filas = [["DOCUMENTOS DE SOPORTE", ""], ["Documento", "¿Lo tiene?"]];
  datos.documentos.forEach(function (d) { filas.push([d.nombre, d.estado]); });
  hoja.getRange(1, 1, filas.length, 2).setValues(filas).setWrap(true).setVerticalAlignment("top");
  hoja.setColumnWidth(1, 460);
  hoja.setColumnWidth(2, 180);
  hoja.getRange(1, 1, 1, 2).merge().setFontSize(13).setFontWeight("bold")
      .setBackground("#0b6478").setFontColor("#ffffff");
  hoja.getRange(2, 1, 1, 2).setFontWeight("bold").setBackground("#d9edf2");
  hoja.setFrozenRows(2);
}

/* ============================================================
   CORREOS
   ============================================================ */

/** Aviso a David de que entró un caso nuevo. Reemplaza al WhatsApp. */
function avisarCasoNuevo(datos) {
  var sem = String(datos.semaforo).toLowerCase();
  var etiqueta = { verde: "VERDE", ambar: "ÁMBAR", rojo: "ROJO" }[sem] || sem.toUpperCase();
  var color = { verde: "#1f7a4d", ambar: "#a8730a", rojo: "#a63232" }[sem] || "#0b6478";

  var asunto = "Caso nuevo · " + etiqueta + " · " + datos.destino + " · " + datos.codigo;

  var identidad = [
    ["Nombre", datos.nombre],
    ["WhatsApp", datos.telefono],
    ["Correo", datos.correo],
    ["País destino", datos.destino],
    ["País Schengen", datos.pais_schengen],
    ["Personas", datos.personas],
    ["Puntos", datos.puntos]
  ];

  // Las 12 respuestas de la precalificación, en el mismo orden en que
  // se le preguntaron. Aquí es donde David lee el caso: en vertical,
  // no persiguiendo columnas a lo ancho de la hoja.
  var respuestas = [
    ["¿Aplicó antes?", datos.aplico_antes],
    ["¿Hace cuánto la negaron?", datos.cuando_negada],
    ["¿Cambió algo?", datos.cambio_algo],
    ["Viajes previos", datos.viajes],
    ["Situación laboral", datos.trabajo],
    ["Antigüedad", datos.antiguedad],
    ["Acredita ingresos", datos.ingresos],
    ["Dependientes", datos.dependientes],
    ["Pareja", datos.pareja],
    ["Bienes", datos.bienes],
    ["Pasaporte", datos.pasaporte],
    ["Cuándo viaja", datos.cuando]
  ];

  var cuerpo =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;' +
    'max-width:620px;margin:0 auto;color:#16282c">' +
    '<div style="background:' + color + ';color:#fff;padding:18px 20px;border-radius:10px 10px 0 0">' +
      '<div style="font-size:12px;letter-spacing:.12em;opacity:.85">CASO NUEVO · ' + escaparHtml(etiqueta) + '</div>' +
      '<div style="font-size:22px;font-weight:700;margin-top:4px">' + escaparHtml(datos.nombre) + '</div>' +
      '<div style="font-size:14px;opacity:.9;margin-top:2px">' + escaparHtml(datos.destino) +
        ' · código ' + escaparHtml(datos.codigo) + '</div>' +
    '</div>' +
    tablaCorreo(identidad) +
    seccionCorreo("Respuestas de la precalificación", respuestas) +
    listaCorreo("A favor", datos.a_favor) +
    listaCorreo("En contra", datos.en_contra) +
    '<div style="padding:18px 14px;background:#f4f8f9;border-radius:0 0 10px 10px">' +
      '<p style="margin:0 0 10px;font-size:13px;color:#5b6b6f">' +
        'La persona ya tiene su página con el pago y el expediente. ' +
        'No hace falta que le mandes ningún link.</p>' +
      '<p style="margin:0 0 6px;font-size:14px">' +
        '<a href="' + escaparHtml(datos.link_caso) + '" style="color:#0b6478">Ver lo que ve la persona</a></p>' +
      (datos.carpeta ? '<p style="margin:0 0 6px;font-size:14px">' +
        '<a href="' + escaparHtml(datos.carpeta) + '" style="color:#0b6478">Carpeta del caso en Drive</a></p>' : '') +
      '<p style="margin:12px 0 0;font-size:13px;color:#5b6b6f">' +
        'Cuando cobres, escribe cualquier cosa en la columna <b>Pagado</b> de la fila ' +
        'de este caso. Con eso se le abre el expediente y le llega un correo avisándole.</p>' +
    '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: CORREO_DAVID,
    subject: asunto,
    htmlBody: cuerpo,
    name: "MiVisa EC",
    replyTo: datos.correo || CORREO_DAVID
  });
}

/** Filas etiqueta/valor, saltando lo que viene vacío. */
function tablaCorreo(pares) {
  var filas = pares.filter(function (p) {
    return p[1] !== undefined && p[1] !== null && String(p[1]).trim() !== "";
  }).map(function (p) {
    return '<tr><td style="padding:9px 14px;border-bottom:1px solid #e6ecee;color:#5b6b6f;' +
      'font-size:13px;width:42%;vertical-align:top">' + escaparHtml(p[0]) + '</td>' +
      '<td style="padding:9px 14px;border-bottom:1px solid #e6ecee;font-size:14px;' +
      'color:#16282c">' + escaparHtml(p[1]) + '</td></tr>';
  });
  if (!filas.length) return "";
  return '<table style="width:100%;border-collapse:collapse;background:#fff">' +
    filas.join("") + '</table>';
}

function seccionCorreo(titulo, pares) {
  var tabla = tablaCorreo(pares);
  if (!tabla) return "";
  return '<div style="padding:20px 14px 6px;font-size:12px;letter-spacing:.1em;' +
    'color:#5b6b6f;background:#fff">' + escaparHtml(titulo).toUpperCase() + '</div>' + tabla;
}

function listaCorreo(titulo, texto) {
  var t = String(texto || "").trim();
  if (!t) return "";
  var puntos = t.split("|").map(function (s) { return s.trim(); }).filter(String);
  if (!puntos.length) return "";
  return '<div style="padding:20px 14px 6px;font-size:12px;letter-spacing:.1em;' +
    'color:#5b6b6f;background:#fff">' + escaparHtml(titulo).toUpperCase() + '</div>' +
    '<ul style="margin:0;padding:0 14px 14px 32px;background:#fff;font-size:14px;line-height:1.6">' +
    puntos.map(function (p) { return '<li>' + escaparHtml(p) + '</li>'; }).join("") + '</ul>';
}

/** Le manda a la persona su página del caso, para que no la pierda. */
function correoALaPersona(datos) {
  var correo = String(datos.correo || "").trim();
  if (!correo || correo.indexOf("@") === -1) return;

  var cuerpo =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;' +
    'max-width:560px;margin:0 auto;color:#16282c">' +
    '<h2 style="font-size:20px;margin:0 0 12px">Tu caso quedó registrado</h2>' +
    '<p style="font-size:15px;line-height:1.6;margin:0 0 16px">' +
      escaparHtml(String(datos.nombre).split(" ")[0]) + ', guarda este correo. ' +
      'Desde el link de abajo puedes seguir tu trámite, pagar y llenar tu formulario ' +
      'cuando quieras. No hace falta que le escribas a nadie para avanzar.</p>' +
    '<p style="margin:0 0 6px;font-size:13px;color:#5b6b6f">Tu código</p>' +
    '<p style="margin:0 0 18px;font-size:24px;font-weight:700;letter-spacing:.08em">' +
      escaparHtml(datos.codigo) + '</p>' +
    '<p style="margin:0 0 22px"><a href="' + escaparHtml(datos.link_caso) + '" ' +
      'style="display:inline-block;background:#0b6478;color:#fff;text-decoration:none;' +
      'padding:14px 22px;border-radius:9px;font-weight:600;font-size:16px">Abrir mi caso</a></p>' +
    '<p style="font-size:13px;color:#5b6b6f;line-height:1.6;margin:0">' +
      'MiVisa EC · David Ubilluz · Quito, Ecuador<br>' +
      'Si tienes dudas, responde a este correo.</p>' +
    '</div>';

  MailApp.sendEmail({
    to: correo,
    subject: "Tu caso en MiVisa EC · código " + datos.codigo,
    htmlBody: cuerpo,
    name: "MiVisa EC",
    replyTo: CORREO_DAVID
  });
}

/**
 * Aviso a David de que alguien declaró su pago desde la página.
 * Es lo que reemplaza al "David, ya te transferí" perdido entre
 * mensajes: llega con el código, el valor y el link de la fila.
 */
function avisarPagoDeclarado(fila, codigo) {
  var srv = servicio({ destino: fila.valor("destino"), aplico_antes: fila.valor("aplico_antes") });
  var valores = {
    "usa-primera": 65, "usa-renovacion": 55,
    "canada-primera": 95, "canada-renovacion": 75, "schengen": 155
  };
  var valor = valores[srv] ? "$" + valores[srv] : "por confirmar";

  var cuerpo =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;' +
    'max-width:560px;margin:0 auto;color:#16282c">' +
    '<h2 style="font-size:20px;margin:0 0 12px">' + escaparHtml(fila.valor("nombre")) + ' dice que ya pagó</h2>' +
    tablaCorreo([
      ["Código", codigo],
      ["Destino", fila.valor("destino")],
      ["Valor esperado", valor],
      ["WhatsApp", fila.valor("telefono")],
      ["Correo", fila.valor("correo")]
    ]) +
    '<div style="padding:16px 14px;background:#fbf2e0;border-radius:10px;margin-top:14px;' +
    'font-size:14px;line-height:1.6">' +
      'Debería haberte llegado el comprobante por WhatsApp, y el cobro ' +
      'debería estar en tu panel de PayPhone o en tu cuenta del Pichincha. ' +
      'Cuando lo compruebes, escribe cualquier cosa en la columna <b>Pagado</b> ' +
      'de su fila: es tu registro de que este caso ya se puede trabajar. ' +
      'Ella no está esperando permiso de nadie — el formulario lo tiene abierto.' +
    '</div>' +
    '<p style="margin:16px 0 0;font-size:14px">' +
      '<a href="' + SITIO + '/caso/?c=' + escaparHtml(codigo) + '" style="color:#0b6478">Ver su página</a></p>' +
    '</div>';

  MailApp.sendEmail({
    to: CORREO_DAVID,
    subject: "Pago declarado · " + escaparHtml(fila.valor("nombre")) + " · " + codigo,
    htmlBody: cuerpo,
    name: "MiVisa EC",
    replyTo: String(fila.valor("correo") || CORREO_DAVID)
  });
}

/** Le manda a David el expediente listo, con el archivo adjunto. */
function avisarExpediente(codigo, datos, archivo, urlDoc) {
  var adjuntos = [];
  if (archivo) {
    try { adjuntos.push(exportarXlsx(archivo, "Expediente " + codigo)); } catch (err) { /* va sin adjunto */ }
  }

  var faltan = (datos.documentos || []).filter(function (d) {
    return d.estado === "No lo tengo" || d.estado === "En trámite";
  });

  var cuerpo =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;' +
    'max-width:620px;margin:0 auto;color:#16282c">' +
    '<div style="background:#0b6478;color:#fff;padding:18px 20px;border-radius:10px 10px 0 0">' +
      '<div style="font-size:12px;letter-spacing:.12em;opacity:.85">EXPEDIENTE COMPLETO</div>' +
      '<div style="font-size:22px;font-weight:700;margin-top:4px">' +
        escaparHtml(datos.titular || codigo) + '</div>' +
      '<div style="font-size:14px;opacity:.9;margin-top:2px">' +
        escaparHtml(datos.destinoNombre || "") + ' · ' + datos.personas.length +
        (datos.personas.length === 1 ? " solicitante" : " solicitantes") +
        ' · código ' + escaparHtml(codigo) + '</div>' +
    '</div>' +
    '<div style="padding:18px 16px;background:#fff">' +
      '<p style="margin:0 0 14px;font-size:15px;line-height:1.6">' +
        'Va adjunto el archivo de Excel con una pestaña por persona, en el mismo ' +
        'orden de siempre, listo para copiar y pegar.</p>' +
      (urlDoc && urlDoc.indexOf("ERROR") !== 0
        ? '<p style="margin:0 0 8px;font-size:14px"><a href="' + escaparHtml(urlDoc) +
          '" style="color:#0b6478">Abrirlo en Drive</a></p>'
        : '<p style="margin:0 0 8px;font-size:13px;color:#a63232">No se pudo crear el archivo en Drive. ' +
          'Las respuestas están en la pestaña del destino, en la hoja de cálculo.</p>') +
    '</div>' +
    (faltan.length
      ? '<div style="padding:14px 16px;background:#fbf2e0;font-size:14px;line-height:1.6">' +
        '<b>Documentos que todavía le faltan:</b><br>' +
        faltan.map(function (d) { return escaparHtml(d.nombre) + " — " + escaparHtml(d.estado.toLowerCase()); }).join("<br>") +
        '</div>'
      : '<div style="padding:14px 16px;background:#e8f2ec;font-size:14px">' +
        'Marcó que tiene todos los documentos.</div>') +
    '<div style="padding:16px;background:#f4f8f9;border-radius:0 0 10px 10px;font-size:13px;color:#5b6b6f">' +
      'Caso ' + escaparHtml(codigo) + ' · ' +
      '<a href="' + SITIO + '/caso/?c=' + escaparHtml(codigo) + '" style="color:#0b6478">ver su página</a>' +
    '</div>' +
    '</div>';

  MailApp.sendEmail({
    to: CORREO_DAVID,
    subject: "Expediente listo · " + (datos.destinoNombre || "") + " · " + codigo,
    htmlBody: cuerpo,
    name: "MiVisa EC",
    attachments: adjuntos
  });
}

/**
 * Exporta una hoja de cálculo de Google como .xlsx de verdad, para que
 * David lo abra en Excel igual que sus archivos de siempre.
 */
function exportarXlsx(archivo, nombre) {
  var url = "https://docs.google.com/spreadsheets/d/" + archivo.getId() + "/export?format=xlsx";
  var respuesta = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  });
  if (respuesta.getResponseCode() !== 200) throw new Error("Export " + respuesta.getResponseCode());
  return respuesta.getBlob().setName(nombre + ".xlsx");
}

/* ============================================================
   DISPARADOR: David marca el pago
   ============================================================

   Cuando David escribe cualquier cosa en la columna "Pagado" de una
   fila, a esa persona se le abre el expediente en su página y le
   llega un correo avisándole. Ese es el único mensaje que David
   tenía que mandar a mano y que ahora se manda solo.

   Tiene que ser un disparador INSTALABLE (no el onEdit simple),
   porque los simples no tienen permiso para enviar correo. Se
   instala ejecutando `instalarDisparadores` una vez desde el editor.
   ------------------------------------------------------------ */

function instalarDisparadores() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "alEditar") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("alEditar").forSpreadsheet(libro).onEdit().create();
  return "Disparador instalado. Ya se avisa sola cuando marques Pagado.";
}

function alEditar(e) {
  try {
    if (!e || !e.range) return;
    var hoja = e.range.getSheet();
    if (hoja.getIndex() !== 1) return;          // solo la hoja de casos
    if (e.range.getRow() < 2) return;           // no los encabezados

    var indice = columnasDeLaHoja(hoja);
    if (!indice.pagado || e.range.getColumn() !== indice.pagado) return;
    if (String(e.value || "").trim() === "") return;    // se borró, no se avisa
    if (String(e.oldValue || "").trim() !== "") return; // ya estaba marcado

    var ancho = hoja.getLastColumn();
    var valores = hoja.getRange(e.range.getRow(), 1, 1, ancho).getValues()[0];
    function val(clave) {
      var pos = indice[clave];
      return pos ? String(valores[pos - 1] || "") : "";
    }

    var correo = val("correo").trim();
    if (!correo || correo.indexOf("@") === -1) return;

    var codigo = val("codigo");
    var cuerpo =
      '<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;' +
      'max-width:560px;margin:0 auto;color:#16282c">' +
      '<h2 style="font-size:20px;margin:0 0 12px">Pago confirmado</h2>' +
      '<p style="font-size:15px;line-height:1.6;margin:0 0 18px">' +
        escaparHtml(val("nombre").split(" ")[0]) + ', David verificó tu pago y ya ' +
        'está trabajando tu caso. Si todavía no terminaste tu formulario detallado, ' +
        'ese es el dato que le falta para avanzar: puedes llenarlo por partes, ' +
        'se guarda solo.</p>' +
      '<p style="margin:0 0 22px"><a href="' + SITIO + '/caso/?c=' + escaparHtml(codigo) + '" ' +
        'style="display:inline-block;background:#0b6478;color:#fff;text-decoration:none;' +
        'padding:14px 22px;border-radius:9px;font-weight:600;font-size:16px">Llenar mi formulario</a></p>' +
      '<p style="font-size:13px;color:#5b6b6f;line-height:1.6;margin:0">' +
        'Tu código es <b>' + escaparHtml(codigo) + '</b>.<br>' +
        'MiVisa EC · David Ubilluz · Quito, Ecuador</p>' +
      '</div>';

    MailApp.sendEmail({
      to: correo,
      subject: "Pago confirmado · David ya está en tu caso · " + codigo,
      htmlBody: cuerpo,
      name: "MiVisa EC",
      replyTo: CORREO_DAVID
    });
  } catch (err) { /* nunca romper la edición de la hoja */ }
}

/* ============================================================
   UTILIDADES
   ============================================================ */

function escaparHtml(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
